"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type CoreSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  autoFocus?: boolean;
};

export function CoreSearchInput({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
  className,
  autoFocus = false,
}: CoreSearchInputProps) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-12 w-full rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-11 pr-12 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] outline-none transition placeholder:text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)]"
        type="search"
        autoFocus={autoFocus}
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      ) : null}
    </label>
  );
}
