# Stint — iOS app (Expo)

The native app, sharing all domain logic with the web app via **`@stint/core`**
(types, pricing, booking state machine, formatting). Built with Expo Router.

## Run it on your iPhone (no Mac needed)

From the **repo root** (so the pnpm workspace links `@stint/core`):

```bash
pnpm install
cd apps/mobile
npx expo start
```

Then install **Expo Go** from the App Store and scan the QR code. The app loads
over your local network — keep your phone on the same Wi‑Fi.

> iOS Simulator (`npx expo start --ios`) needs a Mac with Xcode. Expo Go works
> from any machine.

## What's here

- **Browse** + **provider detail** + **booking** screens, styled with the shared theme.
- **Live data** via `@stint/data`: set `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` to read
  published providers from Supabase (RLS-scoped); otherwise a bundled sample renders so
  the app works with **zero backend**.
- **Booking** (`src/app/book/[id].tsx`): pick an available slot, set guests, see the live
  price (`computeQuote` from `@stint/core`), then **Reserve & pay** opens the web Stripe
  checkout in an in-app browser — reusing the same payment flow as the web app.

## Configuration (`.env` / EAS env)

```bash
EXPO_PUBLIC_SUPABASE_URL=          # optional — live data (else sample)
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_WEB_URL=               # checkout target (defaults to the live demo)
```

## Next increment — native payments

The browser handoff works in Expo Go today. For **native Apple Pay**, add
`@stripe/stripe-react-native` PaymentSheet hitting the existing `/api/payments/intent`
— that's a native module, so it needs an **EAS dev build** (not Expo Go) and the API
must accept the Supabase session as a Bearer token.

## Monorepo / pnpm note

Metro is configured for the workspace (`metro.config.js` watches the repo root). If
Metro ever fails to resolve a hoisted dependency, add a repo‑root `.npmrc` with
`node-linker=hoisted` and reinstall — see the
[Expo monorepo guide](https://docs.expo.dev/guides/monorepos/).
