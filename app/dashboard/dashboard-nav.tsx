"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DashboardNav({ tabs }: { tabs: Array<{ href: string; label: string }> }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-gradient text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
