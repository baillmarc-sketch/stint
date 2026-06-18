import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "@/lib/auth";

function AccountButton() {
  const router = useRouter();
  const { session } = useAuth();
  return (
    <Pressable onPress={() => router.push("/account")} hitSlop={12}>
      <Text style={{ color: "#7c3aed", fontWeight: "700" }}>{session ? "Account" : "Sign in"}</Text>
    </Pressable>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const router = useRouter();

  // Tapping a push (e.g. a new-booking alert) opens the bookings list.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push("/bookings");
    });
    return () => sub.remove();
  }, [router]);

  return (
    <AuthProvider>
      <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerTintColor: "#7c3aed" }}>
          <Stack.Screen
            name="index"
            options={{ title: "Stint", headerRight: () => <AccountButton /> }}
          />
          <Stack.Screen name="provider/[id]" options={{ title: "" }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
