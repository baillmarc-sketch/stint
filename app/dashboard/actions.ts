"use server";

import { revalidatePath } from "next/cache";
import { getProviderContext } from "@/lib/auth";
import { getOwnerStorefront } from "@/lib/queries/owner";
import { canPublish } from "@/lib/publish-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PublishState {
  reasons?: string[];
  error?: string;
  published?: boolean;
}

/**
 * Flip a storefront between public and draft. Publishing is gated by canPublish()
 * so we never expose an incomplete profile; the listing's published flag is kept
 * in lockstep with the provider's.
 */
export async function togglePublish(_prev: PublishState, _formData: FormData): Promise<PublishState> {
  const provider = await getProviderContext();
  if (!provider) return { error: "No storefront to publish." };

  const store = await getOwnerStorefront(provider.id);
  if (!store) return { error: "Could not load your storefront." };

  const next = !store.provider.isPublished;
  if (next) {
    const check = canPublish(store.provider, store.listing);
    if (!check.ok) return { reasons: check.reasons, published: false };
  }

  const db = await createSupabaseServerClient();
  const { error } = await db.from("providers").update({ is_published: next }).eq("id", provider.id);
  if (error) return { error: error.message };
  if (store.listing) {
    await db.from("listings").update({ is_published: next }).eq("id", store.listing.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/storefront");
  revalidatePath(`/providers/${provider.slug}`);
  return { published: next };
}
