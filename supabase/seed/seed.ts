/**
 * Seed the Supabase database with the NYC demo dataset.
 *
 * The in-repo dataset (lib/data) is the single source of truth, so the live site
 * and the seeded DB stay identical. Run after applying migrations:
 *
 *   pnpm seed            # requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotent: it clears the seeded tables first, then re-inserts.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { MARKETS, CATEGORIES, PROVIDERS } from "@/lib/data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

function check(error: { message: string } | null, label: string) {
  if (error) {
    console.error(`✗ ${label}:`, error.message);
    process.exit(1);
  }
}

async function reset() {
  // Delete in FK-safe order (child → parent). Seeded tables only.
  const tables = [
    "reviews",
    "availability_rules",
    "media",
    "addons",
    "packages",
    "listings",
    "providers",
    "categories",
    "markets",
  ];
  for (const t of tables) {
    const { error } = await db.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    check(error, `clear ${t}`);
  }
}

async function main() {
  console.log("Resetting seeded tables…");
  await reset();

  // Markets
  const { data: markets, error: mErr } = await db
    .from("markets")
    .insert(MARKETS.map((m) => ({ slug: m.slug, name: m.name, region: m.region, is_active: m.isActive })))
    .select("id, slug");
  check(mErr, "insert markets");
  const marketIdBySlug = new Map(markets!.map((m) => [m.slug, m.id as string]));
  const nycId = marketIdBySlug.get("nyc")!;

  // Categories — map dataset id (cat-*) → db uuid via slug
  const { data: cats, error: cErr } = await db
    .from("categories")
    .insert(
      CATEGORIES.map((c) => ({
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        icon: c.icon,
        hero_image_url: c.heroImageUrl,
        sort_order: c.sortOrder,
      })),
    )
    .select("id, slug");
  check(cErr, "insert categories");
  const catSlugByDatasetId = new Map(CATEGORIES.map((c) => [c.id, c.slug]));
  const catIdBySlug = new Map(cats!.map((c) => [c.slug, c.id as string]));
  const catDbId = (datasetId: string) => catIdBySlug.get(catSlugByDatasetId.get(datasetId)!)!;

  let listingCount = 0;
  let reviewCount = 0;

  for (const p of PROVIDERS) {
    const { data: prov, error: pErr } = await db
      .from("providers")
      .insert({
        business_name: p.businessName,
        slug: p.slug,
        tagline: p.tagline,
        bio: p.bio,
        avatar_url: p.avatarUrl,
        cover_image_url: p.coverImageUrl,
        category_id: catDbId(p.categoryId),
        market_id: nycId,
        neighborhood: p.neighborhood,
        years_experience: p.yearsExperience,
        response_rate: p.responseRate,
        response_minutes: p.responseMinutes,
        rating_avg: p.ratingAvg,
        rating_count: p.ratingCount,
        instant_book: p.instantBook,
        is_verified: p.isVerified,
        is_published: p.isPublished,
        credentials: p.credentials,
      })
      .select("id")
      .single();
    check(pErr, `insert provider ${p.slug}`);
    const providerId = prov!.id as string;

    const listing = p.listings[0];
    const { data: lst, error: lErr } = await db
      .from("listings")
      .insert({
        provider_id: providerId,
        category_id: catDbId(listing.categoryId),
        title: listing.title,
        description: listing.description,
        pricing_model: listing.pricingModel,
        base_price_cents: listing.basePriceCents,
        unit_label: listing.unitLabel,
        min_hours: listing.minHours,
        min_guests: listing.minGuests,
        max_guests: listing.maxGuests,
        travel_radius_miles: listing.travelRadiusMiles,
        travel_fee_cents: listing.travelFeeCents,
        instant_book: listing.instantBook,
        includes: listing.includes,
        is_published: true,
      })
      .select("id")
      .single();
    check(lErr, `insert listing ${listing.id}`);
    const listingId = lst!.id as string;
    listingCount++;

    if (listing.packages.length) {
      check(
        (
          await db.from("packages").insert(
            listing.packages.map((pkg, i) => ({
              listing_id: listingId,
              name: pkg.name,
              description: pkg.description,
              price_cents: pkg.priceCents,
              includes: pkg.includes,
              sort_order: i,
            })),
          )
        ).error,
        "insert packages",
      );
    }

    if (listing.addons.length) {
      check(
        (
          await db.from("addons").insert(
            listing.addons.map((a, i) => ({
              listing_id: listingId,
              name: a.name,
              description: a.description,
              price_cents: a.priceCents,
              price_per_guest: a.pricePerGuest,
              sort_order: i,
            })),
          )
        ).error,
        "insert addons",
      );
    }

    check(
      (
        await db.from("media").insert(
          listing.gallery.map((m, i) => ({
            listing_id: listingId,
            kind: m.kind,
            url: m.url,
            sort_order: i,
          })),
        )
      ).error,
      "insert media",
    );

    check(
      (
        await db.from("availability_rules").insert(
          p.availability.map((r) => ({
            provider_id: providerId,
            weekday: r.weekday,
            start_time: r.startTime,
            end_time: r.endTime,
          })),
        )
      ).error,
      "insert availability",
    );

    if (p.reviews.length) {
      check(
        (
          await db.from("reviews").insert(
            p.reviews.map((r) => ({
              provider_id: providerId,
              rating: r.rating,
              body: r.body,
              author_name: r.authorName,
              author_avatar_url: r.authorAvatarUrl,
              event_type: r.eventType,
              created_at: r.createdAt,
            })),
          )
        ).error,
        "insert reviews",
      );
      reviewCount += p.reviews.length;
    }
  }

  console.log(
    `✓ Seeded ${MARKETS.length} markets, ${CATEGORIES.length} categories, ${PROVIDERS.length} providers, ${listingCount} listings, ${reviewCount} reviews.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
