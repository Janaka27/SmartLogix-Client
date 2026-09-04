@AGENTS.md

# SmartLogix

E-commerce platform with drone delivery. Buyers browse and order products; orders are fulfilled from the
nearest warehouse with stock and delivered by drone, with live tracking. This is a collaborative project —
keep this file current as the product and architecture take shape so every collaborator (and Claude) is
working from the same picture.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- Supabase — Realtime is used for live drone position updates during delivery tracking
- Route Optimization module — computes distance/ETA from the nearest in-stock warehouse (Dijkstra over a
  warehouse/drone-range graph)
- Batch Delivery Route module (src/lib/dsa/simulated-annealing.ts) — orders a single drone's multi-stop
  trip (depot + delivery stops, closed loop) with Simulated Annealing over a circularly linked list;
  implemented and benchmarked standalone, not yet called from any page

The codebase is currently a fresh `create-next-app` scaffold (`app/`, no feature code yet). Update this
section as real structure (routes, data layer, modules) lands.

## Product scope — buyer-facing flow

1. **Home** — featured products, categories, "how drone delivery works" banner.
2. **Category / Browse** — filter by category, price, seller, delivery-zone availability.
3. **Search results**.
4. **Product Detail Page**
   - Images, price, stock, seller name.
   - Weight & dimensions shown to buyer, so oversized/heavy items can visibly warn "may require split
     delivery."
   - Delivery estimate — calls the Route Optimization module for distance/ETA from the nearest warehouse
     with stock.
5. **Cart**.
6. **Checkout**
   - Delivery address capture includes lat/long (required for the Dijkstra graph + drone range check).
   - Address must fall inside a warehouse's drone range, or checkout blocks / upsells an alternate
     fulfillment method.
7. **Order Confirmation**.
8. **Order Tracking (live)**
   - Map showing the drone's current position via Supabase Realtime.
   - Status progression: Processing → Allocated to Drone → In Flight → Delivered.
9. **Order History**.
10. **Account / Profile**.
11. **Support / Help**.

### Buyer-facing product fields

Subset of the full product record exposed to buyers: name, price, images, short description, stock
available, seller name, estimated delivery time, weight class badge (e.g. "Standard", "Heavy — surcharge"),
category, color.

## Design system

Shared with SmartLogix-Seller: Outfit as the sans font (`--font-sans`, set in `app/layout.tsx` via
`next/font/google`), the `/images/logo.png` (+ `logo-mark.png`, `logo-white-text.png`) brand assets, and
Tailwind's `orange-500` / `orange-600` as the brand accent (`--color-primary` / `--color-primary-hover` in
`app/globals.css`), used for primary CTAs, active states, and badges.

| Color | Hex | Usage |
|---|---|---|
| Primary (Orange 500) | `#F97316` | Primary CTA buttons, active states, badges — shared brand accent |
| Primary Hover (Orange 600) | `#EA580C` | Hover state for primary CTAs |
| Pure Black | `#000000` | Main headings, strong text |
| Dark Charcoal | `#202020` | Footer, large text |
| Charcoal | `#303030` | Secondary dark elements |
| Dark Gray | `#404040` | Body/secondary text |
| Medium Gray | `#808080` | Muted text, icons |
| Light Gray | `#E0E0E0` | Borders, backgrounds |
| Very Light Gray | `#F0F0F0` | Product cards / input backgrounds |
| Off White | `#FAFAFA` | Page sections |
| White | `#FFFFFF` | Main background, cards |

These are wired in as Tailwind theme tokens / CSS variables in `app/globals.css` (`@theme inline` block)
rather than hard-coded hex values, so the palette stays consistent across the app.
