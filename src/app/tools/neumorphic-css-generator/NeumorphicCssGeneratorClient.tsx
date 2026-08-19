"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Download, RefreshCcw, Shuffle } from "lucide-react";
import { Badge, Button, CopyButton, Field, Input } from "@/components/ui";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import {
  CodeOutputPanel,
  ColorField,
  ControlGrid,
  ControlSection,
  PresetGallery,
  PreviewToolbar,
  SegmentedControl,
  SliderNumberField,
  ToolControlPanel,
  WarningPanel,
  type CodeOutputTab,
  type WarningMessage,
} from "@/features/tools/components";
import { colorLuminance, getContrast } from "@/utils";

type Shape = "flat" | "pressed" | "convex" | "concave";
type LightSource = "top-left" | "top-right" | "bottom-right" | "bottom-left";
type PreviewMode = "card" | "button" | "dashboard";

type NeumoState = {
  presetId: string;
  className: string;
  color: string;
  size: number;
  radius: number;
  distance: number;
  intensity: number;
  blur: number;
  spread: number;
  shape: Shape;
  lightSource: LightSource;
  previewBackground: string;
  previewMode: PreviewMode;
  label: string;
  includeTransition: boolean;
  includeFocusRing: boolean;
  includeReducedMotion: boolean;
};

type MetricTone = "good" | "warning" | "danger" | "neutral";

type ProductionMetric = {
  label: string;
  value: string;
  detail: string;
  tone: MetricTone;
};

const defaultState: NeumoState = {
  presetId: "soft-card",
  className: "neumorphic-surface",
  color: "#e0e0e0",
  size: 280,
  radius: 42,
  distance: 18,
  intensity: 0.16,
  blur: 36,
  spread: 0,
  shape: "flat",
  lightSource: "top-left",
  previewBackground: "#e0e0e0",
  previewMode: "card",
  label: "Soft UI",
  includeTransition: true,
  includeFocusRing: true,
  includeReducedMotion: true,
};

const presets: { id: string; name: string; description: string; state: NeumoState }[] = [
  { id: "soft-card", name: "Soft card", description: "Balanced raised surface for cards and widgets.", state: defaultState },
  {
    id: "pressed",
    name: "Pressed control",
    description: "Inset button or form control with readable depth.",
    state: { ...defaultState, presetId: "pressed", shape: "pressed", radius: 24, distance: 12, blur: 24, spread: 0, size: 240, label: "Pressed" },
  },
  {
    id: "dark-dashboard",
    name: "Dark dashboard",
    description: "Subtle neumorphism for dark admin panels.",
    state: {
      ...defaultState,
      presetId: "dark-dashboard",
      color: "#1f2937",
      previewBackground: "#111827",
      intensity: 0.26,
      blur: 32,
      distance: 14,
      radius: 28,
      shape: "convex",
      previewMode: "dashboard",
      label: "Analytics",
    },
  },
  {
    id: "pill-button",
    name: "Pill button",
    description: "Rounded CTA/control with soft highlight.",
    state: { ...defaultState, presetId: "pill-button", size: 220, radius: 999, distance: 10, blur: 26, intensity: 0.14, previewMode: "button", label: "Get started" },
  },
  {
    id: "clay-card",
    name: "Clay card",
    description: "More playful depth with stronger light and shadow.",
    state: { ...defaultState, presetId: "clay-card", color: "#f2d7ff", previewBackground: "#f2d7ff", radius: 48, distance: 22, blur: 42, spread: -2, intensity: 0.2, shape: "convex", label: "Creative" },
  },
];

function lightConfig(source: LightSource) {
  if (source === "top-right") return { x: -1, y: 1, angle: 225, label: "top right" };
  if (source === "bottom-right") return { x: -1, y: -1, angle: 315, label: "bottom right" };
  if (source === "bottom-left") return { x: 1, y: -1, angle: 45, label: "bottom left" };
  return { x: 1, y: 1, angle: 145, label: "top left" };
}

function safeClassName(value: string) {
  const cleaned = value.trim().replace(/^\./, "").replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
  return cleaned || "neumorphic-surface";
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const values = [r, g, b].map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function readableRating(ratio: number) {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "Large text";
  return "Low";
}

function formatCssNumber(value: number, digits = 2) {
  return Number(value.toFixed(digits)).toString();
}

function labelize(value: string) {
  return value.replace(/-/g, " ");
}

function toneClass(tone: MetricTone) {
  if (tone === "good") return "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100";
  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100";
  return "border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-text-primary)]";
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

function buildValues(state: NeumoState) {
  const config = lightConfig(state.lightSource);
  const safeIntensity = Math.min(0.42, Math.max(0.02, state.intensity));
  const dark = colorLuminance(state.color, -safeIntensity);
  const light = colorLuminance(state.color, safeIntensity + 0.02);
  const positionX = Math.round(state.distance * config.x);
  const positionY = Math.round(state.distance * config.y);
  const radius = state.radius >= state.size / 2 ? "999px" : `${state.radius}px`;
  const firstGradient = state.shape === "convex" ? colorLuminance(state.color, 0.07) : state.shape === "concave" ? colorLuminance(state.color, -0.1) : state.color;
  const secondGradient = state.shape === "convex" ? colorLuminance(state.color, -0.1) : state.shape === "concave" ? colorLuminance(state.color, 0.07) : state.color;
  const background = state.shape === "convex" || state.shape === "concave" ? `linear-gradient(${config.angle}deg, ${firstGradient}, ${secondGradient})` : state.color;
  const inset = state.shape === "pressed" ? "inset " : "";
  const spread = state.spread === 0 ? "0px" : `${state.spread}px`;
  const boxShadow = `${inset}${positionX}px ${positionY}px ${state.blur}px ${spread} ${dark}, ${inset}${-positionX}px ${-positionY}px ${state.blur}px ${spread} ${light}`;
  const textColor = getContrast(state.color);
  const ratio = contrastRatio(textColor, state.color);
  return { dark, light, radius, background, boxShadow, textColor, ratio, lightLabel: config.label };
}

function getPreviewSurfaceStyle(state: NeumoState): CSSProperties {
  const values = buildValues(state);
  return {
    width: state.previewMode === "button" ? Math.min(state.size, 240) : state.size,
    height: state.previewMode === "button" ? Math.min(Math.round(state.size / 2.8), 76) : state.size,
    maxWidth: "100%",
    borderRadius: state.previewMode === "button" ? 999 : values.radius,
    background: values.background,
    boxShadow: values.boxShadow,
    color: values.textColor,
    transition: state.includeTransition ? "transform 180ms ease, box-shadow 180ms ease, filter 180ms ease" : undefined,
  };
}

function generateCss(state: NeumoState) {
  const values = buildValues(state);
  const selector = `.${safeClassName(state.className)}`;
  const width = state.previewMode === "button" ? "max-content" : `${state.size}px`;
  const height = state.previewMode === "button" ? "auto" : `${state.size}px`;
  const padding = state.previewMode === "button" ? "0.875rem 1.25rem" : "1rem";
  const focusRing = state.includeFocusRing
    ? `\n\n${selector}:focus-visible {\n  outline: 3px solid color-mix(in srgb, ${values.textColor} 32%, transparent);\n  outline-offset: 4px;\n}`
    : "";
  const motion = state.includeReducedMotion
    ? `\n\n@media (prefers-reduced-motion: reduce) {\n  ${selector} {\n    transition: none;\n  }\n}`
    : "";
  return `${selector} {\n  width: ${width};\n  min-height: ${height};\n  padding: ${padding};\n  border: 0;\n  border-radius: ${values.radius};\n  background: ${values.background};\n  box-shadow: ${values.boxShadow};\n  color: ${values.textColor};\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  font-weight: 800;\n  transition: ${state.includeTransition ? "transform 180ms ease, box-shadow 180ms ease" : "none"};\n}${focusRing}${motion}`;
}

function generateVariables(state: NeumoState) {
  const values = buildValues(state);
  const selector = `.${safeClassName(state.className)}`;
  return `${selector} {\n  --neumo-bg: ${state.color};\n  --neumo-bg-preview: ${state.previewBackground};\n  --neumo-shadow-dark: ${values.dark};\n  --neumo-shadow-light: ${values.light};\n  --neumo-radius: ${values.radius};\n  --neumo-distance: ${state.distance}px;\n  --neumo-blur: ${state.blur}px;\n  --neumo-spread: ${state.spread}px;\n  background: ${values.background};\n  border-radius: var(--neumo-radius);\n  box-shadow: ${values.boxShadow};\n  color: ${values.textColor};\n}`;
}

function generateTailwindStarter(state: NeumoState) {
  const values = buildValues(state);
  return `// tailwind.config.ts\nexport default {\n  theme: {\n    extend: {\n      colors: {\n        neumo: \"${state.color}\",\n      },\n      boxShadow: {\n        neumo: \"${values.boxShadow}\",\n      },\n      borderRadius: {\n        neumo: \"${values.radius}\",\n      },\n    },\n  },\n};\n\n// Usage\n<div className=\"rounded-neumo bg-neumo shadow-neumo\">${state.label}</div>`;
}

function generateReactStyle(state: NeumoState) {
  const values = buildValues(state);
  return `const neumorphicStyle: React.CSSProperties = {\n  background: \"${values.background}\",\n  borderRadius: \"${values.radius}\",\n  boxShadow: \"${values.boxShadow}\",\n  color: \"${values.textColor}\",\n  padding: \"1rem\",\n};`;
}

function generateTokenJson(state: NeumoState) {
  const values = buildValues(state);
  return JSON.stringify(
    {
      neumorphism: {
        className: safeClassName(state.className),
        color: state.color,
        background: values.background,
        textColor: values.textColor,
        radius: values.radius,
        shape: state.shape,
        lightSource: state.lightSource,
        shadows: {
          dark: values.dark,
          light: values.light,
          css: values.boxShadow,
          distance: state.distance,
          blur: state.blur,
          spread: state.spread,
          intensity: state.intensity,
        },
        accessibility: {
          textContrast: Number(values.ratio.toFixed(2)),
          rating: readableRating(values.ratio),
        },
      },
    },
    null,
    2,
  );
}

function getProductionMetrics(state: NeumoState): ProductionMetric[] {
  const values = buildValues(state);
  const costScore = state.blur * 0.45 + state.distance * 0.45 + Math.max(0, state.size - 260) * 0.04;
  const depthScore = Math.round((state.distance + state.blur * 0.35 + state.intensity * 120) / 1.9);
  return [
    {
      label: "Readability",
      value: readableRating(values.ratio),
      detail: `${formatCssNumber(values.ratio)}:1 text contrast`,
      tone: values.ratio >= 4.5 ? "good" : values.ratio >= 3 ? "warning" : "danger",
    },
    {
      label: "Depth",
      value: depthScore > 34 ? "Strong" : depthScore > 22 ? "Balanced" : "Subtle",
      detail: `${state.distance}px distance / ${state.blur}px blur`,
      tone: depthScore > 46 ? "warning" : depthScore < 14 ? "warning" : "good",
    },
    {
      label: "Paint cost",
      value: costScore > 68 ? "Heavy" : costScore > 42 ? "Medium" : "Light",
      detail: `${state.shape === "pressed" ? "Inset" : "Outset"} shadows, ${state.size}px preview`,
      tone: costScore > 68 ? "danger" : costScore > 42 ? "warning" : "good",
    },
    {
      label: "Fallback",
      value: "CSS only",
      detail: "No images or JS required",
      tone: "good",
    },
  ];
}

function validateState(state: NeumoState): WarningMessage[] {
  const values = buildValues(state);
  const messages: WarningMessage[] = [];
  if (state.blur > 84) messages.push({ id: "blur", severity: "warning", message: "Large blur values can be expensive on low-end devices. Keep production shadows below 80px where possible." });
  if (state.intensity < 0.07) messages.push({ id: "low-depth", severity: "info", message: "Low intensity can make the soft UI depth almost invisible, especially on bright displays." });
  if (state.intensity > 0.3) messages.push({ id: "high-depth", severity: "warning", message: "Very strong intensity can make neumorphism look dirty or overly contrasted." });
  if (values.ratio < 4.5) messages.push({ id: "contrast", severity: values.ratio < 3 ? "danger" : "warning", message: "Text on this surface may not meet WCAG contrast for normal text. Use larger text or a stronger foreground color." });
  if (state.size > 400 && state.blur > 70) messages.push({ id: "large-surface", severity: "warning", message: "Large neumorphic surfaces with heavy blur can increase paint work. Prefer smaller components or lighter blur." });
  return messages;
}

function MetricCard({ metric }: { metric: ProductionMetric }) {
  return (
    <div className={`min-w-0 rounded-[var(--radius-md)] border px-3 py-2.5 shadow-[var(--shadow-xs)] ${toneClass(metric.tone)}`}>
      <p className="font-mono text-xs font-black uppercase tracking-[0.12em] opacity-70">{metric.label}</p>
      <p className="mt-1 truncate text-sm font-black" title={metric.value}>{metric.value}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-4 opacity-75">{metric.detail}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white/65 px-3 py-2 shadow-sm backdrop-blur dark:bg-[var(--color-code-surface)]/70">
      <p className="font-mono text-xs font-black uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-[var(--color-text-primary)]" title={value}>{value}</p>
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

function randomHex() {
  const palette = ["#e0e0e0", "#dde7f3", "#f2d7ff", "#dbeafe", "#ecfccb", "#fee2e2", "#1f2937", "#111827"];
  return palette[Math.floor(Math.random() * palette.length)];
}

function randomizeState(current: NeumoState): NeumoState {
  const color = randomHex();
  const radius = [18, 24, 32, 42, 56, 999][Math.floor(Math.random() * 6)];
  const shape: Shape = ["flat", "convex", "concave", "pressed"][Math.floor(Math.random() * 4)] as Shape;
  const lightSource: LightSource = ["top-left", "top-right", "bottom-right", "bottom-left"][Math.floor(Math.random() * 4)] as LightSource;
  return {
    ...current,
    presetId: "custom",
    color,
    previewBackground: color,
    shape,
    lightSource,
    radius,
    distance: Math.round(8 + Math.random() * 24),
    blur: Math.round(18 + Math.random() * 44),
    spread: Math.round(-3 + Math.random() * 6),
    intensity: Number((0.1 + Math.random() * 0.16).toFixed(2)),
  };
}

export default function NeumorphicCssGeneratorClient() {
  const [state, setState] = useState<NeumoState>(defaultState);
  const values = useMemo(() => buildValues(state), [state]);
  const css = useMemo(() => generateCss(state), [state]);
  const metrics = useMemo(() => getProductionMetrics(state), [state]);
  const warnings = useMemo<WarningMessage[]>(() => validateState(state), [state]);
  const tabs = useMemo<CodeOutputTab[]>(
    () => [
      { id: "css", label: "CSS", language: "css", filename: "neumorphic.css", code: css },
      { id: "variables", label: "CSS vars", language: "css", filename: "neumorphic-variables.css", code: generateVariables(state) },
      { id: "tailwind", label: "Tailwind", language: "txt", filename: "neumorphic-tailwind.txt", code: generateTailwindStarter(state) },
      { id: "react", label: "React style", language: "tsx", filename: "neumorphic-style.ts", code: generateReactStyle(state) },
      { id: "tokens", label: "Tokens", language: "json", filename: "neumorphic.tokens.json", code: generateTokenJson(state) },
      { id: "html", label: "HTML", language: "html", filename: "neumorphic.html", code: `<div class=\"${safeClassName(state.className)}\">${state.label}</div>` },
    ],
    [css, state],
  );

  function patch(patchState: Partial<NeumoState>) {
    setState((current) => ({ ...current, ...patchState, presetId: patchState.presetId ?? "custom" }));
  }

  const previewStyle = useMemo(() => getPreviewSurfaceStyle(state), [state]);
  const previewSlot = (
    <div className="space-y-4">
      <PreviewToolbar
        title="Live soft UI preview"
        description="Shape the surface visually first. Production metrics and implementation code stay available when you need them."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Shuffle className="h-4 w-4" />} onClick={() => setState((current) => randomizeState(current))}>Randomize</Button>
            <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => downloadText("neumorphic.css", css)}>Download CSS</Button>
          </div>
        }
      />

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 sm:p-6" style={{ background: state.previewBackground }}>
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft">{labelize(state.previewMode)}</Badge>
          <Badge variant="soft">{labelize(state.shape)}</Badge>
          <Badge variant="soft">Light: {values.lightLabel}</Badge>
        </div>

        <div className="mt-4 flex min-h-[440px] items-center justify-center rounded-[var(--radius-md)] border border-white/25 bg-white/15 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-black/10">
          {state.previewMode === "dashboard" ? (
            <div className="grid w-full max-w-[700px] gap-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <section className="min-w-0 space-y-4 p-5" style={previewStyle}>
                <p className="font-mono text-xs font-black uppercase tracking-[0.14em] opacity-70">Dashboard card</p>
                <h3 className="text-2xl font-black">{state.label}</h3>
                <p className="text-sm font-semibold opacity-75">Soft depth works best for calm admin surfaces and low-density controls.</p>
                <div className="h-2 rounded-full bg-black/10"><div className="h-2 w-2/3 rounded-full bg-current opacity-50" /></div>
              </section>
              <div className="grid gap-4">
                <div className="h-24 rounded-[var(--radius-md)]" style={{ ...previewStyle, width: "100%", height: "auto" }} />
                <div className="h-24 rounded-[var(--radius-md)]" style={{ ...previewStyle, width: "100%", height: "auto", filter: "saturate(0.9)" }} />
              </div>
            </div>
          ) : state.previewMode === "button" ? (
            <button type="button" className="cursor-default text-center text-sm font-black" style={previewStyle}>{state.label}</button>
          ) : (
            <article className="flex flex-col items-center justify-center gap-3 text-center text-sm font-black" style={previewStyle}>
              <span className="font-mono text-xs uppercase tracking-[0.14em] opacity-70">Soft UI</span>
              <span className="text-2xl">{state.label}</span>
              <span className="max-w-[18rem] text-xs font-semibold leading-5 opacity-70">Raised and inset shadows are generated from the surface color.</span>
            </article>
          )}
        </div>
      </div>

      <section className="space-y-2">
        <div>
          <p className="text-sm font-black text-[var(--color-text-primary)]">Quick styles</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Start visually, then fine-tune the depth controls.</p>
        </div>
        <PresetGallery
          presets={presets}
          selectedId={state.presetId}
          onSelect={(_, preset) => setState(preset.state)}
          getId={(preset) => preset.id}
          getLabel={(preset) => preset.name}
          getDescription={(preset) => preset.description}
          renderPreview={(preset) => <div className="h-16 rounded-[var(--radius-md)]" style={{ background: preset.state.color, boxShadow: buildValues(preset.state).boxShadow }} />}
          className="sm:grid-cols-2 xl:grid-cols-5"
        />
      </section>

      <details className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-[var(--color-text-primary)]">Output details</summary>
        <div className="space-y-3 border-t border-[var(--color-border)] p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoPill label="Surface" value={state.color} />
            <InfoPill label="Shadow" value={`${state.distance}px / ${state.blur}px`} />
            <InfoPill label="Shape" value={labelize(state.shape)} />
            <InfoPill label="Light" value={values.lightLabel} />
          </div>
        </div>
      </details>
    </div>
  );

  const controlsSlot = (
    <ToolControlPanel title="Neumorphic settings" description="Tune the visible soft-UI effect first; advanced preview and export options stay out of the way." badge={<Badge variant="soft">Live</Badge>}>
      <ControlSection title="Preview">
        <SegmentedControl ariaLabel="Preview mode" value={state.previewMode} onChange={(previewMode) => patch({ previewMode })} options={(["card", "button", "dashboard"] as const).map((mode) => ({ value: mode, label: mode }))} />
      </ControlSection>

      <ControlSection title="Shape">
        <SegmentedControl ariaLabel="Shape" value={state.shape} onChange={(shape) => patch({ shape })} options={(["flat", "pressed", "convex", "concave"] as const).map((shape) => ({ value: shape, label: shape }))} />
      </ControlSection>

      <ControlSection title="Surface">
        <ControlGrid columns={2}>
          <ColorField label="Surface" value={state.color} onChange={(color) => patch({ color, previewBackground: color })} />
          <SliderNumberField label="Radius" value={state.radius} min={0} max={240} unit="px" onChange={(radius) => patch({ radius })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Depth & softness">
        <ControlGrid columns={2}>
          <SliderNumberField label="Distance" value={state.distance} min={2} max={60} unit="px" onChange={(distance) => patch({ distance })} />
          <SliderNumberField label="Blur" value={state.blur} min={4} max={120} unit="px" onChange={(blur) => patch({ blur })} />
          <SliderNumberField label="Intensity" value={state.intensity} min={0.03} max={0.36} step={0.01} onChange={(intensity) => patch({ intensity })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Light direction">
        <SegmentedControl ariaLabel="Light source" value={state.lightSource} onChange={(lightSource) => patch({ lightSource })} options={(["top-left", "top-right", "bottom-right", "bottom-left"] as const).map((source) => ({ value: source, label: labelize(source) }))} />
      </ControlSection>

      <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-black text-[var(--color-text-primary)]">Advanced surface & shadow</summary>
        <div className="space-y-3 border-t border-[var(--color-border)] p-3">
          <ControlGrid columns={2}>
            <ColorField label="Preview bg" value={state.previewBackground} onChange={(previewBackground) => patch({ previewBackground })} />
            <SliderNumberField label="Size" value={state.size} min={120} max={480} unit="px" onChange={(size) => patch({ size, radius: Math.min(state.radius, Math.round(size / 2)) })} />
            <SliderNumberField label="Spread" value={state.spread} min={-12} max={18} unit="px" onChange={(spread) => patch({ spread })} />
          </ControlGrid>
        </div>
      </details>

      <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-black text-[var(--color-text-primary)]">Content & export options</summary>
        <div className="space-y-3 border-t border-[var(--color-border)] p-3">
          <ControlGrid columns={1}>
            <Field label="Label" density="compact"><Input value={state.label} onChange={(event) => patch({ label: event.target.value })} /></Field>
            <Field label="CSS class" density="compact"><Input value={state.className} onChange={(event) => patch({ className: event.target.value })} /></Field>
            <CheckboxRow label="Include transition" checked={state.includeTransition} onChange={(includeTransition) => patch({ includeTransition })} />
            <CheckboxRow label="Include focus-visible ring" checked={state.includeFocusRing} onChange={(includeFocusRing) => patch({ includeFocusRing })} />
            <CheckboxRow label="Include reduced-motion guard" checked={state.includeReducedMotion} onChange={(includeReducedMotion) => patch({ includeReducedMotion })} />
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
          <Button variant="secondary" leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={() => setState(defaultState)}>Reset</Button>
          <CopyButton text={css}>Copy CSS</CopyButton>
        </div>
      }
      codeSlot={
        <details className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-[var(--color-text-primary)]">Developer handoff & diagnostics</summary>
          <div className="space-y-4 border-t border-[var(--color-border)] p-4">
            <WarningPanel title="Production notes" messages={warnings} />
            <CodeOutputPanel title="Generated neumorphic code" tabs={tabs} defaultTab="css" />
            <div className="flex flex-wrap gap-2">
              <CopyButton text={generateTokenJson(state)}>Copy tokens</CopyButton>
            </div>
          </div>
        </details>
      }
    />
  );
}
