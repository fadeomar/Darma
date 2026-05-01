import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "soft" | "success" | "warning" | "danger" | "outline";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-[var(--color-primary)] text-[var(--color-primary-text)]",
    soft: "bg-[var(--color-bg-soft)] text-[var(--color-text-muted)]",
    success: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-900",
    danger: "bg-red-100 text-red-800",
    outline: "border border-[var(--color-border)] text-[var(--color-text-muted)]",
  };

  return (
    <span
      className={cn("inline-flex items-center rounded-[var(--radius-full)] px-3 py-1 text-xs font-bold", variants[variant], className)}
      {...props}
    />
  );
}
