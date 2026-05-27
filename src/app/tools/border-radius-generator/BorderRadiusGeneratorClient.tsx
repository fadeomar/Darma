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
import type { AdvancedRadiusValues, BackgroundType, BorderRadiusMode, BorderRadiusState, CornerLocks, PreviewContext, RadiusCornerValues } from "./types";

const corners = ["topLeft", "topRight", "bottomRight", "bottomLeft"] as const;
type CornerKey = (typeof corners)[number];

const modes: BorderRadiusMode[] = ["simple", "advanced", "blob", "image", "animated"];
const contexts: PreviewContext[] = ["blob", "card", "avatar", "button", "image", "hero-decoration"];
const backgrounds: BackgroundType[] = ["solid", "linear-gradient", "radial-gradient", "image"];

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/([A-Z])/g, " $1").trim();
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
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

function backgroundValue(state: BorderRadiusState) {
  const { style } = state;
  if (style.backgroundType === "solid") return style.backgroundColor;
  if (style.backgroundType === "radial-gradient") return `radial-gradient(circle at 30% 25%, ${style.gradientFrom}, ${style.gradientTo})`;
  if (style.backgroundType === "image") return `url("${style.imageUrl}") center / ${style.objectFit} no-repeat`;
  return `linear-gradient(${style.gradientAngle}deg, ${style.gradientFrom}, ${style.gradientTo})`;
}

function shadowValue(state: BorderRadiusState) {
  const preset = state.style.shadowPreset;
  if (preset === "none") return "none";
  if (preset === "soft") return "0 18px 50px rgb(15 23 42 / 0.16)";
  if (preset === "medium") return "0 24px 80px rgb(15 23 42 / 0.22)";
  if (preset === "strong") return "0 34px 110px rgb(15 23 42 / 0.32)";
  return state.style.customShadow || "0 24px 80px rgb(15 23 42 / 0.22)";
}

function CheckboxRow({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm text-[var(--color-text)]">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
    </label>
  );
}

export default function BorderRadiusGeneratorClient() {
  const [state, setState] = useState<BorderRadiusState>(() => createDefaultBorderRadiusState());

  const css = useMemo(() => generateBorderRadiusCss(state), [state]);
  const html = useMemo(() => generateBorderRadiusHtml(state), [state]);
  const jsx = useMemo(() => generateBorderRadiusJsx(state), [state]);
  const tailwind = useMemo(() => generateTailwindStarter(state), [state]);
  const radiusValue = useMemo(() => getBorderRadiusValue(state), [state]);
  const warnings = useMemo<WarningMessage[]>(
    () =>
      validateBorderRadiusState(state).map((message, index) => ({
        id: `${message.field ?? "radius"}-${index}`,
        severity: message.type === "error" ? "danger" : message.type,
        message: message.message,
      })),
    [state],
  );

  const tabs = useMemo<CodeOutputTab[]>(
    () => [
      { id: "css", label: "CSS", language: "css", filename: "border-radius.css", code: css },
      { id: "html", label: "HTML", language: "html", filename: "border-radius.html", code: html },
      { id: "jsx", label: "React JSX", language: "tsx", filename: "Shape.tsx", code: jsx },
      { id: "tailwind", label: "Tailwind", language: "txt", filename: "border-radius-tailwind.txt", code: tailwind },
    ],
    [css, html, jsx, tailwind],
  );

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

  function patchLock(corner: keyof CornerLocks, value: boolean) {
    setState((current) => ({ ...current, locks: { ...current.locks, [corner]: value } }));
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
      animation: { ...current.animation, enabled: true, keyframes: [current.advancedValues, ...generateAnimationKeyframes(3, current.locks)] },
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

  const previewSlot = (
    <div className="space-y-4">
      <style>{`@keyframes darma-preview-blob { 0% { border-radius: ${formatAdvancedBorderRadius(state.advancedValues, state.advancedUnit)}; } 50% { border-radius: 62% 38% 54% 46% / 42% 58% 42% 58%; } 100% { border-radius: 35% 65% 66% 34% / 58% 40% 60% 42%; } }`}</style>
      <PreviewToolbar
        title="Shape preview"
        description="Preview simple corners, slash syntax, organic blobs, and animated shapes."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Shuffle className="h-4 w-4" />} onClick={randomizeBlob}>Randomize</Button>
            <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => downloadText("border-radius.css", css)}>Download</Button>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <PresetGallery
          presets={BORDER_RADIUS_PRESETS}
          selectedId={state.exportOptions.className}
          onSelect={(_, preset) => setState(preset.state)}
          getId={(preset) => preset.state.exportOptions.className}
          getLabel={(preset) => preset.name}
          getDescription={(preset) => preset.description}
          renderPreview={(preset) => <div className="mx-auto h-16 w-20" style={{ borderRadius: getBorderRadiusValue(preset.state), background: backgroundValue(preset.state) }} />}
          className="lg:grid-cols-1"
        />
        <div className="relative min-h-[520px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[radial-gradient(circle_at_top_left,var(--color-primary-soft),transparent_36%),linear-gradient(135deg,var(--color-preview-bg),var(--color-preview-bg-strong))] p-6">
          {state.showGrid ? <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(15_23_42_/_0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgb(15_23_42_/_0.08)_1px,transparent_1px)] bg-[size:32px_32px]" /> : null}
          <div className="relative flex min-h-[460px] items-center justify-center">
            <div className="relative flex items-center justify-center overflow-hidden" style={previewStyle}>
              {state.previewContext === "card" ? <span className="px-6 text-center text-lg font-black text-[var(--color-text-primary)]">Modern card</span> : null}
              {state.previewContext === "button" ? <span className="px-6 text-center text-base font-black text-white">Button shape</span> : null}
              {state.previewContext === "hero-decoration" ? <span className="text-5xl">✦</span> : null}
              {state.showCornerLabels ? <CornerLabels state={state} /> : null}
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-white/60 bg-white/80 p-3 text-xs font-bold text-[var(--color-text-secondary)] shadow-sm backdrop-blur dark:border-[var(--color-code-border)] dark:bg-[var(--color-code-surface)]/75 dark:text-[var(--color-text-secondary)]">
            <span>{state.style.width}{state.style.sizeUnit} × {state.style.height}{state.style.sizeUnit}</span>
            <span>{labelize(state.previewContext)}</span>
            <span>{radiusValue}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const controlsSlot = (
    <ToolControlPanel title="Shape settings" description="Compact controls for radius, blob, size, and output." badge={<Badge variant="soft">{labelize(state.mode)}</Badge>}>
      <ControlSection title="Mode">
        <SegmentedControl ariaLabel="Border radius mode" value={state.mode} onChange={(mode) => patchState({ mode })} options={modes.map((mode) => ({ value: mode, label: labelize(mode) }))} />
      </ControlSection>

      <ControlSection title="Radius values" action={<Button size="sm" variant="secondary" onClick={randomizeBlob}>Randomize</Button>}>
        {state.mode === "simple" ? (
          <>
            <Field label="Unit" density="compact"><Select size="sm" width="compact" value={state.simpleUnit} onChange={(event) => patchState({ simpleUnit: event.target.value as BorderRadiusState["simpleUnit"] })}><option value="px">px</option><option value="%">%</option><option value="rem">rem</option><option value="em">em</option></Select></Field>
            <ControlGrid columns={2}>
              {corners.map((corner) => <NumberField key={corner} label={labelize(corner)} value={state.simpleValues[corner]} min={0} max={state.simpleUnit === "%" ? 100 : 400} unit={state.simpleUnit} onChange={(value) => setSimpleCorner(corner, value)} />)}
            </ControlGrid>
          </>
        ) : (
          <>
            <Field label="Unit" density="compact"><Select size="sm" width="compact" value={state.advancedUnit} onChange={(event) => patchState({ advancedUnit: event.target.value as BorderRadiusState["advancedUnit"] })}><option value="%">%</option><option value="px">px</option><option value="rem">rem</option><option value="em">em</option></Select></Field>
            <ControlGrid columns={2}>
              {corners.map((corner) => <NumberField key={`h-${corner}`} label={`H ${labelize(corner)}`} value={state.advancedValues.horizontal[corner]} min={0} max={state.advancedUnit === "%" ? 100 : 400} unit={state.advancedUnit} onChange={(value) => setAdvancedCorner("horizontal", corner, value)} />)}
              {corners.map((corner) => <NumberField key={`v-${corner}`} label={`V ${labelize(corner)}`} value={state.advancedValues.vertical[corner]} min={0} max={state.advancedUnit === "%" ? 100 : 400} unit={state.advancedUnit} onChange={(value) => setAdvancedCorner("vertical", corner, value)} />)}
            </ControlGrid>
          </>
        )}
      </ControlSection>

      <ControlSection title="Size and preview">
        <ControlGrid columns={2}>
          <SliderNumberField label="Width" value={state.style.width} min={40} max={720} unit={state.style.sizeUnit} onChange={(value) => patchStyle({ width: value })} />
          <SliderNumberField label="Height" value={state.style.height} min={40} max={720} unit={state.style.sizeUnit} onChange={(value) => patchStyle({ height: value })} />
        </ControlGrid>
        <ControlGrid columns={2}>
          <Field label="Context" density="compact"><Select size="sm" value={state.previewContext} onChange={(event) => patchState({ previewContext: event.target.value as PreviewContext })}>{contexts.map((context) => <option key={context} value={context}>{labelize(context)}</option>)}</Select></Field>
          <Field label="Background" density="compact"><Select size="sm" value={state.style.backgroundType} onChange={(event) => patchStyle({ backgroundType: event.target.value as BackgroundType })}>{backgrounds.map((background) => <option key={background} value={background}>{labelize(background)}</option>)}</Select></Field>
        </ControlGrid>
        <ControlGrid columns={2}>
          <CheckboxRow label="Grid" checked={state.showGrid} onChange={(checked) => patchState({ showGrid: checked })} />
          <CheckboxRow label="Corner labels" checked={state.showCornerLabels} onChange={(checked) => patchState({ showCornerLabels: checked })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Appearance">
        <ControlGrid columns={2}>
          <ColorField label="Solid" value={state.style.backgroundColor} onChange={(value) => patchStyle({ backgroundColor: value })} />
          <ColorField label="Gradient from" value={state.style.gradientFrom} onChange={(value) => patchStyle({ gradientFrom: value })} />
          <ColorField label="Gradient to" value={state.style.gradientTo} onChange={(value) => patchStyle({ gradientTo: value })} />
          <NumberField label="Border" value={state.style.borderWidth} min={0} max={24} unit="px" onChange={(value) => patchStyle({ borderWidth: value, borderStyle: value > 0 ? "solid" : "none" })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Animation and export">
        <ControlGrid columns={2}>
          <CheckboxRow label="Animate" checked={state.animation.enabled} onChange={(checked) => patchAnimation({ enabled: checked })} />
          <CheckboxRow label="Reduced motion CSS" checked={state.animation.includeReducedMotion} onChange={(checked) => patchAnimation({ includeReducedMotion: checked })} />
        </ControlGrid>
        <ControlGrid columns={2}>
          <NumberField label="Duration" value={state.animation.duration} min={1} max={30} unit="s" onChange={(value) => patchAnimation({ duration: value })} />
          <Button variant="secondary" onClick={generateKeyframes}>Generate keyframes</Button>
        </ControlGrid>
        <Field label="CSS class" density="compact"><Input size="sm" value={state.exportOptions.className} onChange={(event) => patchExport({ className: event.target.value })} /></Field>
      </ControlSection>
    </ToolControlPanel>
  );

  return (
    <ToolLayoutVisualGenerator
      previewSlot={previewSlot}
      controlsSlot={controlsSlot}
      actionsSlot={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={() => setState(createDefaultBorderRadiusState())}>Reset</Button>
          <CopyButton text={css}>Copy CSS</CopyButton>
        </div>
      }
      codeSlot={
        <div className="space-y-4">
          <WarningPanel title="Helpful warnings" messages={warnings} />
          <CodeOutputPanel title="Generated radius code" description="Copy CSS, HTML, React JSX, or a Tailwind arbitrary radius starter." tabs={tabs} defaultTab="css" onDownload={(tab) => downloadText(tab.filename ?? `${tab.id}.txt`, tab.code)} />
        </div>
      }
    />
  );
}

function CornerLabels({ state }: { state: BorderRadiusState }) {
  const values: RadiusCornerValues = state.mode === "simple" ? state.simpleValues : state.advancedValues.horizontal;
  return (
    <>
      {corners.map((corner) => (
        <span
          key={corner}
          className="absolute rounded-full bg-black/60 px-2 py-1 text-[10px] font-black text-white"
          style={{
            top: corner.includes("top") ? 8 : undefined,
            bottom: corner.includes("bottom") ? 8 : undefined,
            left: corner.includes("Left") ? 8 : undefined,
            right: corner.includes("Right") ? 8 : undefined,
          }}
        >
          {values[corner]}
        </span>
      ))}
    </>
  );
}
