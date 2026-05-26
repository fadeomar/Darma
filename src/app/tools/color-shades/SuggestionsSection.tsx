"use client";

import tinycolor from "tinycolor2";
import type { ColorShadesParams } from "@/types";
import { COLOR_SUGGESTIONS } from "./suggestions";

export default function SuggestionsSection() {
  const getFiveColors = (colors: string[]): string[] => {
    if (colors.length === 5) return colors;

    const start = tinycolor(colors[0]);
    const end = tinycolor(colors[colors.length - 1]);
    return Array.from({ length: 5 }, (_, index) =>
      tinycolor.mix(start, end, (index / 4) * 100).toHexString(),
    );
  };

  const handleApply = (params: Omit<ColorShadesParams, "steps">) => {
    window.dispatchEvent(
      new CustomEvent("apply-suggestion", {
        detail: {
          color1: params.color1,
          color2: params.color2,
        },
      }),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {COLOR_SUGGESTIONS.map((group) => (
        <div key={group.category}>
          <h3 className="mb-3 text-base font-bold text-[var(--color-text-primary)]">
            {group.category}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {group.items.map((suggestion) => (
              <div
                key={suggestion.id}
                className="overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] transition hover:bg-[var(--color-surface-raised)] hover:shadow-sm"
              >
                <div className="flex h-10">
                  {getFiveColors(suggestion.colors).map((color, index) => (
                    <div
                      key={`${suggestion.id}-${index}`}
                      className="flex-1"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {suggestion.name}
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                    {suggestion.description}
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-[var(--color-text-tertiary)]">
                    {suggestion.bestFor.slice(0, 3).map((useCase) => (
                      <li key={useCase}>• {useCase}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() =>
                      handleApply({
                        color1: suggestion.colors[0],
                        color2: suggestion.colors[suggestion.colors.length - 1],
                      })
                    }
                    className="mt-4 w-full rounded-xl bg-[var(--color-primary)] px-3 py-2 text-xs font-bold text-[var(--color-primary-text)] transition hover:bg-[var(--color-primary-hover)]"
                  >
                    Apply colors
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
