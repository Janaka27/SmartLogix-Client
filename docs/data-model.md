# Data Model

Unlike `SmartLogix-Seller`'s demo dashboards, this app has a **real Supabase backend** — auth and order
placement hit real tables. There's no local schema/migrations folder in this repo; the tables below are
inferred from the queries in `src/server/services/`. If a `supabase/` migrations folder or a shared schema
doc exists elsewhere for this project, treat that as the source of truth over this file.

## Tables read/written from this app

| Table | Touched by | Columns referenced |
|---|---|---|
| `profiles` | `ProfileService` | `id` (= auth user id), `role`, `full_name`, `email`, `phone` |
| `products` | `ProductService` | `id`, `name`, `category`, `price`, `weight_kg`, `status` (`"active"` filter) |
| `orders` | `OrderService` | `id`, `buyer_id`, `warehouse_id`, `status`, `delivery_lat`, `delivery_lng`, `delivery_address`, `delivery_city`, `delivery_postal_code`, `total_weight_kg`, `total_volume_cm3`, `total_amount` |
| `order_items` | `OrderService` | `order_id`, `product_id`, `quantity`, `unit_price`, `weight_kg`, `volume_cm3` |

`profiles.role` is set to `"buyer"` when `ProfileService.ensureProfile` lazily creates the row on first
sign-in — there's no signup DB trigger wired up yet, so every new-session check (`AuthService.getUser` /
`onAuthStateChange`) calls `ensureProfile` defensively.

## `DisplayProduct` (`src/lib/products.ts`)

The UI-facing shape `ProductService.getActive()` returns, mapped from the raw `products` row:

| Field | Source |
|---|---|
| `id`, `name`, `price` | passed through |
| `category` | falls back to `"Other"` if null |
| `seller` | hardcoded `"SmartLogix Marketplace"` — there's no seller join yet |
| `weightClass` | `"Heavy"` if `weight_kg > 5`, else `"Standard"` |
| `rating`, `reviews`, `eta` | **not real columns** — deterministically derived from a hash of the product id (`pseudoRating`/`pseudoReviews`/`pseudoEta`), since the schema doesn't store these yet (see the buyer-facing product fields list in the root `CLAUDE.md`) |
| `icon` | picked by matching keywords in the product name against `KEYWORD_ICONS` in `lib/products.ts` |

## What's seeded, not real

`src/lib/mock-data/seed-products.ts` hardcodes real UUIDs (`SEED_WAREHOUSE_ID`, `SEED_PRODUCTS.p1..p9`)
pulled from a one-off `scripts/seed.mjs` run against the Supabase project, each with a fixed
`weightKg`/`volumeCm3`. `src/app/checkout/page.tsx`'s `ORDER_ITEMS` array is built from these — checkout
always places an order against the same seed warehouse and a fixed set of items, regardless of what's
actually in the buyer's cart (`src/app/cart/page.tsx` reads/writes real cart state to `localStorage`, but
checkout doesn't read it yet).

This is the gap to close before checkout is real end-to-end:

1. Checkout should read the actual `localStorage` cart instead of `ORDER_ITEMS`.
2. Warehouse selection should run the Route Optimization module (Dijkstra over the warehouse/drone-range
   graph, per the root `CLAUDE.md`) against the buyer's delivery coordinates, instead of always using
   `SEED_WAREHOUSE_ID`.
3. `/track-order` should subscribe to Supabase Realtime for live drone position, instead of its current
   static UI.

## Auth

Handled entirely by Supabase Auth (`@supabase/ssr`), wrapped by `AuthService`
(`src/server/services/auth.service.ts`):

- Browser client: `src/lib/supabase/client.ts` — `createBrowserClient`, with an optional
  `{ rememberMe: false }` that swaps the default ~400-day session cookie for an 8-hour one via a
  non-singleton client (used by the login page's "Remember me" checkbox).
- Server client: `src/lib/supabase/server.ts` — `createServerClient`, cookie-based, for use in Server
  Components / Route Handlers (not yet used by any page, but present for when SSR data-fetching is added).
- `src/proxy.ts` — refreshes the session cookie on every request except static assets, so a session
  doesn't silently expire mid-visit.
