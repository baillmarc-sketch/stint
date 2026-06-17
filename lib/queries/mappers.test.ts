import { describe, it, expect } from "vitest";
import { toCategory, toListing, toProvider } from "@/lib/queries/mappers";
import type { ListingRow, ProviderRow } from "@/lib/queries/db-types";

describe("row → domain mappers", () => {
  it("maps a category row to camelCase", () => {
    const c = toCategory({
      id: "c1",
      slug: "djs",
      name: "DJs",
      tagline: "Spin it",
      description: "d",
      icon: "Music",
      hero_image_url: "https://img/x.jpg",
      sort_order: 3,
      is_active: true,
    });
    expect(c).toMatchObject({ id: "c1", slug: "djs", name: "DJs", sortOrder: 3, heroImageUrl: "https://img/x.jpg" });
  });

  it("maps a listing and sorts packages/media by sort_order", () => {
    const row: ListingRow = {
      id: "l1",
      provider_id: "p1",
      category_id: "c1",
      title: "T",
      description: "d",
      pricing_model: "hourly",
      base_price_cents: 10000,
      unit_label: "per hour",
      min_hours: 2,
      min_guests: 1,
      max_guests: 50,
      travel_radius_miles: 25,
      travel_fee_cents: 0,
      instant_book: true,
      includes: ["one"],
      is_published: true,
      packages: [
        { id: "p2", listing_id: "l1", name: "B", description: "", price_cents: 2, includes: [], sort_order: 1 },
        { id: "p1", listing_id: "l1", name: "A", description: "", price_cents: 1, includes: [], sort_order: 0 },
      ],
      addons: [],
      media: [
        { id: "m1", provider_id: null, listing_id: "l1", kind: "image", url: "u", thumbnail_url: null, caption: null, sort_order: 0 },
      ],
    };
    const l = toListing(row);
    expect(l.basePriceCents).toBe(10000);
    expect(l.packages.map((p) => p.name)).toEqual(["A", "B"]);
    expect(l.gallery[0].url).toBe("u");
  });

  it("coerces rating to a number and sorts reviews newest-first", () => {
    const row: ProviderRow = {
      id: "p1",
      owner_id: null,
      business_name: "Biz",
      slug: "biz",
      tagline: "t",
      bio: "b",
      avatar_url: "a",
      cover_image_url: "c",
      category_id: "c1",
      market_id: "m1",
      neighborhood: "Soho",
      years_experience: 5,
      response_rate: 0.9,
      response_minutes: 30,
      rating_avg: "4.80" as unknown as number, // numeric comes back as string
      rating_count: 12,
      instant_book: true,
      is_verified: true,
      is_published: true,
      credentials: ["x"],
      reviews: [
        { id: "r1", provider_id: "p1", rating: 5, body: "old", author_name: "A", author_avatar_url: null, event_type: "party", created_at: "2024-01-01T00:00:00Z" },
        { id: "r2", provider_id: "p1", rating: 4, body: "new", author_name: "B", author_avatar_url: null, event_type: "party", created_at: "2025-01-01T00:00:00Z" },
      ],
    };
    const p = toProvider(row);
    expect(p.ratingAvg).toBe(4.8);
    expect(typeof p.ratingAvg).toBe("number");
    expect(p.reviews[0].body).toBe("new");
    expect(p.listings).toEqual([]);
  });
});
