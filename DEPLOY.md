# Deploying Stint

The demo runs with **zero configuration** (it renders the in-repo NYC dataset).
Follow this to add real Google SSO + a Supabase-backed database and ship a
shareable URL on Vercel. ~20–30 minutes.

## 1. Create a Supabase project
1. Go to <https://supabase.com> → **New project** (pick a region near NYC, e.g. `us-east-1`).
2. **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## 2. Apply the schema
Using the Supabase CLI (recommended):
```bash
npx supabase link --project-ref <your-ref>
npx supabase db push        # applies supabase/migrations/*.sql
```
Or paste each file in `supabase/migrations/` into the **SQL Editor** in order
(`0001_init` → `0002_rls` → `0003_functions`).

## 3. Enable Google sign-in
1. **Google Cloud Console** → create an OAuth 2.0 **Web** client.
   - Authorized redirect URI: `https://<your-ref>.supabase.co/auth/v1/callback`
2. In Supabase: **Authentication → Providers → Google** → paste the client ID/secret, enable.
3. In Supabase: **Authentication → URL Configuration** → set Site URL to your domain and
   add `http://localhost:3000/auth/callback` + `https://<your-vercel-domain>/auth/callback`
   to the redirect allowlist.

## 4. Seed the NYC content
Create `.env` from `.env.example`, fill the three Supabase values, then:
```bash
pnpm seed     # inserts markets, categories, providers, listings, reviews
```

## 5. Deploy to Vercel
1. Import the repo at <https://vercel.com/new> (Next.js is auto-detected).
2. Add Environment Variables (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = your Vercel URL
   - `NEXT_PUBLIC_SERVICE_FEE_PCT` = `0.12`
   - `PAYMENTS_PROVIDER` = `simulated`
3. Deploy. Your shareable demo URL is the Vercel production domain.

## 6. Real payments (Stripe Connect, test mode) — optional
Payments stay **simulated** until you opt in. To take real test-mode card payments:
1. In Stripe (test mode): **Connect → enable Express**, then grab **Developers → API keys**.
2. Apply the Stripe migration: `pnpm db:push` (adds `providers.stripe_account_id`).
3. Set env (locally and/or in Vercel):
   - `PAYMENTS_PROVIDER=stripe`
   - `STRIPE_SECRET_KEY=sk_test_…`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…`
   - `STRIPE_WEBHOOK_SECRET=whsec_…`
4. Webhook → `/.../api/webhooks/stripe`, events `payment_intent.*` + `account.updated`.
   Locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
5. As a provider, open **Dashboard → Payouts → Connect with Stripe** and finish Express
   onboarding. Then book that provider and pay with test card `4242 4242 4242 4242`.

How it works: the inline **PaymentElement** authorizes a Connect **destination charge**
(`application_fee_amount` = our service fee). Instant-book captures immediately;
request-to-book holds the authorization and captures when the provider accepts. Webhooks
reconcile `payment_status`. See `lib/payments.ts`, `app/api/payments/intent`, and
`app/api/webhooks/stripe`.

## Notes
- Generate DB types anytime with `pnpm db:types` (writes `types/database.types.ts`).
