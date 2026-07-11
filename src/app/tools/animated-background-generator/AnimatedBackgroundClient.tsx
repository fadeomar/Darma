"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui";
import type { AnimatedBackgroundState, BackgroundPreset } from "@/types/animatedBackgroundTypes";
import { presets, presetToState, getPreset } from "./lib/presets";
import { generateParticleData } from "./lib/generateParticleData";
import { generateCss } from "./lib/generateCss";
import { generateHtml } from "./lib/generateHtml";
import PresetGallery from "./components/PresetGallery";
import PreviewPanel from "./components/PreviewPanel";
import ControlPanel from "./components/ControlPanel";
import CodeOutput from "./components/CodeOutput";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";

const initialState = presetToState(presets[0]);

function randomSeed() {
  return Math.floor(Math.random() * 2_000_000) + 1;
}

function getPerformanceLevel(state: AnimatedBackgroundState) {
  const score = state.particleCount * 1.2 + state.blur * 0.22 + state.glow * 0.12 + state.maxSize * 0.025;
  if (score > 92) return { label: "Heavy", variant: "warning" as const, detail: "Use carefully above-the-fold" };
  if (score > 56) return { label: "Medium", variant: "info" as const, detail: "Good for hero sections" };
  return { label: "Light", variant: "success" as const, detail: "Safe for most layouts" };
}

function getMotionLevel(state: AnimatedBackgroundState) {
  if (state.isPaused) return { label: "Paused", variant: "warning" as const, detail: "Preview is frozen" };
  if (state.speed >= 1.15 || state.intensity >= 1) return { label: "Active", variant: "warning" as const, detail: "High visual movement" };
  if (state.speed <= 0.55 && state.intensity <= 0.55) return { label: "Calm", variant: "success" as const, detail: "Subtle background motion" };
  return { label: "Balanced", variant: "info" as const, detail: "Visible but controlled" };
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  return `${(value / 1024).toFixed(1)} KB`;
}

function SummaryCards({ state, css }: { state: AnimatedBackgroundState; css: string }) {
  const performance = getPerformanceLevel(state);
  const motion = getMotionLevel(state);
  const cssSize = formatBytes(css.length);

  const cards = [
    { label: "Motion", value: motion.label, detail: motion.detail, badge: <Badge variant={motion.variant}>{motion.label}</Badge> },
    { label: "Performance", value: performance.label, detail: performance.detail, badge: <Badge variant={performance.variant}>{performance.label}</Badge> },
    { label: "Elements", value: `${state.particleCount}`, detail: `${state.minSize}-${state.maxSize}px objects`, badge: <Badge variant="outline">{state.shape}</Badge> },
    { label: "Export", value: cssSize, detail: "CSS includes reduced-motion", badge: <Badge variant="success">Ready</Badge> },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-3 shadow-[var(--shadow-xs)]">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">{card.label}</p>
              <p className="mt-1 truncate text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{card.value}</p>
            </div>
            {card.badge}
          </div>
          <p className="mt-2 truncate text-xs text-[var(--color-text-tertiary)]" title={card.detail}>{card.detail}</p>
        </div>
      ))}
    </div>
  );
}

export default function AnimatedBackgroundClient() {
  const [state, setState] = useState<AnimatedBackgroundState>(initialState);

  const particles = useMemo(
    () => generateParticleData(state),
    [
      state.seed,
      state.particleCount,
      state.minSize,
      state.maxSize,
      state.speed,
      state.intensity,
      state.opacity,
      state.colors,
    ],
  );

  // Exported code always uses the running (non-paused) animation.
  const css = useMemo(() => generateCss(state, particles), [state, particles]);
  const html = useMemo(() => generateHtml(particles), [particles]);

  const handleSelect = (preset: BackgroundPreset) => setState(presetToState(preset));
  const handleReset = () => setState(presetToState(getPreset(state.presetId)));
  const handleRandomize = () => setState((current) => ({ ...current, seed: randomSeed() }));
  const handleSimilar = () => setState((current) => ({ ...current, seed: current.seed + 137 }));

  return (
    <ToolLayoutVisualGenerator
      previewSlot={
        <div className="space-y-4">
          <SummaryCards state={state} css={css} />
          <PreviewPanel state={state} particles={particles} />
        </div>
      }
      controlsSlot={
        <ControlPanel
          state={state}
          setState={setState}
          onRandomize={handleRandomize}
          onReset={handleReset}
          onSimilar={handleSimilar}
        />
      }
      presetsSlot={
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Production presets</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-tertiary)]">Start from a proven background style, then tune motion and export clean code.</p>
            </div>
            <Badge variant="outline">{presets.length} presets</Badge>
          </div>
          <PresetGallery presets={presets} activeId={state.presetId} onSelect={handleSelect} />
        </section>
      }
      codeSlot={<CodeOutput html={html} css={css} state={state} particleCount={particles.length} />}
    />
  );
}
