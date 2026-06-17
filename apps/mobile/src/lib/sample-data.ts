import type { Provider } from "@stint/core";

/**
 * A compact, bundled provider set so the app renders in Expo Go with zero backend.
 * Uses the shared `@stint/core` domain types — the same shapes the web app and the
 * Supabase seed produce. Swap for a live Supabase fetch when the shared data layer
 * lands (see README).
 */

type Seed = {
  id: string;
  businessName: string;
  ownerName: string;
  categoryId: string;
  neighborhood: string;
  rating: number;
  ratingCount: number;
  instant: boolean;
  verified: boolean;
  avatar: string;
  credentials: string[];
  tagline: string;
  bio: string;
  listingTitle: string;
  pricingModel: Provider["listings"][number]["pricingModel"];
  basePriceCents: number;
  unitLabel: string;
  includes: string[];
};

function build(s: Seed): Provider {
  return {
    id: s.id,
    slug: s.id,
    businessName: s.businessName,
    ownerName: s.ownerName,
    tagline: s.tagline,
    bio: s.bio,
    avatarUrl: s.avatar,
    coverImageUrl: `https://picsum.photos/seed/${s.id}/800/520`,
    categoryId: s.categoryId,
    marketId: "mkt-nyc",
    neighborhood: s.neighborhood,
    yearsExperience: 8,
    ratingAvg: s.rating,
    ratingCount: s.ratingCount,
    responseRate: 0.95,
    responseMinutes: 45,
    instantBook: s.instant,
    isVerified: s.verified,
    isPublished: true,
    credentials: s.credentials,
    availability: [],
    reviews: [],
    listings: [
      {
        id: `${s.id}-listing`,
        providerId: s.id,
        categoryId: s.categoryId,
        title: s.listingTitle,
        description: s.bio,
        pricingModel: s.pricingModel,
        basePriceCents: s.basePriceCents,
        unitLabel: s.unitLabel,
        minHours: s.pricingModel === "hourly" ? 3 : null,
        minGuests: 6,
        maxGuests: 80,
        travelRadiusMiles: 30,
        travelFeeCents: 3000,
        instantBook: s.instant,
        packages: [],
        addons: [],
        gallery: [],
        includes: s.includes,
      },
    ],
  };
}

export const sampleProviders: Provider[] = [
  build({
    id: "sakura-hibachi-at-home",
    businessName: "Sakura Hibachi at Home",
    ownerName: "Kenji Watanabe",
    categoryId: "cat-food-drink",
    neighborhood: "Astoria",
    rating: 4.9,
    ratingCount: 214,
    instant: true,
    verified: true,
    avatar: "https://randomuser.me/api/portraits/men/33.jpg",
    credentials: ["Food Handler certified", "Fully insured", "Brings own grill"],
    tagline: "Restaurant-grade hibachi on your patio or rooftop",
    bio: "A full teppanyaki show — onion volcano included — cooked tableside on a portable flat-top. Choose your proteins; we handle setup and cleanup.",
    listingTitle: "Private Hibachi Experience",
    pricingModel: "package",
    basePriceCents: 65000,
    unitLabel: "per event",
    includes: ["Chef + portable grill", "Fried rice & vegetables", "Signature sauces", "Setup and cleanup"],
  }),
  build({
    id: "the-velvet-pour-bar-co",
    businessName: "The Velvet Pour Bar Co.",
    ownerName: "Simone Adler",
    categoryId: "cat-food-drink",
    neighborhood: "West Village",
    rating: 4.8,
    ratingCount: 168,
    instant: true,
    verified: true,
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    credentials: ["TIPS certified", "Liquor liability insured"],
    tagline: "Craft cocktails and a proper bartender for your night",
    bio: "A pro bartender with a custom menu, bar tools, and the polish to run your bar all night. You provide the alcohol; we bring everything else.",
    listingTitle: "Craft Cocktail Bartender",
    pricingModel: "hourly",
    basePriceCents: 9500,
    unitLabel: "per hour",
    includes: ["Custom 3-cocktail menu", "Bar kit & shakers", "Garnish prep", "Setup & breakdown"],
  }),
  build({
    id: "dj-pulse-nyc",
    businessName: "DJ Pulse NYC",
    ownerName: "Andre Coleman",
    categoryId: "cat-music",
    neighborhood: "Harlem",
    rating: 4.9,
    ratingCount: 301,
    instant: true,
    verified: true,
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    credentials: ["Pro sound + lighting", "Insured", "MC included"],
    tagline: "Open-format DJ who reads the room",
    bio: "Full sound system, dance lighting, and MC services with custom playlist planning. Beat-matched, open-format, and genuinely good at keeping a floor full.",
    listingTitle: "Open-Format Party DJ",
    pricingModel: "hourly",
    basePriceCents: 18000,
    unitLabel: "per hour",
    includes: ["Pro PA system", "Dance-floor lighting", "MC / announcements", "Playlist planning call"],
  }),
  build({
    id: "bubbles-the-clown-co",
    businessName: "Bubbles the Clown & Co.",
    ownerName: "Carla Jimenez",
    categoryId: "cat-kids",
    neighborhood: "Park Slope",
    rating: 4.9,
    ratingCount: 205,
    instant: true,
    verified: true,
    avatar: "https://randomuser.me/api/portraits/women/9.jpg",
    credentials: ["Background-checked", "Insured", "Toddler-friendly"],
    tagline: "Gentle, giggly clowning for little kids",
    bio: "Warm, never-scary clowning — games, simple magic, and balloon animals tuned for toddlers and early-elementary kids.",
    listingTitle: "Kids' Clown Entertainer",
    pricingModel: "package",
    basePriceCents: 35000,
    unitLabel: "per hour",
    includes: ["1 hour of entertainment", "Interactive games", "Simple magic", "Balloon animals for all"],
  }),
  build({
    id: "goldlight-event-photography",
    businessName: "Goldlight Event Photography",
    ownerName: "Devon Pierce",
    categoryId: "cat-photo-video",
    neighborhood: "Williamsburg",
    rating: 4.9,
    ratingCount: 188,
    instant: true,
    verified: true,
    avatar: "https://randomuser.me/api/portraits/men/30.jpg",
    credentials: ["Pro gear + backup", "Insured", "48-hr previews"],
    tagline: "Candid, editorial event photography",
    bio: "Events shot the way you want to remember them — candid, warm, editorial — with a fast-turnaround gallery you'll want to share the next morning.",
    listingTitle: "Event Photographer",
    pricingModel: "hourly",
    basePriceCents: 25000,
    unitLabel: "per hour",
    includes: ["Pro photographer", "Candid + posed", "Edited online gallery", "48-hr sneak peek"],
  }),
  build({
    id: "afterparty-cleaning-crew",
    businessName: "AfterParty Cleaning Crew",
    ownerName: "Lucia Romano",
    categoryId: "cat-cleaning",
    neighborhood: "Long Island City",
    rating: 4.9,
    ratingCount: 167,
    instant: true,
    verified: true,
    avatar: "https://randomuser.me/api/portraits/women/58.jpg",
    credentials: ["Bonded & insured", "Eco supplies", "Same-night service"],
    tagline: "Post-event cleanup so you can just go to bed",
    bio: "A two-person crew that swoops in after the last guest leaves — dishes, trash, surfaces, floors — and returns your space to spotless.",
    listingTitle: "Post-Event Cleanup",
    pricingModel: "flat",
    basePriceCents: 28000,
    unitLabel: "per event (up to 3 hrs)",
    includes: ["2-person crew", "Dishes & trash-out", "Surfaces & floors", "Eco-friendly supplies"],
  }),
];
