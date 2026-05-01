import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex min-h-6 items-center rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-2 font-mono text-xs font-bold text-[var(--color-text-muted)] shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
