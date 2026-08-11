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
  fullWidth?: boolean;
  layout?: "wrap" | "grid";
  columns?: 2 | 3 | 4;
};

const sizeClass = {
  sm: "min-h-9 px-2.5 text-xs",
  md: "min-h-[40px] px-3 text-xs",
};

const gridColumnsClass = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "sm",
  className,
  fullWidth = false,
  layout = "wrap",
  columns = 3,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "gap-1 border border-[var(--color-border-default)] bg-[var(--color-control-track)] p-1 shadow-[var(--shadow-xs)]",
        layout === "grid"
          ? `grid w-full ${gridColumnsClass[columns]} rounded-[var(--radius-md)]`
          : "inline-flex max-w-full flex-wrap rounded-[var(--radius-full)]",
        fullWidth && layout === "wrap" && "flex w-full [&>button]:flex-1",
        className,
      )}
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
              "min-w-0 rounded-[var(--radius-full)] text-center font-mono font-bold uppercase tracking-[0.05em] transition duration-[var(--duration-fast)]",
              // Grid cells and stretched pills can be narrower than a long
              // label, so let those wrap instead of clipping. Auto-width pills
              // size to their content and stay on one line.
              layout === "grid" || fullWidth ? "whitespace-normal break-words py-1 leading-tight" : "whitespace-nowrap break-keep leading-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-45",
              sizeClass[size],
              active
                ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-[var(--shadow-xs)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
