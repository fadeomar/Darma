import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function PreviewFrame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-h-[var(--tool-preview-min-height)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}
