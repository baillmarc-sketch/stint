import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { getListing } from "@/lib/queries";
import { PAYMENTS_PROVIDER } from "@/lib/constants";

type Params = { listingId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { listingId } = await params;
  const found = await getListing(listingId);
  return { title: found ? `Book ${found.provider.businessName}` : "Book" };
}

export default async function BookPage({ params }: { params: Promise<Params> }) {
  const { listingId } = await params;
  const found = await getListing(listingId);
  if (!found) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
        Book your {found.listing.title.toLowerCase()}
      </h1>
      <BookingWizard
        listing={found.listing}
        provider={found.provider}
        paymentsMode={PAYMENTS_PROVIDER}
        stripePublishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null}
      />
    </div>
  );
}
