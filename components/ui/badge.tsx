import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-secondary text-secondary-foreground",
        brand: "bg-primary/10 text-primary",
        accent: "bg-accent/15 text-accent",
        success: "bg-success/12 text-success",
        warning: "bg-warning/15 text-[#b45309]",
        danger: "bg-destructive/12 text-destructive",
        outline: "border border-border bg-background/70 text-foreground",
        solid: "bg-foreground text-background",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        default: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "neutral", size: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
