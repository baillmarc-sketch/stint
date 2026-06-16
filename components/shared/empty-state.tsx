import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function EmptyState({
  title = "No matches found",
  body = "Try widening your filters — fewer constraints, a different neighborhood, or a higher budget.",
  actionHref = "/browse",
  actionLabel = "Clear filters",
}: {
  title?: string;
  body?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/30 px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-card text-muted-foreground shadow-sm">
        <SearchX className="size-6" />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      <Link href={actionHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
        {actionLabel}
      </Link>
    </div>
  );
}
