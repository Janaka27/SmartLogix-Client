"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CameraIcon,
  CartIcon,
  CoffeeIcon,
  DroneIcon,
  EarbudsIcon,
  HeadphonesIcon,
  LockIcon,
  PhoneStandIcon,
  PurifierIcon,
  TagIcon,
  TrashIcon,
} from "@/components/icons";
import { Stepper } from "@/components/checkout/Stepper";

type WeightClass = "Standard" | "Heavy";
type IconKey = "phone" | "headphones" | "camera" | "earbuds" | "purifier" | "coffee";

interface CartItem {
  id: string;
  name: string;
  seller: string;
  price: number;
  quantity: number;
  stock: number;
  weightClass: WeightClass;
  eta: string;
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

function iconKeyForName(name: string): IconKey {
  if (/phone.?stand|phone holder/i.test(name)) return "phone";
  if (/headphone|headset/i.test(name)) return "headphones";
  if (/earbud|tws/i.test(name)) return "earbuds";
  if (/camera|cctv/i.test(name)) return "camera";
  if (/purifier/i.test(name)) return "purifier";
  return "coffee";
}

const DELIVERY_FEE = 4.99;
const HEAVY_SURCHARGE = 6.0;
const FREE_DELIVERY_THRESHOLD = 150;

function QuantityStepper({
  quantity,
  max,
  onChange,
}: {
  quantity: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center rounded-full border border-border bg-white">
      <button
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        aria-label="Decrease quantity"
        className="flex h-8 w-8 items-center justify-center text-slate transition-colors hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent"
      >
        −
      </button>
      <span className="w-7 text-center text-sm font-semibold text-black">{quantity}</span>
      <button
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        aria-label="Increase quantity"
        className="flex h-8 w-8 items-center justify-center text-slate transition-colors hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent"
      >
        +
      </button>
    </div>
  );
}

function CartRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  const Icon = ITEM_ICONS[item.icon] ?? ITEM_ICONS[iconKeyForName(item.name)];
  const lowStock = item.stock <= 5;

  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 transition-all hover:border-charcoal-soft/30 hover:shadow-md sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative flex h-18 w-18 shrink-0 items-center justify-center rounded-xl bg-surface sm:h-20 sm:w-20">
          <Icon className="h-9 w-9 text-slate" />
          {item.weightClass === "Heavy" && (
            <span className="absolute -right-1.5 -top-1.5 rounded-full bg-charcoal px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
              Heavy
            </span>
          )}
        </div>
        <div className="min-w-0 flex flex-col gap-1.5">
          <h3 className="truncate text-sm font-semibold text-black">{item.name}</h3>
          <p className="text-xs text-muted">Sold by {item.seller}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1">
              <DroneIcon className="h-3 w-3" />
              Est. delivery {item.eta}
            </span>
            {lowStock && (
              <span className="font-medium text-charcoal">Only {item.stock} left</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-6">
        <QuantityStepper
          quantity={item.quantity}
          max={item.stock}
          onChange={(next) => onQuantityChange(item.id, next)}
        />
        <p className="w-16 shrink-0 text-right text-sm font-semibold text-black sm:w-20">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
        <button
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-black"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
        <CartIcon className="h-7 w-7 text-slate" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-black">Your cart is empty</h2>
        <p className="mt-1 text-sm text-muted">Add products to see them here.</p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        Continue Shopping
      </Link>
    </div>
  );
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];

    const storedItems = window.localStorage.getItem("smartlogix-cart");
    if (!storedItems) return [];

    try {
      return (JSON.parse(storedItems) as Partial<CartItem>[]).map((item) => ({
        ...item,
        icon: item.icon && item.icon in ITEM_ICONS ? item.icon : iconKeyForName(item.name ?? ""),
      })) as CartItem[];
    } catch {
      window.localStorage.removeItem("smartlogix-cart");
      return [];
    }
  });
  const [promo, setPromo] = useState("");

  useEffect(() => {
    window.localStorage.setItem("smartlogix-cart", JSON.stringify(items));
    window.dispatchEvent(new Event("smartlogix-cart-updated"));
  }, [items]);

  const handleQuantityChange = (id: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const hasHeavyItem = items.some((i) => i.weightClass === "Heavy");
  const surcharge = hasHeavyItem ? HEAVY_SURCHARGE : 0;
  const qualifiesFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryFee = items.length === 0 ? 0 : qualifiesFreeDelivery ? surcharge : DELIVERY_FEE + surcharge;
  const total = subtotal + deliveryFee;
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const slowestEta = items.reduce((max, i) => {
    const minutes = parseInt(i.eta, 10);
    return Number.isNaN(minutes) ? max : Math.max(max, minutes);
  }, 0);

  return (
    <div className="bg-section">
      <section className="relative overflow-hidden bg-linear-to-br from-charcoal-soft via-charcoal to-black">
        <DroneIcon className="absolute right-10 top-6 h-8 w-8 text-white/20 sm:right-24" />
        <DroneIcon className="absolute left-8 bottom-4 h-5 w-5 text-white/10 sm:left-20" />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-xs font-medium uppercase tracking-wide text-white/50">
            Step 1 of 4
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Your Cart</h1>
          <p className="mt-1.5 text-sm text-white/60">
            {itemCount > 0
              ? `${itemCount} item(s) ready for drone delivery.`
              : "Nothing here yet — let's fix that."}
          </p>
          <div className="mt-5">
            <Stepper current={0} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex flex-1 flex-col gap-4">
              {!qualifiesFreeDelivery && (
                <div className="rounded-xl bg-charcoal/5 px-4 py-3 text-xs font-medium text-charcoal">
                  Add ${remainingForFreeDelivery.toFixed(2)} more to unlock free delivery.
                </div>
              )}
              {items.map((item) => (
                <CartRow
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            <aside className="w-full shrink-0 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-6 lg:w-80">
              <h2 className="text-base font-semibold text-black">Order Summary</h2>

              <div className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between text-slate">
                  <span>Subtotal</span>
                  <span className="text-black">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate">
                  <span>Delivery fee</span>
                  <span className={qualifiesFreeDelivery && !hasHeavyItem ? "text-charcoal" : "text-black"}>
                    {deliveryFee === 0 ? "Free" : `$${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                {hasHeavyItem && (
                  <p className="text-[11px] text-muted">
                    Includes ${HEAVY_SURCHARGE.toFixed(2)} heavy-item surcharge.
                  </p>
                )}
                {slowestEta > 0 && (
                  <p className="flex items-start gap-1.5 text-[11px] text-muted">
                    <DroneIcon className="mt-0.5 h-3 w-3 shrink-0" />
                    Estimated arrival within {slowestEta} min of dispatch, from the nearest
                    in-stock warehouse.
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-section pl-3.5 pr-1.5 py-1.5 focus-within:border-black">
                <TagIcon className="h-4 w-4 shrink-0 text-muted" />
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="Promo code"
                  className="w-full bg-transparent text-sm text-black outline-none placeholder:text-muted"
                />
                <button className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover">
                  Apply
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-base font-semibold text-black">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <Link
                href="/checkout"
                className="mt-5 block w-full rounded-full bg-primary py-3 text-center text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Proceed to Checkout
              </Link>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
                <LockIcon className="h-3 w-3" />
                Secure checkout, encrypted end-to-end.
              </p>
              <Link
                href="/"
                className="mt-2 block text-center text-xs font-medium text-muted transition-colors hover:text-black"
              >
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
