import "server-only";
import type { Listing, Provider } from "@/types/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toProvider } from "./mappers";
import type { ProviderRow } from "./db-types";

/**
 * Owner-scoped reads for the provider dashboard. Unlike the public queries these
 * return the signed-in owner's storefront even when unpublished (RLS "providers
 * owner read" / "listings owner all"), so the editor can load drafts.
 */

export interface AvailabilityBlock {
  id: string;
  date: string;
  isAvailable: boolean;
}

export interface OwnerStorefront {
  provider: Provider;
  /** The provider's primary listing, or null before they've created one. */
  listing: Listing | null;
  blocks: AvailabilityBlock[];
}

const OWNER_EMBED =
  "*, listings(*, packages(*), addons(*), media(*)), availability_rules(*), availability_blocks(*)";

type BlockRow = { id: string; date: string; is_available: boolean };

export async function getOwnerStorefront(providerId: string): Promise<OwnerStorefront | null> {
  const db = await createSupabaseServerClient();
  const { data } = await db.from("providers").select(OWNER_EMBED).eq("id", providerId).maybeSingle();
  if (!data) return null;

  const row = data as unknown as ProviderRow & { availability_blocks?: BlockRow[] };
  const provider = toProvider(row);
  const listing = provider.listings[0] ?? null;
  const blocks = (row.availability_blocks ?? [])
    .map((b) => ({ id: b.id, date: b.date, isAvailable: b.is_available }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { provider, listing, blocks };
}

/** The id of the active launch market (NYC), to stamp on a provider's first listing. */
export async function getActiveMarketId(): Promise<string | null> {
  const db = await createSupabaseServerClient();
  const { data } = await db.from("markets").select("id").eq("is_active", true).limit(1).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/** The owner's Stripe Connect status (requires the 0006_stripe migration). */
export async function getProviderStripe(
  providerId: string,
): Promise<{ accountId: string | null; chargesEnabled: boolean }> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("providers")
    .select("stripe_account_id, stripe_charges_enabled")
    .eq("id", providerId)
    .maybeSingle();
  return {
    accountId: (data?.stripe_account_id as string | null) ?? null,
    chargesEnabled: Boolean(data?.stripe_charges_enabled),
  };
}
