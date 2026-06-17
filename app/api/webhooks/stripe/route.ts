import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PaymentStatus } from "@/types/domain";

/**
 * Stripe webhook. Reconciles booking payment_status and provider onboarding state
 * as a source of truth alongside the synchronous flow. Must read the raw body for
 * signature verification (do NOT parse JSON first).
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get("stripe-signature");
  if (!secret || !sig) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const setPaymentStatus = async (paymentRef: string, status: PaymentStatus) => {
    await admin.from("bookings").update({ payment_status: status }).eq("payment_ref", paymentRef);
  };

  switch (event.type) {
    case "payment_intent.amount_capturable_updated": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await setPaymentStatus(pi.id, "authorized");
      break;
    }
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await setPaymentStatus(pi.id, "captured");
      break;
    }
    case "payment_intent.canceled": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await setPaymentStatus(pi.id, "refunded");
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await setPaymentStatus(pi.id, "failed");
      break;
    }
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      await admin
        .from("providers")
        .update({ stripe_charges_enabled: Boolean(account.charges_enabled) })
        .eq("stripe_account_id", account.id);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
