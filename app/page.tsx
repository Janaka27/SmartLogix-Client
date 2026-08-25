"use client";

import { useEffect, useRef, useState } from "react";
import {
  CameraIcon,
  CartIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CoffeeIcon,
  DroneIcon,
  EarbudsIcon,
  FacebookSocialIcon,
  HeadphonesIcon,
  InstagramSocialIcon,
  LinkedinSocialIcon,
  LogoutIcon,
  PhoneStandIcon,
  PianoIcon,
  PurifierIcon,
  SearchIcon,
  SettingsIcon,
  SpeakerIcon,
  StarIcon,
  VacuumIcon,
  XSocialIcon,
} from "./icons";

type WeightClass = "Standard" | "Heavy";
type IconKey =
  | "phone"
  | "headphones"
  | "vacuum"
  | "camera"
  | "speaker"
  | "earbuds"
  | "piano"
  | "purifier"
  | "coffee";

interface Product {
  id: string;
  name: string;
  category: string;
  seller: string;
  rating: number;
  reviews: number;
  price: number;
  weightClass: WeightClass;
  eta: string;
  icon: IconKey;
}

const CATEGORIES = [
  { label: "All Products", count: 32 },
  { label: "For Home" },
  { label: "For Music" },
  { label: "For Phone" },
  { label: "For Storage" },
];

const SORTS = ["New Arrival", "Best Seller", "On Discount"];

const PRODUCTS: Product[] = [
  { id: "p1", name: "Phone Stand Sakti", category: "For Phone", seller: "Sakti Goods", rating: 5.0, reviews: 1200, price: 29.9, weightClass: "Standard", eta: "18 min", icon: "phone" },
  { id: "p2", name: "Headsound Pro", category: "For Music", seller: "Headsound Audio", rating: 5.0, reviews: 1200, price: 12.0, weightClass: "Standard", eta: "22 min", icon: "headphones" },
  { id: "p3", name: "Adudu Cleaner", category: "For Home", seller: "Adudu Home", rating: 4.4, reviews: 1000, price: 29.9, weightClass: "Heavy", eta: "35 min", icon: "vacuum" },
  { id: "p4", name: "CCTV Maling", category: "For Home", seller: "Maling Security", rating: 4.8, reviews: 120, price: 50.0, weightClass: "Standard", eta: "27 min", icon: "camera" },
  { id: "p5", name: "Stuffus Peker 32", category: "For Storage", seller: "Stuffus", rating: 5.0, reviews: 1200, price: 9.9, weightClass: "Standard", eta: "15 min", icon: "speaker" },
  { id: "p6", name: "Stuffus R175", category: "For Music", seller: "Stuffus Audio", rating: 4.8, reviews: 2400, price: 34.1, weightClass: "Standard", eta: "19 min", icon: "earbuds" },
  { id: "p7", name: "Grand Sound Piano", category: "For Music", seller: "Harmony Co.", rating: 4.9, reviews: 340, price: 249.0, weightClass: "Heavy", eta: "48 min", icon: "piano" },
  { id: "p8", name: "Aer Purifier X1", category: "For Home", seller: "Aer Living", rating: 4.6, reviews: 860, price: 79.0, weightClass: "Heavy", eta: "31 min", icon: "purifier" },
  { id: "p9", name: "Brewkit Coffee Maker", category: "For Home", seller: "Brewkit", rating: 4.7, reviews: 540, price: 45.0, weightClass: "Standard", eta: "24 min", icon: "coffee" },
];

const RECOMMENDED: Product[] = [
  { id: "r1", name: "TWS Bujug", category: "For Music", seller: "Bujug Audio", rating: 5.0, reviews: 1200, price: 29.9, weightClass: "Standard", eta: "16 min", icon: "earbuds" },
  { id: "r2", name: "Headsound Baptis", category: "For Music", seller: "Headsound Audio", rating: 5.0, reviews: 1200, price: 12.0, weightClass: "Standard", eta: "20 min", icon: "headphones" },
  { id: "r3", name: "Grand Sound Piano", category: "For Music", seller: "Harmony Co.", rating: 4.9, reviews: 340, price: 249.0, weightClass: "Heavy", eta: "48 min", icon: "piano" },
  { id: "r4", name: "Adudu Cleaner", category: "For Home", seller: "Adudu Home", rating: 4.4, reviews: 1000, price: 29.9, weightClass: "Heavy", eta: "35 min", icon: "vacuum" },
  { id: "r5", name: "CCTV Maling", category: "For Home", seller: "Maling Security", rating: 4.8, reviews: 120, price: 50.0, weightClass: "Standard", eta: "27 min", icon: "camera" },
];

const PRODUCT_ICONS: Record<IconKey, (props: { className?: string }) => React.JSX.Element> = {
  phone: PhoneStandIcon,
  headphones: HeadphonesIcon,
  vacuum: VacuumIcon,
  camera: CameraIcon,
  speaker: SpeakerIcon,
  earbuds: EarbudsIcon,
  piano: PianoIcon,
  purifier: PurifierIcon,
  coffee: CoffeeIcon,
};

function ProductThumb({ product }: { product: Product }) {
  const Icon = PRODUCT_ICONS[product.icon];
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
        <button className="rounded-full bg-black py-2 text-xs font-medium text-white transition-colors hover:bg-charcoal">
          Buy Now
        </button>
      </div>
    </div>
  );
}

interface FlyingItem {
  id: string;
  icon: IconKey;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

function FlyToCart({ item, onDone }: { item: FlyingItem; onDone: (id: string) => void }) {
  const [flown, setFlown] = useState(false);
  const Icon = PRODUCT_ICONS[item.icon];

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
      className="pointer-events-none fixed z-50 flex h-9 w-9 items-center justify-center rounded-full bg-black text-white shadow-lg"
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
          <button
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate hover:bg-surface hover:text-black"
          >
            <SettingsIcon className="h-4 w-4" />
            Preferences
          </button>
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
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <DroneIcon className="h-6 w-6 text-black" />
          <span className="text-lg font-semibold tracking-tight text-black">
            SmartLogix
          </span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate md:flex">
          <a href="#" className="text-black">Home</a>
          <a href="#shop" className="hover:text-black">Shop</a>
          <a href="#" className="hover:text-black">Track Order</a>
        </nav>
        <div className="flex items-center gap-3 sm:gap-4">
          <button aria-label="Search" className="text-slate hover:text-black">
            <SearchIcon className="h-5 w-5" />
          </button>
          {isLoggedIn ? (
            <>
              <button
                ref={cartButtonRef}
                aria-label="Cart"
                className={`relative text-slate hover:text-black ${cartBump ? "animate-cart-bump" : ""}`}
              >
                <CartIcon className="h-5 w-5" />
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white">
                  {cartCount}
                </span>
              </button>
              <ProfileMenu onLogout={onLogout} />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onSignIn}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-surface"
              >
                Sign In
              </button>
              <button
                onClick={onSignUp}
                className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-charcoal"
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
          className="absolute inset-0 flex select-none items-center justify-center overflow-hidden text-[5.5rem] font-extrabold leading-none text-transparent sm:text-[9rem]"
          style={{ WebkitTextStroke: "2px rgba(255,255,255,0.5)" }}
          aria-hidden
        >
          SHOP
        </h1>
      </div>

      <div className="relative mx-auto -mt-10 max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-black sm:text-2xl">
            Give All You Need
          </h2>
          <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-border bg-white px-2 py-1.5 sm:w-auto">
            <SearchIcon className="ml-2 h-4 w-4 shrink-0 text-muted" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search on SmartLogix"
              className="w-full bg-transparent text-sm text-black outline-none placeholder:text-muted"
            />
            <button className="shrink-0 rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-charcoal">
              Search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategorySidebar({
  active,
  onSelect,
  sort,
  onSort,
}: {
  active: string;
  onSelect: (v: string) => void;
  sort: string | null;
  onSort: (v: string) => void;
}) {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <h3 className="mb-3 text-sm font-semibold text-black">Category</h3>
      <ul className="flex flex-col gap-1 text-sm">
        {CATEGORIES.map((c) => (
          <li key={c.label}>
            <button
              onClick={() => onSelect(c.label)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                active === c.label
                  ? "bg-black text-white"
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
            onClick={() => onSort(s)}
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

function Pagination() {
  const [page, setPage] = useState(1);
  const pages = [1, 2, 3, "…", 8, 9, 10] as const;
  return (
    <div className="mt-8 flex items-center justify-between text-sm text-slate">
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        className="flex items-center gap-1 hover:text-black"
      >
        <ChevronLeftIcon className="h-4 w-4" /> Previous
      </button>
      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-lg text-sm transition-colors ${
                page === p ? "bg-black text-white" : "hover:bg-surface"
              }`}
            >
              {p}
            </button>
          ),
        )}
      </div>
      <button
        onClick={() => setPage((p) => p + 1)}
        className="flex items-center gap-1 hover:text-black"
      >
        Next <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function Recommendations({
  onAddToCart,
}: {
  onAddToCart: (product: Product, e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
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
        {RECOMMENDED.map((p) => (
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
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
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
        <div className="flex gap-16">
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
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-charcoal"
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
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [sort, setSort] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [cartCount, setCartCount] = useState(3);
  const [cartBump, setCartBump] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

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

  const filtered = PRODUCTS.filter((p) => {
    const matchesCategory =
      activeCategory === "All Products" || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-1 flex-col bg-section">
      <Navbar
        isLoggedIn={isLoggedIn}
        onSignIn={() => setIsLoggedIn(true)}
        onSignUp={() => setIsLoggedIn(true)}
        onLogout={() => setIsLoggedIn(false)}
        cartButtonRef={cartButtonRef}
        cartCount={cartCount}
        cartBump={cartBump}
      />
      <Hero search={search} onSearchChange={setSearch} />

      <section id="shop" className="mx-auto mt-10 flex w-full max-w-6xl gap-10 px-4 sm:px-6">
        <CategorySidebar
          active={activeCategory}
          onSelect={setActiveCategory}
          sort={sort}
          onSort={(s) => setSort((prev) => (prev === s ? null : s))}
        />
        <div className="flex-1">
          {filtered.length === 0 ? (
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

      <Recommendations onAddToCart={handleAddToCart} />
      <CtaBanner />
      <Footer />

      {isLoggedIn &&
        flyingItems.map((item) => (
          <FlyToCart key={item.id} item={item} onDone={handleFlightDone} />
        ))}
    </div>
  );
}
