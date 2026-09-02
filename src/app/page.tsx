"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthService } from "@/server/services/auth.service";
import { ProfileService } from "@/server/services/profile.service";
import { ProductService } from "@/server/services/product.service";
import { type DisplayProduct } from "@/lib/products";
import { Navbar } from "@/components/Navbar";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DroneIcon,
  FacebookSocialIcon,
  InstagramSocialIcon,
  LinkedinSocialIcon,
  SearchIcon,
  StarIcon,
  XSocialIcon,
} from "@/components/icons";

type Product = DisplayProduct;

interface StoredCartItem {
  id: string;
  name: string;
  seller: string;
  price: number;
  quantity: number;
  stock: number;
  weightClass: Product["weightClass"];
  eta: string;
  icon: string;
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

function cartIconKeyForName(name: string) {
  if (/phone.?stand|phone holder/i.test(name)) return "phone";
  if (/headphone|headset/i.test(name)) return "headphones";
  if (/earbud|tws/i.test(name)) return "earbuds";
  if (/camera|cctv/i.test(name)) return "camera";
  if (/purifier/i.test(name)) return "purifier";
  return "coffee";
}

const SORTS = ["New Arrival", "Best Seller", "On Discount"];
const PRODUCTS_PER_PAGE = 12;

function getPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");
  pages.push(total);

  return pages;
}

function ProductThumb({ product }: { product: Product }) {
  const Icon = product.icon;
  return (
    <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-xl bg-surface">
      {product.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <Icon className="h-14 w-14 text-slate" />
      )}
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
  onBuyNow,
}: {
  product: Product;
  onAddToCart?: (product: Product, e: React.MouseEvent<HTMLButtonElement>) => void;
  onBuyNow?: (product: Product) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-3">
      <Link href={`/product/${product.id}`} className="flex flex-col gap-3">
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
      </Link>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={(e) => onAddToCart?.(product, e)}
          className="rounded-full border border-border bg-white py-2 text-xs font-medium text-black transition-colors hover:bg-surface active:scale-95"
        >
          Add to Cart
        </button>
        <button
          onClick={() => onBuyNow?.(product)}
          className="rounded-full bg-primary py-2 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3 rounded-2xl border border-border bg-white p-3">
      <div className="h-40 rounded-xl bg-surface" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-3/4 rounded bg-surface" />
        <div className="h-3 w-1/2 rounded bg-surface" />
        <div className="h-3 w-2/3 rounded bg-surface" />
        <div className="h-5 w-1/3 rounded bg-surface" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="h-8 rounded-full bg-surface" />
        <div className="h-8 rounded-full bg-surface" />
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

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = getPageList(page, totalPages);

  return (
    <div className="mt-8 flex items-center justify-between gap-2 text-sm text-slate">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex shrink-0 items-center gap-1 hover:text-black disabled:pointer-events-none disabled:opacity-40"
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
              onClick={() => onPageChange(p)}
              aria-current={page === p ? "page" : undefined}
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
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex shrink-0 items-center gap-1 hover:text-black disabled:pointer-events-none disabled:opacity-40"
      >
        <span className="hidden sm:inline">Next</span> <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function Recommendations({
  products,
  onAddToCart,
  onBuyNow,
  loading,
}: {
  products: Product[];
  onAddToCart: (product: Product, e: React.MouseEvent<HTMLButtonElement>) => void;
  onBuyNow: (product: Product) => void;
  loading: boolean;
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
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-64 shrink-0">
                <ProductCardSkeleton />
              </div>
            ))
          : products.map((p) => (
              <div key={p.id} className="w-64 shrink-0">
                <ProductCard product={p} onAddToCart={onAddToCart} onBuyNow={onBuyNow} />
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
  const [page, setPage] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [cartBump, setCartBump] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    AuthService.getSession().then((session) => {
      setIsLoggedIn(!!session);
      if (session?.user) void ProfileService.ensureProfile(session.user);
    });

    const {
      data: { subscription },
    } = AuthService.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user) void ProfileService.ensureProfile(session.user);
    });

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
    let active = true;

    ProductService.getActive()
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

  const goToLoginWithRedirect = () => {
    router.push(`/login?redirect=${encodeURIComponent("/")}`);
  };

  const addProductToCart = (product: Product) => {
    const storedItems = window.localStorage.getItem("smartlogix-cart");
    let items: StoredCartItem[] = [];
    if (storedItems) {
      try {
        items = JSON.parse(storedItems) as StoredCartItem[];
      } catch {
        window.localStorage.removeItem("smartlogix-cart");
      }
    }

    const existingItem = items.find((item) => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        seller: product.seller,
        price: product.price,
        quantity: 1,
        stock: 99,
        weightClass: product.weightClass,
        eta: product.eta,
        icon: cartIconKeyForName(product.name),
      });
    }
    window.localStorage.setItem("smartlogix-cart", JSON.stringify(items));
    setCartCount(items.reduce((count, item) => count + item.quantity, 0));
    window.dispatchEvent(new Event("smartlogix-cart-updated"));
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isLoggedIn) {
      goToLoginWithRedirect();
      return;
    }
    if (!cartButtonRef.current) return;

    addProductToCart(product);

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

  const handleBuyNow = (product: Product) => {
    if (!isLoggedIn) {
      goToLoginWithRedirect();
      return;
    }
    addProductToCart(product);
    router.push("/checkout");
  };

  const handleFlightDone = (id: string) => {
    setFlyingItems((items) => items.filter((i) => i.id !== id));
    setCartBump(true);
    setTimeout(() => setCartBump(false), 400);
  };

  const filtered = products.filter((p) => {
    const matchesCategory =
      activeCategory === "All Products" || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PRODUCTS_PER_PAGE,
    safePage * PRODUCTS_PER_PAGE,
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategorySelect = (value: string) => {
    setActiveCategory(value);
    setPage(1);
  };

  const handleSortChange = (value: string | null) => {
    setSort(value);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLogout = async () => {
    await AuthService.logout();
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
      <Hero search={search} onSearchChange={handleSearchChange} />

      <section id="shop" className="mx-auto mt-10 flex w-full max-w-6xl gap-10 px-4 sm:px-6">
        <CategorySidebar
          categories={categories}
          active={activeCategory}
          onSelect={handleCategorySelect}
          sort={sort}
          onSort={handleSortChange}
        />
        <div className="min-w-0 flex-1">
          <MobileFilters
            categories={categories}
            active={activeCategory}
            onSelect={handleCategorySelect}
            sort={sort}
            onSort={handleSortChange}
          />
          {loadingProducts ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">
              No products match &ldquo;{search}&rdquo;.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paginated.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
              ))}
            </div>
          )}
          {!loadingProducts && filtered.length > 0 && (
            <Pagination page={safePage} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </div>
      </section>

      <Recommendations
        products={recommended}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        loading={loadingProducts}
      />
      <CtaBanner />
      <Footer />

      {flyingItems.map((item) => (
        <FlyToCart key={item.id} item={item} onDone={handleFlightDone} />
      ))}
    </div>
  );
}
