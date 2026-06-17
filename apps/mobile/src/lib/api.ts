import { supabase } from "./supabase";

/** The Stint web backend the native app calls for payments + bookings. */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.EXPO_PUBLIC_WEB_URL ??
  "https://stint-ten.vercel.app";

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return headers;
}

export async function createPaymentIntent(body: unknown): Promise<{ clientSecret: string }> {
  const res = await fetch(`${API_URL}/api/payments/intent`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not start payment");
  return data as { clientSecret: string };
}

export async function createBooking(body: unknown): Promise<{ bookingId: string }> {
  const res = await fetch(`${API_URL}/api/bookings`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not book");
  return data as { bookingId: string };
}

/** Provider action on a booking (accept/decline/quote/complete/cancel). */
export async function transitionBooking(id: string, action: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/bookings/${id}/transition`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Could not update booking");
  }
}
