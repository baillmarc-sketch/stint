import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { Listing, PricingModel } from "@/types/domain";

/** Tailwind-aware className combiner (shadcn convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format integer cents as USD, e.g. 12000 -> "$120". */
export function formatPrice(cents: number, precise = false): string {
  return (precise ? usdPrecise : usd).format(cents / 100);
}

/** Human label for how a listing is priced, e.g. "$120/hr" or "from $450". */
export function pricingLabel(listing: Pick<Listing, "pricingModel" | "basePriceCents" | "unitLabel">): string {
  const price = formatPrice(listing.basePriceCents);
  switch (listing.pricingModel) {
    case "hourly":
      return `${price}/hr`;
    case "package":
      return `from ${price}`;
    case "flat":
    default:
      return `${price} ${listing.unitLabel}`.trim();
  }
}

export function pricingModelLabel(model: PricingModel): string {
  switch (model) {
    case "hourly":
      return "Hourly";
    case "package":
      return "Packages";
    case "flat":
      return "Flat rate";
  }
}

/** "4.9" from 4.92, always one decimal. */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "responds in ~2h" / "responds in ~30m" */
export function responseLabel(minutes: number): string {
  if (minutes < 60) return `~${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `~${hours}h`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function weekdayLabel(weekday: number): string {
  return WEEKDAYS[weekday] ?? "";
}

/** Deterministic pick from an array using a string seed (stable across renders). */
export function seededPick<T>(arr: readonly T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}
