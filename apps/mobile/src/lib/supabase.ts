import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Anonymous read client. `null` in the zero-config demo (the app then falls back
 * to the bundled sample data). Set EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY to read
 * live data — RLS keeps anonymous access to published content only.
 */
export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon, { auth: { persistSession: false } }) : null;
