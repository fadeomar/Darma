"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Download, RefreshCcw, Shuffle } from "lucide-react";
import { Badge, Button, CopyButton, Field, Input, Select } from "@/components/ui";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import {
  CodeOutputPanel,
  ColorField,
  ControlGrid,
  ControlSection,
  NumberField,
  PresetGallery,
  PreviewToolbar,
  SegmentedControl,
  SliderNumberField,
  ToolControlPanel,
  WarningPanel,
  type CodeOutputTab,
  type WarningMessage,
} from "@/features/tools/components";
import {
  createDefaultGlassmorphismState,
  generateGlassCss,
  generateGlassCssVariables,
  generateGlassHtml,
  generateGlassJsx,
  generateGlassReactStyle,
  generateGlassTokenJson,
  generateSolidFallbackCss,
  generateTailwindStarter,
  getGlassPreviewStyle,
  getGlassProductionMetrics,
  getScenePreviewStyle,
  randomizeGlassState,
  validateGlassmorphismState,
} from "./glass";
import { GLASS_PRESETS } from "./presets";
import type { GlassComponentType, GlassmorphismState, GlassScenePreset, ShadowPreset } from "./types";

const componentTypes: GlassComponentType[] = ["card", "navbar", "modal", "sidebar", "button", "pricing-card", "login-panel", "toast", "hero-overlay", "dashboard-widget"];
const scenes: GlassScenePreset[] = ["aurora", "mesh", "dark-dashboard", "light-pastel", "neon", "abstract-blobs", "grid", "custom-gradient"];
const shadows: ShadowPreset[] = ["none", "soft", "medium", "strong", "custom"];

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function labelize(value: string) {
  return value.replace(/-/g, " ");
}

function toneClass(tone: "good" | "warning" | "danger" | "neutral") {
  if (tone === "good") return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100";
  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100";
  return "border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-text)]";
}

function MetricCard({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: "good" | "warning" | "danger" | "neutral" }) {
  return (
    <div className={`min-w-0 rounded-[var(--radius-md)] border px-3 py-2.5 shadow-[var(--shadow-xs)] ${toneClass(tone)}`}>
      <p className="font-mono text-xs font-black uppercase tracking-[0.12em] opacity-70">{label}</p>
      <p className="mt-1 truncate text-sm font-black">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-4 opacity-75">{detail}</p>
    </div>
  );
}

function CheckboxRow({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm text-[var(--color-text)]">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
    </label>
  );
}

export default function GlassmorphismGeneratorClient() {
  const [state, setState] = useState<GlassmorphismState>(() => createDefaultGlassmorphismState());

  const css = useMemo(() => generateGlassCss(state), [state]);
  const html = useMemo(() => generateGlassHtml(state), [state]);
  const jsx = useMemo(() => generateGlassJsx(state), [state]);
  const tailwind = useMemo(() => generateTailwindStarter(state), [state]);
  const cssVariables = useMemo(() => generateGlassCssVariables(state), [state]);
  const tokenJson = useMemo(() => generateGlassTokenJson(state), [state]);
  const solidFallback = useMemo(() => generateSolidFallbackCss(state), [state]);
  const reactStyle = useMemo(() => generateGlassReactStyle(state), [state]);
  const sceneStyle = useMemo(() => getScenePreviewStyle(state), [state]);
  const glassStyle = useMemo(() => getGlassPreviewStyle(state), [state]);
  const metrics = useMemo(() => getGlassProductionMetrics(state), [state]);
  const warnings = useMemo<WarningMessage[]>(
    () =>
      validateGlassmorphismState(state).map((message, index) => ({
        id: `${message.field ?? "glass"}-${index}`,
        severity: message.type === "error" ? "danger" : message.type,
        message: message.message,
      })),
    [state],
  );

  const tabs = useMemo<CodeOutputTab[]>(
    () => [
      { id: "css", label: "CSS", language: "css", filename: "glassmorphism.css", code: css },
      { id: "vars", label: "CSS vars", language: "css", filename: "glassmorphism-vars.css", code: cssVariables },
      { id: "fallback", label: "Fallback", language: "css", filename: "glassmorphism-fallback.css", code: solidFallback },
      { id: "html", label: "HTML", language: "html", filename: "glassmorphism.html", code: html },
      { id: "jsx", label: "React JSX", language: "tsx", filename: "GlassCard.tsx", code: jsx },
      { id: "react-style", label: "React style", language: "tsx", filename: "glass-style.ts", code: reactStyle },
      { id: "tailwind", label: "Tailwind", language: "txt", filename: "glassmorphism-tailwind.txt", code: tailwind },
      { id: "tokens", label: "Tokens", language: "json", filename: "glassmorphism.tokens.json", code: tokenJson },
    ],
    [css, cssVariables, html, jsx, reactStyle, solidFallback, tailwind, tokenJson],
  );

  function patchState(patch: Partial<GlassmorphismState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function patchEffect(patch: Partial<GlassmorphismState["effect"]>) {
    setState((current) => ({ ...current, effect: { ...current.effect, ...patch } }));
  }

  function patchShape(patch: Partial<GlassmorphismState["shape"]>) {
    setState((current) => ({ ...current, shape: { ...current.shape, ...patch } }));
  }

  function patchScene(patch: Partial<GlassmorphismState["scene"]>) {
    setState((current) => ({ ...current, scene: { ...current.scene, ...patch } }));
  }

  function patchContent(patch: Partial<GlassmorphismState["content"]>) {
    setState((current) => ({ ...current, content: { ...current.content, ...patch } }));
  }

  function patchFallback(patch: Partial<GlassmorphismState["fallback"]>) {
    setState((current) => ({ ...current, fallback: { ...current.fallback, ...patch } }));
  }

  function patchExport(patch: Partial<GlassmorphismState["exportOptions"]>) {
    setState((current) => ({ ...current, exportOptions: { ...current.exportOptions, ...patch } }));
  }

  const previewSlot = (
    <div className="space-y-4">
      <style>{`.darma-glass-scene-animated{animation:darma-glass-shift 12s ease-in-out infinite alternate;background-size:160% 160%;}@keyframes darma-glass-shift{from{background-position:0% 50%;}to{background-position:100% 50%;}}`}</style>
      <PreviewToolbar
        title="Live glass preview"
        description="Shape the frosted surface visually first. Production checks and implementation code stay available when you need them."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => patchState({ showBeforeAfter: !state.showBeforeAfter })}>{state.showBeforeAfter ? "Show blur" : "Compare no blur"}</Button>
            <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => downloadText("glassmorphism.css", css)}>Download CSS</Button>
          </div>
        }
      />

      <div className={`relative min-h-[500px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 sm:p-6 ${state.scene.animated ? "darma-glass-scene-animated" : ""}`} style={sceneStyle}>
        <div className="absolute left-10 top-10 h-24 w-24 rounded-full bg-white/30 blur-2xl" />
        <div className="absolute bottom-16 right-12 h-32 w-32 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="relative flex min-h-[430px] items-center justify-center">
          <article className="relative overflow-hidden" style={glassStyle as CSSProperties}>
            {state.scene.noiseEnabled ? <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgb(255_255_255_/_0.55)_1px,transparent_1px)] [background-size:7px_7px]" /> : null}
            <div className="relative z-10">
              <p style={{ color: state.content.accentColor }} className="mb-3 text-xs font-black uppercase tracking-[0.22em]">{state.content.eyebrow}</p>
              <h3 className="text-3xl font-black leading-tight">{state.content.title}</h3>
              <p className="mt-4 text-sm leading-7 opacity-85">{state.content.description}</p>
              <span style={{ color: state.content.accentColor }} className="mt-6 inline-flex text-sm font-black">{state.content.actionLabel} →</span>
            </div>
          </article>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 rounded-[var(--radius-md)] border border-white/50 bg-white/80 p-3 text-xs font-bold text-[var(--color-text-secondary)] shadow-sm backdrop-blur dark:border-[var(--color-code-border)] dark:bg-[var(--color-code-bg)]/75 dark:text-[var(--color-text-secondary)]">
          <Badge variant="soft">{labelize(state.scene.preset)}</Badge>
          <Badge variant="soft">blur {state.effect.blur}px</Badge>
          <Badge variant="soft">opacity {state.effect.opacity.toFixed(2)}</Badge>
          <Badge variant="soft">{state.showBeforeAfter ? "no blur comparison" : metrics.filterLabel}</Badge>
        </div>
      </div>

      <section className="space-y-2">
        <div>
          <p className="text-sm font-black text-[var(--color-text-primary)]">Quick styles</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Start with a visual glass recipe, then fine-tune blur and transparency.</p>
        </div>
        <PresetGallery
          presets={GLASS_PRESETS}
          selectedId={state.presetId}
          onSelect={(_, preset) => setState(preset.state)}
          getId={(preset) => preset.id}
          getLabel={(preset) => preset.name}
          getDescription={(preset) => preset.description}
          renderPreview={(preset) => (
            <div className="flex h-20 items-center justify-center overflow-hidden rounded-[var(--radius-md)]" style={getScenePreviewStyle(preset.state)}>
              <div className="h-10 w-16" style={{ ...(getGlassPreviewStyle(preset.state) as CSSProperties), width: 64, minHeight: 40, padding: 0 }} />
            </div>
          )}
          initialVisibleCount={6}
          showMoreLabel="Show all glass use cases"
          showLessLabel="Show fewer glass use cases"
          className="sm:grid-cols-2 xl:grid-cols-4"
        />
      </section>

      <details className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-[var(--color-text-primary)]">Output details</summary>
        <div className="space-y-3 border-t border-[var(--color-border)] p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Readability" value={metrics.readability.label} detail={metrics.readability.detail} tone={metrics.readability.tone} />
            <MetricCard label="Performance" value={metrics.performance.label} detail={metrics.performance.detail} tone={metrics.performance.tone} />
            <MetricCard label="Fallback" value={metrics.fallback.label} detail={metrics.fallback.detail} tone={metrics.fallback.tone} />
            <MetricCard label="CSS size" value={metrics.cssSize.label} detail={metrics.cssSize.detail} tone="neutral" />
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {metrics.checks.map((check) => (
              <div key={check.label} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3 shadow-[var(--shadow-xs)]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-[var(--color-text)]">{check.label}</p>
                  <Badge variant={check.tone === "good" ? "success" : check.tone === "danger" ? "danger" : "soft"}>{check.status}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">{check.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
  const controlsSlot = (
    <ToolControlPanel title="Glass settings" description="Tune the visible frosted-glass effect first; advanced component, content, and fallback options stay out of the way." badge={<Badge variant="soft">Live</Badge>}>
      <ControlSection title="Glass effect">
        <SliderNumberField label="Blur" value={state.effect.blur} min={0} max={60} unit="px" onChange={(value) => patchEffect({ blur: value })} />
        <SliderNumberField label="Opacity" value={state.effect.opacity} min={0} max={1} step={0.01} onChange={(value) => patchEffect({ opacity: value })} />
      </ControlSection>

      <ControlSection title="Glass surface">
        <ControlGrid columns={2}>
          <ColorField label="Tint" value={state.effect.tintColor} onChange={(value) => patchEffect({ tintColor: value })} />
          <ColorField label="Border" value={state.effect.borderColor} onChange={(value) => patchEffect({ borderColor: value })} />
          <SliderNumberField label="Border opacity" value={state.effect.borderOpacity} min={0} max={1} step={0.01} onChange={(value) => patchEffect({ borderOpacity: value })} />
          <NumberField label="Border width" value={state.effect.borderWidth} min={0} max={12} unit="px" onChange={(value) => patchEffect({ borderWidth: value })} />
          <SliderNumberField label="Radius" value={state.shape.borderRadius} min={0} max={96} unit="px" onChange={(value) => patchShape({ borderRadius: value })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Background">
        <Field label="Scene" density="compact">
          <Select size="sm" value={state.scene.preset} onChange={(event) => patchScene({ preset: event.target.value as GlassScenePreset })}>
            {scenes.map((scene) => <option key={scene} value={scene}>{labelize(scene)}</option>)}
          </Select>
        </Field>
        <ControlGrid columns={3}>
          <ColorField label="Color A" value={state.scene.colorA} onChange={(value) => patchScene({ colorA: value })} />
          <ColorField label="Color B" value={state.scene.colorB} onChange={(value) => patchScene({ colorB: value })} />
          <ColorField label="Color C" value={state.scene.colorC} onChange={(value) => patchScene({ colorC: value })} />
        </ControlGrid>
      </ControlSection>

      <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-black text-[var(--color-text-primary)]">Advanced glass filters</summary>
        <div className="space-y-3 border-t border-[var(--color-border)] p-3">
          <ControlGrid columns={2}>
            <SliderNumberField label="Saturation" value={state.effect.saturation} min={80} max={260} unit="%" onChange={(value) => patchEffect({ saturation: value })} />
            <SliderNumberField label="Brightness" value={state.effect.brightness} min={70} max={140} unit="%" onChange={(value) => patchEffect({ brightness: value })} />
          </ControlGrid>
          <SliderNumberField label="Contrast" value={state.effect.contrast} min={80} max={150} unit="%" onChange={(value) => patchEffect({ contrast: value })} />
          <SegmentedControl ariaLabel="Shadow preset" value={state.effect.shadowPreset} onChange={(value) => patchEffect({ shadowPreset: value })} options={shadows.map((shadow) => ({ value: shadow, label: labelize(shadow) }))} />
          {state.effect.shadowPreset === "custom" ? (
            <Field label="Custom shadow" density="compact">
              <Input size="sm" value={state.effect.customShadow} onChange={(event) => patchEffect({ customShadow: event.target.value })} />
            </Field>
          ) : null}
        </div>
      </details>

      <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-black text-[var(--color-text-primary)]">Component & content</summary>
        <div className="space-y-3 border-t border-[var(--color-border)] p-3">
          <Field label="Component type" density="compact">
            <Select size="sm" value={state.shape.componentType} onChange={(event) => patchShape({ componentType: event.target.value as GlassComponentType })}>
              {componentTypes.map((type) => <option key={type} value={type}>{labelize(type)}</option>)}
            </Select>
          </Field>
          <ControlGrid columns={2}>
            <NumberField label="Width" value={state.shape.width} min={160} max={900} unit="px" onChange={(value) => patchShape({ width: value })} />
            <NumberField label="Height" value={state.shape.minHeight} min={80} max={720} unit="px" onChange={(value) => patchShape({ minHeight: value })} />
            <NumberField label="Padding" value={state.shape.padding} min={8} max={96} unit="px" onChange={(value) => patchShape({ padding: value })} />
          </ControlGrid>
          <ControlGrid columns={2}>
            <ColorField label="Text" value={state.content.textColor} onChange={(value) => patchContent({ textColor: value })} />
            <ColorField label="Accent" value={state.content.accentColor} onChange={(value) => patchContent({ accentColor: value })} />
          </ControlGrid>
          <Field label="Title" density="compact"><Input size="sm" value={state.content.title} onChange={(event) => patchContent({ title: event.target.value })} /></Field>
          <Field label="Eyebrow" density="compact"><Input size="sm" value={state.content.eyebrow} onChange={(event) => patchContent({ eyebrow: event.target.value })} /></Field>
          <Field label="Action label" density="compact"><Input size="sm" value={state.content.actionLabel} onChange={(event) => patchContent({ actionLabel: event.target.value })} /></Field>
        </div>
      </details>

      <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-black text-[var(--color-text-primary)]">Scene & export options</summary>
        <div className="space-y-3 border-t border-[var(--color-border)] p-3">
          <ControlGrid columns={2}>
            <CheckboxRow label="Animate scene" checked={state.scene.animated} onChange={(checked) => patchScene({ animated: checked })} />
            <CheckboxRow label="Noise texture" checked={state.scene.noiseEnabled} onChange={(checked) => patchScene({ noiseEnabled: checked })} />
          </ControlGrid>
          <SliderNumberField label="Noise opacity" value={state.scene.noiseOpacity} min={0} max={0.2} step={0.01} disabled={!state.scene.noiseEnabled} onChange={(value) => patchScene({ noiseOpacity: value })} />
          <Field label="CSS class" density="compact"><Input size="sm" value={state.exportOptions.className} onChange={(event) => patchExport({ className: event.target.value })} /></Field>
          <ControlGrid columns={2}>
            <CheckboxRow label="WebKit prefix" checked={state.fallback.includeWebkitPrefix} onChange={(checked) => patchFallback({ includeWebkitPrefix: checked })} />
            <CheckboxRow label="Supports fallback" checked={state.fallback.includeSupportsFallback} onChange={(checked) => patchFallback({ includeSupportsFallback: checked })} />
            <CheckboxRow label="Reduced transparency" checked={state.fallback.includeReducedTransparency} onChange={(checked) => patchFallback({ includeReducedTransparency: checked })} />
            <CheckboxRow label="Reduced motion" checked={state.fallback.includeReducedMotion} onChange={(checked) => patchFallback({ includeReducedMotion: checked })} />
          </ControlGrid>
        </div>
      </details>
    </ToolControlPanel>
  );

  return (
    <ToolLayoutVisualGenerator
      controlsPosition="right"
      previewSlot={previewSlot}
      controlsSlot={controlsSlot}
      actionsPlacement="under-preview"
      mobileCodeAfterControls
      actionsSlot={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" leftIcon={<Shuffle className="h-4 w-4" />} onClick={() => setState((current) => randomizeGlassState(current))}>Randomize</Button>
          <Button variant="secondary" leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={() => setState(createDefaultGlassmorphismState())}>Reset</Button>
          <CopyButton text={css}>Copy CSS</CopyButton>
        </div>
      }
      codeSlot={
        <details className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-[var(--color-text-primary)]">Developer handoff & diagnostics</summary>
          <div className="space-y-4 border-t border-[var(--color-border)] p-4">
            <WarningPanel title="Readability and production notes" messages={warnings} />
            <CodeOutputPanel title="Generated glass code" description="Copy production CSS, fallbacks, HTML, React, Tailwind, or design tokens." tabs={tabs} defaultTab="css" onDownload={(tab) => downloadText(tab.filename ?? `${tab.id}.txt`, tab.code)} />
            <div className="flex flex-wrap gap-2">
              <CopyButton text={tokenJson} variant="soft">Copy tokens</CopyButton>
            </div>
          </div>
        </details>
      }
    />
  );
}
