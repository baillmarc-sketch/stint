import "server-only";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

/**
 * Demo message persistence — per-booking threads kept in a cookie. Mirrors the
 * planned `messages`/`message_threads` tables; swaps to Supabase when wired.
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

export async function getThread(bookingId: string): Promise<StoredMessage[]> {
  return (await readAll())[bookingId] ?? [];
}

export async function appendMessages(
  bookingId: string,
  messages: Array<{ sender: MessageSender; body: string }>,
): Promise<StoredMessage[]> {
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
