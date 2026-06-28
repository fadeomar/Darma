"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui";

export function GameSearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">Search games</span>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search games, puzzles, classics…"
        size="lg"
        className="pl-10 pr-10"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-tertiary)] transition hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:shadow-[var(--focus-ring)]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </label>
  );
}
