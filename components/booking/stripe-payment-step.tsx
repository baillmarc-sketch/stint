"use client";

import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

let stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise(publishableKey: string) {
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

function PayForm({ totalCents, onPaid }: { totalCents: number; onPaid: (intentId: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  async function pay() {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);
    const { error: payError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (payError) {
      setError(payError.message ?? "Payment failed. Please try another card.");
      setPaying(false);
      return;
    }
    if (paymentIntent && (paymentIntent.status === "requires_capture" || paymentIntent.status === "succeeded")) {
      onPaid(paymentIntent.id);
      return;
    }
    setError("Payment could not be completed.");
    setPaying(false);
  }

  return (
    <div className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}
      <Button variant="brand" size="lg" onClick={pay} disabled={!stripe || paying} className="w-full">
        {paying ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
        Pay {formatPrice(totalCents)}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Test mode — use card <span className="font-medium">4242 4242 4242 4242</span>, any future date &amp; CVC.
      </p>
    </div>
  );
}

export function StripePaymentStep({
  clientSecret,
  publishableKey,
  totalCents,
  onPaid,
}: {
  clientSecret: string;
  publishableKey: string;
  totalCents: number;
  onPaid: (intentId: string) => void;
}) {
  return (
    <Elements
      stripe={getStripePromise(publishableKey)}
      options={{ clientSecret, appearance: { theme: "stripe" } }}
    >
      <PayForm totalCents={totalCents} onPaid={onPaid} />
    </Elements>
  );
}
