"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthService } from "@/server/services/auth.service";
import { OrderService, type OrderSummary } from "@/server/services/order.service";
import { Navbar } from "@/components/Navbar";
import { formatLKR } from "@/lib/currency";
import { formatDate } from "@/lib/format";
import { BoxIcon, ChevronRightIcon } from "@/components/icons";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  allocated: "Drone allocated",
  in_flight: "In flight",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-surface text-slate",
  processing: "bg-surface text-slate",
  allocated: "bg-charcoal/10 text-charcoal",
  in_flight: "bg-charcoal text-white",
  delivered: "bg-primary/10 text-primary",
  cancelled: "bg-black/5 text-muted",
  rejected: "bg-black/5 text-muted",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        STATUS_STYLES[status] ?? "bg-surface text-slate"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

interface StoredCartItem {
  quantity: number;
}

function getStoredCartCount() {
  const storedItems = window.localStorage.getItem("smartlogix-cart");
  if (!storedItems) return 0;

  try {
    const items = JSON.parse(storedItems) as StoredCartItem[];
    return items.reduce((count, item) => count + Math.max(0, item.quantity || 0), 0);
  } catch {
    return 0;
  }
}

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    AuthService.getSession().then((session) => setIsLoggedIn(!!session));

    const {
      data: { subscription },
    } = AuthService.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (!session) router.push("/");
    });

    return () => subscription.unsubscribe();
  }, [router]);

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

  useEffect(() => {
    AuthService.getUser().then(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);

      try {
        const data = await OrderService.getByBuyer(user.id);
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load your orders.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const handleLogout = async () => {
    await AuthService.logout();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-section">
        <p className="text-sm text-muted">Loading your orders…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-section px-4 text-center">
        <h1 className="text-xl font-semibold text-black">Sign in to see your orders</h1>
        <div className="flex gap-3">
          <Link
            href="/login?redirect=%2Forders"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Sign In
          </Link>
          <Link
            href="/"
            className="rounded-full border border-border bg-white px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-surface"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-section">
      <Navbar
        isLoggedIn={isLoggedIn}
        onSignIn={() => router.push("/login?redirect=%2Forders")}
        onSignUp={() => router.push("/signup?redirect=%2Forders")}
        onLogout={handleLogout}
        cartCount={cartCount}
      />

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold text-black">My Orders</h1>
        <p className="mt-1 text-sm text-muted">Track any order that&apos;s currently on its way.</p>

        {error && (
          <p className="mt-6 rounded-lg border border-border bg-surface p-3 text-sm font-medium text-black">
            {error}
          </p>
        )}

        {!error && orders.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-muted">
              <BoxIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-black">No orders yet</p>
              <p className="mt-1 text-sm text-muted">Once you place an order, it&apos;ll show up here.</p>
            </div>
            <Link
              href="/#shop"
              className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {!error && orders.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/track-order?order=${order.id}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 transition-colors hover:bg-surface sm:p-5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-slate">
                  <BoxIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-semibold text-black">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">
                    {order.itemCount} item{order.itemCount === 1 ? "" : "s"} · {formatDate(order.createdAt)}
                    {order.deliveryCity ? ` · ${order.deliveryCity}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="text-sm font-semibold text-black">{formatLKR(order.totalAmount)}</p>
                  <ChevronRightIcon className="h-4 w-4 text-muted" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
