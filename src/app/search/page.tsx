"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductService } from "@/server/services/product.service";
import { type DisplayProduct } from "@/lib/products";
import { CartIcon, DroneIcon, SearchIcon } from "@/components/icons";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All products");
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    ProductService.getActive()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((err) => console.error("Failed to load products", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = [
    "All products",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  const results = products.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All products" || product.category === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-section">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2 text-black">
            <DroneIcon className="h-6 w-6 shrink-0" />
            <span className="truncate text-lg font-semibold tracking-tight">SmartLogix</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate md:flex">
            <Link href="/" className="hover:text-black">Home</Link>
            <span className="text-black">Shop</span>
            <span className="text-muted">Track order</span>
          </nav>
          <Link href="/cart" aria-label="Open cart" className="shrink-0 text-slate hover:text-black">
            <CartIcon className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <section className="bg-charcoal text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-xs font-medium uppercase tracking-[.16em] text-white/50">The SmartLogix shop</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Find it. Order it. See it arrive.
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/60">
            Everyday essentials, allocated from the nearest warehouse and delivered by drone.
          </p>
          <form className="mt-7 flex w-full max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 text-black sm:flex-row sm:items-center sm:rounded-full" onSubmit={(event) => event.preventDefault()}>
            <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
              <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products or sellers" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted" />
            </div>
            <button type="submit" className="w-full rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover sm:w-auto">Search</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[.16em] text-muted">Browse inventory</p>
            <h2 className="mt-1 text-2xl font-semibold text-black">{query ? `Results for "${query}"` : "All products"}</h2>
            <p className="mt-1 text-sm text-muted">{results.length} products available in your delivery zone</p>
          </div>
          <select aria-label="Sort products" className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm text-black outline-none sm:w-auto">
            <option>Sort by relevance</option>
            <option>Price: low to high</option>
            <option>Fastest delivery</option>
          </select>
        </div>

        <div className="scrollbar-none mt-7 flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
          {categories.map((item) => (
            <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${category === item ? "border-primary bg-primary text-white" : "border-border bg-white text-slate hover:border-primary hover:text-black"}`}>
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-10 text-center text-sm text-muted">Loading products…</p>
        ) : results.length ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((product) => {
              const Icon = product.icon;
              return (
                <article
                  key={product.id}
                  className="flex min-w-0 flex-col rounded-2xl border border-border bg-white p-3"
                >
                  <Link href={`/product/${product.id}`} className="flex flex-col gap-0">
                    <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-surface sm:h-44">
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
                    </div>
                    <div className="flex flex-1 flex-col pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-black">{product.name}</h3>
                        <span className="shrink-0 text-sm font-semibold text-black">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {product.category} · {product.eta} by drone
                      </p>
                    </div>
                  </Link>
                  <button className="mt-4 w-full rounded-full bg-primary py-2.5 text-xs font-medium text-white hover:bg-primary-hover">
                    Add to cart
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
            <SearchIcon className="mx-auto h-8 w-8 text-muted" />
            <h3 className="mt-4 text-base font-semibold text-black">No products found</h3>
            <p className="mt-1 text-sm text-muted">Try another search or category.</p>
          </div>
        )}
      </section>
    </main>
  );
}