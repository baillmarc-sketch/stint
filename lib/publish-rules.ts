import type { Listing, Provider } from "@/types/domain";

export interface PublishCheck {
  ok: boolean;
  reasons: string[];
}

/**
 * Gate for making a storefront public. M11 will extend this with trust & safety
 * (verification/credentials); for now it enforces that the listing is complete
 * enough to be bookable so we never publish an empty profile.
 */
export function canPublish(provider: Provider, listing: Listing | null): PublishCheck {
  const reasons: string[] = [];
  if (!provider.businessName || provider.businessName.trim().length < 2)
    reasons.push("Add a business name.");
  if (!provider.categoryId) reasons.push("Choose a category.");
  if (!provider.bio || provider.bio.trim().length < 20)
    reasons.push("Write a short bio (at least 20 characters).");
  if (!listing) reasons.push("Create your service listing.");
  else {
    if (!listing.title || listing.title.trim().length < 2) reasons.push("Add a listing title.");
    if (listing.basePriceCents <= 0) reasons.push("Set a starting price above $0.");
    if (listing.gallery.length === 0) reasons.push("Add at least one photo.");
  }
  return { ok: reasons.length === 0, reasons };
}
