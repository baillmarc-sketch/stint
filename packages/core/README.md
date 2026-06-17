# @stint/core

Framework-free domain logic shared by every Stint front-end — the Next.js **web**
app today, the Expo **iOS/Android** app next. Pure TypeScript only: no React, no
Next, no Supabase, so it imports cleanly into a React Native bundle.

## Contents
- `types/domain` — the canonical domain model (camelCase view models, integer cents).
- `booking/pricing` — `computeQuote` (the single source of truth for booking math).
- `booking/state-machine` — allowed booking transitions + `initialStatus`.
- `validations/booking` — Zod schemas (`createBookingSchema`) for request payloads.
- `config` — `SERVICE_FEE_PCT` (env-driven, RN-safe).

## Usage
```ts
import { computeQuote } from "@stint/core/booking/pricing";
import type { Listing } from "@stint/core/types";
```

The web app re-exports the types from `@/types/domain` for backwards-compat, and
`SERVICE_FEE_PCT` from `@/lib/constants`. Next compiles this package directly from
source via `transpilePackages: ["@stint/core"]` — there's no build step.

Tests live next to their modules (`*.test.ts`) and run from the repo-root Vitest.
