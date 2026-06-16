"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Zap } from "lucide-react";
import { PRICE_OPTIONS, RATING_OPTIONS } from "@/lib/filters";
import { SORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function Select({
  label,
  param,
  options,
  current,
  onChange,
}: {
  label: string;
  param: string;
  options: readonly { label: string; value: string }[];
  current: string;
  onChange: (param: string, value: string) => void;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={current}
        onChange={(e) => onChange(param, e.target.value)}
        className={cn(
          "h-10 cursor-pointer appearance-none rounded-full border border-border bg-card pl-4 pr-9 text-sm font-medium outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring",
          current && "border-primary/50 bg-primary/5 text-primary",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-foreground">
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        ▾
      </span>
    </label>
  );
}

export function FilterBar({
  neighborhoods,
  categories,
}: {
  neighborhoods: string[];
  /** When provided, shows a category selector (browse/search). Omit on category pages. */
  categories?: { label: string; value: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(param: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(param, value);
    else params.delete(param);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const get = (p: string) => searchParams.get(p) ?? "";
  const instantOn = get("instant") === "1";

  const neighborhoodOptions = [
    { label: "Anywhere in NYC", value: "" },
    ...neighborhoods.map((n) => ({ label: n, value: n })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={() => update("instant", instantOn ? "" : "1")}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
          instantOn
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-card hover:border-primary/40",
        )}
      >
        <Zap className={cn("size-4", instantOn && "fill-current")} />
        Instant book
      </button>

      {categories && (
        <Select
          label="Category"
          param="category"
          options={[{ label: "All services", value: "" }, ...categories]}
          current={get("category")}
          onChange={update}
        />
      )}
      <Select
        label="Neighborhood"
        param="neighborhood"
        options={neighborhoodOptions}
        current={get("neighborhood")}
        onChange={update}
      />
      <Select label="Price" param="price" options={PRICE_OPTIONS} current={get("price")} onChange={update} />
      <Select label="Rating" param="rating" options={RATING_OPTIONS} current={get("rating")} onChange={update} />

      <div className="ml-auto">
        <Select label="Sort" param="sort" options={SORT_OPTIONS} current={get("sort")} onChange={update} />
      </div>
    </div>
  );
}
