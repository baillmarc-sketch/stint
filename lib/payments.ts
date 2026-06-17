/**
 * Payments boundary.
 *
 * The app only ever talks to the `PaymentProvider` interface, so swapping the
 * simulated provider for Stripe Connect later is a one-line change (add a
 * `StripeConnectProvider` and select it via the `PAYMENTS_PROVIDER` env flag).
 * No schema or call-site changes required — the booking already models the
 * authorize → capture → refund lifecycle.
 */
import { nanoid } from "nanoid";
import { PAYMENTS_PROVIDER } from "@/lib/constants";
import { getStripe } from "@/lib/stripe";
import type { PaymentStatus } from "@/types/domain";

export interface PaymentResult {
  ref: string;
  status: PaymentStatus;
}

export interface PaymentProvider {
  readonly name: string;
  authorize(amountCents: number, bookingId: string): Promise<PaymentResult>;
  capture(ref: string): Promise<PaymentResult>;
  refund(ref: string): Promise<PaymentResult>;
}

class SimulatedPaymentProvider implements PaymentProvider {
  readonly name = "simulated";

  // Params omitted (structural typing satisfies the interface); a real provider
  // would use amountCents + bookingId to create a PaymentIntent.
  async authorize(): Promise<PaymentResult> {
    return { ref: `sim_${nanoid(18)}`, status: "authorized" };
  }
  async capture(ref: string): Promise<PaymentResult> {
    return { ref, status: "captured" };
  }
  async refund(ref: string): Promise<PaymentResult> {
    return { ref, status: "refunded" };
  }
}

/**
 * Stripe Connect provider. The card is authorized client-side via the inline
 * PaymentElement (see `createConnectPaymentIntent`), so `authorize()` is never
 * called server-side here — capture/refund operate on the PaymentIntent ref.
 */
class StripeConnectProvider implements PaymentProvider {
  readonly name = "stripe";

  async authorize(): Promise<PaymentResult> {
    throw new Error("Stripe authorization is performed client-side via the PaymentElement.");
  }
  async capture(ref: string): Promise<PaymentResult> {
    const pi = await getStripe().paymentIntents.capture(ref);
    return { ref, status: pi.status === "succeeded" ? "captured" : "authorized" };
  }
  async refund(ref: string): Promise<PaymentResult> {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.retrieve(ref);
    // An uncaptured hold is released by cancelling; a captured charge is refunded.
    if (pi.status === "requires_capture" || pi.status === "requires_payment_method") {
      await stripe.paymentIntents.cancel(ref);
    } else {
      await stripe.refunds.create({ payment_intent: ref });
    }
    return { ref, status: "refunded" };
  }
}

export function getPaymentProvider(): PaymentProvider {
  switch (PAYMENTS_PROVIDER) {
    case "stripe":
      return new StripeConnectProvider();
    case "simulated":
    default:
      return new SimulatedPaymentProvider();
  }
}

export interface ConnectIntentInput {
  amountCents: number;
  applicationFeeCents: number;
  destinationAccountId: string;
  metadata: Record<string, string>;
}

/**
 * Create a Connect destination-charge PaymentIntent: the customer pays the
 * platform, our service fee is taken as `application_fee_amount`, and the rest is
 * transferred to the provider's connected account. Manual capture lets us hold
 * the authorization until the booking is confirmed.
 */
export async function createConnectPaymentIntent(
  input: ConnectIntentInput,
): Promise<{ id: string; clientSecret: string }> {
  const pi = await getStripe().paymentIntents.create({
    amount: input.amountCents,
    currency: "usd",
    capture_method: "manual",
    application_fee_amount: input.applicationFeeCents,
    transfer_data: { destination: input.destinationAccountId },
    automatic_payment_methods: { enabled: true },
    metadata: input.metadata,
  });
  return { id: pi.id, clientSecret: pi.client_secret ?? "" };
}

export async function retrievePaymentIntent(id: string) {
  return getStripe().paymentIntents.retrieve(id);
}
