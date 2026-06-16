import type { Review } from "@/types/domain";
import { thumbPortrait } from "./images";

const REVIEWER_NAMES = [
  "Jess M.", "Marcus T.", "Priya R.", "Danielle K.", "Tom W.", "Sofia L.",
  "Andre J.", "Hannah B.", "Kevin O.", "Mia C.", "Derek S.", "Olivia P.",
  "Raj P.", "Chloe D.", "Nate F.", "Bianca G.", "Sam H.", "Lena V.",
  "Marco A.", "Yara N.", "Jordan E.", "Tasha R.", "Will C.", "Erika S.",
];

const EVENT_TYPES = [
  "Birthday party", "Backyard dinner", "Corporate happy hour", "Bridal shower",
  "Anniversary", "Rooftop party", "Kids' birthday", "Holiday party",
  "Engagement party", "Block party", "Graduation", "Housewarming",
];

const BODIES: string[] = [
  "Absolutely made our night. Showed up early, super professional, and our guests are still talking about it.",
  "Booking through Stint was the easiest part of planning the whole thing. Would 100% rebook.",
  "Communication was great from the first message. Everything was exactly as described — no surprises.",
  "Worth every penny. Set up fast, cleaned up after, and brought such great energy.",
  "Our guests were blown away. Genuinely the highlight of the event.",
  "So glad we found them. On time, talented, and just easy to work with.",
  "Flexible with our last-minute changes and still nailed it. Highly recommend.",
  "Professional, warm, and incredibly good at what they do. Already telling friends.",
  "Exceeded expectations. The quality was way above what we paid.",
  "Smooth from start to finish. Quote was clear and the day-of was flawless.",
  "Read the room perfectly and kept things going all night. Five stars.",
  "Brought everything needed and made it look effortless. Will be our go-to.",
];

/** Deterministic review set for a provider seed. */
export function buildReviews(seed: string, count: number, baseRating: number): Review[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = (n: number) => {
    h = (h * 1103515245 + 12345) >>> 0;
    return h % n;
  };

  const reviews: Review[] = [];
  for (let i = 0; i < count; i++) {
    const gender: "men" | "women" = rand(2) === 0 ? "men" : "women";
    const portraitIdx = rand(100);
    // Most reviews at or near the provider's average, a few a touch lower.
    const ratingRoll = rand(10);
    const rating = ratingRoll < 7 ? 5 : Math.max(4, Math.round(baseRating));
    const daysAgo = 3 + rand(420);
    const created = new Date(Date.now() - daysAgo * 86400000);
    reviews.push({
      id: `${seed}-rev-${i}`,
      authorName: REVIEWER_NAMES[rand(REVIEWER_NAMES.length)],
      authorAvatarUrl: thumbPortrait(gender, portraitIdx),
      rating,
      body: BODIES[rand(BODIES.length)],
      eventType: EVENT_TYPES[rand(EVENT_TYPES.length)],
      createdAt: created.toISOString(),
    });
  }
  return reviews;
}
