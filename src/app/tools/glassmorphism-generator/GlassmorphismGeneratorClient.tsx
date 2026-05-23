"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Download, RefreshCcw, Shuffle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
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

type PanelTab = "glass" | "shape" | "scene" | "content" | "fallback" | "export";
type CodeTab = "css" | "html" | "jsx" | "tailwind";

const PANEL_TABS: readonly TabItem<PanelTab>[] = [
  { value: "glass", label: "Glass" },
  { value: "shape", label: "Shape" },
  { value: "scene", label: "Scene" },
  { value: "content", label: "Content" },
  { value: "fallback", label: "Fallback" },
  { value: "export", label: "Export" },
];

const CODE_TABS: readonly TabItem<CodeTab>[] = [
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "jsx", label: "React JSX" },
  { value: "tailwind", label: "Tailwind-style" },
];

const componentTypes: GlassComponentType[] = ["card", "navbar", "modal", "sidebar", "button", "pricing-card", "login-panel", "toast", "hero-overlay", "dashboard-widget"];
const scenes: GlassScenePreset[] = ["aurora", "mesh", "dark-dashboard", "light-pastel", "neon", "abstract-blobs", "grid", "custom-gradient"];
const shadows: ShadowPreset[] = ["none", "soft", "medium", "strong", "custom"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function codeForTab(tab: CodeTab, state: GlassmorphismState) {
  if (tab === "html") return generateGlassHtml(state);
  if (tab === "jsx") return generateGlassJsx(state);
  if (tab === "tailwind") return generateTailwindStarter(state);
  return generateGlassCss(state);
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function GlassmorphismGeneratorClient() {
  const [state, setState] = useState<GlassmorphismState>(() => createDefaultGlassmorphismState());
  const [panelTab, setPanelTab] = useState<PanelTab>("glass");
  const [codeTab, setCodeTab] = useState<CodeTab>("css");

  const css = useMemo(() => generateGlassCss(state), [state]);
  const html = useMemo(() => generateGlassHtml(state), [state]);
  const jsx = useMemo(() => generateGlassJsx(state), [state]);
  const tailwind = useMemo(() => generateTailwindStarter(state), [state]);
  const warnings = useMemo(() => validateGlassmorphismState(state), [state]);
  const sceneStyle = useMemo(() => getScenePreviewStyle(state), [state]);
  const glassStyle = useMemo(() => getGlassPreviewStyle(state), [state]);

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

  const activeCode = codeForTab(codeTab, state);
  const allCode = [css, html, jsx, tailwind].join("\n\n/* ------------------------------ */\n\n");

  return (
    <div className="space-y-6">
      <style>{`.darma-glass-scene-animated { animation: darma-glass-shift 12s ease-in-out infinite alternate; background-size: 160% 160%; } @keyframes darma-glass-shift { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }`}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-text-soft)]">Glass UI Studio</p>
          <h2 className="text-2xl font-black text-[var(--color-text)]">Glassmorphism CSS Generator</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">Create frosted glass cards, navbars, modals, buttons, and overlays with production-friendly fallbacks.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" leftIcon={<Shuffle className="h-4 w-4" />} onClick={() => setState((current) => randomizeGlassState(current))}>Randomize</Button>
          <Button variant="secondary" leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={() => setState(createDefaultGlassmorphismState())}>Reset</Button>
          <CopyButton text={css}>Copy CSS</CopyButton>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_430px]">
        <div className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft">{state.shape.componentType.replace("-", " ")}</Badge>
              <Badge variant="soft">blur {state.effect.blur}px</Badge>
              <Badge variant={state.effect.opacity < 0.1 ? "warning" : "success"}>opacity {state.effect.opacity.toFixed(2)}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => patchState({ showBeforeAfter: !state.showBeforeAfter })}>{state.showBeforeAfter ? "Show blur" : "Compare no blur"}</Button>
              <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={() => downloadText("glassmorphism.css", css)}>Download CSS</Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
            <PresetGallery onApply={setState} />
            <div className={`relative min-h-[560px] overflow-hidden rounded-3xl border border-[var(--color-border)] p-6 ${state.scene.animated ? "darma-glass-scene-animated" : ""}`} style={sceneStyle}>
              <SceneDecorations />
              <div className="relative flex min-h-[500px] items-center justify-center">
                <GlassPreview state={state} style={glassStyle} />
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/50 bg-white/75 p-3 text-xs font-bold text-slate-700 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/75 dark:text-slate-200">
                <span>Scene: {state.scene.preset.replace("-", " ")}</span>
                <span>{state.showBeforeAfter ? "Blur disabled for comparison" : "Backdrop blur active"}</span>
                <span>{state.scene.noiseEnabled ? "Noise on" : "Noise off"}</span>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <Tabs<PanelTab> items={PANEL_TABS} value={panelTab} onChange={setPanelTab} ariaLabel="Glassmorphism controls" />
          {panelTab === "glass" ? <GlassPanel state={state} patchEffect={patchEffect} /> : null}
          {panelTab === "shape" ? <ShapePanel state={state} patchShape={patchShape} /> : null}
          {panelTab === "scene" ? <ScenePanel state={state} patchScene={patchScene} /> : null}
          {panelTab === "content" ? <ContentPanel state={state} patchContent={patchContent} patchState={patchState} /> : null}
          {panelTab === "fallback" ? <FallbackPanel state={state} patchFallback={patchFallback} /> : null}
          {panelTab === "export" ? <ExportPanel state={state} patchExport={patchExport} /> : null}

          <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
            <p className="text-sm font-black text-[var(--color-text)]">Readability & production notes</p>
            {warnings.map((warning, index) => (
              <div key={`${warning.field ?? "note"}-${index}`} className="flex gap-2 rounded-xl bg-[var(--color-surface)] p-2 text-xs leading-5 text-[var(--color-text-muted)]">
                <Badge variant={warning.type === "warning" ? "warning" : warning.type === "error" ? "danger" : "soft"}>{warning.type}</Badge>
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Tabs<CodeTab> items={CODE_TABS} value={codeTab} onChange={setCodeTab} ariaLabel="Generated glassmorphism code" />
          <div className="flex flex-wrap gap-2">
            <CopyButton text={activeCode}>Copy {codeTab}</CopyButton>
            <CopyButton text={allCode}>Copy all</CopyButton>
            <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={() => downloadText(codeTab === "css" ? "glassmorphism.css" : "glassmorphism.txt", activeCode)}>Download</Button>
          </div>
        </div>
        <Textarea readOnly value={activeCode} className="min-h-[360px] font-mono text-xs leading-5" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Best for" text="Hero overlays, navbars, modals, dashboard widgets, login panels, glass buttons, and decorative content cards." />
        <InfoCard title="Core idea" text="Backdrop blur affects the pixels behind the glass layer. Keep the layer partially transparent so the effect is visible." />
        <InfoCard title="Production tip" text="Use fallbacks, test contrast, include Safari prefixes, and avoid too many animated blurred layers on one page." />
      </section>
    </div>
  );
}

function PresetGallery({ onApply }: { onApply: (state: GlassmorphismState) => void }) {
  return (
    <div className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
      <div>
        <p className="text-sm font-black text-[var(--color-text)]">Presets</p>
        <p className="text-xs text-[var(--color-text-muted)]">Start from real glass UI patterns.</p>
      </div>
      <div className="grid max-h-[480px] gap-2 overflow-y-auto pr-1">
        {GLASS_PRESETS.map((preset) => (
          <button key={preset.id} type="button" onClick={() => onApply(preset.state)} className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-sm">
            <div className="mb-2 h-16 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_20%_20%,#8b5cf6,transparent_38%),radial-gradient(circle_at_80%_20%,#06b6d4,transparent_38%),#0f172a] p-3">
              <div className="h-full w-2/3 rounded-xl border border-white/30 bg-white/15 shadow-lg backdrop-blur-md" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-black text-[var(--color-text)]">{preset.name}</span>
              <Badge variant="soft">{preset.componentType}</Badge>
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{preset.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function GlassPreview({ state, style }: { state: GlassmorphismState; style: CSSProperties }) {
  const className = "relative";
  if (state.shape.componentType === "navbar") {
    return (
      <div className={className} style={style}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <strong>{state.content.eyebrow}</strong>
          <div className="flex gap-4 text-sm font-bold opacity-85"><span>Products</span><span>Pricing</span><span>Docs</span></div>
          <span className="rounded-full border border-current/30 px-4 py-2 text-sm font-black" style={{ color: state.content.accentColor }}>{state.content.actionLabel}</span>
        </div>
        <NoiseLayer state={state} />
      </div>
    );
  }
  if (state.shape.componentType === "button") {
    return (
      <button type="button" className={className} style={style}>
        <span className="relative z-10 text-lg font-black">{state.content.actionLabel}</span>
        <NoiseLayer state={state} />
      </button>
    );
  }
  return (
    <article className={className} style={style}>
      <div className="relative z-10">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em]" style={{ color: state.content.accentColor }}>{state.content.eyebrow}</p>
        <h3 className="max-w-xl text-4xl font-black leading-tight tracking-tight">{state.content.title}</h3>
        <p className="mt-4 max-w-lg text-sm leading-7 opacity-85">{state.content.description}</p>
        <a href="#" className="mt-6 inline-flex rounded-full border border-current/30 px-4 py-2 text-sm font-black no-underline" style={{ color: state.content.accentColor }}>{state.content.actionLabel}</a>
      </div>
      <NoiseLayer state={state} />
    </article>
  );
}

function NoiseLayer({ state }: { state: GlassmorphismState }) {
  if (!state.scene.noiseEnabled) return null;
  return <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ opacity: state.scene.noiseOpacity, backgroundImage: "radial-gradient(rgb(255 255 255 / 0.65) 1px, transparent 1px)", backgroundSize: "6px 6px" }} />;
}

function SceneDecorations() {
  return (
    <>
      <div className="absolute left-[8%] top-[12%] h-24 w-24 rounded-full bg-white/20 blur-xl" />
      <div className="absolute bottom-[14%] right-[12%] h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />
      <div className="absolute right-[28%] top-[20%] h-16 w-16 rounded-2xl border border-white/20 bg-white/10 rotate-12" />
    </>
  );
}

function GlassPanel({ state, patchEffect }: { state: GlassmorphismState; patchEffect: (patch: Partial<GlassmorphismState["effect"]>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tint color"><Input type="color" value={state.effect.tintColor} onChange={(event) => patchEffect({ tintColor: event.target.value })} /></Field>
        <Field label="Border color"><Input type="color" value={state.effect.borderColor} onChange={(event) => patchEffect({ borderColor: event.target.value })} /></Field>
      </div>
      <SliderField label="Opacity" value={state.effect.opacity} min={0.02} max={0.95} step={0.01} suffix="" onChange={(value) => patchEffect({ opacity: value })} />
      <SliderField label="Backdrop blur" value={state.effect.blur} min={0} max={48} step={1} suffix="px" onChange={(value) => patchEffect({ blur: value })} />
      <SliderField label="Saturation" value={state.effect.saturation} min={50} max={240} step={5} suffix="%" onChange={(value) => patchEffect({ saturation: value })} />
      <SliderField label="Brightness" value={state.effect.brightness} min={60} max={160} step={5} suffix="%" onChange={(value) => patchEffect({ brightness: value })} />
      <SliderField label="Contrast" value={state.effect.contrast} min={60} max={180} step={5} suffix="%" onChange={(value) => patchEffect({ contrast: value })} />
      <SliderField label="Border opacity" value={state.effect.borderOpacity} min={0} max={1} step={0.01} suffix="" onChange={(value) => patchEffect({ borderOpacity: value })} />
      <SliderField label="Border width" value={state.effect.borderWidth} min={0} max={8} step={1} suffix="px" onChange={(value) => patchEffect({ borderWidth: value })} />
      <Field label="Shadow preset">
        <Select value={state.effect.shadowPreset} onChange={(event) => patchEffect({ shadowPreset: event.target.value as ShadowPreset })}>{shadows.map((shadow) => <option key={shadow} value={shadow}>{shadow}</option>)}</Select>
      </Field>
      {state.effect.shadowPreset === "custom" ? <Field label="Custom shadow"><Input value={state.effect.customShadow} onChange={(event) => patchEffect({ customShadow: event.target.value })} /></Field> : null}
    </div>
  );
}

function ShapePanel({ state, patchShape }: { state: GlassmorphismState; patchShape: (patch: Partial<GlassmorphismState["shape"]>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Component type">
        <Select value={state.shape.componentType} onChange={(event) => patchShape({ componentType: event.target.value as GlassComponentType })}>{componentTypes.map((type) => <option key={type} value={type}>{type}</option>)}</Select>
      </Field>
      <SliderField label="Width" value={state.shape.width} min={160} max={900} step={10} suffix="px" onChange={(value) => patchShape({ width: value })} />
      <SliderField label="Min height" value={state.shape.minHeight} min={80} max={700} step={10} suffix="px" onChange={(value) => patchShape({ minHeight: value })} />
      <SliderField label="Padding" value={state.shape.padding} min={8} max={96} step={2} suffix="px" onChange={(value) => patchShape({ padding: value })} />
      <SliderField label="Border radius" value={state.shape.borderRadius} min={0} max={80} step={1} suffix="px" onChange={(value) => patchShape({ borderRadius: value })} />
    </div>
  );
}

function ScenePanel({ state, patchScene }: { state: GlassmorphismState; patchScene: (patch: Partial<GlassmorphismState["scene"]>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Scene preset"><Select value={state.scene.preset} onChange={(event) => patchScene({ preset: event.target.value as GlassScenePreset })}>{scenes.map((scene) => <option key={scene} value={scene}>{scene}</option>)}</Select></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Color A"><Input type="color" value={state.scene.colorA} onChange={(event) => patchScene({ colorA: event.target.value })} /></Field>
        <Field label="Color B"><Input type="color" value={state.scene.colorB} onChange={(event) => patchScene({ colorB: event.target.value })} /></Field>
        <Field label="Color C"><Input type="color" value={state.scene.colorC} onChange={(event) => patchScene({ colorC: event.target.value })} /></Field>
      </div>
      <ToggleRow label="Animated scene" checked={state.scene.animated} onChange={(checked) => patchScene({ animated: checked })} />
      <ToggleRow label="Noise overlay" checked={state.scene.noiseEnabled} onChange={(checked) => patchScene({ noiseEnabled: checked })} />
      <SliderField label="Noise opacity" value={state.scene.noiseOpacity} min={0} max={0.25} step={0.01} suffix="" onChange={(value) => patchScene({ noiseOpacity: value })} />
    </div>
  );
}

function ContentPanel({ state, patchContent, patchState }: { state: GlassmorphismState; patchContent: (patch: Partial<GlassmorphismState["content"]>) => void; patchState: (patch: Partial<GlassmorphismState>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><Input value={state.content.eyebrow} onChange={(event) => patchContent({ eyebrow: event.target.value })} /></Field>
      <Field label="Title"><Input value={state.content.title} onChange={(event) => patchContent({ title: event.target.value })} /></Field>
      <Field label="Description"><Textarea value={state.content.description} onChange={(event) => patchContent({ description: event.target.value })} className="min-h-24" /></Field>
      <Field label="Action label"><Input value={state.content.actionLabel} onChange={(event) => patchContent({ actionLabel: event.target.value })} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Text color"><Input type="color" value={state.content.textColor} onChange={(event) => patchContent({ textColor: event.target.value })} /></Field>
        <Field label="Accent color"><Input type="color" value={state.content.accentColor} onChange={(event) => patchContent({ accentColor: event.target.value })} /></Field>
      </div>
      <ToggleRow label="Show readability hints" checked={state.showReadabilityHints} onChange={(checked) => patchState({ showReadabilityHints: checked })} />
    </div>
  );
}

function FallbackPanel({ state, patchFallback }: { state: GlassmorphismState; patchFallback: (patch: Partial<GlassmorphismState["fallback"]>) => void }) {
  return (
    <div className="space-y-3">
      <ToggleRow label="Include -webkit-backdrop-filter" checked={state.fallback.includeWebkitPrefix} onChange={(checked) => patchFallback({ includeWebkitPrefix: checked })} />
      <ToggleRow label="Include @supports fallback" checked={state.fallback.includeSupportsFallback} onChange={(checked) => patchFallback({ includeSupportsFallback: checked })} />
      <ToggleRow label="Reduced transparency fallback" checked={state.fallback.includeReducedTransparency} onChange={(checked) => patchFallback({ includeReducedTransparency: checked })} />
      <ToggleRow label="Reduced motion fallback" checked={state.fallback.includeReducedMotion} onChange={(checked) => patchFallback({ includeReducedMotion: checked })} />
      <ToggleRow label="Performance comment" checked={state.fallback.includePerformanceComment} onChange={(checked) => patchFallback({ includePerformanceComment: checked })} />
    </div>
  );
}

function ExportPanel({ state, patchExport }: { state: GlassmorphismState; patchExport: (patch: Partial<GlassmorphismState["exportOptions"]>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="CSS class name"><Input value={state.exportOptions.className} maxLength={60} onChange={(event) => patchExport({ className: event.target.value })} /></Field>
      <Field label="React component name"><Input value={state.exportOptions.componentName} maxLength={60} onChange={(event) => patchExport({ componentName: event.target.value })} /></Field>
      <ToggleRow label="Include comments" checked={state.exportOptions.includeComments} onChange={(checked) => patchExport({ includeComments: checked })} />
      <ToggleRow label="Include demo scene CSS" checked={state.exportOptions.includeDemoScene} onChange={(checked) => patchExport({ includeDemoScene: checked })} />
      <ToggleRow label="Include noise pseudo-element" checked={state.exportOptions.includeNoisePseudoElement} onChange={(checked) => patchExport({ includeNoisePseudoElement: checked })} />
    </div>
  );
}

function SliderField({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) {
  return (
    <Field label={`${label}: ${value}${suffix}`}>
      <input className="w-full accent-[var(--color-accent)]" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(clamp(Number(event.target.value), min, max))} />
    </Field>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3 text-sm font-bold text-[var(--color-text)]">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
    </label>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-surface-strong)] text-[var(--color-accent)]"><Sparkles className="h-5 w-5" /></div>
      <h3 className="text-base font-black text-[var(--color-text)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{text}</p>
    </div>
  );
}
