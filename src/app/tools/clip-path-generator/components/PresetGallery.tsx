"use client";

import { useState } from "react";
import { Select, Tabs } from "@/components/ui";
import { CLIP_PATH_PRESETS } from "../presets";
import type { ClipPathPresetCategory } from "../types";

const CATEGORY_ORDER: ClipPathPresetCategory[] = ["basic", "polygon", "arrow", "decorative"];
const CATEGORY_LABELS: Record<ClipPathPresetCategory, string> = {
  basic: "Basic",
  polygon: "Geometric",
  arrow: "Directional",
  decorative: "Decorative",
};
const CATEGORY_ITEMS = CATEGORY_ORDER.map((value) => ({ value, label: CATEGORY_LABELS[value] }));

export function PresetGallery({ activePresetId, onApply }: { activePresetId: string; onApply: (id: string) => void }) {
  const activePreset = CLIP_PATH_PRESETS.find((preset) => preset.id === activePresetId);
  const [category, setCategory] = useState<ClipPathPresetCategory>(activePreset?.category ?? "basic");
  const visiblePresets = CLIP_PATH_PRESETS.filter((preset) => preset.category === category);

  return (
    <section aria-labelledby="clip-presets-title" className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="mb-3">
        <h2 id="clip-presets-title" className="text-sm font-black text-[var(--color-text-primary)]">Quick shapes</h2>
        <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Pick a starting shape, then refine it directly on the canvas.</p>
      </div>

      <label className="block text-xs font-bold text-[var(--color-text-secondary)] sm:hidden">
        Shape family
        <Select
          className="mt-1"
          value={category}
          onChange={(event) => setCategory(event.target.value as ClipPathPresetCategory)}
        >
          {CATEGORY_ORDER.map((value) => (
            <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>
          ))}
        </Select>
      </label>

      <Tabs
        className="hidden min-w-0 sm:flex"
        fullWidth
        items={CATEGORY_ITEMS}
        value={category}
        onChange={(value) => setCategory(value as ClipPathPresetCategory)}
        ariaLabel="Clip path preset categories"
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        {visiblePresets.map((preset) => {
          const active = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={active}
              onClick={() => onApply(preset.id)}
              className={`group min-w-0 rounded-[var(--radius-md)] border p-2 text-left outline-none transition focus-visible:shadow-[var(--focus-ring)] ${active ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] hover:border-[var(--color-border-strong)]"}`}
            >
              <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-base)] p-1.5">
                <svg viewBox="0 0 100 100" className="mx-auto h-16 w-full" aria-hidden="true">
                  <polygon
                    points={preset.points.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="var(--color-primary-soft)"
                    stroke="var(--color-primary)"
                    strokeWidth="3"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
              <span className="mt-1.5 block truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
