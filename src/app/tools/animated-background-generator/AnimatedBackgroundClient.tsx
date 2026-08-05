"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui";
import type { AnimatedBackgroundState, BackgroundPreset } from "@/types/animatedBackgroundTypes";
import { presets, presetToState, getPreset } from "./lib/presets";
import { generateParticleData } from "./lib/generateParticleData";
import { generateCss } from "./lib/generateCss";
import { generateHtml } from "./lib/generateHtml";
import { buildAnimatedBackgroundAudit, buildAnimatedBackgroundSummary } from "./lib/studio";
import PresetGallery from "./components/PresetGallery";
import PreviewPanel from "./components/PreviewPanel";
import ControlPanel from "./components/ControlPanel";
import CodeOutput from "./components/CodeOutput";
import ProductionPanel from "./components/ProductionPanel";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";

const initialState = presetToState(presets[0]);

function randomSeed() {
  return Math.floor(Math.random() * 2_000_000) + 1;
}

function SummaryCards({ cards }: { cards: ReturnType<typeof buildAnimatedBackgroundSummary> }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Animated background summary">
      {cards.map((card) => (
        <div key={card.label} className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-3 shadow-[var(--shadow-xs)]">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">{card.label}</p>
          <p className="mt-1 truncate text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{card.value}</p>
          <p className="mt-2 truncate text-xs text-[var(--color-text-tertiary)]" title={card.detail}>{card.detail}</p>
        </div>
      ))}
    </section>
  );
}

export default function AnimatedBackgroundClient() {
  const [state, setState] = useState<AnimatedBackgroundState>(initialState);

  const particles = useMemo(() => generateParticleData(state), [state]);

  const css = useMemo(() => generateCss(state, particles), [state, particles]);
  const html = useMemo(() => generateHtml(particles), [particles]);
  const auditChecks = useMemo(() => buildAnimatedBackgroundAudit(state, css, html), [state, css, html]);
  const summaryCards = useMemo(() => buildAnimatedBackgroundSummary(state, css, html, auditChecks), [state, css, html, auditChecks]);

  const handleSelect = (preset: BackgroundPreset) => setState(presetToState(preset));
  const handleReset = () => setState(presetToState(getPreset(state.presetId)));
  const handleRandomize = () => setState((current) => ({ ...current, seed: randomSeed() }));
  const handleSimilar = () => setState((current) => ({ ...current, seed: current.seed + 137 }));

  return (
    <ToolLayoutVisualGenerator
      previewSlot={
        <div className="space-y-4">
          <SummaryCards cards={summaryCards} />
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
      codeSlot={
        <div className="space-y-5">
          <CodeOutput html={html} css={css} state={state} particleCount={particles.length} />
          <ProductionPanel state={state} css={css} html={html} checks={auditChecks} onImport={setState} />
        </div>
      }
    />
  );
}
