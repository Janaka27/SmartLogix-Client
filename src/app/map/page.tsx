"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CartIcon, MapPinIcon } from "@/components/icons";
import { WarehousService } from "@/server/services/warehouse.service";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("./MapComponent"), { ssr: false });

function getStoredCartCount() {
  if (typeof window === "undefined") return 0;
  const storedItems = window.localStorage.getItem("smartlogix-cart");
  if (!storedItems) return 0;

  try {
    const items = JSON.parse(storedItems);
    return items.reduce((count: number, item: any) => count + Math.max(0, item.quantity || 0), 0);
  } catch {
    return 0;
  }
}

export default function MapPage() {
  const [cartCount, setCartCount] = useState(0);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    WarehousService.getAll().then((data) => {
      console.log("warehouses", data);
      setWarehouses(data);
    });
  }, []);

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

  return (
    <main className="flex min-h-screen flex-col bg-section">
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
            <Link href="/track-order" className="hover:text-black">Track order</Link>
            <span className="text-black">Map</span>
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

      <section className="flex-1 relative z-0">
        <DynamicMap warehouses={warehouses} />

        <div className="absolute bottom-6 left-6 rounded-2xl bg-white/90 p-4 text-sm font-medium shadow-xl backdrop-blur pointer-events-none z-[1000]">
          <h2 className="text-base font-bold text-black mb-1">Our Warehouses</h2>
          <p className="text-muted">{warehouses.length} locations across the delivery zone.</p>
        </div>
      </section>
    </main>
  );
}
  