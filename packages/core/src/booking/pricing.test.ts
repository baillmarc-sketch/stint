import { describe, it, expect } from "vitest";
import { computeQuote, providerEarningsCents } from "./pricing";
import type { Addon, Listing, Package } from "../types/domain";

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "l1",
    providerId: "p1",
    categoryId: "c1",
    title: "Test listing",
    description: "",
    pricingModel: "hourly",
    basePriceCents: 10000,
    unitLabel: "per hour",
    minHours: 2,
    minGuests: 1,
    maxGuests: 100,
    travelRadiusMiles: 25,
    travelFeeCents: 0,
    instantBook: false,
    packages: [],
    addons: [],
    gallery: [],
    includes: [],
    ...overrides,
  };
}

const addon = (o: Partial<Addon> & Pick<Addon, "id">): Addon => ({
  name: "Add-on",
  description: "",
  priceCents: 0,
  pricePerGuest: false,
  ...o,
});

describe("computeQuote", () => {
  it("hourly: rate × hours + 12% service fee", () => {
    const { price } = computeQuote({
      listing: makeListing({ basePriceCents: 10000, minHours: 2 }),
      durationHours: 3,
      guestCount: 10,
    });
    expect(price.baseCents).toBe(30000);
    expect(price.subtotalCents).toBe(30000);
    expect(price.serviceFeeCents).toBe(3600); // round(30000 * 0.12)
    expect(price.totalCents).toBe(33600);
  });

  it("hourly: floors duration at minHours", () => {
    const { price } = computeQuote({
      listing: makeListing({ basePriceCents: 10000, minHours: 2 }),
      durationHours: 1,
      guestCount: 5,
    });
    expect(price.baseCents).toBe(20000); // 10000 × min(2)
  });

  it("flat: ignores duration", () => {
    const { price } = computeQuote({
      listing: makeListing({ pricingModel: "flat", basePriceCents: 50000 }),
      durationHours: 5,
      guestCount: 20,
    });
    expect(price.baseCents).toBe(50000);
  });

  it("package: overrides the base price", () => {
    const pkg: Package = { id: "pkg1", name: "Deluxe", description: "", priceCents: 80000, includes: [] };
    const { price, selectedPackage } = computeQuote({
      listing: makeListing({ pricingModel: "package", packages: [pkg] }),
      packageId: "pkg1",
      durationHours: 3,
      guestCount: 10,
    });
    expect(selectedPackage?.id).toBe("pkg1");
    expect(price.baseCents).toBe(80000);
  });

  it("per-guest add-on multiplies by guest count (ignoring quantity)", () => {
    const { price, addonLines } = computeQuote({
      listing: makeListing({
        pricingModel: "flat",
        basePriceCents: 0,
        addons: [addon({ id: "a1", priceCents: 1000, pricePerGuest: true })],
      }),
      addonSelections: [{ addonId: "a1", quantity: 1 }],
      durationHours: 1,
      guestCount: 8,
    });
    expect(addonLines[0].quantity).toBe(8);
    expect(price.addonsCents).toBe(8000);
  });

  it("quantity add-on multiplies by selected quantity", () => {
    const { price } = computeQuote({
      listing: makeListing({
        pricingModel: "flat",
        basePriceCents: 0,
        addons: [addon({ id: "a1", priceCents: 2000, pricePerGuest: false })],
      }),
      addonSelections: [{ addonId: "a1", quantity: 3 }],
      durationHours: 1,
      guestCount: 4,
    });
    expect(price.addonsCents).toBe(6000);
  });

  it("includes the travel fee in the subtotal", () => {
    const { price } = computeQuote({
      listing: makeListing({ pricingModel: "flat", basePriceCents: 10000, travelFeeCents: 1500 }),
      durationHours: 1,
      guestCount: 1,
    });
    expect(price.travelFeeCents).toBe(1500);
    expect(price.subtotalCents).toBe(11500);
  });

  it("rounds the service fee to the nearest cent", () => {
    const { price } = computeQuote({
      listing: makeListing({ pricingModel: "flat", basePriceCents: 10001 }),
      durationHours: 1,
      guestCount: 1,
    });
    // 10001 * 0.12 = 1200.12 → 1200
    expect(price.serviceFeeCents).toBe(1200);
    expect(price.totalCents).toBe(11201);
  });

  it("provider earnings equal the subtotal (total minus our fee)", () => {
    const { price } = computeQuote({
      listing: makeListing({ pricingModel: "flat", basePriceCents: 40000 }),
      durationHours: 1,
      guestCount: 1,
    });
    expect(providerEarningsCents(price)).toBe(price.subtotalCents);
    expect(providerEarningsCents(price)).toBe(40000);
  });
});
