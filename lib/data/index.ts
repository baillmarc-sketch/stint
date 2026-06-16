import type { Listing, Market, Provider } from "@/types/domain";
import { CATEGORIES } from "./categories";
import { PROVIDERS } from "./providers";

export const MARKETS: Market[] = [
  { id: "mkt-nyc", slug: "nyc", name: "New York City", region: "NY", isActive: true },
  { id: "mkt-la", slug: "la", name: "Los Angeles", region: "CA", isActive: false },
  { id: "mkt-miami", slug: "miami", name: "Miami", region: "FL", isActive: false },
];

export { CATEGORIES };
export { PROVIDERS };

/** Lookups built once at module load. */
export const PROVIDER_BY_SLUG = new Map(PROVIDERS.map((p) => [p.slug, p]));

export const LISTING_INDEX = new Map<string, { listing: Listing; provider: Provider }>();
for (const provider of PROVIDERS) {
  for (const listing of provider.listings) {
    LISTING_INDEX.set(listing.id, { listing, provider });
  }
}

/** All published listings flattened with their provider, for search/browse. */
export const LISTINGS_WITH_PROVIDER: Array<{ listing: Listing; provider: Provider }> =
  Array.from(LISTING_INDEX.values()).filter(({ provider }) => provider.isPublished);
