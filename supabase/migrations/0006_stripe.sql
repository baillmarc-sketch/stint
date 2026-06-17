-- Stint — Stripe Connect fields on providers
-- Applied for live payments (PAYMENTS_PROVIDER=stripe). Safe to run anytime.

alter table providers
  add column if not exists stripe_account_id text,
  add column if not exists stripe_charges_enabled boolean not null default false;
