import "server-only";
import Stripe from "stripe";
import { PAYMENTS_PROVIDER } from "@/lib/constants";

let client: Stripe | null = null;

/** Lazily-constructed Stripe client. Throws only when actually used, so the app
 *  still builds/runs with no Stripe env (simulated payments stay the default). */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!client) client = new Stripe(key);
  return client;
}

/** True when the app is configured to take real (test-mode) payments via Stripe. */
export function isStripeEnabled(): boolean {
  return PAYMENTS_PROVIDER === "stripe" && Boolean(process.env.STRIPE_SECRET_KEY);
}
