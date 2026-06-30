"use client";

import { CATEGORY_LABELS, type GameCategory } from "../domain/game";
import { cn } from "@/lib/cn";

export type GameFilter =
  | "all"
  | "featured"
  | "popular"
  | "new"
  | GameCategory;

const CHIPS: Array<{ value: GameFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "featured", label: "Featured" },
  { value: "popular", label: "Popular" },
  { value: "new", label: "New" },
  { value: "puzzle", label: CATEGORY_LABELS.puzzle },
  { value: "arcade", label: CATEGORY_LABELS.arcade },
  { value: "classic", label: CATEGORY_LABELS.classic },
  { value: "casual", label: CATEGORY_LABELS.casual },
  { value: "brain", label: CATEGORY_LABELS.brain },
  { value: "quick-break", label: CATEGORY_LABELS["quick-break"] },
  { value: "mobile-friendly", label: CATEGORY_LABELS["mobile-friendly"] },
  { value: "2-players", label: CATEGORY_LABELS["2-players"] },
];

export function GameCategoryChips({
  active,
  onChange,
}: {
  active: GameFilter;
  onChange: (next: GameFilter) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filter games by category"
      className="games-chip-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
    >
      {CHIPS.map((chip) => {
        const isActive = active === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(chip.value)}
            className={cn(
              "min-h-9 shrink-0 whitespace-nowrap rounded-[var(--radius-full)] border px-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition focus:outline-none focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none",
              isActive
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]"
                : "border-[var(--color-border-default)] bg-[var(--color-control-bg)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]",
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
