"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ensureProfile } from "@/utils/supabase/ensure-profile";
import { fetchActiveProducts, type DisplayProduct } from "@/lib/products";
import {
  CartIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DroneIcon,
  FacebookSocialIcon,
  InstagramSocialIcon,
  LinkedinSocialIcon,
  LogoutIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  XIcon,
  XSocialIcon,
} from "./icons";

type Product = DisplayProduct;

const SORTS = ["New Arrival", "Best Seller", "On Discount"];

function ProductThumb({ product }: { product: Product }) {
  const Icon = product.icon;
  return (
    <div className="relative flex h-40 items-center justify-center rounded-xl bg-surface">
      <Icon className="h-14 w-14 text-slate" />
      <span
        className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-medium ${
          product.weightClass === "Heavy"
            ? "bg-charcoal text-white"
            : "bg-white text-slate"
        }`}
      >
        {product.weightClass === "Heavy" ? "Heavy · Surcharge" : "Standard"}
      </span>
    </div>
  );
}

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted">
      <StarIcon className="h-3.5 w-3.5 text-black" />
      <span className="font-medium text-black">{rating.toFixed(1)}</span>
      <span>
        ({reviews >= 1000 ? `${(reviews / 1000).toFixed(1)}k` : reviews} Reviews)
      </span>
    </div>
  );
}

function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart?: (product: Product, e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-3">
      <ProductThumb product={product} />
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-black">{product.name}</h3>
        <StarRating rating={product.rating} reviews={product.reviews} />
        <p className="text-xs text-muted">
          {product.seller} · ETA {product.eta}
        </p>
        <p className="pt-0.5 text-base font-semibold text-black">
          ${product.price.toFixed(2)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={(e) => onAddToCart?.(product, e)}
          className="rounded-full border border-border bg-white py-2 text-xs font-medium text-black transition-colors hover:bg-surface active:scale-95"
        >
          Add to Cart
        </button>
        <button className="rounded-full bg-primary py-2 text-xs font-medium text-white transition-colors hover:bg-primary-hover">
          Buy Now
        </button>
      </div>
    </div>
  );
}

interface FlyingItem {
  id: string;
  icon: Product["icon"];
  from: { x: number; y: number };
  to: { x: number; y: number };
}

function FlyToCart({ item, onDone }: { item: FlyingItem; onDone: (id: string) => void }) {
  const [flown, setFlown] = useState(false);
  const Icon = item.icon;

  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setFlown(true)));
    const timeout = setTimeout(() => onDone(item.id), 620);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [item.id, onDone]);

  const pos = flown ? item.to : item.from;

  return (
    <div
      className="pointer-events-none fixed z-50 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg"
      style={{
        left: pos.x,
        top: pos.y,
        transform: `translate(-50%, -50%) scale(${flown ? 0.35 : 1})`,
        opacity: flown ? 0.3 : 1,
        transition: "left 0.6s cubic-bezier(.22,.85,.36,1), top 0.6s cubic-bezier(.22,.85,.36,1), transform 0.6s ease, opacity 0.6s ease",
      }}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

function ProfileMenu({
  onLogout,
}: {
  onLogout: () => void;
}) {
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

const NAV_LINKS = [
  { label: "Home", href: "#" },
  { label: "Shop", href: "#shop" },
  { label: "Track Order", href: "#" },
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

function Navbar({
  isLoggedIn,
  onSignIn,
  onSignUp,
  onLogout,
  cartButtonRef,
  cartCount,
  cartBump,
}: {
  isLoggedIn: boolean;
  onSignIn: () => void;
  onSignUp: () => void;
  onLogout: () => void;
  cartButtonRef: React.RefObject<HTMLButtonElement | null>;
  cartCount: number;
  cartBump: boolean;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <MobileNavMenu />
          <Image
            src="/images/logo.png"
            alt="SmartLogix"
            width={911}
            height={285}
            priority
            className="h-7 w-auto shrink-0 sm:h-9 md:h-11"
          />
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

function Hero({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <section className="relative">
      <div className="relative h-64 overflow-hidden bg-linear-to-br from-charcoal-soft via-charcoal to-black sm:h-80">
        <DroneIcon className="absolute right-10 top-8 h-10 w-10 text-white/30 sm:right-24 sm:top-12" />
        <DroneIcon className="absolute left-10 bottom-10 h-6 w-6 text-white/20 sm:left-32" />
        <h1
          className="absolute inset-0 flex select-none items-center justify-center overflow-hidden text-6xl font-extrabold leading-none text-transparent sm:text-8xl md:text-[9rem]"
          style={{ WebkitTextStroke: "2px rgba(255,255,255,0.5)" }}
          aria-hidden
        >
          SHOP
        </h1>
      </div>

      <div className="relative mx-auto -mt-10 max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <h2 className="text-xl font-semibold text-black sm:text-2xl">
            Give All You Need
          </h2>
          <div className="flex w-full min-w-0 max-w-md items-center gap-2 rounded-full border border-border bg-white px-2 py-1.5 sm:w-auto">
            <SearchIcon className="ml-2 h-4 w-4 shrink-0 text-muted" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products"
              className="w-full min-w-0 truncate bg-transparent text-sm text-black outline-none placeholder:text-muted"
            />
            <button className="shrink-0 rounded-full bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover sm:px-5">
              Search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface CategoryOption {
  label: string;
  count?: number;
}

function CategorySidebar({
  categories,
  active,
  onSelect,
  sort,
  onSort,
}: {
  categories: CategoryOption[];
  active: string;
  onSelect: (v: string) => void;
  sort: string | null;
  onSort: (v: string | null) => void;
}) {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <h3 className="mb-3 text-sm font-semibold text-black">Category</h3>
      <ul className="flex flex-col gap-1 text-sm">
        {categories.map((c) => (
          <li key={c.label}>
            <button
              onClick={() => onSelect(c.label)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                active === c.label
                  ? "bg-primary text-white"
                  : "text-slate hover:bg-surface"
              }`}
            >
              <span>{c.label}</span>
              {c.count && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    active === c.label ? "bg-white/20 text-white" : "bg-surface text-slate"
                  }`}
                >
                  {c.count}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-1 border-t border-border pt-4 text-sm">
        {SORTS.map((s) => (
          <button
            key={s}
            onClick={() => onSort(sort === s ? null : s)}
            className={`rounded-lg px-3 py-2 text-left transition-colors ${
              sort === s ? "bg-surface font-medium text-black" : "text-slate hover:bg-surface"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </aside>
  );
}

function MobileFilters({
  categories,
  active,
  onSelect,
  sort,
  onSort,
}: {
  categories: CategoryOption[];
  active: string;
  onSelect: (v: string) => void;
  sort: string | null;
  onSort: (v: string | null) => void;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 lg:hidden">
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <button
            key={c.label}
            onClick={() => onSelect(c.label)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
              active === c.label
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-slate hover:border-primary hover:text-black"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <select
        aria-label="Sort products"
        value={sort ?? ""}
        onChange={(e) => onSort(e.target.value || null)}
        className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm text-black outline-none sm:w-auto"
      >
        <option value="">Sort: Featured</option>
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}

function Pagination() {
  const [page, setPage] = useState(1);
  const pages = [1, 2, 3, "…", 8, 9, 10] as const;
  return (
    <div className="mt-8 flex items-center justify-between gap-2 text-sm text-slate">
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        className="flex shrink-0 items-center gap-1 hover:text-black"
      >
        <ChevronLeftIcon className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
      </button>
      <div className="scrollbar-none flex min-w-0 items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="shrink-0 px-2 text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 shrink-0 rounded-lg text-sm transition-colors ${
                page === p ? "bg-primary text-white" : "hover:bg-surface"
              }`}
            >
              {p}
            </button>
          ),
        )}
      </div>
      <button
        onClick={() => setPage((p) => p + 1)}
        className="flex shrink-0 items-center gap-1 hover:text-black"
      >
        <span className="hidden sm:inline">Next</span> <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function Recommendations({
  products,
  onAddToCart,
}: {
  products: Product[];
  onAddToCart: (product: Product, e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <section className="mx-auto w-full min-w-0 max-w-6xl px-4 py-14 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-black">
          Explore our recommendations
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-slate hover:bg-surface"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-slate hover:bg-surface"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div key={p.id} className="w-64 shrink-0">
            <ProductCard product={p} onAddToCart={onAddToCart} />
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col gap-6 rounded-2xl bg-charcoal p-8 text-white sm:flex-row sm:items-center sm:justify-between sm:p-10">
        <div>
          <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
            Ready for Faster
            <br />
            Drone Deliveries?
          </h2>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-4 flex max-w-xs items-center gap-2 rounded-full bg-white/10 p-1.5"
          >
            <input
              type="email"
              required
              placeholder="Your Email"
              className="w-full bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/50"
            />
            <button className="shrink-0 rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-surface">
              Send
            </button>
          </form>
        </div>
        <div className="max-w-xs text-sm text-white/70">
          <p className="mb-1 font-medium text-white">SmartLogix for Homes and Needs</p>
          <p>
            We&apos;ll get your order allocated to the nearest warehouse and in
            the air fast — track every flight in real time from checkout to
            your door.
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-14 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:flex-row sm:justify-between sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:flex sm:gap-16">
          <div>
            <h4 className="mb-3 text-sm font-semibold text-black">About</h4>
            <ul className="flex flex-col gap-2 text-sm text-slate">
              <li><a href="#" className="hover:text-black">Blog</a></li>
              <li><a href="#" className="hover:text-black">Meet The Team</a></li>
              <li><a href="#" className="hover:text-black">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-black">Support</h4>
            <ul className="flex flex-col gap-2 text-sm text-slate">
              <li><a href="#" className="hover:text-black">Track Order</a></li>
              <li><a href="#" className="hover:text-black">Delivery Zones</a></li>
              <li><a href="#" className="hover:text-black">Returns</a></li>
              <li><a href="#" className="hover:text-black">FAQ</a></li>
            </ul>
          </div>
        </div>
        <div className="text-sm">
          <p className="mb-3 text-muted">Social Media</p>
          <div className="flex gap-3">
            {[XSocialIcon, FacebookSocialIcon, LinkedinSocialIcon, InstagramSocialIcon].map(
              (Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover"
                >
                  <Icon />
                </a>
              ),
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Copyright © 2026 SmartLogix. All Rights Reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-black">Terms of Service</a>
            <a href="#" className="hover:text-black">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [sort, setSort] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [cartBump, setCartBump] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session?.user) void ensureProfile(supabase, session.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user) void ensureProfile(supabase, session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    fetchActiveProducts(supabase)
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((err) => {
        console.error("Failed to load products", err);
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const categories: CategoryOption[] = [
    { label: "All Products", count: products.length },
    ...Array.from(new Set(products.map((p) => p.category))).map((label) => ({ label })),
  ];

  const recommended = products.slice(0, 5);

  const handleAddToCart = (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cartButtonRef.current) return;
    const btnRect = e.currentTarget.getBoundingClientRect();
    const cartRect = cartButtonRef.current.getBoundingClientRect();
    setFlyingItems((items) => [
      ...items,
      {
        id: `${product.id}-${Date.now()}`,
        icon: product.icon,
        from: { x: btnRect.left + btnRect.width / 2, y: btnRect.top + btnRect.height / 2 },
        to: { x: cartRect.left + cartRect.width / 2, y: cartRect.top + cartRect.height / 2 },
      },
    ]);
  };

  const handleFlightDone = (id: string) => {
    setFlyingItems((items) => items.filter((i) => i.id !== id));
    setCartCount((c) => c + 1);
    setCartBump(true);
    setTimeout(() => setCartBump(false), 400);
  };

  const filtered = products.filter((p) => {
    const matchesCategory =
      activeCategory === "All Products" || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-1 flex-col bg-section">
      <Navbar
        isLoggedIn={isLoggedIn}
        onSignIn={() => router.push("/login")}
        onSignUp={() => router.push("/signup")}
        onLogout={handleLogout}
        cartButtonRef={cartButtonRef}
        cartCount={cartCount}
        cartBump={cartBump}
      />
      <Hero search={search} onSearchChange={setSearch} />

      <section id="shop" className="mx-auto mt-10 flex w-full max-w-6xl gap-10 px-4 sm:px-6">
        <CategorySidebar
          categories={categories}
          active={activeCategory}
          onSelect={setActiveCategory}
          sort={sort}
          onSort={setSort}
        />
        <div className="min-w-0 flex-1">
          <MobileFilters
            categories={categories}
            active={activeCategory}
            onSelect={setActiveCategory}
            sort={sort}
            onSort={setSort}
          />
          {loadingProducts ? (
            <p className="py-16 text-center text-sm text-muted">Loading products…</p>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">
              No products match &ldquo;{search}&rdquo;.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}
          <Pagination />
        </div>
      </section>

      <Recommendations products={recommended} onAddToCart={handleAddToCart} />
      <CtaBanner />
      <Footer />

      {flyingItems.map((item) => (
        <FlyToCart key={item.id} item={item} onDone={handleFlightDone} />
      ))}
    </div>
  );
}
