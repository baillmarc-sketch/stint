/**
 * Hand-written row shapes for the Supabase tables we read/write, mirroring
 * `supabase/migrations/0001_init.sql` (snake_case columns).
 *
 * These let the Supabase backend compile and stay type-checked without a linked
 * project. Once the user links a project they can run `pnpm db:types` to generate
 * the full `types/database.types.ts`; these local shapes can then be narrowed to it.
 */
import type { MediaKind, PricingModel, BookingStatus, PaymentStatus } from "@/types/domain";

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  icon: string | null;
  hero_image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface MarketRow {
  id: string;
  slug: string;
  name: string;
  region: string;
  is_active: boolean;
}

export interface MediaRow {
  id: string;
  provider_id: string | null;
  listing_id: string | null;
  kind: MediaKind;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  sort_order: number;
}

export interface PackageRow {
  id: string;
  listing_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  includes: string[];
  sort_order: number;
}

export interface AddonRow {
  id: string;
  listing_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  price_per_guest: boolean;
  sort_order: number;
}

export interface ListingRow {
  id: string;
  provider_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  pricing_model: PricingModel;
  base_price_cents: number;
  unit_label: string | null;
  min_hours: number | null;
  min_guests: number;
  max_guests: number;
  travel_radius_miles: number;
  travel_fee_cents: number;
  instant_book: boolean;
  includes: string[];
  is_published: boolean;
  // Embedded relations (optional — present depending on the select)
  packages?: PackageRow[];
  addons?: AddonRow[];
  media?: MediaRow[];
}

export interface ReviewRow {
  id: string;
  provider_id: string;
  rating: number;
  body: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  event_type: string | null;
  created_at: string;
}

export interface AvailabilityRuleRow {
  id: string;
  provider_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface ProviderRow {
  id: string;
  owner_id: string | null;
  business_name: string;
  slug: string;
  tagline: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  category_id: string | null;
  market_id: string | null;
  neighborhood: string | null;
  years_experience: number;
  response_rate: number;
  response_minutes: number;
  rating_avg: number;
  rating_count: number;
  instant_book: boolean;
  is_verified: boolean;
  is_published: boolean;
  credentials: string[];
  // Embedded relations
  listings?: ListingRow[];
  reviews?: ReviewRow[];
  availability_rules?: AvailabilityRuleRow[];
}

export interface BookingAddonRow {
  id: string;
  booking_id: string;
  addon_id: string | null;
  name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
}

export interface BookingRow {
  id: string;
  customer_id: string | null;
  provider_id: string;
  listing_id: string;
  package_id: string | null;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_ref: string | null;
  is_instant: boolean;
  event_date: string;
  start_time: string;
  duration_hours: number;
  guest_count: number;
  event_address: string | null;
  event_neighborhood: string | null;
  notes: string | null;
  base_price_cents: number;
  addons_total_cents: number;
  travel_fee_cents: number;
  service_fee_cents: number;
  subtotal_cents: number;
  total_cents: number;
  created_at: string;
  // Embedded relations
  providers?: Pick<ProviderRow, "slug" | "business_name" | "avatar_url"> | null;
  listings?: Pick<ListingRow, "title"> | null;
  booking_addons?: BookingAddonRow[];
}

export interface MessageThreadRow {
  id: string;
  booking_id: string | null;
  customer_id: string | null;
  provider_id: string | null;
  last_message_at: string;
}

export interface MessageRow {
  id: string;
  thread_id: string;
  sender_id: string | null;
  kind: "text" | "system" | "quote";
  body: string;
  created_at: string;
}
