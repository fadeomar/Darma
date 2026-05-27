import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex min-h-6 items-center rounded-[var(--radius-xs)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-2 font-mono text-[11px] font-bold text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)]",
        className,
      )}
      {...props}
    />
  );
}
