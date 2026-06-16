import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRating } from "@/lib/utils";

/** Compact inline rating: ★ 4.9 (214) */
export function RatingInline({
  rating,
  count,
  className,
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium", className)}>
      <Star className="size-4 fill-warning text-warning" />
      {formatRating(rating)}
      {count != null && <span className="font-normal text-muted-foreground">({count})</span>}
    </span>
  );
}

/** Five-star visual for review blocks. */
export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < Math.round(rating) ? "fill-warning text-warning" : "fill-muted text-muted",
          )}
        />
      ))}
    </span>
  );
}
