import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-6xl font-extrabold text-primary">404</p>
      <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-2 text-muted-foreground">It may have moved, or the link might be off.</p>
      <div className="mt-7 flex gap-3">
        <Link href="/browse" className={buttonVariants({ variant: "brand" })}>
          Browse providers
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Go home
        </Link>
      </div>
    </div>
  );
}
