import { Skeleton, ProviderGridSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-2 h-9 w-80" />
      <div className="mt-6 flex flex-wrap gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-full" />
        ))}
      </div>
      <Skeleton className="mb-6 mt-5 h-4 w-40" />
      <ProviderGridSkeleton />
    </section>
  );
}
