"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  BoxIcon,
  CartIcon,
  CheckCircleIcon,
  DroneIcon,
  MapPinIcon,
  SearchIcon,
} from "@/components/icons";

interface StoredCartItem {
  quantity: number;
}

function getStoredCartCount() {
  if (typeof window === "undefined") return 0;
  const storedItems = window.localStorage.getItem("smartlogix-cart");
  if (!storedItems) return 0;

  try {
    const items = JSON.parse(storedItems) as StoredCartItem[];
    return items.reduce((count, item) => count + Math.max(0, item.quantity || 0), 0);
  } catch {
    return 0;
  }
}

const milestones = [
  { title: "Order confirmed", detail: "Your order has been received", time: "10:42 AM", done: true },
  { title: "Allocated to drone", detail: "Packed at Colombo Central warehouse", time: "10:47 AM", done: true },
  { title: "In flight", detail: "Your drone is on its way", time: "Now", done: false },
  { title: "Delivered", detail: "Arriving at your doorstep", time: "Est. 11:05 AM", done: false },
];

function RouteMap() {
  return (
    <div className="relative min-h-80 overflow-hidden rounded-2xl bg-surface sm:min-h-96">
      <iframe
        title="SmartLogix delivery route map"
        src="https://www.openstreetmap.org/export/embed.html?bbox=79.835%2C6.895%2C79.89%2C6.96&layer=mapnik&marker=6.9271%2C79.8612"
        className="absolute inset-0 h-full w-full border-0 grayscale-[.35]"
        loading="lazy"
      />
      <div className="pointer-events-none absolute inset-0 bg-white/10" aria-hidden="true" />
      <div className="absolute left-[12%] top-[63%] flex items-center gap-2 text-xs font-medium text-slate">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"><MapPinIcon className="h-4 w-4" /></span>
        Warehouse
      </div>
      <div className="absolute right-[13%] top-[23%] flex items-center gap-2 text-xs font-medium text-slate">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"><MapPinIcon className="h-4 w-4" /></span>
        Your address
      </div>
      <div className="absolute left-[48%] top-[43%] flex h-12 w-12 -rotate-6 items-center justify-center rounded-full bg-black text-white shadow-xl ring-4 ring-white/70">
        <DroneIcon className="h-6 w-6" />
      </div>
      <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-3 py-2 text-[11px] font-medium text-slate backdrop-blur">
        Live route · updated just now
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("SLX-20481");
  const [trackedOrder, setTrackedOrder] = useState("SLX-20481");
  const [showOrder, setShowOrder] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const syncCartCount = () => setCartCount(getStoredCartCount());
    window.addEventListener("storage", syncCartCount);
    window.addEventListener("smartlogix-cart-updated", syncCartCount);
    syncCartCount();

    return () => {
      window.removeEventListener("storage", syncCartCount);
      window.removeEventListener("smartlogix-cart-updated", syncCartCount);
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (orderId.trim()) {
      setTrackedOrder(orderId.trim().toUpperCase());
      setShowOrder(true);
    }
  };

  return (
    <main className="min-h-screen bg-section">
      <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 shrink-0 items-center">
            <Image
              src="/images/logo.png"
              alt="SmartLogix"
              width={911}
              height={285}
              priority
              className="h-7 w-auto sm:h-9"
            />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate md:flex">
            <Link href="/" className="hover:text-black">Home</Link>
            <Link href="/#shop" className="hover:text-black">Shop</Link>
            <span className="text-black">Track order</span>
            <Link href="/map" className="hover:text-black">Map</Link>
          </nav>
          <Link
            href="/cart"
            aria-label="Open cart"
            className="relative shrink-0 text-slate hover:text-black"
          >
            <CartIcon className="h-5 w-5" />
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
              {cartCount}
            </span>
          </Link>
        </div>
      </header>

      <section className="bg-charcoal text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-xs font-medium uppercase tracking-[.16em] text-white/50">Delivery control room</p>
          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Track your order</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/60">Watch your order move from warehouse to doorstep in real time.</p>
            </div>
            <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-2 rounded-2xl bg-white p-2 text-black sm:flex-row sm:items-center sm:rounded-full">
              <div className="flex min-w-0 flex-1 items-center gap-2 px-2"><SearchIcon className="h-4 w-4 shrink-0 text-muted" /><input value={orderId} onChange={(event) => setOrderId(event.target.value)} aria-label="Order number" placeholder="Enter order number" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted" /></div>
              <button type="submit" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover">Track order</button>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {showOrder && <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-medium uppercase tracking-[.16em] text-muted">Order {trackedOrder}</p><h2 className="mt-1 text-2xl font-semibold text-black">On its way to you</h2></div>
            <div className="flex items-center gap-2 self-start rounded-full bg-charcoal px-3 py-2 text-xs font-medium text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Live tracking</div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
            <RouteMap />
            <aside className="rounded-2xl border border-border bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-muted">Estimated arrival</p><p className="mt-1 text-3xl font-semibold text-black">11:05 AM</p><p className="mt-1 text-sm text-slate">About 18 minutes</p></div><div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface"><DroneIcon className="h-5 w-5 text-black" /></div></div>
              <div className="mt-6 border-t border-border pt-5"><p className="text-xs text-muted">Delivery destination</p><p className="mt-1 text-sm font-medium text-black">42 Galle Road, Colombo 00300</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><MapPinIcon className="h-3.5 w-3.5" /> Within drone delivery range</p></div>
              <div className="mt-6 border-t border-border pt-5"><p className="text-xs text-muted">Courier</p><p className="mt-1 text-sm font-medium text-black">SmartLogix Flight SL-204</p><p className="mt-1 text-xs text-muted">Flying from Colombo Central</p></div>
            </aside>
          </div>
          <section className="mt-6 rounded-2xl border border-border bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-black">Delivery progress</h2><p className="mt-1 text-xs text-muted">We&apos;ll notify you at every step.</p></div><BoxIcon className="h-5 w-5 text-slate" /></div><div className="mt-6 grid gap-5 sm:grid-cols-4">{milestones.map((milestone, index) => <div key={milestone.title} className="relative flex gap-3 sm:block"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${milestone.done || index === 2 ? "bg-primary text-white" : "bg-surface text-muted"}`}>{milestone.done ? <CheckCircleIcon className="h-4 w-4" /> : <span className="text-xs font-semibold">{index + 1}</span>}</div><div className="sm:mt-3"><p className="text-sm font-medium text-black">{milestone.title}</p><p className="mt-1 text-xs leading-5 text-muted">{milestone.detail}</p><p className="mt-1 text-[11px] font-medium text-slate">{milestone.time}</p></div>{index < milestones.length - 1 && <span className="absolute left-4 top-8 h-full w-px bg-border sm:left-8 sm:top-4 sm:h-px sm:w-[calc(100%-1rem)]" />}</div>)}</div></section>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-charcoal p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="text-sm font-medium">Need help with this delivery?</p><p className="mt-1 text-xs text-white/60">Our support team is available if your route changes.</p></div><Link href="#" className="self-start rounded-full bg-white px-4 py-2 text-xs font-medium text-black hover:bg-surface">Contact support</Link></div>
        </>}
      </section>
    </main>
  );
}
