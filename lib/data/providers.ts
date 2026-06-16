import type { Addon, AvailabilityRule, Listing, Package, Provider } from "@/types/domain";
import { slugify } from "@/lib/utils";
import { coverImage, galleryImages, portrait } from "./images";
import { buildReviews } from "./reviews";

/* ------------------------------------------------------------------ */
/* Spec shapes — compact authoring format expanded into full Providers */
/* ------------------------------------------------------------------ */

interface PkgSpec {
  name: string;
  priceCents: number;
  description: string;
  includes: string[];
}
interface AddonSpec {
  name: string;
  priceCents: number;
  description: string;
  perGuest?: boolean;
}
interface ListingSpec {
  title: string;
  description: string;
  pricingModel: Listing["pricingModel"];
  basePriceCents: number;
  unitLabel: string;
  minHours: number | null;
  minGuests: number;
  maxGuests: number;
  travelFeeCents: number;
  includes: string[];
  packages?: PkgSpec[];
  addons?: AddonSpec[];
}
interface ProviderSpec {
  categoryId: string;
  business: string;
  owner: string;
  gender: "men" | "women";
  portraitIdx: number;
  hood: string;
  years: number;
  rating: number;
  ratingCount: number;
  responseMins: number;
  instant: boolean;
  verified: boolean;
  tagline: string;
  bio: string;
  credentials: string[];
  listing: ListingSpec;
}

const EVENING: AvailabilityRule[] = [
  { weekday: 4, startTime: "16:00", endTime: "23:00" },
  { weekday: 5, startTime: "15:00", endTime: "23:30" },
  { weekday: 6, startTime: "11:00", endTime: "23:30" },
  { weekday: 0, startTime: "11:00", endTime: "21:00" },
];
const WEEKDAYS_TOO: AvailabilityRule[] = [
  { weekday: 3, startTime: "10:00", endTime: "20:00" },
  ...EVENING,
];

function defineProvider(spec: ProviderSpec, availability: AvailabilityRule[]): Provider {
  const slug = slugify(spec.business);
  const ls = spec.listing;

  const packages: Package[] = (ls.packages ?? []).map((p, i) => ({
    id: `${slug}-pkg-${i}`,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    includes: p.includes,
  }));
  const addons: Addon[] = (ls.addons ?? []).map((a, i) => ({
    id: `${slug}-add-${i}`,
    name: a.name,
    description: a.description,
    priceCents: a.priceCents,
    pricePerGuest: Boolean(a.perGuest),
  }));

  const listing: Listing = {
    id: `${slug}-listing`,
    providerId: slug,
    categoryId: spec.categoryId,
    title: ls.title,
    description: ls.description,
    pricingModel: ls.pricingModel,
    basePriceCents: ls.basePriceCents,
    unitLabel: ls.unitLabel,
    minHours: ls.minHours,
    minGuests: ls.minGuests,
    maxGuests: ls.maxGuests,
    travelRadiusMiles: 30,
    travelFeeCents: ls.travelFeeCents,
    instantBook: spec.instant,
    packages,
    addons,
    gallery: galleryImages(slug, 6).map((url, i) => ({
      id: `${slug}-m${i}`,
      kind: "image" as const,
      url,
    })),
    includes: ls.includes,
  };

  const reviewCount = Math.min(6, Math.max(3, Math.round(spec.ratingCount / 9)));

  return {
    id: slug,
    slug,
    businessName: spec.business,
    ownerName: spec.owner,
    tagline: spec.tagline,
    bio: spec.bio,
    avatarUrl: portrait(spec.gender, spec.portraitIdx),
    coverImageUrl: coverImage(slug),
    categoryId: spec.categoryId,
    marketId: "mkt-nyc",
    neighborhood: spec.hood,
    yearsExperience: spec.years,
    ratingAvg: spec.rating,
    ratingCount: spec.ratingCount,
    responseRate: 0.92 + (spec.portraitIdx % 7) / 100,
    responseMinutes: spec.responseMins,
    instantBook: spec.instant,
    isVerified: spec.verified,
    isPublished: true,
    credentials: spec.credentials,
    availability,
    listings: [listing],
    reviews: buildReviews(slug, reviewCount, spec.rating),
  };
}

/* ------------------------------------------------------------------ */
/* Shared add-on/package fragments                                     */
/* ------------------------------------------------------------------ */

const TRAVEL_NOTE =
  "Travel within the listed radius is included; a flat travel fee applies beyond it.";

/* ------------------------------------------------------------------ */
/* FOOD & DRINK                                                        */
/* ------------------------------------------------------------------ */

const FOOD: ProviderSpec[] = [
  {
    categoryId: "cat-food-drink",
    business: "Sakura Hibachi at Home",
    owner: "Kenji Watanabe",
    gender: "men",
    portraitIdx: 33,
    hood: "Astoria",
    years: 9,
    rating: 4.9,
    ratingCount: 214,
    responseMins: 45,
    instant: true,
    verified: true,
    tagline: "Restaurant-grade hibachi on your patio or rooftop",
    bio: "Trained in Midtown teppanyaki kitchens, Kenji brings the full hibachi show — onion volcano included — to backyards and rooftops across NYC. He arrives with his own flat-top grill, ingredients, and showmanship.",
    credentials: ["NYC Food Handler certified", "Fully insured", "Brings own equipment"],
    listing: {
      title: "Private Hibachi Experience",
      description:
        "A full teppanyaki dinner cooked tableside on a portable flat-top, with the tricks, the sauces, and the leftovers. Choose your proteins and we handle the rest.",
      pricingModel: "package",
      basePriceCents: 65000,
      unitLabel: "per event",
      minHours: null,
      minGuests: 6,
      maxGuests: 30,
      travelFeeCents: 3000,
      includes: ["Chef + portable grill", "Fried rice & vegetables", "Signature yum-yum & ginger sauces", "All setup and cleanup"],
      packages: [
        { name: "Classic", priceCents: 65000, description: "Two proteins per guest", includes: ["Chicken & steak", "Fried rice", "Seasonal veg", "Salad"] },
        { name: "Premium", priceCents: 89000, description: "Three proteins incl. shrimp", includes: ["Chicken, steak & shrimp", "Fried rice", "Seasonal veg", "Side salad", "Sake toast"] },
        { name: "Deluxe", priceCents: 125000, description: "Filet & lobster upgrade", includes: ["Filet mignon & lobster", "Scallops", "Fried rice", "Premium veg", "Sake service"] },
      ],
      addons: [
        { name: "Extra protein per guest", priceCents: 1200, description: "Add an additional protein", perGuest: true },
        { name: "Sake service", priceCents: 9000, description: "Premium sake for the table" },
        { name: "Gyoza appetizer", priceCents: 4500, description: "Two dozen pan-fried dumplings" },
      ],
    },
  },
  {
    categoryId: "cat-food-drink",
    business: "The Velvet Pour Bar Co.",
    owner: "Simone Adler",
    gender: "women",
    portraitIdx: 12,
    hood: "West Village",
    years: 7,
    rating: 4.8,
    ratingCount: 168,
    responseMins: 30,
    instant: true,
    verified: true,
    tagline: "Craft cocktails and a proper bartender for your night",
    bio: "Simone has run the stick at some of the city's best cocktail rooms. She builds custom menus around your event and pours with the kind of speed that keeps a line moving and a party going.",
    credentials: ["TIPS certified", "Liquor liability insured", "Custom menu design"],
    listing: {
      title: "Craft Cocktail Bartender",
      description:
        "A pro bartender with a custom two-to-three cocktail menu, bar tools, and the polish to run your bar all night. You provide the alcohol; we bring everything else.",
      pricingModel: "hourly",
      basePriceCents: 9500,
      unitLabel: "per hour",
      minHours: 4,
      minGuests: 10,
      maxGuests: 120,
      travelFeeCents: 2500,
      includes: ["Custom 3-cocktail menu", "Bar kit, shakers & jiggers", "Garnish prep", "Setup & breakdown"],
      addons: [
        { name: "Second bartender", priceCents: 38000, description: "Adds a second pro for larger crowds" },
        { name: "Mobile bar cart", priceCents: 15000, description: "Styled rolling bar for the night" },
        { name: "Batched welcome cocktail", priceCents: 6500, description: "Pre-batched signature on arrival" },
      ],
    },
  },
  {
    categoryId: "cat-food-drink",
    business: "Cocina Nomada Taco Bar",
    owner: "Mateo Rivas",
    gender: "men",
    portraitIdx: 51,
    hood: "Bushwick",
    years: 6,
    rating: 4.9,
    ratingCount: 142,
    responseMins: 60,
    instant: false,
    verified: true,
    tagline: "A live taco station with handmade tortillas",
    bio: "Mateo runs a roving taco station with a comal, fresh-pressed tortillas, and three slow-cooked fillings. Guests build their own — it's the most-photographed table at every party.",
    credentials: ["NYC Food Handler certified", "Insured", "Vegetarian options"],
    listing: {
      title: "Live Taco Station",
      description:
        "An attended taco bar with handmade tortillas, three fillings, salsas, and all the fixings. Priced per guest with a station minimum.",
      pricingModel: "flat",
      basePriceCents: 48000,
      unitLabel: "per station (up to 20)",
      minHours: null,
      minGuests: 15,
      maxGuests: 80,
      travelFeeCents: 3500,
      includes: ["Attended live station", "Handmade tortillas", "3 fillings + salsas", "Plates, napkins & setup"],
      addons: [
        { name: "Additional guest plate", priceCents: 1900, description: "Beyond the base 20 guests", perGuest: true },
        { name: "Fourth filling (carnitas)", priceCents: 8500, description: "Add a slow-cooked carnitas option" },
        { name: "Churro cart", priceCents: 22000, description: "Fresh churros with dips for dessert" },
      ],
    },
  },
  {
    categoryId: "cat-food-drink",
    business: "Harlow Private Chef Studio",
    owner: "Olivia Bennett",
    gender: "women",
    portraitIdx: 28,
    hood: "Tribeca",
    years: 11,
    rating: 5.0,
    ratingCount: 96,
    responseMins: 90,
    instant: false,
    verified: true,
    tagline: "Seasonal multi-course dinners in your home",
    bio: "Olivia designs and cooks intimate tasting menus around what's good at the market that week. She shops, cooks in your kitchen, plates each course, and leaves it spotless.",
    credentials: ["ServSafe certified", "10+ yrs fine dining", "Menu tasting available"],
    listing: {
      title: "Seasonal Private Dinner",
      description:
        "A bespoke multi-course dinner cooked in your kitchen. Includes menu design, market shopping, service, and cleanup. Priced per guest.",
      pricingModel: "package",
      basePriceCents: 18000,
      unitLabel: "per guest",
      minHours: null,
      minGuests: 4,
      maxGuests: 16,
      travelFeeCents: 4000,
      includes: ["Custom menu design", "Market shopping", "In-home cooking & plating", "Full kitchen cleanup"],
      packages: [
        { name: "Four course", priceCents: 18000, description: "Per guest, four courses", includes: ["Canapé", "Starter", "Main", "Dessert"] },
        { name: "Six course tasting", priceCents: 26000, description: "Per guest, six courses", includes: ["Two canapés", "Soup", "Fish", "Main", "Cheese", "Dessert"] },
      ],
      addons: [
        { name: "Wine pairing", priceCents: 6500, description: "Per guest, paired by course", perGuest: true },
        { name: "Cocktail welcome", priceCents: 4500, description: "Per guest arrival cocktail", perGuest: true },
      ],
    },
  },
  {
    categoryId: "cat-food-drink",
    business: "Brooklyn Brick Pizza Truck",
    owner: "Dominic Russo",
    gender: "men",
    portraitIdx: 64,
    hood: "Greenpoint",
    years: 8,
    rating: 4.7,
    ratingCount: 188,
    responseMins: 75,
    instant: true,
    verified: false,
    tagline: "Wood-fired Neapolitan pies, made on site",
    bio: "Dominic rolls up with a wood-fired oven and turns out blistered Neapolitan pizzas in 90 seconds flat. Endless rounds, fresh dough, and a line of very happy guests.",
    credentials: ["NYC Food Handler certified", "Insured", "Vegan cheese available"],
    listing: {
      title: "Wood-Fired Pizza Catering",
      description:
        "A live wood-fired pizza station turning out unlimited Neapolitan pies for two hours. Choose your toppings; we bring the oven, dough, and pizzaiolo.",
      pricingModel: "flat",
      basePriceCents: 95000,
      unitLabel: "per event (2 hrs)",
      minHours: null,
      minGuests: 20,
      maxGuests: 120,
      travelFeeCents: 5000,
      includes: ["Wood-fired oven on site", "Unlimited pies for 2 hrs", "5 pizza varieties", "Plates & napkins"],
      addons: [
        { name: "Extra service hour", priceCents: 35000, description: "Keep the oven going another hour" },
        { name: "Antipasto board", priceCents: 18000, description: "Grazing board to start" },
        { name: "Nutella dessert pizza", priceCents: 9000, description: "Sweet pies to finish" },
      ],
    },
  },
];

/* ------------------------------------------------------------------ */
/* MUSIC                                                               */
/* ------------------------------------------------------------------ */

const MUSIC: ProviderSpec[] = [
  {
    categoryId: "cat-music",
    business: "DJ Pulse NYC",
    owner: "Andre Coleman",
    gender: "men",
    portraitIdx: 45,
    hood: "Harlem",
    years: 12,
    rating: 4.9,
    ratingCount: 301,
    responseMins: 25,
    instant: true,
    verified: true,
    tagline: "Open-format DJ who reads the room",
    bio: "Andre has DJ'd everything from rooftop weddings to corporate galas. Open-format, beat-matched, and genuinely good at reading a crowd and keeping the floor full.",
    credentials: ["Pro sound + lighting", "Insured", "MC services included"],
    listing: {
      title: "Open-Format Party DJ",
      description:
        "A professional DJ with full sound system, dance lighting, and MC services. Custom playlist planning and do-not-play lists welcome.",
      pricingModel: "hourly",
      basePriceCents: 18000,
      unitLabel: "per hour",
      minHours: 3,
      minGuests: 20,
      maxGuests: 300,
      travelFeeCents: 4000,
      includes: ["Pro PA system", "Dance-floor lighting", "MC / announcements", "Playlist planning call"],
      addons: [
        { name: "Dancing on a cloud (dry ice)", priceCents: 30000, description: "Low-fog first-dance effect" },
        { name: "Cold-spark fountains", priceCents: 45000, description: "Indoor-safe spark machines" },
        { name: "Extra speaker for large space", priceCents: 12000, description: "Coverage for big rooms" },
      ],
    },
  },
  {
    categoryId: "cat-music",
    business: "The Sundown Trio",
    owner: "Marcus Webb",
    gender: "men",
    portraitIdx: 18,
    hood: "Fort Greene",
    years: 10,
    rating: 4.8,
    ratingCount: 87,
    responseMins: 120,
    instant: false,
    verified: true,
    tagline: "Live jazz trio for a classy evening",
    bio: "Upright bass, keys, and sax — a polished jazz trio for cocktail hours, dinners, and anything that calls for a little sophistication. Standards, bossa nova, and tasteful modern covers.",
    credentials: ["Pro musicians (union)", "Own PA", "Quiet-to-lively sets"],
    listing: {
      title: "Live Jazz Trio",
      description:
        "A three-piece jazz ensemble for cocktail hours and dinners. Two 45-minute sets within a two-hour window, with their own compact PA.",
      pricingModel: "package",
      basePriceCents: 145000,
      unitLabel: "per event",
      minHours: null,
      minGuests: 15,
      maxGuests: 150,
      travelFeeCents: 5000,
      includes: ["3 professional musicians", "Two 45-min sets", "Compact PA system", "Song requests"],
      packages: [
        { name: "Cocktail set", priceCents: 145000, description: "Two sets over 2 hours", includes: ["Trio", "2 sets", "PA"] },
        { name: "Extended evening", priceCents: 210000, description: "Three sets over 3 hours", includes: ["Trio", "3 sets", "PA", "Requests"] },
      ],
      addons: [
        { name: "Add a vocalist", priceCents: 45000, description: "Lead singer joins the trio" },
        { name: "Ceremony / first-song learn", priceCents: 20000, description: "Custom song prepared for you" },
      ],
    },
  },
  {
    categoryId: "cat-music",
    business: "Mariachi Sol de Queens",
    owner: "Rosa Delgado",
    gender: "women",
    portraitIdx: 40,
    hood: "Forest Hills",
    years: 14,
    rating: 4.9,
    ratingCount: 122,
    responseMins: 90,
    instant: false,
    verified: true,
    tagline: "Five-piece mariachi to surprise and serenade",
    bio: "A spirited five-piece mariachi in full traje, perfect for birthdays, anniversaries, and surprises. They'll learn a special request and bring the whole room to its feet.",
    credentials: ["Authentic 5-piece", "Full traje", "Bilingual"],
    listing: {
      title: "Live Mariachi Band",
      description:
        "A five-piece mariachi for a one-hour serenade set — trumpets, violins, guitarrón, and vocals. Ideal for surprises and celebrations.",
      pricingModel: "package",
      basePriceCents: 95000,
      unitLabel: "per hour set",
      minHours: null,
      minGuests: 5,
      maxGuests: 200,
      travelFeeCents: 4500,
      includes: ["5 musicians in full traje", "One-hour live set", "Request a special song", "Roaming or staged"],
      addons: [
        { name: "Second hour", priceCents: 80000, description: "Extend the performance" },
        { name: "Learn a custom song", priceCents: 15000, description: "We'll prepare your request" },
      ],
    },
  },
  {
    categoryId: "cat-music",
    business: "Velvet Keys Piano",
    owner: "Daniel Okafor",
    gender: "men",
    portraitIdx: 72,
    hood: "Upper West Side",
    years: 16,
    rating: 5.0,
    ratingCount: 64,
    responseMins: 150,
    instant: false,
    verified: true,
    tagline: "Solo pianist for an elegant atmosphere",
    bio: "A conservatory-trained pianist for weddings, dinners, and salons. Daniel brings a stage piano or plays yours, with a repertoire from Gershwin to contemporary covers.",
    credentials: ["Conservatory trained", "Brings stage piano", "Broad repertoire"],
    listing: {
      title: "Solo Pianist",
      description:
        "An elegant solo piano performance for cocktail hours and dinners. Two hours of continuous background music, with requests.",
      pricingModel: "hourly",
      basePriceCents: 16000,
      unitLabel: "per hour",
      minHours: 2,
      minGuests: 2,
      maxGuests: 120,
      travelFeeCents: 6000,
      includes: ["Professional pianist", "Stage piano available", "Curated repertoire", "Song requests"],
      addons: [
        { name: "Stage piano rental", priceCents: 18000, description: "Weighted 88-key digital piano" },
        { name: "Learn a special song", priceCents: 15000, description: "Custom piece for your moment" },
      ],
    },
  },
];

/* ------------------------------------------------------------------ */
/* ENTERTAINMENT                                                       */
/* ------------------------------------------------------------------ */

const ENTERTAINMENT: ProviderSpec[] = [
  {
    categoryId: "cat-entertainment",
    business: "The Astonishing Mr. Vale",
    owner: "Julian Vale",
    gender: "men",
    portraitIdx: 53,
    hood: "Chelsea",
    years: 13,
    rating: 4.9,
    ratingCount: 176,
    responseMins: 60,
    instant: true,
    verified: true,
    tagline: "Sleight-of-hand magic that works any room",
    bio: "Julian works the room with close-up, walk-around magic that has guests gasping inches from their faces — then closes with a stand-up set that's equal parts mind-reading and comedy.",
    credentials: ["Society of American Magicians", "Insured", "Family-friendly or adult"],
    listing: {
      title: "Close-Up & Stage Magician",
      description:
        "Walk-around close-up magic plus an optional stand-up set. Perfect for cocktail hours and dinners where you want guests buzzing.",
      pricingModel: "package",
      basePriceCents: 75000,
      unitLabel: "per event",
      minHours: null,
      minGuests: 10,
      maxGuests: 150,
      travelFeeCents: 3500,
      includes: ["Walk-around close-up magic", "Up to 90 minutes", "Adapts to any space", "All props provided"],
      packages: [
        { name: "Strolling", priceCents: 75000, description: "90 min walk-around", includes: ["Close-up magic", "Up to 90 min"] },
        { name: "Strolling + stage", priceCents: 110000, description: "Walk-around plus a 25-min stand-up set", includes: ["Close-up magic", "25-min stage show", "Up to 2 hrs"] },
      ],
      addons: [
        { name: "Custom finale reveal", priceCents: 15000, description: "Personalized ending for the guest of honor" },
      ],
    },
  },
  {
    categoryId: "cat-entertainment",
    business: "Ember & Ash Fire Show",
    owner: "Nadia Flores",
    gender: "women",
    portraitIdx: 21,
    hood: "Bushwick",
    years: 8,
    rating: 4.8,
    ratingCount: 93,
    responseMins: 100,
    instant: false,
    verified: true,
    tagline: "Choreographed fire and LED performance",
    bio: "Nadia and her troupe perform choreographed fire poi, staff, and LED routines — a jaw-dropping centerpiece for rooftops, warehouses, and backyards with the space to wow.",
    credentials: ["Fire-safety certified", "Insured", "Indoor LED option"],
    listing: {
      title: "Fire & LED Performance",
      description:
        "A choreographed 15-minute fire or LED set with safety crew. Fire requires outdoor clearance; an indoor-safe LED version is available.",
      pricingModel: "package",
      basePriceCents: 120000,
      unitLabel: "per performance",
      minHours: null,
      minGuests: 20,
      maxGuests: 400,
      travelFeeCents: 6000,
      includes: ["15-min choreographed set", "Safety crew", "Fire or LED", "Music sync"],
      packages: [
        { name: "Solo set", priceCents: 120000, description: "One performer, 15 min", includes: ["Solo routine", "Safety crew"] },
        { name: "Duo spectacle", priceCents: 195000, description: "Two performers, paired choreography", includes: ["Two performers", "Safety crew", "Music sync"] },
      ],
      addons: [
        { name: "Roaming pre-show", priceCents: 35000, description: "30 min of roaming LED before the set" },
      ],
    },
  },
  {
    categoryId: "cat-entertainment",
    business: "High Roller Casino Nights",
    owner: "Vincent Pearce",
    gender: "men",
    portraitIdx: 67,
    hood: "Financial District",
    years: 9,
    rating: 4.7,
    ratingCount: 110,
    responseMins: 120,
    instant: false,
    verified: false,
    tagline: "Vegas-style tables and dealers, delivered",
    bio: "Vincent brings full-size casino tables and tuxedoed dealers for blackjack, roulette, and craps. Funny money, real fun — a guaranteed crowd-gatherer for corporate and milestone parties.",
    credentials: ["Pro dealers", "Real tables", "Custom funny money"],
    listing: {
      title: "Casino Night Package",
      description:
        "Authentic casino tables with professional dealers for a three-hour gaming experience. Includes chips, funny money, and setup.",
      pricingModel: "package",
      basePriceCents: 180000,
      unitLabel: "per event (3 hrs)",
      minHours: null,
      minGuests: 20,
      maxGuests: 200,
      travelFeeCents: 7500,
      includes: ["Casino tables + dealers", "3 hours of gaming", "Chips & funny money", "Setup & breakdown"],
      packages: [
        { name: "Two tables", priceCents: 180000, description: "Blackjack + roulette", includes: ["2 tables", "2 dealers", "3 hrs"] },
        { name: "Four tables", priceCents: 320000, description: "Adds craps + a second blackjack", includes: ["4 tables", "4 dealers", "3 hrs", "Custom money"] },
      ],
      addons: [
        { name: "Prize wheel finale", priceCents: 20000, description: "Cash-in tournament with a prize wheel" },
      ],
    },
  },
  {
    categoryId: "cat-entertainment",
    business: "Punchline Pat — Comedy & Trivia",
    owner: "Pat Donnelly",
    gender: "men",
    portraitIdx: 4,
    hood: "Lower East Side",
    years: 7,
    rating: 4.8,
    ratingCount: 134,
    responseMins: 40,
    instant: true,
    verified: false,
    tagline: "Host-driven trivia and stand-up for any crowd",
    bio: "Pat runs the kind of trivia night that turns coworkers into rivals — fast, funny, and customizable — and can close with a clean stand-up set. Great for office parties and reunions.",
    credentials: ["Pro host/MC", "Custom rounds", "Clean or adult"],
    listing: {
      title: "Trivia Host & Comedian",
      description:
        "A high-energy hosted trivia experience with custom rounds, plus an optional stand-up set. Bring your own sound or add ours.",
      pricingModel: "hourly",
      basePriceCents: 22000,
      unitLabel: "per hour",
      minHours: 2,
      minGuests: 10,
      maxGuests: 120,
      travelFeeCents: 3000,
      includes: ["Hosted trivia", "Custom themed rounds", "Scoring & prizes flow", "Mic + light PA"],
      addons: [
        { name: "Custom company round", priceCents: 9000, description: "Inside-joke round about your team" },
        { name: "20-min stand-up set", priceCents: 30000, description: "Close the night with comedy" },
      ],
    },
  },
];

/* ------------------------------------------------------------------ */
/* KIDS' PARTIES                                                       */
/* ------------------------------------------------------------------ */

const KIDS: ProviderSpec[] = [
  {
    categoryId: "cat-kids",
    business: "Bubbles the Clown & Co.",
    owner: "Carla Jimenez",
    gender: "women",
    portraitIdx: 9,
    hood: "Park Slope",
    years: 11,
    rating: 4.9,
    ratingCount: 205,
    responseMins: 35,
    instant: true,
    verified: true,
    tagline: "Gentle, giggly clowning for little kids",
    bio: "Carla's clowning is warm and never scary — games, magic, and balloon animals tuned for toddlers and early-elementary kids. Parents love how she keeps the whole room engaged.",
    credentials: ["Background-checked", "Insured", "Toddler-friendly"],
    listing: {
      title: "Kids' Clown Entertainer",
      description:
        "An hour of games, simple magic, and balloon animals built for younger children. Adapts on the fly to keep every kid included.",
      pricingModel: "package",
      basePriceCents: 35000,
      unitLabel: "per hour",
      minHours: null,
      minGuests: 5,
      maxGuests: 30,
      travelFeeCents: 2500,
      includes: ["1 hour of entertainment", "Interactive games", "Simple magic", "Balloon animals for all"],
      packages: [
        { name: "One hour", priceCents: 35000, description: "Games, magic, balloons", includes: ["1 hr", "Balloon animals"] },
        { name: "Deluxe 90 min", priceCents: 49000, description: "Adds face painting", includes: ["90 min", "Balloons", "Face painting"] },
      ],
      addons: [
        { name: "Add face painting", priceCents: 15000, description: "Adds a painted-face station" },
        { name: "Themed character costume", priceCents: 10000, description: "Dress as your child's favorite" },
      ],
    },
  },
  {
    categoryId: "cat-kids",
    business: "Brushstrokes Face Painting",
    owner: "Amara Okeke",
    gender: "women",
    portraitIdx: 34,
    hood: "Crown Heights",
    years: 6,
    rating: 4.9,
    ratingCount: 158,
    responseMins: 50,
    instant: true,
    verified: true,
    tagline: "Gorgeous, fast face painting kids adore",
    bio: "Amara paints fast and beautifully — tigers, butterflies, superheroes — with skin-safe, hypoallergenic paints. A reliable line-mover for birthday parties and street fairs.",
    credentials: ["Hypoallergenic paints", "Background-checked", "Insured"],
    listing: {
      title: "Face Painting Station",
      description:
        "A face-painting artist with skin-safe paints and a menu of designs, painting roughly 12–15 kids an hour.",
      pricingModel: "hourly",
      basePriceCents: 12500,
      unitLabel: "per hour",
      minHours: 2,
      minGuests: 5,
      maxGuests: 60,
      travelFeeCents: 2000,
      includes: ["Pro face painter", "Skin-safe paints", "Design menu", "~12–15 kids/hr"],
      addons: [
        { name: "Glitter tattoos", priceCents: 8000, description: "Add a glitter-tattoo option" },
        { name: "Second artist", priceCents: 24000, description: "Double the throughput for big parties" },
      ],
    },
  },
  {
    categoryId: "cat-kids",
    business: "Twist & Float Balloon Art",
    owner: "Greg Halloran",
    gender: "men",
    portraitIdx: 25,
    hood: "Forest Hills",
    years: 5,
    rating: 4.7,
    ratingCount: 89,
    responseMins: 60,
    instant: true,
    verified: false,
    tagline: "Wild balloon sculptures and arches",
    bio: "Greg builds balloon creations way beyond the basic dog — swords, crowns, animal hats, and full photo-ready arches. A roaming favorite that keeps kids (and adults) delighted.",
    credentials: ["Insured", "Roaming or stationed", "Arch installs"],
    listing: {
      title: "Balloon Artist",
      description:
        "Roaming balloon-twisting for an hour, with optional decorative arches installed before guests arrive.",
      pricingModel: "hourly",
      basePriceCents: 13000,
      unitLabel: "per hour",
      minHours: 1,
      minGuests: 5,
      maxGuests: 50,
      travelFeeCents: 2000,
      includes: ["Roaming balloon art", "Complex sculptures", "Kid-favorite designs", "All materials"],
      addons: [
        { name: "Balloon arch install", priceCents: 22000, description: "Photo-ready entrance arch" },
        { name: "Themed color palette", priceCents: 5000, description: "Match your party colors" },
      ],
    },
  },
];

/* ------------------------------------------------------------------ */
/* STAFFING                                                            */
/* ------------------------------------------------------------------ */

const STAFFING: ProviderSpec[] = [
  {
    categoryId: "cat-staffing",
    business: "Black Tie Event Staff",
    owner: "Renata Cruz",
    gender: "women",
    portraitIdx: 47,
    hood: "Midtown",
    years: 10,
    rating: 4.8,
    ratingCount: 142,
    responseMins: 45,
    instant: true,
    verified: true,
    tagline: "Polished servers and captains for any event",
    bio: "Renata staffs events with experienced, uniformed servers and captains who know fine service. Passed apps, plated dinners, or buffet flow — they make the host look effortless.",
    credentials: ["Experienced staff", "Uniformed", "Insured"],
    listing: {
      title: "Professional Event Server",
      description:
        "An experienced, uniformed server for passed apps, plated service, or buffet support. Priced per server, per hour, with a four-hour minimum.",
      pricingModel: "hourly",
      basePriceCents: 5500,
      unitLabel: "per server / hour",
      minHours: 4,
      minGuests: 10,
      maxGuests: 300,
      travelFeeCents: 1500,
      includes: ["Uniformed pro server", "Setup & service", "Bussing & light cleanup", "Captain available"],
      addons: [
        { name: "Add a captain", priceCents: 9000, description: "Per hour lead to coordinate the team" },
        { name: "Coat check staffing", priceCents: 5500, description: "Per hour coat-check attendant" },
      ],
    },
  },
  {
    categoryId: "cat-staffing",
    business: "Doorway Hosts & Security",
    owner: "Terrence Bell",
    gender: "men",
    portraitIdx: 14,
    hood: "Financial District",
    years: 13,
    rating: 4.7,
    ratingCount: 76,
    responseMins: 70,
    instant: false,
    verified: true,
    tagline: "Licensed door hosts and check-in staff",
    bio: "Terrence provides licensed, professional door staff for check-in, guest-list management, and a calm, welcoming presence. Discreet and polished, never heavy-handed.",
    credentials: ["NYS-licensed guards", "Insured", "Guest-list management"],
    listing: {
      title: "Door Host / Security",
      description:
        "A licensed door host for check-in, guest-list management, and a professional presence. Priced per guard, per hour, four-hour minimum.",
      pricingModel: "hourly",
      basePriceCents: 6500,
      unitLabel: "per guard / hour",
      minHours: 4,
      minGuests: 20,
      maxGuests: 500,
      travelFeeCents: 2000,
      includes: ["Licensed guard", "Check-in & guest list", "Professional attire", "Calm crowd flow"],
      addons: [
        { name: "Additional guard", priceCents: 26000, description: "Adds a second licensed guard (4 hrs)" },
      ],
    },
  },
];

/* ------------------------------------------------------------------ */
/* CLEANING & SETUP                                                    */
/* ------------------------------------------------------------------ */

const CLEANING: ProviderSpec[] = [
  {
    categoryId: "cat-cleaning",
    business: "AfterParty Cleaning Crew",
    owner: "Lucia Romano",
    gender: "women",
    portraitIdx: 58,
    hood: "Long Island City",
    years: 6,
    rating: 4.9,
    ratingCount: 167,
    responseMins: 40,
    instant: true,
    verified: true,
    tagline: "Post-event cleanup so you can just go to bed",
    bio: "Lucia's crew swoops in after the last guest leaves and returns your space to spotless — dishes, trash, floors, the works. The single most-loved booking on the platform.",
    credentials: ["Bonded & insured", "Eco supplies", "Same-night service"],
    listing: {
      title: "Post-Event Cleanup",
      description:
        "A two-person crew for post-party cleanup: dishes, trash-out, surfaces, and floors. Priced flat for up to three hours.",
      pricingModel: "flat",
      basePriceCents: 28000,
      unitLabel: "per event (up to 3 hrs)",
      minHours: null,
      minGuests: 1,
      maxGuests: 200,
      travelFeeCents: 2000,
      includes: ["2-person crew", "Dishes & trash-out", "Surfaces & floors", "Eco-friendly supplies"],
      addons: [
        { name: "Pre-event setup", priceCents: 18000, description: "Arrive early to set up too" },
        { name: "Extra hour", priceCents: 9000, description: "Beyond the included three hours" },
        { name: "Deep kitchen clean", priceCents: 12000, description: "Oven, stovetop & fridge wipe-down" },
      ],
    },
  },
  {
    categoryId: "cat-cleaning",
    business: "Set & Strike Event Crew",
    owner: "Marcus Idris",
    gender: "men",
    portraitIdx: 61,
    hood: "Bed-Stuy",
    years: 7,
    rating: 4.8,
    ratingCount: 84,
    responseMins: 80,
    instant: false,
    verified: false,
    tagline: "Setup and breakdown muscle for any event",
    bio: "Marcus's crew handles the heavy lifting — tables, chairs, staging, and full breakdown at the end. Reliable, fast, and gentle with venues that care about their floors.",
    credentials: ["Insured", "Furniture & staging", "Reliable timing"],
    listing: {
      title: "Setup & Breakdown Crew",
      description:
        "A three-person crew for furniture, table, and staging setup before — and full breakdown after — your event.",
      pricingModel: "flat",
      basePriceCents: 42000,
      unitLabel: "per event",
      minHours: null,
      minGuests: 1,
      maxGuests: 400,
      travelFeeCents: 3000,
      includes: ["3-person crew", "Setup before", "Breakdown after", "Furniture handling"],
      addons: [
        { name: "Same-day rental haul", priceCents: 15000, description: "Pick up / return rented items" },
      ],
    },
  },
];

/* ------------------------------------------------------------------ */
/* DECOR                                                               */
/* ------------------------------------------------------------------ */

const DECOR: ProviderSpec[] = [
  {
    categoryId: "cat-decor",
    business: "Lush & Loft Balloon Design",
    owner: "Priya Nair",
    gender: "women",
    portraitIdx: 16,
    hood: "DUMBO",
    years: 6,
    rating: 4.9,
    ratingCount: 129,
    responseMins: 55,
    instant: true,
    verified: true,
    tagline: "Designer balloon arches and installations",
    bio: "Priya creates the photo-backdrop installations all over your feed — organic balloon garlands, arches, and color stories built around your theme and delivered installed.",
    credentials: ["Custom color design", "Insured", "Install & removal"],
    listing: {
      title: "Balloon Garland & Arch Install",
      description:
        "A custom organic balloon installation designed to your colors, delivered and installed on site. Priced by garland length.",
      pricingModel: "package",
      basePriceCents: 38000,
      unitLabel: "per install",
      minHours: null,
      minGuests: 1,
      maxGuests: 300,
      travelFeeCents: 3000,
      includes: ["Custom color design", "On-site install", "Premium matte balloons", "Same-day removal option"],
      packages: [
        { name: "6 ft garland", priceCents: 38000, description: "Backdrop accent", includes: ["6 ft garland", "Install"] },
        { name: "Full arch", priceCents: 72000, description: "Statement entrance arch", includes: ["10–12 ft arch", "Install", "Greenery accents"] },
        { name: "Grand backdrop", priceCents: 120000, description: "Full photo wall + arch", includes: ["Photo wall", "Arch", "Custom sign space"] },
      ],
      addons: [
        { name: "Custom neon-style sign", priceCents: 28000, description: "Personalized LED sign for the backdrop" },
        { name: "Same-day removal", priceCents: 9000, description: "We come back to take it down" },
      ],
    },
  },
  {
    categoryId: "cat-decor",
    business: "Gilded Petal Florals",
    owner: "Heather Lin",
    gender: "women",
    portraitIdx: 38,
    hood: "West Village",
    years: 9,
    rating: 5.0,
    ratingCount: 71,
    responseMins: 110,
    instant: false,
    verified: true,
    tagline: "Event florals styled and installed",
    bio: "Heather designs and installs event florals — centerpieces, arbors, and statement moments — sourced fresh from the flower market the morning of your event.",
    credentials: ["Market-fresh sourcing", "Insured", "Design consultation"],
    listing: {
      title: "Event Floral Styling",
      description:
        "Designed and installed florals for your event — from table centerpieces to a statement arch. Includes a design consult and setup.",
      pricingModel: "package",
      basePriceCents: 65000,
      unitLabel: "per event",
      minHours: null,
      minGuests: 1,
      maxGuests: 200,
      travelFeeCents: 4000,
      includes: ["Design consultation", "Market-fresh flowers", "On-site styling", "Setup included"],
      packages: [
        { name: "Centerpieces", priceCents: 65000, description: "Up to 6 table arrangements", includes: ["6 centerpieces", "Design consult"] },
        { name: "Statement install", priceCents: 145000, description: "Arch or large floral moment", includes: ["Floral arch", "Centerpieces", "Install & strike"] },
      ],
      addons: [
        { name: "Bud-vase runners", priceCents: 18000, description: "Per long table, mixed bud vases" },
      ],
    },
  },
];

/* ------------------------------------------------------------------ */
/* PHOTO & VIDEO                                                       */
/* ------------------------------------------------------------------ */

const PHOTO: ProviderSpec[] = [
  {
    categoryId: "cat-photo-video",
    business: "Goldlight Event Photography",
    owner: "Devon Pierce",
    gender: "men",
    portraitIdx: 30,
    hood: "Williamsburg",
    years: 10,
    rating: 4.9,
    ratingCount: 188,
    responseMins: 50,
    instant: true,
    verified: true,
    tagline: "Candid, editorial event photography",
    bio: "Devon shoots events the way you actually want to remember them — candid, warm, and editorial. Fast turnaround on a gallery you'll want to share the next morning.",
    credentials: ["Pro gear + backup", "Insured", "48-hr previews"],
    listing: {
      title: "Event Photographer",
      description:
        "Professional event coverage with candid and posed shots, delivered as an edited online gallery. Priced per hour with a two-hour minimum.",
      pricingModel: "hourly",
      basePriceCents: 25000,
      unitLabel: "per hour",
      minHours: 2,
      minGuests: 2,
      maxGuests: 400,
      travelFeeCents: 2500,
      includes: ["Pro photographer", "Candid + posed", "Edited online gallery", "48-hr sneak peek"],
      addons: [
        { name: "Second shooter", priceCents: 20000, description: "Per hour, more angles & coverage" },
        { name: "Same-day highlight reel", priceCents: 30000, description: "10 edited shots within hours" },
      ],
    },
  },
  {
    categoryId: "cat-photo-video",
    business: "Loop & Flash Photo Booth",
    owner: "Tanya Brooks",
    gender: "women",
    portraitIdx: 5,
    hood: "Astoria",
    years: 5,
    rating: 4.8,
    ratingCount: 213,
    responseMins: 35,
    instant: true,
    verified: false,
    tagline: "Open-air photo & GIF booth with props",
    bio: "Tanya's open-air booth pumps out studio-quality prints, boomerang GIFs, and instant text/email sharing — with a styled backdrop and a prop trunk that gets everyone in line.",
    credentials: ["Attendant included", "Instant prints", "Custom templates"],
    listing: {
      title: "Open-Air Photo Booth",
      description:
        "A staffed open-air photo booth with unlimited prints, digital sharing, props, and a styled backdrop, for a three-hour rental.",
      pricingModel: "package",
      basePriceCents: 85000,
      unitLabel: "per event (3 hrs)",
      minHours: null,
      minGuests: 10,
      maxGuests: 300,
      travelFeeCents: 3000,
      includes: ["Open-air booth + attendant", "Unlimited prints", "GIFs + digital sharing", "Props & backdrop"],
      packages: [
        { name: "3-hour rental", priceCents: 85000, description: "Standard package", includes: ["3 hrs", "Unlimited prints", "Props"] },
        { name: "4-hour + scrapbook", priceCents: 115000, description: "Extra hour and a guest scrapbook", includes: ["4 hrs", "Scrapbook", "Custom template"] },
      ],
      addons: [
        { name: "Sequin / floral backdrop", priceCents: 12000, description: "Upgrade to a premium backdrop" },
        { name: "Custom print template", priceCents: 7500, description: "Branded with your names / logo" },
      ],
    },
  },
];

/* ------------------------------------------------------------------ */
/* Assemble                                                            */
/* ------------------------------------------------------------------ */

const ALL_SPECS: Array<{ specs: ProviderSpec[]; availability: AvailabilityRule[] }> = [
  { specs: FOOD, availability: EVENING },
  { specs: MUSIC, availability: EVENING },
  { specs: ENTERTAINMENT, availability: EVENING },
  { specs: KIDS, availability: WEEKDAYS_TOO },
  { specs: STAFFING, availability: WEEKDAYS_TOO },
  { specs: CLEANING, availability: WEEKDAYS_TOO },
  { specs: DECOR, availability: WEEKDAYS_TOO },
  { specs: PHOTO, availability: EVENING },
];

export const PROVIDERS: Provider[] = ALL_SPECS.flatMap(({ specs, availability }) =>
  specs.map((s) => defineProvider(s, availability)),
);

export { TRAVEL_NOTE };
