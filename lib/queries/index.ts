/**
 * Data-access layer — public entry point.
 *
 * Every function is async and returns plain view models. When Supabase is
 * configured the queries hit Postgres (RLS-aware); otherwise they read the
 * in-repo NYC dataset. The two backends share signatures, so no page or
 * component changes when the data source flips.
 */
import { isSupabaseConfigured } from "@/lib/supabase/config";
import * as dataset from "./dataset";
import * as supabase from "./supabase";

export type { SearchFilters, ListingResult } from "./types";

const impl = () => (isSupabaseConfigured() ? supabase : dataset);

export const getCategories: typeof dataset.getCategories = (...a) => impl().getCategories(...a);
export const getCategoryBySlug: typeof dataset.getCategoryBySlug = (...a) => impl().getCategoryBySlug(...a);
export const getCategoryById: typeof dataset.getCategoryById = (...a) => impl().getCategoryById(...a);
export const getProviderBySlug: typeof dataset.getProviderBySlug = (...a) => impl().getProviderBySlug(...a);
export const getListing: typeof dataset.getListing = (...a) => impl().getListing(...a);
export const getFeaturedProviders: typeof dataset.getFeaturedProviders = (...a) => impl().getFeaturedProviders(...a);
export const getCategoryCounts: typeof dataset.getCategoryCounts = (...a) => impl().getCategoryCounts(...a);
export const searchListings: typeof dataset.searchListings = (...a) => impl().searchListings(...a);
export const getNeighborhoods: typeof dataset.getNeighborhoods = (...a) => impl().getNeighborhoods(...a);
