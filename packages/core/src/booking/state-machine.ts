/** Booking lifecycle — allowed transitions and the initial-status rule. */
import type { BookingStatus } from "../types/domain";

export const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ["quoted", "confirmed", "declined", "cancelled"],
  quoted: ["confirmed", "cancelled", "declined"],
  confirmed: ["in_progress", "completed", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  declined: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminal(status: BookingStatus): boolean {
  return TRANSITIONS[status]?.length === 0;
}

/** Instant-book listings jump straight to confirmed; everything else starts as a request. */
export function initialStatus(instantBook: boolean): BookingStatus {
  return instantBook ? "confirmed" : "requested";
}

export const STATUS_META: Record<
  BookingStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
  requested: { label: "Requested", tone: "warning" },
  quoted: { label: "Quote sent", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  in_progress: { label: "In progress", tone: "neutral" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  declined: { label: "Declined", tone: "danger" },
};
