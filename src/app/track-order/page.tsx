"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AuthService } from "@/server/services/auth.service";
import { TrackingService, type TrackingData } from "@/server/services/tracking.service";
import { Navbar } from "@/components/Navbar";
import { interpolatePosition, bearingDegrees } from "@/lib/geo";
import { formatDateTime, formatDistance, formatDuration } from "@/lib/format";
import {
  BoxIcon,
  CheckCircleIcon,
  DroneIcon,
  MapPinIcon,
  SearchIcon,
  ZapIcon,
} from "@/components/icons";

const TrackingMap = dynamic(() => import("./TrackingMap"), { ssr: false });

const POLL_INTERVAL_MS = 15_000;
const TICK_INTERVAL_MS = 1_000;
const MIN_FLIGHT_MS = 60_000; // floor so very short demo distances don't look instant
const BATTERY_DRAIN_PCT = 18; // cosmetic — visual depletion over a full simulated flight
const MIN_BATTERY_DISPLAY_PCT = 5;

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

function flightStartKey(orderId: string) {
  return `smartlogix-flight-start-${orderId}`;
}

// Real assignment.departedAt wins when set; otherwise this browser
// synthesizes a start time the first time it opens this order's tracking
// page, and remembers it — so a refresh doesn't restart the flight.
function getFlightStartMs(orderId: string, departedAt: string | null): number {
  if (departedAt) return new Date(departedAt).getTime();

  const key = flightStartKey(orderId);
  const stored = window.localStorage.getItem(key);
  if (stored) {
    const parsed = Number(stored);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const now = Date.now();
  window.localStorage.setItem(key, String(now));
  return now;
}

interface FlightState {
  progress: number;
  position: { lat: number; lng: number };
  heading: number;
  batteryPct: number;
  remainingMinutes: number;
  totalFlightMinutes: number;
}

function computeFlightState(tracking: TrackingData, flightStartMs: number, now: number): FlightState | null {
  if (!tracking.drone) return null;

  const origin = { lat: tracking.warehouse.latitude, lng: tracking.warehouse.longitude };
  const destination = { lat: tracking.order.deliveryLat, lng: tracking.order.deliveryLng };
  const totalFlightMs = Math.max(
    MIN_FLIGHT_MS,
    (tracking.distanceKm / tracking.drone.speedKmh) * 3_600_000,
  );
  const elapsedMs = now - flightStartMs;
  const progress = Math.min(1, Math.max(0, elapsedMs / totalFlightMs));

  return {
    progress,
    position: interpolatePosition(origin, destination, progress),
    heading: bearingDegrees(origin, destination),
    batteryPct: Math.max(
      MIN_BATTERY_DISPLAY_PCT,
      Math.round(tracking.drone.batteryCapacityPct - progress * BATTERY_DRAIN_PCT),
    ),
    remainingMinutes: (totalFlightMs * (1 - progress)) / 60_000,
    totalFlightMinutes: totalFlightMs / 60_000,
  };
}

const STAGES = [
  { title: "Order confirmed", detail: "Your order has been received." },
  { title: "Allocated to drone", detail: "A drone has been assigned at the warehouse." },
  { title: "In flight", detail: "Your drone is on its way." },
  { title: "Delivered", detail: "Arrived at your doorstep." },
];

function stageIndex(tracking: TrackingData, flight: FlightState | null): number {
  if (tracking.order.status === "delivered") return 3;
  if (!tracking.assignment) return 0;
  if (!flight) return 1;
  if (flight.progress >= 1) return 3;
  return 2;
}

function StageTimeline({ tracking, flight }: { tracking: TrackingData; flight: FlightState | null }) {
  const current = stageIndex(tracking, flight);

  return (
    <section className="mt-6 rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-black">Delivery progress</h2>
          <p className="mt-1 text-xs text-muted">We&apos;ll update this as your order moves.</p>
        </div>
        <BoxIcon className="h-5 w-5 text-slate" />
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-4">
        {STAGES.map((stage, index) => (
          <div key={stage.title} className="relative flex gap-3 sm:block">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                index <= current ? "bg-primary text-white" : "bg-surface text-muted"
              }`}
            >
              {index < current ? (
                <CheckCircleIcon className="h-4 w-4" />
              ) : (
                <span className="text-xs font-semibold">{index + 1}</span>
              )}
            </div>
            <div className="sm:mt-3">
              <p className="text-sm font-medium text-black">{stage.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{stage.detail}</p>
            </div>
            {index < STAGES.length - 1 && (
              <span className="absolute left-4 top-8 h-full w-px bg-border sm:left-8 sm:top-4 sm:h-px sm:w-[calc(100%-1rem)]" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function OrderSearchForm() {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed) router.push(`/track-order?order=${encodeURIComponent(trimmed)}`);
      }}
      className="flex w-full max-w-md flex-col gap-2 rounded-2xl bg-white p-2 text-black sm:flex-row sm:items-center sm:rounded-full"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
        <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label="Order ID"
          placeholder="Enter your order ID"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted"
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Track order
      </button>
    </form>
  );
}

function TrackOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    AuthService.getSession().then((session) => setIsLoggedIn(!!session));
    const {
      data: { subscription },
    } = AuthService.onAuthStateChange((_event, session) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
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

  useEffect(() => {
    AuthService.getUser().then((u) => {
      setUser(u);
      setCheckingAuth(false);
    });
  }, []);

  // Fetch + light polling so a seller dispatching the order while this page
  // is open upgrades it from "pending" to the live map automatically.
  useEffect(() => {
    if (!orderId || !user) return;

    let cancelled = false;

    const load = async (showLoading: boolean) => {
      if (showLoading) setLoadingTracking(true);
      try {
        const data = await TrackingService.getByOrderId(orderId);
        if (!cancelled) {
          setTracking(data);
          setTrackingError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setTrackingError(err instanceof Error ? err.message : "Could not find that order.");
          setTracking(null);
        }
      } finally {
        if (!cancelled) setLoadingTracking(false);
      }
    };

    load(true);
    const poll = setInterval(() => load(false), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [orderId, user]);

  // Animation tick for the simulated flight.
  useEffect(() => {
    if (!tracking?.assignment || !tracking.drone) return;
    const tick = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(tick);
  }, [tracking?.assignment, tracking?.drone]);

  const flightStartMs = tracking?.assignment
    ? getFlightStartMs(tracking.order.id, tracking.assignment.departedAt)
    : null;

  const flight =
    tracking && flightStartMs ? computeFlightState(tracking, flightStartMs, now) : null;

  const handleLogout = async () => {
    await AuthService.logout();
  };

  const shellProps = {
    isLoggedIn,
    cartCount,
    onSignIn: () => router.push(`/login?redirect=${encodeURIComponent("/track-order")}`),
    onSignUp: () => router.push(`/signup?redirect=${encodeURIComponent("/track-order")}`),
    onLogout: handleLogout,
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-section">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="bg-section">
      <Navbar {...shellProps} />

      <section className="bg-charcoal text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-xs font-medium uppercase tracking-[.16em] text-white/50">
            Delivery control room
          </p>
          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Track your order</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
                Watch your order move from warehouse to doorstep.
              </p>
            </div>
            <OrderSearchForm />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {!user && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <h2 className="text-lg font-semibold text-black">Sign in to track your order</h2>
            <p className="max-w-sm text-sm text-muted">
              Orders are tied to your account, so we can only show tracking for orders you placed.
            </p>
            <div className="flex gap-3">
              <Link
                href={`/login?redirect=${encodeURIComponent(orderId ? `/track-order?order=${orderId}` : "/track-order")}`}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {user && !orderId && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-muted">
              <SearchIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-black">Enter an order ID above</p>
              <p className="mt-1 text-sm text-muted">Or pick one from your order history.</p>
            </div>
            <Link
              href="/orders"
              className="rounded-full border border-border bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-surface"
            >
              View My Orders
            </Link>
          </div>
        )}

        {user && orderId && loadingTracking && !tracking && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sm text-muted">Looking up order…</p>
          </div>
        )}

        {user && orderId && trackingError && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <p className="text-sm font-medium text-black">{trackingError}</p>
            <Link
              href="/orders"
              className="rounded-full border border-border bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-surface"
            >
              View My Orders
            </Link>
          </div>
        )}

        {user && tracking && (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[.16em] text-muted">
                  Order #{tracking.order.id.slice(0, 8).toUpperCase()}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-black">
                  {tracking.order.status === "cancelled" || tracking.order.status === "rejected"
                    ? "This order was cancelled"
                    : flight && flight.progress >= 1
                      ? "Delivered"
                      : tracking.assignment
                        ? "On its way to you"
                        : "Being processed"}
                </h2>
              </div>
              {tracking.assignment && (
                <div className="flex items-center gap-2 self-start rounded-full bg-charcoal px-3 py-2 text-xs font-medium text-white">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Live tracking
                </div>
              )}
            </div>

            {tracking.assignment && tracking.drone && flight ? (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
                <div className="relative min-h-80 overflow-hidden rounded-2xl bg-surface sm:min-h-96">
                  <TrackingMap
                    origin={{
                      lat: tracking.warehouse.latitude,
                      lng: tracking.warehouse.longitude,
                      label: tracking.warehouse.name,
                    }}
                    destination={{
                      lat: tracking.order.deliveryLat,
                      lng: tracking.order.deliveryLng,
                      label: "Your address",
                    }}
                    dronePosition={flight.position}
                    headingDegrees={flight.heading}
                  />
                </div>
                <aside className="rounded-2xl border border-border bg-white p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted">
                        {flight.progress >= 1 ? "Arrived" : "Time remaining"}
                      </p>
                      <p className="mt-1 text-3xl font-semibold text-black">
                        {flight.progress >= 1 ? "0 min" : formatDuration(flight.remainingMinutes)}
                      </p>
                      <p className="mt-1 text-sm text-slate">
                        {formatDistance(tracking.distanceKm)} · {tracking.drone.speedKmh} km/h
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface">
                      <DroneIcon className="h-5 w-5 text-black" />
                    </div>
                  </div>

                  <div className="mt-6 border-t border-border pt-5">
                    <p className="text-xs text-muted">Battery</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${flight.batteryPct}%` }}
                        />
                      </div>
                      <span className="flex items-center gap-1 text-sm font-medium text-black">
                        <ZapIcon className="h-3.5 w-3.5" />
                        {flight.batteryPct}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-border pt-5">
                    <p className="text-xs text-muted">Delivery destination</p>
                    <p className="mt-1 text-sm font-medium text-black">
                      {tracking.order.deliveryAddress}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                      <MapPinIcon className="h-3.5 w-3.5" /> {tracking.order.deliveryCity ?? "—"}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-border pt-5">
                    <p className="text-xs text-muted">Courier</p>
                    <p className="mt-1 text-sm font-medium text-black">{tracking.drone.droneCode}</p>
                    <p className="mt-1 text-xs text-muted">
                      {tracking.drone.model ? `${tracking.drone.model} · ` : ""}Flying from{" "}
                      {tracking.warehouse.name}
                    </p>
                  </div>
                </aside>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white py-14 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-muted">
                  <BoxIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-black">
                    {tracking.order.status === "cancelled" || tracking.order.status === "rejected"
                      ? "No live tracking for this order."
                      : "Your order is being processed."}
                  </p>
                  {tracking.order.status !== "cancelled" && tracking.order.status !== "rejected" && (
                    <p className="mt-1 max-w-sm text-sm text-muted">
                      Live tracking appears here automatically once a warehouse assigns a drone —
                      this page checks for updates every few seconds.
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted">
                  Placed {formatDateTime(tracking.order.createdAt)}
                </p>
              </div>
            )}

            <StageTimeline tracking={tracking} flight={flight} />
          </>
        )}
      </section>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-section">
          <p className="text-sm text-muted">Loading…</p>
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
