import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="h-4 w-64" />
      <div className="mt-4 grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
        <Skeleton className="aspect-[16/10] rounded-2xl sm:col-span-2 sm:row-span-2 sm:aspect-auto" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="hidden aspect-[4/3] rounded-2xl sm:block" />
        ))}
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}
