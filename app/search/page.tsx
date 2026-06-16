import type { Metadata } from "next";
import { FilterBar } from "@/components/marketplace/filter-bar";
import { ProviderGrid } from "@/components/marketplace/provider-grid";
import { getCategories, getNeighborhoods, searchListings } from "@/lib/queries";
import { parseFilters, type RawParams } from "@/lib/filters";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const [results, neighborhoods, categories] = await Promise.all([
    searchListings(filters),
    getNeighborhoods(),
    getCategories(),
  ]);

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.slug }));
  const activeCategory = categories.find((c) => c.slug === filters.categorySlug);

  const heading = filters.query
    ? `Results for “${filters.query}”`
    : activeCategory
      ? activeCategory.name
      : "All services";

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Search</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">{heading}</h1>
        {filters.neighborhood && (
          <p className="mt-1 text-sm text-muted-foreground">in {filters.neighborhood}, NYC</p>
        )}
      </div>

      <FilterBar neighborhoods={neighborhoods} categories={categoryOptions} />
      <p className="mb-6 mt-5 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{results.length}</span>{" "}
        {results.length === 1 ? "provider" : "providers"} found
      </p>
      <ProviderGrid results={results} />
    </section>
  );
}
