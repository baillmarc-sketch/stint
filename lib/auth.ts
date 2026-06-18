import "server-only";
import { isSupabaseConfigured } from "./supabase/config";
import { createSupabaseServerClient, getBearerToken } from "./supabase/server";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

/** The provider storefront owned by the signed-in user, if any. */
export interface ProviderContext {
  id: string;
  slug: string;
  businessName: string;
  isPublished: boolean;
}

/**
 * Returns the signed-in user, or null when not signed in / Supabase isn't
 * configured. Auth-aware UI uses this and degrades gracefully in the demo.
 */
export async function getOptionalUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const token = await getBearerToken();
    const {
      data: { user },
    } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();
    if (!user) return null;
    const meta = user.user_metadata ?? {};
    return {
      id: user.id,
      email: user.email ?? "",
      name: meta.full_name ?? meta.name ?? user.email ?? "Guest",
      avatarUrl: meta.avatar_url ?? meta.picture ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * Returns the provider storefront the current user owns (via providers.owner_id),
 * or null when they aren't a provider / Supabase isn't configured. Powers the
 * dashboard's provider-scoped views.
 */
export async function getProviderContext(): Promise<ProviderContext | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const token = await getBearerToken();
    const {
      data: { user },
    } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("providers")
      .select("id, slug, business_name, is_published")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.id as string,
      slug: data.slug as string,
      businessName: data.business_name as string,
      isPublished: data.is_published as boolean,
    };
  } catch {
    return null;
  }
}
