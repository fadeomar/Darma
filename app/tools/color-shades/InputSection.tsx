"use client";

import { ColorShadesParams } from "@/types";
import { useState, useEffect } from "react";

interface InputSectionProps {
  params: ColorShadesParams;
  onParamsChange: (newParams: ColorShadesParams) => void;
}

export default function InputSection({
  params,
  onParamsChange,
}: InputSectionProps) {
  const [localParams, setLocalParams] = useState<ColorShadesParams>(params);

  // Sync localParams with props.params when it changes (e.g., from apply-suggestion)
  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  // Debounce onParamsChange when localParams changes
  useEffect(() => {
    const timer = setTimeout(() => {
      onParamsChange(localParams);
    }, 300);

    return () => clearTimeout(timer);
  }, [localParams, onParamsChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalParams((prev) => ({
      ...prev,
      [name]:
        name === "steps" ? Math.max(2, Math.min(20, Number(value))) : value,
    }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Color Settings
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="color1"
              value={localParams.color1}
              onChange={handleChange}
              className="h-10 w-16 cursor-pointer rounded border border-gray-300"
            />
            <input
              type="text"
              name="color1"
              value={localParams.color1}
              onChange={handleChange}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="#FFFFFF"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="color2"
              value={localParams.color2}
              onChange={handleChange}
              className="h-10 w-16 cursor-pointer rounded border border-gray-300"
            />
            <input
              type="text"
              name="color2"
              value={localParams.color2}
              onChange={handleChange}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="#000000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Shades (2-20)
          </label>
          <input
            type="number"
            name="steps"
            min="2"
            max="20"
            value={localParams.steps}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
