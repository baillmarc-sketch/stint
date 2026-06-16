"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X, FileText, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookingStatus } from "@/types/domain";

type Action = "accept" | "decline" | "quote" | "complete" | "cancel";

const ACTIONS_BY_STATUS: Record<BookingStatus, Action[]> = {
  requested: ["accept", "quote", "decline"],
  quoted: ["decline"],
  confirmed: ["complete", "cancel"],
  in_progress: ["complete"],
  completed: [],
  cancelled: [],
  declined: [],
};

const META: Record<
  Action,
  { label: string; icon: React.ReactNode; variant: "primary" | "outline" | "ghost" }
> = {
  accept: { label: "Accept", icon: <Check className="size-4" />, variant: "primary" },
  quote: { label: "Send quote", icon: <FileText className="size-4" />, variant: "outline" },
  decline: { label: "Decline", icon: <X className="size-4" />, variant: "ghost" },
  complete: { label: "Mark complete", icon: <Flag className="size-4" />, variant: "primary" },
  cancel: { label: "Cancel", icon: <X className="size-4" />, variant: "ghost" },
};

export function BookingActions({ bookingId, status }: { bookingId: string; status: BookingStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = ACTIONS_BY_STATUS[status];
  if (actions.length === 0) {
    return <span className="text-xs text-muted-foreground">No actions</span>;
  }

  async function run(action: Action) {
    setPending(action);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {actions.map((a) => (
          <Button
            key={a}
            size="sm"
            variant={META[a].variant}
            disabled={pending !== null}
            onClick={() => run(a)}
          >
            {pending === a ? <Loader2 className="size-4 animate-spin" /> : META[a].icon}
            {META[a].label}
          </Button>
        ))}
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
