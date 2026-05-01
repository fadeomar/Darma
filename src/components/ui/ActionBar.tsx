import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function ActionBar({
  className,
  align = "start",
  ...props
}: HTMLAttributes<HTMLDivElement> & { align?: "start" | "between" | "end" }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)] backdrop-blur",
        align === "between" && "justify-between",
        align === "end" && "justify-end",
        className,
      )}
      {...props}
    />
  );
}
