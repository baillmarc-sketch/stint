import { z } from "zod";

const TIME = /^\d{2}:\d{2}$/;

/** One weekly rule (0 = Sunday … 6 = Saturday). */
export const availabilityRuleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(TIME, "Use HH:MM"),
  endTime: z.string().regex(TIME, "Use HH:MM"),
});

/** A blacked-out (or explicitly open) calendar date. */
export const availabilityBlockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  isAvailable: z.boolean().default(false),
});

export const availabilitySchema = z.object({
  rules: z.array(availabilityRuleSchema).max(7).default([]),
  blocks: z.array(availabilityBlockSchema).max(60).default([]),
});

export type AvailabilityInput = z.infer<typeof availabilitySchema>;

/** Media gallery for the primary listing, in display order. */
export const mediaItemSchema = z.object({
  kind: z.enum(["image", "video"]).default("image"),
  url: z.string().url("Enter a valid URL").max(1000),
  caption: z.string().trim().max(160).default(""),
});

export const mediaSchema = z.object({
  items: z.array(mediaItemSchema).max(24).default([]),
});

export type MediaInput = z.infer<typeof mediaSchema>;
