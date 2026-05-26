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
      <div className="rounded-2xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-8 text-center text-[var(--color-text-tertiary)]">
        Enter valid colors to generate shades.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border-default)]">
        <div className="flex h-64">
          {shades.map((shade, index) => (
            <button
              key={index}
              type="button"
              className="group relative flex-1 transition-all duration-200 hover:flex-[1.15]"
              style={{ backgroundColor: shade.hex }}
              onClick={() => handleCopy(shade.hex, index)}
            >
              <span className="absolute inset-x-3 bottom-3 rounded-full bg-[var(--color-surface-overlay)] px-3 py-1 text-xs font-semibold text-[var(--color-text-primary)] opacity-0 shadow transition group-hover:opacity-100">
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
            className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-3 text-left transition hover:bg-[var(--color-surface-raised)]"
            onClick={() => handleCopy(shade.hex, index)}
          >
            <div className="mb-2 flex items-center gap-3">
              <div
                className="h-5 w-5 rounded-md border border-[var(--color-border-default)]"
                style={{ backgroundColor: shade.hex }}
              />
              <span className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">
                {copiedIndex === index ? "Copied" : shade.hex}
              </span>
            </div>
            <div className="font-mono text-xs text-[var(--color-text-tertiary)]">{shade.rgb}</div>
            <div className="mt-1 font-mono text-xs text-[var(--color-text-tertiary)]">{shade.hsl}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
