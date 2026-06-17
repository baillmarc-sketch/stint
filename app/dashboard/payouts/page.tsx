import type { Metadata } from "next";
import { CheckCircle2, Clock, CreditCard } from "lucide-react";
import { getProviderContext } from "@/lib/auth";
import { getProviderStripe } from "@/lib/queries/owner";
import { getProviderBookings } from "@/lib/bookings-store";
import { providerEarningsCents } from "@/lib/booking/pricing";
import { getStripe, isStripeEnabled } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { startStripeOnboarding } from "./actions";

export const metadata: Metadata = { title: "Payouts" };

export default async function PayoutsPage() {
  const provider = await getProviderContext();
  if (!provider) {
    return (
      <EmptyState
        title="Become a provider"
        body="Set up a provider account to receive payouts."
        actionHref="/onboarding"
        actionLabel="Get started"
      />
    );
  }

  if (!isStripeEnabled()) {
    return (
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Payouts</h1>
        <p className="mt-4 max-w-prose rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Online payments aren&apos;t enabled in this environment. Set{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">PAYMENTS_PROVIDER=stripe</code>{" "}
          and add your Stripe test keys to accept cards and receive payouts.
        </p>
      </div>
    );
  }

  // Pull live Connect status (works even before the webhook is wired) and sync it.
  const { accountId } = await getProviderStripe(provider.id);
  let chargesEnabled = false;
  if (accountId) {
    try {
      const account = await getStripe().accounts.retrieve(accountId);
      chargesEnabled = Boolean(account.charges_enabled);
      await createSupabaseAdminClient()
        .from("providers")
        .update({ stripe_charges_enabled: chargesEnabled })
        .eq("id", provider.id);
    } catch {
      // Show last-known state if Stripe is briefly unreachable.
    }
  }

  const bookings = await getProviderBookings(provider.id);
  const earnedCents = bookings
    .filter((b) => b.paymentStatus === "captured")
    .reduce((s, b) => s + providerEarningsCents(b.price), 0);
  const pendingCents = bookings
    .filter((b) => b.paymentStatus === "authorized")
    .reduce((s, b) => s + providerEarningsCents(b.price), 0);

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Payouts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect Stripe to accept card payments and get paid out after each event.
      </p>

      {chargesEnabled ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-success/30 bg-success/10 p-5 sm:col-span-2">
            <p className="flex items-center gap-2 font-semibold text-success">
              <CheckCircle2 className="size-5" /> Connected — accepting payments
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Customers pay securely at checkout; your share transfers to your Stripe account.
            </p>
          </div>
          <Stat icon={<CreditCard className="size-5" />} label="Paid out / captured" value={formatPrice(earnedCents)} />
          <Stat icon={<Clock className="size-5" />} label="Pending (authorized)" value={formatPrice(pendingCents)} />
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <p className="font-semibold">
            {accountId ? "Finish your Stripe onboarding" : "Set up payouts with Stripe"}
          </p>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            {accountId
              ? "Your Stripe account needs a few more details before you can accept payments."
              : "We use Stripe Express for fast, secure onboarding. It takes a couple of minutes (test mode)."}
          </p>
          <form action={startStripeOnboarding} className="mt-4">
            <button type="submit" className={buttonVariants({ variant: "brand" })}>
              {accountId ? "Continue onboarding" : "Connect with Stripe"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="inline-grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <p className="mt-3 font-display text-2xl font-extrabold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
