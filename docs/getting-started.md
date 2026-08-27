# Getting Started

## Requirements

- Node.js 20+
- npm
- A Supabase project (URL + publishable key)

## Environment variables

Create `.env` (or `.env.local`) with:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

These are read by `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, and `src/proxy.ts` (session
refresh on every request).

## Install & run

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

| Route | What it is |
|---|---|
| `/` | Home — featured products, category browse, search |
| `/search` | Dedicated product search page |
| `/cart` | Cart |
| `/checkout` | Delivery address + payment, places a real order |
| `/track-order` | Order tracking UI (drone position — Realtime wiring pending) |
| `/login`, `/signup` | Real Supabase auth |
| `/preferences` | Signed-in buyer's profile + notification prefs |

## Other scripts

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## Where to look next

- [`structure.md`](./structure.md) — route tree, folder layout, the `server/services` data-access layer
- [`design.md`](./design.md) — brand, colors, typography, component conventions
- [`data-model.md`](./data-model.md) — Supabase tables in use, what's real vs. seeded/placeholder
- The root `CLAUDE.md` — full product scope and tech stack (Route Optimization module, drone tracking, etc.)
