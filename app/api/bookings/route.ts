import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createBookingSchema } from "@/lib/validations/booking";
import { getListing } from "@/lib/queries";
import { computeQuote } from "@/lib/booking/pricing";
import { initialStatus } from "@/lib/booking/state-machine";
import { getPaymentProvider } from "@/lib/payments";
import { addStoredBooking, type StoredBooking } from "@/lib/bookings-store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
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

  // Authorize via the (simulated) payment provider only when the booking is confirmed.
  let paymentStatus: StoredBooking["paymentStatus"] = "none";
  let paymentRef: string | null = null;
  if (status === "confirmed") {
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
