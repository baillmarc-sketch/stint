"use server";

import { revalidatePath } from "next/cache";
import { getProviderContext } from "@/lib/auth";
import { getActiveMarketId } from "@/lib/queries/owner";
import { storefrontSchema } from "@/lib/validations/listing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SaveState {
  ok?: boolean;
  error?: string;
}

/**
 * Persist the provider profile + its primary listing + packages/add-ons. Runs in
 * the authed cookie context, so the "providers/listings/packages/addons owner"
 * RLS policies enforce that you can only edit your own storefront.
 */
export async function saveStorefront(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const provider = await getProviderContext();
  if (!provider) return { error: "Sign in as a provider to edit your storefront." };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "Could not read the form." };
  }

  const parsed = storefrontSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;

  const db = await createSupabaseServerClient();
  const marketId = await getActiveMarketId();

  const { error: pErr } = await db
    .from("providers")
    .update({
      business_name: d.businessName,
      tagline: d.tagline,
      bio: d.bio,
      neighborhood: d.neighborhood,
      category_id: d.categoryId,
      years_experience: d.yearsExperience,
      credentials: d.credentials,
      ...(marketId ? { market_id: marketId } : {}),
    })
    .eq("id", provider.id);
  if (pErr) return { error: pErr.message };

  const listingFields = {
    provider_id: provider.id,
    category_id: d.categoryId,
    title: d.title,
    description: d.description,
    pricing_model: d.pricingModel,
    base_price_cents: d.basePriceCents,
    unit_label: d.unitLabel,
    min_hours: d.minHours,
    min_guests: d.minGuests,
    max_guests: d.maxGuests,
    travel_radius_miles: d.travelRadiusMiles,
    travel_fee_cents: d.travelFeeCents,
    instant_book: d.instantBook,
    includes: d.includes,
  };

  let listingId: string;
  if (d.listingId) {
    listingId = d.listingId;
    const { error } = await db.from("listings").update(listingFields).eq("id", listingId);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await db
      .from("listings")
      .insert({ ...listingFields, is_published: provider.isPublished })
      .select("id")
      .single();
    if (error || !data) return { error: error?.message ?? "Could not create listing." };
    listingId = data.id as string;
  }

  // Replace packages + add-ons (a small, owner-scoped set — simplest correct sync).
  await db.from("packages").delete().eq("listing_id", listingId);
  if (d.packages.length) {
    const { error } = await db.from("packages").insert(
      d.packages.map((p, i) => ({
        listing_id: listingId,
        name: p.name,
        description: p.description,
        price_cents: p.priceCents,
        includes: p.includes,
        sort_order: i,
      })),
    );
    if (error) return { error: error.message };
  }

  await db.from("addons").delete().eq("listing_id", listingId);
  if (d.addons.length) {
    const { error } = await db.from("addons").insert(
      d.addons.map((a, i) => ({
        listing_id: listingId,
        name: a.name,
        description: a.description,
        price_cents: a.priceCents,
        price_per_guest: a.pricePerGuest,
        sort_order: i,
      })),
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/storefront");
  revalidatePath("/dashboard");
  revalidatePath(`/providers/${provider.slug}`);
  return { ok: true };
}
