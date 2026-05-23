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
  createDefaultTransformState,
  generateTailwindStarter,
  generateTransformCss,
  generateTransformHtml,
  generateTransformJsx,
  getPreviewStyle,
  randomizeTransformState,
  validateTransformState,
} from "./transform";
import { TRANSFORM_PRESETS } from "./presets";
import type {
  PreviewObject,
  Transform2DSettings,
  Transform3DSettings,
  TransformGeneratorState,
  TransformMode,
  TransformOriginPreset,
  TransformStyleSettings,
} from "./types";

type PanelTab = "transform2d" | "transform3d" | "origin" | "interaction" | "style" | "export";
type CodeTab = "css" | "html" | "jsx" | "tailwind";

const PANEL_TABS: readonly TabItem<PanelTab>[] = [
  { value: "transform2d", label: "2D" },
  { value: "transform3d", label: "3D" },
  { value: "origin", label: "Origin" },
  { value: "interaction", label: "Interaction" },
  { value: "style", label: "Style" },
  { value: "export", label: "Export" },
];

const CODE_TABS: readonly TabItem<CodeTab>[] = [
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "jsx", label: "React JSX" },
  { value: "tailwind", label: "Tailwind-style" },
];

const MODES: readonly { value: TransformMode; label: string }[] = [
  { value: "2d", label: "2D transform" },
  { value: "3d", label: "3D transform" },
  { value: "hover", label: "Hover effect" },
  { value: "entrance", label: "Entrance animation" },
  { value: "card-tilt", label: "Card tilt" },
];

const ORIGINS: readonly TransformOriginPreset[] = [
  "top left",
  "top center",
  "top right",
  "center left",
  "center center",
  "center right",
  "bottom left",
  "bottom center",
  "bottom right",
];

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function downloadFile(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function FieldInput({ label, value, min, max, step = 1, onChange, suffix }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void; suffix?: string }) {
  return (
    <Field label={label} description={suffix}>
      <div className="grid grid-cols-[1fr_92px] gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full accent-[var(--color-primary)]"
        />
        <Input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(clampNumber(Number(event.target.value), min, max))} />
      </div>
    </Field>
  );
}

export default function CssTransformGeneratorClient() {
  const [state, setState] = useState<TransformGeneratorState>(() => createDefaultTransformState());
  const [panelTab, setPanelTab] = useState<PanelTab>("transform2d");
  const [codeTab, setCodeTab] = useState<CodeTab>("css");

  const css = useMemo(() => generateTransformCss(state), [state]);
  const html = useMemo(() => generateTransformHtml(state), [state]);
  const jsx = useMemo(() => generateTransformJsx(state), [state]);
  const tailwind = useMemo(() => generateTailwindStarter(state), [state]);
  const warnings = useMemo(() => validateTransformState(state), [state]);
  const activeCode = { css, html, jsx, tailwind }[codeTab];
  const previewStyle = useMemo(() => getPreviewStyle(state), [state]);

  function patch(patchState: Partial<TransformGeneratorState>) {
    setState((current) => ({ ...current, ...patchState }));
  }

  function patch2d(patchState: Partial<Transform2DSettings>, target: "base" | "hover" = "base") {
    setState((current) => (target === "base" ? { ...current, transform2d: { ...current.transform2d, ...patchState } } : { ...current, hover2d: { ...current.hover2d, ...patchState } }));
  }

  function patch3d(patchState: Partial<Transform3DSettings>, target: "base" | "hover" = "base") {
    setState((current) => (target === "base" ? { ...current, transform3d: { ...current.transform3d, ...patchState } } : { ...current, hover3d: { ...current.hover3d, ...patchState } }));
  }

  function patchStyle(patchState: Partial<TransformStyleSettings>) {
    setState((current) => ({ ...current, style: { ...current.style, ...patchState } }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm">
        <div className="min-w-56 flex-1">
          <Select
            value={state.presetId}
            onChange={(event) => {
              const preset = TRANSFORM_PRESETS.find((item) => item.id === event.target.value);
              if (preset) setState(preset.state);
            }}
            aria-label="Transform preset"
          >
            {TRANSFORM_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.name}</option>
            ))}
          </Select>
        </div>
        <Select value={state.mode} onChange={(event) => patch({ mode: event.target.value as TransformMode })} className="w-48" aria-label="Transform mode">
          {MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
        </Select>
        <Select value={state.previewState} onChange={(event) => patch({ previewState: event.target.value as TransformGeneratorState["previewState"] })} className="w-36" aria-label="Preview state">
          <option value="base">Base</option>
          <option value="hover">Hover</option>
          <option value="active">Active</option>
          <option value="animated">Animated</option>
        </Select>
        <Button variant="secondary" leftIcon={<Shuffle className="h-4 w-4" />} onClick={() => setState((current) => randomizeTransformState(current))}>Randomize</Button>
        <CopyButton text={css}>Copy CSS</CopyButton>
        <Button variant="ghost" leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={() => setState(createDefaultTransformState())}>Reset</Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_440px]">
        <section className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] p-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--color-text)]">Live transform preview</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Origin, perspective, before outline, and axes update with your settings.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft">{state.mode}</Badge>
              <Badge variant="outline">{state.previewState}</Badge>
              <Badge variant="outline">origin: {state.origin.preset}</Badge>
            </div>
          </div>

          <div
            className="relative grid min-h-[560px] place-items-center overflow-hidden p-8"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgb(124 58 237 / 0.32), transparent 32%), radial-gradient(circle at 80% 10%, rgb(6 182 212 / 0.26), transparent 28%), linear-gradient(135deg, #020617, #111827 55%, #312e81)",
              perspective: `${state.transform3d.perspective}px`,
              perspectiveOrigin: `${state.transform3d.perspectiveOriginX}% ${state.transform3d.perspectiveOriginY}%`,
            }}
          >
            {state.showAxisOverlay ? <AxisOverlay /> : null}
            {state.show3dGrid ? <div className="pointer-events-none absolute bottom-12 h-28 w-[78%] rounded-[50%] border border-white/15 bg-[linear-gradient(90deg,rgb(255_255_255/0.08)_1px,transparent_1px),linear-gradient(0deg,rgb(255_255_255/0.08)_1px,transparent_1px)] bg-[size:28px_28px] opacity-70 [transform:rotateX(68deg)]" /> : null}
            <div className="relative">
              {state.showBeforeOutline ? <div className="absolute inset-0 rounded-[inherit] border-2 border-dashed border-white/45" style={{ width: state.style.width, minHeight: state.style.height, borderRadius: state.style.borderRadius }} /> : null}
              <PreviewObject state={state} style={previewStyle} />
              {state.showOriginMarker ? <OriginMarker state={state} /> : null}
            </div>
          </div>
        </section>

        <aside className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <Tabs<PanelTab> items={PANEL_TABS} value={panelTab} onChange={setPanelTab} ariaLabel="Transform controls" />
          {panelTab === "transform2d" ? <TwoDControls state={state} patch2d={patch2d} /> : null}
          {panelTab === "transform3d" ? <ThreeDControls state={state} patch3d={patch3d} /> : null}
          {panelTab === "origin" ? <OriginControls state={state} setState={setState} /> : null}
          {panelTab === "interaction" ? <InteractionControls state={state} setState={setState} /> : null}
          {panelTab === "style" ? <StyleControls state={state} patchStyle={patchStyle} setState={setState} /> : null}
          {panelTab === "export" ? <ExportControls state={state} setState={setState} /> : null}
        </aside>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs<CodeTab> items={CODE_TABS} value={codeTab} onChange={setCodeTab} ariaLabel="Generated transform code" />
            <div className="flex flex-wrap gap-2">
              <CopyButton text={activeCode} variant="secondary">Copy tab</CopyButton>
              <CopyButton text={[css, html, jsx].join("\n\n")} variant="secondary">Copy all</CopyButton>
              <Button variant="ghost" leftIcon={<Download className="h-4 w-4" />} onClick={() => downloadFile(codeTab === "css" ? "transform.css" : "transform.html", activeCode, codeTab === "css" ? "text/css" : "text/html")}>Download</Button>
            </div>
          </div>
          <Textarea value={activeCode} readOnly className="min-h-[360px] font-mono text-xs" />
        </div>

        <div className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
            <h3 className="font-bold text-[var(--color-text)]">Transform hints</h3>
          </div>
          {warnings.map((warning, index) => (
            <div key={`${warning.message}-${index}`} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
              <Badge variant={warning.type === "error" ? "danger" : warning.type === "warning" ? "warning" : "soft"}>{warning.type}</Badge>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{warning.message}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Best for" text="Card lifts, image zooms, button presses, modal entrances, product-card tilts, skewed labels, and small interface motion." />
        <InfoCard title="Transform concepts" text="Tune the function values, origin point, 3D perspective, and transform order to control where the element moves and rotates from." />
        <InfoCard title="Export formats" text="Copy CSS, semantic HTML, React JSX, and a Tailwind-style starter with optional transition and reduced-motion CSS." />
      </section>
    </div>
  );
}

function PreviewObject({ state, style }: { state: TransformGeneratorState; style: CSSProperties }) {
  const className = "relative z-10 overflow-hidden border border-white/20 text-left";
  if (state.style.previewObject === "button") {
    return <button className={`${className} grid place-items-center font-bold`} style={style}>Transform button</button>;
  }
  if (state.style.previewObject === "badge") {
    return <div className={`${className} grid place-items-center text-center text-xl font-black uppercase tracking-[0.18em]`} style={style}>Skewed label</div>;
  }
  if (state.style.previewObject === "image") {
    return <div className={`${className} grid place-items-end bg-cover bg-center`} style={{ ...style, background: "linear-gradient(135deg, rgb(14 165 233 / 0.45), rgb(124 58 237 / 0.7)), url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=70')" }}><span className="rounded-full bg-black/35 px-3 py-1 text-xs font-bold text-white backdrop-blur">Image zoom</span></div>;
  }
  return (
    <article className={className} style={style}>
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] opacity-80">Transform UI</p>
      <h3 className="max-w-[12rem] text-2xl font-black leading-tight">Interactive card effect</h3>
      <p className="mt-4 max-w-[15rem] text-sm leading-6 opacity-85">Origin, perspective, transition, and motion-friendly export code.</p>
    </article>
  );
}

function AxisOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-70">
      <div className="absolute left-10 top-1/2 h-px w-[calc(100%-5rem)] bg-cyan-300/35" />
      <div className="absolute left-1/2 top-10 h-[calc(100%-5rem)] w-px bg-violet-300/35" />
      <span className="absolute right-6 top-1/2 rounded-full bg-cyan-300/15 px-2 py-1 text-xs font-bold text-cyan-100">X axis</span>
      <span className="absolute left-1/2 top-6 rounded-full bg-violet-300/15 px-2 py-1 text-xs font-bold text-violet-100">Y axis</span>
    </div>
  );
}

function OriginMarker({ state }: { state: TransformGeneratorState }) {
  const position = originToPosition(state);
  return <div className="pointer-events-none absolute z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-rose-500 shadow-lg shadow-rose-500/40" style={position} title="Transform origin" />;
}

function originToPosition(state: TransformGeneratorState): CSSProperties {
  if (state.origin.preset === "custom") return { left: state.origin.x, top: state.origin.y };
  const [y, x] = state.origin.preset.split(" ");
  return { left: x === "left" ? "0%" : x === "right" ? "100%" : "50%", top: y === "top" ? "0%" : y === "bottom" ? "100%" : "50%" };
}

function TwoDControls({ state, patch2d }: { state: TransformGeneratorState; patch2d: (patch: Partial<Transform2DSettings>, target?: "base" | "hover") => void }) {
  const target = state.previewState === "hover" || state.mode === "hover" ? "hover" : "base";
  const settings = target === "hover" ? state.hover2d : state.transform2d;
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[var(--color-text-muted)]">Editing {target} 2D values. Switch the preview state to compare base and hover transforms.</p>
      <Field label="Translate unit"><Select value={settings.translateUnit} onChange={(event) => patch2d({ translateUnit: event.target.value as Transform2DSettings["translateUnit"] }, target)}><option value="px">px</option><option value="rem">rem</option><option value="%">%</option></Select></Field>
      <FieldInput label="Translate X" value={settings.translateX} min={-400} max={400} onChange={(value) => patch2d({ translateX: value }, target)} suffix={settings.translateUnit} />
      <FieldInput label="Translate Y" value={settings.translateY} min={-400} max={400} onChange={(value) => patch2d({ translateY: value }, target)} suffix={settings.translateUnit} />
      <FieldInput label="Rotate" value={settings.rotate} min={-180} max={180} onChange={(value) => patch2d({ rotate: value }, target)} suffix="degrees" />
      <FieldInput label="Scale X" value={settings.scaleX} min={0.1} max={3} step={0.01} onChange={(value) => patch2d({ scaleX: value }, target)} />
      <FieldInput label="Scale Y" value={settings.scaleY} min={0.1} max={3} step={0.01} onChange={(value) => patch2d({ scaleY: value }, target)} />
      <FieldInput label="Skew X" value={settings.skewX} min={-60} max={60} onChange={(value) => patch2d({ skewX: value }, target)} suffix="degrees" />
      <FieldInput label="Skew Y" value={settings.skewY} min={-60} max={60} onChange={(value) => patch2d({ skewY: value }, target)} suffix="degrees" />
      <Field label="Transform order" description="Order changes the final result."><Select value={settings.order.join("-")} onChange={(event) => patch2d({ order: event.target.value.split("-") as Transform2DSettings["order"] }, target)}><option value="translate-rotate-scale-skew">translate → rotate → scale → skew</option><option value="scale-rotate-translate-skew">scale → rotate → translate → skew</option><option value="rotate-translate-scale-skew">rotate → translate → scale → skew</option></Select></Field>
    </div>
  );
}

function ThreeDControls({ state, patch3d }: { state: TransformGeneratorState; patch3d: (patch: Partial<Transform3DSettings>, target?: "base" | "hover") => void }) {
  const target = state.previewState === "hover" || state.mode === "card-tilt" ? "hover" : "base";
  const settings = target === "hover" ? state.hover3d : state.transform3d;
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[var(--color-text-muted)]">Perspective gives rotateX and rotateY visible depth. Editing {target} 3D values.</p>
      <FieldInput label="Perspective" value={settings.perspective} min={100} max={2000} onChange={(value) => patch3d({ perspective: value }, target)} suffix="px" />
      <FieldInput label="Rotate X" value={settings.rotateX} min={-180} max={180} onChange={(value) => patch3d({ rotateX: value }, target)} suffix="degrees" />
      <FieldInput label="Rotate Y" value={settings.rotateY} min={-180} max={180} onChange={(value) => patch3d({ rotateY: value }, target)} suffix="degrees" />
      <FieldInput label="Rotate Z" value={settings.rotateZ} min={-180} max={180} onChange={(value) => patch3d({ rotateZ: value }, target)} suffix="degrees" />
      <FieldInput label="Translate Z" value={settings.translateZ} min={-300} max={300} onChange={(value) => patch3d({ translateZ: value }, target)} suffix="px" />
      <Field label="Transform style"><Select value={settings.transformStyle} onChange={(event) => patch3d({ transformStyle: event.target.value as Transform3DSettings["transformStyle"] }, target)}><option value="preserve-3d">preserve-3d</option><option value="flat">flat</option></Select></Field>
      <Field label="Backface visibility"><Select value={settings.backfaceVisibility} onChange={(event) => patch3d({ backfaceVisibility: event.target.value as Transform3DSettings["backfaceVisibility"] }, target)}><option value="hidden">hidden</option><option value="visible">visible</option></Select></Field>
      <FieldInput label="Perspective origin X" value={settings.perspectiveOriginX} min={0} max={100} onChange={(value) => patch3d({ perspectiveOriginX: value }, target)} suffix="%" />
      <FieldInput label="Perspective origin Y" value={settings.perspectiveOriginY} min={0} max={100} onChange={(value) => patch3d({ perspectiveOriginY: value }, target)} suffix="%" />
    </div>
  );
}

function OriginControls({ state, setState }: { state: TransformGeneratorState; setState: (updater: (current: TransformGeneratorState) => TransformGeneratorState) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {ORIGINS.map((origin) => <Button key={origin} variant={state.origin.preset === origin ? "primary" : "secondary"} size="sm" onClick={() => setState((current) => ({ ...current, origin: { ...current.origin, preset: origin } }))}>{origin.replace(" ", "\n")}</Button>)}
      </div>
      <Button variant={state.origin.preset === "custom" ? "primary" : "secondary"} fullWidth onClick={() => setState((current) => ({ ...current, origin: { ...current.origin, preset: "custom" } }))}>Use custom origin</Button>
      <Field label="Origin X"><Input value={state.origin.x} onChange={(event) => setState((current) => ({ ...current, origin: { ...current.origin, preset: "custom", x: event.target.value } }))} /></Field>
      <Field label="Origin Y"><Input value={state.origin.y} onChange={(event) => setState((current) => ({ ...current, origin: { ...current.origin, preset: "custom", y: event.target.value } }))} /></Field>
      <Field label="Origin Z"><Input value={state.origin.z} onChange={(event) => setState((current) => ({ ...current, origin: { ...current.origin, z: event.target.value } }))} /></Field>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={state.showOriginMarker} onChange={(event) => setState((current) => ({ ...current, showOriginMarker: event.target.checked }))} /> Show origin marker</label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={state.showBeforeOutline} onChange={(event) => setState((current) => ({ ...current, showBeforeOutline: event.target.checked }))} /> Show before outline</label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={state.showAxisOverlay} onChange={(event) => setState((current) => ({ ...current, showAxisOverlay: event.target.checked }))} /> Show axis overlay</label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={state.show3dGrid} onChange={(event) => setState((current) => ({ ...current, show3dGrid: event.target.checked }))} /> Show 3D floor</label>
    </div>
  );
}

function InteractionControls({ state, setState }: { state: TransformGeneratorState; setState: (updater: (current: TransformGeneratorState) => TransformGeneratorState) => void }) {
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={state.transition.enabled} onChange={(event) => setState((current) => ({ ...current, transition: { ...current.transition, enabled: event.target.checked } }))} /> Enable transition</label>
      <FieldInput label="Transition duration" value={state.transition.duration} min={0} max={3000} onChange={(value) => setState((current) => ({ ...current, transition: { ...current.transition, duration: value } }))} suffix="ms" />
      <FieldInput label="Transition delay" value={state.transition.delay} min={0} max={2000} onChange={(value) => setState((current) => ({ ...current, transition: { ...current.transition, delay: value } }))} suffix="ms" />
      <Field label="Timing function"><Select value={state.transition.timingFunction} onChange={(event) => setState((current) => ({ ...current, transition: { ...current.transition, timingFunction: event.target.value as TransformGeneratorState["transition"]["timingFunction"] } }))}><option value="ease">ease</option><option value="ease-in">ease-in</option><option value="ease-out">ease-out</option><option value="ease-in-out">ease-in-out</option><option value="linear">linear</option></Select></Field>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={state.transition.includeOpacity} onChange={(event) => setState((current) => ({ ...current, transition: { ...current.transition, includeOpacity: event.target.checked } }))} /> Transition opacity too</label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={state.transition.includeBoxShadow} onChange={(event) => setState((current) => ({ ...current, transition: { ...current.transition, includeBoxShadow: event.target.checked } }))} /> Transition box-shadow too</label>
      <FieldInput label="Animation duration" value={state.animation.duration} min={120} max={3000} onChange={(value) => setState((current) => ({ ...current, animation: { ...current.animation, duration: value } }))} suffix="ms" />
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={state.exportOptions.includeReducedMotion} onChange={(event) => setState((current) => ({ ...current, exportOptions: { ...current.exportOptions, includeReducedMotion: event.target.checked } }))} /> Include reduced-motion CSS</label>
    </div>
  );
}

function StyleControls({ state, patchStyle, setState }: { state: TransformGeneratorState; patchStyle: (patch: Partial<TransformStyleSettings>) => void; setState: (updater: (current: TransformGeneratorState) => TransformGeneratorState) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Preview object"><Select value={state.style.previewObject} onChange={(event) => patchStyle({ previewObject: event.target.value as PreviewObject })}><option value="card">Card</option><option value="image">Image</option><option value="button">Button</option><option value="modal">Modal</option><option value="badge">Badge</option><option value="panel">Panel</option></Select></Field>
      <FieldInput label="Width" value={state.style.width} min={80} max={800} onChange={(value) => patchStyle({ width: value })} suffix="px" />
      <FieldInput label="Height / min-height" value={state.style.height} min={40} max={600} onChange={(value) => patchStyle({ height: value })} suffix="px" />
      <FieldInput label="Padding" value={state.style.padding} min={0} max={96} onChange={(value) => patchStyle({ padding: value })} suffix="px" />
      <FieldInput label="Border radius" value={state.style.borderRadius} min={0} max={80} onChange={(value) => patchStyle({ borderRadius: value })} suffix="px" />
      <Field label="Background"><Input value={state.style.background} onChange={(event) => patchStyle({ background: event.target.value })} /></Field>
      <Field label="Text color"><Input type="color" value={state.style.textColor} onChange={(event) => patchStyle({ textColor: event.target.value })} /></Field>
      <Field label="Shadow"><Select value={state.style.shadow} onChange={(event) => patchStyle({ shadow: event.target.value as TransformStyleSettings["shadow"] })}><option value="none">None</option><option value="soft">Soft</option><option value="medium">Medium</option><option value="strong">Strong</option></Select></Field>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={state.showBeforeOutline} onChange={(event) => setState((current) => ({ ...current, showBeforeOutline: event.target.checked }))} /> Show before/after ghost</label>
    </div>
  );
}

function ExportControls({ state, setState }: { state: TransformGeneratorState; setState: (updater: (current: TransformGeneratorState) => TransformGeneratorState) => void }) {
  return (
    <div className="space-y-4">
      <Field label="CSS class name"><Input value={state.exportOptions.className} maxLength={60} onChange={(event) => setState((current) => ({ ...current, exportOptions: { ...current.exportOptions, className: event.target.value } }))} /></Field>
      <Field label="React component name"><Input value={state.exportOptions.componentName} maxLength={60} onChange={(event) => setState((current) => ({ ...current, exportOptions: { ...current.exportOptions, componentName: event.target.value } }))} /></Field>
      <Field label="Quote style"><Select value={state.exportOptions.quoteStyle} onChange={(event) => setState((current) => ({ ...current, exportOptions: { ...current.exportOptions, quoteStyle: event.target.value as TransformGeneratorState["exportOptions"]["quoteStyle"] } }))}><option value="double">Double quotes</option><option value="single">Single quotes</option></Select></Field>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={state.exportOptions.includeComments} onChange={(event) => setState((current) => ({ ...current, exportOptions: { ...current.exportOptions, includeComments: event.target.checked } }))} /> Include comments</label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={state.exportOptions.includeDemoStyles} onChange={(event) => setState((current) => ({ ...current, exportOptions: { ...current.exportOptions, includeDemoStyles: event.target.checked } }))} /> Include demo styles</label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={state.exportOptions.useTransformGpuHint} onChange={(event) => setState((current) => ({ ...current, exportOptions: { ...current.exportOptions, useTransformGpuHint: event.target.checked } }))} /> Include will-change hint</label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={state.exportOptions.includeReducedMotion} onChange={(event) => setState((current) => ({ ...current, exportOptions: { ...current.exportOptions, includeReducedMotion: event.target.checked } }))} /> Include reduced-motion output</label>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <h3 className="text-base font-bold text-[var(--color-text)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{text}</p>
    </div>
  );
}
