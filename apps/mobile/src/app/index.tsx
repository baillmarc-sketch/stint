import { Link } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { Image } from "expo-image";
import { formatPrice, type Provider } from "@stint/core";
import { Colors } from "@/constants/theme";
import { sampleProviders } from "@/lib/sample-data";

export default function Browse() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = Colors[scheme];

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <FlatList
        data={sampleProviders}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.h1, { color: c.text }]}>Entertainment delivered to you</Text>
            <Text style={[styles.sub, { color: c.textSecondary }]}>
              Vetted chefs, performers, bartenders & crews who come to your party.
            </Text>
          </View>
        }
        renderItem={({ item }) => <ProviderCard provider={item} c={c} />}
      />
    </View>
  );
}

function ProviderCard({ provider, c }: { provider: Provider; c: (typeof Colors)["light" | "dark"] }) {
  const listing = provider.listings[0];
  return (
    <Link href={`/provider/${provider.id}`} asChild>
      <Pressable style={[styles.card, { backgroundColor: c.backgroundElement }]}>
        <Image source={{ uri: provider.coverImageUrl }} style={styles.cover} contentFit="cover" transition={200} />
        <View style={styles.cardBody}>
          <View style={styles.rowBetween}>
            <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
              {provider.businessName}
            </Text>
            <Text style={[styles.rating, { color: c.text }]}>★ {provider.ratingAvg.toFixed(1)}</Text>
          </View>
          <Text style={[styles.tagline, { color: c.textSecondary }]} numberOfLines={2}>
            {provider.tagline}
          </Text>
          <View style={styles.rowBetween}>
            <Text style={[styles.hood, { color: c.textSecondary }]}>
              {provider.neighborhood}
              {provider.instantBook ? " · Instant book" : ""}
            </Text>
            <Text style={[styles.price, { color: c.text }]}>from {formatPrice(listing.basePriceCents)}</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 16, gap: 14 },
  header: { marginBottom: 6, gap: 6 },
  h1: { fontSize: 28, fontWeight: "800", lineHeight: 32 },
  sub: { fontSize: 15, lineHeight: 21 },
  card: { borderRadius: 18, overflow: "hidden" },
  cover: { width: "100%", height: 150 },
  cardBody: { padding: 14, gap: 6 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { fontSize: 17, fontWeight: "700", flexShrink: 1 },
  rating: { fontSize: 14, fontWeight: "700" },
  tagline: { fontSize: 14, lineHeight: 19 },
  hood: { fontSize: 13, flexShrink: 1 },
  price: { fontSize: 15, fontWeight: "700" },
});
