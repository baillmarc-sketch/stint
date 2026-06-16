"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { togglePublish, type PublishState } from "../actions";

export function PublishToggle({ published }: { published: boolean }) {
  const [state, action, pending] = useActionState<PublishState, FormData>(togglePublish, {});

  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <Button type="submit" size="sm" variant={published ? "outline" : "brand"} disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {published ? "Unpublish" : "Publish storefront"}
      </Button>
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
      {state.reasons && state.reasons.length > 0 && (
        <ul className="max-w-xs list-disc rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-right text-xs text-[#b45309]">
          {state.reasons.map((r) => (
            <li key={r} className="list-none">
              {r}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
