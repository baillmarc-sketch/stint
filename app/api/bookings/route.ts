import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createBookingSchema } from "@stint/core/validations/booking";
import { getListing } from "@/lib/queries";
import { computeQuote } from "@stint/core/booking/pricing";
import { initialStatus } from "@stint/core/booking/state-machine";
import { getPaymentProvider, retrievePaymentIntent } from "@/lib/payments";
import { addStoredBooking, type StoredBooking } from "@/lib/bookings-store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isStripeEnabled } from "@/lib/stripe";
import { getOptionalUser } from "@/lib/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // With a live database, bookings are tied to the signed-in customer (RLS).
  // The zero-config demo books anonymously into a cookie.
  if (isSupabaseConfigured() && !(await getOptionalUser())) {
    return NextResponse.json({ error: "Please sign in to book." }, { status: 401 });
  }

  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid booking" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const found = await getListing(input.listingId);
  if (!found) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  const { listing, provider } = found;

  // Re-run pricing server-side so a tampered client payload can't change the total.
  const { price, addonLines } = computeQuote({
    listing,
    packageId: input.packageId ?? null,
    addonSelections: input.addonSelections,
    durationHours: input.durationHours,
    guestCount: input.guestCount,
  });

  const isInstant = listing.instantBook;
  const status = initialStatus(isInstant);

  let paymentStatus: StoredBooking["paymentStatus"] = "none";
  let paymentRef: string | null = null;

  if (isStripeEnabled()) {
    // Card was authorized client-side via the PaymentElement — verify the
    // PaymentIntent matches the server-computed total, then attach it.
    if (!input.paymentIntentId) {
      return NextResponse.json({ error: "Payment is required to book." }, { status: 400 });
    }
    const pi = await retrievePaymentIntent(input.paymentIntentId);
    if (pi.amount !== price.totalCents) {
      return NextResponse.json({ error: "Payment amount mismatch." }, { status: 400 });
    }
    if (pi.status !== "requires_capture" && pi.status !== "succeeded") {
      return NextResponse.json({ error: "Payment was not completed." }, { status: 400 });
    }
    paymentRef = pi.id;
    paymentStatus = "authorized";
    // Instant bookings are confirmed now, so capture the held funds immediately.
    if (isInstant && pi.status === "requires_capture") {
      const captured = await getPaymentProvider().capture(pi.id);
      paymentStatus = captured.status;
    } else if (pi.status === "succeeded") {
      paymentStatus = "captured";
    }
  } else if (status === "confirmed") {
    // Simulated: authorize server-side only when the booking is instantly confirmed.
    const result = await getPaymentProvider().authorize(price.totalCents, "pending");
    paymentStatus = result.status;
    paymentRef = result.ref;
  }

  const booking: StoredBooking = {
    id: `bk_${nanoid(12)}`,
    providerId: provider.id,
    providerSlug: provider.slug,
    providerName: provider.businessName,
    providerAvatarUrl: provider.avatarUrl,
    listingId: listing.id,
    listingTitle: listing.title,
    packageId: input.packageId ?? null,
    status,
    paymentStatus,
    paymentRef,
    isInstant,
    eventDate: input.eventDate,
    startTime: input.startTime,
    durationHours: input.durationHours,
    guestCount: input.guestCount,
    eventAddress: input.eventAddress,
    eventNeighborhood: input.eventNeighborhood,
    notes: input.notes,
    addons: addonLines,
    price,
    createdAt: new Date().toISOString(),
  };

  const stored = await addStoredBooking(booking);

  return NextResponse.json({ bookingId: stored.id, status });
}
