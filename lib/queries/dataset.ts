/**
 * In-repo dataset implementation of the data-access layer.
 *
 * This is the zero-config demo backend: it reads the NYC dataset in `lib/data`
 * and powers the app when Supabase isn't configured. The Supabase backend in
 * `./supabase.ts` mirrors these signatures exactly.
 */
import type { Category, Provider } from "@/types/domain";
import {
  CATEGORIES,
  LISTING_INDEX,
  LISTINGS_WITH_PROVIDER,
  PROVIDER_BY_SLUG,
  PROVIDERS,
} from "@/lib/data";
import { CATEGORY_BY_ID, CATEGORY_BY_SLUG } from "@/lib/data/categories";
import { matchesFilters, score, sortResults, type ListingResult, type SearchFilters } from "./types";

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
  const categoryId = filters.categorySlug ? CATEGORY_BY_SLUG.get(filters.categorySlug)?.id : undefined;
  const results = LISTINGS_WITH_PROVIDER.filter((r) => matchesFilters(r, filters, categoryId));
  return sortResults(results, filters.sort ?? "recommended");
}

/** Distinct neighborhoods present in the active market (for the filter dropdown). */
export async function getNeighborhoods(): Promise<string[]> {
  return Array.from(new Set(PROVIDERS.filter((p) => p.isPublished).map((p) => p.neighborhood))).sort();
}
