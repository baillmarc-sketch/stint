import type { Category } from "@/types/domain";
import { categoryHero } from "./images";

/**
 * Top-level browse categories for the NYC demo. `icon` is a lucide-react
 * component name resolved by components/shared/category-icon.tsx.
 */
export const CATEGORIES: Category[] = [
  {
    id: "cat-food-drink",
    slug: "food-drink",
    name: "Food & Drink",
    tagline: "Hibachi, private chefs, bartenders & more",
    description:
      "Private chefs, hibachi and sushi cooks, taco and pizza stations, bartenders, and mixologists who bring the kitchen — and the bar — to your event.",
    icon: "ChefHat",
    heroImageUrl: categoryHero("food-drink"),
    sortOrder: 1,
  },
  {
    id: "cat-music",
    slug: "music",
    name: "Music",
    tagline: "DJs, live bands & solo musicians",
    description:
      "DJs, live bands, mariachi, saxophonists, violinists, and karaoke hosts to set the tone for any room.",
    icon: "Music",
    heroImageUrl: categoryHero("music"),
    sortOrder: 2,
  },
  {
    id: "cat-entertainment",
    slug: "entertainment",
    name: "Entertainment",
    tagline: "Magicians, dancers, comedians & hosts",
    description:
      "Magicians, mentalists, dancers, fire performers, comedians, MCs, and casino and trivia hosts that make the night.",
    icon: "Sparkles",
    heroImageUrl: categoryHero("entertainment"),
    sortOrder: 3,
  },
  {
    id: "cat-kids",
    slug: "kids-parties",
    name: "Kids' Parties",
    tagline: "Clowns, face painters & balloon artists",
    description:
      "Clowns, balloon artists, face painters, caricaturists, character performers, and kid-friendly magicians.",
    icon: "PartyPopper",
    heroImageUrl: categoryHero("kids-parties"),
    sortOrder: 4,
  },
  {
    id: "cat-staffing",
    slug: "staffing",
    name: "Staffing",
    tagline: "Servers, bartenders & door hosts",
    description:
      "Professional servers, waitstaff, bartenders-for-hire, coat check, door hosts, and event security.",
    icon: "Users",
    heroImageUrl: categoryHero("staffing"),
    sortOrder: 5,
  },
  {
    id: "cat-cleaning",
    slug: "cleaning-setup",
    name: "Cleaning & Setup",
    tagline: "Before, after & everything between",
    description:
      "Pre- and post-event cleaning, setup, and breakdown crews so you never touch a trash bag at your own party.",
    icon: "SprayCan",
    heroImageUrl: categoryHero("cleaning-setup"),
    sortOrder: 6,
  },
  {
    id: "cat-decor",
    slug: "decor",
    name: "Decor",
    tagline: "Balloon arches, florals & lighting",
    description:
      "Balloon arches, floral installs, lighting, and furniture and decor styling that transform the space.",
    icon: "Flower2",
    heroImageUrl: categoryHero("decor"),
    sortOrder: 7,
  },
  {
    id: "cat-photo-video",
    slug: "photo-video",
    name: "Photo & Video",
    tagline: "Photographers, videographers & booths",
    description:
      "Event photographers, videographers, and photo booths to capture the night and send everyone home with proof.",
    icon: "Camera",
    heroImageUrl: categoryHero("photo-video"),
    sortOrder: 8,
  },
];

export const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));
export const CATEGORY_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));
