# SmartLogix-Client Docs

This is Site A — the **Buyer-facing storefront** — of the two-site drone-delivery marketplace. Buyers
browse products, check out, and track their drone delivery live. It's a Next.js app backed by a real
Supabase project (auth + Postgres), unlike its sibling `SmartLogix-Seller` demo dashboards.

**Start here:** [`getting-started.md`](./getting-started.md)

| Doc | What's in it |
|---|---|
| [`getting-started.md`](./getting-started.md) | Install, run, env vars, scripts |
| [`structure.md`](./structure.md) | Route tree, `src/` folder layout, the service layer pattern |
| [`design.md`](./design.md) | Brand, colors, typography, component conventions |
| [`data-model.md`](./data-model.md) | Supabase tables in use, what's real vs. seeded/placeholder |

## The one thing to know going in

**This one has a real backend.** Auth (sign in / sign up / sessions) and order placement write to a real
Supabase project. What's *not* real yet: warehouse selection and drone-range checking at checkout — every
order is pinned to one seed warehouse ID (see [`data-model.md`](./data-model.md)) until the Route
Optimization module (Dijkstra over the warehouse/drone-range graph, per the root `CLAUDE.md`) is wired in.
