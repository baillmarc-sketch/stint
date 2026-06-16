import { Skeleton, ProviderGridSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-56 w-full rounded-none" />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-full" />
          ))}
        </div>
        <Skeleton className="mb-6 mt-5 h-4 w-44" />
        <ProviderGridSkeleton />
      </section>
    </div>
  );
}
