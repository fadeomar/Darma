"use client";

import { Select } from "@/components/ui";

export type GameSort = "featured" | "newest" | "az" | "short-play" | "easy-first";

const SORT_OPTIONS: Array<{ value: GameSort; label: string }> = [
  { value: "featured", label: "Featured first" },
  { value: "newest", label: "Newest" },
  { value: "az", label: "A–Z" },
  { value: "short-play", label: "Short play time" },
  { value: "easy-first", label: "Easy first" },
];

export function GameSortSelect({
  value,
  onChange,
}: {
  value: GameSort;
  onChange: (next: GameSort) => void;
}) {
  return (
    <label className="grid gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
      Sort
      <Select value={value} onChange={(event) => onChange(event.target.value as GameSort)} size="sm">
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  );
}
