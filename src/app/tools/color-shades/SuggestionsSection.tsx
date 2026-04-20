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
          <h3 className="mb-3 text-base font-bold text-slate-900">
            {group.category}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {group.items.map((suggestion) => (
              <div
                key={suggestion.id}
                className="overflow-hidden rounded-2xl border border-black/10 bg-slate-50 transition hover:bg-white hover:shadow-sm"
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
                  <h4 className="text-sm font-bold text-slate-900">
                    {suggestion.name}
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {suggestion.description}
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-slate-500">
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
                    className="mt-4 w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
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
