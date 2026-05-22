"use client";

import type {
  AnimatedBackgroundState,
  BackgroundPreset,
} from "@/types/animatedBackgroundTypes";
import { generateCss } from "../lib/generateCss";
import { generateParticleData } from "../lib/generateParticleData";
import { presetToState } from "../lib/presets";

interface PresetGalleryProps {
  presets: BackgroundPreset[];
  activeId: string;
  onSelect: (preset: BackgroundPreset) => void;
  compact?: boolean;
}

export default function PresetGallery({
  presets,
  activeId,
  onSelect,
  compact = false,
}: PresetGalleryProps) {
  return (
    <div
      className={
        compact
          ? "flex gap-3 overflow-x-auto pb-2"
          : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      }
    >
      {presets.map((preset) => {
        const previewState: AnimatedBackgroundState = {
          ...presetToState(preset),
          particleCount: Math.min(5, preset.particleCount),
          blur: Math.min(preset.blur, 26),
        };
        const particles = generateParticleData(previewState);
        const css = generateCss(previewState, particles, { paused: true })
          .replaceAll(".darma-animated-bg", `.preset-preview-${preset.id}`)
          .replace("min-height: 420px;", "min-height: 0; height: 100%;");
        const isActive = activeId === preset.id;

        return (
          <button
            type="button"
            key={preset.id}
            onClick={() => onSelect(preset)}
            className={`group shrink-0 overflow-hidden rounded-2xl border bg-white p-2 text-left transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-950 ${
              compact ? "w-[300px]" : ""
            } ${
              isActive
                ? "border-fuchsia-400 shadow-md ring-2 ring-fuchsia-200 dark:ring-fuchsia-500/30"
                : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <style>{css}</style>
            <div
              className={`preset-preview-${preset.id} relative h-24 min-h-0 rounded-xl`}
            >
              {particles.map((particle) => (
                <span key={particle.id} />
              ))}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
            <div className="p-2">
              <div className="flex flex-wrap gap-1">
                {preset.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-2 font-semibold text-slate-900 dark:text-slate-100">
                {preset.name}
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                {preset.description}
              </p>
              {preset.bestFor?.[0] && (
                <p className="mt-2 text-[11px] font-semibold text-fuchsia-600 dark:text-fuchsia-300">
                  Best for: {preset.bestFor[0]}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
