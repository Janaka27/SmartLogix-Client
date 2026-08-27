# Design System

Shared with `SmartLogix-Seller`: same brand assets, same accent color, same sans font — so the buyer
storefront and the seller/admin portals read as one product.

## Brand

Logo files live at `public/images/`: `logo.png` (default), `logo-mark.png` (arrow only, no wordmark),
`logo-white-text.png` (white wordmark, for dark surfaces). The navbar (`src/app/page.tsx`) and auth pages
use `logo.png` on white; nothing in this app currently needs the dark-surface variants, but keep them
around for parity with Seller.

One accent color everywhere: Tailwind's **orange-500 / orange-600** (primary / primary-hover). No second
accent color exists in this app.

## Typography

**Outfit**, loaded via `next/font/google` in `src/app/layout.tsx`, mapped to `--font-sans`. `Geist_Mono`
is loaded for `--font-mono` but not used prominently. To change the type family, edit the `Outfit({...})`
call in `layout.tsx` — nothing else references a font by name.

## Color tokens

Defined in `src/app/globals.css`'s `:root` block and re-exposed to Tailwind via the `@theme inline` block,
so they're usable as `bg-*`/`text-*`/`border-*` utilities (e.g. `bg-primary`, `text-slate`,
`border-border`):

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` (orange-500) | `#F97316` | Primary CTA buttons, active states, badges |
| `--color-primary-hover` (orange-600) | `#EA580C` | Hover state for primary CTAs |
| `--foreground` | `#000000` | Main headings, strong text |
| `--color-charcoal` | `#202020` | Footer, large dark surfaces (hero, CTA banner) |
| `--color-charcoal-soft` | `#303030` | Secondary dark elements (gradient stop in hero) |
| `--color-slate` | `#404040` | Body/secondary text, nav links |
| `--color-muted` | `#808080` | Muted text, timestamps, helper copy |
| `--color-border` | `#E0E0E0` | Card borders, dividers, input borders |
| `--color-surface` | `#F0F0F0` | Product thumbnail backgrounds, hover fills |
| `--color-section` | `#FAFAFA` | Page background |
| `--background` | `#FAFAFA` | `<body>` background (same as `--color-section`) |

This table matches the one in the root `CLAUDE.md` — that's the source of truth if the two ever drift.
Unlike Seller (which runs shadcn/ui on oklch tokens), this app has no shadcn dependency: every surface is
plain Tailwind utility classes against the tokens above.

## Component conventions

- **No icon library.** Every icon is a hand-written inline-SVG component in `src/components/icons.tsx`.
  Add new icons there rather than pulling in `lucide-react` or similar.
- **No component library.** Buttons, cards, inputs, dialogs — all plain `<button>`/`<div>`/`<input>` with
  Tailwind classes, built inline in each page. There's no shared `Button`/`Card`/`Input` component yet;
  if one becomes worth extracting, `src/components/` (flat, or a feature subfolder like
  `src/components/checkout/`) is where it goes, following the one existing example (`Stepper`).
- **Rounded, borderless cards.** `rounded-2xl border border-border bg-white` is the default card
  treatment across product cards, section cards, and auth panels.
- **Dark hero/CTA sections** use `bg-charcoal` or a `from-charcoal-soft via-charcoal to-black` gradient,
  with a faint `DroneIcon` watermark — see the home page hero and the checkout page's step banner.
- **Cart persistence** is `localStorage` only (`smartlogix-cart` key), synced across tabs/components via a
  custom `smartlogix-cart-updated` window event. This is a placeholder until cart state moves server-side.
