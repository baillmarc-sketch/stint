/**
 * Quote computation — the single source of truth for booking math.
 *
 * Pure and framework-free: the booking wizard calls it for the live price preview
 * and the create-booking route handler re-runs it server-side so a tampered client
 * payload can't change the charged total. All amounts are integer cents.
 */
import { SERVICE_FEE_PCT } from "../config";
import type { BookingAddonLine, Listing, Package, PriceBreakdown } from "../types/domain";

export interface AddonSelection {
  addonId: string;
  quantity: number;
}

export interface QuoteInput {
  listing: Listing;
  packageId?: string | null;
  addonSelections?: AddonSelection[];
  durationHours: number;
  guestCount: number;
}

export interface Quote {
  price: PriceBreakdown;
  addonLines: BookingAddonLine[];
  selectedPackage: Package | null;
}

export function findPackage(listing: Listing, packageId?: string | null): Package | null {
  if (!packageId) return null;
  return listing.packages.find((p) => p.id === packageId) ?? null;
}

function computeBaseCents(listing: Listing, pkg: Package | null, durationHours: number): number {
  if (pkg) return pkg.priceCents;
  if (listing.pricingModel === "hourly") {
    const hours = Math.max(durationHours, listing.minHours ?? 1);
    return listing.basePriceCents * hours;
  }
  return listing.basePriceCents;
}

export function computeQuote(input: QuoteInput): Quote {
  const { listing, durationHours, guestCount } = input;
  const pkg = findPackage(listing, input.packageId);

  const baseCents = computeBaseCents(listing, pkg, durationHours);

  const addonLines: BookingAddonLine[] = [];
  for (const sel of input.addonSelections ?? []) {
    const addon = listing.addons.find((a) => a.id === sel.addonId);
    if (!addon) continue;
    const quantity = addon.pricePerGuest ? guestCount : Math.max(1, sel.quantity);
    const lineTotalCents = addon.priceCents * quantity;
    addonLines.push({
      addonId: addon.id,
      name: addon.name,
      quantity,
      unitPriceCents: addon.priceCents,
      lineTotalCents,
    });
  }

  const addonsCents = addonLines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const travelFeeCents = listing.travelFeeCents;
  const subtotalCents = baseCents + addonsCents + travelFeeCents;
  const serviceFeeCents = Math.round(subtotalCents * SERVICE_FEE_PCT);
  const totalCents = subtotalCents + serviceFeeCents;

  const price: PriceBreakdown = {
    baseCents,
    addonsCents,
    travelFeeCents,
    serviceFeeCents,
    subtotalCents,
    totalCents,
  };

  return { price, addonLines, selectedPackage: pkg };
}

/** Amount a provider nets after the marketplace service fee (display only). */
export function providerEarningsCents(price: PriceBreakdown): number {
  return price.subtotalCents;
}
