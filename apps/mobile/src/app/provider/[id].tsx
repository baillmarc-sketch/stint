import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { Image } from "expo-image";
import { formatPrice } from "@stint/core";
import { Colors } from "@/constants/theme";
import { sampleProviders } from "@/lib/sample-data";

export default function ProviderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = Colors[scheme];
  const provider = sampleProviders.find((p) => p.id === id || p.slug === id);

  if (!provider) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Text style={{ color: c.text }}>Provider not found.</Text>
      </View>
    );
  }

  const listing = provider.listings[0];

  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      <Image source={{ uri: provider.coverImageUrl }} style={styles.cover} contentFit="cover" transition={200} />
      <View style={styles.pad}>
        <Text style={[styles.title, { color: c.text }]}>{provider.businessName}</Text>
        <Text style={[styles.meta, { color: c.textSecondary }]}>
          ★ {provider.ratingAvg.toFixed(1)} ({provider.ratingCount}) · {provider.neighborhood}
          {provider.isVerified ? " · Verified" : ""}
        </Text>
        <Text style={[styles.tagline, { color: c.text }]}>{provider.tagline}</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>{provider.bio}</Text>

        <Text style={[styles.section, { color: c.text }]}>{listing.title}</Text>
        {listing.includes.map((inc) => (
          <Text key={inc} style={[styles.bullet, { color: c.textSecondary }]}>
            • {inc}
          </Text>
        ))}

        {provider.credentials.length > 0 && (
          <View style={styles.badges}>
            {provider.credentials.map((cr) => (
              <Text key={cr} style={[styles.badge, { backgroundColor: c.backgroundElement, color: c.textSecondary }]}>
                {cr}
              </Text>
            ))}
          </View>
        )}

        <View style={[styles.priceBar, { backgroundColor: c.backgroundElement }]}>
          <View>
            <Text style={[styles.priceLabel, { color: c.textSecondary }]}>Starting at</Text>
            <Text style={[styles.price, { color: c.text }]}>
              {formatPrice(listing.basePriceCents)}{" "}
              <Text style={[styles.unit, { color: c.textSecondary }]}>{listing.unitLabel}</Text>
            </Text>
          </View>
        </View>
        <Text style={[styles.note, { color: c.textSecondary }]}>
          In-app booking is coming soon — powered by the same @stint/core pricing as the web app.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  cover: { width: "100%", height: 220 },
  pad: { padding: 20, gap: 6 },
  title: { fontSize: 26, fontWeight: "800" },
  meta: { fontSize: 13 },
  tagline: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  body: { fontSize: 15, lineHeight: 22, marginTop: 4 },
  section: { fontSize: 18, fontWeight: "700", marginTop: 20, marginBottom: 4 },
  bullet: { fontSize: 15, lineHeight: 24 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  badge: { fontSize: 12, fontWeight: "600", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, overflow: "hidden" },
  priceBar: { marginTop: 22, padding: 16, borderRadius: 16 },
  priceLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  price: { fontSize: 24, fontWeight: "800", marginTop: 2 },
  unit: { fontSize: 14, fontWeight: "500" },
  note: { fontSize: 13, lineHeight: 19, marginTop: 16 },
});
