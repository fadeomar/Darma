"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Download, RotateCcw, Wand2 } from "lucide-react";
import { Badge, Button, CopyButton, Field, Input, Select } from "@/components/ui";
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
import { COLOR_WORKFLOW_ID, readColorWorkflowState, readableTextColor } from "@/features/tools/workflows/browserState";
import { useActiveWorkflowId } from "@/features/tools/workflows/useActiveWorkflow";
import { buttonPresets, defaultButtonConfig } from "./presets";
import {
  generateButtonCss,
  generateButtonHtml,
  generateButtonJsx,
  generateButtonReactStyle,
  generateButtonTailwind,
  generateButtonTokenJson,
  generateButtonVariables,
  getContrastRating,
  getContrastRatio,
  getReadableTextColor,
  safeClassName,
} from "./generators";
import type { ButtonGeneratorConfig, ButtonHoverEffect, ButtonVariant, IconPosition } from "./types";

const variants: Array<{ value: ButtonVariant; label: string }> = [
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
  { value: "gradient", label: "Gradient" },
  { value: "glass", label: "Glass" },
  { value: "neumorphic", label: "Neumorphic" },
  { value: "three-d", label: "3D" },
  { value: "icon", label: "Icon" },
  { value: "loading", label: "Loading" },
  { value: "pill", label: "Pill" },
];

const hoverOptions: ButtonHoverEffect[] = ["lift", "glow", "darken", "scale", "slide", "none"];
const previewStates = ["default", "hover", "active", "disabled"] as const;
type PreviewState = (typeof previewStates)[number];

type MetricTone = "good" | "warning" | "danger" | "neutral";

type ProductionMetric = {
  label: string;
  value: string;
  detail: string;
  tone: MetricTone;
};

function CheckboxRow({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-9 items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-[var(--shadow-xs)]">
      <span className="min-w-0 text-xs font-semibold leading-5">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 shrink-0 accent-[var(--color-accent)]" />
    </label>
  );
}

function toneClass(tone: MetricTone) {
  if (tone === "good") return "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100";
  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100";
  return "border-[var(--color-border-default)] bg-[var(--color-surface-strong)] text-[var(--color-text-primary)]";
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

function getButtonLabel(config: ButtonGeneratorConfig) {
  if (config.variant === "icon") return config.iconSymbol || "→";
  return config.text || "Button";
}

function getPreviewButtonClasses(config: ButtonGeneratorConfig, previewState: PreviewState) {
  const classes = [safeClassName(config.className)];
  if (previewState === "hover") classes.push("is-preview-hover");
  if (previewState === "active") classes.push("is-preview-active");
  return classes.join(" ");
}

function renderButtonContent(config: ButtonGeneratorConfig) {
  const spinner = config.variant === "loading" ? <span className={`${safeClassName(config.className)}__spinner`} aria-hidden="true" /> : null;
  const icon = config.variant === "icon" ? <span aria-hidden="true">{config.iconSymbol || "→"}</span> : null;
  const label = config.variant === "icon" ? <span className={`${safeClassName(config.className)}__sr-only`}>{config.text}</span> : config.text;
  return config.iconPosition === "left" ? <>{icon}{spinner}{label}</> : <>{spinner}{label}{icon}</>;
}

function getProductionMetrics(config: ButtonGeneratorConfig, ratio: number): ProductionMetric[] {
  const rating = getContrastRating(ratio);
  const clickArea = config.paddingY * 2 + config.fontSize;
  const paintCost = config.shadow > 36 || config.variant === "glass" || config.variant === "neumorphic" ? "Medium" : "Low";
  return [
    {
      label: "Contrast",
      value: `${ratio}:1`,
      detail: `${rating} for ${config.textColor} on ${config.background}`,
      tone: rating === "AAA" || rating === "AA" ? "good" : rating === "Large text" ? "warning" : "danger",
    },
    {
      label: "Tap target",
      value: `${clickArea}px`,
      detail: clickArea >= 44 ? "Comfortable touch size" : "Increase padding for mobile",
      tone: clickArea >= 44 ? "good" : "warning",
    },
    {
      label: "Paint cost",
      value: paintCost,
      detail: config.shadow > 40 ? "Large shadow may cost more on dense screens" : "Safe for most interfaces",
      tone: config.shadow > 46 ? "warning" : "good",
    },
    {
      label: "Fallback",
      value: config.variant === "glass" ? "Needed" : "Native",
      detail: config.variant === "glass" ? "Glass styles need a solid fallback in older browsers" : "No special fallback required",
      tone: config.variant === "glass" ? "warning" : "good",
    },
  ];
}

function getPreviewBackground(config: ButtonGeneratorConfig): CSSProperties {
  if (config.variant === "glass") {
    return {
      background: `radial-gradient(circle at 22% 18%, ${config.background2} 0 18%, transparent 32%), linear-gradient(135deg, #0f172a, #312e81 48%, #164e63)`,
    };
  }
  if (config.variant === "neumorphic") {
    return { background: `linear-gradient(135deg, ${config.background}, #ffffff)` };
  }
  return {
    background: "radial-gradient(circle at top, var(--color-primary-soft), transparent 34%), linear-gradient(135deg, var(--color-preview-bg), var(--color-preview-bg-strong))",
  };
}

export default function ButtonsCssGeneratorClient() {
  const workflowId = useActiveWorkflowId();
  const [config, setConfig] = useState<ButtonGeneratorConfig>(defaultButtonConfig);
  const [previewState, setPreviewState] = useState<PreviewState>("default");

  const previewConfig = previewState === "disabled" ? { ...config, disabled: true } : config;
  const css = useMemo(() => generateButtonCss(previewConfig), [previewConfig]);
  const html = useMemo(() => generateButtonHtml(previewConfig), [previewConfig]);
  const jsx = useMemo(() => generateButtonJsx(previewConfig), [previewConfig]);
  const tailwind = useMemo(() => generateButtonTailwind(previewConfig), [previewConfig]);
  const variables = useMemo(() => generateButtonVariables(previewConfig), [previewConfig]);
  const reactStyle = useMemo(() => generateButtonReactStyle(previewConfig), [previewConfig]);
  const tokenJson = useMemo(() => generateButtonTokenJson(previewConfig), [previewConfig]);
  const contrastRatio = useMemo(() => getContrastRatio(previewConfig.textColor, previewConfig.variant === "outline" || previewConfig.variant === "ghost" ? "#ffffff" : previewConfig.background), [previewConfig]);
  const productionMetrics = useMemo(() => getProductionMetrics(previewConfig, contrastRatio), [previewConfig, contrastRatio]);

  useEffect(() => {
    if (workflowId !== COLOR_WORKFLOW_ID) return;
    const stored = readColorWorkflowState();
    if (!stored) return;
    const palette = stored.palette ?? [];
    const primary = palette[Math.floor(palette.length / 2)] ?? stored.primary;
    const secondary = palette.at(-1) ?? stored.secondary ?? primary;
    setConfig((current) => ({
      ...current,
      variant: primary !== secondary ? "gradient" : current.variant,
      background: primary,
      background2: secondary,
      borderColor: primary,
      textColor: readableTextColor(primary),
    }));
  }, [workflowId]);

  const tabs = useMemo<CodeOutputTab[]>(() => [
    { id: "css", label: "CSS", language: "css", filename: "button.css", code: css },
    { id: "vars", label: "CSS vars", language: "css", filename: "button.variables.css", code: variables },
    { id: "html", label: "HTML", language: "html", filename: "button.html", code: html },
    { id: "jsx", label: "React JSX", language: "tsx", filename: "GeneratedButton.tsx", code: jsx },
    { id: "style", label: "React style", language: "tsx", filename: "button-style.ts", code: reactStyle },
    { id: "tailwind", label: "Tailwind", language: "txt", filename: "button-tailwind.txt", code: tailwind },
    { id: "tokens", label: "Tokens", language: "json", filename: "button.tokens.json", code: tokenJson },
  ], [css, html, jsx, reactStyle, tailwind, tokenJson, variables]);

  const warnings = useMemo<WarningMessage[]>(() => {
    const messages: WarningMessage[] = [];
    if (contrastRatio < 4.5 && config.variant !== "icon") messages.push({ id: "contrast", severity: "danger", title: "Contrast needs review", message: "Text contrast is below AA for normal-size button labels. Use a darker text color or stronger background." });
    if (config.shadow > 42) messages.push({ id: "shadow", severity: "warning", title: "Heavy shadow", message: "Large shadows can look heavy and may be more expensive on dense dashboards." });
    if (config.paddingY * 2 + config.fontSize < 44) messages.push({ id: "tap", severity: "warning", title: "Small tap target", message: "Mobile buttons should usually be at least 44px tall." });
    if (config.variant === "glass") messages.push({ id: "glass", severity: "info", title: "Glass fallback", message: "Use the generated CSS with a readable solid fallback when backdrop-filter is unsupported." });
    if (config.disabled) messages.push({ id: "disabled", severity: "info", title: "Disabled state", message: "Disabled buttons should not be the only way to explain why an action is unavailable." });
    return messages;
  }, [config, contrastRatio]);

  function patch(patchConfig: Partial<ButtonGeneratorConfig>) {
    setConfig((current) => ({ ...current, ...patchConfig }));
  }

  function applyReadableText() {
    const background = config.variant === "outline" || config.variant === "ghost" ? "#ffffff" : config.background;
    patch({ textColor: getReadableTextColor(background) });
  }

  const previewSlot = (
    <div className="space-y-4">
      <style>{css}</style>
      <PreviewToolbar
        title="Button preview"
        description="Preview production states before copying the code. Hover/active states are simulated without needing real pointer interaction."
        actions={
          <SegmentedControl
            ariaLabel="Preview state"
            value={previewState}
            onChange={(value) => setPreviewState(value)}
            options={previewStates.map((state) => ({ value: state, label: state }))}
          />
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {productionMetrics.map((metric) => (
          <div key={metric.label} className={`rounded-[var(--radius-md)] border px-3 py-2.5 shadow-[var(--shadow-xs)] ${toneClass(metric.tone)}`}>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] opacity-70">{metric.label}</div>
            <div className="mt-1 text-lg font-black tracking-[-0.03em]">{metric.value}</div>
            <p className="mt-1 text-xs leading-5 opacity-80">{metric.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <div className="flex min-h-[320px] items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-6 shadow-[var(--shadow-sm)]" style={getPreviewBackground(config)}>
          <button
            type="button"
            className={getPreviewButtonClasses(previewConfig, previewState)}
            disabled={previewState === "disabled" || previewConfig.disabled}
            aria-busy={previewConfig.variant === "loading"}
            aria-label={previewConfig.variant === "icon" ? previewConfig.text : undefined}
          >
            {renderButtonContent(previewConfig)}
          </button>
        </div>

        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-xs)]">
          <div>
            <h3 className="text-sm font-black tracking-[-0.01em] text-[var(--color-text-primary)]">Production preview</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">The button inside a common product card, not just centered on a blank canvas.</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-strong)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Checkout</p>
                <h4 className="mt-1 text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Upgrade your workspace</h4>
                <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">Button fits cards, modals, forms, and compact dashboards.</p>
              </div>
              <span className="rounded-full border border-[var(--color-border-default)] px-2 py-1 font-mono text-[10px] font-bold uppercase text-[var(--color-text-tertiary)]">Live</span>
            </div>
            <div className="mt-4">
              <button type="button" className={getPreviewButtonClasses(previewConfig, previewState)} disabled={previewState === "disabled" || previewConfig.disabled}>
                {renderButtonContent(previewConfig)}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-strong)] px-3 py-2">
              <span className="block font-mono text-[10px] font-bold uppercase text-[var(--color-text-tertiary)]">Class</span>
              <span className="mt-1 block truncate font-semibold text-[var(--color-text-primary)]">.{safeClassName(config.className)}</span>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-strong)] px-3 py-2">
              <span className="block font-mono text-[10px] font-bold uppercase text-[var(--color-text-tertiary)]">Variant</span>
              <span className="mt-1 block truncate font-semibold text-[var(--color-text-primary)]">{config.variant}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {buttonPresets.slice(0, 4).map((preset) => (
          <button key={preset.id} type="button" onClick={() => setConfig(preset.config)} className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-3 text-left transition hover:border-[var(--color-accent)] hover:bg-[var(--color-control-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]">
            <span className="block text-sm font-bold text-[var(--color-text-primary)]">{preset.name}</span>
            <span className="mt-1 block text-xs leading-5 text-[var(--color-text-tertiary)]">{preset.description}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const controlsSlot = (
    <ToolControlPanel title="Button settings" description="Use presets first, then tune typography, shape, color, and accessibility." badge={<Badge variant="soft">{config.variant}</Badge>}>
      <ControlSection title="Preset and content">
        <PresetGallery presets={buttonPresets} selectedId={buttonPresets.find((preset) => preset.config === config)?.id} onSelect={(_, preset) => setConfig(preset.config)} getId={(preset) => preset.id} getLabel={(preset) => preset.name} getDescription={(preset) => preset.description} />
        <ControlGrid columns={2}>
          <Field label="Button text" density="compact"><Input size="sm" maxLength={48} value={config.text} onChange={(event) => patch({ text: event.target.value })} /></Field>
          <Field label="CSS class" density="compact"><Input size="sm" maxLength={40} value={config.className} onChange={(event) => patch({ className: event.target.value })} /></Field>
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Variant and interaction">
        <ControlGrid columns={2}>
          <Field label="Variant" density="compact"><Select size="sm" value={config.variant} onChange={(event) => patch({ variant: event.target.value as ButtonVariant })}>{variants.map((variant) => <option key={variant.value} value={variant.value}>{variant.label}</option>)}</Select></Field>
          <Field label="Hover" density="compact"><Select size="sm" value={config.hoverEffect} onChange={(event) => patch({ hoverEffect: event.target.value as ButtonHoverEffect })}>{hoverOptions.map((hover) => <option key={hover} value={hover}>{hover}</option>)}</Select></Field>
        </ControlGrid>
        <ControlGrid columns={2}>
          <CheckboxRow label="Active press" checked={config.activeEffect} onChange={(checked) => patch({ activeEffect: checked })} />
          <CheckboxRow label="Disabled" checked={config.disabled} onChange={(checked) => patch({ disabled: checked })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Size and shape">
        <ControlGrid columns={2}>
          <SliderNumberField label="Font size" value={config.fontSize} min={12} max={28} unit="px" onChange={(value) => patch({ fontSize: value })} />
          <SliderNumberField label="Weight" value={config.fontWeight} min={300} max={900} step={100} onChange={(value) => patch({ fontWeight: value })} />
          <SliderNumberField label="Padding X" value={config.paddingX} min={6} max={60} unit="px" onChange={(value) => patch({ paddingX: value })} />
          <SliderNumberField label="Padding Y" value={config.paddingY} min={4} max={30} unit="px" onChange={(value) => patch({ paddingY: value })} />
          <SliderNumberField label="Radius" value={config.radius} min={0} max={80} unit="px" onChange={(value) => patch({ radius: value })} />
          <SliderNumberField label="Min width" value={config.minWidth} min={0} max={280} step={8} unit="px" onChange={(value) => patch({ minWidth: value })} />
          <SliderNumberField label="Shadow" value={config.shadow} min={0} max={56} unit="px" onChange={(value) => patch({ shadow: value })} />
          <SliderNumberField label="Letter spacing" value={config.letterSpacing} min={-1} max={3} step={0.1} unit="px" onChange={(value) => patch({ letterSpacing: value })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Colors">
        <ControlGrid columns={2}>
          <ColorField label="Background" value={config.background} onChange={(value) => patch({ background: value, borderColor: config.variant === "solid" || config.variant === "pill" ? value : config.borderColor })} />
          <ColorField label="Second color" value={config.background2} onChange={(value) => patch({ background2: value })} />
          <ColorField label="Text" value={config.textColor} onChange={(value) => patch({ textColor: value })} />
          <ColorField label="Border" value={config.borderColor} onChange={(value) => patch({ borderColor: value })} />
        </ControlGrid>
        <Button variant="secondary" size="sm" onClick={applyReadableText} leftIcon={<Wand2 className="h-3.5 w-3.5" />}>Auto readable text</Button>
      </ControlSection>

      <ControlSection title="Advanced output">
        <ControlGrid columns={2}>
          <CheckboxRow label="Full width" checked={config.fullWidth} onChange={(checked) => patch({ fullWidth: checked })} />
          <CheckboxRow label="Uppercase" checked={config.uppercase} onChange={(checked) => patch({ uppercase: checked })} />
          <CheckboxRow label="Focus-visible ring" checked={config.includeFocusRing} onChange={(checked) => patch({ includeFocusRing: checked })} />
          <CheckboxRow label="Reduced-motion guard" checked={config.includeReducedMotion} onChange={(checked) => patch({ includeReducedMotion: checked })} />
        </ControlGrid>
        <ControlGrid columns={2}>
          <Field label="Icon position" density="compact"><Select size="sm" value={config.iconPosition} onChange={(event) => patch({ iconPosition: event.target.value as IconPosition })}><option value="left">Left</option><option value="right">Right</option></Select></Field>
          <Field label="Icon symbol" density="compact"><Input size="sm" maxLength={4} value={config.iconSymbol} onChange={(event) => patch({ iconSymbol: event.target.value })} /></Field>
        </ControlGrid>
      </ControlSection>
    </ToolControlPanel>
  );

  return (
    <ToolLayoutVisualGenerator
      previewSlot={previewSlot}
      controlsSlot={controlsSlot}
      actionsSlot={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setConfig(defaultButtonConfig)} leftIcon={<RotateCcw className="h-4 w-4" />}>Reset</Button><CopyButton text={css}>Copy CSS</CopyButton></div>}
      codeSlot={
        <div className="space-y-4">
          <WarningPanel title="Production checks" messages={warnings} />
          <CodeOutputPanel
            title="Generated button code"
            description="Copy production CSS, HTML, React, Tailwind starter, variables, or design tokens."
            tabs={tabs}
            defaultTab="css"
            onDownload={(tab) => downloadText(tab.filename ?? `button-${tab.id}.txt`, tab.code)}
            actions={<Button variant="secondary" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={() => downloadText("button.css", css)}>Download CSS</Button>}
          />
        </div>
      }
    />
  );
}
