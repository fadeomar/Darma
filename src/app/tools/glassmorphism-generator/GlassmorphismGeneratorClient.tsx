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
  generateGlassHtml,
  generateGlassJsx,
  generateTailwindStarter,
  getGlassPreviewStyle,
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
  const sceneStyle = useMemo(() => getScenePreviewStyle(state), [state]);
  const glassStyle = useMemo(() => getGlassPreviewStyle(state), [state]);
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
      { id: "html", label: "HTML", language: "html", filename: "glassmorphism.html", code: html },
      { id: "jsx", label: "React JSX", language: "tsx", filename: "GlassCard.tsx", code: jsx },
      { id: "tailwind", label: "Tailwind-style", language: "txt", filename: "glassmorphism-tailwind.txt", code: tailwind },
    ],
    [css, html, jsx, tailwind],
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
        title="Glass preview"
        description="Live backdrop-filter preview with scene background."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => patchState({ showBeforeAfter: !state.showBeforeAfter })}>{state.showBeforeAfter ? "Show blur" : "Compare no blur"}</Button>
            <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => downloadText("glassmorphism.css", css)}>Download</Button>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <PresetGallery
          presets={GLASS_PRESETS}
          selectedId={state.presetId}
          onSelect={(_, preset) => setState(preset.state)}
          getId={(preset) => preset.id}
          getLabel={(preset) => preset.name}
          getDescription={(preset) => preset.description}
          renderPreview={(preset) => <div className="h-14 rounded-[var(--radius-md)]" style={getScenePreviewStyle(preset.state)} />}
          className="lg:grid-cols-1"
        />
        <div className={`relative min-h-[520px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6 ${state.scene.animated ? "darma-glass-scene-animated" : ""}`} style={sceneStyle}>
          <div className="absolute left-10 top-10 h-24 w-24 rounded-full bg-white/30 blur-2xl" />
          <div className="absolute bottom-16 right-12 h-32 w-32 rounded-full bg-cyan-300/30 blur-3xl" />
          <div className="relative flex min-h-[460px] items-center justify-center">
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
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-white/50 bg-white/80 p-3 text-xs font-bold text-[var(--color-text-secondary)] shadow-sm backdrop-blur dark:border-[var(--color-code-border)] dark:bg-[var(--color-code-bg)]/75 dark:text-[var(--color-text-secondary)]">
            <span>{labelize(state.scene.preset)}</span>
            <span>blur {state.effect.blur}px</span>
            <span>opacity {state.effect.opacity.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const controlsSlot = (
    <ToolControlPanel title="Glass settings" description="Compact controls for the frosted glass effect." badge={<Badge variant="soft">Live</Badge>}>
      <ControlSection title="Preset and component">
        <Field label="Component type" density="compact">
          <Select size="sm" value={state.shape.componentType} onChange={(event) => patchShape({ componentType: event.target.value as GlassComponentType })}>
            {componentTypes.map((type) => <option key={type} value={type}>{labelize(type)}</option>)}
          </Select>
        </Field>
        <ControlGrid columns={2}>
          <NumberField label="Width" value={state.shape.width} min={160} max={900} unit="px" onChange={(value) => patchShape({ width: value })} />
          <NumberField label="Height" value={state.shape.minHeight} min={80} max={720} unit="px" onChange={(value) => patchShape({ minHeight: value })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Glass effect">
        <SliderNumberField label="Blur" value={state.effect.blur} min={0} max={60} unit="px" onChange={(value) => patchEffect({ blur: value })} />
        <SliderNumberField label="Opacity" value={state.effect.opacity} min={0} max={1} step={0.01} onChange={(value) => patchEffect({ opacity: value })} />
        <ControlGrid columns={2}>
          <SliderNumberField label="Saturation" value={state.effect.saturation} min={80} max={260} unit="%" onChange={(value) => patchEffect({ saturation: value })} />
          <SliderNumberField label="Radius" value={state.shape.borderRadius} min={0} max={80} unit="px" onChange={(value) => patchShape({ borderRadius: value })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Colors and border">
        <ColorField label="Tint" value={state.effect.tintColor} onChange={(value) => patchEffect({ tintColor: value })} />
        <ColorField label="Text" value={state.content.textColor} onChange={(value) => patchContent({ textColor: value })} />
        <ControlGrid columns={2}>
          <SliderNumberField label="Border opacity" value={state.effect.borderOpacity} min={0} max={1} step={0.01} onChange={(value) => patchEffect({ borderOpacity: value })} />
          <NumberField label="Border" value={state.effect.borderWidth} min={0} max={12} unit="px" onChange={(value) => patchEffect({ borderWidth: value })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Scene">
        <Field label="Background scene" density="compact">
          <Select size="sm" value={state.scene.preset} onChange={(event) => patchScene({ preset: event.target.value as GlassScenePreset })}>
            {scenes.map((scene) => <option key={scene} value={scene}>{labelize(scene)}</option>)}
          </Select>
        </Field>
        <ControlGrid columns={3}>
          <ColorField label="Color A" value={state.scene.colorA} onChange={(value) => patchScene({ colorA: value })} />
          <ColorField label="Color B" value={state.scene.colorB} onChange={(value) => patchScene({ colorB: value })} />
          <ColorField label="Color C" value={state.scene.colorC} onChange={(value) => patchScene({ colorC: value })} />
        </ControlGrid>
        <ControlGrid columns={2}>
          <CheckboxRow label="Animate scene" checked={state.scene.animated} onChange={(checked) => patchScene({ animated: checked })} />
          <CheckboxRow label="Noise texture" checked={state.scene.noiseEnabled} onChange={(checked) => patchScene({ noiseEnabled: checked })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Shadow and export">
        <SegmentedControl ariaLabel="Shadow preset" value={state.effect.shadowPreset} onChange={(value) => patchEffect({ shadowPreset: value })} options={shadows.map((shadow) => ({ value: shadow, label: labelize(shadow) }))} />
        <Field label="CSS class" density="compact">
          <Input size="sm" value={state.exportOptions.className} onChange={(event) => patchExport({ className: event.target.value })} />
        </Field>
        <ControlGrid columns={2}>
          <CheckboxRow label="Supports fallback" checked={state.fallback.includeSupportsFallback} onChange={(checked) => patchFallback({ includeSupportsFallback: checked })} />
          <CheckboxRow label="Reduced motion" checked={state.fallback.includeReducedMotion} onChange={(checked) => patchFallback({ includeReducedMotion: checked })} />
        </ControlGrid>
      </ControlSection>
    </ToolControlPanel>
  );

  return (
    <ToolLayoutVisualGenerator
      previewSlot={previewSlot}
      controlsSlot={controlsSlot}
      actionsSlot={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" leftIcon={<Shuffle className="h-4 w-4" />} onClick={() => setState((current) => randomizeGlassState(current))}>Randomize</Button>
          <Button variant="secondary" leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={() => setState(createDefaultGlassmorphismState())}>Reset</Button>
          <CopyButton text={css}>Copy CSS</CopyButton>
        </div>
      }
      codeSlot={
        <div className="space-y-4">
          <WarningPanel title="Readability and production notes" messages={warnings} />
          <CodeOutputPanel title="Generated glass code" description="Copy CSS, HTML, React JSX, or a Tailwind-style starter." tabs={tabs} defaultTab="css" onDownload={(tab) => downloadText(tab.filename ?? `${tab.id}.txt`, tab.code)} />
        </div>
      }
    />
  );
}
