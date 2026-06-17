import "server-only";
import { cookies } from "next/headers";
import type { Booking } from "@/types/domain";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BookingRow } from "@stint/data/db-types";

/**
 * Booking persistence.
 *
 * When Supabase is configured, bookings live in the `bookings`/`booking_addons`
 * tables: reads are RLS-scoped (a customer sees their own, a provider-owner sees
 * theirs), inserts go through the authed client, and privileged status/payment
 * UPDATEs use the service-role admin client (bookings have no UPDATE policy by
 * design). Otherwise the demo falls back to an httpOnly cookie so a booking made
 * in the wizard still shows up in "My Bookings".
 */
const COOKIE = "stint_bookings";
const MAX_BOOKINGS = 6;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** A booking plus the denormalized display fields we need without a DB join. */
export interface StoredBooking extends Booking {
  providerSlug: string;
  providerName: string;
  providerAvatarUrl: string;
  listingTitle: string;
}

const BOOKING_EMBED =
  "*, providers(slug, business_name, avatar_url), listings(title), booking_addons(*)";

function rowToStored(r: BookingRow): StoredBooking {
  return {
    id: r.id,
    providerId: r.provider_id,
    providerSlug: r.providers?.slug ?? "",
    providerName: r.providers?.business_name ?? "",
    providerAvatarUrl: r.providers?.avatar_url ?? "",
    listingId: r.listing_id,
    listingTitle: r.listings?.title ?? "",
    packageId: r.package_id,
    status: r.status,
    paymentStatus: r.payment_status,
    paymentRef: r.payment_ref,
    isInstant: r.is_instant,
    eventDate: r.event_date,
    startTime: r.start_time,
    durationHours: Number(r.duration_hours),
    guestCount: r.guest_count,
    eventAddress: r.event_address ?? "",
    eventNeighborhood: r.event_neighborhood ?? "",
    notes: r.notes ?? "",
    addons: (r.booking_addons ?? []).map((a) => ({
      addonId: a.addon_id ?? "",
      name: a.name,
      quantity: a.quantity,
      unitPriceCents: a.unit_price_cents,
      lineTotalCents: a.line_total_cents,
    })),
    price: {
      baseCents: r.base_price_cents,
      addonsCents: r.addons_total_cents,
      travelFeeCents: r.travel_fee_cents,
      serviceFeeCents: r.service_fee_cents,
      subtotalCents: r.subtotal_cents,
      totalCents: r.total_cents,
    },
    createdAt: r.created_at,
  };
}

// ---------- Cookie fallback ----------

async function readCookie(): Promise<StoredBooking[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredBooking[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCookie(bookings: StoredBooking[]) {
  return cookies().then((c) =>
    c.set(COOKIE, JSON.stringify(bookings), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: THIRTY_DAYS,
    }),
  );
}

// ---------- Public API ----------

/** The signed-in customer's bookings (DB) or the demo cookie list. */
export async function getStoredBookings(): Promise<StoredBooking[]> {
  if (!isSupabaseConfigured()) return readCookie();
  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return [];
  const { data } = await db
    .from("bookings")
    .select(BOOKING_EMBED)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as BookingRow[]).map(rowToStored);
}

/** A provider-owner's incoming bookings (DB) or the demo cookie list. */
export async function getProviderBookings(providerId: string): Promise<StoredBooking[]> {
  if (!isSupabaseConfigured()) return readCookie();
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("bookings")
    .select(BOOKING_EMBED)
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as BookingRow[]).map(rowToStored);
}

export async function getStoredBooking(id: string): Promise<StoredBooking | undefined> {
  if (!isSupabaseConfigured()) return (await readCookie()).find((b) => b.id === id);
  const db = await createSupabaseServerClient();
  const { data } = await db.from("bookings").select(BOOKING_EMBED).eq("id", id).maybeSingle();
  return data ? rowToStored(data as unknown as BookingRow) : undefined;
}

/**
 * Persist a new booking. In DB mode the customer is the signed-in user (RLS
 * enforces `customer_id = auth.uid()`); the Postgres-generated UUID is returned.
 */
export async function addStoredBooking(booking: StoredBooking): Promise<StoredBooking> {
  if (!isSupabaseConfigured()) {
    const existing = await readCookie();
    await writeCookie([booking, ...existing].slice(0, MAX_BOOKINGS));
    return booking;
  }

  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new Error("Sign in required to book");

  const { data: inserted, error } = await db
    .from("bookings")
    .insert({
      customer_id: user.id,
      provider_id: booking.providerId,
      listing_id: booking.listingId,
      package_id: booking.packageId,
      status: booking.status,
      payment_status: booking.paymentStatus,
      payment_ref: booking.paymentRef,
      is_instant: booking.isInstant,
      event_date: booking.eventDate,
      start_time: booking.startTime,
      duration_hours: booking.durationHours,
      guest_count: booking.guestCount,
      event_address: booking.eventAddress,
      event_neighborhood: booking.eventNeighborhood,
      notes: booking.notes,
      base_price_cents: booking.price.baseCents,
      addons_total_cents: booking.price.addonsCents,
      travel_fee_cents: booking.price.travelFeeCents,
      service_fee_cents: booking.price.serviceFeeCents,
      subtotal_cents: booking.price.subtotalCents,
      total_cents: booking.price.totalCents,
    })
    .select("id")
    .single();
  if (error || !inserted) throw new Error(`Could not create booking: ${error?.message}`);
  const id = inserted.id as string;

  if (booking.addons.length) {
    const { error: addonErr } = await db.from("booking_addons").insert(
      booking.addons.map((a) => ({
        booking_id: id,
        addon_id: a.addonId || null,
        name: a.name,
        quantity: a.quantity,
        unit_price_cents: a.unitPriceCents,
        line_total_cents: a.lineTotalCents,
      })),
    );
    if (addonErr) throw new Error(`Could not save add-ons: ${addonErr.message}`);
  }

  return { ...booking, id };
}

/**
 * Patch a booking's status/payment. In DB mode this is a privileged write via the
 * service-role admin client (the caller is verified upstream by an RLS-scoped read).
 */
export async function updateStoredBooking(
  id: string,
  patch: Partial<Pick<StoredBooking, "status" | "paymentStatus" | "paymentRef">>,
): Promise<StoredBooking | null> {
  if (!isSupabaseConfigured()) {
    const all = await readCookie();
    const idx = all.findIndex((b) => b.id === id);
    if (idx < 0) return null;
    const updated = { ...all[idx], ...patch };
    all[idx] = updated;
    await writeCookie(all);
    return updated;
  }

  const snake: Record<string, unknown> = {};
  if (patch.status !== undefined) snake.status = patch.status;
  if (patch.paymentStatus !== undefined) snake.payment_status = patch.paymentStatus;
  if (patch.paymentRef !== undefined) snake.payment_ref = patch.paymentRef;

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("bookings").update(snake).eq("id", id);
  if (error) throw new Error(`Could not update booking: ${error.message}`);
  return (await getStoredBooking(id)) ?? null;
}
