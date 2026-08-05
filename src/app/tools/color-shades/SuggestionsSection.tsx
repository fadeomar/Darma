"use client";

import { useMemo, useState } from "react";
import tinycolor from "tinycolor2";
import { Button, Tabs } from "@/components/ui";
import type { ColorShadesParams } from "@/types";
import { COLOR_SUGGESTIONS } from "./suggestions";

type CategoryId = string;

function getFiveColors(colors: string[]): string[] {
  if (colors.length >= 5) return colors.slice(0, 5);
  const start = tinycolor(colors[0]);
  const end = tinycolor(colors[colors.length - 1]);
  return Array.from({ length: 5 }, (_, index) => tinycolor.mix(start, end, (index / 4) * 100).toHexString());
}

function applySuggestion(params: Partial<ColorShadesParams>) {
  window.dispatchEvent(new CustomEvent("apply-suggestion", { detail: params }));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function SuggestionsSection() {
  const categories = useMemo(() => COLOR_SUGGESTIONS.map((group) => group.category), []);
  const [activeCategory, setActiveCategory] = useState<CategoryId>(categories[0] ?? "");
  const activeGroup = COLOR_SUGGESTIONS.find((group) => group.category === activeCategory) ?? COLOR_SUGGESTIONS[0];
  const featured = COLOR_SUGGESTIONS.flatMap((group) => group.items.slice(0, 1)).slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          ariaLabel="Color inspiration categories"
          items={categories.map((category) => ({ value: category, label: category.replace(/^[^\w]+\s*/, "") }))}
          value={activeCategory}
          onChange={setActiveCategory}
          className="max-w-full overflow-x-auto"
        />
        <div className="flex flex-wrap gap-2">
          {featured.slice(0, 3).map((item) => (
            <button
              key={`featured-${item.id}`}
              type="button"
              onClick={() => applySuggestion({ color1: item.colors[0], color2: item.colors[item.colors.length - 1], steps: 9 })}
              className="overflow-hidden rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-control-track)] pr-3 text-xs font-bold text-[var(--color-text-primary)] transition hover:bg-[var(--color-control-hover)]"
            >
              <span className="mr-2 inline-flex h-7 w-10 align-middle" style={{ background: `linear-gradient(90deg, ${item.colors[0]}, ${item.colors[item.colors.length - 1]})` }} />
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {activeGroup.items.map((suggestion) => {
          const start = suggestion.colors[0];
          const end = suggestion.colors[suggestion.colors.length - 1];
          return (
            <article
              key={suggestion.id}
              className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)]"
            >
              <div className="flex h-14">
                {getFiveColors(suggestion.colors).map((color, index) => (
                  <span key={`${suggestion.id}-${color}-${index}`} className="flex-1" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-[var(--color-text-primary)]">{suggestion.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">{suggestion.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {suggestion.bestFor.slice(0, 2).map((useCase) => (
                    <span key={useCase} className="rounded-[var(--radius-full)] bg-[var(--color-control-track)] px-2 py-1 text-xs font-bold text-[var(--color-text-secondary)]">
                      {useCase}
                    </span>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => applySuggestion({ color1: start, color2: end, steps: 7 })}>
                    7 shades
                  </Button>
                  <Button size="sm" onClick={() => applySuggestion({ color1: start, color2: end, steps: 9 })}>
                    Apply
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
