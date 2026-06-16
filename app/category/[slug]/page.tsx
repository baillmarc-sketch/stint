import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { FilterBar } from "@/components/marketplace/filter-bar";
import { ProviderGrid } from "@/components/marketplace/provider-grid";
import { CategoryIcon } from "@/components/shared/category-icon";
import { getCategoryBySlug, getNeighborhoods, searchListings } from "@/lib/queries";
import { CATEGORIES } from "@/lib/data";
import { parseFilters, type RawParams } from "@/lib/filters";

type Params = { slug: string };

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category" };
  return { title: category.name, description: category.description };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<RawParams>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const sp = await searchParams;
  const filters = parseFilters(sp, slug);
  const [results, neighborhoods] = await Promise.all([
    searchListings(filters),
    getNeighborhoods(),
  ]);

  return (
    <div>
      {/* Category hero */}
      <section className="relative overflow-hidden border-b border-border">
        <Image
          src={category.heroImageUrl}
          alt={category.name}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/30" />
        <div className="relative mx-auto flex min-h-56 max-w-7xl flex-col justify-end px-4 py-8 text-white sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-1 text-sm text-white/80">
            <Link href="/browse" className="hover:text-white">
              Browse
            </Link>
            <ChevronRight className="size-4" />
            <span className="text-white">{category.name}</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="inline-grid size-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <CategoryIcon name={category.icon} className="size-6" />
            </span>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {category.name}
            </h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
            {category.description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FilterBar neighborhoods={neighborhoods} />
        <p className="mb-6 mt-5 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{results.length}</span>{" "}
          {results.length === 1 ? "provider" : "providers"} in New York City
        </p>
        <ProviderGrid results={results} />
      </section>
    </div>
  );
}
