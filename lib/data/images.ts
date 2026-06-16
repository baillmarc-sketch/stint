/**
 * Deterministic, always-resolving image URLs for the demo dataset.
 *
 * We intentionally use picsum.photos (scenery/gallery) + randomuser.me (portraits)
 * because they never 404 and are reproducible from a seed — so nothing renders
 * broken during an investor walkthrough. Pre-launch we swap these for licensed
 * category imagery and real provider uploads in Supabase Storage (see plan).
 */

export function coverImage(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/800`;
}

export function galleryImage(seed: string, index: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(`${seed}-g${index}`)}/1000/750`;
}

export function galleryImages(seed: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => galleryImage(seed, i + 1));
}

export function categoryHero(slug: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(`cat-${slug}`)}/1400/700`;
}

/** Photographic portrait, deterministic by index (men/women 0–99). */
export function portrait(gender: "men" | "women", index: number): string {
  return `https://randomuser.me/api/portraits/${gender}/${index % 100}.jpg`;
}

/** Smaller thumb portrait used for review authors. */
export function thumbPortrait(gender: "men" | "women", index: number): string {
  return `https://randomuser.me/api/portraits/thumb/${gender}/${index % 100}.jpg`;
}
