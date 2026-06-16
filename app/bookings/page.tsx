import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, ChevronRight, Users } from "lucide-react";
import { getStoredBookings } from "@/lib/bookings-store";
import { StatusBadge } from "@/components/booking/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "My bookings" };

export default async function BookingsPage() {
  const bookings = await getStoredBookings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">My bookings</h1>

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          body="When you book a chef, performer, or crew, it'll show up here so you can track every detail."
          actionHref="/browse"
          actionLabel="Browse services"
        />
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/bookings/${b.id}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <Image
                  src={b.providerAvatarUrl}
                  alt={b.providerName}
                  width={48}
                  height={48}
                  className="size-12 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display font-bold">{b.providerName}</p>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{b.listingTitle}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {format(new Date(`${b.eventDate}T00:00:00`), "MMM d, yyyy")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" />
                      {b.guestCount} guests
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display font-extrabold">{formatPrice(b.price.totalCents)}</p>
                  <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
