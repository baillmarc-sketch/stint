import type { Metadata } from "next";
import { getProviderContext } from "@/lib/auth";
import { getOwnerStorefront } from "@/lib/queries/owner";
import { EmptyState } from "@/components/shared/empty-state";
import { MediaForm, type MediaItemValues } from "./media-form";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage() {
  const provider = await getProviderContext();
  if (!provider) {
    return (
      <EmptyState
        title="Become a provider"
        body="Set up a provider account to manage your gallery."
        actionHref="/onboarding"
        actionLabel="Get started"
      />
    );
  }

  const store = await getOwnerStorefront(provider.id);
  if (!store?.listing) {
    return (
      <EmptyState
        title="Create your listing first"
        body="Your gallery lives on your service listing — set that up, then add photos."
        actionHref="/dashboard/storefront"
        actionLabel="Edit storefront"
      />
    );
  }

  const initial: MediaItemValues[] = store.listing.gallery.map((m) => ({
    kind: m.kind === "video" ? "video" : "image",
    url: m.url,
    caption: m.caption ?? "",
  }));

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Media</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Add photo or video URLs for your gallery. The first image is your cover.
      </p>
      <div className="mt-7">
        <MediaForm initial={initial} />
      </div>
    </div>
  );
}
