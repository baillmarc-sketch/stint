import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, MapPin, Zap } from "lucide-react";
import type { Provider } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { RatingInline } from "@/components/shared/rating";
import { pricingLabel } from "@/lib/utils";

export function ProviderCard({ provider }: { provider: Provider }) {
  const listing = provider.listings[0];

  return (
    <Link
      href={`/providers/${provider.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={provider.coverImageUrl}
          alt={provider.businessName}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {provider.instantBook && (
            <Badge variant="solid" className="backdrop-blur">
              <Zap className="size-3.5 fill-current" />
              Instant book
            </Badge>
          )}
        </div>
        <div className="absolute bottom-3 left-3 size-12 overflow-hidden rounded-full border-2 border-white shadow-md">
          <Image
            src={provider.avatarUrl}
            alt={provider.ownerName}
            width={48}
            height={48}
            className="size-full object-cover"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold leading-tight tracking-tight">
            {provider.businessName}
          </h3>
          {provider.isVerified && (
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-label="Verified" />
          )}
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{provider.tagline}</p>

        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {provider.neighborhood}
          </span>
          <RatingInline rating={provider.ratingAvg} count={provider.ratingCount} />
        </div>

        <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
          <span className="text-sm">
            <span className="font-display text-base font-bold">{pricingLabel(listing)}</span>
          </span>
          <span className="text-xs text-muted-foreground">{listing.title}</span>
        </div>
      </div>
    </Link>
  );
}
