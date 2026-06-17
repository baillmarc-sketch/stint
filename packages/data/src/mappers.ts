/**
 * Pure row → domain mappers. Snake_case Postgres rows in, camelCase view models
 * (@stint/core) out. Side-effect-free so they're unit-testable and shared by the
 * web query layer, the native app, and the route handlers.
 */
import type {
  Addon,
  AvailabilityRule,
  AvailabilitySlot,
  Category,
  Listing,
  Media,
  Package,
  Provider,
  Review,
} from "@stint/core";
import type {
  AddonRow,
  AvailabilityRuleRow,
  AvailabilitySlotRow,
  CategoryRow,
  ListingRow,
  MediaRow,
  PackageRow,
  ProviderRow,
  ReviewRow,
} from "./db-types";

const bySortOrder = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;

export function toCategory(r: CategoryRow): Category {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline ?? "",
    description: r.description ?? "",
    icon: r.icon ?? "Sparkles",
    heroImageUrl: r.hero_image_url ?? "",
    sortOrder: r.sort_order,
  };
}

export function toMedia(r: MediaRow): Media {
  return { id: r.id, kind: r.kind, url: r.url, caption: r.caption ?? undefined };
}

export function toPackage(r: PackageRow): Package {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    priceCents: r.price_cents,
    includes: r.includes ?? [],
  };
}

export function toAddon(r: AddonRow): Addon {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    priceCents: r.price_cents,
    pricePerGuest: r.price_per_guest,
  };
}

export function toAvailabilityRule(r: AvailabilityRuleRow): AvailabilityRule {
  return { weekday: r.weekday, startTime: r.start_time, endTime: r.end_time };
}

export function toAvailabilitySlot(r: AvailabilitySlotRow): AvailabilitySlot {
  return {
    id: r.id,
    date: r.slot_date,
    startTime: r.start_time.slice(0, 5),
    endTime: r.end_time.slice(0, 5),
    isBooked: r.is_booked,
  };
}

export function toReview(r: ReviewRow): Review {
  return {
    id: r.id,
    authorName: r.author_name ?? "Guest",
    authorAvatarUrl: r.author_avatar_url ?? "",
    rating: r.rating,
    body: r.body ?? "",
    eventType: r.event_type ?? "",
    createdAt: r.created_at,
  };
}

export function toListing(r: ListingRow): Listing {
  return {
    id: r.id,
    providerId: r.provider_id,
    categoryId: r.category_id ?? "",
    title: r.title,
    description: r.description ?? "",
    pricingModel: r.pricing_model,
    basePriceCents: r.base_price_cents,
    unitLabel: r.unit_label ?? "",
    minHours: r.min_hours,
    minGuests: r.min_guests,
    maxGuests: r.max_guests,
    travelRadiusMiles: r.travel_radius_miles,
    travelFeeCents: r.travel_fee_cents,
    instantBook: r.instant_book,
    packages: (r.packages ?? []).slice().sort(bySortOrder).map(toPackage),
    addons: (r.addons ?? []).slice().sort(bySortOrder).map(toAddon),
    gallery: (r.media ?? []).slice().sort(bySortOrder).map(toMedia),
    includes: r.includes ?? [],
  };
}

export function toProvider(r: ProviderRow): Provider {
  const reviews = (r.reviews ?? [])
    .slice()
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .map(toReview);

  return {
    id: r.id,
    slug: r.slug,
    businessName: r.business_name,
    ownerName: "", // not stored on providers; derived from profile elsewhere if needed
    tagline: r.tagline ?? "",
    bio: r.bio ?? "",
    avatarUrl: r.avatar_url ?? "",
    coverImageUrl: r.cover_image_url ?? "",
    categoryId: r.category_id ?? "",
    marketId: r.market_id ?? "",
    neighborhood: r.neighborhood ?? "",
    yearsExperience: r.years_experience,
    ratingAvg: Number(r.rating_avg),
    ratingCount: r.rating_count,
    responseRate: Number(r.response_rate),
    responseMinutes: r.response_minutes,
    instantBook: r.instant_book,
    isVerified: r.is_verified,
    isPublished: r.is_published,
    credentials: r.credentials ?? [],
    availability: (r.availability_rules ?? []).map(toAvailabilityRule),
    slots: (r.availability_slots ?? []).map(toAvailabilitySlot),
    listings: (r.listings ?? []).map(toListing),
    reviews,
  };
}
