/** Shared filter option lists + URL-param parsing for category/search pages. */
import type { SearchFilters } from "@/lib/queries";
import type { SortValue } from "@/lib/constants";
import { SORT_OPTIONS } from "@/lib/constants";

export const PRICE_OPTIONS = [
  { label: "Any price", value: "" },
  { label: "Under $250", value: "0-25000" },
  { label: "$250 – $500", value: "25000-50000" },
  { label: "$500 – $1,000", value: "50000-100000" },
  { label: "$1,000+", value: "100000-" },
] as const;

export const RATING_OPTIONS = [
  { label: "Any rating", value: "" },
  { label: "4.5+ stars", value: "4.5" },
  { label: "4.8+ stars", value: "4.8" },
] as const;

const SORT_VALUES = new Set(SORT_OPTIONS.map((o) => o.value));

function parsePrice(value?: string): { minPriceCents?: number; maxPriceCents?: number } {
  if (!value) return {};
  const [min, max] = value.split("-");
  return {
    minPriceCents: min ? Number(min) : undefined,
    maxPriceCents: max ? Number(max) : undefined,
  };
}

export type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Turn URL search params into typed SearchFilters. `categorySlug` can be pinned. */
export function parseFilters(params: RawParams, pinnedCategory?: string): SearchFilters {
  const sortRaw = first(params.sort);
  const sort: SortValue = sortRaw && SORT_VALUES.has(sortRaw as SortValue)
    ? (sortRaw as SortValue)
    : "recommended";

  return {
    categorySlug: pinnedCategory ?? first(params.category) ?? undefined,
    neighborhood: first(params.neighborhood) || undefined,
    query: first(params.q) || undefined,
    minRating: first(params.rating) ? Number(first(params.rating)) : undefined,
    instantBook: first(params.instant) === "1",
    sort,
    ...parsePrice(first(params.price)),
  };
}
