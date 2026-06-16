import type { Metadata } from "next";
import { getProviderContext } from "@/lib/auth";
import { getOwnerStorefront } from "@/lib/queries/owner";
import { EmptyState } from "@/components/shared/empty-state";
import { AvailabilityForm, type AvailabilityFormValues } from "./availability-form";

export const metadata: Metadata = { title: "Availability" };

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

  const store = await getOwnerStorefront(provider.id);
  const byDay = new Map((store?.provider.availability ?? []).map((r) => [r.weekday, r]));

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
        Set the days and hours you take bookings, and block off specific dates.
      </p>
      <div className="mt-7">
        <AvailabilityForm initial={initial} />
      </div>
    </div>
  );
}
