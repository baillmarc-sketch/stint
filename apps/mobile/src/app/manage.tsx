import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { Stack } from "expo-router";
import { formatPrice, type BookingSummary } from "@stint/core";
import { fetchMyProvider, fetchProviderBookings, type MyProvider } from "@stint/data/queries";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { transitionBooking } from "@/lib/api";

const ACTIONS: Record<string, { action: string; label: string }[]> = {
  requested: [
    { action: "accept", label: "Accept" },
    { action: "decline", label: "Decline" },
  ],
  quoted: [
    { action: "accept", label: "Accept" },
    { action: "decline", label: "Decline" },
  ],
  confirmed: [{ action: "complete", label: "Mark complete" }],
  in_progress: [{ action: "complete", label: "Mark complete" }],
};

function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Manage() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = Colors[scheme];
  const { session, enabled } = useAuth();
  const [provider, setProvider] = useState<MyProvider | null>(null);
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !session) {
      setLoading(false);
      return;
    }
    const p = await fetchMyProvider(supabase, session.user.id).catch(() => null);
    setProvider(p);
    if (p) setBookings(await fetchProviderBookings(supabase, p.id).catch(() => []));
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function act(id: string, action: string) {
    setPending(id);
    try {
      await transitionBooking(id, action);
      await load();
    } catch {
      // ignore — list refetch reflects the true state
    } finally {
      setPending(null);
    }
  }

  const header = <Stack.Screen options={{ title: "Manage bookings" }} />;

  if (!enabled || !session) {
    return (
      <Center c={c}>
        {header}
        <Text style={{ color: c.textSecondary }}>Sign in as a provider to manage bookings.</Text>
      </Center>
    );
  }
  if (loading) {
    return (
      <Center c={c}>
        {header}
        <ActivityIndicator color={c.text} />
      </Center>
    );
  }
  if (!provider) {
    return (
      <Center c={c}>
        {header}
        <Text style={{ color: c.textSecondary }}>This account isn&apos;t a provider.</Text>
      </Center>
    );
  }
  if (bookings.length === 0) {
    return (
      <Center c={c}>
        {header}
        <Text style={{ color: c.textSecondary }}>No bookings yet.</Text>
      </Center>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {header}
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.text} />}
        renderItem={({ item }) => {
          const actions = ACTIONS[item.status] ?? [];
          return (
            <View style={[styles.card, { backgroundColor: c.backgroundElement }]}>
              <View style={styles.rowBetween}>
                <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
                  {item.listingTitle}
                </Text>
                <Text style={[styles.total, { color: c.text }]}>{formatPrice(item.totalCents)}</Text>
              </View>
              <Text style={[styles.meta, { color: c.textSecondary }]}>
                {fmtDate(item.eventDate)} · {item.startTime} · {item.guestCount} guests · {item.status}
              </Text>
              {actions.length > 0 && (
                <View style={styles.actions}>
                  {actions.map((a) => {
                    const danger = a.action === "decline";
                    return (
                      <Pressable
                        key={a.action}
                        onPress={() => act(item.id, a.action)}
                        disabled={pending === item.id}
                        style={[
                          styles.btn,
                          danger
                            ? { backgroundColor: "transparent", borderWidth: 1, borderColor: c.backgroundSelected }
                            : { backgroundColor: "#7c3aed" },
                        ]}
                      >
                        <Text style={{ color: danger ? c.text : "#fff", fontWeight: "700", fontSize: 14 }}>
                          {a.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

function Center({ children, c }: { children: ReactNode; c: (typeof Colors)["light" | "dark"] }) {
  return <View style={[styles.center, { backgroundColor: c.background }]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 16, padding: 16, gap: 8 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 16, fontWeight: "700", flexShrink: 1 },
  total: { fontSize: 15, fontWeight: "700" },
  meta: { fontSize: 12 },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: "center" },
});
