import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarHeart, Store } from "lucide-react";

export const metadata: Metadata = { title: "Get started" };

const ROLES = [
  {
    icon: CalendarHeart,
    title: "I'm planning an event",
    body: "Browse and book chefs, performers, bartenders, and crews for your party.",
    href: "/browse",
    cta: "Start browsing",
  },
  {
    icon: Store,
    title: "I'm a provider",
    body: "List your service, set pricing and availability, and start getting booked.",
    href: "/dashboard",
    cta: "Set up my storefront",
  },
];

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          What brings you to Stint?
        </h1>
        <p className="mt-3 text-muted-foreground">
          You can always do both later — this just sets up your home base.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {ROLES.map((role) => (
          <Link
            key={role.title}
            href={role.href}
            className="group flex flex-col rounded-3xl border border-border bg-card p-7 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
          >
            <span className="inline-grid size-12 place-items-center rounded-2xl bg-brand-gradient text-white">
              <role.icon className="size-6" />
            </span>
            <h2 className="mt-5 font-display text-xl font-bold">{role.title}</h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{role.body}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              {role.cta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
