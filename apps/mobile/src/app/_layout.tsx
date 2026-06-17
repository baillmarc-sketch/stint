import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from "expo-router";
import { Pressable, Text, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
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
