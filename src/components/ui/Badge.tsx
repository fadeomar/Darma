import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "soft" | "success" | "warning" | "danger" | "info" | "outline";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-[var(--color-primary)] text-[var(--color-primary-text)]",
    soft: "bg-[var(--color-primary-soft)] text-[var(--color-text-secondary)]",
    success: "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)]",
    warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-warning-border)]",
    danger: "bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)]",
    info: "bg-[var(--color-info-bg)] text-[var(--color-info-text)] border border-[var(--color-info-border)]",
    outline: "border border-[var(--color-border-default)] text-[var(--color-text-secondary)]",
  };

  return (
    <span
      className={cn("inline-flex items-center rounded-[var(--radius-full)] px-3 py-1 text-xs font-bold", variants[variant], className)}
      {...props}
    />
  );
}
