import { NextResponse } from "next/server";
import { z } from "zod";
import { canTransition } from "@/lib/booking/state-machine";
import { getPaymentProvider } from "@/lib/payments";
import { getStoredBooking, updateStoredBooking, type StoredBooking } from "@/lib/bookings-store";
import type { BookingStatus, PaymentStatus } from "@/types/domain";

const bodySchema = z.object({
  action: z.enum(["accept", "decline", "quote", "complete", "cancel"]),
});

const ACTION_TO_STATUS: Record<string, BookingStatus> = {
  accept: "confirmed",
  decline: "declined",
  quote: "quoted",
  complete: "completed",
  cancel: "cancelled",
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const booking = await getStoredBooking(id);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const target = ACTION_TO_STATUS[parsed.data.action];
  if (!canTransition(booking.status, target)) {
    return NextResponse.json(
      { error: `Cannot ${parsed.data.action} a ${booking.status} booking` },
      { status: 409 },
    );
  }

  // Advance the payment lifecycle alongside the status change.
  const payments = getPaymentProvider();
  const patch: Partial<StoredBooking> = { status: target };

  if (target === "confirmed") {
    if (booking.paymentStatus === "none") {
      // Simulated request-to-book: authorize on acceptance.
      const r = await payments.authorize(booking.price.totalCents, booking.id);
      patch.paymentStatus = r.status;
      patch.paymentRef = r.ref;
    } else if (booking.paymentStatus === "authorized" && booking.paymentRef) {
      // Stripe: a held authorization is captured when the provider accepts.
      const r = await payments.capture(booking.paymentRef);
      patch.paymentStatus = r.status;
    }
  } else if (
    target === "completed" &&
    booking.paymentRef &&
    booking.paymentStatus === "authorized"
  ) {
    const r = await payments.capture(booking.paymentRef);
    patch.paymentStatus = r.status;
  } else if (
    (target === "cancelled" || target === "declined") &&
    booking.paymentRef &&
    booking.paymentStatus === "authorized"
  ) {
    const r = await payments.refund(booking.paymentRef);
    patch.paymentStatus = r.status as PaymentStatus;
  }

  const updated = await updateStoredBooking(id, patch);
  return NextResponse.json({ status: updated?.status });
}
