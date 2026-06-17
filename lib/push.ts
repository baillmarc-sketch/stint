import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Send an Expo push notification to all of a user's registered devices.
 * Best-effort — never throws, so it can't block the action that triggered it.
 */
export async function notifyUser(userId: string, title: string, body: string): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("push_tokens").select("token").eq("user_id", userId);
    const messages = ((data ?? []) as Array<{ token: string }>)
      .map((r) => r.token)
      .filter(Boolean)
      .map((to) => ({ to, title, body, sound: "default" as const }));
    if (!messages.length) return;

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
  } catch {
    // best-effort
  }
}
