import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { fetchBookingThread, type ThreadMessage } from "@stint/data/queries";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { sendMessage } from "@/lib/api";

export default function Thread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = Colors[scheme];
  const { session, enabled } = useAuth();
  const myId = session?.user.id ?? null;

  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !session) return;
    const t = await fetchBookingThread(supabase, id).catch(() => ({
      threadId: null,
      messages: [] as ThreadMessage[],
    }));
    setThreadId(t.threadId);
    setMessages(t.messages);
  }, [id, session]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // Live updates via Supabase Realtime once the thread exists.
  useEffect(() => {
    if (!supabase || !threadId) return;
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        () => {
          load();
        },
      )
      .subscribe();
    return () => {
      supabase?.removeChannel(channel);
    };
  }, [threadId, load]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setText("");
    try {
      await sendMessage(id, body);
      await load();
    } catch {
      setText(body);
    } finally {
      setSending(false);
    }
  }

  const header = <Stack.Screen options={{ title: "Messages" }} />;

  if (!enabled || !session) {
    return (
      <Center c={c}>
        {header}
        <Text style={{ color: c.textSecondary }}>Sign in to message.</Text>
      </Center>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {header}
      {loading ? (
        <Center c={c}>
          <ActivityIndicator color={c.text} />
        </Center>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (item.kind === "system") {
              return <Text style={[styles.system, { color: c.textSecondary }]}>{item.body}</Text>;
            }
            const mine = item.senderId === myId;
            return (
              <View
                style={[
                  styles.bubble,
                  mine ? styles.mine : styles.theirs,
                  { backgroundColor: mine ? "#7c3aed" : c.backgroundElement },
                ]}
              >
                <Text style={{ color: mine ? "#fff" : c.text }}>{item.body}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.system, { color: c.textSecondary }]}>No messages yet. Say hello 👋</Text>
          }
        />
      )}
      <View style={[styles.composer, { borderColor: c.backgroundSelected, backgroundColor: c.background }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message…"
          placeholderTextColor={c.textSecondary}
          style={[styles.input, { color: c.text, borderColor: c.backgroundSelected }]}
          multiline
        />
        <Pressable
          onPress={send}
          disabled={sending || !text.trim()}
          style={[styles.send, { opacity: sending || !text.trim() ? 0.5 : 1 }]}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Center({ children, c }: { children: ReactNode; c: (typeof Colors)["light" | "dark"] }) {
  return <View style={[styles.center, { backgroundColor: c.background }]}>{children}</View>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  list: { padding: 16, gap: 8 },
  bubble: { maxWidth: "82%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  mine: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  theirs: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  system: { textAlign: "center", fontSize: 12, paddingVertical: 6 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, maxHeight: 120, minHeight: 44, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, paddingTop: 12, fontSize: 15 },
  send: { backgroundColor: "#7c3aed", borderRadius: 22, paddingHorizontal: 18, height: 44, alignItems: "center", justifyContent: "center" },
});
