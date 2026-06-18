"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Trash2, Check, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveMedia, type SaveState } from "./actions";

export interface MediaItemValues {
  kind: "image" | "video";
  url: string;
  caption: string;
}

function buildPayload(items: MediaItemValues[]) {
  return { items: items.filter((m) => m.url.trim().length > 0) };
}

export function MediaForm({ initial }: { initial: MediaItemValues[] }) {
  const [items, setItems] = useState<MediaItemValues[]>(initial);
  const [url, setUrl] = useState("");
  const [state, action, pending] = useActionState<SaveState, FormData>(saveMedia, {});

  const add = () => {
    const u = url.trim();
    if (!u) return;
    const kind = /\.(mp4|webm|mov)(\?|$)/i.test(u) ? "video" : "image";
    setItems((p) => [...p, { kind, url: u, caption: "" }]);
    setUrl("");
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    setItems((p) => {
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="payload" value={JSON.stringify(buildPayload(items))} />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-4">
        <Input
          value={url}
          placeholder="https://…/photo.jpg"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="min-w-0 flex-1"
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="size-4" /> Add
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No media yet — paste an image URL above to start your gallery.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((m, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div
                className="size-14 shrink-0 rounded-lg bg-secondary bg-cover bg-center"
                style={{ backgroundImage: `url(${m.url})` }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-muted-foreground">{m.url}</p>
                <Input
                  className="mt-1.5 h-9"
                  value={m.caption}
                  placeholder="Caption (optional)"
                  onChange={(e) =>
                    setItems((p) => p.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))
                  }
                />
              </div>
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setItems((p) => p.filter((_, j) => j !== i))}
                className="shrink-0 text-destructive hover:opacity-70"
                aria-label="Remove"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Save gallery
        </Button>
        {state.ok && <span className="text-sm font-medium text-success">Saved ✓</span>}
        {state.error && <span className="text-sm text-destructive">{state.error}</span>}
      </div>
    </form>
  );
}
