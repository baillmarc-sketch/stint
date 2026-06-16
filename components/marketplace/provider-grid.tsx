import type { ListingResult } from "@/lib/queries";
import { ProviderCard } from "./provider-card";
import { EmptyState } from "@/components/shared/empty-state";

export function ProviderGrid({ results }: { results: ListingResult[] }) {
  if (results.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {results.map(({ provider }) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
}
