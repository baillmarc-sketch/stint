import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { computeQuote, formatPrice, type Provider } from "@stint/core";
import { Colors } from "@/constants/theme";
import { loadProvider } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { createBooking, createPaymentIntent } from "@/lib/api";
import { payWithPaymentSheet } from "@/lib/native-checkout";

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "https://stint-ten.vercel.app";
const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const IS_EXPO_GO = Constants.appOwnership === "expo";

function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = Colors[scheme];
  const { session } = useAuth();

  const [provider, setProvider] = useState<Provider | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(12);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadProvider(id).then((p) => {
      if (!active) return;
      const first = p?.listings[0];
      if (first) setGuestCount(Math.min(Math.max(first.minGuests, 12), first.maxGuests));
      if (first?.pricingModel === "package" && first.packages[0]) setPackageId(first.packages[0].id);
      setProvider(p);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const listing = provider?.listings[0];
  const today = new Date().toISOString().slice(0, 10);
  const openSlots = (provider?.slots ?? [])
    .filter((s) => !s.isBooked && s.date >= today)
    .slice(0, 12);

  const quote = useMemo(() => {
    if (!listing) return null;
    const addonSelections = Object.entries(addonQty)
      .filter(([, q]) => q > 0)
      .map(([addonId, quantity]) => ({ addonId, quantity }));
    return computeQuote({
      listing,
      packageId,
      addonSelections,
      durationHours: listing.minHours ?? 3,
      guestCount,
    });
  }, [listing, packageId, addonQty, guestCount]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.text} />
      </View>
    );
  }
  if (!provider || !listing || !quote) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Text style={{ color: c.text }}>Couldn&apos;t load this booking.</Text>
      </View>
    );
  }

  const listingId = listing.id;
  const durationHours = listing.minHours ?? 3;
  const hood = provider.neighborhood;
  // Native Apple Pay / PaymentSheet needs a dev build (not Expo Go), a Stripe key,
  // and a signed-in user (the API authenticates via the Supabase access token).
  const canPayNative = !IS_EXPO_GO && Boolean(STRIPE_PK) && Boolean(session);

  function bookingInput() {
    const slot = openSlots.find((s) => s.id === slotId);
    const addonSelections = Object.entries(addonQty)
      .filter(([, q]) => q > 0)
      .map(([addonId, quantity]) => ({ addonId, quantity }));
    return {
      listingId,
      packageId,
      addonSelections,
      eventDate: slot?.date ?? today,
      startTime: slot?.startTime ?? "18:00",
      durationHours,
      guestCount,
      eventAddress: `${hood}, NYC`,
      eventNeighborhood: hood,
      notes: "",
      slotId: slotId ?? undefined,
    };
  }

  async function reserveNative() {
    setBusy(true);
    setMsg(null);
    try {
      const input = bookingInput();
      const { clientSecret } = await createPaymentIntent(input);
      const paymentIntentId = clientSecret.split("_secret_")[0];
      const pay = await payWithPaymentSheet({
        clientSecret,
        publishableKey: STRIPE_PK as string,
        merchantId: process.env.EXPO_PUBLIC_STRIPE_MERCHANT_ID,
      });
      if (!pay.ok) {
        setMsg(pay.error);
        return;
      }
      const { bookingId } = await createBooking({ ...input, paymentIntentId });
      Alert.alert("You're booked! 🎉", `Confirmation: ${bookingId}`);
      router.back();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function reserveWeb() {
    await WebBrowser.openBrowserAsync(`${WEB_URL}/book/${listingId}`);
  }

  return (
    <>
      <Stack.Screen options={{ title: "Book" }} />
      <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
        <Text style={[styles.h1, { color: c.text }]}>{provider.businessName}</Text>
        <Text style={[styles.sub, { color: c.textSecondary }]}>{listing.title}</Text>

        {listing.packages.length > 0 && (
          <>
            <Text style={[styles.label, { color: c.text }]}>Package</Text>
            <View style={{ gap: 8 }}>
              {listing.packages.map((pkg) => {
                const selected = packageId === pkg.id;
                return (
                  <Pressable
                    key={pkg.id}
                    onPress={() => setPackageId(pkg.id)}
                    style={[
                      styles.pkg,
                      {
                        borderColor: selected ? "#7c3aed" : c.backgroundSelected,
                        backgroundColor: selected ? "rgba(124,58,237,0.12)" : c.backgroundElement,
                      },
                    ]}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={{ color: c.text, fontWeight: "700" }}>{pkg.name}</Text>
                      <Text style={{ color: c.text, fontWeight: "700" }}>{formatPrice(pkg.priceCents)}</Text>
                    </View>
                    {pkg.description ? (
                      <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 2 }}>{pkg.description}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {openSlots.length > 0 && (
          <>
            <Text style={[styles.label, { color: c.text }]}>Choose a time</Text>
            <View style={styles.slots}>
              {openSlots.map((s) => {
                const selected = slotId === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setSlotId(s.id)}
                    style={[
                      styles.slot,
                      {
                        borderColor: selected ? "#7c3aed" : c.backgroundSelected,
                        backgroundColor: selected ? "rgba(124,58,237,0.12)" : c.backgroundElement,
                      },
                    ]}
                  >
                    <Text style={{ color: c.text, fontWeight: "600", fontSize: 13 }}>{fmtDate(s.date)}</Text>
                    <Text style={{ color: c.textSecondary, fontSize: 12 }}>{s.startTime}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <Text style={[styles.label, { color: c.text }]}>Guests</Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setGuestCount((g) => Math.max(listing.minGuests, g - 1))}
            style={[styles.step, { backgroundColor: c.backgroundElement }]}
          >
            <Text style={[styles.stepLabel, { color: c.text }]}>–</Text>
          </Pressable>
          <Text style={[styles.guestCount, { color: c.text }]}>{guestCount}</Text>
          <Pressable
            onPress={() => setGuestCount((g) => Math.min(listing.maxGuests, g + 1))}
            style={[styles.step, { backgroundColor: c.backgroundElement }]}
          >
            <Text style={[styles.stepLabel, { color: c.text }]}>+</Text>
          </Pressable>
        </View>

        {listing.addons.length > 0 && (
          <>
            <Text style={[styles.label, { color: c.text }]}>Add-ons</Text>
            <View style={{ gap: 8 }}>
              {listing.addons.map((addon) => {
                const on = (addonQty[addon.id] ?? 0) > 0;
                return (
                  <Pressable
                    key={addon.id}
                    onPress={() => setAddonQty((q) => ({ ...q, [addon.id]: on ? 0 : 1 }))}
                    style={[
                      styles.addon,
                      {
                        borderColor: on ? "#7c3aed" : c.backgroundSelected,
                        backgroundColor: on ? "rgba(124,58,237,0.12)" : c.backgroundElement,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontWeight: "600" }}>{addon.name}</Text>
                      <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                        +{formatPrice(addon.priceCents)}
                        {addon.pricePerGuest ? " / guest" : ""}
                      </Text>
                    </View>
                    <Text style={{ color: on ? "#7c3aed" : c.textSecondary, fontWeight: "700" }}>
                      {on ? "Added" : "Add"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <View style={[styles.priceCard, { backgroundColor: c.backgroundElement }]}>
          <PriceRow label="Base" value={formatPrice(quote.price.baseCents)} c={c} />
          {quote.price.addonsCents > 0 && (
            <PriceRow label="Add-ons" value={formatPrice(quote.price.addonsCents)} c={c} />
          )}
          {quote.price.travelFeeCents > 0 && (
            <PriceRow label="Travel" value={formatPrice(quote.price.travelFeeCents)} c={c} />
          )}
          <PriceRow label="Service fee" value={formatPrice(quote.price.serviceFeeCents)} c={c} />
          <View style={styles.divider} />
          <PriceRow label="Total" value={formatPrice(quote.price.totalCents)} c={c} bold />
        </View>

        {msg && <Text style={[styles.msg, { color: c.textSecondary }]}>{msg}</Text>}

        <Pressable onPress={canPayNative ? reserveNative : reserveWeb} disabled={busy} style={styles.cta}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>
              {canPayNative ? "Pay" : "Reserve & pay"} · {formatPrice(quote.price.totalCents)}
            </Text>
          )}
        </Pressable>
        <Text style={[styles.note, { color: c.textSecondary }]}>
          {canPayNative
            ? "Apple Pay / card via Stripe PaymentSheet."
            : "Secure checkout opens in your browser — the same Stripe flow as the web app. Native Apple Pay activates in a dev build when signed in."}
        </Text>
      </ScrollView>
    </>
  );
}

function PriceRow({
  label,
  value,
  c,
  bold,
}: {
  label: string;
  value: string;
  c: (typeof Colors)["light" | "dark"];
  bold?: boolean;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={{ color: bold ? c.text : c.textSecondary, fontWeight: bold ? "800" : "400", fontSize: bold ? 16 : 14 }}>
        {label}
      </Text>
      <Text style={{ color: c.text, fontWeight: bold ? "800" : "600", fontSize: bold ? 16 : 14 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40, gap: 6 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  h1: { fontSize: 24, fontWeight: "800" },
  sub: { fontSize: 15, marginBottom: 8 },
  label: { fontSize: 15, fontWeight: "700", marginTop: 18, marginBottom: 8 },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, minWidth: 96 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 18 },
  step: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stepLabel: { fontSize: 22, fontWeight: "700" },
  guestCount: { fontSize: 20, fontWeight: "800", minWidth: 40, textAlign: "center" },
  priceCard: { marginTop: 22, padding: 16, borderRadius: 16, gap: 8 },
  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(128,128,128,0.3)", marginVertical: 2 },
  msg: { fontSize: 13, marginTop: 12 },
  cta: { marginTop: 18, backgroundColor: "#7c3aed", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  note: { fontSize: 13, lineHeight: 19, marginTop: 14 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  pkg: { borderWidth: 1, borderRadius: 14, padding: 14 },
  addon: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, padding: 14 },
});
