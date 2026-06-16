import { NextResponse } from "next/server";
import { z } from "zod";
import { getStoredBooking } from "@/lib/bookings-store";
import { appendMessages } from "@/lib/messages-store";

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

  const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
  const messages = await appendMessages(parsed.data.bookingId, [
    { sender: "customer", body: parsed.data.body },
    { sender: "provider", body: reply },
  ]);

  return NextResponse.json({ messages });
}
