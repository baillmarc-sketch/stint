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

  async authorize(_amountCents: number, _bookingId: string): Promise<PaymentResult> {
    return { ref: `sim_${nanoid(18)}`, status: "authorized" };
  }
  async capture(ref: string): Promise<PaymentResult> {
    return { ref, status: "captured" };
  }
  async refund(ref: string): Promise<PaymentResult> {
    return { ref, status: "refunded" };
  }
}

export function getPaymentProvider(): PaymentProvider {
  switch (PAYMENTS_PROVIDER) {
    // case "stripe": return new StripeConnectProvider();
    case "simulated":
    default:
      return new SimulatedPaymentProvider();
  }
}
