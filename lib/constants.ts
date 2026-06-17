/** App-wide constants and business config. */

export const SITE = {
  name: "Stint",
  tagline: "Entertainment delivered to you — from clowns to hibachi and cleanup too.",
  shortPitch:
    "Book vetted chefs, performers, bartenders, and event crews who come to you. One place to browse, compare, and book.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/**
 * Marketplace economics. Surfaced as a checkout line item even while payments are
 * simulated, so the revenue model is visible in the demo. The canonical value lives
 * in `@stint/core` (shared with the mobile app); re-exported here for convenience.
 */
export { SERVICE_FEE_PCT } from "@stint/core/config";
/** Provider-side commission — used for the "you'll earn" narrative on the provider side. */
export const PROVIDER_COMMISSION_PCT = 0.1;

export const PAYMENTS_PROVIDER = process.env.PAYMENTS_PROVIDER ?? "simulated";

/** Launch market for the demo. Additional metros exist but are gated inactive. */
export const ACTIVE_MARKET_SLUG = "nyc";

export const NYC_NEIGHBORHOODS = [
  "Williamsburg",
  "Astoria",
  "Park Slope",
  "Upper East Side",
  "Upper West Side",
  "Lower East Side",
  "Harlem",
  "Long Island City",
  "Bushwick",
  "Greenpoint",
  "West Village",
  "Chelsea",
  "Tribeca",
  "Bed-Stuy",
  "Crown Heights",
  "Forest Hills",
  "DUMBO",
  "Financial District",
] as const;

export const GUEST_COUNT_OPTIONS = [
  { label: "1–10 guests", value: 10 },
  { label: "11–25 guests", value: 25 },
  { label: "26–50 guests", value: 50 },
  { label: "51–100 guests", value: 100 },
  { label: "100+ guests", value: 150 },
] as const;

export const PRICE_FILTER_BOUNDS = { min: 0, max: 2000 } as const;

export const SORT_OPTIONS = [
  { label: "Recommended", value: "recommended" },
  { label: "Top rated", value: "rating" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const MAIN_NAV = [
  { label: "Browse", href: "/browse" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Become a provider", href: "/#for-providers" },
] as const;
