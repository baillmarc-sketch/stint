# Stint

**Entertainment delivered to you — from clowns to hibachi and cleanup too.**

Stint is a two-sided marketplace for booking on-site party and event services:
private chefs, hibachi cooks, bartenders, DJs, musicians, magicians, clowns,
photographers, cleaners, decorators, and event crews who come to you.

This repo is the **functional web demo** — built to show the full browse → book
experience to investors. It launches NYC-first, then market by market.

## Stack

- **Next.js 16** (App Router, TypeScript) + **React 19**
- **Tailwind CSS 4** with a hand-rolled shadcn-style component layer
- **Supabase** (Postgres / Auth / Storage / RLS) for Google SSO and data
- **Vercel** for hosting

## Running locally

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

The demo runs **without any environment variables** — all NYC content is rendered
from a typed in-repo dataset (`lib/data/`). Add Supabase + Google credentials
(see `.env.example`) to enable real Google sign-in.

## Key conventions

- **Money is integer cents** everywhere.
- **Payments are simulated** behind a swappable `PaymentProvider` interface
  (`lib/payments.ts`) — Stripe Connect drops in later with no schema change.
- **Pricing math lives in one place** (`lib/booking/pricing.ts`) and is re-run
  server-side on booking creation.
- The **data-access layer** (`lib/queries.ts`) is async so the in-repo dataset can
  be swapped for Supabase queries without touching pages or components.
- Next.js 16 renames Middleware → **Proxy** (`proxy.ts`); it refreshes the
  Supabase session and no-ops when Supabase isn't configured.

See the project plan for the full roadmap, data model, and milestones.
