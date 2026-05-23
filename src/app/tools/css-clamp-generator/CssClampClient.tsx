"use client";

import { useMemo, useState } from "react";
import { Download, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge, Button, CopyButton, Field, Input, Select, Slider, Tabs, Textarea } from "@/components/ui";
import {
  generateClampValue,
  generateCssDeclaration,
  generateCssVariable,
  generateCssVariables,
  getComputedFluidValue,
  validateClampInput,
} from "./clamp";
import { DEFAULT_CLAMP_INPUT, DEFAULT_TOKENS, PRESET_INPUTS, PROPERTY_PRESETS } from "./presets";
import type { ClampInput, ClampPropertyPreset, ClampToken, ClampUnit } from "./types";

type OutputTab = "declaration" | "variable" | "tokens";

const TOKEN_NAMES = ["xs", "sm", "md", "lg", "xl", "2xl"];

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

function NumericField({ label, value, onChange, min, step = "0.125", description }: { label: string; value: number; onChange: (value: number) => void; min?: number; step?: string; description?: string }) {
  return (
    <Field label={label} description={description}>
      <Input type="number" min={min} step={step} value={value} onChange={(event) => onChange(numberOrFallback(event.target.value, value))} />
    </Field>
  );
}

export default function CssClampClient() {
  const [input, setInput] = useState<ClampInput>(DEFAULT_CLAMP_INPUT);
  const [preset, setPreset] = useState<ClampPropertyPreset>("font-size");
  const [customProperty, setCustomProperty] = useState("font-size");
  const [viewport, setViewport] = useState(768);
  const [outputTab, setOutputTab] = useState<OutputTab>("declaration");
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
  const cssDeclaration = result ? generateCssDeclaration(input.property, result) : "";
  const cssVariable = result ? `:root {\n  ${generateCssVariable(`fluid-${input.property}`, result)}\n}` : "";
  const tokenCss = useMemo(() => {
    try {
      return generateCssVariables(tokens);
    } catch {
      return "";
    }
  }, [tokens]);

  const output = outputTab === "tokens" ? tokenCss : outputTab === "variable" ? cssVariable : cssDeclaration;

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
    setPreset(nextInput.property === "font-size" ? "font-size" : nextInput.property === "width" ? "width" : "spacing");
    setCustomProperty(nextInput.property);
    setViewport(Math.round((nextInput.minViewport + nextInput.maxViewport) / 2));
  }

  function addToken() {
    const index = tokens.length;
    setTokens((current) => [...current, { ...input, name: `size-${index + 1}` }]);
  }

  function updateToken(index: number, patch: Partial<ClampToken>) {
    setTokens((current) => current.map((token, tokenIndex) => (tokenIndex === index ? { ...token, ...patch } : token)));
  }

  function removeToken(index: number) {
    setTokens((current) => current.filter((_, tokenIndex) => tokenIndex !== index));
  }

  function resetTokens() {
    setTokens(DEFAULT_TOKENS);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[var(--color-text)]">CSS Clamp Generator</h2>
            <Badge variant="success">Browser-only</Badge>
            {validation.valid ? <Badge variant="success">Ready</Badge> : <Badge variant="danger">Needs changes</Badge>}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Generate fluid <code>clamp()</code> values for typography, spacing, and responsive design tokens without writing the math by hand.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_INPUTS.map((item) => (
            <Button key={item.label} variant="secondary" onClick={() => loadPreset(item.input)}>
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_160px]">
        <Field label="Property preset" description={PROPERTY_PRESETS.find((item) => item.value === preset)?.description}>
          <Select value={preset} onChange={(event) => updatePreset(event.target.value as ClampPropertyPreset)}>
            {PROPERTY_PRESETS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
        </Field>

        <Field label="CSS property" description="Used in the generated full declaration.">
          <Input value={preset === "custom" ? customProperty : input.property} onChange={(event) => updateCustomProperty(event.target.value)} disabled={preset !== "custom"} />
        </Field>

        <Field label="Unit" description="rem is recommended for scalable type.">
          <Tabs
            value={input.unit}
            onChange={(value) => updateInput("unit", value as ClampUnit)}
            ariaLabel="Output unit"
            items={[{ value: "rem", label: "rem" }, { value: "px", label: "px" }]}
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <NumericField label="Min viewport" value={input.minViewport} min={1} step="1" onChange={(value) => updateInput("minViewport", value)} description="px" />
        <NumericField label="Max viewport" value={input.maxViewport} min={1} step="1" onChange={(value) => updateInput("maxViewport", value)} description="px" />
        <NumericField label="Min value" value={input.minValue} min={0} onChange={(value) => updateInput("minValue", value)} description={input.unit} />
        <NumericField label="Max value" value={input.maxValue} min={0} onChange={(value) => updateInput("maxValue", value)} description={input.unit} />
        <NumericField label="Root font size" value={input.rootFontSize} min={1} step="1" onChange={(value) => updateInput("rootFontSize", value)} description="px, used for rem math" />
      </div>

      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4 text-sm">
          {validation.errors.map((error) => <p key={error} className="font-bold text-red-600">{error}</p>)}
          {validation.warnings.map((warning) => <p key={warning} className="font-semibold text-amber-700">{warning}</p>)}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-[var(--color-text)]">Output</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Copy a single declaration, a CSS custom property, or the full token set.</p>
            </div>
            <Tabs
              value={outputTab}
              onChange={(value) => setOutputTab(value as OutputTab)}
              ariaLabel="Output format"
              items={[{ value: "declaration", label: "Declaration" }, { value: "variable", label: "CSS variable" }, { value: "tokens", label: "Tokens" }]}
            />
          </div>
          <Textarea value={output} readOnly rows={8} className="font-mono text-sm" />
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={output}>Copy output</CopyButton>
            <Button variant="secondary" onClick={() => downloadFile("darma-fluid-clamp.css", output)} leftIcon={<Download className="h-4 w-4" />}>
              Download CSS
            </Button>
          </div>
          {result && (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-soft)] p-3"><p className="text-xs font-black uppercase text-[var(--color-text-soft)]">Min</p><p className="font-mono font-black">{result.min}</p></div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-soft)] p-3"><p className="text-xs font-black uppercase text-[var(--color-text-soft)]">Preferred</p><p className="font-mono font-black">{result.preferred}</p></div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-soft)] p-3"><p className="text-xs font-black uppercase text-[var(--color-text-soft)]">Max</p><p className="font-mono font-black">{result.max}</p></div>
            </div>
          )}
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-[var(--color-text)]">Responsive preview</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Viewport: <span className="font-mono font-bold">{viewport}px</span> · Value: <span className="font-mono font-bold">{computedValue}{input.unit}</span></p>
            </div>
          </div>
          <Slider min={input.minViewport} max={input.maxViewport} value={viewport} onChange={(event) => setViewport(Number(event.target.value))} />
          <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            {input.property === "font-size" ? (
              <p className="font-black leading-tight text-[var(--color-text)]" style={{ fontSize: `${computedValue}${input.unit}` }}>
                Fluid typography scales smoothly between your viewport limits.
              </p>
            ) : input.property.includes("gap") || input.property.includes("padding") || input.property.includes("margin") ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-soft)]" style={{ padding: `${computedValue}${input.unit}` }}>
                <div className="rounded-[var(--radius-sm)] bg-[var(--color-primary)] p-3 text-sm font-bold text-[var(--color-primary-text)]">Spacing sample</div>
              </div>
            ) : (
              <div className="h-20 rounded-[var(--radius-md)] bg-[var(--color-primary)]" style={{ width: `${computedValue}${input.unit}`, maxWidth: "100%" }} />
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-[var(--color-text)]">Token set mode</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Build a small scale of fluid CSS variables for typography or spacing systems.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={resetTokens} leftIcon={<RefreshCw className="h-4 w-4" />}>Reset tokens</Button>
            <Button onClick={addToken} leftIcon={<Plus className="h-4 w-4" />}>Add token</Button>
          </div>
        </div>
        <div className="space-y-3">
          {tokens.map((token, index) => (
            <div key={`${token.name}-${index}`} className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3 md:grid-cols-[minmax(100px,1fr)_1fr_1fr_1fr_1fr_auto]">
              <Input aria-label="Token name" value={token.name} onChange={(event) => updateToken(index, { name: event.target.value })} />
              <Input type="number" step="0.125" aria-label="Token min value" value={token.minValue} onChange={(event) => updateToken(index, { minValue: numberOrFallback(event.target.value, token.minValue) })} />
              <Input type="number" step="0.125" aria-label="Token max value" value={token.maxValue} onChange={(event) => updateToken(index, { maxValue: numberOrFallback(event.target.value, token.maxValue) })} />
              <Input type="number" step="1" aria-label="Token min viewport" value={token.minViewport} onChange={(event) => updateToken(index, { minViewport: numberOrFallback(event.target.value, token.minViewport) })} />
              <Input type="number" step="1" aria-label="Token max viewport" value={token.maxViewport} onChange={(event) => updateToken(index, { maxViewport: numberOrFallback(event.target.value, token.maxViewport) })} />
              <Button size="icon" variant="ghost" onClick={() => removeToken(index)} leftIcon={<Trash2 className="h-4 w-4" />} aria-label={`Remove ${token.name}`} />
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {TOKEN_NAMES.map((name, index) => (
            <Button key={name} variant="secondary" onClick={() => updateToken(index, { name: `text-${name}` })} disabled={!tokens[index]}>
              text-{name}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
