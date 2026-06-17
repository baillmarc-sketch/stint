import { NextResponse } from "next/server";
import { createBookingSchema } from "@/lib/validations/booking";
import { getListing } from "@/lib/queries";
import { computeQuote } from "@/lib/booking/pricing";
import { createConnectPaymentIntent } from "@/lib/payments";
import { isStripeEnabled } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOptionalUser } from "@/lib/auth";

/**
 * Create a Connect PaymentIntent for a prospective booking. The client mounts the
 * inline PaymentElement with the returned client secret; the booking row is only
 * written by POST /api/bookings once the card is confirmed.
 */
export async function POST(request: Request) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "Online payments are not enabled." }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Payments require a connected database." }, { status: 400 });
  }
  if (!(await getOptionalUser())) {
    return NextResponse.json({ error: "Please sign in to book." }, { status: 401 });
  }

  const parsed = createBookingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid booking" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const found = await getListing(input.listingId);
  if (!found) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const { price } = computeQuote({
    listing: found.listing,
    packageId: input.packageId ?? null,
    addonSelections: input.addonSelections,
    durationHours: input.durationHours,
    guestCount: input.guestCount,
  });

  // Read the provider's Connect account with the service-role client so the
  // account id never leaves the server.
  const admin = createSupabaseAdminClient();
  const { data: prov } = await admin
    .from("providers")
    .select("stripe_account_id, stripe_charges_enabled")
    .eq("id", found.provider.id)
    .maybeSingle();

  if (!prov?.stripe_account_id || !prov.stripe_charges_enabled) {
    return NextResponse.json(
      { error: "This provider isn't accepting online payments yet." },
      { status: 400 },
    );
  }

  try {
    const intent = await createConnectPaymentIntent({
      amountCents: price.totalCents,
      applicationFeeCents: price.serviceFeeCents,
      destinationAccountId: prov.stripe_account_id as string,
      metadata: { listingId: found.listing.id, providerId: found.provider.id },
    });
    return NextResponse.json({ clientSecret: intent.clientSecret });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not start payment";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
