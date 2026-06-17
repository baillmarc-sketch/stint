/**
 * Client-agnostic catalog reads. Pass any Supabase client (the web server client,
 * or the native app's anon client) — RLS decides visibility. Returns domain models
 * via the shared mappers, so web and mobile read identical shapes.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookingSummary, Category, Provider } from "@stint/core";
import { toBookingSummary, toCategory, toProvider } from "./mappers";
import type { BookingRow, CategoryRow, ProviderRow } from "./db-types";

const LISTING_EMBED = "*, packages(*), addons(*), media(*)";
const PROVIDER_FULL = `*, listings(${LISTING_EMBED}), reviews(*), availability_rules(*)`;

export async function fetchCategories(db: SupabaseClient): Promise<Category[]> {
  const { data, error } = await db.from("categories").select("*").order("sort_order");
  if (error) throw new Error(`[data] fetchCategories: ${error.message}`);
  return ((data ?? []) as CategoryRow[]).map(toCategory);
}

/** Published providers with their listings, for the browse/list surface. */
export async function fetchPublishedProviders(db: SupabaseClient, limit = 50): Promise<Provider[]> {
  const { data, error } = await db
    .from("providers")
    .select(`*, listings(${LISTING_EMBED})`)
    .eq("is_published", true);
  if (error) throw new Error(`[data] fetchPublishedProviders: ${error.message}`);
  return ((data ?? []) as unknown as ProviderRow[]).map(toProvider).slice(0, limit);
}

/** A single published provider with full detail (listings, packages, reviews, etc.). */
export async function fetchProviderBySlug(
  db: SupabaseClient,
  slug: string,
): Promise<Provider | undefined> {
  const { data } = await db
    .from("providers")
    .select(PROVIDER_FULL)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return data ? toProvider(data as unknown as ProviderRow) : undefined;
}

/** The signed-in customer's bookings (RLS scopes to their own rows). */
export async function fetchMyBookings(db: SupabaseClient): Promise<BookingSummary[]> {
  const { data, error } = await db
    .from("bookings")
    .select("*, providers(slug, business_name, avatar_url), listings(title)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`[data] fetchMyBookings: ${error.message}`);
  return ((data ?? []) as unknown as BookingRow[]).map(toBookingSummary);
}

export interface MyProvider {
  id: string;
  slug: string;
  businessName: string;
}

/** The provider storefront owned by `ownerId`, if any. */
export async function fetchMyProvider(
  db: SupabaseClient,
  ownerId: string,
): Promise<MyProvider | null> {
  const { data } = await db
    .from("providers")
    .select("id, slug, business_name")
    .eq("owner_id", ownerId)
    .maybeSingle();
  return data
    ? { id: data.id as string, slug: data.slug as string, businessName: data.business_name as string }
    : null;
}

/** Bookings for a provider the caller owns (RLS: is_provider_owner). */
export async function fetchProviderBookings(
  db: SupabaseClient,
  providerId: string,
): Promise<BookingSummary[]> {
  const { data, error } = await db
    .from("bookings")
    .select("*, providers(slug, business_name, avatar_url), listings(title)")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`[data] fetchProviderBookings: ${error.message}`);
  return ((data ?? []) as unknown as BookingRow[]).map(toBookingSummary);
}
