import "server-only";
import { cookies } from "next/headers";
import type { Booking } from "@/types/domain";

/**
 * Demo persistence for bookings — stored in an httpOnly cookie so a booking made
 * in the wizard shows up in "My Bookings" and survives reloads, even on Vercel's
 * stateless functions. Swaps to a Supabase `bookings` insert/select once the DB
 * is wired (the shape already mirrors the planned table).
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

export async function getStoredBookings(): Promise<StoredBooking[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredBooking[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getStoredBooking(id: string): Promise<StoredBooking | undefined> {
  return (await getStoredBookings()).find((b) => b.id === id);
}

export async function addStoredBooking(booking: StoredBooking): Promise<void> {
  const existing = await getStoredBookings();
  const next = [booking, ...existing].slice(0, MAX_BOOKINGS);
  (await cookies()).set(COOKIE, JSON.stringify(next), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}
