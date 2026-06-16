import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "./logo";
import { UserNav } from "./user-nav";
import { MAIN_NAV } from "@/lib/constants";
import { getOptionalUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const user = await getOptionalUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="ml-2 hidden items-center md:flex">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/browse"
            aria-label="Browse services"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Find a service</span>
          </Link>
          <UserNav user={user} />
        </div>
      </div>
    </header>
  );
}
