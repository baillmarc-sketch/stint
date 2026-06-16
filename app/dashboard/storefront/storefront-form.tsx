"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { saveStorefront, type SaveState } from "./actions";

export interface PackageRowValues {
  name: string;
  description: string;
  price: string;
  includes: string;
}
export interface AddonRowValues {
  name: string;
  description: string;
  price: string;
  pricePerGuest: boolean;
}
export interface StorefrontFormValues {
  listingId: string | null;
  businessName: string;
  tagline: string;
  bio: string;
  neighborhood: string;
  categoryId: string;
  yearsExperience: string;
  credentials: string;
  title: string;
  description: string;
  pricingModel: "hourly" | "flat" | "package";
  basePrice: string;
  unitLabel: string;
  minHours: string;
  minGuests: string;
  maxGuests: string;
  travelRadiusMiles: string;
  travelFee: string;
  instantBook: boolean;
  includes: string;
  packages: PackageRowValues[];
  addons: AddonRowValues[];
}

const num = (s: string) => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
};
const money = (s: string) => Math.round((parseFloat(s) || 0) * 100);
const lines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

function buildPayload(v: StorefrontFormValues) {
  return {
    listingId: v.listingId,
    businessName: v.businessName.trim(),
    tagline: v.tagline.trim(),
    bio: v.bio.trim(),
    neighborhood: v.neighborhood.trim(),
    categoryId: v.categoryId,
    yearsExperience: num(v.yearsExperience),
    credentials: lines(v.credentials),
    title: v.title.trim(),
    description: v.description.trim(),
    pricingModel: v.pricingModel,
    basePriceCents: money(v.basePrice),
    unitLabel: v.unitLabel.trim(),
    minHours: v.minHours.trim() === "" ? null : num(v.minHours),
    minGuests: num(v.minGuests) || 1,
    maxGuests: num(v.maxGuests) || 100,
    travelRadiusMiles: num(v.travelRadiusMiles),
    travelFeeCents: money(v.travelFee),
    instantBook: v.instantBook,
    includes: lines(v.includes),
    packages: v.packages.map((p) => ({
      name: p.name.trim(),
      description: p.description.trim(),
      priceCents: money(p.price),
      includes: lines(p.includes),
    })),
    addons: v.addons.map((a) => ({
      name: a.name.trim(),
      description: a.description.trim(),
      priceCents: money(a.price),
      pricePerGuest: a.pricePerGuest,
    })),
  };
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function StorefrontForm({
  initial,
  categories,
}: {
  initial: StorefrontFormValues;
  categories: Array<{ id: string; name: string }>;
}) {
  const [v, setV] = useState<StorefrontFormValues>(initial);
  const [state, action, pending] = useActionState<SaveState, FormData>(saveStorefront, {});

  const set = <K extends keyof StorefrontFormValues>(key: K, value: StorefrontFormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const addPackage = () =>
    set("packages", [...v.packages, { name: "", description: "", price: "", includes: "" }]);
  const addAddon = () =>
    set("addons", [...v.addons, { name: "", description: "", price: "", pricePerGuest: false }]);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="payload" value={JSON.stringify(buildPayload(v))} />

      <Section title="Profile" desc="How you show up across the marketplace.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Business name</Label>
            <Input value={v.businessName} onChange={(e) => set("businessName", e.target.value)} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Choose a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label>Tagline</Label>
          <Input
            value={v.tagline}
            placeholder="One vivid line about what you do"
            onChange={(e) => set("tagline", e.target.value)}
          />
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea value={v.bio} onChange={(e) => set("bio", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Neighborhood</Label>
            <Input value={v.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
          </div>
          <div>
            <Label>Years of experience</Label>
            <Input
              type="number"
              min={0}
              value={v.yearsExperience}
              onChange={(e) => set("yearsExperience", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label>Credentials &amp; badges</Label>
          <Textarea
            value={v.credentials}
            placeholder="One per line — e.g. Licensed &amp; insured"
            onChange={(e) => set("credentials", e.target.value)}
          />
        </div>
      </Section>

      <Section title="Service &amp; pricing" desc="Your primary bookable listing.">
        <div>
          <Label>Listing title</Label>
          <Input value={v.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={v.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Pricing model</Label>
            <Select
              value={v.pricingModel}
              onChange={(e) => set("pricingModel", e.target.value as StorefrontFormValues["pricingModel"])}
            >
              <option value="hourly">Hourly</option>
              <option value="flat">Flat event rate</option>
              <option value="package">Starting from (packages)</option>
            </Select>
          </div>
          <div>
            <Label>Base price ($)</Label>
            <Input
              type="number"
              min={0}
              step="1"
              value={v.basePrice}
              onChange={(e) => set("basePrice", e.target.value)}
            />
          </div>
          <div>
            <Label>Unit label</Label>
            <Input
              value={v.unitLabel}
              placeholder="per hour / per event"
              onChange={(e) => set("unitLabel", e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <Label>Min hours</Label>
            <Input
              type="number"
              min={0}
              value={v.minHours}
              placeholder="—"
              onChange={(e) => set("minHours", e.target.value)}
            />
          </div>
          <div>
            <Label>Min guests</Label>
            <Input
              type="number"
              min={1}
              value={v.minGuests}
              onChange={(e) => set("minGuests", e.target.value)}
            />
          </div>
          <div>
            <Label>Max guests</Label>
            <Input
              type="number"
              min={1}
              value={v.maxGuests}
              onChange={(e) => set("maxGuests", e.target.value)}
            />
          </div>
          <div>
            <Label>Travel radius (mi)</Label>
            <Input
              type="number"
              min={0}
              value={v.travelRadiusMiles}
              onChange={(e) => set("travelRadiusMiles", e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Travel fee ($)</Label>
            <Input
              type="number"
              min={0}
              value={v.travelFee}
              onChange={(e) => set("travelFee", e.target.value)}
            />
          </div>
          <label className="flex items-end gap-2 pb-2.5 text-sm font-medium">
            <input
              type="checkbox"
              className="size-4 rounded border-input accent-primary"
              checked={v.instantBook}
              onChange={(e) => set("instantBook", e.target.checked)}
            />
            Allow instant booking
          </label>
        </div>
        <div>
          <Label>What&apos;s included</Label>
          <Textarea
            value={v.includes}
            placeholder="One bullet per line"
            onChange={(e) => set("includes", e.target.value)}
          />
        </div>
      </Section>

      <Section title="Packages" desc="Optional bundles guests can pick instead of the base rate.">
        {v.packages.map((p, i) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
              <Input
                value={p.name}
                placeholder="Package name"
                onChange={(e) =>
                  set(
                    "packages",
                    v.packages.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                  )
                }
              />
              <Input
                type="number"
                min={0}
                value={p.price}
                placeholder="Price $"
                onChange={(e) =>
                  set(
                    "packages",
                    v.packages.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)),
                  )
                }
              />
            </div>
            <Textarea
              className="mt-3"
              value={p.description}
              placeholder="Short description"
              onChange={(e) =>
                set(
                  "packages",
                  v.packages.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)),
                )
              }
            />
            <Textarea
              className="mt-3"
              value={p.includes}
              placeholder="What's included — one per line"
              onChange={(e) =>
                set(
                  "packages",
                  v.packages.map((x, j) => (j === i ? { ...x, includes: e.target.value } : x)),
                )
              }
            />
            <button
              type="button"
              onClick={() => set("packages", v.packages.filter((_, j) => j !== i))}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
            >
              <Trash2 className="size-3.5" /> Remove package
            </button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addPackage}>
          <Plus className="size-4" /> Add package
        </Button>
      </Section>

      <Section title="Add-ons" desc="Extras guests can tack onto a booking.">
        {v.addons.map((a, i) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
              <Input
                value={a.name}
                placeholder="Add-on name"
                onChange={(e) =>
                  set(
                    "addons",
                    v.addons.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                  )
                }
              />
              <Input
                type="number"
                min={0}
                value={a.price}
                placeholder="Price $"
                onChange={(e) =>
                  set(
                    "addons",
                    v.addons.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)),
                  )
                }
              />
            </div>
            <Textarea
              className="mt-3"
              value={a.description}
              placeholder="Short description"
              onChange={(e) =>
                set(
                  "addons",
                  v.addons.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)),
                )
              }
            />
            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border-input accent-primary"
                  checked={a.pricePerGuest}
                  onChange={(e) =>
                    set(
                      "addons",
                      v.addons.map((x, j) => (j === i ? { ...x, pricePerGuest: e.target.checked } : x)),
                    )
                  }
                />
                Priced per guest
              </label>
              <button
                type="button"
                onClick={() => set("addons", v.addons.filter((_, j) => j !== i))}
                className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
              >
                <Trash2 className="size-3.5" /> Remove
              </button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addAddon}>
          <Plus className="size-4" /> Add add-on
        </Button>
      </Section>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Save storefront
        </Button>
        {state.ok && <span className="text-sm font-medium text-success">Saved ✓</span>}
        {state.error && <span className="text-sm text-destructive">{state.error}</span>}
      </div>
    </form>
  );
}
