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
    <div role="tablist" aria-label={ariaLabel} className={cn("inline-flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-black/[0.03] p-1", className)}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={item.value === value}
          disabled={item.disabled}
          onClick={() => onChange(item.value)}
          className={cn(
            "min-h-9 rounded-[var(--radius-sm)] px-3 text-sm font-semibold text-[var(--color-text-muted)] transition disabled:opacity-45",
            item.value === value && "bg-[var(--color-surface-strong)] text-[var(--color-text)] shadow-sm",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
