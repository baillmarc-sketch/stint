import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/** The Supabase access token from an `Authorization: Bearer …` header, if present.
 *  Native (mobile) clients authenticate this way instead of with cookies. */
export async function getBearerToken(): Promise<string | null> {
  try {
    const auth = (await headers()).get("authorization");
    return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  } catch {
    return null;
  }
}

/**
 * Supabase client for Server Components and Route Handlers. Uses the session
 * cookie (web), or — when an `Authorization: Bearer` header is present — that
 * token, so native API calls are RLS-scoped to the signed-in user too.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const token = await getBearerToken();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — safe to ignore; the proxy refreshes cookies.
        }
      },
    },
  });
}
