import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarDays,
  Check,
  Clock,
  MapPin,
  MessageCircle,
  PartyPopper,
  Users,
} from "lucide-react";
import { getStoredBooking } from "@/lib/bookings-store";
import { getListing } from "@/lib/queries";
import { StatusBadge } from "@/components/booking/status-badge";
import { PriceBreakdownList } from "@/components/booking/price-breakdown";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Your booking" };

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const booking = await getStoredBooking(id);
  if (!booking) notFound();

  const sp = await searchParams;
  const isNew = sp.new === "1";
  const found = await getListing(booking.listingId);
  const listing = found?.listing;

  const pkg = booking.packageId
    ? listing?.packages.find((p) => p.id === booking.packageId)
    : null;
  const baseLabel = pkg
    ? pkg.name
    : listing?.pricingModel === "hourly"
      ? `${booking.listingTitle} · ${booking.durationHours} hrs`
      : booking.listingTitle;

  const confirmed = booking.status === "confirmed";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      {isNew && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-success text-success-foreground">
            <Check className="size-5" />
          </span>
          <div>
            <p className="font-display font-bold">
              {confirmed ? "You're booked! 🎉" : "Request sent!"}
            </p>
            <p className="text-sm text-muted-foreground">
              {confirmed
                ? `${booking.providerName} is confirmed for your event.`
                : `${booking.providerName} will review your request and respond shortly.`}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <Image
            src={booking.providerAvatarUrl}
            alt={booking.providerName}
            width={48}
            height={48}
            className="size-12 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/providers/${booking.providerSlug}`}
              className="font-display font-bold hover:underline"
            >
              {booking.providerName}
            </Link>
            <p className="truncate text-sm text-muted-foreground">{booking.listingTitle}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <Detail icon={<CalendarDays className="size-4" />} label="Date">
            {format(new Date(`${booking.eventDate}T00:00:00`), "EEEE, MMM d, yyyy")}
          </Detail>
          <Detail icon={<Clock className="size-4" />} label="Time">
            {formatTime(booking.startTime)} · {booking.durationHours} hrs
          </Detail>
          <Detail icon={<Users className="size-4" />} label="Guests">
            {booking.guestCount} guests
          </Detail>
          <Detail icon={<MapPin className="size-4" />} label="Location">
            {booking.eventAddress || `${booking.eventNeighborhood}, NYC`}
          </Detail>
        </div>

        {booking.notes && (
          <div className="border-t border-border px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
            <p className="mt-1 text-sm">{booking.notes}</p>
          </div>
        )}

        <div className="border-t border-border bg-secondary/30 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Price details</p>
            <Badge variant="outline">
              {booking.paymentStatus === "authorized" ? "Payment authorized" : "No charge yet"} ·
              simulated
            </Badge>
          </div>
          <PriceBreakdownList price={booking.price} baseLabel={baseLabel} addonLines={booking.addons} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/providers/${booking.providerSlug}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <MessageCircle className="size-4" />
          Message provider
        </Link>
        <Link href="/bookings" className={cn(buttonVariants({ variant: "outline" }))}>
          All bookings
        </Link>
        <Link href="/browse" className={cn(buttonVariants({ variant: "brand" }))}>
          <PartyPopper className="size-4" />
          Book something else
        </Link>
      </div>
    </div>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{children}</p>
      </div>
    </div>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}
