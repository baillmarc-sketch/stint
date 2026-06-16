"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, LayoutDashboard, LogOut, User } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { CurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function UserNav({ user }: { user: CurrentUser | null }) {
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login?next=/dashboard"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}
        >
          List your service
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "brand", size: "sm" })}>
          Sign in
        </Link>
      </div>
    );
  }

  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-background p-1 pr-3 transition-colors hover:bg-secondary/60"
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
            {initial}
          </span>
        )}
        <span className="hidden max-w-28 truncate text-sm font-medium sm:block">{user.name}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-border" />
            <MenuLink href="/bookings" icon={<CalendarDays className="size-4" />}>
              My bookings
            </MenuLink>
            <MenuLink href="/account" icon={<User className="size-4" />}>
              Account
            </MenuLink>
            <MenuLink href="/dashboard" icon={<LayoutDashboard className="size-4" />}>
              Provider dashboard
            </MenuLink>
            <div className="my-1 h-px bg-border" />
            <form action="/auth/signout" method="post">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="w-full justify-start font-normal text-muted-foreground"
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary/70"
    >
      {icon}
      {children}
    </Link>
  );
}
