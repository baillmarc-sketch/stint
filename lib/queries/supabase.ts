/**
 * Supabase implementation of the data-access layer.
 *
 * Reads go through the RLS-aware server client (anon or authed), so public
 * visitors see only published content and signed-in owners see their own — the
 * policies in `0002_rls.sql` do the enforcement, not this code. Signatures match
 * `./dataset.ts` exactly; the barrel in `./index.ts` picks between them.
 */
import "server-only";
import type { Category, Provider } from "@/types/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toCategory, toListing, toProvider } from "@stint/data/mappers";
import type { CategoryRow, ListingRow, ProviderRow } from "@stint/data/db-types";
import { matchesFilters, score, sortResults, type ListingResult, type SearchFilters } from "./types";

// Nested selects used across queries.
const LISTING_EMBED = "*, packages(*), addons(*), media(*)";
const PROVIDER_FULL = `*, listings(${LISTING_EMBED}), reviews(*), availability_rules(*)`;

function fail(label: string, error: { message: string } | null): void {
  if (error) throw new Error(`[queries] ${label}: ${error.message}`);
}

export async function getCategories(): Promise<Category[]> {
  const db = await createSupabaseServerClient();
  const { data, error } = await db.from("categories").select("*").order("sort_order");
  fail("getCategories", error);
  return ((data ?? []) as CategoryRow[]).map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const db = await createSupabaseServerClient();
  const { data } = await db.from("categories").select("*").eq("slug", slug).maybeSingle();
  return data ? toCategory(data as CategoryRow) : undefined;
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  const db = await createSupabaseServerClient();
  const { data } = await db.from("categories").select("*").eq("id", id).maybeSingle();
  return data ? toCategory(data as CategoryRow) : undefined;
}

export async function getProviderBySlug(slug: string): Promise<Provider | undefined> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("providers")
    .select(PROVIDER_FULL)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return data ? toProvider(data as unknown as ProviderRow) : undefined;
}

export async function getListing(listingId: string): Promise<ListingResult | undefined> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("listings")
    .select(`${LISTING_EMBED}, providers!inner(*)`)
    .eq("id", listingId)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return undefined;
  const row = data as unknown as ListingRow & { providers: ProviderRow };
  if (!row.providers?.is_published) return undefined;
  return { listing: toListing(row), provider: toProvider(row.providers) };
}

export async function getFeaturedProviders(limit = 8): Promise<Provider[]> {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from("providers")
    .select(`*, listings(${LISTING_EMBED})`)
    .eq("is_published", true);
  fail("getFeaturedProviders", error);
  const providers = ((data ?? []) as unknown as ProviderRow[]).map(toProvider);
  return providers.sort((a, b) => score(b) - score(a)).slice(0, limit);
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const db = await createSupabaseServerClient();
  const { data, error } = await db.from("providers").select("category_id").eq("is_published", true);
  fail("getCategoryCounts", error);
  const counts: Record<string, number> = {};
  for (const r of (data ?? []) as Array<{ category_id: string | null }>) {
    if (r.category_id) counts[r.category_id] = (counts[r.category_id] ?? 0) + 1;
  }
  return counts;
}

export async function searchListings(filters: SearchFilters): Promise<ListingResult[]> {
  const db = await createSupabaseServerClient();
  const categoryId = filters.categorySlug ? (await getCategoryBySlug(filters.categorySlug))?.id : undefined;

  const { data, error } = await db
    .from("listings")
    .select(`${LISTING_EMBED}, providers!inner(*)`)
    .eq("is_published", true);
  fail("searchListings", error);

  const rows = (data ?? []) as unknown as Array<ListingRow & { providers: ProviderRow }>;
  const results: ListingResult[] = rows
    .filter((r) => r.providers?.is_published)
    .map((r) => ({ listing: toListing(r), provider: toProvider(r.providers) }));

  return sortResults(
    results.filter((r) => matchesFilters(r, filters, categoryId)),
    filters.sort ?? "recommended",
  );
}

export async function getNeighborhoods(): Promise<string[]> {
  const db = await createSupabaseServerClient();
  const { data, error } = await db.from("providers").select("neighborhood").eq("is_published", true);
  fail("getNeighborhoods", error);
  const set = new Set(
    ((data ?? []) as Array<{ neighborhood: string | null }>)
      .map((r) => r.neighborhood)
      .filter((n): n is string => Boolean(n)),
  );
  return Array.from(set).sort();
}
