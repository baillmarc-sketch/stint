import Link from "next/link";
import { MapPin } from "lucide-react";
import { Logo } from "./logo";
import { CATEGORIES } from "@/lib/data";
import { SITE } from "@/lib/constants";

const COLUMNS = [
  {
    title: "Customers",
    links: [
      { label: "Browse services", href: "/browse" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Gift an experience", href: "/browse" },
    ],
  },
  {
    title: "Providers",
    links: [
      { label: "Become a provider", href: "/login?next=/dashboard" },
      { label: "Provider dashboard", href: "/dashboard" },
      { label: "Pricing & fees", href: "/#for-providers" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#how-it-works" },
      { label: "Trust & safety", href: "/#trust" },
      { label: "Contact", href: "/#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">{SITE.tagline}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
              <MapPin className="size-3.5 text-primary" />
              Now serving New York City
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Popular categories
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {CATEGORIES.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Stint. A demo marketplace — bookings are simulated.</p>
          <p>Made for great parties.</p>
        </div>
      </div>
    </footer>
  );
}
