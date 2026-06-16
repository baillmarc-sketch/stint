/** Centralized check for whether Supabase auth/data is wired up. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * The demo renders fully from the in-repo dataset, so Supabase is optional until
 * credentials are added. When false, auth-dependent UI degrades gracefully and
 * the proxy/session refresh is skipped.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
