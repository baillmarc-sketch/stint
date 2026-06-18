import { z } from "zod";

/** A package row in the storefront editor (money already normalized to cents). */
export const packageInputSchema = z.object({
  name: z.string().trim().min(1, "Package needs a name").max(80),
  description: z.string().trim().max(300).default(""),
  priceCents: z.number().int().min(0).max(100_000_00),
  includes: z.array(z.string().trim().min(1)).default([]),
});

export const addonInputSchema = z.object({
  name: z.string().trim().min(1, "Add-on needs a name").max(80),
  description: z.string().trim().max(300).default(""),
  priceCents: z.number().int().min(0).max(100_000_00),
  pricePerGuest: z.boolean().default(false),
});

/**
 * Full storefront payload: the provider profile + its primary listing +
 * packages/add-ons. Submitted by the editor as one JSON blob.
 */
export const storefrontSchema = z.object({
  // Existing listing being edited, or null to create the provider's first one.
  listingId: z.string().nullable().default(null),

  // Provider profile
  businessName: z.string().trim().min(2, "Add a business name").max(80),
  tagline: z.string().trim().max(140).default(""),
  bio: z.string().trim().max(2000).default(""),
  neighborhood: z.string().trim().max(80).default(""),
  categoryId: z.string().min(1, "Pick a category"),
  yearsExperience: z.number().int().min(0).max(80).default(0),
  credentials: z.array(z.string().trim().min(1)).default([]),

  // Primary listing
  title: z.string().trim().min(2, "Add a listing title").max(120),
  description: z.string().trim().max(2000).default(""),
  pricingModel: z.enum(["hourly", "flat", "package"]),
  basePriceCents: z.number().int().min(0).max(1_000_000_00),
  unitLabel: z.string().trim().max(40).default(""),
  minHours: z.number().int().min(0).max(24).nullable().default(null),
  minGuests: z.number().int().min(1).max(1000).default(1),
  maxGuests: z.number().int().min(1).max(5000).default(100),
  travelRadiusMiles: z.number().int().min(0).max(200).default(25),
  travelFeeCents: z.number().int().min(0).max(100_000_00).default(0),
  instantBook: z.boolean().default(false),
  includes: z.array(z.string().trim().min(1)).default([]),
  packages: z.array(packageInputSchema).max(8).default([]),
  addons: z.array(addonInputSchema).max(12).default([]),
});

export type StorefrontInput = z.infer<typeof storefrontSchema>;
