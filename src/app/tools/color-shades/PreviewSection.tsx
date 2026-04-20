"use client";

import { useState } from "react";
import type { ColorShade } from "@/types";
import { copyToClipboard } from "@/utils/color-shades";

interface PreviewSectionProps {
  shades: ColorShade[];
}

export default function PreviewSection({ shades }: PreviewSectionProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1200);
    }
  };

  if (shades.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 p-8 text-center text-slate-500">
        Enter valid colors to generate shades.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-black/10">
        <div className="flex h-64">
          {shades.map((shade, index) => (
            <button
              key={index}
              type="button"
              className="group relative flex-1 transition-all duration-200 hover:flex-[1.15]"
              style={{ backgroundColor: shade.hex }}
              onClick={() => handleCopy(shade.hex, index)}
            >
              <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 opacity-0 shadow transition group-hover:opacity-100">
                {copiedIndex === index ? "Copied" : shade.hex}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shades.map((shade, index) => (
          <button
            key={index}
            type="button"
            className="rounded-2xl border border-black/10 bg-slate-50 p-3 text-left transition hover:bg-white"
            onClick={() => handleCopy(shade.hex, index)}
          >
            <div className="mb-2 flex items-center gap-3">
              <div
                className="h-5 w-5 rounded-md border border-black/10"
                style={{ backgroundColor: shade.hex }}
              />
              <span className="font-mono text-sm font-semibold text-slate-900">
                {copiedIndex === index ? "Copied" : shade.hex}
              </span>
            </div>
            <div className="font-mono text-xs text-slate-500">{shade.rgb}</div>
            <div className="mt-1 font-mono text-xs text-slate-500">{shade.hsl}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
