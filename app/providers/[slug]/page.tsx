import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { RatingInline, RatingStars } from "@/components/shared/rating";
import { getCategoryById, getProviderBySlug } from "@/lib/queries";
import { PROVIDERS } from "@/lib/data";
import { formatPrice, pricingLabel, responseLabel, weekdayLabel, cn } from "@/lib/utils";

type Params = { slug: string };

export function generateStaticParams() {
  return PROVIDERS.filter((p) => p.isPublished).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug);
  if (!provider) return { title: "Provider" };
  return {
    title: `${provider.businessName} — ${provider.neighborhood}`,
    description: provider.tagline,
  };
}

export default async function ProviderPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug);
  if (!provider) notFound();

  const listing = provider.listings[0];
  const category = await getCategoryById(provider.categoryId);
  const gallery = listing.gallery;
  const weekdays = provider.availability.map((a) => weekdayLabel(a.weekday));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/browse" className="hover:text-foreground">
          Browse
        </Link>
        <ChevronRight className="size-4" />
        {category && (
          <>
            <Link href={`/category/${category.slug}`} className="hover:text-foreground">
              {category.name}
            </Link>
            <ChevronRight className="size-4" />
          </>
        )}
        <span className="text-foreground">{provider.businessName}</span>
      </nav>

      {/* Gallery */}
      <div className="grid gap-2 overflow-hidden rounded-2xl sm:grid-cols-4 sm:grid-rows-2">
        <div className="relative aspect-[16/10] sm:col-span-2 sm:row-span-2 sm:aspect-auto">
          <Image
            src={gallery[0]?.url ?? provider.coverImageUrl}
            alt={provider.businessName}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
        {gallery.slice(1, 5).map((m) => (
          <div key={m.id} className="relative hidden aspect-[4/3] sm:block">
            <Image src={m.url} alt={provider.businessName} fill sizes="25vw" className="object-cover" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Left: details */}
        <div>
          <div className="flex items-start gap-4">
            <Image
              src={provider.avatarUrl}
              alt={provider.ownerName}
              width={64}
              height={64}
              className="size-16 shrink-0 rounded-full object-cover"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {provider.businessName}
                </h1>
                {provider.isVerified && (
                  <Badge variant="brand">
                    <BadgeCheck className="size-3.5" />
                    Verified
                  </Badge>
                )}
                {provider.instantBook && (
                  <Badge variant="solid">
                    <Zap className="size-3.5 fill-current" />
                    Instant book
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-muted-foreground">{provider.tagline}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <RatingInline rating={provider.ratingAvg} count={provider.ratingCount} />
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" />
                  {provider.neighborhood}, NYC
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-4" />
                  Responds in {responseLabel(provider.responseMinutes)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="size-4" />
                  {provider.yearsExperience} yrs experience
                </span>
              </div>
            </div>
          </div>

          {/* Credentials */}
          {provider.credentials.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {provider.credentials.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
                >
                  <ShieldCheck className="size-4 text-success" />
                  {c}
                </span>
              ))}
            </div>
          )}

          <Section title="About">
            <p className="text-muted-foreground">{provider.bio}</p>
          </Section>

          <Section title={listing.title}>
            <p className="text-muted-foreground">{listing.description}</p>
            <div className="mt-5">
              <h4 className="mb-3 text-sm font-semibold">What's included</h4>
              <ul className="grid gap-2 sm:grid-cols-2">
                {listing.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* Packages */}
          {listing.packages.length > 0 && (
            <Section title="Packages">
              <div className="grid gap-3 sm:grid-cols-2">
                {listing.packages.map((pkg) => (
                  <div key={pkg.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-display font-bold">{pkg.name}</h4>
                      <span className="font-display text-lg font-extrabold">
                        {formatPrice(pkg.priceCents)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>
                    <ul className="mt-3 space-y-1.5">
                      {pkg.includes.map((inc) => (
                        <li key={inc} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" />
                          {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Add-ons */}
          {listing.addons.length > 0 && (
            <Section title="Popular add-ons">
              <div className="grid gap-2 sm:grid-cols-2">
                {listing.addons.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{addon.name}</p>
                      <p className="text-xs text-muted-foreground">{addon.description}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">
                      +{formatPrice(addon.priceCents)}
                      {addon.pricePerGuest && (
                        <span className="font-normal text-muted-foreground">/guest</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Availability */}
          <Section title="Availability">
            <p className="text-sm text-muted-foreground">
              Typically available:{" "}
              <span className="font-medium text-foreground">{weekdays.join(", ")}</span>. Pick your
              exact date and time during booking.
            </p>
          </Section>

          {/* Reviews */}
          <Section title={`Reviews · ${provider.ratingCount}`}>
            <div className="mb-5 flex items-center gap-3">
              <span className="font-display text-4xl font-extrabold">
                {provider.ratingAvg.toFixed(1)}
              </span>
              <div>
                <RatingStars rating={provider.ratingAvg} />
                <p className="text-sm text-muted-foreground">
                  Based on {provider.ratingCount} bookings
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {provider.reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <Image
                      src={review.authorAvatarUrl}
                      alt={review.authorName}
                      width={40}
                      height={40}
                      className="size-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold">{review.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {review.eventType} · {format(new Date(review.createdAt), "MMM yyyy")}
                      </p>
                    </div>
                  </div>
                  <RatingStars rating={review.rating} className="mt-3" />
                  <p className="mt-2 text-sm text-muted-foreground">{review.body}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right: sticky booking card */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-primary/5">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl font-extrabold">{pricingLabel(listing)}</span>
              <RatingInline rating={provider.ratingAvg} count={provider.ratingCount} />
            </div>

            <dl className="mt-5 space-y-2.5 text-sm">
              <Fact icon={<Users className="size-4" />} label="Group size">
                {listing.minGuests}–{listing.maxGuests} guests
              </Fact>
              <Fact icon={<Clock className="size-4" />} label="Response time">
                ~{responseLabel(provider.responseMinutes)}
              </Fact>
              <Fact icon={<MapPin className="size-4" />} label="Travels">
                {listing.travelRadiusMiles} mi · {formatPrice(listing.travelFeeCents)} fee
              </Fact>
            </dl>

            <Link
              href={`/book/${listing.id}`}
              className={cn(buttonVariants({ variant: "brand", size: "lg" }), "mt-6 w-full")}
            >
              {provider.instantBook ? (
                <>
                  <Zap className="size-4 fill-current" />
                  Instant book
                </>
              ) : (
                <>
                  <PartyPopper className="size-4" />
                  Request to book
                </>
              )}
            </Link>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              You won't be charged yet — payments are simulated in this demo.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 border-t border-border pt-8">
      <h3 className="mb-4 font-display text-xl font-extrabold tracking-tight">{title}</h3>
      {children}
    </section>
  );
}

function Fact({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="inline-flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
