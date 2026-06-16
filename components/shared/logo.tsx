import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-xl bg-brand-gradient text-white shadow-sm">
        <PartyPopper className="size-[18px]" />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">Stint</span>
    </Link>
  );
}
