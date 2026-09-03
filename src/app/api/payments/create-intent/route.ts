import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const { orderId } = await request.json();
  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // RLS (orders_select_buyer_seller_admin) already scopes this to the caller's own
  // order, but we check buyer_id explicitly so a mismatch fails loudly instead of
  // silently returning someone else's order.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, buyer_id, status, total_amount")
    .eq("id", orderId)
    .single();

  if (orderError || !order || order.buyer_id !== user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "pending") {
    return NextResponse.json({ error: "This order is no longer payable" }, { status: 409 });
  }

  // payments has no buyer-facing insert policy (it's system-managed), so writes go
  // through the service-role client — order ownership was already checked above.
  const admin = createAdminClient();

  // Reuse an existing intent for this order instead of creating a duplicate charge if
  // the buyer reloads the payment step.
  const { data: existingPayment } = await admin
    .from("payments")
    .select("stripe_payment_intent_id, status")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPayment && existingPayment.status !== "canceled" && existingPayment.status !== "failed") {
    const intent = await stripe.paymentIntents.retrieve(existingPayment.stripe_payment_intent_id);
    if (intent.status !== "canceled" && intent.client_secret) {
      return NextResponse.json({ clientSecret: intent.client_secret });
    }
  }

  // Amount is priced off the persisted order total, never a value the client sends here.
  const amount = Math.round(Number(order.total_amount) * 100);

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: "lkr",
    metadata: { order_id: order.id, buyer_id: user.id },
    automatic_payment_methods: { enabled: true },
  });

  const { error: insertError } = await admin.from("payments").insert({
    order_id: order.id,
    stripe_payment_intent_id: intent.id,
    amount: amount / 100,
    currency: "lkr",
    status: "requires_payment_method",
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ clientSecret: intent.client_secret });
}
