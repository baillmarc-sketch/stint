import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  MapPin,
  PartyPopper,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
} from "lucide-react";
import { HeroSearch } from "@/components/marketplace/hero-search";
import { CategoryTile } from "@/components/marketplace/category-tile";
import { ProviderCard } from "@/components/marketplace/provider-card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getCategories,
  getCategoryCounts,
  getFeaturedProviders,
  getNeighborhoods,
} from "@/lib/queries";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const [categories, counts, featured, neighborhoods] = await Promise.all([
    getCategories(),
    getCategoryCounts(),
    getFeaturedProviders(8),
    getNeighborhoods(),
  ]);

  const testimonials = featured
    .filter((p) => p.reviews.length > 0)
    .slice(0, 3)
    .map((p) => ({ review: p.reviews[0], business: p.businessName }));

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-24 size-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute right-0 top-10 size-96 rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-brand-to/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="brand" className="mb-5">
              <MapPin className="size-3.5" />
              Now booking in New York City
            </Badge>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Entertainment <span className="text-gradient">delivered to you</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              From clowns to hibachi and cleanup too. Book vetted chefs, performers,
              bartenders, and event crews who come to your party — all in one place.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <HeroSearch categories={categories} neighborhoods={neighborhoods} />
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Popular:</span>
              {[
                { label: "Hibachi chef", href: "/category/food-drink" },
                { label: "Party DJ", href: "/category/music" },
                { label: "Magician", href: "/category/entertainment" },
                { label: "Face painter", href: "/category/kids-parties" },
                { label: "Cleanup crew", href: "/category/cleaning-setup" },
              ].map((p) => (
                <Link
                  key={p.label}
                  href={p.href}
                  className="rounded-full border border-border bg-card px-3 py-1 font-medium transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>

          <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4 text-center">
            {[
              { value: "8", label: "Service categories" },
              { value: `${featured.length > 0 ? "40+" : "0"}`, label: "NYC providers" },
              { value: "4.9★", label: "Avg. provider rating" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border bg-card/60 p-4">
                <dt className="font-display text-2xl font-extrabold">{stat.value}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Press / social proof */}
      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            As seen in
          </span>
          {["TimeOut New York", "Eater NY", "Brooklyn Magazine", "The Knot", "Gothamist"].map(
            (name) => (
              <span key={name} className="font-display text-base font-bold text-muted-foreground/60">
                {name}
              </span>
            ),
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Browse"
          title="What does your party need?"
          action={{ label: "See all", href: "/browse" }}
        />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((c) => (
            <CategoryTile key={c.id} category={c} count={counts[c.id]} />
          ))}
        </div>
      </section>

      {/* Featured providers */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Top rated"
          title="Crowd-pleasers booking now"
          action={{ label: "Browse all", href: "/browse" }}
        />
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Loved by hosts" title="What NYC is saying" />
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {testimonials.map(({ review, business }) => (
              <figure key={review.id} className="flex flex-col rounded-2xl border border-border bg-card p-6">
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn("size-4", i < Math.round(review.rating) ? "fill-current" : "text-secondary")}
                    />
                  ))}
                </div>
                <blockquote className="mt-3 flex-1 text-sm text-foreground/90">
                  &ldquo;{review.body}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold">{review.authorName}</span>
                  <span className="text-muted-foreground"> · {review.eventType} · {business}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="How it works" title="Party planning, minus the group chat" />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Browse & compare",
              body: "Filter by date, budget, neighborhood, and vibe. Compare real pricing, photos, and reviews side by side.",
            },
            {
              icon: CalendarCheck,
              title: "Book in a few taps",
              body: "Pick a package, add extras, and request-to-book or instant-book. Your event details go straight to the provider.",
            },
            {
              icon: CreditCard,
              title: "Show up & enjoy",
              body: "One clear price with everything itemized. The provider handles setup, the show, and cleanup.",
            },
          ].map((step, i) => (
            <div key={step.title} className="relative rounded-2xl border border-border bg-card p-6">
              <span className="absolute right-5 top-5 font-display text-4xl font-extrabold text-secondary">
                {i + 1}
              </span>
              <span className="inline-grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For providers */}
      <section id="for-providers" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-brand-gradient p-8 text-white sm:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <Badge className="mb-4 bg-white/20 text-white">
                <Store className="size-3.5" />
                For providers
              </Badge>
              <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                Your storefront, scheduling, and payments — in one place
              </h2>
              <p className="mt-4 max-w-md text-white/85">
                Chefs, performers, bartenders, and crews: list what you offer, set your
                availability and pricing, and get booked. No website to build, no
                lead-gen grind.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/login?next=/dashboard"
                  className={cn(buttonVariants({ size: "lg" }), "bg-white text-primary hover:bg-white/90")}
                >
                  Start listing
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-white/40 bg-transparent text-white hover:bg-white/10",
                  )}
                >
                  See the dashboard
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Store, label: "Free storefront with photos & packages" },
                { icon: CalendarCheck, label: "Availability calendar & instant book" },
                { icon: CreditCard, label: "Clear payouts after a low platform fee" },
                { icon: Star, label: "Reviews that build your reputation" },
              ].map((f) => (
                <div key={f.label} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <f.icon className="size-5" />
                  <p className="mt-2 text-sm font-medium">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Vetted providers",
              body: "Verification badges, insurance, and credentials surfaced right on every profile.",
            },
            {
              icon: Star,
              title: "Real reviews",
              body: "Honest ratings from real bookings help you choose with confidence.",
            },
            {
              icon: Sparkles,
              title: "One clear price",
              body: "Packages, add-ons, travel, and fees itemized up front. No surprises.",
            },
          ].map((t) => (
            <div key={t.title} className="flex gap-4 rounded-2xl border border-border bg-card p-6">
              <span className="inline-grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                <t.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-display font-bold">{t.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* City expansion teaser */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 text-center sm:p-10">
          <Badge variant="brand" className="mb-4">
            <MapPin className="size-3.5" />
            Expanding city by city
          </Badge>
          <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Live in NYC. Coming to your city next.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            We launch neighborhood by neighborhood to keep supply deep and quality high. New York
            is open now — more metros are on the way.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-success/12 px-3.5 py-1.5 text-sm font-semibold text-success">
              New York City · Live
            </span>
            {["Los Angeles", "Miami", "Chicago", "Austin"].map((c) => (
              <span
                key={c}
                className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-muted-foreground"
              >
                {c} · Soon
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-secondary/50 px-6 py-12 text-center">
          <span className="inline-grid size-12 place-items-center rounded-2xl bg-brand-gradient text-white">
            <PartyPopper className="size-6" />
          </span>
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
            Ready to throw something memorable?
          </h2>
          <p className="max-w-md text-muted-foreground">{SITE.shortPitch}</p>
          <Link href="/browse" className={buttonVariants({ variant: "brand", size: "lg" })}>
            Browse services
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          {title}
        </h2>
      </div>
      {action && (
        <Link
          href={action.href}
          className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
        >
          {action.label}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
