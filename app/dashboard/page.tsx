import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { CalendarDays, DollarSign, Inbox, Users } from "lucide-react";
import { getProviderBookings, getStoredBookings } from "@/lib/bookings-store";
import { getProviderContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { providerEarningsCents } from "@/lib/booking/pricing";
import { StatusBadge } from "@/components/booking/status-badge";
import { BookingActions } from "@/components/provider/booking-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Provider dashboard" };

export default async function DashboardPage() {
  // With a live database, show the signed-in owner's storefront bookings; in the
  // demo, fall back to the cookie-backed bookings so the flow stays clickable.
  const provider = await getProviderContext();
  const bookings = provider
    ? await getProviderBookings(provider.id)
    : isSupabaseConfigured()
      ? []
      : await getStoredBookings();

  const pending = bookings.filter((b) => b.status === "requested" || b.status === "quoted").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const earnings = bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + providerEarningsCents(b.price), 0);

  const stats = [
    { icon: Inbox, label: "New requests", value: String(pending) },
    { icon: CalendarDays, label: "Confirmed events", value: String(confirmed) },
    { icon: DollarSign, label: "Projected earnings", value: formatPrice(earnings) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Provider dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your bookings, availability, and payouts in one place.
          </p>
        </div>
        {provider ? (
          <Badge variant={provider.isPublished ? "success" : "warning"}>
            {provider.isPublished ? "Published" : "Draft"}
          </Badge>
        ) : (
          <Badge variant="brand">Demo view</Badge>
        )}
      </div>

      {provider && !provider.isPublished && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <p className="text-sm">
            Your storefront is a <span className="font-semibold">draft</span> — finish it and publish to start
            getting booked.
          </p>
          <Link href="/dashboard/storefront" className={buttonVariants({ size: "sm", variant: "brand" })}>
            Edit storefront
          </Link>
        </div>
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <span className="inline-grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="size-5" />
            </span>
            <p className="mt-3 font-display text-2xl font-extrabold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 mt-10 font-display text-xl font-extrabold tracking-tight">
        Incoming bookings
      </h2>

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          body="Book a provider in the demo and it'll appear here as an incoming request you can manage."
          actionHref="/browse"
          actionLabel="Try the booking flow"
        />
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-4">
                <Image
                  src={b.providerAvatarUrl}
                  alt=""
                  width={44}
                  height={44}
                  className="size-11 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{b.listingTitle}</p>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {format(new Date(`${b.eventDate}T00:00:00`), "MMM d")} · {formatTime(b.startTime)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" />
                      {b.guestCount}
                    </span>
                    <span>{b.eventNeighborhood}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display font-extrabold">
                    {formatPrice(providerEarningsCents(b.price))}
                  </p>
                  <p className="text-xs text-muted-foreground">you earn</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end border-t border-border pt-3">
                <BookingActions bookingId={b.id} status={b.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}
