import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/lib/booking/state-machine";
import type { BookingStatus } from "@/types/domain";

const TONE_TO_VARIANT = {
  neutral: "neutral",
  success: "success",
  warning: "warning",
  danger: "danger",
} as const;

export function StatusBadge({ status }: { status: BookingStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={TONE_TO_VARIANT[meta.tone]}>{meta.label}</Badge>;
}
