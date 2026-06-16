import type { Metadata } from "next";
import { CategoryTile } from "@/components/marketplace/category-tile";
import { FilterBar } from "@/components/marketplace/filter-bar";
import { ProviderGrid } from "@/components/marketplace/provider-grid";
import {
  getCategories,
  getCategoryCounts,
  getNeighborhoods,
  searchListings,
} from "@/lib/queries";
import { parseFilters, type RawParams } from "@/lib/filters";

export const metadata: Metadata = {
  title: "Browse services",
  description: "Browse every party and event service available in NYC on Stint.",
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const [categories, counts, results, neighborhoods] = await Promise.all([
    getCategories(),
    getCategoryCounts(),
    searchListings(filters),
    getNeighborhoods(),
  ]);
  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.slug }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Browse</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Everything your event needs
        </h1>
        <p className="mt-3 text-muted-foreground">
          Pick a category to dive in, or filter the full roster of vetted NYC providers below.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((c) => (
          <CategoryTile key={c.id} category={c} count={counts[c.id]} />
        ))}
      </div>

      <div className="mt-14">
        <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight">
          All providers in NYC
        </h2>
        <FilterBar neighborhoods={neighborhoods} categories={categoryOptions} />
        <p className="mb-6 mt-5 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{results.length}</span>{" "}
          {results.length === 1 ? "provider" : "providers"}
        </p>
        <ProviderGrid results={results} />
      </div>
    </div>
  );
}
