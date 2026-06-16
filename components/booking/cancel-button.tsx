"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/domain";

const CANCELLABLE: BookingStatus[] = ["requested", "quoted", "confirmed"];

export function CancelBookingButton({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  if (!CANCELLABLE.includes(status)) return null;

  async function cancel() {
    setLoading(true);
    await fetch(`/api/bookings/${bookingId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={cancel}
      disabled={loading}
      className={cn(buttonVariants({ variant: "ghost" }), "text-muted-foreground")}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
      Cancel booking
    </button>
  );
}
