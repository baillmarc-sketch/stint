/** Shared types for the data-access layer (both dataset + Supabase backends). */
import type { Listing, Provider } from "@/types/domain";
import type { SortValue } from "@/lib/constants";

export interface SearchFilters {
  categorySlug?: string;
  neighborhood?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  minRating?: number;
  instantBook?: boolean;
  query?: string;
  sort?: SortValue;
}

export interface ListingResult {
  listing: Listing;
  provider: Provider;
}

/** Recommendation score: rating weighted by review volume + a nudge for instant-book. */
export function score(p: Provider): number {
  return p.ratingAvg * Math.log10(p.ratingCount + 10) + (p.instantBook ? 0.15 : 0);
}

/** Shared JS sort used by both backends so ordering is identical regardless of source. */
export function sortResults(results: ListingResult[], sort: SortValue): ListingResult[] {
  const arr = [...results];
  switch (sort) {
    case "rating":
      return arr.sort((a, b) => b.provider.ratingAvg - a.provider.ratingAvg);
    case "price_asc":
      return arr.sort((a, b) => a.listing.basePriceCents - b.listing.basePriceCents);
    case "price_desc":
      return arr.sort((a, b) => b.listing.basePriceCents - a.listing.basePriceCents);
    case "recommended":
    default:
      return arr.sort((a, b) => score(b.provider) - score(a.provider));
  }
}

/** Pure, source-agnostic filter predicate so dataset + DB results match exactly. */
export function matchesFilters({ listing, provider }: ListingResult, filters: SearchFilters, categoryId?: string): boolean {
  if (categoryId && listing.categoryId !== categoryId) return false;
  if (filters.neighborhood && provider.neighborhood !== filters.neighborhood) return false;
  if (filters.instantBook && !listing.instantBook) return false;
  if (filters.minRating && provider.ratingAvg < filters.minRating) return false;
  if (filters.minPriceCents != null && listing.basePriceCents < filters.minPriceCents) return false;
  if (filters.maxPriceCents != null && listing.basePriceCents > filters.maxPriceCents) return false;
  const q = filters.query?.trim().toLowerCase();
  if (q) {
    const haystack =
      `${listing.title} ${listing.description} ${provider.businessName} ${provider.tagline} ${provider.bio} ${provider.neighborhood}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}
