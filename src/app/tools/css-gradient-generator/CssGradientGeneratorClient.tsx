"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Shuffle } from "lucide-react";
import { Badge, Button, CopyButton, Input, Select } from "@/components/ui";
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
  DEFAULT_GRADIENT,
  GRADIENT_PRESETS,
  buildCssSnippet,
  buildGradientCss,
  buildTailwindArbitraryClass,
  clamp,
  createRandomGradient,
  createStop,
  normalizeHexColor,
  reverseStops,
  sortStops,
  validateGradient,
  type GradientState,
  type GradientStop,
} from "./gradient";

function safeColorInputValue(value: string) {
  const normalized = normalizeHexColor(value);
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : "#ffffff";
}

function getPresetId(state: GradientState) {
  return GRADIENT_PRESETS.find((preset) => JSON.stringify(preset.state) === JSON.stringify(state))?.label;
}

export default function CssGradientGeneratorClient() {
  const [state, setState] = useState<GradientState>(DEFAULT_GRADIENT);

  const validation = useMemo(() => validateGradient(state), [state]);
  const gradientCss = useMemo(() => (validation.ok ? buildGradientCss(state) : ""), [state, validation.ok]);
  const cssSnippet = useMemo(() => (validation.ok ? buildCssSnippet(state) : ""), [state, validation.ok]);
  const tailwindClass = useMemo(() => (validation.ok ? buildTailwindArbitraryClass(state) : ""), [state, validation.ok]);
  const sortedStops = useMemo(() => sortStops(state.stops), [state.stops]);
  const selectedPresetId = useMemo(() => getPresetId(state), [state]);

  const codeTabs = useMemo<CodeOutputTab[]>(() => [
    { id: "background", label: "Background", language: "css", filename: "gradient-background.css", code: `background: ${gradientCss};` },
    { id: "css", label: "CSS class", language: "css", filename: "gradient.css", code: cssSnippet },
    { id: "tailwind", label: "Tailwind", language: "txt", filename: "gradient-tailwind.txt", code: tailwindClass },
  ], [cssSnippet, gradientCss, tailwindClass]);

  const warnings = useMemo<WarningMessage[]>(() => {
    if (validation.ok) return [];
    return validation.errors.map((message, index) => ({ id: `gradient-error-${index}`, severity: "danger", message }));
  }, [validation]);

  function updateStop(id: string, patch: Partial<GradientStop>) {
    setState((current) => ({
      ...current,
      stops: current.stops.map((stop) =>
        stop.id === id
          ? {
              ...stop,
              ...patch,
              position: patch.position === undefined ? stop.position : clamp(patch.position, 0, 100),
            }
          : stop,
      ),
    }));
  }

  function removeStop(id: string) {
    setState((current) => ({
      ...current,
      stops: current.stops.length <= 2 ? current.stops : current.stops.filter((stop) => stop.id !== id),
    }));
  }

  function addStop() {
    setState((current) => ({
      ...current,
      stops: current.stops.length >= 6 ? current.stops : [...current.stops, createStop("#ffffff", 50)],
    }));
  }

  const previewSlot = (
    <div className="space-y-4">
      <PreviewToolbar
        title="Gradient preview"
        description="Preview the generated CSS background on a realistic surface."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" leftIcon={<Shuffle className="h-4 w-4" />} onClick={() => setState(createRandomGradient())}>
              Random
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />} disabled={state.stops.length < 2} onClick={() => setState((current) => ({ ...current, stops: reverseStops(current.stops) }))}>
              Reverse
            </Button>
          </div>
        }
      />

      <div
        className="relative flex min-h-[520px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-preview-border)] p-6 shadow-[inset_0_1px_0_var(--color-border-subtle)]"
        style={{ background: validation.ok ? gradientCss : "var(--color-preview-bg-strong)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.32),transparent_38%)]" />
        <div className="relative mt-auto max-w-md rounded-[var(--radius-lg)] border border-white/40 bg-white/78 p-4 shadow-[var(--shadow-md)] backdrop-blur dark:border-white/10 dark:bg-black/36">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
            {validation.ok ? "Ready to copy" : "Needs attention"}
          </p>
          <p className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)] dark:text-white">CSS Gradient Generator</p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
            Tune colors, angle, radial shape, and stops, then copy clean CSS for your UI.
          </p>
        </div>
      </div>
    </div>
  );

  const controlsSlot = (
    <ToolControlPanel title="Gradient settings" description="Edit type, direction, stops, and presets." badge={<Badge variant={validation.ok ? "success" : "warning"}>{validation.ok ? "Ready" : "Check"}</Badge>}>
      <ControlSection title="Presets">
        <PresetGallery
          presets={GRADIENT_PRESETS}
          selectedId={selectedPresetId}
          onSelect={(_, preset) => setState(preset.state)}
          getId={(preset) => preset.label}
          getLabel={(preset) => preset.label}
          renderPreview={(preset) => <div className="h-full w-full" style={{ background: buildGradientCss(preset.state) }} />}
          compact
        />
      </ControlSection>

      <ControlSection title="Gradient type" meta={state.type}>
        <SegmentedControl
          ariaLabel="Gradient type"
          value={state.type}
          onChange={(type) => setState((current) => ({ ...current, type }))}
          options={[{ value: "linear", label: "Linear" }, { value: "radial", label: "Radial" }]}
          fullWidth
        />
        {state.type === "linear" ? (
          <SliderNumberField label="Angle" value={state.angle} min={0} max={360} unit="deg" onChange={(angle) => setState((current) => ({ ...current, angle }))} />
        ) : (
          <ControlGrid columns={1}>
            <label className="grid gap-1.5">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">Shape</span>
              <Select size="sm" value={state.shape} onChange={(event) => setState((current) => ({ ...current, shape: event.target.value === "ellipse" ? "ellipse" : "circle" }))}>
                <option value="circle">Circle</option>
                <option value="ellipse">Ellipse</option>
              </Select>
            </label>
          </ControlGrid>
        )}
      </ControlSection>

      <ControlSection title="Color stops" meta={`${state.stops.length}/6`} action={<Button size="sm" variant="secondary" onClick={addStop} disabled={state.stops.length >= 6}>Add stop</Button>}>
        <div className="space-y-3">
          {sortedStops.map((stop, index) => (
            <div key={stop.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-xs)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-8 w-8 shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-border-default)]" style={{ backgroundColor: safeColorInputValue(stop.color) }} />
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Stop {index + 1}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{stop.position}% · {normalizeHexColor(stop.color)}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" disabled={state.stops.length <= 2} onClick={() => removeStop(stop.id)}>
                  Remove
                </Button>
              </div>
              <ControlGrid columns={2}>
                <ColorField label="Color" value={stop.color} onChange={(color) => updateStop(stop.id, { color })} />
                <NumberField label="Position" value={stop.position} min={0} max={100} unit="%" onChange={(position) => updateStop(stop.id, { position })} />
              </ControlGrid>
            </div>
          ))}
        </div>
      </ControlSection>

      <ControlSection title="Manual value" compact>
        <Input readOnly size="sm" value={validation.ok ? gradientCss : "Fix validation errors to generate CSS"} className="font-mono text-[11px]" aria-label="Current gradient CSS value" />
      </ControlSection>
    </ToolControlPanel>
  );

  return (
    <ToolLayoutVisualGenerator
      previewSlot={previewSlot}
      controlsSlot={controlsSlot}
      actionsSlot={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setState(DEFAULT_GRADIENT)}>Reset</Button>
          <CopyButton text={cssSnippet} disabled={!validation.ok}>Copy CSS</CopyButton>
          <CopyButton text={tailwindClass} variant="secondary" disabled={!validation.ok}>Copy Tailwind</CopyButton>
        </div>
      }
      codeSlot={
        <div className="space-y-4">
          <WarningPanel title="Gradient validation" messages={warnings} />
          <CodeOutputPanel title="Generated gradient code" description="Copy CSS background, a reusable class, or a Tailwind arbitrary class." tabs={codeTabs} defaultTab="css" emptyMessage="Fix validation errors to generate code." />
        </div>
      }
    />
  );
}
