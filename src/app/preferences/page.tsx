"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthService } from "@/server/services/auth.service";
import { ProfileService } from "@/server/services/profile.service";
import { Navbar } from "@/components/Navbar";
import { CameraIcon, ChevronLeftIcon } from "@/components/icons";

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

const EMPTY_PROFILE: ProfileForm = {
  fullName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  postalCode: "",
};

const INITIAL_NOTIFICATIONS: NotificationPrefs = {
  orderUpdates: true,
  promotions: false,
  flightAlerts: true,
};

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

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
          checked ? "bg-primary" : "bg-border"
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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE);
  const [initialProfile, setInitialProfile] = useState<ProfileForm>(EMPTY_PROFILE);
  const [notifications, setNotifications] = useState<NotificationPrefs>(INITIAL_NOTIFICATIONS);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Navbar auth state — separate from `user` below, and reactive to logout
  // (e.g. via the profile menu in the Navbar itself) so we bounce back home
  // instead of showing a stale, no-longer-valid session.
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
      await ProfileService.ensureProfile(user);

      const data = await ProfileService.getMyProfile(user.id);

      const loaded: ProfileForm = {
        ...EMPTY_PROFILE,
        fullName: data?.full_name ?? "",
        email: data?.email ?? user.email ?? "",
        phone: data?.phone ?? "",
      };
      setProfile(loaded);
      setInitialProfile(loaded);
      setAvatarUrl(data?.avatar_url ?? null);
      setLoading(false);
    });
  }, []);

  // Revoke the local preview URL once it's no longer shown.
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const updateField = (key: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((p) => ({ ...p, [key]: e.target.value }));

  const handleAvatarSelected = (file: File | null) => {
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Unsupported image type.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image exceeds the 5MB limit.");
      return;
    }
    setAvatarError(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveError(null);

    try {
      let nextAvatarUrl = avatarUrl;

      if (avatarFile) {
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append("file", avatarFile);
        const response = await fetch("/api/profile/avatar", { method: "POST", body: formData });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || "Failed to upload photo");
        }

        const body = await response.json();
        nextAvatarUrl = body.url as string;
      }

      await ProfileService.updateMyProfile(user.id, {
        ...profile,
        avatarUrl: nextAvatarUrl ?? undefined,
      });

      setAvatarUrl(nextAvatarUrl);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      setSaving(false);
      setUploadingAvatar(false);
      setSaveError(err instanceof Error ? err.message : "Could not save preferences.");
      return;
    }

    setUploadingAvatar(false);
    setSaving(false);
    setInitialProfile(profile);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  };

  const handleDiscard = () => {
    setProfile(initialProfile);
    setNotifications(INITIAL_NOTIFICATIONS);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarError(null);
  };

  const handleLogout = async () => {
    await AuthService.logout();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-section">
        <p className="text-sm text-muted">Loading preferences…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-section px-4 text-center">
        <h1 className="text-xl font-semibold text-black">Sign in to manage preferences</h1>
        <div className="flex gap-3">
          <Link
            href="/login?redirect=%2Fpreferences"
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

  const initials =
    profile.fullName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="flex flex-1 flex-col bg-section">
      <Navbar
        isLoggedIn={isLoggedIn}
        onSignIn={() => router.push("/login?redirect=%2Fpreferences")}
        onSignUp={() => router.push("/signup?redirect=%2Fpreferences")}
        onLogout={handleLogout}
        cartCount={cartCount}
      />

      <form onSubmit={handleSave} className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate hover:text-black"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Shop
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-black">Preferences</h1>
        <p className="mt-1 text-sm text-muted">
          Update your account details and delivery preferences.
        </p>

        <section className="mt-8 rounded-2xl border border-border bg-white p-4 sm:p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface">
              {avatarPreview || avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview ?? avatarUrl ?? undefined}
                  alt="Profile photo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate">
                  {initials}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-surface"
              >
                <CameraIcon className="h-4 w-4" />
                {avatarUrl || avatarPreview ? "Change Photo" : "Upload Photo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_AVATAR_TYPES.join(",")}
                className="hidden"
                onChange={(e) => {
                  handleAvatarSelected(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
              {avatarError && <p className="text-xs text-red-600">{avatarError}</p>}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full Name"
              value={profile.fullName}
              onChange={updateField("fullName")}
            />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-black">Email</span>
              <input
                type="email"
                value={profile.email}
                disabled
                className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-muted outline-none"
              />
              <span className="text-xs text-muted">Contact support to change your login email.</span>
            </label>
            <Field
              label="Phone Number"
              type="tel"
              value={profile.phone}
              onChange={updateField("phone")}
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-black">Default Delivery Address</h2>
          <p className="mt-1 text-xs text-muted">
            Used to check drone range and estimate delivery time at checkout. Not yet saved to
            your account — enter it fresh at checkout for now.
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

        <section className="mt-6 rounded-2xl border border-border bg-white p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-black">Notifications</h2>
          <p className="mt-1 text-xs text-muted">Not yet saved to your account.</p>
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

        {saveError && (
          <p className="mt-6 rounded-lg border border-border bg-surface p-3 text-sm font-medium text-black">
            {saveError}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadingAvatar ? "Uploading photo…" : saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-surface"
          >
            Discard
          </button>
          {savedAt && <span className="text-sm text-muted">Preferences saved.</span>}
        </div>
      </form>
    </div>
  );
}
