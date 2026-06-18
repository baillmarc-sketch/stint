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
- **Accounts** (`src/app/account.tsx`): email one-time-code sign-in via Supabase Auth,
  session persisted with AsyncStorage. Works in Expo Go.
- **Booking** (`src/app/book/[id].tsx`): pick an available slot, set guests, see the live
  price (`computeQuote` from `@stint/core`), then pay:
  - **Expo Go:** opens the web Stripe checkout in an in-app browser (same flow as web).
  - **Dev build + signed in:** native **Apple Pay / card** via Stripe PaymentSheet,
    hitting `/api/payments/intent` + `/api/bookings` with the Supabase session as a
    Bearer token (the API is Bearer-aware, RLS-scoped).

## Configuration (`.env` / EAS env)

```bash
EXPO_PUBLIC_SUPABASE_URL=             # optional — live data + accounts (else sample)
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_WEB_URL=                  # web checkout target (defaults to the live demo)
EXPO_PUBLIC_API_URL=                  # API base for native pay (defaults to WEB_URL)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=   # enables native PaymentSheet (dev build only)
EXPO_PUBLIC_STRIPE_MERCHANT_ID=       # Apple merchant id for Apple Pay
```

## Native payments need a dev build

`@stripe/stripe-react-native` is a native module **not present in Expo Go** — it's
loaded lazily and only used from an **EAS dev build** (`npx expo run:ios` or
`eas build`). The API target must run with `PAYMENTS_PROVIDER=stripe` and a connected
provider. In Expo Go the app automatically uses the web-checkout handoff instead.

## Monorepo / pnpm note

Metro is configured for the workspace (`metro.config.js` watches the repo root). If
Metro ever fails to resolve a hoisted dependency, add a repo‑root `.npmrc` with
`node-linker=hoisted` and reinstall — see the
[Expo monorepo guide](https://docs.expo.dev/guides/monorepos/).
