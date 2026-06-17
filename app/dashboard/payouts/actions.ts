"use server";

import { redirect } from "next/navigation";
import { getProviderContext } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { SITE } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Create (once) the provider's Stripe Express account and redirect them to
 * Stripe-hosted onboarding. On return, charges_enabled is synced on the payouts
 * page (and via the account.updated webhook).
 */
export async function startStripeOnboarding(): Promise<void> {
  const provider = await getProviderContext();
  if (!provider) redirect("/onboarding");

  const stripe = getStripe();
  const db = await createSupabaseServerClient();

  const { data } = await db
    .from("providers")
    .select("stripe_account_id")
    .eq("id", provider.id)
    .maybeSingle();

  let accountId = (data?.stripe_account_id as string | null) ?? null;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      metadata: { providerId: provider.id },
    });
    accountId = account.id;
    await db.from("providers").update({ stripe_account_id: accountId }).eq("id", provider.id);
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${SITE.url}/dashboard/payouts`,
    return_url: `${SITE.url}/dashboard/payouts`,
    type: "account_onboarding",
  });

  redirect(link.url);
}
