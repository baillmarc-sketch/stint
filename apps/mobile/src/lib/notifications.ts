import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "./supabase";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.EXPO_PUBLIC_WEB_URL ??
  "https://stint-ten.vercel.app";

/**
 * Register this device's Expo push token with the backend (best-effort). Remote
 * push requires a physical device + a dev build, so this is a no-op in Expo Go and
 * on simulators — it never throws.
 */
export async function registerForPush(): Promise<void> {
  try {
    if (!Device.isDevice || !supabase) return;

    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;

    const perm = await Notifications.getPermissionsAsync();
    let granted = perm.granted;
    if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const token = (
      await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
    ).data;

    await fetch(`${API_URL}/api/push/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sess.session.access_token}`,
      },
      body: JSON.stringify({ token }),
    });
  } catch {
    // best-effort
  }
}
