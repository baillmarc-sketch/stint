import type { Metadata } from "next";
import Link from "next/link";
import { getProviderContext } from "@/lib/auth";
import { getOwnerStorefront } from "@/lib/queries/owner";
import { getCategories } from "@/lib/queries";
import { EmptyState } from "@/components/shared/empty-state";
import { StorefrontForm, type StorefrontFormValues } from "./storefront-form";
import { PublishToggle } from "./publish-toggle";

export const metadata: Metadata = { title: "Storefront" };

const toInput = (cents: number) => (cents ? (cents / 100).toString() : "");

export default async function StorefrontPage() {
  const provider = await getProviderContext();
  if (!provider) {
    return (
      <EmptyState
        title="Become a provider"
        body="Set up a provider account to create and manage your storefront."
        actionHref="/onboarding"
        actionLabel="Get started"
      />
    );
  }

  const [store, categories] = await Promise.all([getOwnerStorefront(provider.id), getCategories()]);
  const p = store?.provider;
  const l = store?.listing ?? null;

  const initial: StorefrontFormValues = {
    listingId: l?.id ?? null,
    businessName: p?.businessName ?? provider.businessName,
    tagline: p?.tagline ?? "",
    bio: p?.bio ?? "",
    neighborhood: p?.neighborhood ?? "",
    categoryId: p?.categoryId ?? l?.categoryId ?? "",
    yearsExperience: p?.yearsExperience ? String(p.yearsExperience) : "",
    credentials: (p?.credentials ?? []).join("\n"),
    title: l?.title ?? "",
    description: l?.description ?? "",
    pricingModel: l?.pricingModel ?? "hourly",
    basePrice: toInput(l?.basePriceCents ?? 0),
    unitLabel: l?.unitLabel ?? "",
    minHours: l?.minHours != null ? String(l.minHours) : "",
    minGuests: String(l?.minGuests ?? 1),
    maxGuests: String(l?.maxGuests ?? 100),
    travelRadiusMiles: String(l?.travelRadiusMiles ?? 25),
    travelFee: toInput(l?.travelFeeCents ?? 0),
    instantBook: l?.instantBook ?? false,
    includes: (l?.includes ?? []).join("\n"),
    packages: (l?.packages ?? []).map((pk) => ({
      name: pk.name,
      description: pk.description,
      price: toInput(pk.priceCents),
      includes: pk.includes.join("\n"),
    })),
    addons: (l?.addons ?? []).map((a) => ({
      name: a.name,
      description: a.description,
      price: toInput(a.priceCents),
      pricePerGuest: a.pricePerGuest,
    })),
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Storefront</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit your profile, pricing, packages, and add-ons.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {p?.isPublished && (
            <Link
              href={`/providers/${provider.slug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              View public page →
            </Link>
          )}
          <PublishToggle published={p?.isPublished ?? false} />
        </div>
      </div>

      <div className="mt-7">
        <StorefrontForm initial={initial} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      </div>
    </div>
  );
}
