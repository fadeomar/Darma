"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Droplets, Eye, Layers, Palette, SlidersHorizontal } from "lucide-react";
import { Badge, Button, CopyButton, Input } from "@/components/ui";
import SurfaceCard from "@/components/ui/SurfaceCard";
import { cn } from "@/lib/cn";
import { COLOR_WORKFLOW_ID, readColorWorkflowState, writeColorWorkflowState } from "@/features/tools/workflows/browserState";
import { useActiveWorkflowId } from "@/features/tools/workflows/useActiveWorkflow";
import {
  COLOR_EXAMPLES,
  formatCmyk,
  formatLab,
  formatOklch,
  type ParsedColorResult,
  parseColorInput,
} from "./color";

type TabId = "overview" | "scale" | "accessibility" | "exports";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "scale", label: "Scale" },
  { id: "accessibility", label: "A11y" },
  { id: "exports", label: "Exports" },
];

function compactFormatLabel(format: string) {
  if (format === "css-name") return "CSS name";
  return format.toUpperCase();
}

function ValueCard({
  label,
  value,
  copyValue = value,
  hint,
}: {
  label: string;
  value: string;
  copyValue?: string;
  hint?: string;
}) {
  return (
    <section className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3 shadow-[var(--shadow-xs)]">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            {label}
          </p>
          <code className="mt-1 block truncate font-mono text-sm font-black leading-6 text-[var(--color-text-primary)]" title={value}>
            {value}
          </code>
        </div>
        <CopyButton text={copyValue} size="sm" variant="secondary" className="shrink-0 px-2">
          Copy
        </CopyButton>
      </div>
      {hint ? <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">{hint}</p> : null}
    </section>
  );
}

function MiniMetric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "warning" | "danger" }) {
  const toneClass = {
    neutral: "bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)] border-[var(--color-border-subtle)]",
    good: "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--color-success-border)]",
    warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border-[var(--color-warning-border)]",
    danger: "bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border-[var(--color-danger-border)]",
  }[tone];

  return (
    <div className={cn("rounded-[var(--radius-md)] border p-3", toneClass)}>
      <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] opacity-75">{label}</p>
      <p className="mt-1 text-lg font-black tracking-[-0.02em]">{value}</p>
    </div>
  );
}

function SectionTitle({ icon, title, description }: { icon?: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-[var(--color-primary-text-strong)]">{icon}</span> : null}
          <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{title}</h3>
        </div>
        {description ? <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p> : null}
      </div>
    </div>
  );
}

function InvalidState({ parsed }: { parsed: Extract<ParsedColorResult, { ok: false }> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]">
      <SurfaceCard className="border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-danger-text)]" />
          <div>
            <h3 className="font-black text-[var(--color-danger-text)]">Invalid color</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-danger-text)]">{parsed.error}</p>
          </div>
        </div>
      </SurfaceCard>
      <SurfaceCard>
        <h3 className="font-black text-[var(--color-text-primary)]">Try a supported value</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {COLOR_EXAMPLES.map((item) => (
            <Badge key={item.value} variant="outline" className="normal-case">
              {item.value}
            </Badge>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

function ColorInputPanel({
  input,
  setInput,
  parsed,
}: {
  input: string;
  setInput: (value: string) => void;
  parsed: ParsedColorResult;
}) {
  const pickerValue = parsed.ok ? parsed.hex : "#3b82f6";

  return (
    <SurfaceCard className="min-w-0 overflow-hidden p-0">
      <div
        className="min-h-[230px] p-5 text-white sm:p-6"
        style={{
          background: parsed.ok ? parsed.hex : "var(--color-surface-subtle)",
          color: parsed.ok ? parsed.bestTextColor : "var(--color-text-primary)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs font-black uppercase tracking-[0.12em] opacity-80">Preview</p>
            <h3 className="mt-4 break-words text-4xl font-black leading-none tracking-[-0.05em] sm:text-5xl">
              {parsed.ok ? parsed.hex : "Invalid"}
            </h3>
            <p className="mt-3 text-sm font-semibold opacity-85">
              {parsed.ok ? `Detected ${compactFormatLabel(parsed.detectedFormat)}` : "Waiting for a valid color"}
            </p>
          </div>
          {parsed.ok ? (
            <div className="rounded-[var(--radius-md)] bg-white/18 px-3 py-2 text-right backdrop-blur-sm">
              <p className="font-mono text-xs font-black uppercase tracking-[0.08em] opacity-80">Alpha</p>
              <p className="text-xl font-black">{Math.round(parsed.alpha * 100)}%</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <label className="block min-w-0">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Color input</span>
          <div className="mt-2 flex min-w-0 gap-2">
            <Input
              className="min-w-0 font-mono"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="#3b82f6"
              aria-invalid={!parsed.ok || undefined}
            />
            <input
              type="color"
              value={pickerValue}
              onChange={(event) => setInput(event.target.value)}
              className="h-11 w-12 shrink-0 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-1"
              aria-label="Color picker"
            />
          </div>
        </label>

        <div className="flex flex-wrap gap-2">
          {COLOR_EXAMPLES.map((item) => (
            <Button key={item.value} size="sm" variant="secondary" onClick={() => setInput(item.value)}>
              {item.label}
            </Button>
          ))}
        </div>

        {parsed.ok ? (
          <div className="flex flex-wrap gap-2">
            <CopyButton text={parsed.hex} size="sm">Copy HEX</CopyButton>
            <CopyButton text={parsed.cssModernRgb} size="sm" variant="secondary">Copy RGB</CopyButton>
            <CopyButton text={parsed.cssModernHsl} size="sm" variant="secondary">Copy HSL</CopyButton>
          </div>
        ) : null}
      </div>
    </SurfaceCard>
  );
}

function ConversionGrid({ parsed }: { parsed: Extract<ParsedColorResult, { ok: true }> }) {
  const items = [
    { label: "HEX", value: parsed.hex, copy: parsed.hex, hint: parsed.hasAlpha ? `Alpha HEX: ${parsed.hexAlpha}` : "Compact CSS token." },
    { label: "RGB", value: `${parsed.rgb.r}, ${parsed.rgb.g}, ${parsed.rgb.b}`, copy: parsed.cssRgb, hint: parsed.cssModernRgb },
    { label: "HSL", value: `${Math.round(parsed.hsl.h)}, ${Math.round(parsed.hsl.s)}%, ${Math.round(parsed.hsl.l)}%`, copy: parsed.cssHsl, hint: parsed.cssModernHsl },
    { label: "HSV", value: `${Math.round(parsed.hsv.h)}, ${Math.round(parsed.hsv.s)}%, ${Math.round(parsed.hsv.v)}%`, copy: `${Math.round(parsed.hsv.h)}, ${Math.round(parsed.hsv.s)}%, ${Math.round(parsed.hsv.v)}%` },
    { label: "HWB", value: `${Math.round(parsed.hwb.h)}, ${Math.round(parsed.hwb.w)}%, ${Math.round(parsed.hwb.b)}%`, copy: parsed.cssHwb, hint: parsed.cssHwb },
    { label: "CMYK", value: formatCmyk(parsed.cmyk), copy: `cmyk(${formatCmyk(parsed.cmyk)})` },
    { label: "LAB", value: formatLab(parsed.lab), copy: formatLab(parsed.lab) },
    { label: "OKLCH", value: formatOklch(parsed.oklch), copy: `oklch(${formatOklch(parsed.oklch)})` },
  ];

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <ValueCard key={item.label} label={item.label} value={item.value} copyValue={item.copy} hint={item.hint} />
      ))}
    </div>
  );
}

function OverviewTab({ parsed }: { parsed: Extract<ParsedColorResult, { ok: true }> }) {
  return (
    <div className="space-y-4">
      {parsed.hasAlpha ? (
        <SurfaceCard className="border-[var(--color-warning-border)] bg-[var(--color-warning-bg)]">
          <div className="flex items-start gap-3">
            <Droplets className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-warning-text)]" />
            <div>
              <h3 className="font-black text-[var(--color-warning-text)]">Alpha detected</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--color-warning-text)]">
                Solid conversions use {parsed.hex}. Alpha-aware CSS values are still available in RGB, HSL, HWB, and HEX alpha.
              </p>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <SectionTitle icon={<Palette className="h-4 w-4" />} title="Color relationships" description="Fast harmony suggestions from the same base hue." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {parsed.relationships.map((item) => {
            const text = item.hex === "#ffffff" ? "#000000" : "#ffffff";
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigator.clipboard.writeText(item.hex)}
                className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-left shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]"
                title="Click to copy HEX"
              >
                <div className="h-20 p-3" style={{ background: item.hex, color: text }}>
                  <p className="font-mono text-xs font-black uppercase tracking-[0.08em] opacity-85">{item.label}</p>
                </div>
                <div className="min-w-0 p-3">
                  <p className="truncate font-mono text-xs font-bold text-[var(--color-text-primary)]">{item.hex}</p>
                  <p className="mt-1 truncate font-mono text-xs text-[var(--color-text-tertiary)]">{item.cssHsl}</p>
                </div>
              </button>
            );
          })}
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionTitle icon={<Layers className="h-4 w-4" />} title="Production preview" description="Quick check for foreground, background, border, and action states." />
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--shadow-sm)]">
            <Badge variant="soft">Brand sample</Badge>
            <h4 className="mt-4 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Build a reliable color token</h4>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]">
              Use the converted values as design tokens, CSS variables, or framework color extensions.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-black shadow-[var(--shadow-xs)]"
                style={{ background: parsed.hex, color: parsed.bestTextColor }}
              >
                Primary action
              </button>
              <span className="rounded-[var(--radius-full)] border px-3 py-1 text-xs font-black" style={{ borderColor: parsed.hex, color: parsed.hex }}>
                Token {parsed.hex}
              </span>
            </div>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}

function ScaleTab({ parsed }: { parsed: Extract<ParsedColorResult, { ok: true }> }) {
  return (
    <SurfaceCard>
      <SectionTitle icon={<SlidersHorizontal className="h-4 w-4" />} title="Accessible shade scale" description="Tailwind-style steps with the best black or white text choice for each swatch." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {parsed.shades.map((shade) => (
          <button
            key={shade.label}
            type="button"
            onClick={() => navigator.clipboard.writeText(shade.hex)}
            className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-left shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]"
            title="Click to copy HEX"
          >
            <div className="flex h-24 flex-col justify-between p-3" style={{ background: shade.hex, color: shade.bestTextColor }}>
              <span className="font-mono text-xs font-black">{shade.label}</span>
              <span className="font-mono text-xs font-black">{shade.accessibility}</span>
            </div>
            <div className="p-3">
              <p className="truncate font-mono text-xs font-black text-[var(--color-text-primary)]">{shade.hex}</p>
              <p className="mt-1 text-xs font-semibold text-[var(--color-text-tertiary)]">{shade.contrast}:1 contrast</p>
            </div>
          </button>
        ))}
      </div>
    </SurfaceCard>
  );
}

function AccessibilityTab({ parsed }: { parsed: Extract<ParsedColorResult, { ok: true }> }) {
  const whiteBetter = parsed.contrastWithWhite >= parsed.contrastWithBlack;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <SurfaceCard>
        <SectionTitle icon={<Eye className="h-4 w-4" />} title="Text contrast" description="WCAG contrast against black and white text." />
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniMetric label="Black text" value={`${parsed.contrastWithBlack}:1`} tone={parsed.contrastLevelBlack === "Fail" ? "danger" : parsed.contrastLevelBlack === "Large" ? "warning" : "good"} />
          <MiniMetric label="White text" value={`${parsed.contrastWithWhite}:1`} tone={parsed.contrastLevelWhite === "Fail" ? "danger" : parsed.contrastLevelWhite === "Large" ? "warning" : "good"} />
        </div>
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success-text)]" />
            <div>
              <p className="font-black text-[var(--color-text-primary)]">{whiteBetter ? "White text is stronger" : "Black text is stronger"}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                Recommended foreground: <code className="font-mono">{parsed.bestTextColor}</code>. Always validate final UI with real font size and weight.
              </p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionTitle title="Readable samples" description="The same color used in common UI surfaces." />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] p-5" style={{ background: parsed.hex, color: "#ffffff" }}>
            <p className="font-black">White text</p>
            <p className="mt-2 text-sm opacity-90">Contrast {parsed.contrastWithWhite}:1 · {parsed.contrastLevelWhite}</p>
          </div>
          <div className="rounded-[var(--radius-md)] p-5" style={{ background: parsed.hex, color: "#000000" }}>
            <p className="font-black">Black text</p>
            <p className="mt-2 text-sm opacity-90">Contrast {parsed.contrastWithBlack}:1 · {parsed.contrastLevelBlack}</p>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}

function ExportCard({ title, code }: { title: string; code: string }) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-code-border)] bg-[var(--color-code-surface)] px-4 py-3">
        <h4 className="font-mono text-xs font-black uppercase tracking-[0.08em] text-[var(--color-code-text)]">{title}</h4>
        <CopyButton text={code} size="sm" variant="secondary">Copy</CopyButton>
      </div>
      <pre className="max-h-72 overflow-auto p-4 text-xs leading-6 text-[var(--color-code-text)]"><code>{code}</code></pre>
    </section>
  );
}

function ExportsTab({ parsed }: { parsed: Extract<ParsedColorResult, { ok: true }> }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ExportCard title="CSS variables" code={parsed.exports.cssVariables} />
      <ExportCard title="Tailwind config" code={parsed.exports.tailwindConfig} />
      <ExportCard title="JSON token" code={parsed.exports.jsonToken} />
      <ExportCard title="SCSS map" code={parsed.exports.scssMap} />
    </div>
  );
}

function ResultTabs({ parsed }: { parsed: Extract<ParsedColorResult, { ok: true }> }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            size="sm"
            variant={activeTab === tab.id ? "primary" : "ghost"}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "overview" ? <OverviewTab parsed={parsed} /> : null}
      {activeTab === "scale" ? <ScaleTab parsed={parsed} /> : null}
      {activeTab === "accessibility" ? <AccessibilityTab parsed={parsed} /> : null}
      {activeTab === "exports" ? <ExportsTab parsed={parsed} /> : null}
    </div>
  );
}

export default function ColorConverterClient() {
  const workflowId = useActiveWorkflowId();
  const [input, setInput] = useState("#3b82f6");
  const [workflowReady, setWorkflowReady] = useState(false);
  const parsed = useMemo(() => parseColorInput(input), [input]);

  useEffect(() => {
    if (workflowId !== COLOR_WORKFLOW_ID) {
      setWorkflowReady(false);
      return;
    }
    const stored = readColorWorkflowState();
    if (stored?.primary) setInput(stored.primary);
    setWorkflowReady(true);
  }, [workflowId]);

  useEffect(() => {
    if (workflowId !== COLOR_WORKFLOW_ID || !workflowReady || !parsed.ok) return;
    const stored = readColorWorkflowState();
    writeColorWorkflowState({
      primary: parsed.hex,
      secondary: stored?.secondary,
      palette: stored?.palette,
    });
  }, [parsed, workflowId, workflowReady]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(320px,470px)_minmax(0,1fr)] xl:items-start">
        <ColorInputPanel input={input} setInput={setInput} parsed={parsed} />
        <div className="min-w-0 space-y-4">
          {parsed.ok ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniMetric label="Format" value={compactFormatLabel(parsed.detectedFormat)} />
                <MiniMetric label="Alpha" value={`${Math.round(parsed.alpha * 100)}%`} tone={parsed.hasAlpha ? "warning" : "good"} />
                <MiniMetric label="Best text" value={parsed.bestTextColor === "#ffffff" ? "White" : "Black"} tone="good" />
              </div>
              <ConversionGrid parsed={parsed} />
            </>
          ) : (
            <InvalidState parsed={parsed as Extract<ParsedColorResult, { ok: false }>} />
          )}
        </div>
      </div>

      {parsed.ok ? <ResultTabs parsed={parsed} /> : null}
    </div>
  );
}
