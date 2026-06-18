import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase client — `null` in the zero-config demo (the app falls back to bundled
 * sample data). Set EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY to read live data and enable
 * accounts. Sessions persist via AsyncStorage; RLS keeps anonymous access to
 * published content only.
 */
export const supabase: SupabaseClient | null =
  url && anon
    ? createClient(url, anon, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;
