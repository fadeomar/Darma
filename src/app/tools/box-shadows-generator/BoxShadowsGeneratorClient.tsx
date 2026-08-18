"use client";

import { useMemo, useState } from "react";
import { Copy, Layers3, Plus, RefreshCcw, Shuffle, Trash2 } from "lucide-react";
import { Badge, Button, CopyButton } from "@/components/ui";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import {
  CodeOutputPanel,
  ColorField,
  ControlGrid,
  ControlSection,
  PreviewToolbar,
  SegmentedControl,
  SliderNumberField,
  ToolControlPanel,
  WarningPanel,
  type CodeOutputTab,
  type WarningMessage,
} from "@/features/tools/components";
import type { BoxShadowState, Shadow } from "@/types";

type LightSourceId = "top-left" | "top-right" | "bottom-right" | "bottom-left";

type ShadowPreset = {
  id: string;
  name: string;
  description: string;
  usage: string;
  state: BoxShadowState;
};

const lightSourceIdToNumber: Record<LightSourceId, number> = {
  "top-left": 1,
  "top-right": 2,
  "bottom-right": 3,
  "bottom-left": 4,
};

const lightSourceNumberToId: Record<number, LightSourceId> = {
  1: "top-left",
  2: "top-right",
  3: "bottom-right",
  4: "bottom-left",
};

const lightSourceVector: Record<LightSourceId, { x: number; y: number; label: string }> = {
  "top-left": { x: 1, y: 1, label: "Top left" },
  "top-right": { x: -1, y: 1, label: "Top right" },
  "bottom-right": { x: -1, y: -1, label: "Bottom right" },
  "bottom-left": { x: 1, y: -1, label: "Bottom left" },
};

const defaultShadow: Shadow = {
  id: "1",
  offsetX: 0,
  offsetY: 12,
  blur: 32,
  spread: 0,
  opacity: 0.22,
  color: "#000000",
  inset: false,
  distance: 0,
};

const defaultState: BoxShadowState = {
  shadows: [defaultShadow],
  boxSize: 220,
  borderRadius: 24,
  backgroundColor: "#ffffff",
  activeLightSource: 1,
};

const presets: ShadowPreset[] = [
  {
    id: "soft-card",
    name: "Soft card",
    description: "Balanced app-card elevation.",
    usage: "Cards / panels",
    state: defaultState,
  },
  {
    id: "dashboard-crisp",
    name: "Dashboard crisp",
    description: "Two lightweight layers for clean SaaS UI.",
    usage: "Dashboards",
    state: {
      ...defaultState,
      shadows: [
        { ...defaultShadow, id: "1", offsetY: 2, blur: 8, opacity: 0.08 },
        { ...defaultShadow, id: "2", offsetY: 10, blur: 28, opacity: 0.12 },
      ],
    },
  },
  {
    id: "floating-product",
    name: "Floating product",
    description: "Large airy shadow for hero/mockup cards.",
    usage: "Hero assets",
    state: {
      ...defaultState,
      boxSize: 240,
      borderRadius: 30,
      shadows: [
        { ...defaultShadow, id: "1", offsetY: 34, blur: 82, opacity: 0.23 },
        { ...defaultShadow, id: "2", offsetY: 10, blur: 24, opacity: 0.08 },
      ],
    },
  },
  {
    id: "focus-glow",
    name: "Focus glow",
    description: "Accessible focus or active-state glow.",
    usage: "Focus states",
    state: {
      ...defaultState,
      borderRadius: 18,
      backgroundColor: "#f8fbff",
      shadows: [
        { ...defaultShadow, id: "1", offsetY: 0, blur: 0, spread: 3, color: "#3b82f6", opacity: 0.35 },
        { ...defaultShadow, id: "2", offsetY: 10, blur: 28, spread: 0, color: "#1d4ed8", opacity: 0.18 },
      ],
    },
  },
  {
    id: "pressed-inset",
    name: "Pressed inset",
    description: "Subtle inner shadow for pressed surfaces.",
    usage: "Inputs / toggles",
    state: {
      ...defaultState,
      backgroundColor: "#f1f5f9",
      shadows: [
        { ...defaultShadow, id: "1", offsetY: 4, blur: 16, opacity: 0.22, inset: true },
        { ...defaultShadow, id: "2", offsetY: -2, blur: 8, opacity: 0.08, color: "#ffffff", inset: true },
      ],
    },
  },
  {
    id: "directional-soft",
    name: "Directional soft",
    description: "Uses light-source distance for fast direction changes.",
    usage: "Soft UI",
    state: {
      ...defaultState,
      backgroundColor: "#f8fafc",
      activeLightSource: 1,
      shadows: [
        { ...defaultShadow, id: "1", offsetX: 0, offsetY: 0, distance: 18, blur: 42, color: "#64748b", opacity: 0.23 },
        { ...defaultShadow, id: "2", offsetX: 0, offsetY: 0, distance: -8, blur: 20, color: "#ffffff", opacity: 0.76 },
      ],
    },
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(hex: string) {
  const clean = hex.trim().replace("#", "");
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return `#${clean.split("").map((part) => part + part).join("")}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) return `#${clean}`.toLowerCase();
  return "#000000";
}

function hexToRgb(hex: string) {
  const clean = normalizeHex(hex).replace("#", "");
  const parsed = Number.parseInt(clean, 16);
  if (Number.isNaN(parsed)) return "0 0 0";
  return `${(parsed >> 16) & 255} ${(parsed >> 8) & 255} ${parsed & 255}`;
}

function getLightSourceId(state: BoxShadowState): LightSourceId {
  return lightSourceNumberToId[state.activeLightSource] ?? "top-left";
}

function effectiveShadow(shadow: Shadow, activeLightSource: number) {
  const vector = lightSourceVector[lightSourceNumberToId[activeLightSource] ?? "top-left"];
  return {
    ...shadow,
    offsetX: Math.round((shadow.offsetX + shadow.distance * vector.x) * 100) / 100,
    offsetY: Math.round((shadow.offsetY + shadow.distance * vector.y) * 100) / 100,
    opacity: clamp(shadow.opacity, 0, 1),
  };
}

function shadowString(shadow: Shadow, activeLightSource: number) {
  const resolved = effectiveShadow(shadow, activeLightSource);
  return `${resolved.inset ? "inset " : ""}${resolved.offsetX}px ${resolved.offsetY}px ${resolved.blur}px ${resolved.spread}px rgb(${hexToRgb(resolved.color)} / ${resolved.opacity.toFixed(2)})`;
}

function boxShadowValue(state: BoxShadowState) {
  return state.shadows.map((shadow) => shadowString(shadow, state.activeLightSource)).join(", ");
}

function layerPreviewValue(shadow: Shadow, state: BoxShadowState) {
  return shadowString(shadow, state.activeLightSource);
}

function generateCss(state: BoxShadowState) {
  return `.shadow-card {\n  width: ${state.boxSize}px;\n  height: ${state.boxSize}px;\n  border-radius: ${state.borderRadius}px;\n  background: ${normalizeHex(state.backgroundColor)};\n  box-shadow: ${boxShadowValue(state)};\n}`;
}

function generateVariable(state: BoxShadowState) {
  return `:root {\n  --darma-shadow-card: ${boxShadowValue(state)};\n  --darma-shadow-radius: ${state.borderRadius}px;\n  --darma-shadow-surface: ${normalizeHex(state.backgroundColor)};\n}\n\n.shadow-card {\n  border-radius: var(--darma-shadow-radius);\n  background: var(--darma-shadow-surface);\n  box-shadow: var(--darma-shadow-card);\n}`;
}

function generateTailwind(state: BoxShadowState) {
  return `// tailwind.config.ts\nexport default {\n  theme: {\n    extend: {\n      boxShadow: {\n        darma: ${JSON.stringify(boxShadowValue(state))},\n      },\n      borderRadius: {\n        darma: \"${state.borderRadius}px\",\n      },\n    },\n  },\n};\n\n// Usage\n<div className=\"h-[${state.boxSize}px] w-[${state.boxSize}px] rounded-darma bg-[${normalizeHex(state.backgroundColor)}] shadow-darma\" />`;
}

function generateReactStyle(state: BoxShadowState) {
  return `const shadowCardStyle = {\n  width: ${state.boxSize},\n  height: ${state.boxSize},\n  borderRadius: ${state.borderRadius},\n  background: \"${normalizeHex(state.backgroundColor)}\",\n  boxShadow: ${JSON.stringify(boxShadowValue(state))},\n};`;
}

function generateTokenJson(state: BoxShadowState) {
  return JSON.stringify(
    {
      shadow: {
        name: "darma.shadow.card",
        value: boxShadowValue(state),
        layers: state.shadows.map((shadow, index) => ({
          name: `layer-${index + 1}`,
          value: shadowString(shadow, state.activeLightSource),
          raw: shadow,
          effective: effectiveShadow(shadow, state.activeLightSource),
        })),
      },
      radius: `${state.borderRadius}px`,
      surface: normalizeHex(state.backgroundColor),
    },
    null,
    2,
  );
}

function cloneState(state: BoxShadowState): BoxShadowState {
  return { ...state, shadows: state.shadows.map((shadow) => ({ ...shadow })) };
}

function normalizeIds(shadows: Shadow[]) {
  return shadows.map((shadow, index) => ({ ...shadow, id: String(index + 1) }));
}

function getMaxBlur(state: BoxShadowState) {
  return Math.max(...state.shadows.map((shadow) => shadow.blur), 0);
}

function getMaxOpacity(state: BoxShadowState) {
  return Math.max(...state.shadows.map((shadow) => shadow.opacity), 0);
}

function getPaintRating(state: BoxShadowState) {
  const score = state.shadows.length * 14 + getMaxBlur(state) * 0.65 + Math.max(0, state.boxSize - 260) * 0.12;
  if (score < 52) return { label: "Light", variant: "success" as const, detail: "Safe for most UI surfaces." };
  if (score < 96) return { label: "Medium", variant: "warning" as const, detail: "Good for cards; avoid large repeated lists." };
  return { label: "Heavy", variant: "danger" as const, detail: "Use carefully on many elements." };
}

function getShadowCharacter(state: BoxShadowState) {
  if (state.shadows.some((shadow) => shadow.inset)) return "Inset";
  if (getMaxBlur(state) >= 72) return "Floating";
  if (state.shadows.length >= 2) return "Layered";
  return "Simple";
}

function createRandomShadowState(): BoxShadowState {
  const base = presets[Math.floor(Math.random() * presets.length)]?.state ?? defaultState;
  const next = cloneState(base);
  next.shadows = next.shadows.map((shadow, index) => ({
    ...shadow,
    id: String(index + 1),
    offsetX: Math.round((shadow.offsetX + Math.random() * 8 - 4) * 10) / 10,
    offsetY: Math.round((shadow.offsetY + Math.random() * 10 - 2) * 10) / 10,
    blur: clamp(Math.round(shadow.blur + Math.random() * 18 - 6), 0, 140),
    opacity: clamp(Math.round((shadow.opacity + Math.random() * 0.08 - 0.03) * 100) / 100, 0, 1),
  }));
  return next;
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-[var(--color-text-primary)]" title={value}>{value}</div>
      <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]" title={detail}>{detail}</div>
    </div>
  );
}

export default function BoxShadowsGeneratorClient() {
  const [state, setState] = useState<BoxShadowState>(() => cloneState(defaultState));
  const [activeId, setActiveId] = useState(state.shadows[0]?.id ?? "1");

  const activeShadow = state.shadows.find((shadow) => shadow.id === activeId) ?? state.shadows[0];
  const shadowValue = useMemo(() => boxShadowValue(state), [state]);
  const css = useMemo(() => generateCss(state), [state]);
  const paintRating = useMemo(() => getPaintRating(state), [state]);
  const activeLightSourceId = getLightSourceId(state);

  const tabs = useMemo<CodeOutputTab[]>(
    () => [
      { id: "css", label: "CSS", language: "css", filename: "box-shadow.css", code: css },
      { id: "variable", label: "Variables", language: "css", filename: "box-shadow-variable.css", code: generateVariable(state) },
      { id: "tailwind", label: "Tailwind", language: "ts", filename: "tailwind-shadow.ts", code: generateTailwind(state) },
      { id: "react", label: "React style", language: "ts", filename: "shadow-style.ts", code: generateReactStyle(state) },
      { id: "tokens", label: "Token JSON", language: "json", filename: "shadow-token.json", code: generateTokenJson(state) },
    ],
    [css, state],
  );

  const warnings = useMemo<WarningMessage[]>(() => {
    const messages: WarningMessage[] = [];
    if (state.shadows.length <= 3 && getMaxBlur(state) <= 80) {
      messages.push({ id: "safe", severity: "success", title: "Production friendly", message: "This shadow is reasonable for cards, buttons, and UI surfaces." });
    }
    if (state.shadows.length > 4) messages.push({ id: "many", severity: "warning", title: "Many layers", message: "Large lists or tables can become expensive when every item uses many shadow layers." });
    if (getMaxBlur(state) > 96) messages.push({ id: "blur", severity: "warning", title: "High blur", message: "Very high blur values create larger paint areas. Use them for hero visuals, not repeated components." });
    if (getMaxOpacity(state) > 0.5) messages.push({ id: "opacity", severity: "info", title: "Strong shadow", message: "High opacity can make UI feel heavy. Try lower opacity for clean product interfaces." });
    if (state.shadows.some((shadow) => shadow.spread > 48)) messages.push({ id: "spread", severity: "warning", title: "Large spread", message: "Large positive spread can look like a border or glow. Confirm this is intentional." });
    if (state.shadows.some((shadow) => shadow.inset)) messages.push({ id: "inset", severity: "info", title: "Inset layer", message: "Inset shadows work best on solid backgrounds and input-like surfaces." });
    return messages;
  }, [state]);

  function updateShadow(id: string, patch: Partial<Shadow>) {
    setState((current) => ({
      ...current,
      shadows: current.shadows.map((shadow) => (shadow.id === id ? { ...shadow, ...patch } : shadow)),
    }));
  }

  function addShadow() {
    setState((current) => {
      const next: Shadow = {
        ...defaultShadow,
        id: String(current.shadows.length + 1),
        offsetY: 8 + current.shadows.length * 8,
        blur: 20 + current.shadows.length * 14,
        opacity: Math.max(0.08, 0.18 - current.shadows.length * 0.02),
      };
      setActiveId(next.id);
      return { ...current, shadows: [...current.shadows, next] };
    });
  }

  function duplicateShadow() {
    if (!activeShadow) return;
    setState((current) => {
      const next = { ...activeShadow, id: String(current.shadows.length + 1), offsetY: activeShadow.offsetY + 4 };
      setActiveId(next.id);
      return { ...current, shadows: [...current.shadows, next] };
    });
  }

  function removeShadow(id: string) {
    setState((current) => {
      const shadows = normalizeIds(current.shadows.filter((shadow) => shadow.id !== id));
      setActiveId(shadows[0]?.id ?? "1");
      return { ...current, shadows: shadows.length ? shadows : [{ ...defaultShadow }] };
    });
  }

  function applyPreset(preset: ShadowPreset) {
    const next = cloneState(preset.state);
    next.shadows = normalizeIds(next.shadows);
    setState(next);
    setActiveId(next.shadows[0]?.id ?? "1");
  }

  function resetTool() {
    const next = cloneState(defaultState);
    setState(next);
    setActiveId("1");
  }

  function randomizeTool() {
    const next = createRandomShadowState();
    setState(next);
    setActiveId(next.shadows[0]?.id ?? "1");
  }

  const previewSlot = (
    <div className="space-y-4">
      <PreviewToolbar
        title="Live shadow preview"
        description="Design the shadow against a real UI surface, then copy production-ready CSS when it feels right."
      />

      <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[radial-gradient(circle_at_18%_12%,var(--color-primary-soft),transparent_30%),linear-gradient(135deg,var(--color-preview-bg),var(--color-preview-bg-strong))] p-4 sm:p-7">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="soft">{state.shadows.length} layer{state.shadows.length === 1 ? "" : "s"}</Badge>
            <Badge variant={paintRating.variant}>{paintRating.label} paint</Badge>
          </div>
          <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">
            Light: {lightSourceVector[activeLightSourceId].label}
          </span>
        </div>

        <div className="grid min-h-[470px] items-center gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)] sm:min-h-[540px]">
          <div className="flex min-w-0 items-center justify-center py-8 sm:py-12">
            <div
              className="flex items-center justify-center text-center text-sm font-black tracking-[-0.01em] text-[var(--color-text-tertiary)] transition-[box-shadow,border-radius,background] duration-200"
              style={{
                width: `min(${state.boxSize}px, 86%)`,
                maxWidth: 380,
                aspectRatio: "1 / 1",
                borderRadius: state.borderRadius,
                background: normalizeHex(state.backgroundColor),
                boxShadow: shadowValue,
              }}
            >
              Shadow preview
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-[var(--radius-lg)] p-4" style={{ background: normalizeHex(state.backgroundColor), boxShadow: shadowValue }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Component check</p>
                  <h3 className="mt-2 text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Product card</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">See the same token on a realistic UI surface before you ship it.</p>
                </div>
                <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--color-primary-text-strong)]">Live</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button type="button" className="rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 py-2 text-xs font-bold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)]">Primary</button>
                <span className="rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-2.5 py-1 text-xs font-bold text-[var(--color-text-secondary)]">Badge</span>
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-3 shadow-[var(--shadow-xs)] backdrop-blur-sm">
              <p className="text-xs font-bold text-[var(--color-text-primary)]">Active layer</p>
              <p className="mt-1 break-all font-mono text-xs leading-5 text-[var(--color-text-tertiary)]">
                {activeShadow ? layerPreviewValue(activeShadow, state) : shadowValue}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section aria-labelledby="shadow-presets-title" className="space-y-2.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 id="shadow-presets-title" className="text-sm font-black text-[var(--color-text-primary)]">Quick styles</h3>
            <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Start visually, then fine-tune the individual layers.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="group min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-control-hover)]"
            >
              <span className="mb-3 flex h-16 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-preview-bg)]">
                <span className="h-9 w-9 rounded-[10px]" style={{ boxShadow: boxShadowValue(preset.state), background: normalizeHex(preset.state.backgroundColor) }} />
              </span>
              <span className="block truncate text-xs font-black text-[var(--color-text-primary)]">{preset.name}</span>
              <span className="mt-0.5 block truncate text-xs font-semibold text-[var(--color-text-tertiary)]">{preset.usage}</span>
            </button>
          ))}
        </div>
      </section>

      <details className="group rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-xs)]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] marker:content-none">
          <span className="flex items-center justify-between gap-3">
            Output details
            <span className="text-xs font-semibold text-[var(--color-text-tertiary)] group-open:hidden">Layers, character & raw value</span>
            <span className="hidden text-xs font-semibold text-[var(--color-text-tertiary)] group-open:inline">Hide</span>
          </span>
        </summary>
        <div className="space-y-3 border-t border-[var(--color-border-subtle)] p-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Layers" value={`${state.shadows.length}`} detail={state.shadows.length === 1 ? "Single shadow" : "Layered shadow"} />
            <StatCard label="Character" value={getShadowCharacter(state)} detail={`${getMaxBlur(state)}px max blur`} />
            <StatCard label="Light" value={lightSourceVector[activeLightSourceId].label} detail="Affects distance layers" />
            <StatCard label="Paint cost" value={paintRating.label} detail={paintRating.detail} />
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-code-surface)] px-3 py-2 font-mono text-xs leading-6 text-white/80">
            <span className="font-bold text-white">box-shadow:</span>{" "}
            <span className="break-all">{shadowValue}</span>
          </div>
        </div>
      </details>
    </div>
  );

  const controlsSlot = (
    <div className="space-y-4">
      <ToolControlPanel
        title="Shadow controls"
        description="Select a layer, tune its shape, and keep the preview visible while you work."
        badge={<Badge variant="soft">{state.shadows.length} layer{state.shadows.length === 1 ? "" : "s"}</Badge>}
      >
        <ControlSection title="Layers" action={<Button size="sm" variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={addShadow}>Add</Button>}>
          <div className="space-y-2">
            {state.shadows.map((shadow, index) => {
              const active = activeId === shadow.id;
              return (
                <div
                  key={shadow.id}
                  className={`grid w-full grid-cols-[minmax(0,1fr)_32px] items-center gap-2 rounded-[var(--radius-md)] border px-2.5 py-2 text-sm transition ${
                    active ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]"
                  }`}
                >
                  <button type="button" onClick={() => setActiveId(shadow.id)} className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-2 text-left">
                    <span className="h-8 w-8 rounded-[var(--radius-sm)] bg-white" style={{ boxShadow: layerPreviewValue(shadow, state), background: normalizeHex(state.backgroundColor) }} />
                    <span className="min-w-0">
                      <span className="block font-bold text-[var(--color-text-primary)]">Layer {index + 1}</span>
                      <span className="block truncate font-mono text-xs text-[var(--color-text-tertiary)]" title={layerPreviewValue(shadow, state)}>{layerPreviewValue(shadow, state)}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove layer ${index + 1}`}
                    className="inline-grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger-text)]"
                    onClick={() => removeShadow(shadow.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </ControlSection>

        {activeShadow ? (
          <ControlSection title="Selected layer" action={<Button size="sm" variant="ghost" leftIcon={<Copy className="h-4 w-4" />} onClick={duplicateShadow}>Duplicate</Button>}>
            <ControlGrid columns={2}>
              <SliderNumberField label="X offset" value={activeShadow.offsetX} min={-100} max={100} unit="px" onChange={(value) => updateShadow(activeShadow.id, { offsetX: value })} />
              <SliderNumberField label="Y offset" value={activeShadow.offsetY} min={-100} max={100} unit="px" onChange={(value) => updateShadow(activeShadow.id, { offsetY: value })} />
              <SliderNumberField label="Blur" value={activeShadow.blur} min={0} max={140} unit="px" onChange={(value) => updateShadow(activeShadow.id, { blur: value })} />
              <SliderNumberField label="Spread" value={activeShadow.spread} min={-60} max={80} unit="px" onChange={(value) => updateShadow(activeShadow.id, { spread: value })} />
              <SliderNumberField label="Opacity" value={activeShadow.opacity} min={0} max={1} step={0.01} onChange={(value) => updateShadow(activeShadow.id, { opacity: value })} />
              <ColorField label="Color" value={activeShadow.color} onChange={(value) => updateShadow(activeShadow.id, { color: value })} />
            </ControlGrid>
            <SegmentedControl
              ariaLabel="Inset mode"
              value={activeShadow.inset ? "inset" : "outset"}
              onChange={(value) => updateShadow(activeShadow.id, { inset: value === "inset" })}
              fullWidth
              options={[{ value: "outset", label: "Outset" }, { value: "inset", label: "Inset" }]}
            />
          </ControlSection>
        ) : null}

        <details className="group border-t border-[var(--color-border-subtle)] pt-4">
          <summary className="cursor-pointer list-none text-sm font-black text-[var(--color-text-primary)] marker:content-none">
            <span className="flex items-center justify-between gap-3">
              Directional controls
              <span className="text-xs font-semibold text-[var(--color-text-tertiary)] group-open:hidden">Light source & distance</span>
              <span className="hidden text-xs font-semibold text-[var(--color-text-tertiary)] group-open:inline">Hide</span>
            </span>
          </summary>
          <div className="mt-4 space-y-4">
            <SegmentedControl<LightSourceId>
              ariaLabel="Shadow light source"
              value={activeLightSourceId}
              onChange={(value) => setState((current) => ({ ...current, activeLightSource: lightSourceIdToNumber[value] }))}
              layout="grid"
              fullWidth
              options={([ 
                { value: "top-left", label: "↖" },
                { value: "top-right", label: "↗" },
                { value: "bottom-right", label: "↘" },
                { value: "bottom-left", label: "↙" },
              ] satisfies { value: LightSourceId; label: string }[])}
              className="grid-cols-4"
            />
            {activeShadow ? (
              <SliderNumberField label="Distance" value={activeShadow.distance} min={-80} max={80} unit="px" hint="Follows the selected light source" onChange={(value) => updateShadow(activeShadow.id, { distance: value })} />
            ) : null}
          </div>
        </details>

        <details className="group border-t border-[var(--color-border-subtle)] pt-4">
          <summary className="cursor-pointer list-none text-sm font-black text-[var(--color-text-primary)] marker:content-none">
            <span className="flex items-center justify-between gap-3">
              Preview object
              <span className="text-xs font-semibold text-[var(--color-text-tertiary)] group-open:hidden">Size, radius & surface</span>
              <span className="hidden text-xs font-semibold text-[var(--color-text-tertiary)] group-open:inline">Hide</span>
            </span>
          </summary>
          <div className="mt-4">
            <ControlGrid columns={2}>
              <SliderNumberField label="Size" value={state.boxSize} min={80} max={420} unit="px" onChange={(value) => setState((current) => ({ ...current, boxSize: value }))} />
              <SliderNumberField label="Radius" value={state.borderRadius} min={0} max={160} unit="px" onChange={(value) => setState((current) => ({ ...current, borderRadius: value }))} />
              <ColorField label="Surface" value={state.backgroundColor} onChange={(value) => setState((current) => ({ ...current, backgroundColor: value }))} />
            </ControlGrid>
          </div>
        </details>
      </ToolControlPanel>

      <details className="group rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-xs)]">
        <summary className="cursor-pointer list-none px-4 py-3.5 marker:content-none">
          <span className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-sm font-black text-[var(--color-text-primary)]">
              <Layers3 className="h-4 w-4 shrink-0" />
              Developer handoff & diagnostics
            </span>
            <Badge variant={paintRating.variant}>{paintRating.label}</Badge>
          </span>
        </summary>
        <div className="space-y-4 border-t border-[var(--color-border-subtle)] p-4">
          <WarningPanel title="Production checks" messages={warnings} />
          <CodeOutputPanel
            title="Generated shadow code"
            description="CSS declaration, reusable variable, Tailwind extension, React style object, and token JSON."
            tabs={tabs}
            defaultTab="css"
          />
        </div>
      </details>
    </div>
  );
  return (
    <ToolLayoutVisualGenerator
      previewSlot={previewSlot}
      controlsSlot={controlsSlot}
      actionsPlacement="under-preview"
      actionsSlot={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" leftIcon={<Shuffle className="h-4 w-4" />} onClick={randomizeTool}>Random</Button>
            <Button variant="ghost" leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={resetTool}>Reset</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={shadowValue} variant="secondary">Copy value</CopyButton>
            <CopyButton text={css}>Copy CSS</CopyButton>
          </div>
        </div>
      }
    />
  );
}
