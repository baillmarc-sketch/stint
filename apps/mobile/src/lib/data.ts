import type { Provider } from "@stint/core";
import { fetchProviderBySlug, fetchPublishedProviders } from "@stint/data/queries";
import { supabase } from "./supabase";
import { sampleProviders } from "./sample-data";

/**
 * Catalog reads with graceful fallback: live Supabase when configured (shared with
 * the web app via @stint/data), otherwise the bundled sample set.
 */

export async function loadProviders(): Promise<Provider[]> {
  if (supabase) {
    try {
      const providers = await fetchPublishedProviders(supabase, 50);
      if (providers.length) return providers;
    } catch {
      // fall back to the bundled sample
    }
  }
  return sampleProviders;
}

export async function loadProvider(idOrSlug: string): Promise<Provider | undefined> {
  if (supabase) {
    try {
      const provider = await fetchProviderBySlug(supabase, idOrSlug);
      if (provider) return provider;
    } catch {
      // fall back to the bundled sample
    }
  }
  return sampleProviders.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}
