import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem<T extends string> = {
  value: T;
  label: ReactNode;
  disabled?: boolean;
};

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-control-track)] p-1",
        className,
      )}
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={item.value === value}
          disabled={item.disabled}
          onClick={() => onChange(item.value)}
          className={cn(
            "min-h-8 rounded-[var(--radius-full)] px-3 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-secondary)] transition disabled:opacity-45",
            item.value === value
              ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-[var(--shadow-xs)]"
              : "hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
