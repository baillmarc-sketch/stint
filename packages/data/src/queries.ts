/**
 * Client-agnostic catalog reads. Pass any Supabase client (the web server client,
 * or the native app's anon client) — RLS decides visibility. Returns domain models
 * via the shared mappers, so web and mobile read identical shapes.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AvailabilitySlot, BookingSummary, Category, Provider } from "@stint/core";
import { toAvailabilitySlot, toBookingSummary, toCategory, toProvider } from "./mappers";
import type {
  AvailabilitySlotRow,
  BookingRow,
  CategoryRow,
  MessageRow,
  ProviderRow,
} from "./db-types";

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

/** A provider owner's own upcoming slots (RLS: owner). */
export async function fetchProviderSlots(
  db: SupabaseClient,
  providerId: string,
): Promise<AvailabilitySlot[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await db
    .from("availability_slots")
    .select("*")
    .eq("provider_id", providerId)
    .gte("slot_date", today)
    .order("slot_date")
    .order("start_time");
  if (error) throw new Error(`[data] fetchProviderSlots: ${error.message}`);
  return ((data ?? []) as AvailabilitySlotRow[]).map(toAvailabilitySlot);
}

/** Publish a bookable slot (owner-only write enforced by RLS). */
export async function addProviderSlot(
  db: SupabaseClient,
  providerId: string,
  slot: { date: string; startTime: string; endTime: string },
): Promise<void> {
  const { error } = await db.from("availability_slots").insert({
    provider_id: providerId,
    slot_date: slot.date,
    start_time: slot.startTime,
    end_time: slot.endTime,
  });
  if (error) throw new Error(`[data] addProviderSlot: ${error.message}`);
}

/** Remove an unbooked slot (owner-only write enforced by RLS). */
export async function deleteProviderSlot(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("availability_slots").delete().eq("id", id).eq("is_booked", false);
  if (error) throw new Error(`[data] deleteProviderSlot: ${error.message}`);
}

export interface ThreadMessage {
  id: string;
  senderId: string | null;
  kind: "text" | "system" | "quote";
  body: string;
  createdAt: string;
}

/** Messages on a booking's thread (RLS scopes to participants; empty if no thread yet). */
export async function fetchBookingMessages(
  db: SupabaseClient,
  bookingId: string,
): Promise<ThreadMessage[]> {
  const { data: thread } = await db
    .from("message_threads")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (!thread) return [];
  const { data } = await db
    .from("messages")
    .select("*")
    .eq("thread_id", (thread as { id: string }).id)
    .order("created_at", { ascending: true });
  return ((data ?? []) as MessageRow[]).map((m) => ({
    id: m.id,
    senderId: m.sender_id,
    kind: m.kind,
    body: m.body,
    createdAt: m.created_at,
  }));
}
