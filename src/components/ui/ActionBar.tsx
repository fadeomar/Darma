import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function ActionBar({
  className,
  align = "start",
  ...props
}: HTMLAttributes<HTMLDivElement> & { align?: "start" | "between" | "end" | "center" }) {
  return (
    <div
      data-tool-action-bar
      className={cn(
        "flex min-h-14 flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-3 py-2.5 shadow-[var(--shadow-card)]",
        "[&>button]:min-h-10 [&>a]:min-h-10",
        align === "between" && "justify-between",
        align === "end" && "justify-end",
        align === "center" && "justify-center",
        className,
      )}
      {...props}
    />
  );
}
