/**
 * Domain model for Stint.
 *
 * These TypeScript types are the single source of truth for the app's view models
 * and mirror the Postgres schema described in the project plan (snake_case columns
 * map to these camelCase shapes). All monetary values are integer **cents**.
 *
 * Pure + framework-free: shared by the web app and the React Native app, and the
 * same shapes are produced by the Supabase seed script.
 */

export type UserRole = "customer" | "provider" | "both";

export type PricingModel = "hourly" | "flat" | "package";

export type BookingStatus =
  | "requested"
  | "quoted"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "declined";

export type PaymentStatus =
  | "none"
  | "authorized"
  | "captured"
  | "refunded"
  | "failed";

export type MediaKind = "image" | "video";

export interface Market {
  id: string;
  slug: string;
  name: string;
  region: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  /** Short tagline shown on browse tiles. */
  tagline: string;
  description: string;
  /** lucide-react icon name. */
  icon: string;
  heroImageUrl: string;
  sortOrder: number;
}

export interface Media {
  id: string;
  kind: MediaKind;
  url: string;
  caption?: string;
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  /** When true, price is multiplied by guest count rather than a quantity. */
  pricePerGuest: boolean;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  includes: string[];
}

export interface Listing {
  id: string;
  providerId: string;
  categoryId: string;
  title: string;
  description: string;
  pricingModel: PricingModel;
  /** Per-hour rate (hourly), flat event rate (flat), or starting "from" price (package). */
  basePriceCents: number;
  unitLabel: string;
  minHours: number | null;
  minGuests: number;
  maxGuests: number;
  travelRadiusMiles: number;
  travelFeeCents: number;
  instantBook: boolean;
  packages: Package[];
  addons: Addon[];
  gallery: Media[];
  /** Highlighted bullet points: "what's included". */
  includes: string[];
}

export interface Review {
  id: string;
  authorName: string;
  authorAvatarUrl: string;
  rating: number;
  body: string;
  eventType: string;
  createdAt: string;
}

export interface AvailabilityRule {
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface Provider {
  id: string;
  slug: string;
  businessName: string;
  ownerName: string;
  tagline: string;
  bio: string;
  avatarUrl: string;
  coverImageUrl: string;
  categoryId: string;
  marketId: string;
  neighborhood: string;
  yearsExperience: number;
  ratingAvg: number;
  ratingCount: number;
  responseRate: number;
  /** Typical response time in minutes (for "responds in ~Xh"). */
  responseMinutes: number;
  instantBook: boolean;
  isVerified: boolean;
  isPublished: boolean;
  /** Free-form credential/insurance badges shown on the profile. */
  credentials: string[];
  availability: AvailabilityRule[];
  listings: Listing[];
  reviews: Review[];
}

/** A computed, immutable price breakdown captured at booking time. */
export interface PriceBreakdown {
  baseCents: number;
  addonsCents: number;
  travelFeeCents: number;
  serviceFeeCents: number;
  subtotalCents: number;
  totalCents: number;
}

export interface BookingAddonLine {
  addonId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface Booking {
  id: string;
  providerId: string;
  listingId: string;
  packageId: string | null;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentRef: string | null;
  isInstant: boolean;
  eventDate: string;
  startTime: string;
  durationHours: number;
  guestCount: number;
  eventAddress: string;
  eventNeighborhood: string;
  notes: string;
  addons: BookingAddonLine[];
  price: PriceBreakdown;
  createdAt: string;
}
