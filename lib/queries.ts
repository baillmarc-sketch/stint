/**
 * Data-access layer.
 *
 * Every function is async and returns plain view models, so the in-memory demo
 * dataset can later be swapped for Supabase queries (see project plan) without
 * touching any page or component.
 */
import type { Category, Listing, Provider } from "@/types/domain";
import {
  CATEGORIES,
  LISTING_INDEX,
  LISTINGS_WITH_PROVIDER,
  PROVIDER_BY_SLUG,
  PROVIDERS,
} from "@/lib/data";
import { CATEGORY_BY_ID, CATEGORY_BY_SLUG } from "@/lib/data/categories";
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

export async function getCategories(): Promise<Category[]> {
  return [...CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return CATEGORY_BY_SLUG.get(slug);
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  return CATEGORY_BY_ID.get(id);
}

export async function getProviderBySlug(slug: string): Promise<Provider | undefined> {
  const p = PROVIDER_BY_SLUG.get(slug);
  return p?.isPublished ? p : undefined;
}

export async function getListing(listingId: string): Promise<ListingResult | undefined> {
  const found = LISTING_INDEX.get(listingId);
  return found?.provider.isPublished ? found : undefined;
}

/** A handful of standout providers for the homepage rail. */
export async function getFeaturedProviders(limit = 8): Promise<Provider[]> {
  return [...PROVIDERS]
    .filter((p) => p.isPublished)
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}

/** Per-category counts for browse tiles. */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const p of PROVIDERS) {
    if (!p.isPublished) continue;
    counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1;
  }
  return counts;
}

/** The core search used by category + search pages. Operates on listings. */
export async function searchListings(filters: SearchFilters): Promise<ListingResult[]> {
  const q = filters.query?.trim().toLowerCase();
  const categoryId = filters.categorySlug
    ? CATEGORY_BY_SLUG.get(filters.categorySlug)?.id
    : undefined;

  let results = LISTINGS_WITH_PROVIDER.filter(({ listing, provider }) => {
    if (categoryId && listing.categoryId !== categoryId) return false;
    if (filters.neighborhood && provider.neighborhood !== filters.neighborhood) return false;
    if (filters.instantBook && !listing.instantBook) return false;
    if (filters.minRating && provider.ratingAvg < filters.minRating) return false;
    if (filters.minPriceCents != null && listing.basePriceCents < filters.minPriceCents) return false;
    if (filters.maxPriceCents != null && listing.basePriceCents > filters.maxPriceCents) return false;
    if (q) {
      const haystack =
        `${listing.title} ${listing.description} ${provider.businessName} ${provider.tagline} ${provider.bio} ${provider.neighborhood}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  results = sortResults(results, filters.sort ?? "recommended");
  return results;
}

function sortResults(results: ListingResult[], sort: SortValue): ListingResult[] {
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

/** Recommendation score: rating weighted by review volume + a nudge for instant-book. */
function score(p: Provider): number {
  return p.ratingAvg * Math.log10(p.ratingCount + 10) + (p.instantBook ? 0.15 : 0);
}

/** Distinct neighborhoods present in the active market (for the filter dropdown). */
export async function getNeighborhoods(): Promise<string[]> {
  return Array.from(new Set(PROVIDERS.filter((p) => p.isPublished).map((p) => p.neighborhood))).sort();
}
