import { Skeleton, ProviderGridSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="mt-3 h-4 w-96" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[5/4] rounded-2xl" />
        ))}
      </div>
      <div className="mt-14">
        <Skeleton className="mb-5 h-7 w-56" />
        <ProviderGridSkeleton />
      </div>
    </div>
  );
}
