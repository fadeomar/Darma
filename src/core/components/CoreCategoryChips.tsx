"use client";

import { cn } from "@/lib/cn";

type CoreCategoryChipsProps = {
  categories: readonly string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  allLabel?: string;
  className?: string;
};

export function CoreCategoryChips({
  categories,
  activeCategory,
  onCategoryChange,
  allLabel = "All",
  className,
}: CoreCategoryChipsProps) {
  const options = [allLabel, ...categories];

  return (
    <div className={cn("core-scroll-row -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0", className)}>
      {options.map((category) => {
        const active = activeCategory === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
            className={cn(
              "min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold outline-none transition focus-visible:shadow-[var(--focus-ring)]",
              active
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)] shadow-[var(--shadow-xs)]"
                : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]",
            )}
            aria-pressed={active}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
