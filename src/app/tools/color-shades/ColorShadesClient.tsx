"use client";

import { useEffect, useMemo, useState } from "react";
import tinycolor from "tinycolor2";
import { Button, CopyButton } from "@/components/ui";
import { CodeOutputPanel, ColorField, NumberField, WarningPanel } from "@/features/tools/components";
import type { ColorShade, ColorShadesParams } from "@/types";
import { generateShades } from "@/utils/color-shades";
import { COLOR_WORKFLOW_ID, readColorWorkflowState, writeColorWorkflowState } from "@/features/tools/workflows/browserState";
import { useActiveWorkflowId } from "@/features/tools/workflows/useActiveWorkflow";

type EnrichedShade = ColorShade & {
  label: string;
  index: number;
  textColor: "#000000" | "#ffffff";
  textLabel: "Black" | "White";
  contrast: number;
  rating: "AAA" | "AA" | "Large" | "Fail";
};

const QUICK_PRESETS: Array<{ label: string; color1: string; color2: string; steps: number }> = [
  { label: "Brand scale", color1: "#eff6ff", color2: "#1d4ed8", steps: 9 },
  { label: "Warm UI", color1: "#fff7ed", color2: "#c2410c", steps: 9 },
  { label: "Emerald", color1: "#ecfdf5", color2: "#047857", steps: 9 },
  { label: "Burgundy", color1: "#fff1f2", color2: "#800020", steps: 9 },
  { label: "Dark mode", color1: "#f8fafc", color2: "#020617", steps: 10 },
  { label: "Indigo SaaS", color1: "#eef2ff", color2: "#3730a3", steps: 10 },
  { label: "Rose commerce", color1: "#fff1f2", color2: "#be123c", steps: 10 },
  { label: "Teal healthcare", color1: "#f0fdfa", color2: "#0f766e", steps: 10 },
  { label: "Amber warning", color1: "#fffbeb", color2: "#b45309", steps: 10 },
  { label: "Slate neutral", color1: "#f8fafc", color2: "#334155", steps: 10 },
  { label: "Violet creator", color1: "#f5f3ff", color2: "#6d28d9", steps: 10 },
  { label: "Cyan data", color1: "#ecfeff", color2: "#0e7490", steps: 10 },
  { label: "Lime success", color1: "#f7fee7", color2: "#4d7c0f", steps: 10 },
  { label: "Orange food", color1: "#fff7ed", color2: "#ea580c", steps: 10 },
  { label: "Pink campaign", color1: "#fdf2f8", color2: "#be185d", steps: 10 },
  { label: "High contrast", color1: "#ffffff", color2: "#111827", steps: 11 },
];

const STEP_PRESETS = [5, 7, 9, 10, 11];

function clampSteps(value: number) {
  if (!Number.isFinite(value)) return 5;
  return Math.max(2, Math.min(20, Math.round(value)));
}

function normalizeHex(value: string) {
  const color = tinycolor(value);
  return color.isValid() ? color.toHexString() : value;
}

function relativeLuminance(hex: string) {
  const { r, g, b } = tinycolor(hex).toRgb();
  const channel = (value: number) => {
    const next = value / 255;
    return next <= 0.03928 ? next / 12.92 : ((next + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: string, b: string) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function ratingForContrast(ratio: number): EnrichedShade["rating"] {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "Large";
  return "Fail";
}

function shadeLabels(count: number) {
  if (count === 10) return ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
  if (count === 11) return ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
  if (count === 9) return ["100", "200", "300", "400", "500", "600", "700", "800", "900"];
  return Array.from({ length: count }, (_, index) => String(index + 1));
}

function enrichShades(shades: ColorShade[]): EnrichedShade[] {
  const labels = shadeLabels(shades.length);
  return shades.map((shade, index) => {
    const blackRatio = contrastRatio(shade.hex, "#000000");
    const whiteRatio = contrastRatio(shade.hex, "#ffffff");
    const useWhite = whiteRatio >= blackRatio;
    const contrast = useWhite ? whiteRatio : blackRatio;

    return {
      ...shade,
      index,
      label: labels[index] ?? String(index + 1),
      textColor: useWhite ? "#ffffff" : "#000000",
      textLabel: useWhite ? "White" : "Black",
      contrast,
      rating: ratingForContrast(contrast),
    };
  });
}

function formatRatio(value: number) {
  return `${value.toFixed(2)}:1`;
}

function buildCssVars(shades: EnrichedShade[]) {
  return shades.map((shade) => `--color-shade-${shade.label}: ${shade.hex};`).join("\n");
}

function buildTailwind(shades: EnrichedShade[]) {
  const lines = shades.map((shade) => `        ${shade.label}: "${shade.hex}",`).join("\n");
  return `// tailwind.config.ts\nexport default {\n  theme: {\n    extend: {\n      colors: {\n        custom: {\n${lines}\n        },\n      },\n    },\n  },\n};`;
}

function buildScssMap(shades: EnrichedShade[]) {
  return `$custom-shades: (\n${shades.map((shade) => `  "${shade.label}": ${shade.hex}`).join(",\n")}\n);`;
}

function buildJson(shades: EnrichedShade[]) {
  return JSON.stringify(
    shades.map((shade) => ({
      token: shade.label,
      hex: shade.hex,
      rgb: shade.rgb,
      hsl: shade.hsl,
      text: shade.textColor,
      contrast: Number(shade.contrast.toFixed(2)),
      wcag: shade.rating,
    })),
    null,
    2,
  );
}

function buildAccessibility(shades: EnrichedShade[]) {
  return shades
    .map((shade) => `${shade.label}: ${shade.hex} → ${shade.textLabel} text, ${formatRatio(shade.contrast)}, ${shade.rating}`)
    .join("\n");
}

function averageContrast(shades: EnrichedShade[]) {
  if (!shades.length) return 0;
  return shades.reduce((sum, shade) => sum + shade.contrast, 0) / shades.length;
}

function paletteHealth(shades: EnrichedShade[]) {
  const passCount = shades.filter((shade) => shade.rating !== "Fail").length;
  const aaaCount = shades.filter((shade) => shade.rating === "AAA").length;
  const avg = averageContrast(shades);

  if (shades.length && passCount === shades.length && aaaCount >= Math.ceil(shades.length * 0.6)) {
    return { label: "Production ready", detail: "Most shades support strong readable text.", tone: "good" as const };
  }
  if (shades.length && passCount >= Math.ceil(shades.length * 0.75)) {
    return { label: "Usable with checks", detail: `Average contrast is ${formatRatio(avg)}. Validate text roles before shipping.`, tone: "warn" as const };
  }
  return { label: "Needs review", detail: "Several shades are weak for text overlays. Use them as decoration/background only.", tone: "danger" as const };
}

function compactColorValue(value: string) {
  return value.replace(/^rgb\(/, "").replace(/^hsl\(/, "").replace(/\)$/, "");
}

export default function ColorShadesClient({ initialParams }: { initialParams: ColorShadesParams }) {
  const workflowId = useActiveWorkflowId();
  const [params, setParams] = useState<ColorShadesParams>(initialParams);
  const [workflowReady, setWorkflowReady] = useState(false);
  const [copiedShade, setCopiedShade] = useState<string | null>(null);
  const [showAllQuickPresets, setShowAllQuickPresets] = useState(false);

  useEffect(() => {
    function handleSuggestion(event: Event) {
      const detail = (event as CustomEvent<Partial<ColorShadesParams>>).detail;
      if (!detail) return;
      setParams((current) => ({
        ...current,
        color1: detail.color1 ?? current.color1,
        color2: detail.color2 ?? current.color2,
        steps: clampSteps(detail.steps ?? current.steps),
      }));
    }

    window.addEventListener("apply-suggestion", handleSuggestion);
    return () => window.removeEventListener("apply-suggestion", handleSuggestion);
  }, []);

  const generatedShades = useMemo(() => generateShades(params), [params]);
  const rawShades = generatedShades;
  const shades = useMemo(() => enrichShades(rawShades), [rawShades]);
  const isValid = generatedShades.length > 0;
  const health = paletteHealth(shades);
  const gradient = shades.length ? `linear-gradient(90deg, ${shades.map((shade) => shade.hex).join(", ")})` : "linear-gradient(90deg, #fff, #000)";
  const cssVars = buildCssVars(shades);
  const json = buildJson(shades);
  const tailwind = buildTailwind(shades);
  const scss = buildScssMap(shades);
  const accessibility = buildAccessibility(shades);
  const hexList = shades.map((shade) => shade.hex).join("\n");

  useEffect(() => {
    if (workflowId !== COLOR_WORKFLOW_ID) {
      setWorkflowReady(false);
      return;
    }
    const stored = readColorWorkflowState();
    if (stored) {
      const palette = stored.palette ?? [];
      setParams((current) => ({
        ...current,
        color1: palette[0] ?? stored.primary,
        color2: palette.at(-1) ?? stored.secondary ?? current.color2,
      }));
    }
    setWorkflowReady(true);
  }, [workflowId]);

  useEffect(() => {
    if (workflowId !== COLOR_WORKFLOW_ID || !workflowReady || shades.length === 0) return;
    const palette = shades.map((shade) => shade.hex);
    writeColorWorkflowState({
      primary: palette[Math.floor(palette.length / 2)] ?? palette[0] ?? "#3B82F6",
      secondary: palette.at(-1),
      palette,
    });
  }, [shades, workflowId, workflowReady]);

  function patch(next: Partial<ColorShadesParams>) {
    setParams((current) => ({ ...current, ...next, steps: clampSteps(next.steps ?? current.steps) }));
  }

  function applyPreset(preset: (typeof QUICK_PRESETS)[number]) {
    setParams({ color1: preset.color1, color2: preset.color2, steps: preset.steps });
  }

  async function copyShade(hex: string) {
    await navigator.clipboard.writeText(hex);
    setCopiedShade(hex);
    window.setTimeout(() => setCopiedShade((current) => (current === hex ? null : current)), 1200);
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Live shade scale</p>
            <h2 className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">{params.steps} generated shades</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">Click any shade to copy it. Build the scale first; accessibility and developer exports stay available below.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={hexList} size="sm" variant="secondary">Copy HEX list</CopyButton>
            <CopyButton text={cssVars} size="sm">Copy CSS</CopyButton>
          </div>
        </div>

        {isValid ? (
          <>
            <div className="grid min-h-52" style={{ gridTemplateColumns: `repeat(${Math.max(shades.length, 1)}, minmax(0, 1fr))` }}>
              {shades.map((shade) => (
                <button
                  key={`hero-${shade.label}-${shade.hex}`}
                  type="button"
                  onClick={() => copyShade(shade.hex)}
                  aria-label={`Copy ${shade.label} ${shade.hex}`}
                  className="group relative min-w-0 overflow-hidden text-left focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-strong)]"
                >
                  <span className="absolute inset-0" style={{ background: shade.hex }} />
                  <span
                    className="relative z-10 flex h-full min-h-52 flex-col justify-between p-2"
                    style={{ color: shade.textColor }}
                  >
                    <span className="font-mono text-xs font-bold">{shade.label}</span>
                    <span className="hidden -rotate-90 whitespace-nowrap font-mono text-xs font-bold opacity-0 transition group-hover:opacity-100 sm:block">
                      {copiedShade === shade.hex ? "Copied" : shade.hex}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="grid border-t border-[var(--color-border-subtle)] sm:grid-cols-3">
              <div className="p-3 sm:p-4">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Start</p>
                <p className="mt-1 font-mono text-sm font-bold text-[var(--color-text-primary)]">{normalizeHex(params.color1)}</p>
              </div>
              <div className="border-y border-[var(--color-border-subtle)] p-3 sm:border-x sm:border-y-0 sm:p-4">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Scale</p>
                <p className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">{params.steps} shades</p>
              </div>
              <div className="p-3 sm:p-4">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">End</p>
                <p className="mt-1 font-mono text-sm font-bold text-[var(--color-text-primary)]">{normalizeHex(params.color2)}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="p-5">
            <WarningPanel
              messages={[
                {
                  id: "invalid-color-shades",
                  severity: "danger",
                  title: "Invalid shade settings",
                  message: "Use valid hex colors and keep the number of shades between 2 and 20.",
                },
              ]}
            />
          </div>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="order-2 min-w-0 space-y-4 xl:order-1">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Shade tokens</h2>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">The generated scale stays copy-first. HEX is always visible; RGB and HSL remain available without dominating the card.</p>
              </div>
              <span className="w-fit rounded-[var(--radius-full)] bg-[var(--color-control-track)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--color-text-secondary)]">
                {shades.length} tokens
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {shades.map((shade) => (
                <article key={`${shade.label}-${shade.hex}`} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)]">
                  <div className="flex h-24 items-start justify-between p-2.5" style={{ background: shade.hex, color: shade.textColor }}>
                    <span className="rounded-[var(--radius-full)] bg-black/20 px-2 py-1 font-mono text-xs font-bold backdrop-blur-sm">{shade.label}</span>
                    <span className="rounded-[var(--radius-full)] bg-black/20 px-2 py-1 font-mono text-xs font-bold backdrop-blur-sm">{shade.rating}</span>
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-mono text-xs font-bold text-[var(--color-text-primary)]" title={shade.hex}>{shade.hex}</p>
                      <CopyButton text={shade.hex} size="sm" variant="secondary">Copy</CopyButton>
                    </div>
                    <details>
                      <summary className="cursor-pointer text-xs font-bold text-[var(--color-text-tertiary)]">More formats</summary>
                      <div className="mt-2 space-y-1">
                        <p className="truncate font-mono text-xs text-[var(--color-text-tertiary)]" title={shade.rgb}>{compactColorValue(shade.rgb)}</p>
                        <p className="truncate font-mono text-xs text-[var(--color-text-tertiary)]" title={shade.hsl}>{compactColorValue(shade.hsl)}</p>
                      </div>
                    </details>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Design preview</h2>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">See how the scale behaves in a small interface before exporting it.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-4" style={{ background: shades[0]?.hex, color: shades[shades.length - 1]?.hex }}>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-overlay)] p-4 text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Preview card</p>
                  <h3 className="mt-2 text-lg font-bold">Shade scale ready</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">Use lighter tones for surfaces, middle tones for accents, and stronger tones for emphasis.</p>
                  <button className="mt-4 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-bold" style={{ background: shades[Math.floor(shades.length * 0.65)]?.hex, color: shades[Math.floor(shades.length * 0.65)]?.textColor }}>
                    Sample button
                  </button>
                </div>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Recommended roles</p>
                <div className="mt-3 grid gap-2 text-sm">
                  <RoleRow label="Background" shade={shades[0]} />
                  <RoleRow label="Surface" shade={shades[Math.min(1, shades.length - 1)]} />
                  <RoleRow label="Primary" shade={shades[Math.floor(shades.length * 0.6)]} />
                  <RoleRow label="Hover" shade={shades[Math.min(shades.length - 1, Math.floor(shades.length * 0.75))]} />
                  <RoleRow label="Strong" shade={shades[shades.length - 1]} />
                </div>
              </div>
            </div>
          </div>

          <details className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
            <summary className="cursor-pointer list-none p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Palette health & accessibility</h2>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">WCAG text recommendations stay available without interrupting shade generation.</p>
                </div>
                <span
                  className={
                    health.tone === "good"
                      ? "shrink-0 rounded-[var(--radius-full)] bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700"
                      : health.tone === "warn"
                        ? "shrink-0 rounded-[var(--radius-full)] bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700"
                        : "shrink-0 rounded-[var(--radius-full)] bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-700"
                  }
                >
                  {health.label}
                </span>
              </div>
            </summary>
            <div className="border-t border-[var(--color-border-subtle)] p-4">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-[var(--radius-full)] bg-[var(--color-control-track)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--color-text-secondary)]">
                  avg {formatRatio(averageContrast(shades))}
                </span>
                <p className="text-sm text-[var(--color-text-secondary)]">{health.detail}</p>
              </div>
              <div className="space-y-3">
                {shades.map((shade) => (
                  <div key={`a11y-${shade.label}`} className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center">
                    <div className="h-12 rounded-[var(--radius-sm)] border border-[var(--color-border-default)]" style={{ background: shade.hex }} />
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold text-[var(--color-text-primary)]">{shade.label} · {shade.hex}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Use {shade.textLabel.toLowerCase()} text · contrast {formatRatio(shade.contrast)}</p>
                    </div>
                    <span className="w-fit rounded-[var(--radius-full)] bg-[var(--color-control-track)] px-3 py-1 font-mono text-xs font-bold text-[var(--color-text-primary)]">{shade.rating}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <CopyButton text={accessibility} size="sm" variant="secondary">Copy a11y report</CopyButton>
              </div>
            </div>
          </details>

          <details className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
            <summary className="cursor-pointer list-none p-4">
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Developer exports</h2>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">CSS variables, Tailwind, JSON, SCSS, and the full gradient stay one click away.</p>
              </div>
            </summary>
            <div className="border-t border-[var(--color-border-subtle)] p-4">
              <CodeOutputPanel
                title="Export palette"
                description="Copy the generated scale for CSS, Tailwind, design tokens, or documentation."
                defaultTab="css"
                tabs={[
                  { id: "css", label: "CSS", code: cssVars, language: "css" },
                  { id: "tailwind", label: "Tailwind", code: tailwind, language: "ts" },
                  { id: "json", label: "JSON", code: json, language: "json" },
                  { id: "scss", label: "SCSS", code: scss, language: "scss" },
                  { id: "gradient", label: "Gradient", code: `background: ${gradient};`, language: "css" },
                ]}
                className="[&_pre]:min-h-[16rem] [&_pre]:max-h-[24rem]"
              />
            </div>
          </details>
        </div>

        <aside className="order-1 min-w-0 space-y-4 xl:order-2 xl:sticky xl:top-24">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Build your scale</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">Choose the endpoints and number of shades. The scale updates instantly.</p>
            </div>

            <div className="mt-4 grid gap-3">
              <ColorField label="Start color" value={params.color1} onChange={(color1) => patch({ color1 })} />
              <ColorField label="End color" value={params.color2} onChange={(color2) => patch({ color2 })} />
              <NumberField label="Number of shades" value={params.steps} min={2} max={20} onChange={(steps) => patch({ steps })} width="full" />
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold text-[var(--color-text-secondary)]">Common scale sizes</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {STEP_PRESETS.map((step) => (
                  <Button key={step} size="sm" variant={params.steps === step ? "soft" : "secondary"} onClick={() => patch({ steps: step })}>
                    {step}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <details className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
            <summary className="cursor-pointer list-none p-4">
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Quick scale presets</h2>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">Start from the closest product role, then replace the endpoints with your real brand colors.</p>
              </div>
            </summary>
            <div className="grid gap-2 border-t border-[var(--color-border-subtle)] p-4">
              {(showAllQuickPresets ? QUICK_PRESETS : QUICK_PRESETS.slice(0, 6)).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-left transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-control-hover)]"
                >
                  <span className="block h-10" style={{ background: `linear-gradient(90deg, ${preset.color1}, ${preset.color2})` }} />
                  <span className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">{preset.label}</span>
                    <span className="font-mono text-xs text-[var(--color-text-tertiary)]">{preset.steps} shades</span>
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowAllQuickPresets((value) => !value)}
                aria-expanded={showAllQuickPresets}
                className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] px-3 py-2 text-xs font-bold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-control-hover)]"
              >
                {showAllQuickPresets ? "Show fewer" : `Show all ${QUICK_PRESETS.length} scales`}
              </button>
            </div>
          </details>
        </aside>
      </section>
    </div>
  );
}

function RoleRow({ label, shade }: { label: string; shade?: EnrichedShade }) {
  if (!shade) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="h-6 w-6 shrink-0 rounded-[var(--radius-xs)] border border-[var(--color-border-default)]" style={{ background: shade.hex }} />
        <span className="truncate text-xs font-bold text-[var(--color-text-primary)]">{label}</span>
      </div>
      <span className="shrink-0 font-mono text-xs text-[var(--color-text-tertiary)]">{shade.label}</span>
    </div>
  );
}
