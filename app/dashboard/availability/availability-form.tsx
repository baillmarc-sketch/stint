"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveAvailability, type SaveState } from "./actions";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface DayValues {
  weekday: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}
export interface AvailabilityFormValues {
  days: DayValues[];
  blocks: Array<{ date: string }>;
}

function buildPayload(v: AvailabilityFormValues) {
  return {
    rules: v.days
      .filter((d) => d.enabled)
      .map((d) => ({ weekday: d.weekday, startTime: d.startTime, endTime: d.endTime })),
    blocks: v.blocks
      .filter((b) => /^\d{4}-\d{2}-\d{2}$/.test(b.date))
      .map((b) => ({ date: b.date, isAvailable: false })),
  };
}

export function AvailabilityForm({ initial }: { initial: AvailabilityFormValues }) {
  const [v, setV] = useState<AvailabilityFormValues>(initial);
  const [state, action, pending] = useActionState<SaveState, FormData>(saveAvailability, {});

  const setDay = (i: number, patch: Partial<DayValues>) =>
    setV((p) => ({ ...p, days: p.days.map((d, j) => (j === i ? { ...d, ...patch } : d)) }));

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="payload" value={JSON.stringify(buildPayload(v))} />

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">Weekly hours</h2>
        <div className="mt-4 space-y-2">
          {v.days.map((d, i) => (
            <div key={d.weekday} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
              <label className="flex w-32 items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="size-4 rounded border-input accent-primary"
                  checked={d.enabled}
                  onChange={(e) => setDay(i, { enabled: e.target.checked })}
                />
                {WEEKDAYS[d.weekday]}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  className="h-9 w-32"
                  value={d.startTime}
                  disabled={!d.enabled}
                  onChange={(e) => setDay(i, { startTime: e.target.value })}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  className="h-9 w-32"
                  value={d.endTime}
                  disabled={!d.enabled}
                  onChange={(e) => setDay(i, { endTime: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">Blocked dates</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Days you&apos;re unavailable even if they fall on your weekly hours.
        </p>
        <div className="mt-4 space-y-2">
          {v.blocks.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <Input
                type="date"
                className="h-9 w-48"
                value={b.date}
                onChange={(e) =>
                  setV((p) => ({
                    ...p,
                    blocks: p.blocks.map((x, j) => (j === i ? { date: e.target.value } : x)),
                  }))
                }
              />
              <button
                type="button"
                onClick={() => setV((p) => ({ ...p, blocks: p.blocks.filter((_, j) => j !== i) }))}
                className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
              >
                <Trash2 className="size-3.5" /> Remove
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setV((p) => ({ ...p, blocks: [...p.blocks, { date: "" }] }))}
          >
            <Plus className="size-4" /> Block a date
          </Button>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Save availability
        </Button>
        {state.ok && <span className="text-sm font-medium text-success">Saved ✓</span>}
        {state.error && <span className="text-sm text-destructive">{state.error}</span>}
      </div>
    </form>
  );
}
