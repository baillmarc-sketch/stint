import { z } from "zod";

export const addonSelectionSchema = z.object({
  addonId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
});

export const createBookingSchema = z.object({
  listingId: z.string().min(1),
  packageId: z.string().nullable().optional(),
  addonSelections: z.array(addonSelectionSchema).default([]),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an event date"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
  durationHours: z.number().min(1).max(12),
  guestCount: z.number().int().min(1).max(1000),
  eventAddress: z.string().min(3, "Enter the event address"),
  eventNeighborhood: z.string().default(""),
  notes: z.string().max(1000).default(""),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
