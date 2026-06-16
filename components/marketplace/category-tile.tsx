import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/types/domain";
import { CategoryIcon } from "@/components/shared/category-icon";

export function CategoryTile({ category, count }: { category: Category; count?: number }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative flex aspect-[5/4] flex-col justify-end overflow-hidden rounded-2xl border border-border"
    >
      <Image
        src={category.heroImageUrl}
        alt={category.name}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div className="relative p-4 text-white">
        <span className="mb-2 inline-grid size-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
          <CategoryIcon name={category.icon} className="size-5" />
        </span>
        <h3 className="font-display text-lg font-bold leading-tight">{category.name}</h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-white/80">{category.tagline}</p>
        {count != null && (
          <p className="mt-1 text-xs font-medium text-white/70">{count} in NYC</p>
        )}
      </div>
    </Link>
  );
}
