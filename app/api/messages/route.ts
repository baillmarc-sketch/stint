import { NextResponse } from "next/server";
import { z } from "zod";
import { getStoredBooking } from "@/lib/bookings-store";
import { appendMessages, type MessageSender } from "@/lib/messages-store";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const bodySchema = z.object({
  bookingId: z.string().min(1),
  body: z.string().min(1).max(1000),
});

// A light canned reply so the demo thread feels alive without a real provider.
const REPLIES = [
  "Thanks so much! I've got you down — I'll follow up with a couple quick details.",
  "Sounds great, looking forward to it! Anything special you'd like me to prep?",
  "Got it 🙌 I'll make sure everything's ready for your event.",
];

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const booking = await getStoredBooking(parsed.data.bookingId);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Live mode: persist just the participant's real message (no fabricated reply —
  // the provider answers for themselves). Demo mode: add a canned reply so the
  // thread feels alive without a real counterparty.
  const outgoing: Array<{ sender: MessageSender; body: string }> = [
    { sender: "customer", body: parsed.data.body },
  ];
  if (!isSupabaseConfigured()) {
    outgoing.push({ sender: "provider", body: REPLIES[Math.floor(Math.random() * REPLIES.length)] });
  }

  const messages = await appendMessages(parsed.data.bookingId, outgoing);
  return NextResponse.json({ messages });
}
