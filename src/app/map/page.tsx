"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CartIcon, MapPinIcon, DroneIcon } from "@/components/icons";
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
    <main className="flex h-screen overflow-hidden flex-col bg-section">
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

      <section className="flex-1 min-h-0 relative z-0 flex flex-col md:flex-row">
        {/* Side Panel */}
        <aside className="scrollbar-none [&::-webkit-scrollbar]:hidden w-full shrink-0 border-r border-border bg-white p-5 shadow-sm md:w-72 lg:w-[320px] overflow-y-auto z-10 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
            <h1 className="text-xl font-bold text-black tracking-tight">Find you Nearest Warehouse</h1>
          </div>
          
          <p className="text-sm text-slate leading-relaxed mb-6">
            Click anywhere on the map to set a delivery point, then place the order. The system finds the shortest route through pre-approved drone corridors (gray dashed lines) between warehouses, then adds a final direct leg to your location.
          </p>

          <div className="flex flex-col gap-1.5 mb-5">
            <label htmlFor="source-warehouse" className="text-sm font-bold text-black">Source warehouse</label>
            <select id="source-warehouse" className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary">
              <option>Negombo Depot</option>
              <option>Colombo Central</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 mb-6">
            <span className="text-sm font-bold text-black">Delivery point</span>
            <span className="text-sm text-slate">7.3398, 80.4247</span>
          </div>

          <button className="w-full rounded-lg border border-border bg-white py-2.5 text-sm font-bold text-black transition-colors hover:bg-surface mb-6">
            Reset
          </button>

          <div className="h-px w-full bg-border mb-6" />

          <div className="flex flex-col gap-3 text-sm mb-6">
            <p className="text-slate"><strong className="text-black">Route:</strong> Negombo Depot &rarr; Gampaha Depot &rarr; Kandy Depot &rarr; Delivery point</p>
            <p className="text-slate"><strong className="text-black">Corridor distance:</strong> 91.0 km</p>
            <p className="text-slate"><strong className="text-black">Last-mile leg:</strong> 23.7 km</p>
            <p className="text-slate"><strong className="text-black">Total:</strong> 114.7 km</p>
          </div>

          <div className="h-px w-full bg-border mb-6" />

          <div className="text-xs text-slate">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate shrink-0" /> Warehouse</div>
              <div className="flex items-center gap-1.5"><MapPinIcon className="h-3 w-3 text-red-500" /> Delivery point</div>
              <div className="flex items-center gap-1.5"><DroneIcon className="h-3.5 w-3.5 text-slate" /> Launch point</div>
            </div>
            <p>
              Dashed gray = all pre-defined corridors. Solid orange = active route.
            </p>
          </div>
        </aside>

        {/* Map Area */}
        <div className="flex-1 relative">
          <DynamicMap warehouses={warehouses} />

          <div className="absolute bottom-6 left-6 rounded-2xl bg-white/90 p-4 text-sm font-medium shadow-xl backdrop-blur pointer-events-none z-[1000]">
            <h2 className="text-base font-bold text-black mb-1">Our Warehouses</h2>
            <p className="text-muted">{warehouses.length} locations across the delivery zone.</p>
          </div>
        </div>
      </section>
    </main>
  );
}