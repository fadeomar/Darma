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
    soft: "border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]",
    accent: "border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]",
    success: "border border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
    warning: "border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
    danger: "border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
    info: "border border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
    outline: "border border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)]",
  };

  return (
    <span
      className={cn(
        // 12px is the readable floor (was 11px). Tracking comes down from
        // 0.07em to 0.04em so the wider glyphs do not lengthen the pill, and
        // leading-none becomes leading-4 so ascenders are not clipped at 12px.
        "inline-flex min-h-7 min-w-7 shrink-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-full)] px-3 py-1 font-mono text-[length:var(--text-badge)] font-bold uppercase leading-4 tracking-[0.04em]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
