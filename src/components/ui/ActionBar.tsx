import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function ActionBar({
  className,
  align = "start",
  ...props
}: HTMLAttributes<HTMLDivElement> & { align?: "start" | "between" | "end" | "center" }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] px-3 py-2.5 shadow-[var(--shadow-card)]",
        align === "between" && "justify-between",
        align === "end" && "justify-end",
        align === "center" && "justify-center",
        className,
      )}
      {...props}
    />
  );
}
