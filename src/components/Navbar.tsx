"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CartIcon,
  ChevronDownIcon,
  LogoutIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  XIcon,
} from "@/components/icons";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/#shop" },
  { label: "Track Order", href: "/track-order" },
];

function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={menuRef} className="relative md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-8 w-8 shrink-0 items-center justify-center text-slate hover:text-black"
      >
        {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-border bg-white py-1.5 shadow-lg">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-slate hover:bg-surface hover:text-black"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-1.5 hover:bg-surface"
      >
        <div className="h-8 w-8 rounded-full bg-surface" aria-hidden />
        <ChevronDownIcon
          className={`h-4 w-4 text-slate transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-border bg-white py-1.5 shadow-lg"
        >
          <Link
            href="/preferences"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate hover:bg-surface hover:text-black"
          >
            <SettingsIcon className="h-4 w-4" />
            Preferences
          </Link>
          <div className="my-1 border-t border-border" />
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate hover:bg-surface hover:text-black"
          >
            <LogoutIcon className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar({
  isLoggedIn,
  onSignIn,
  onSignUp,
  onLogout,
  cartCount,
  cartBump = false,
  cartButtonRef: externalCartButtonRef,
}: {
  isLoggedIn: boolean;
  onSignIn: () => void;
  onSignUp: () => void;
  onLogout: () => void;
  cartCount: number;
  cartBump?: boolean;
  cartButtonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const router = useRouter();
  const internalCartButtonRef = useRef<HTMLButtonElement>(null);
  const cartButtonRef = externalCartButtonRef ?? internalCartButtonRef;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <MobileNavMenu />
          <Link href="/" className="shrink-0">
            <Image
              src="/images/logo.png"
              alt="SmartLogix"
              width={911}
              height={285}
              priority
              className="h-7 w-auto shrink-0 sm:h-9 md:h-11"
            />
          </Link>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={link.label === "Home" ? "text-black" : "hover:text-black"}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button aria-label="Search" className="shrink-0 text-slate hover:text-black">
            <SearchIcon className="h-5 w-5" />
          </button>

          <button
            ref={cartButtonRef}
            aria-label="Cart"
            onClick={() => router.push("/cart")}
            className={`relative shrink-0 text-slate hover:text-black ${cartBump ? "animate-cart-bump" : ""}`}
          >
            <CartIcon className="h-5 w-5" />
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
              {cartCount}
            </span>
          </button>

          {isLoggedIn ? (
            <ProfileMenu onLogout={onLogout} />
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={onSignIn}
                className="rounded-full border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-slate hover:text-black hover:bg-surface transition-colors sm:px-4 sm:text-sm"
              >
                Sign In
              </button>
              <button
                onClick={onSignUp}
                className="rounded-full bg-primary px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover sm:px-4 sm:text-sm"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
