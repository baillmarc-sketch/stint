/**
 * Native Apple Pay / card via Stripe PaymentSheet.
 *
 * `@stripe/stripe-react-native` is a native module that is NOT present in Expo Go,
 * so it's imported lazily and this must only be called from an EAS dev build
 * (callers gate on `Constants.appOwnership !== "expo"`). In Expo Go the module is
 * never loaded and the app falls back to the web checkout handoff.
 */
export async function payWithPaymentSheet(opts: {
  clientSecret: string;
  publishableKey: string;
  merchantId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const Stripe = await import("@stripe/stripe-react-native");

  await Stripe.initStripe({
    publishableKey: opts.publishableKey,
    merchantIdentifier: opts.merchantId,
  });

  const init = await Stripe.initPaymentSheet({
    paymentIntentClientSecret: opts.clientSecret,
    merchantDisplayName: "Stint",
    applePay: { merchantCountryCode: "US" },
  });
  if (init.error) return { ok: false, error: init.error.message };

  const result = await Stripe.presentPaymentSheet();
  if (result.error) return { ok: false, error: result.error.message };

  return { ok: true };
}
