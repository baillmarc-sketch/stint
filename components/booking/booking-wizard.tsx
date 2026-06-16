"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  Loader2,
  MapPin,
  Users,
  Zap,
} from "lucide-react";
import type { Listing, Provider } from "@/types/domain";
import { computeQuote, type AddonSelection } from "@/lib/booking/pricing";
import { NYC_NEIGHBORHOODS } from "@/lib/constants";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceBreakdownList } from "./price-breakdown";
import { formatPrice, pricingLabel, cn } from "@/lib/utils";

const TIME_OPTIONS = Array.from({ length: 13 }, (_, i) => {
  const h = i + 10; // 10:00 → 22:00
  return `${String(h).padStart(2, "0")}:00`;
});

const STEPS = ["Event details", "Add-ons", "Review & book"] as const;

export function BookingWizard({ listing, provider }: { listing: Listing; provider: Provider }) {
  const router = useRouter();
  const isPackage = listing.pricingModel === "package";
  const isHourly = listing.pricingModel === "hourly";

  const [step, setStep] = useState(0);
  const [packageId, setPackageId] = useState<string | null>(
    isPackage ? (listing.packages[0]?.id ?? null) : null,
  );
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [durationHours, setDurationHours] = useState(listing.minHours ?? 3);
  const [guestCount, setGuestCount] = useState(
    Math.min(Math.max(listing.minGuests, 12), listing.maxGuests),
  );
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  const [eventAddress, setEventAddress] = useState("");
  const [eventNeighborhood, setEventNeighborhood] = useState(provider.neighborhood);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addonSelections: AddonSelection[] = useMemo(
    () =>
      Object.entries(addonQty)
        .filter(([, q]) => q > 0)
        .map(([addonId, quantity]) => ({ addonId, quantity })),
    [addonQty],
  );

  const quote = useMemo(
    () =>
      computeQuote({
        listing,
        packageId,
        addonSelections,
        durationHours,
        guestCount,
      }),
    [listing, packageId, addonSelections, durationHours, guestCount],
  );

  const baseLabel = useMemo(() => {
    if (quote.selectedPackage) return quote.selectedPackage.name;
    if (isHourly) return `${listing.title} · ${durationHours} hrs`;
    return listing.title;
  }, [quote.selectedPackage, isHourly, listing.title, durationHours]);

  const canContinue = step === 0 ? Boolean(eventDate) : step === 2 ? eventAddress.length >= 3 : true;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          packageId,
          addonSelections,
          eventDate,
          startTime,
          durationHours,
          guestCount,
          eventAddress,
          eventNeighborhood,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/bookings/${data.bookingId}?new=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Form column */}
      <div>
        <Link
          href={`/providers/${provider.slug}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to {provider.businessName}
        </Link>

        {/* Stepper */}
        <ol className="mb-7 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors",
                  i < step && "bg-success text-success-foreground",
                  i === step && "bg-foreground text-background",
                  i > step && "bg-secondary text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:block",
                  i === step ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
            </li>
          ))}
        </ol>

        {/* Step 1: details */}
        {step === 0 && (
          <div className="space-y-6">
            {isPackage && listing.packages.length > 0 && (
              <Field label="Choose a package">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {listing.packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setPackageId(pkg.id)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition-colors",
                        packageId === pkg.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-display font-bold">{pkg.name}</span>
                        <span className="font-display font-extrabold">{formatPrice(pkg.priceCents)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{pkg.description}</p>
                    </button>
                  ))}
                </div>
              </Field>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Event date">
                <input
                  type="date"
                  value={eventDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setEventDate(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Start time">
                <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass}>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {formatTime(t)}
                    </option>
                  ))}
                </select>
              </Field>

              {isHourly && (
                <Field label="Duration">
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className={inputClass}
                  >
                    {Array.from({ length: 8 }, (_, i) => (listing.minHours ?? 1) + i).map((h) => (
                      <option key={h} value={h}>
                        {h} hours
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="Guests" hint={`${listing.minGuests}–${listing.maxGuests}`}>
                <input
                  type="number"
                  value={guestCount}
                  min={listing.minGuests}
                  max={listing.maxGuests}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        )}

        {/* Step 2: add-ons */}
        {step === 1 && (
          <div className="space-y-3">
            {listing.addons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This provider has no optional add-ons — continue to review your booking.
              </p>
            ) : (
              listing.addons.map((addon) => {
                const selected = (addonQty[addon.id] ?? 0) > 0;
                return (
                  <div
                    key={addon.id}
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors",
                      selected ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{addon.name}</p>
                      <p className="text-sm text-muted-foreground">{addon.description}</p>
                      <p className="mt-1 text-sm font-semibold">
                        +{formatPrice(addon.priceCents)}
                        {addon.pricePerGuest ? (
                          <span className="font-normal text-muted-foreground"> / guest</span>
                        ) : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAddonQty((prev) => ({ ...prev, [addon.id]: selected ? 0 : 1 }))
                      }
                      className={cn(
                        buttonVariants({ variant: selected ? "primary" : "outline", size: "sm" }),
                        "shrink-0",
                      )}
                    >
                      {selected ? (
                        <>
                          <Check className="size-4" /> Added
                        </>
                      ) : (
                        "Add"
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Step 3: review */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Event address" className="sm:col-span-2">
                <input
                  value={eventAddress}
                  onChange={(e) => setEventAddress(e.target.value)}
                  placeholder="123 Park Pl, Brooklyn, NY"
                  className={inputClass}
                />
              </Field>
              <Field label="Neighborhood">
                <select
                  value={eventNeighborhood}
                  onChange={(e) => setEventNeighborhood(e.target.value)}
                  className={inputClass}
                >
                  {NYC_NEIGHBORHOODS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Anything the provider should know?" hint="optional">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Occasion, dietary needs, parking, vibe…"
                className={cn(inputClass, "h-auto resize-none py-2.5")}
              />
            </Field>

            <div className="rounded-2xl border border-border bg-secondary/40 p-5">
              <p className="mb-3 text-sm font-semibold">Price details</p>
              <PriceBreakdownList price={quote.price} baseLabel={baseLabel} addonLines={quote.addonLines} />
            </div>

            {error && (
              <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={submitting}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          ) : (
            <span />
          )}

          {step < STEPS.length - 1 ? (
            <Button variant="brand" onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button variant="brand" size="lg" onClick={submit} disabled={!canContinue || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Booking…
                </>
              ) : (
                <>
                  {provider.instantBook ? <Zap className="size-4 fill-current" /> : null}
                  {provider.instantBook ? "Confirm instant book" : "Send booking request"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Summary sidebar */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-primary/5">
          <div className="relative h-28">
            <Image src={provider.coverImageUrl} alt="" fill sizes="360px" className="object-cover" />
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3">
              <Image
                src={provider.avatarUrl}
                alt={provider.ownerName}
                width={40}
                height={40}
                className="size-10 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-display font-bold">{provider.businessName}</p>
                <p className="truncate text-xs text-muted-foreground">{listing.title}</p>
              </div>
            </div>

            {provider.instantBook && (
              <Badge variant="success" className="mt-3">
                <Zap className="size-3.5 fill-current" />
                Instant book available
              </Badge>
            )}

            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <SummaryRow icon={<CalendarDays className="size-4" />}>
                {eventDate ? `${formatDate(eventDate)} · ${formatTime(startTime)}` : "Pick a date"}
              </SummaryRow>
              <SummaryRow icon={<Users className="size-4" />}>{guestCount} guests</SummaryRow>
              <SummaryRow icon={<MapPin className="size-4" />}>{eventNeighborhood}, NYC</SummaryRow>
            </dl>

            <div className="mt-4 border-t border-border pt-4">
              <PriceBreakdownList price={quote.price} baseLabel={baseLabel} addonLines={quote.addonLines} />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {pricingLabel(listing)} · You won&apos;t be charged (simulated)
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between text-sm font-medium">
        {label}
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function SummaryRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="text-foreground/70">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
