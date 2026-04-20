"use client";

import { useEffect, useState } from "react";
import type { ColorShadesParams } from "@/types";

interface InputSectionProps {
  params: ColorShadesParams;
  onParamsChange: (newParams: ColorShadesParams) => void;
}

export default function InputSection({
  params,
  onParamsChange,
}: InputSectionProps) {
  const [localParams, setLocalParams] = useState<ColorShadesParams>(params);

  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onParamsChange(localParams);
    }, 150);

    return () => clearTimeout(timer);
  }, [localParams, onParamsChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalParams((prev) => ({
      ...prev,
      [name]: name === "steps" ? Math.max(2, Math.min(20, Number(value))) : value,
    }));
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-slate-50 p-5">
      <h3 className="text-lg font-bold text-slate-900">Color settings</h3>
      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Start color
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
              className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              placeholder="#FFFFFF"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            End color
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
              className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              placeholder="#000000"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Number of shades
          </label>
          <input
            type="number"
            name="steps"
            min="2"
            max="20"
            value={localParams.steps}
            onChange={handleChange}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
