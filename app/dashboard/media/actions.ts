"use server";

import { revalidatePath } from "next/cache";
import { getProviderContext } from "@/lib/auth";
import { getOwnerStorefront } from "@/lib/queries/owner";
import { mediaSchema } from "@/lib/validations/availability";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SaveState {
  ok?: boolean;
  error?: string;
}

/** Replace the primary listing's gallery, in the given display order. */
export async function saveMedia(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const provider = await getProviderContext();
  if (!provider) return { error: "Sign in as a provider to manage media." };

  const store = await getOwnerStorefront(provider.id);
  const listing = store?.listing;
  if (!listing) return { error: "Create your listing first." };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "Could not read the form." };
  }

  const parsed = mediaSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the URLs." };
  const { items } = parsed.data;

  const db = await createSupabaseServerClient();
  {
    const { error } = await db.from("media").delete().eq("listing_id", listing.id);
    if (error) return { error: error.message };
  }
  if (items.length) {
    const { error } = await db.from("media").insert(
      items.map((m, i) => ({
        listing_id: listing.id,
        kind: m.kind,
        url: m.url,
        caption: m.caption,
        sort_order: i,
      })),
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/storefront");
  revalidatePath(`/providers/${provider.slug}`);
  return { ok: true };
}
