# Project Structure

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Supabase. Folder layout mirrors
`SmartLogix-Seller`'s `src/`-based structure so both apps stay easy to move between.

## Top-level layout

```
src/
  app/              routes (Next.js App Router)
    page.tsx          / — home (product grid, cart, nav, hero)
    search/           /search — dedicated search page
    cart/             /cart
    checkout/         /checkout — delivery address, payment, places the order
    track-order/      /track-order
    login/, signup/   auth pages
    preferences/      signed-in buyer profile + notification prefs
    layout.tsx        root layout (Outfit font, globals.css)
    globals.css       design tokens (see design.md)
  components/
    icons.tsx           every SVG icon used across the storefront (no icon library dependency)
    checkout/Stepper.tsx  the Cart → Delivery → Payment → Review progress indicator (cart + checkout)
  lib/
    products.ts         `DisplayProduct` type, DB→UI mapping, icon-by-keyword matching
    mock-data/
      seed-products.ts    real product/warehouse UUIDs from the one-off `scripts/seed.mjs` run —
                           cart/checkout use these until real cart persistence + warehouse
                           selection land
    supabase/
      client.ts            browser Supabase client (`createBrowserClient`, optional `rememberMe`)
      server.ts             server Supabase client (`createServerClient`, cookie-based, for RSC/route handlers)
  server/
    services/             data-access layer — see "Service layer" below
  proxy.ts              Next 16's middleware equivalent — refreshes the Supabase session cookie
                         on every request (excluding static assets)
docs/                  you are here
```

`tsconfig.json` maps `@/*` to `./src/*`.

## Service layer (`src/server/services/`)

Every Supabase call from a page goes through a service object here instead of calling
`createClient()` inline — the same convention `SmartLogix-Seller` uses in its
`src/server/services/*.service.ts` files. Each service:

- Instantiates its own Supabase client at module scope (`const supabase = createClient();`).
- Exposes an object of async methods (`AuthService.login(...)`, `ProductService.getActive()`, ...).
- Logs the Supabase error with `console.error` and re-throws a plain `Error(error.message)`, so callers
  can use a single `try/catch` instead of checking `{ error }` on every call.
- Maps DB snake_case rows to camelCase UI shapes where relevant (`ProductService`, `OrderService`).

| Service | File | Wraps |
|---|---|---|
| `AuthService` | `auth.service.ts` | `signInWithPassword`, `signUp`, `signOut`, `getSession`, `getUser`, `onAuthStateChange` |
| `ProfileService` | `profile.service.ts` | lazy `profiles` row creation (`ensureProfile`), read/update the buyer's own profile |
| `ProductService` | `product.service.ts` | fetch active products, mapped to `DisplayProduct` via `@/lib/products` |
| `OrderService` | `order.service.ts` | `placeOrder` — inserts one `orders` row + its `order_items` rows |

`AuthService.login` is the one method that can't use the shared module-scope client: the "Remember me"
checkbox needs a fresh, non-singleton client with a shorter cookie `maxAge`, so it calls
`createClient({ rememberMe: false })` itself when asked.

Pages stay UI-only: they call a service method, hold the result in `useState`, and render. See
`src/app/checkout/page.tsx`'s `handlePlaceOrder` or `src/app/page.tsx`'s product-loading `useEffect` for
the pattern.

## Icons

There's no icon library — every icon used anywhere in the storefront is a small inline-SVG component in
`src/components/icons.tsx`. `lib/products.ts` picks one per product via a keyword-match against the
product name (`iconForProduct`).
