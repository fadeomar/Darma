"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowDown, CircleCheck, LibraryBig, SlidersHorizontal, Sparkles } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type { AnimatedBackgroundState, BackgroundPreset } from "@/types/animatedBackgroundTypes";
import { presets, presetToState, getPreset } from "./lib/presets";
import { generateParticleData } from "./lib/generateParticleData";
import { generateCss } from "./lib/generateCss";
import { generateHtml } from "./lib/generateHtml";
import { buildAnimatedBackgroundAudit, buildAnimatedBackgroundSummary } from "./lib/studio";
import PresetGallery from "./components/PresetGallery";
import PresetBrowserDrawer from "./components/PresetBrowserDrawer";
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
  const openTarget = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => target.focus({ preventScroll: true }), 450);
  };

  return (
    <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4" aria-label="Animated background summary">
      {cards.map((card) => {
        const className = "group min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4 text-left shadow-[var(--shadow-xs)] transition";
        const content = (
          <>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">{card.label}</p>
            <p className="mt-2 text-xl font-black tracking-[-0.025em] text-[var(--color-text-primary)]">{card.value}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]" title={card.detail}>{card.detail}</p>
            {card.actionLabel ? <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-[var(--color-primary)]">{card.actionLabel}<ArrowDown className="h-3.5 w-3.5 transition group-hover:translate-y-0.5" aria-hidden /></span> : null}
          </>
        );

        return card.targetId ? (
          <button
            type="button"
            key={card.label}
            onClick={() => openTarget(card.targetId!)}
            className={`${className} hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]`}
          >
            {content}
          </button>
        ) : (
          <div key={card.label} className={className}>{content}</div>
        );
      })}
    </section>
  );
}

function WorkflowGuide() {
  const steps = [
    { number: "01", label: "Choose a preset", icon: Sparkles },
    { number: "02", label: "Customize", icon: SlidersHorizontal },
    { number: "03", label: "Review and export", icon: CircleCheck },
  ];

  return (
    <ol className="grid gap-2 sm:grid-cols-3" aria-label="Animated background workflow">
      {steps.map((step) => {
        const Icon = step.icon;
        return (
          <li key={step.number} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-mono text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Step {step.number}</span>
              <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{step.label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function AnimatedBackgroundClient() {
  const [state, setState] = useState<AnimatedBackgroundState>(initialState);
  const [presetBrowserOpen, setPresetBrowserOpen] = useState(false);

  const particles = useMemo(() => generateParticleData(state), [state]);
  const css = useMemo(() => generateCss(state, particles), [state, particles]);
  const html = useMemo(() => generateHtml(particles), [particles]);
  const auditChecks = useMemo(() => buildAnimatedBackgroundAudit(state, css, html), [state, css, html]);
  const summaryCards = useMemo(() => buildAnimatedBackgroundSummary(state, css, html, auditChecks), [state, css, html, auditChecks]);

  const handleSelect = (preset: BackgroundPreset) => setState(presetToState(preset));
  const closePresetBrowser = useCallback(() => setPresetBrowserOpen(false), []);
  const handleReset = () => setState(presetToState(getPreset(state.presetId)));
  const handleRandomize = () => setState((current) => ({ ...current, seed: randomSeed() }));
  const handleSimilar = () => setState((current) => ({ ...current, seed: current.seed + 137 }));

  return (
    <>
    <ToolLayoutVisualGenerator
      presetsPlacement="before-grid"
      controlsPosition="left"
      stickyPreview
      wrapPreview={false}
      presetsSlot={
        <section className="space-y-4 rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)] sm:p-5" aria-labelledby="animated-background-presets-heading">
          <WorkflowGuide />
          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="soft">Start here</Badge>
                <Badge variant="outline">{presets.length} presets</Badge>
              </div>
              <h2 id="animated-background-presets-heading" className="mt-2 text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Choose a starting preset</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-tertiary)]">Pick a proven style first, then tune its colors, motion, and export settings.</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<LibraryBig className="h-4 w-4" aria-hidden />}
              onClick={() => setPresetBrowserOpen(true)}
              aria-haspopup="dialog"
            >
              Browse all {presets.length}
            </Button>
          </div>
          <PresetGallery
            presets={presets.slice(0, 6)}
            activeId={state.presetId}
            onSelect={handleSelect}
            compact
          />
        </section>
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
      previewSlot={
        <section className="space-y-4 rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)] sm:p-5" aria-labelledby="animated-background-preview-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="animated-background-preview-heading" className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Live preview</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-tertiary)]">Review the selected background behind real content while you adjust the controls.</p>
            </div>
            <Badge variant={state.isPaused ? "warning" : "success"}>{state.isPaused ? "Preview paused" : "Updates instantly"}</Badge>
          </div>
          <SummaryCards cards={summaryCards} />
          <PreviewPanel state={state} particles={particles} />
        </section>
      }
      codeSlot={
        <div className="space-y-5">
          <CodeOutput html={html} css={css} state={state} particleCount={particles.length} />
          <ProductionPanel state={state} css={css} html={html} checks={auditChecks} onImport={setState} onUpdate={(patch) => setState((current) => ({ ...current, ...patch }))} />
        </div>
      }
    />
    <PresetBrowserDrawer
      open={presetBrowserOpen}
      presets={presets}
      activeId={state.presetId}
      onClose={closePresetBrowser}
      onSelect={handleSelect}
    />
    </>
  );
}
