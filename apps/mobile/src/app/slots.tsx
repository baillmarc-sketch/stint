import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { Stack } from "expo-router";
import type { AvailabilitySlot } from "@stint/core";
import {
  addProviderSlot,
  deleteProviderSlot,
  fetchMyProvider,
  fetchProviderSlots,
  type MyProvider,
} from "@stint/data/queries";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function Slots() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = Colors[scheme];
  const { session, enabled } = useAuth();
  const [provider, setProvider] = useState<MyProvider | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState("");
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("21:00");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !session) return;
    const p = await fetchMyProvider(supabase, session.user.id).catch(() => null);
    setProvider(p);
    if (p) setSlots(await fetchProviderSlots(supabase, p.id).catch(() => []));
  }, [session]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const valid = DATE.test(date) && TIME.test(start) && TIME.test(end) && end > start;

  async function add() {
    if (!supabase || !provider || !valid) return;
    setBusy(true);
    setMsg(null);
    try {
      await addProviderSlot(supabase, provider.id, { date, startTime: start, endTime: end });
      setDate("");
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not add slot");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!supabase) return;
    try {
      await deleteProviderSlot(supabase, id);
      await refresh();
    } catch {
      // refetch reflects true state
    }
  }

  const input = [styles.input, { color: c.text, borderColor: c.backgroundSelected }];
  const header = <Stack.Screen options={{ title: "Availability" }} />;

  if (!enabled || !session) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {header}
        <Text style={{ color: c.textSecondary }}>Sign in as a provider to manage availability.</Text>
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
  if (!provider) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {header}
        <Text style={{ color: c.textSecondary }}>This account isn&apos;t a provider.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {header}
      <FlatList
        data={slots}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.text} />}
        ListHeaderComponent={
          <View style={styles.form}>
            <Text style={[styles.label, { color: c.text }]}>Add a bookable slot</Text>
            <View style={styles.row}>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={c.textSecondary}
                autoCapitalize="none"
                style={[...input, { flex: 1.4 }]}
              />
              <TextInput value={start} onChangeText={setStart} placeholder="18:00" placeholderTextColor={c.textSecondary} style={[...input, { flex: 1 }]} />
              <TextInput value={end} onChangeText={setEnd} placeholder="21:00" placeholderTextColor={c.textSecondary} style={[...input, { flex: 1 }]} />
            </View>
            {msg && <Text style={[styles.msg, { color: c.textSecondary }]}>{msg}</Text>}
            <Pressable onPress={add} disabled={!valid || busy} style={[styles.add, { opacity: valid && !busy ? 1 : 0.5 }]}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.addText}>Add slot</Text>}
            </Pressable>
            <Text style={[styles.hint, { color: c.textSecondary }]}>Upcoming slots</Text>
          </View>
        }
        ListEmptyComponent={<Text style={[styles.empty, { color: c.textSecondary }]}>No upcoming slots yet.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.slotRow, { borderColor: c.backgroundSelected }]}>
            <Text style={{ color: c.text }}>
              <Text style={{ fontWeight: "700" }}>{fmtDate(item.date)}</Text>
              <Text style={{ color: c.textSecondary }}>
                {"  "}
                {item.startTime}–{item.endTime}
              </Text>
            </Text>
            {item.isBooked ? (
              <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: "600" }}>Booked</Text>
            ) : (
              <Pressable onPress={() => remove(item.id)} hitSlop={8}>
                <Text style={{ color: "#dc2626", fontWeight: "700" }}>Remove</Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  list: { padding: 16 },
  form: { gap: 10, marginBottom: 8 },
  label: { fontSize: 16, fontWeight: "800" },
  row: { flexDirection: "row", gap: 8 },
  input: { height: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 15 },
  msg: { fontSize: 13 },
  add: { backgroundColor: "#7c3aed", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  addText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  hint: { fontSize: 13, fontWeight: "600", marginTop: 10 },
  empty: { paddingVertical: 12 },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
