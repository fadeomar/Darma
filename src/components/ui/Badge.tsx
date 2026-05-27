import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "soft" | "success" | "warning" | "danger" | "info" | "outline" | "accent";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const variants: Record<BadgeVariant, string> = {
    default: "border border-transparent bg-[var(--color-primary)] text-[var(--color-primary-text)]",
    soft: "border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
    accent: "border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
    success: "border border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
    warning: "border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
    danger: "border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
    info: "border border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
    outline: "border border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)]",
  };

  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-[var(--radius-full)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.08em]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
