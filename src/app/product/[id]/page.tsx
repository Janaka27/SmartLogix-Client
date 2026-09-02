"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthService } from "@/server/services/auth.service";
import { ProductService } from "@/server/services/product.service";
import type { DisplayProduct } from "@/lib/products";
import { Navbar } from "@/components/Navbar";
import {
  BoxIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  DroneIcon,
  StarIcon,
} from "@/components/icons";

type IconKey = "phone" | "headphones" | "earbuds" | "camera" | "purifier" | "coffee";

interface StoredCartItem {
  id: string;
  name: string;
  seller: string;
  price: number;
  quantity: number;
  stock: number;
  weightClass: DisplayProduct["weightClass"];
  eta: string;
  icon: IconKey;
}

function cartIconKeyForName(name: string): IconKey {
  if (/phone.?stand|phone holder/i.test(name)) return "phone";
  if (/headphone|headset/i.test(name)) return "headphones";
  if (/earbud|tws/i.test(name)) return "earbuds";
  if (/camera|cctv/i.test(name)) return "camera";
  if (/purifier/i.test(name)) return "purifier";
  return "coffee";
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

function ProductPageShell({
  isLoggedIn,
  cartCount,
  onSignIn,
  onSignUp,
  onLogout,
  children,
}: {
  isLoggedIn: boolean;
  cartCount: number;
  onSignIn: () => void;
  onSignUp: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-section">
      <Navbar
        isLoggedIn={isLoggedIn}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onLogout={onLogout}
        cartCount={cartCount}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate hover:text-black"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Shop
        </Link>

        {children}
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="mt-6 grid animate-pulse grid-cols-1 gap-10 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="aspect-square rounded-2xl bg-surface" />
        <div className="flex gap-2">
          <div className="h-16 w-16 rounded-lg bg-surface" />
          <div className="h-16 w-16 rounded-lg bg-surface" />
          <div className="h-16 w-16 rounded-lg bg-surface" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 rounded bg-surface" />
          <div className="h-7 w-3/4 rounded bg-surface" />
          <div className="h-4 w-40 rounded bg-surface" />
        </div>
        <div className="h-9 w-32 rounded bg-surface" />
        <div className="h-24 rounded-2xl bg-surface" />
        <div className="flex flex-col gap-2">
          <div className="h-3 rounded bg-surface" />
          <div className="h-3 w-5/6 rounded bg-surface" />
          <div className="h-3 w-2/3 rounded bg-surface" />
        </div>
        <div className="h-20 rounded-2xl bg-surface" />
        <div className="flex gap-4">
          <div className="h-10 w-28 rounded-full bg-surface" />
          <div className="h-10 flex-1 rounded-full bg-surface" />
          <div className="h-10 flex-1 rounded-full bg-surface" />
        </div>
      </div>
    </div>
  );
}

function addToStoredCart(product: DisplayProduct, quantity: number) {
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
    existingItem.quantity += quantity;
  } else {
    items.push({
      id: product.id,
      name: product.name,
      seller: product.seller,
      price: product.price,
      quantity,
      stock: product.stockQty,
      weightClass: product.weightClass,
      eta: product.eta,
      icon: cartIconKeyForName(product.name),
    });
  }
  window.localStorage.setItem("smartlogix-cart", JSON.stringify(items));
  window.dispatchEvent(new Event("smartlogix-cart-updated"));
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  // Keying by id remounts this view (resetting its state) whenever the
  // route param changes, instead of resetting state imperatively in an effect.
  return <ProductDetailView key={id} id={id} />;
}

function ProductDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<DisplayProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);

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
    let active = true;

    ProductService.getById(id)
      .then((data) => {
        if (!active) return;
        if (!data) {
          setNotFound(true);
          return;
        }
        setProduct(data);
      })
      .catch((err) => {
        console.error("Failed to load product", err);
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(`/product/${product.id}`)}`);
      return;
    }
    addToStoredCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(`/product/${product.id}`)}`);
      return;
    }
    addToStoredCart(product, quantity);
    router.push("/checkout");
  };

  const handleLogout = async () => {
    await AuthService.logout();
  };

  const shellProps = {
    isLoggedIn,
    cartCount,
    onSignIn: () => router.push(`/login?redirect=${encodeURIComponent(`/product/${id}`)}`),
    onSignUp: () => router.push(`/signup?redirect=${encodeURIComponent(`/product/${id}`)}`),
    onLogout: handleLogout,
  };

  if (loading) {
    return (
      <ProductPageShell {...shellProps}>
        <ProductDetailSkeleton />
      </ProductPageShell>
    );
  }

  if (notFound || !product) {
    return (
      <ProductPageShell {...shellProps}>
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-xl font-semibold text-black">Product not found</h1>
          <p className="max-w-sm text-sm text-muted">
            This item may have been removed or is no longer available.
          </p>
          <Link
            href="/"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Back to Shop
          </Link>
        </div>
      </ProductPageShell>
    );
  }

  const Icon = product.icon;
  const inStock = product.stockQty > 0;
  const hasDimensions = product.lengthCm > 0 && product.widthCm > 0 && product.heightCm > 0;

  return (
    <ProductPageShell {...shellProps}>
      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface">
              {product.images[activeImage] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[activeImage]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Icon className="h-24 w-24 text-slate" />
              )}
              <span
                className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  product.weightClass === "Heavy" ? "bg-charcoal text-white" : "bg-white text-slate"
                }`}
              >
                {product.weightClass === "Heavy" ? "Heavy · Surcharge" : "Standard"}
              </span>
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                      i === activeImage ? "border-black" : "border-border hover:border-slate"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {product.category}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-black sm:text-3xl">{product.name}</h1>
              <div className="mt-2 flex items-center gap-1 text-sm text-muted">
                <StarIcon className="h-4 w-4 text-black" />
                <span className="font-medium text-black">{product.rating.toFixed(1)}</span>
                <span>
                  ({product.reviews >= 1000 ? `${(product.reviews / 1000).toFixed(1)}k` : product.reviews}{" "}
                  Reviews)
                </span>
                <span className="text-border">·</span>
                <span>{product.seller}</span>
              </div>
            </div>

            <p className="text-3xl font-semibold text-black">${product.price.toFixed(2)}</p>

            <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-black">
                <DroneIcon className="h-4 w-4 shrink-0 text-slate" />
                Estimated delivery: <span className="font-medium">{product.eta}</span> from the
                nearest warehouse with stock
              </div>
              <div className={`text-sm ${inStock ? "text-slate" : "text-charcoal"}`}>
                {inStock ? `${product.stockQty} in stock` : "Out of stock"}
              </div>
              {product.weightClass === "Heavy" && (
                <p className="text-sm text-charcoal">
                  This item is heavy and may require split delivery or an extra drone trip.
                </p>
              )}
            </div>

            {product.description && (
              <p className="text-sm leading-6 text-slate">{product.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-white p-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-muted">Weight</p>
                <p className="font-medium text-black">{product.weightKg} kg</p>
              </div>
              {hasDimensions && (
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-muted">Dimensions (L × W × H)</p>
                  <p className="flex items-center gap-1.5 font-medium text-black">
                    <BoxIcon className="h-4 w-4 shrink-0 text-slate" />
                    {product.lengthCm} × {product.widthCm} × {product.heightCm} cm
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center rounded-full border border-border bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-10 w-10 text-lg text-slate hover:text-black"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium text-black">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stockQty || 99, q + 1))}
                  className="h-10 w-10 text-lg text-slate hover:text-black"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 rounded-full border border-border bg-white px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!inStock}
                className="flex-1 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                Buy Now
              </button>
            </div>

            {addedToCart && (
              <div className="flex items-center gap-2 text-sm font-medium text-charcoal">
                <CheckCircleIcon className="h-4 w-4" />
                Added to cart
              </div>
            )}
          </div>
        </div>
    </ProductPageShell>
  );
}
