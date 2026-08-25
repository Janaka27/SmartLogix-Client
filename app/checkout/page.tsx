"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CameraIcon,
  CashIcon,
  CheckCircleIcon,
  CoffeeIcon,
  CreditCardIcon,
  DroneIcon,
  EarbudsIcon,
  HeadphonesIcon,
  LocationCrosshairIcon,
  MapPinIcon,
  PhoneStandIcon,
  PurifierIcon,
} from "../icons";
import { CHECKOUT_STEPS, Stepper } from "../components/Stepper";

type IconKey = "phone" | "headphones" | "camera" | "earbuds" | "purifier" | "coffee";
type PaymentMethod = "card" | "cod";
type RangeStatus = "unchecked" | "checking" | "in-range" | "out-of-range";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  icon: IconKey;
}

const ITEM_ICONS: Record<IconKey, (props: { className?: string }) => React.JSX.Element> = {
  phone: PhoneStandIcon,
  headphones: HeadphonesIcon,
  camera: CameraIcon,
  earbuds: EarbudsIcon,
  purifier: PurifierIcon,
  coffee: CoffeeIcon,
};

const ORDER_ITEMS: OrderItem[] = [
  { id: "p1", name: "Phone Stand Sakti", quantity: 1, price: 29.9, icon: "phone" },
  { id: "p2", name: "Headsound Pro", quantity: 2, price: 12.0, icon: "headphones" },
  { id: "p4", name: "CCTV Maling", quantity: 1, price: 50.0, icon: "camera" },
  { id: "p8", name: "Aer Purifier X1", quantity: 1, price: 79.0, icon: "purifier" },
];

const DELIVERY_FEE = 4.99;
const HEAVY_SURCHARGE = 6.0;

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
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
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

  const updateField = (key: keyof typeof address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((prev) => ({ ...prev, [key]: e.target.value }));

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

  const subtotal = ORDER_ITEMS.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = DELIVERY_FEE + HEAVY_SURCHARGE;
  const total = subtotal + deliveryFee;
  const itemCount = ORDER_ITEMS.reduce((n, i) => n + i.quantity, 0);

  const canPlaceOrder =
    address.fullName && address.phone && address.line1 && address.city && rangeStatus === "in-range";

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
                <button
                  onClick={handleDetectLocation}
                  disabled={rangeStatus === "checking"}
                  className="shrink-0 rounded-full border border-border bg-white px-4 py-2 text-xs font-medium text-black transition-colors hover:bg-surface disabled:opacity-50"
                >
                  {rangeStatus === "checking" ? "Locating…" : "Use my current location"}
                </button>
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

              {payment === "card" && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Card number" placeholder="4242 4242 4242 4242" className="sm:col-span-2" />
                  <Field label="Expiry" placeholder="MM/YY" />
                  <Field label="CVV" placeholder="123" />
                </div>
              )}
            </SectionCard>
          </div>

          <aside className="w-full shrink-0 rounded-2xl border border-border bg-white p-6 shadow-sm lg:sticky lg:top-6 lg:w-80">
            <h2 className="text-base font-semibold text-black">Order Summary</h2>
            <p className="mt-0.5 text-xs text-muted">{itemCount} item(s)</p>

            <div className="mt-4 flex flex-col gap-3 border-b border-border pb-4">
              {ORDER_ITEMS.map((item) => {
                const Icon = ITEM_ICONS[item.icon];
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
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between text-slate">
                <span>Subtotal</span>
                <span className="text-black">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate">
                <span>Delivery fee</span>
                <span className="text-black">${deliveryFee.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-base font-semibold text-black">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <button
              disabled={!canPlaceOrder}
              className="mt-5 w-full rounded-full bg-black py-3 text-sm font-medium text-white transition-colors hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-40"
            >
              Place Order
            </button>
            {!canPlaceOrder && (
              <p className="mt-2 text-center text-[11px] text-muted">
                Fill in your address and confirm your location to continue.
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
