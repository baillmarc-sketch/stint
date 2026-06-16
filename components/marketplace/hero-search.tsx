import Form from "next/form";
import { Search } from "lucide-react";
import type { Category } from "@/types/domain";
import { Button } from "@/components/ui/button";

/**
 * Server-rendered search form. Submitting navigates to /search with query
 * params (handled client-side by next/form). No client component needed.
 */
export function HeroSearch({
  categories,
  neighborhoods,
}: {
  categories: Category[];
  neighborhoods: string[];
}) {
  return (
    <Form
      action="/search"
      className="grid w-full gap-2 rounded-2xl border border-border bg-card p-2 shadow-xl shadow-primary/5 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:rounded-full sm:p-1.5"
    >
      <label className="flex items-center gap-2 rounded-xl px-3 py-2 sm:rounded-full">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          name="q"
          placeholder="Hibachi, DJ, clown…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="flex items-center border-border px-3 py-2 sm:border-l">
        <select
          name="category"
          defaultValue=""
          aria-label="Category"
          className="w-full bg-transparent text-sm outline-none"
        >
          <option value="">Any service</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center border-border px-3 py-2 sm:border-l">
        <select
          name="neighborhood"
          defaultValue=""
          aria-label="Neighborhood"
          className="w-full bg-transparent text-sm outline-none"
        >
          <option value="">Anywhere in NYC</option>
          {neighborhoods.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" variant="brand" size="lg" className="sm:rounded-full">
        <Search className="size-4 sm:hidden" />
        Search
      </Button>
    </Form>
  );
}
