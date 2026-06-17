import type { Metadata } from "next";
import { getProviderContext } from "@/lib/auth";
import { getOwnerStorefront, getProviderSlots } from "@/lib/queries/owner";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { AvailabilityForm, type AvailabilityFormValues } from "./availability-form";
import { addAvailabilitySlot, deleteAvailabilitySlot } from "./actions";

export const metadata: Metadata = { title: "Availability" };

const slotInput =
  "h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function formatSlotDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function AvailabilityPage() {
  const provider = await getProviderContext();
  if (!provider) {
    return (
      <EmptyState
        title="Become a provider"
        body="Set up a provider account to manage your availability."
        actionHref="/onboarding"
        actionLabel="Get started"
      />
    );
  }

  const [store, slots] = await Promise.all([
    getOwnerStorefront(provider.id),
    getProviderSlots(provider.id),
  ]);
  const byDay = new Map((store?.provider.availability ?? []).map((r) => [r.weekday, r]));
  const today = new Date().toISOString().slice(0, 10);

  const initial: AvailabilityFormValues = {
    days: Array.from({ length: 7 }, (_, wd) => {
      const r = byDay.get(wd);
      return {
        weekday: wd,
        enabled: Boolean(r),
        startTime: r?.startTime?.slice(0, 5) ?? "09:00",
        endTime: r?.endTime?.slice(0, 5) ?? "17:00",
      };
    }),
    blocks: (store?.blocks ?? []).filter((b) => !b.isAvailable).map((b) => ({ date: b.date })),
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Availability</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Set the days and hours you take bookings, and publish specific bookable slots.
      </p>
      <div className="mt-7">
        <AvailabilityForm initial={initial} />
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold">Bookable time slots</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Publish specific dates and times. Customers can instant-book an open slot, and it&apos;s
          reserved automatically.
        </p>

        <form action={addAvailabilitySlot} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Date</span>
            <input type="date" name="date" min={today} required className={slotInput} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">From</span>
            <input type="time" name="startTime" defaultValue="18:00" required className={slotInput} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">To</span>
            <input type="time" name="endTime" defaultValue="21:00" required className={slotInput} />
          </label>
          <button type="submit" className={buttonVariants({ variant: "brand" })}>
            Add slot
          </button>
        </form>

        {slots.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">No upcoming slots yet.</p>
        ) : (
          <ul className="mt-5 divide-y divide-border">
            {slots.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>
                  <span className="font-medium">{formatSlotDate(s.date)}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {s.startTime}–{s.endTime}
                  </span>
                  {s.isBooked && (
                    <span className="ml-2 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                      Booked
                    </span>
                  )}
                </span>
                {!s.isBooked && (
                  <form action={deleteAvailabilitySlot}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="font-medium text-destructive hover:underline">
                      Remove
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
