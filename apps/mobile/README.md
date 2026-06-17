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

## What's here (v1)

- **Browse** (`src/app/index.tsx`) and **provider detail** (`src/app/provider/[id].tsx`)
  screens, styled with the shared color theme.
- A **bundled sample dataset** (`src/lib/sample-data.ts`) using the shared
  `@stint/core` `Provider` type, so the app renders with **zero backend**.
- Prices rendered with `formatPrice` from `@stint/core` — the same money logic the
  web app uses.

## Next increments

- **Live data:** swap `sample-data` for a Supabase fetch (set `EXPO_PUBLIC_SUPABASE_URL`
  / `EXPO_PUBLIC_SUPABASE_ANON_KEY`) once the shared query layer lands.
- **Auth:** Supabase OAuth + deep links. **Payments:** `@stripe/stripe-react-native`
  PaymentSheet (Apple Pay) hitting the existing `/api/payments/intent`.

## Monorepo / pnpm note

Metro is configured for the workspace (`metro.config.js` watches the repo root). If
Metro ever fails to resolve a hoisted dependency, add a repo‑root `.npmrc` with
`node-linker=hoisted` and reinstall — see the
[Expo monorepo guide](https://docs.expo.dev/guides/monorepos/).
