"use client";

import { Select } from "@/components/ui";
import { CLIP_PATH_PRESETS } from "../presets";
import type { ClipPathPresetCategory } from "../types";

const CATEGORY_ORDER: ClipPathPresetCategory[] = ["basic", "polygon", "arrow", "decorative"];
const CATEGORY_LABELS: Record<ClipPathPresetCategory, string> = {
  basic: "Basic",
  polygon: "Geometric",
  arrow: "Directional",
  decorative: "Decorative",
};

export function PresetGallery({ activePresetId, onApply }: { activePresetId: string; onApply: (id: string) => void }) {
  return (
    <section aria-labelledby="clip-presets-title" className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 id="clip-presets-title" className="text-sm font-black text-[var(--color-text-primary)]">Shape presets</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Active: {activePresetId === "custom" ? "Custom" : CLIP_PATH_PRESETS.find((preset) => preset.id === activePresetId)?.name}</p>
        </div>
      </div>

      <label className="mb-3 block text-xs font-bold text-[var(--color-text-secondary)] sm:hidden">
        Preset
        <Select className="mt-1" value={activePresetId} onChange={(event) => onApply(event.target.value)}>
          <option value="custom">Custom</option>
          {CATEGORY_ORDER.map((category) => (
            <optgroup key={category} label={CATEGORY_LABELS[category]}>
              {CLIP_PATH_PRESETS.filter((preset) => preset.category === category).map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.name}</option>
              ))}
            </optgroup>
          ))}
        </Select>
      </label>

      <div className="hidden max-h-[510px] space-y-4 overflow-y-auto pr-1 sm:block">
        {CATEGORY_ORDER.map((category) => (
          <div key={category}>
            <h3 className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{CATEGORY_LABELS[category]}</h3>
            <div className="grid grid-cols-2 gap-2">
              {CLIP_PATH_PRESETS.filter((preset) => preset.category === category).map((preset) => {
                const active = preset.id === activePresetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onApply(preset.id)}
                    className={`group min-w-0 rounded-[var(--radius-md)] border p-2 text-left outline-none transition focus-visible:shadow-[var(--focus-ring)] ${active ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] hover:border-[var(--color-border-strong)]"}`}
                  >
                    <svg viewBox="0 0 100 100" className="mx-auto h-14 w-full" aria-hidden="true">
                      <polygon points={preset.points.map((point) => `${point.x},${point.y}`).join(" ")} fill="var(--color-primary-soft)" stroke="var(--color-primary)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                    </svg>
                    <span className="mt-1 block truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
