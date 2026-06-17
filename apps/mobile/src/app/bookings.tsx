import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { Stack } from "expo-router";
import { formatPrice, type BookingSummary } from "@stint/core";
import { fetchMyBookings } from "@stint/data/queries";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  quoted: "Quote sent",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
};

function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Bookings() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = Colors[scheme];
  const { session, enabled } = useAuth();
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !session) return;
    const b = await fetchMyBookings(supabase).catch(() => []);
    setBookings(b);
  }, [session]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const header = <Stack.Screen options={{ title: "My bookings" }} />;

  if (!enabled || !session) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {header}
        <Text style={{ color: c.textSecondary }}>Sign in to see your bookings.</Text>
      </View>
    );
  }
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {header}
        <ActivityIndicator color={c.text} />
      </View>
    );
  }
  if (bookings.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {header}
        <Text style={{ color: c.textSecondary }}>No bookings yet.</Text>
      </View>
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
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: c.backgroundElement }]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
                {item.providerName}
              </Text>
              <Text style={[styles.status, { color: c.textSecondary }]}>
                {STATUS_LABEL[item.status] ?? item.status}
              </Text>
            </View>
            <Text style={[styles.sub, { color: c.textSecondary }]} numberOfLines={1}>
              {item.listingTitle}
            </Text>
            <View style={styles.rowBetween}>
              <Text style={[styles.meta, { color: c.textSecondary }]}>
                {fmtDate(item.eventDate)} · {item.startTime} · {item.guestCount} guests
              </Text>
              <Text style={[styles.total, { color: c.text }]}>{formatPrice(item.totalCents)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 16, padding: 16, gap: 6 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { fontSize: 16, fontWeight: "700", flexShrink: 1 },
  status: { fontSize: 13, fontWeight: "600" },
  sub: { fontSize: 14 },
  meta: { fontSize: 12, flexShrink: 1 },
  total: { fontSize: 15, fontWeight: "700" },
});
