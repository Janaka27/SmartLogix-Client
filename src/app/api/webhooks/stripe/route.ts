import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe signs the raw body — Next.js must not parse it as JSON first, so this route
// reads request.text() rather than request.json().
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata.order_id;

      await admin
        .from("payments")
        .update({ status: "succeeded" })
        .eq("stripe_payment_intent_id", intent.id);

      if (orderId) {
        await admin
          .from("orders")
          .update({ status: "processing" })
          .eq("id", orderId)
          .eq("status", "pending");
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      await admin
        .from("payments")
        .update({ status: "failed" })
        .eq("stripe_payment_intent_id", intent.id);
      break;
    }

    case "payment_intent.canceled": {
      const intent = event.data.object as Stripe.PaymentIntent;
      await admin
        .from("payments")
        .update({ status: "canceled" })
        .eq("stripe_payment_intent_id", intent.id);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
