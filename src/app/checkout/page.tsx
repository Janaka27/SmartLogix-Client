"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AuthService } from "@/server/services/auth.service";
import { OrderService } from "@/server/services/order.service";
import { ProductService } from "@/server/services/product.service";
import type { ProductIcon } from "@/lib/products";
import { SEED_WAREHOUSE_ID } from "@/lib/mock-data/seed-products";
import { BoxIcon } from "@/components/icons";
import {
  CashIcon,
  CheckCircleIcon,
  CreditCardIcon,
  DroneIcon,
  LocationCrosshairIcon,
  MapPinIcon,
  ZapIcon,
} from "@/components/icons";
import { CHECKOUT_STEPS, Stepper } from "@/components/checkout/Stepper";
import { CardPaymentForm } from "@/components/checkout/CardPaymentForm";
import { formatLKR } from "@/lib/currency";

type PaymentMethod = "card" | "cod";
type RangeStatus = "unchecked" | "checking" | "in-range" | "out-of-range";

interface StoredCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  weightKg: number;
  volumeCm3: number;
  icon: ProductIcon;
}

const DELIVERY_FEE = 1497;
const HEAVY_SURCHARGE = 1800;
const HEAVY_THRESHOLD_KG = 5;
const URGENT_DELIVERY_FEE = 2997;

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start gap-3 sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal text-white">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-black">{title}</h2>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate">
      {label}
      <input
        {...props}
        className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-black outline-none transition-colors placeholder:text-muted focus:border-black"
      />
    </label>
  );
}

export default function CheckoutPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    city: "",
    postalCode: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [rangeStatus, setRangeStatus] = useState<RangeStatus>("unchecked");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [urgentDelivery, setUrgentDelivery] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);

  useEffect(() => {
    AuthService.getUser().then((user) => {
      setUser(user);
      setCheckingAuth(false);
    });
  }, []);

  useEffect(() => {
    const storedItems = window.localStorage.getItem("smartlogix-cart");
    let cartItems: StoredCartItem[] = [];
    if (storedItems) {
      try {
        cartItems = JSON.parse(storedItems) as StoredCartItem[];
      } catch {
        window.localStorage.removeItem("smartlogix-cart");
      }
    }

    if (cartItems.length === 0) {
      setLoadingCart(false);
      return;
    }

    Promise.all(
      cartItems.map(async (item) => {
        const product = await ProductService.getById(item.id);
        return {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          weightKg: product?.weightKg ?? 0,
          volumeCm3: product ? product.lengthCm * product.widthCm * product.heightCm : 0,
          icon: product?.icon ?? BoxIcon,
        };
      }),
    ).then((items) => {
      setOrderItems(items);
      setLoadingCart(false);
    });
  }, []);

  const updateField = (key: keyof typeof address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((prev) => ({ ...prev, [key]: e.target.value }));

  const clearCart = () => {
    window.localStorage.removeItem("smartlogix-cart");
    window.dispatchEvent(new Event("smartlogix-cart-updated"));
  };

  const handleDetectLocation = () => {
    setRangeStatus("checking");
    if (!("geolocation" in navigator)) {
      setCoords({ lat: 6.9271, lng: 79.8612 });
      setRangeStatus("in-range");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setRangeStatus("in-range");
      },
      () => {
        setCoords({ lat: 6.9271, lng: 79.8612 });
        setRangeStatus("in-range");
      },
      { timeout: 5000 },
    );
  };

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const hasHeavyItem = orderItems.some((i) => i.weightKg > HEAVY_THRESHOLD_KG);
  const deliveryFee = DELIVERY_FEE + (hasHeavyItem ? HEAVY_SURCHARGE : 0);
  const urgentFee = urgentDelivery ? URGENT_DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee + urgentFee;
  const itemCount = orderItems.reduce((n, i) => n + i.quantity, 0);
  const totalWeightKg = orderItems.reduce((sum, i) => sum + i.weightKg * i.quantity, 0);
  const totalVolumeCm3 = orderItems.reduce((sum, i) => sum + i.volumeCm3 * i.quantity, 0);

  const canPlaceOrder = Boolean(
    user &&
      orderItems.length > 0 &&
      address.fullName &&
      address.phone &&
      address.line1 &&
      address.city &&
      rangeStatus === "in-range" &&
      coords,
  );

  const handlePlaceOrder = async () => {
    if (!canPlaceOrder || !user || !coords) return;
    setPlacingOrder(true);
    setOrderError(null);

    try {
      const order = await OrderService.placeOrder({
        buyerId: user.id,
        warehouseId: SEED_WAREHOUSE_ID,
        deliveryLat: coords.lat,
        deliveryLng: coords.lng,
        deliveryAddress: address.line1,
        deliveryCity: address.city,
        deliveryPostalCode: address.postalCode || null,
        totalWeightKg,
        totalVolumeCm3,
        totalAmount: total,
        isUrgent: urgentDelivery,
        urgentFee,
        items: orderItems,
      });

      if (payment === "cod") {
        clearCart();
        setPlacedOrderId(order.id);
        return;
      }

      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start payment.");

      setPendingOrderId(order.id);
      setClientSecret(data.clientSecret);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err && typeof err.message === "string"
          ? err.message
          : "Could not place your order. Please try again.";
      setOrderError(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (checkingAuth || loadingCart) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-section">
        <p className="text-sm text-muted">Loading checkout…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-section px-4 text-center">
        <h1 className="text-xl font-semibold text-black">Sign in to check out</h1>
        <p className="max-w-sm text-sm text-muted">
          You need an account so we can tie this order — and its live tracking — to you.
        </p>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-border bg-white px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-surface"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  if (orderItems.length === 0 && !placedOrderId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-section px-4 text-center">
        <h1 className="text-xl font-semibold text-black">Your cart is empty</h1>
        <p className="max-w-sm text-sm text-muted">Add products to your cart before checking out.</p>
        <Link
          href="/"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (placedOrderId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-section px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-charcoal/5">
          <CheckCircleIcon className="h-8 w-8 text-charcoal" />
        </div>
        <h1 className="text-xl font-semibold text-black">Order placed!</h1>
        <p className="max-w-sm text-sm text-muted">
          Order #{placedOrderId.slice(0, 8)} is confirmed — we&apos;ll allocate it to a drone from
          the nearest warehouse and keep you posted.
        </p>
        <Link
          href="/"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-section">
      <section className="relative overflow-hidden bg-linear-to-br from-charcoal-soft via-charcoal to-black">
        <DroneIcon className="absolute right-10 top-6 h-8 w-8 text-white/20 sm:right-24" />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-xs font-medium uppercase tracking-wide text-white/50">
            Step {CHECKOUT_STEPS.indexOf("Delivery") + 1} of {CHECKOUT_STEPS.length}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Checkout</h1>
          <div className="mt-5">
            <Stepper current={1} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex flex-1 flex-col gap-6">
            <SectionCard
              icon={<MapPinIcon className="h-5 w-5" />}
              title="Delivery Address"
              subtitle="Your coordinates are used to route the nearest in-stock warehouse and confirm drone range."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Full name"
                  placeholder="Jane Perera"
                  value={address.fullName}
                  onChange={updateField("fullName")}
                />
                <Field
                  label="Phone number"
                  placeholder="+94 71 234 5678"
                  value={address.phone}
                  onChange={updateField("phone")}
                />
                <Field
                  label="Address line"
                  placeholder="12 Lotus Avenue"
                  value={address.line1}
                  onChange={updateField("line1")}
                  className="sm:col-span-2"
                />
                <Field
                  label="City"
                  placeholder="Colombo"
                  value={address.city}
                  onChange={updateField("city")}
                />
                <Field
                  label="Postal code"
                  placeholder="00300"
                  value={address.postalCode}
                  onChange={updateField("postalCode")}
                />
              </div>

              <div className="mt-5 flex flex-col gap-3 rounded-xl border border-dashed border-border bg-section p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
                    <LocationCrosshairIcon className="h-4 w-4 text-slate" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">
                      {coords
                        ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                        : "Coordinates not set"}
                    </p>
                    <p className="text-xs text-muted">Required to verify drone-range coverage.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDetectLocation}
                    disabled={rangeStatus === "checking"}
                    className="shrink-0 rounded-full border border-border bg-white px-4 py-2 text-xs font-medium text-black transition-colors hover:bg-surface disabled:opacity-50"
                  >
                    {rangeStatus === "checking" ? "Locating…" : "Use my current location"}
                  </button>
                  <Link
                    href="/map?fromCheckout=true"
                    className="shrink-0 rounded-full border border-border bg-white px-4 py-2 text-xs font-medium text-black transition-colors hover:bg-surface"
                  >
                    Find nearest warehouse
                  </Link>
                </div>
              </div>

              {rangeStatus === "in-range" && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-charcoal/5 px-4 py-3 text-sm font-medium text-charcoal">
                  <CheckCircleIcon className="h-4 w-4 shrink-0" />
                  Within drone delivery range — dispatched from the nearest warehouse.
                </div>
              )}
              {rangeStatus === "out-of-range" && (
                <div className="mt-3 rounded-xl bg-black/5 px-4 py-3 text-sm font-medium text-black">
                  Outside drone range for this address. Standard courier delivery will be offered
                  instead.
                </div>
              )}

              <button
                type="button"
                onClick={() => setUrgentDelivery((prev) => !prev)}
                className={`mt-3 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                  urgentDelivery ? "border-black bg-surface" : "border-border hover:bg-surface"
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-charcoal text-white">
                  <ZapIcon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black">Urgent delivery</p>
                  <p className="text-xs text-muted">
                    Jump the queue for priority drone dispatch — get it faster.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold text-black">
                    +{formatLKR(URGENT_DELIVERY_FEE)}
                  </span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      urgentDelivery ? "border-black bg-black text-white" : "border-border bg-white"
                    }`}
                  >
                    {urgentDelivery && <CheckCircleIcon className="h-3.5 w-3.5" />}
                  </span>
                </div>
              </button>
            </SectionCard>

            <SectionCard
              icon={<CreditCardIcon className="h-5 w-5" />}
              title="Payment Method"
              subtitle="Choose how you'd like to pay for this order."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setPayment("card")}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    payment === "card" ? "border-black bg-surface" : "border-border hover:bg-surface"
                  }`}
                >
                  <CreditCardIcon className="h-5 w-5 text-black" />
                  <div>
                    <p className="text-sm font-medium text-black">Credit / Debit Card</p>
                    <p className="text-xs text-muted">Visa, Mastercard, Amex</p>
                  </div>
                </button>
                <button
                  onClick={() => setPayment("cod")}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    payment === "cod" ? "border-black bg-surface" : "border-border hover:bg-surface"
                  }`}
                >
                  <CashIcon className="h-5 w-5 text-black" />
                  <div>
                    <p className="text-sm font-medium text-black">Cash on Delivery</p>
                    <p className="text-xs text-muted">Pay the drone courier on arrival</p>
                  </div>
                </button>
              </div>

              {payment === "card" && clientSecret && pendingOrderId && (
                <CardPaymentForm
                  clientSecret={clientSecret}
                  onPaid={() => {
                    clearCart();
                    setPlacedOrderId(pendingOrderId);
                  }}
                />
              )}
            </SectionCard>
          </div>

          <aside className="w-full shrink-0 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-6 lg:w-80">
            <h2 className="text-base font-semibold text-black">Order Summary</h2>
            <p className="mt-0.5 text-xs text-muted">{itemCount} item(s)</p>

            <div className="mt-4 flex flex-col gap-3 border-b border-border pb-4">
              {orderItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface">
                      <Icon className="h-5 w-5 text-slate" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-black">{item.name}</p>
                      <p className="text-[11px] text-muted">Qty {item.quantity}</p>
                    </div>
                    <p className="shrink-0 text-xs font-semibold text-black">
                      {formatLKR(item.price * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between text-slate">
                <span>Subtotal</span>
                <span className="text-black">{formatLKR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate">
                <span>Delivery fee</span>
                <span className="text-black">{formatLKR(deliveryFee)}</span>
              </div>
              {urgentDelivery && (
                <div className="flex items-center justify-between text-slate">
                  <span>Urgent delivery</span>
                  <span className="text-black">{formatLKR(urgentFee)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-base font-semibold text-black">
              <span>Total</span>
              <span>{formatLKR(total)}</span>
            </div>

            {orderError && (
              <p className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs font-medium text-black">
                {orderError}
              </p>
            )}
            {!(payment === "card" && clientSecret) && (
              <>
                <button
                  onClick={handlePlaceOrder}
                  disabled={!canPlaceOrder || placingOrder}
                  className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {placingOrder
                    ? "Placing order…"
                    : payment === "card"
                      ? "Continue to Payment"
                      : "Place Order"}
                </button>
                {!canPlaceOrder && (
                  <p className="mt-2 text-center text-[11px] text-muted">
                    Fill in your address and confirm your location to continue.
                  </p>
                )}
              </>
            )}
            {payment === "card" && clientSecret && (
              <p className="mt-5 text-center text-[11px] text-muted">
                Enter your card details above to complete payment.
              </p>
            )}
            <Link
              href="/cart"
              className="mt-3 block text-center text-xs font-medium text-muted transition-colors hover:text-black"
            >
              Back to Cart
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
