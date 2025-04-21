"use client";

import { ColorShadesParams } from "@/types";
import { COLOR_SUGGESTIONS } from "./suggestions";
import tinycolor from "tinycolor2";

export default function SuggestionsSection() {
  // Function to generate exactly 5 colors for card header
  const getFiveColors = (colors: string[]): string[] => {
    if (colors.length === 5) return colors;

    // If fewer than 5 colors, interpolate using tinycolor
    const start = tinycolor(colors[0]);
    const end = tinycolor(colors[colors.length - 1]);
    const steps = 5;
    const interpolated: string[] = [];

    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      const color = tinycolor.mix(start, end, ratio * 100);
      interpolated.push(color.toHexString());
    }

    return interpolated;
  };

  const handleApply = (params: Omit<ColorShadesParams, "steps">) => {
    // Dispatch custom event with color data
    window.dispatchEvent(
      new CustomEvent("apply-suggestion", {
        detail: {
          color1: params.color1,
          color2: params.color2,
        },
      })
    );
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        💡 Color Inspiration
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        Explore curated color combinations to spark your next design.
      </p>

      <div className="space-y-6">
        {COLOR_SUGGESTIONS.map((group) => (
          <div key={group.category}>
            <h3 className="font-medium text-base mb-2 flex items-center text-gray-700">
              {group.category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {group.items.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex h-10">
                    {getFiveColors(suggestion.colors).map((color, index) => (
                      <div
                        key={`${suggestion.id}-${index}`}
                        className="flex-1 transition-transform hover:scale-105"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm text-gray-800">
                      {suggestion.name}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {suggestion.description}
                    </p>
                    <div className="mt-2">
                      <ul className="text-xs text-gray-500 space-y-0.5">
                        {suggestion.bestFor.map((useCase) => (
                          <li key={useCase} className="flex items-center">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-1.5" />
                            {useCase}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() =>
                        handleApply({
                          color1: suggestion.colors[0],
                          color2:
                            suggestion.colors[suggestion.colors.length - 1],
                        })
                      }
                      className="mt-3 w-full py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors duration-200"
                    >
                      Apply Colors
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
