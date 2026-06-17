import "server-only";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getBearerToken } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MessageRow, MessageThreadRow } from "@stint/data/db-types";

/**
 * Per-booking message threads.
 *
 * In DB mode messages live in `messages` under a `message_threads` row keyed by
 * booking. The thread is created lazily via the service-role client (there is no
 * thread INSERT policy — threads are system-owned), but each message is inserted
 * by the authed participant so the `messages` RLS still applies. Otherwise the
 * demo keeps threads in a cookie.
 */
const COOKIE = "stint_messages";
const MAX_PER_THREAD = 12;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export type MessageSender = "customer" | "provider" | "system";

export interface StoredMessage {
  id: string;
  sender: MessageSender;
  body: string;
  createdAt: string;
}

type ThreadMap = Record<string, StoredMessage[]>;

function senderFor(m: MessageRow, customerId: string | null): MessageSender {
  if (m.kind === "system") return "system";
  if (customerId && m.sender_id === customerId) return "customer";
  return "provider";
}

// ---------- Cookie fallback ----------

async function readAll(): Promise<ThreadMap> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as ThreadMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// ---------- DB helpers ----------

/** The thread for a booking, scoped by RLS to participants (or null). */
async function getThreadRow(bookingId: string): Promise<MessageThreadRow | null> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("message_threads")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();
  return (data as MessageThreadRow | null) ?? null;
}

/** Find or lazily create the thread for a booking the current user participates in. */
async function ensureThread(bookingId: string): Promise<MessageThreadRow | null> {
  const existing = await getThreadRow(bookingId);
  if (existing) return existing;

  // Verify participation + grab the parties via an RLS-scoped read of the booking.
  const db = await createSupabaseServerClient();
  const { data: booking } = await db
    .from("bookings")
    .select("id, customer_id, provider_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return null;

  const admin = createSupabaseAdminClient();
  const { data: created } = await admin
    .from("message_threads")
    .insert({
      booking_id: bookingId,
      customer_id: booking.customer_id,
      provider_id: booking.provider_id,
    })
    .select("*")
    .single();
  return (created as MessageThreadRow | null) ?? null;
}

// ---------- Public API ----------

export async function getThread(bookingId: string): Promise<StoredMessage[]> {
  if (!isSupabaseConfigured()) return (await readAll())[bookingId] ?? [];

  const thread = await getThreadRow(bookingId);
  if (!thread) return [];
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("messages")
    .select("*")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });
  return ((data ?? []) as MessageRow[])
    .slice(-MAX_PER_THREAD)
    .map((m) => ({ id: m.id, sender: senderFor(m, thread.customer_id), body: m.body, createdAt: m.created_at }));
}

export async function appendMessages(
  bookingId: string,
  messages: Array<{ sender: MessageSender; body: string }>,
): Promise<StoredMessage[]> {
  if (!isSupabaseConfigured()) {
    const all = await readAll();
    const thread = all[bookingId] ?? [];
    for (const m of messages) {
      thread.push({ id: `msg_${nanoid(8)}`, sender: m.sender, body: m.body, createdAt: new Date().toISOString() });
    }
    all[bookingId] = thread.slice(-MAX_PER_THREAD);
    (await cookies()).set(COOKIE, JSON.stringify(all), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: THIRTY_DAYS,
    });
    return all[bookingId];
  }

  const thread = await ensureThread(bookingId);
  if (!thread) throw new Error("Thread not found");

  const db = await createSupabaseServerClient();
  const token = await getBearerToken();
  const {
    data: { user },
  } = token ? await db.auth.getUser(token) : await db.auth.getUser();
  if (!user) throw new Error("Sign in required to message");

  // The authed participant authors their own messages; system notes use kind 'system'.
  const rows = messages.map((m) => ({
    thread_id: thread.id,
    sender_id: m.sender === "system" ? null : user.id,
    kind: m.sender === "system" ? ("system" as const) : ("text" as const),
    body: m.body,
  }));
  const { error } = await db.from("messages").insert(rows);
  if (error) throw new Error(`Could not send message: ${error.message}`);

  return getThread(bookingId);
}
