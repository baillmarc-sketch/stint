import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { CalendarDays, LayoutDashboard, LogIn } from "lucide-react";
import { getOptionalUser } from "@/lib/auth";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getOptionalUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
          <LogIn className="size-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">Sign in to your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with Google to manage your bookings and profile.
        </p>
        <div className="mt-6">
          <GoogleSignIn next="/account" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">Account</h1>
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={56}
            height={56}
            className="size-14 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-14 place-items-center rounded-full bg-brand-gradient text-xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <p className="font-display text-lg font-bold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link href="/bookings" className={cn(buttonVariants({ variant: "outline" }), "h-auto justify-start gap-3 p-4")}>
          <CalendarDays className="size-5 text-primary" />
          <span className="text-left">
            <span className="block font-semibold">My bookings</span>
            <span className="block text-xs text-muted-foreground">Track your events</span>
          </span>
        </Link>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "h-auto justify-start gap-3 p-4")}>
          <LayoutDashboard className="size-5 text-primary" />
          <span className="text-left">
            <span className="block font-semibold">Provider dashboard</span>
            <span className="block text-xs text-muted-foreground">Manage your listings</span>
          </span>
        </Link>
      </div>

      <form action="/auth/signout" method="post" className="mt-6">
        <button type="submit" className={buttonVariants({ variant: "ghost" })}>
          Sign out
        </button>
      </form>
    </div>
  );
}
