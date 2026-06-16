import type { BookingAddonLine, PriceBreakdown } from "@/types/domain";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function PriceBreakdownList({
  price,
  baseLabel,
  addonLines = [],
  className,
}: {
  price: PriceBreakdown;
  baseLabel: string;
  addonLines?: BookingAddonLine[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5 text-sm", className)}>
      <Row label={baseLabel} value={formatPrice(price.baseCents)} />
      {addonLines.map((line) => (
        <Row
          key={line.addonId}
          label={`${line.name}${line.quantity > 1 ? ` × ${line.quantity}` : ""}`}
          value={formatPrice(line.lineTotalCents)}
          muted
        />
      ))}
      {price.travelFeeCents > 0 && (
        <Row label="Travel fee" value={formatPrice(price.travelFeeCents)} muted />
      )}
      <Row
        label="Service fee"
        value={formatPrice(price.serviceFeeCents)}
        muted
        hint="Covers booking protection & support"
      />
      <div className="border-t border-border pt-2.5">
        <Row label="Total" value={formatPrice(price.totalCents)} bold />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
  hint,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={cn(muted && "text-muted-foreground", bold && "font-display text-base font-bold")}>
        {label}
        {hint && <span className="block text-xs text-muted-foreground/80">{hint}</span>}
      </span>
      <span className={cn("tabular-nums", bold && "font-display text-base font-extrabold")}>{value}</span>
    </div>
  );
}
