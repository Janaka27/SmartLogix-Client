"use client";

import Link from "next/link";
import { useState } from "react";
import { CameraIcon, ChevronLeftIcon, DroneIcon } from "../icons";

interface ProfileForm {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
}

interface NotificationPrefs {
  orderUpdates: boolean;
  promotions: boolean;
  flightAlerts: boolean;
}

const INITIAL_PROFILE: ProfileForm = {
  fullName: "Ravidu Senevirathne",
  email: "testing@gmail.com",
  phone: "+94 71 234 5678",
  street: "42 Galle Road",
  city: "Colombo",
  postalCode: "00300",
};

const INITIAL_NOTIFICATIONS: NotificationPrefs = {
  orderUpdates: true,
  promotions: false,
  flightAlerts: true,
};

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-black">{label}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-black" : "bg-border"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-black">{label}</span>
      <input
        {...props}
        className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-black outline-none placeholder:text-muted focus:border-slate"
      />
    </label>
  );
}

export default function PreferencesPage() {
  const [profile, setProfile] = useState<ProfileForm>(INITIAL_PROFILE);
  const [notifications, setNotifications] = useState<NotificationPrefs>(INITIAL_NOTIFICATIONS);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const updateField = (key: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((p) => ({ ...p, [key]: e.target.value }));

  const handleSave = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  };

  const handleDiscard = () => {
    setProfile(INITIAL_PROFILE);
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  return (
    <div className="flex flex-1 flex-col bg-section">
      <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <DroneIcon className="h-6 w-6 text-black" />
            <span className="text-lg font-semibold tracking-tight text-black">
              SmartLogix
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-sm font-medium text-slate hover:text-black"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Shop
          </Link>
        </div>
      </header>

      <form onSubmit={handleSave} className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold text-black">Preferences</h1>
        <p className="mt-1 text-sm text-muted">
          Update your account details and delivery preferences.
        </p>

        <section className="mt-8 rounded-2xl border border-border bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
              <span className="text-lg font-semibold text-slate">
                {profile.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-surface"
            >
              <CameraIcon className="h-4 w-4" />
              Change Photo
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full Name"
              value={profile.fullName}
              onChange={updateField("fullName")}
            />
            <Field
              label="Email"
              type="email"
              value={profile.email}
              onChange={updateField("email")}
            />
            <Field
              label="Phone Number"
              type="tel"
              value={profile.phone}
              onChange={updateField("phone")}
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6">
          <h2 className="text-sm font-semibold text-black">Default Delivery Address</h2>
          <p className="mt-1 text-xs text-muted">
            Used to check drone range and estimate delivery time at checkout.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Street Address"
                value={profile.street}
                onChange={updateField("street")}
              />
            </div>
            <Field label="City" value={profile.city} onChange={updateField("city")} />
            <Field
              label="Postal Code"
              value={profile.postalCode}
              onChange={updateField("postalCode")}
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6">
          <h2 className="text-sm font-semibold text-black">Notifications</h2>
          <div className="mt-2 divide-y divide-border">
            <Toggle
              label="Order & delivery updates"
              description="Processing, allocated to drone, in flight, delivered."
              checked={notifications.orderUpdates}
              onChange={(v) => setNotifications((n) => ({ ...n, orderUpdates: v }))}
            />
            <Toggle
              label="Promotions & offers"
              description="Occasional deals from sellers you've ordered from."
              checked={notifications.promotions}
              onChange={(v) => setNotifications((n) => ({ ...n, promotions: v }))}
            />
            <Toggle
              label="Live flight alerts"
              description="Get notified when your drone is close to arrival."
              checked={notifications.flightAlerts}
              onChange={(v) => setNotifications((n) => ({ ...n, flightAlerts: v }))}
            />
          </div>
        </section>

        <div className="mt-8 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-charcoal"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-surface"
          >
            Discard
          </button>
          {savedAt && (
            <span className="text-sm text-muted">Preferences saved.</span>
          )}
        </div>
      </form>
    </div>
  );
}
