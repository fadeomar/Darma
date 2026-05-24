import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
};

const sizeClass = {
  sm: "min-h-8 px-2 text-xs",
  md: "min-h-9 px-3 text-sm",
};

export function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel, size = "sm", className }: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("inline-flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-black/[0.03] p-1", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[var(--radius-sm)] font-semibold text-[var(--color-text-muted)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45",
              sizeClass[size],
              active && "bg-[var(--color-surface-strong)] text-[var(--color-text)] shadow-sm",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
