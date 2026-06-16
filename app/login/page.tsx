import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/shared/logo";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/onboarding";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-12">
      <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-xl shadow-primary/5">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight">
            Welcome to Stint
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to book providers or list your own services.
          </p>
        </div>

        <div className="mt-7">
          <GoogleSignIn next={next} />
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
          <Sparkles className="size-4 shrink-0 text-primary" />
          You can browse and explore the whole demo without signing in.
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to Stint&apos;s Terms and Privacy Policy.
        </p>
      </div>

      <Link href="/browse" className="mt-6 text-sm text-muted-foreground hover:text-foreground">
        ← Keep browsing
      </Link>
    </div>
  );
}
