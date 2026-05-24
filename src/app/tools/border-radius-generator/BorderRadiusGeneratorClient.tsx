"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { RefreshCcw, Shuffle, Sparkles, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import {
  createDefaultBorderRadiusState,
  formatAdvancedBorderRadius,
  generateAnimationKeyframes,
  generateBorderRadiusCss,
  generateBorderRadiusHtml,
  generateBorderRadiusJsx,
  generateTailwindStarter,
  getBorderRadiusValue,
  randomizeBlobValues,
  validateBorderRadiusState,
} from "./borderRadius";
import { BORDER_RADIUS_PRESETS } from "./presets";
import type { AdvancedRadiusValues, BorderRadiusMode, BorderRadiusState, PreviewContext, RadiusCornerValues } from "./types";

type PanelTab = "radius" | "shape" | "style" | "animation" | "export";
type CodeTab = "css" | "html" | "jsx" | "tailwind";

type CornerKey = keyof RadiusCornerValues;

const PANEL_TABS: readonly TabItem<PanelTab>[] = [
  { value: "radius", label: "Radius" },
  { value: "shape", label: "Shape" },
  { value: "style", label: "Style" },
  { value: "animation", label: "Animation" },
  { value: "export", label: "Export" },
];

const CODE_TABS: readonly TabItem<CodeTab>[] = [
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "jsx", label: "React JSX" },
  { value: "tailwind", label: "Tailwind-style" },
];

const MODE_TABS: readonly TabItem<BorderRadiusMode>[] = [
  { value: "simple", label: "Simple" },
  { value: "advanced", label: "Advanced" },
  { value: "blob", label: "Blob" },
  { value: "image", label: "Image" },
  { value: "animated", label: "Animated" },
];

const cornerLabels: Record<CornerKey, string> = {
  topLeft: "Top left",
  topRight: "Top right",
  bottomRight: "Bottom right",
  bottomLeft: "Bottom left",
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function backgroundValue(state: BorderRadiusState) {
  const { style } = state;
  if (style.backgroundType === "solid") return style.backgroundColor;
  if (style.backgroundType === "radial-gradient") return `radial-gradient(circle at 30% 25%, ${style.gradientFrom}, ${style.gradientTo})`;
  if (style.backgroundType === "image") return `linear-gradient(135deg, rgb(15 23 42 / 0.35), rgb(15 23 42 / 0.1)), url("${style.imageUrl}") center / ${style.objectFit} no-repeat`;
  return `linear-gradient(${style.gradientAngle}deg, ${style.gradientFrom}, ${style.gradientTo})`;
}

function shadowValue(state: BorderRadiusState) {
  const { style } = state;
  if (style.shadowPreset === "none") return "none";
  if (style.shadowPreset === "soft") return "0 18px 50px rgb(15 23 42 / 0.16)";
  if (style.shadowPreset === "medium") return "0 24px 80px rgb(15 23 42 / 0.22)";
  if (style.shadowPreset === "strong") return "0 34px 110px rgb(15 23 42 / 0.32)";
  return style.customShadow || "0 24px 80px rgb(15 23 42 / 0.22)";
}

function codeForTab(tab: CodeTab, state: BorderRadiusState) {
  if (tab === "html") return generateBorderRadiusHtml(state);
  if (tab === "jsx") return generateBorderRadiusJsx(state);
  if (tab === "tailwind") return generateTailwindStarter(state);
  return generateBorderRadiusCss(state);
}

export default function BorderRadiusGeneratorClient() {
  const [state, setState] = useState<BorderRadiusState>(() => createDefaultBorderRadiusState());
  const [panelTab, setPanelTab] = useState<PanelTab>("radius");
  const [codeTab, setCodeTab] = useState<CodeTab>("css");

  const css = useMemo(() => generateBorderRadiusCss(state), [state]);
  const html = useMemo(() => generateBorderRadiusHtml(state), [state]);
  const jsx = useMemo(() => generateBorderRadiusJsx(state), [state]);
  const tailwind = useMemo(() => generateTailwindStarter(state), [state]);
  const warnings = useMemo(() => validateBorderRadiusState(state), [state]);
  const radiusValue = useMemo(() => getBorderRadiusValue(state), [state]);

  function patchState(patch: Partial<BorderRadiusState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function patchStyle(patch: Partial<BorderRadiusState["style"]>) {
    setState((current) => ({ ...current, style: { ...current.style, ...patch } }));
  }

  function patchAnimation(patch: Partial<BorderRadiusState["animation"]>) {
    setState((current) => ({ ...current, animation: { ...current.animation, ...patch } }));
  }

  function patchExport(patch: Partial<BorderRadiusState["exportOptions"]>) {
    setState((current) => ({ ...current, exportOptions: { ...current.exportOptions, ...patch } }));
  }

  function setSimpleCorner(corner: CornerKey, value: number) {
    setState((current) => ({
      ...current,
      simpleValues: { ...current.simpleValues, [corner]: clampNumber(value, 0, current.simpleUnit === "%" ? 100 : 400) },
    }));
  }

  function setAdvancedCorner(group: keyof AdvancedRadiusValues, corner: CornerKey, value: number) {
    setState((current) => ({
      ...current,
      advancedValues: {
        ...current.advancedValues,
        [group]: { ...current.advancedValues[group], [corner]: clampNumber(value, 0, current.advancedUnit === "%" ? 100 : 400) },
      },
    }));
  }

  function randomizeBlob() {
    setState((current) => ({
      ...current,
      mode: current.mode === "simple" ? "blob" : current.mode,
      advancedUnit: "%",
      advancedValues: randomizeBlobValues(current.advancedValues, current.locks),
    }));
  }

  function generateKeyframes() {
    setState((current) => ({
      ...current,
      mode: "animated",
      animation: {
        ...current.animation,
        enabled: true,
        keyframes: [current.advancedValues, ...generateAnimationKeyframes(3, current.locks)],
      },
    }));
  }

  const previewStyle: CSSProperties = {
    width: `${state.style.width}${state.style.sizeUnit}`,
    height: `${state.style.height}${state.style.sizeUnit}`,
    maxWidth: "100%",
    borderRadius: radiusValue,
    background: backgroundValue(state),
    boxShadow: shadowValue(state),
    border: state.style.borderStyle !== "none" && state.style.borderWidth > 0 ? `${state.style.borderWidth}px ${state.style.borderStyle} ${state.style.borderColor}` : undefined,
    objectFit: state.style.objectFit,
    animation: state.mode === "animated" || state.animation.enabled ? `darma-preview-blob ${state.animation.duration}s ${state.animation.timingFunction} infinite ${state.animation.direction}` : undefined,
  };

  return (
    <div className="space-y-6">
      <style>{`@keyframes darma-preview-blob { 0% { border-radius: ${formatAdvancedBorderRadius(state.advancedValues, state.advancedUnit)}; } 50% { border-radius: 62% 38% 54% 46% / 42% 58% 42% 58%; } 100% { border-radius: 35% 65% 66% 34% / 58% 40% 60% 42%; } }`}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-text-soft)]">Shape Studio</p>
          <h2 className="text-2xl font-black text-[var(--color-text)]">CSS Border Radius Generator</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">Create practical rounded UI corners or expressive organic blobs, then copy production-ready CSS and markup.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" leftIcon={<Shuffle className="h-4 w-4" />} onClick={randomizeBlob}>Randomize</Button>
          <Button variant="secondary" leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={() => setState(createDefaultBorderRadiusState())}>Reset</Button>
          <CopyButton text={css}>Copy CSS</CopyButton>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_420px]">
        <div className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs<BorderRadiusMode> items={MODE_TABS} value={state.mode} onChange={(mode) => patchState({ mode })} ariaLabel="Border radius modes" />
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft">{radiusValue}</Badge>
              {(state.mode === "animated" || state.animation.enabled) ? <Badge variant="success">Animated</Badge> : null}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <PresetGallery onApply={(next) => setState(next)} />
            <div className="relative min-h-[520px] overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[radial-gradient(circle_at_top_left,rgb(124_58_237_/_0.14),transparent_36%),linear-gradient(135deg,rgb(248_250_252),rgb(226_232_240))] p-6 dark:from-slate-900 dark:to-slate-950">
              {state.showGrid ? <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(15_23_42_/_0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgb(15_23_42_/_0.08)_1px,transparent_1px)] bg-[size:32px_32px]" /> : null}
              <div className="relative flex min-h-[460px] items-center justify-center">
                <div className="relative flex items-center justify-center" style={previewStyle}>
                  {state.previewContext === "card" ? <span className="px-6 text-center text-lg font-black text-slate-900">Modern card</span> : null}
                  {state.previewContext === "button" ? <span className="px-6 text-center text-base font-black text-white">Button shape</span> : null}
                  {state.previewContext === "hero-decoration" ? <Sparkles className="h-16 w-16 text-white/80" /> : null}
                  {state.showCornerLabels ? <CornerLabels state={state} /> : null}
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/60 bg-white/75 p-3 text-xs font-bold text-slate-700 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-200">
                <span>{state.style.width}{state.style.sizeUnit} × {state.style.height}{state.style.sizeUnit}</span>
                <span>Preview: {state.previewContext.replace("-", " ")}</span>
                <span>{state.advancedUnit === "%" ? "Organic percent radii" : "Fixed radii"}</span>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <Tabs<PanelTab> items={PANEL_TABS} value={panelTab} onChange={setPanelTab} ariaLabel="Border radius controls" />
          {panelTab === "radius" ? <RadiusPanel state={state} patchState={patchState} setSimpleCorner={setSimpleCorner} setAdvancedCorner={setAdvancedCorner} randomizeBlob={randomizeBlob} /> : null}
          {panelTab === "shape" ? <ShapePanel state={state} patchState={patchState} patchStyle={patchStyle} /> : null}
          {panelTab === "style" ? <StylePanel state={state} patchStyle={patchStyle} /> : null}
          {panelTab === "animation" ? <AnimationPanel state={state} patchAnimation={patchAnimation} generateKeyframes={generateKeyframes} /> : null}
          {panelTab === "export" ? <ExportPanel state={state} patchExport={patchExport} /> : null}
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <Tabs<CodeTab> items={CODE_TABS} value={codeTab} onChange={setCodeTab} ariaLabel="Generated code" />
            <div className="flex flex-wrap gap-2">
              <CopyButton text={codeForTab(codeTab, state)} variant="secondary">Copy tab</CopyButton>
              <CopyButton text={[css, html, jsx].join("\n\n")} variant="secondary">Copy all</CopyButton>
              <Button variant="secondary" onClick={() => downloadFile(codeTab === "css" ? "border-radius.css" : "border-radius.html", codeForTab(codeTab, state))}>Download</Button>
            </div>
          </div>
          <Textarea readOnly value={codeForTab(codeTab, state)} className="min-h-[360px] font-mono text-xs" />
        </div>
        <div className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <h3 className="text-base font-black text-[var(--color-text)]">Helpful warnings</h3>
          {warnings.map((message, index) => (
            <div key={`${message.message}-${index}`} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
              <Badge variant={message.type === "warning" ? "warning" : message.type === "error" ? "danger" : "soft"}>{message.type}</Badge>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{message.message}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Best for" text="Cards, avatars, app icons, product images, hero decorations, organic brand shapes, and quick UI experiments." />
        <InfoCard title="What it teaches" text="Simple four-value radius syntax, advanced slash syntax, percentage radii, and when CSS blobs are enough versus SVG." />
        <InfoCard title="Export formats" text="Copy CSS, semantic HTML, React JSX, and a Tailwind-style arbitrary radius starter for modern utility workflows." />
      </section>
    </div>
  );
}

function PresetGallery({ onApply }: { onApply: (state: BorderRadiusState) => void }) {
  return (
    <div className="space-y-3 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3 lg:max-h-[520px] lg:overflow-y-auto">
      <h3 className="text-sm font-black text-[var(--color-text)]">Presets</h3>
      {BORDER_RADIUS_PRESETS.map((preset) => (
        <button key={preset.id} type="button" onClick={() => onApply(preset.state)} className="grid w-full grid-cols-[54px_minmax(0,1fr)] gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-left transition hover:border-[var(--color-accent)]">
          <span className="h-14 w-14 shadow-sm" style={{ borderRadius: getBorderRadiusValue(preset.state), background: backgroundValue(preset.state) }} />
          <span>
            <span className="flex items-center gap-2"><span className="text-sm font-black text-[var(--color-text)]">{preset.name}</span><Badge variant="outline">{preset.category}</Badge></span>
            <span className="mt-1 block text-xs leading-5 text-[var(--color-text-soft)]">{preset.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function CornerLabels({ state }: { state: BorderRadiusState }) {
  const labels: Array<[CornerKey, string]> = [
    ["topLeft", "left-3 top-3"],
    ["topRight", "right-3 top-3"],
    ["bottomRight", "bottom-3 right-3"],
    ["bottomLeft", "bottom-3 left-3"],
  ];
  return (
    <>
      {labels.map(([corner, position]) => (
        <span key={corner} className={`absolute ${position} rounded-full bg-white/85 px-2 py-1 text-[10px] font-black text-slate-700 shadow-sm`}>
          {state.locks[corner] ? "🔒 " : ""}{state.advancedValues.horizontal[corner]}/{state.advancedValues.vertical[corner]}
        </span>
      ))}
    </>
  );
}

function RadiusPanel({ state, patchState, setSimpleCorner, setAdvancedCorner, randomizeBlob }: { state: BorderRadiusState; patchState: (patch: Partial<BorderRadiusState>) => void; setSimpleCorner: (corner: CornerKey, value: number) => void; setAdvancedCorner: (group: keyof AdvancedRadiusValues, corner: CornerKey, value: number) => void; randomizeBlob: () => void }) {
  return (
    <div className="space-y-4">
      <Field label="Simple radius unit">
        <Select value={state.simpleUnit} onChange={(event) => patchState({ simpleUnit: event.target.value as BorderRadiusState["simpleUnit"] })}>
          <option value="px">px</option><option value="rem">rem</option><option value="%">%</option><option value="em">em</option>
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(cornerLabels) as CornerKey[]).map((corner) => (
          <Field key={corner} label={`${cornerLabels[corner]} simple`}>
            <Input type="number" min={0} max={state.simpleUnit === "%" ? 100 : 400} value={state.simpleValues[corner]} onChange={(event) => setSimpleCorner(corner, Number(event.target.value))} />
          </Field>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
        <div>
          <h4 className="font-black text-[var(--color-text)]">Advanced elliptical values</h4>
          <p className="text-xs text-[var(--color-text-soft)]">Horizontal values before the slash, vertical values after it.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={randomizeBlob}>Randomize</Button>
      </div>
      <Field label="Advanced radius unit">
        <Select value={state.advancedUnit} onChange={(event) => patchState({ advancedUnit: event.target.value as BorderRadiusState["advancedUnit"] })}>
          <option value="%">%</option><option value="px">px</option><option value="rem">rem</option><option value="em">em</option>
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(cornerLabels) as CornerKey[]).map((corner) => (
          <div key={corner} className="rounded-2xl border border-[var(--color-border)] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-black text-[var(--color-text)]">{cornerLabels[corner]}</p>
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-muted)]">
                <input type="checkbox" checked={state.locks[corner]} onChange={(event) => patchState({ locks: { ...state.locks, [corner]: event.target.checked } })} /> Lock
              </label>
            </div>
            <Field label="X">
              <Input type="number" min={0} max={state.advancedUnit === "%" ? 100 : 400} value={state.advancedValues.horizontal[corner]} onChange={(event) => setAdvancedCorner("horizontal", corner, Number(event.target.value))} />
            </Field>
            <Field label="Y" className="mt-2">
              <Input type="number" min={0} max={state.advancedUnit === "%" ? 100 : 400} value={state.advancedValues.vertical[corner]} onChange={(event) => setAdvancedCorner("vertical", corner, Number(event.target.value))} />
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShapePanel({ state, patchState, patchStyle }: { state: BorderRadiusState; patchState: (patch: Partial<BorderRadiusState>) => void; patchStyle: (patch: Partial<BorderRadiusState["style"]>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Preview context">
        <Select value={state.previewContext} onChange={(event) => patchState({ previewContext: event.target.value as PreviewContext })}>
          <option value="blob">Isolated blob</option><option value="card">Card</option><option value="avatar">Avatar</option><option value="button">Button</option><option value="image">Image mask</option><option value="hero-decoration">Hero decoration</option>
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Width"><Input type="number" min={80} max={800} value={state.style.width} onChange={(event) => patchStyle({ width: clampNumber(Number(event.target.value), 80, 800) })} /></Field>
        <Field label="Height"><Input type="number" min={80} max={800} value={state.style.height} onChange={(event) => patchStyle({ height: clampNumber(Number(event.target.value), 80, 800) })} /></Field>
      </div>
      <Field label="Size unit"><Select value={state.style.sizeUnit} onChange={(event) => patchStyle({ sizeUnit: event.target.value as BorderRadiusState["style"]["sizeUnit"] })}><option value="px">px</option><option value="rem">rem</option></Select></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]"><input type="checkbox" checked={state.showGrid} onChange={(event) => patchState({ showGrid: event.target.checked })} /> Show grid</label>
        <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]"><input type="checkbox" checked={state.showCornerLabels} onChange={(event) => patchState({ showCornerLabels: event.target.checked })} /> Corner labels</label>
      </div>
    </div>
  );
}

function StylePanel({ state, patchStyle }: { state: BorderRadiusState; patchStyle: (patch: Partial<BorderRadiusState["style"]>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Background type"><Select value={state.style.backgroundType} onChange={(event) => patchStyle({ backgroundType: event.target.value as BorderRadiusState["style"]["backgroundType"] })}><option value="solid">Solid</option><option value="linear-gradient">Linear gradient</option><option value="radial-gradient">Radial gradient</option><option value="image">Image</option></Select></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Solid color"><Input type="color" value={state.style.backgroundColor} onChange={(event) => patchStyle({ backgroundColor: event.target.value })} /></Field>
        <Field label="Gradient angle"><Input type="number" min={0} max={360} value={state.style.gradientAngle} onChange={(event) => patchStyle({ gradientAngle: clampNumber(Number(event.target.value), 0, 360) })} /></Field>
        <Field label="Gradient from"><Input type="color" value={state.style.gradientFrom} onChange={(event) => patchStyle({ gradientFrom: event.target.value })} /></Field>
        <Field label="Gradient to"><Input type="color" value={state.style.gradientTo} onChange={(event) => patchStyle({ gradientTo: event.target.value })} /></Field>
      </div>
      <Field label="Image URL"><Input value={state.style.imageUrl} maxLength={300} onChange={(event) => patchStyle({ imageUrl: event.target.value })} /></Field>
      <Field label="Object fit"><Select value={state.style.objectFit} onChange={(event) => patchStyle({ objectFit: event.target.value as BorderRadiusState["style"]["objectFit"] })}><option value="cover">cover</option><option value="contain">contain</option><option value="fill">fill</option></Select></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Border width"><Input type="number" min={0} max={24} value={state.style.borderWidth} onChange={(event) => patchStyle({ borderWidth: clampNumber(Number(event.target.value), 0, 24) })} /></Field>
        <Field label="Border color"><Input type="color" value={state.style.borderColor} onChange={(event) => patchStyle({ borderColor: event.target.value })} /></Field>
      </div>
      <Field label="Border style"><Select value={state.style.borderStyle} onChange={(event) => patchStyle({ borderStyle: event.target.value as BorderRadiusState["style"]["borderStyle"] })}><option value="none">none</option><option value="solid">solid</option><option value="dashed">dashed</option><option value="dotted">dotted</option></Select></Field>
      <Field label="Shadow"><Select value={state.style.shadowPreset} onChange={(event) => patchStyle({ shadowPreset: event.target.value as BorderRadiusState["style"]["shadowPreset"] })}><option value="none">None</option><option value="soft">Soft</option><option value="medium">Medium</option><option value="strong">Strong</option><option value="custom">Custom</option></Select></Field>
      <Field label="Custom shadow"><Input value={state.style.customShadow} onChange={(event) => patchStyle({ customShadow: event.target.value })} /></Field>
    </div>
  );
}

function AnimationPanel({ state, patchAnimation, generateKeyframes }: { state: BorderRadiusState; patchAnimation: (patch: Partial<BorderRadiusState["animation"]>) => void; generateKeyframes: () => void }) {
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]"><input type="checkbox" checked={state.animation.enabled || state.mode === "animated"} onChange={(event) => patchAnimation({ enabled: event.target.checked })} /> Enable animation</label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Duration"><Input type="number" min={2} max={30} value={state.animation.duration} onChange={(event) => patchAnimation({ duration: clampNumber(Number(event.target.value), 2, 30) })} /></Field>
        <Field label="Timing"><Select value={state.animation.timingFunction} onChange={(event) => patchAnimation({ timingFunction: event.target.value as BorderRadiusState["animation"]["timingFunction"] })}><option value="ease">ease</option><option value="ease-in-out">ease-in-out</option><option value="linear">linear</option></Select></Field>
      </div>
      <Field label="Direction"><Select value={state.animation.direction} onChange={(event) => patchAnimation({ direction: event.target.value as BorderRadiusState["animation"]["direction"] })}><option value="alternate">alternate</option><option value="normal">normal</option></Select></Field>
      <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]"><input type="checkbox" checked={state.animation.includeReducedMotion} onChange={(event) => patchAnimation({ includeReducedMotion: event.target.checked })} /> Include reduced-motion CSS</label>
      <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={generateKeyframes}>Generate keyframes</Button>
      <p className="text-xs leading-5 text-[var(--color-text-soft)]">Current keyframe states: {state.animation.keyframes.length}. The generated CSS morphs between valid border-radius shapes.</p>
    </div>
  );
}

function ExportPanel({ state, patchExport }: { state: BorderRadiusState; patchExport: (patch: Partial<BorderRadiusState["exportOptions"]>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Class name"><Input value={state.exportOptions.className} maxLength={60} onChange={(event) => patchExport({ className: event.target.value })} /></Field>
      <Field label="React component name"><Input value={state.exportOptions.componentName} maxLength={60} onChange={(event) => patchExport({ componentName: event.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]"><input type="checkbox" checked={state.exportOptions.includeComments} onChange={(event) => patchExport({ includeComments: event.target.checked })} /> Include comments</label>
      <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]"><input type="checkbox" checked={state.exportOptions.includeDemoStyles} onChange={(event) => patchExport({ includeDemoStyles: event.target.checked })} /> Include demo layout styles</label>
      <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]"><input type="checkbox" checked={state.exportOptions.includeReducedMotion} onChange={(event) => patchExport({ includeReducedMotion: event.target.checked })} /> Include reduced motion snippet</label>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"><h3 className="font-black text-[var(--color-text)]">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{text}</p></div>;
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
