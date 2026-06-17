import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerTintColor: "#7c3aed" }}>
        <Stack.Screen name="index" options={{ title: "Stint" }} />
        <Stack.Screen name="provider/[id]" options={{ title: "" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
