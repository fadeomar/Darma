"use client";

import { useMemo, useState } from "react";
import { Download, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge, Button, CopyButton, Field, Input, Select, Slider, Tabs, Textarea } from "@/components/ui";
import {
  generateClampValue,
  generateCssDeclaration,
  generateCssVariable,
  generateCssVariables,
  generateScopedCss,
  generateScssMap,
  generateTailwindTheme,
  generateTokenJson,
  getClampHealth,
  getComputedFluidValue,
  getSampleValues,
  inferPreviewMode,
  validateClampInput,
} from "./clamp";
import { DEFAULT_CLAMP_INPUT, DEFAULT_TOKENS, PRESET_INPUTS, PROPERTY_PRESETS, SPACING_TOKENS, TYPOGRAPHY_TOKENS } from "./presets";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import type { ClampExportTab, ClampInput, ClampPropertyPreset, ClampToken, ClampUnit } from "./types";

type Mode = "single" | "tokens";

const TOKEN_NAME_SHORTCUTS = ["xs", "sm", "base", "lg", "xl", "2xl", "hero"];

function numberOrFallback(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/css;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function clampClassName(property: string) {
  return property.trim().replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "fluid-element";
}

function NumericField({ label, value, onChange, min, step = "0.125", suffix, description }: { label: string; value: number; onChange: (value: number) => void; min?: number; step?: string; suffix?: string; description?: string }) {
  return (
    <Field label={label} description={description}>
      <div className="relative">
        <Input type="number" min={min} step={step} value={value} onChange={(event) => onChange(numberOrFallback(event.target.value, value))} className={suffix ? "pr-12" : undefined} />
        {suffix ? <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-[var(--color-text-soft)]">{suffix}</span> : null}
      </div>
    </Field>
  );
}

function SummaryCard({ label, value, note, tone = "default" }: { label: string; value: string; note?: string; tone?: "default" | "good" | "warning" | "danger" }) {
  const toneClass =
    tone === "good"
      ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)]"
      : tone === "warning"
        ? "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)]"
        : tone === "danger"
          ? "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]"
          : "border-[var(--color-border)] bg-[var(--color-bg-soft)]";

  return (
    <div className={`min-w-0 rounded-[var(--radius-md)] border p-3 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-soft)]">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-black text-[var(--color-text)]" title={value}>{value}</p>
      {note ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-muted)]">{note}</p> : null}
    </div>
  );
}

function PreviewSample({ input, computedValue }: { input: ClampInput; computedValue: number }) {
  const previewMode = inferPreviewMode(input.property);
  const value = `${computedValue}${input.unit}`;

  if (previewMode === "text") {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Typography preview</p>
        <p className="mt-3 max-w-xl font-black leading-[1.05] text-[var(--color-text)]" style={{ fontSize: value }}>
          Scale readable headings without breakpoint jumps.
        </p>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--color-text-muted)]">
          The value changes smoothly between the selected viewport boundaries while respecting the min and max limits.
        </p>
      </div>
    );
  }

  if (previewMode === "spacing") {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Spacing preview</p>
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-soft)]" style={{ padding: value }}>
          <div className="rounded-[var(--radius-sm)] bg-[var(--color-primary)] p-3 text-sm font-bold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)]">Fluid inner space</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Size preview</p>
      <div className="h-16 rounded-[var(--radius-md)] bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent,#8b5cf6))] shadow-[var(--shadow-soft)]" style={{ width: value, maxWidth: "100%" }} />
    </div>
  );
}

export default function CssClampClient() {
  const [input, setInput] = useState<ClampInput>(DEFAULT_CLAMP_INPUT);
  const [preset, setPreset] = useState<ClampPropertyPreset>("font-size");
  const [customProperty, setCustomProperty] = useState("font-size");
  const [viewport, setViewport] = useState(768);
  const [outputTab, setOutputTab] = useState<ClampExportTab>("css");
  const [mode, setMode] = useState<Mode>("single");
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [tokens, setTokens] = useState<ClampToken[]>(DEFAULT_TOKENS);

  const validation = useMemo(() => validateClampInput(input), [input]);
  const result = useMemo(() => {
    if (!validation.valid) return null;
    try {
      return generateClampValue(input);
    } catch {
      return null;
    }
  }, [input, validation.valid]);

  const computedValue = useMemo(() => (validation.valid ? getComputedFluidValue(input, viewport) : 0), [input, validation.valid, viewport]);
  const sampleValues = useMemo(() => (validation.valid ? getSampleValues(input) : []), [input, validation.valid]);
  const health = useMemo(() => getClampHealth(input, validation), [input, validation]);
  const cssDeclaration = result ? generateCssDeclaration(input.property, result) : "";
  const cssVariable = result ? `:root {\n  ${generateCssVariable(`fluid-${input.property}`, result)}\n}` : "";
  const classCss = result ? generateScopedCss(input, result, clampClassName(input.property)) : "";
  const tokenCss = useMemo(() => {
    try {
      return generateCssVariables(tokens);
    } catch {
      return "";
    }
  }, [tokens]);
  const tailwindOutput = useMemo(() => {
    try {
      return generateTailwindTheme(tokens);
    } catch {
      return "";
    }
  }, [tokens]);
  const jsonOutput = useMemo(() => {
    try {
      return generateTokenJson(mode === "tokens" ? tokens : [{ ...input, name: `fluid-${input.property}` }]);
    } catch {
      return "";
    }
  }, [input, mode, tokens]);
  const scssOutput = useMemo(() => {
    try {
      return generateScssMap(mode === "tokens" ? tokens : [{ ...input, name: `fluid-${input.property}` }]);
    } catch {
      return "";
    }
  }, [input, mode, tokens]);

  const outputMap: Record<ClampExportTab, string> = {
    css: mode === "single" ? `${cssDeclaration}\n\n${classCss}` : tokenCss,
    variables: mode === "single" ? cssVariable : tokenCss,
    tokens: tokenCss,
    tailwind: tailwindOutput,
    json: jsonOutput,
    scss: scssOutput,
  };
  const output = outputMap[outputTab];

  function updateInput<K extends keyof ClampInput>(key: K, value: ClampInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function updatePreset(nextPreset: ClampPropertyPreset) {
    setPreset(nextPreset);
    const nextProperty = nextPreset === "spacing" ? "padding-block" : nextPreset === "width" ? "width" : nextPreset === "font-size" ? "font-size" : customProperty;
    updateInput("property", nextProperty);
  }

  function updateCustomProperty(value: string) {
    setCustomProperty(value);
    if (preset === "custom") updateInput("property", value || "custom-property");
  }

  function loadPreset(nextInput: ClampInput) {
    setInput(nextInput);
    setPreset(nextInput.property === "font-size" ? "font-size" : nextInput.property === "width" ? "width" : nextInput.property.includes("inline") ? "width" : "spacing");
    setCustomProperty(nextInput.property);
    setViewport(Math.round((nextInput.minViewport + nextInput.maxViewport) / 2));
    setMode("single");
  }

  function addToken() {
    setTokens((current) => [...current, { ...input, name: `${input.property.replace(/[^a-z0-9]+/gi, "-")}-${current.length + 1}` }]);
  }

  function updateToken(index: number, patch: Partial<ClampToken>) {
    setTokens((current) => current.map((token, tokenIndex) => (tokenIndex === index ? { ...token, ...patch } : token)));
  }

  function removeToken(index: number) {
    setTokens((current) => current.filter((_, tokenIndex) => tokenIndex !== index));
  }

  function loadTypographyTokens() {
    setTokens(TYPOGRAPHY_TOKENS);
    setMode("tokens");
    setOutputTab("tokens");
  }

  function loadSpacingTokens() {
    setTokens(SPACING_TOKENS);
    setMode("tokens");
    setOutputTab("tokens");
  }

  const minViewport = Math.max(1, input.minViewport);
  const maxViewport = Math.max(minViewport + 1, input.maxViewport);

  const previewSlot = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-[var(--color-text)]">Responsive preview</h3>
            <Badge variant={validation.valid ? "success" : "danger"}>{validation.valid ? "Ready" : "Needs changes"}</Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Viewport <span className="font-mono font-bold">{viewport}px</span> · value <span className="font-mono font-bold">{computedValue}{input.unit}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[input.minViewport, Math.round((input.minViewport + input.maxViewport) / 2), input.maxViewport].map((point) => (
            <Button key={point} variant="secondary" size="sm" onClick={() => setViewport(point)}>{point}px</Button>
          ))}
        </div>
      </div>

      <Slider min={minViewport} max={maxViewport} value={Math.min(Math.max(viewport, minViewport), maxViewport)} onChange={(event) => setViewport(Number(event.target.value))} />

      <PreviewSample input={input} computedValue={computedValue} />

      <div className="grid gap-2 sm:grid-cols-5">
        {sampleValues.map((item) => (
          <div key={item.viewport} className="min-w-0 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-2 text-center">
            <p className="truncate font-mono text-xs font-black text-[var(--color-text)]">{item.value}</p>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-soft)]">{item.viewport}px</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Range" value={`${input.minViewport}px → ${input.maxViewport}px`} note="Viewport boundaries" />
        <SummaryCard label="Value" value={`${input.minValue}${input.unit} → ${input.maxValue}${input.unit}`} note={`${input.property} output`} />
        <SummaryCard label="Current" value={`${computedValue}${input.unit}`} note={`${viewport}px preview`} />
        <SummaryCard label="Check" value={health.label} note={health.notes[0]} tone={health.tone} />
      </div>

      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4 text-sm">
          {validation.errors.map((error) => <p key={error} className="font-bold text-[var(--color-danger-text)]">{error}</p>)}
          {validation.warnings.map((warning) => <p key={warning} className="font-semibold text-[var(--color-warning-text)]">{warning}</p>)}
        </div>
      )}
    </div>
  );

  const controlsSlot = (
    <div className="space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-[var(--color-text)]">CSS Clamp Generator</h2>
              <Badge variant="success">Browser-only</Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              Generate fluid CSS for typography, spacing, widths, and reusable design tokens.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Tabs
            value={mode}
            onChange={(value) => setMode(value as Mode)}
            ariaLabel="Clamp mode"
            items={[{ value: "single", label: "Single" }, { value: "tokens", label: "Tokens" }]}
          />
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-3">
          <h3 className="font-black text-[var(--color-text)]">Quick presets</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Start from a common production range.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {(showAllPresets ? PRESET_INPUTS : PRESET_INPUTS.slice(0, 6)).map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => loadPreset(item.input)}
              className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-strong)]"
            >
              <span className="block truncate text-sm font-black text-[var(--color-text)]">{item.label}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">{item.description}</span>
            </button>
          ))}
        </div>
        {PRESET_INPUTS.length > 6 ? (
          <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => setShowAllPresets((value) => !value)}>
            {showAllPresets ? "Show fewer starters" : `Show all ${PRESET_INPUTS.length} starters`}
          </Button>
        ) : null}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-[var(--color-text)]">Fluid value controls</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Set viewport and value boundaries.</p>
          </div>
          <Tabs
            value={input.unit}
            onChange={(value) => updateInput("unit", value as ClampUnit)}
            ariaLabel="Output unit"
            items={[{ value: "rem", label: "rem" }, { value: "px", label: "px" }]}
          />
        </div>

        <div className="space-y-4">
          <Field label="Preset" description={PROPERTY_PRESETS.find((item) => item.value === preset)?.description}>
            <Select value={preset} onChange={(event) => updatePreset(event.target.value as ClampPropertyPreset)}>
              {PROPERTY_PRESETS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </Select>
          </Field>

          <Field label="CSS property" description={preset === "custom" ? "Type any CSS property name." : "Switch to custom to edit this field."}>
            <Input value={preset === "custom" ? customProperty : input.property} onChange={(event) => updateCustomProperty(event.target.value)} disabled={preset !== "custom"} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <NumericField label="Min viewport" value={input.minViewport} min={1} step="1" suffix="px" onChange={(value) => updateInput("minViewport", value)} />
            <NumericField label="Max viewport" value={input.maxViewport} min={1} step="1" suffix="px" onChange={(value) => updateInput("maxViewport", value)} />
            <NumericField label="Min value" value={input.minValue} min={0} suffix={input.unit} onChange={(value) => updateInput("minValue", value)} />
            <NumericField label="Max value" value={input.maxValue} min={0} suffix={input.unit} onChange={(value) => updateInput("maxValue", value)} />
          </div>
          <NumericField label="Root font size" value={input.rootFontSize} min={1} step="1" suffix="px" onChange={(value) => updateInput("rootFontSize", value)} description="Used for rem ↔ px calculations." />
        </div>
      </section>
    </div>
  );

  const codeSlot = (
    <div className="space-y-5">
      {mode === "tokens" && (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-[var(--color-text)]">Token scale</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Build a fluid variable scale without creating one clamp manually at a time.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={loadTypographyTokens}>Typography</Button>
              <Button variant="secondary" onClick={loadSpacingTokens}>Spacing</Button>
              <Button variant="secondary" onClick={() => setTokens(DEFAULT_TOKENS)} leftIcon={<RefreshCw className="h-4 w-4" />}>Reset</Button>
              <Button onClick={addToken} leftIcon={<Plus className="h-4 w-4" />}>Add</Button>
            </div>
          </div>

          <div className="space-y-3">
            {tokens.map((token, index) => (
              <div key={`${token.name}-${index}`} className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3 lg:grid-cols-[minmax(120px,1.2fr)_0.8fr_0.8fr_0.9fr_0.9fr_auto]">
                <Input aria-label="Token name" value={token.name} onChange={(event) => updateToken(index, { name: event.target.value })} />
                <Input type="number" step="0.125" aria-label="Token min value" value={token.minValue} onChange={(event) => updateToken(index, { minValue: numberOrFallback(event.target.value, token.minValue) })} />
                <Input type="number" step="0.125" aria-label="Token max value" value={token.maxValue} onChange={(event) => updateToken(index, { maxValue: numberOrFallback(event.target.value, token.maxValue) })} />
                <Input type="number" step="1" aria-label="Token min viewport" value={token.minViewport} onChange={(event) => updateToken(index, { minViewport: numberOrFallback(event.target.value, token.minViewport) })} />
                <Input type="number" step="1" aria-label="Token max viewport" value={token.maxViewport} onChange={(event) => updateToken(index, { maxViewport: numberOrFallback(event.target.value, token.maxViewport) })} />
                <Button size="icon" variant="ghost" onClick={() => removeToken(index)} leftIcon={<Trash2 className="h-4 w-4" />} aria-label={`Remove ${token.name}`}>Remove</Button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {TOKEN_NAME_SHORTCUTS.map((name, index) => (
              <Button key={name} variant="secondary" onClick={() => updateToken(index, { name: `text-${name}` })} disabled={!tokens[index]}>
                text-{name}
              </Button>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-[var(--color-text)]">Production export</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Copy CSS, variables, Tailwind snippets, or token JSON.</p>
          </div>
          <Tabs
            value={outputTab}
            onChange={(value) => setOutputTab(value as ClampExportTab)}
            ariaLabel="Output format"
            className="max-w-full overflow-x-auto"
            items={[
              { value: "css", label: "CSS" },
              { value: "variables", label: "Vars" },
              { value: "tokens", label: "Tokens" },
              { value: "tailwind", label: "Tailwind" },
              { value: "json", label: "JSON" },
              { value: "scss", label: "SCSS" },
            ]}
          />
        </div>
        <Textarea value={output} readOnly rows={9} variant="output" className="font-mono text-xs" />
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={output}>Copy output</CopyButton>
          <Button variant="secondary" onClick={() => downloadFile("darma-fluid-clamp.css", output)} leftIcon={<Download className="h-4 w-4" />}>
            Download
          </Button>
        </div>
        {result && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Min" value={result.min} />
            <SummaryCard label="Preferred" value={result.preferred} />
            <SummaryCard label="Max" value={result.max} />
          </div>
        )}
      </section>
    </div>
  );

  return (
    <ToolLayoutVisualGenerator
      previewSlot={previewSlot}
      controlsSlot={controlsSlot}
      codeSlot={codeSlot}
      actionsPlacement="under-preview"
    />
  );
}
