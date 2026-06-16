import "server-only";
import { isSupabaseConfigured } from "./supabase/config";
import { createSupabaseServerClient } from "./supabase/server";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

/**
 * Returns the signed-in user, or null when not signed in / Supabase isn't
 * configured. Auth-aware UI uses this and degrades gracefully in the demo.
 */
export async function getOptionalUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
