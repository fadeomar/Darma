"use client";

import { Check } from "lucide-react";
import type { AnimatedBackgroundState, BackgroundPreset } from "@/types/animatedBackgroundTypes";
import { generateCss } from "../lib/generateCss";
import { generateParticleData } from "../lib/generateParticleData";
import { presetToState } from "../lib/presets";

interface PresetGalleryProps {
  presets: BackgroundPreset[];
  activeId: string;
  onSelect: (preset: BackgroundPreset) => void;
  compact?: boolean;
}

export default function PresetGallery({ presets, activeId, onSelect, compact = false }: PresetGalleryProps) {
  return (
    <div className={compact ? "darma-scroll-strip flex snap-x gap-3 overflow-x-auto pb-2" : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"}>
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
            aria-pressed={isActive}
            onClick={() => onSelect(preset)}
            className={`group relative shrink-0 snap-start overflow-hidden rounded-2xl border bg-[var(--color-surface-base)] p-2 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${
              compact ? "w-[230px]" : ""
            } ${
              isActive
                ? "border-[var(--color-primary)] shadow-[var(--shadow-md)] ring-2 ring-[var(--color-primary-soft)]"
                : "border-[var(--color-border-default)]"
            }`}
          >
            <style>{css}</style>
            <div className={`preset-preview-${preset.id} relative min-h-0 rounded-xl ${compact ? "h-20" : "h-24"}`}>
              {particles.map((particle) => (
                <span key={particle.id} />
              ))}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/55 to-transparent" />
              {isActive ? (
                <span className="absolute right-2 top-2 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
              ) : null}
            </div>
            <div className={compact ? "px-1 pb-1 pt-2" : "p-2"}>
              <div className="truncate text-sm font-bold text-[var(--color-text-primary)]">{preset.name}</div>
              {compact ? (
                <p className="mt-1 truncate text-xs text-[var(--color-text-tertiary)]">{preset.bestFor?.[0] ?? preset.tags.join(" · ")}</p>
              ) : (
                <>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {preset.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--color-control-track)] px-2 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">
                    {preset.description}
                  </p>
                  {preset.bestFor?.[0] ? (
                    <p className="mt-2 text-xs font-semibold text-[var(--color-primary-text-strong)]">
                      Best for: {preset.bestFor[0]}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
