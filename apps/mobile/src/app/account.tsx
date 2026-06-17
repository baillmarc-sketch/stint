import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { Link, Stack } from "expo-router";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function Account() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = Colors[scheme];
  const { session, enabled } = useAuth();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const inputStyle = [styles.input, { color: c.text, borderColor: c.backgroundSelected }];

  async function sendCode() {
    if (!supabase) return;
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    if (error) setMsg(error.message);
    else {
      setStage("code");
      setMsg("We emailed you a 6-digit code.");
    }
    setBusy(false);
  }

  async function verify() {
    if (!supabase) return;
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    if (error) setMsg(error.message);
    setBusy(false);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ title: "Account" }} />

      {!enabled ? (
        <Text style={[styles.body, { color: c.textSecondary }]}>
          Sign-in isn&apos;t configured in this build. Set EXPO_PUBLIC_SUPABASE_URL and
          EXPO_PUBLIC_SUPABASE_ANON_KEY to enable accounts.
        </Text>
      ) : session ? (
        <View style={{ gap: 14 }}>
          <Text style={[styles.h1, { color: c.text }]}>You&apos;re signed in</Text>
          <Text style={[styles.body, { color: c.textSecondary }]}>{session.user.email}</Text>
          <Link href="/bookings" asChild>
            <Pressable style={[styles.btnOutline, { borderColor: c.backgroundSelected }]}>
              <Text style={{ color: c.text, fontWeight: "700" }}>My bookings</Text>
            </Pressable>
          </Link>
          <Pressable onPress={signOut} style={[styles.btnOutline, { borderColor: c.backgroundSelected }]}>
            <Text style={{ color: c.text, fontWeight: "700" }}>Sign out</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Text style={[styles.h1, { color: c.text }]}>Sign in</Text>
          <Text style={[styles.body, { color: c.textSecondary }]}>
            Sign in with your email to keep your bookings.
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={c.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={stage === "email" && !busy}
            style={inputStyle}
          />

          {stage === "code" && (
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code"
              placeholderTextColor={c.textSecondary}
              keyboardType="number-pad"
              style={inputStyle}
            />
          )}

          {msg && <Text style={[styles.msg, { color: c.textSecondary }]}>{msg}</Text>}

          <Pressable
            onPress={stage === "email" ? sendCode : verify}
            disabled={busy || (stage === "email" ? email.length < 3 : code.length < 4)}
            style={styles.btn}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{stage === "email" ? "Email me a code" : "Verify & sign in"}</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20 },
  h1: { fontSize: 24, fontWeight: "800" },
  body: { fontSize: 15, lineHeight: 21 },
  input: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  msg: { fontSize: 13 },
  btn: { backgroundColor: "#7c3aed", borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnOutline: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
});
