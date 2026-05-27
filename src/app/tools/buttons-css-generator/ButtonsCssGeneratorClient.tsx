"use client";

import { useMemo, useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
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
import { buttonPresets, defaultButtonConfig } from "./presets";
import { generateButtonCss, generateButtonHtml, generateButtonJsx, generateButtonTailwind } from "./generators";
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

const hoverOptions: ButtonHoverEffect[] = ["lift", "glow", "darken", "scale", "none"];

function CheckboxRow({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm text-[var(--color-text)]">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
    </label>
  );
}

export default function ButtonsCssGeneratorClient() {
  const [config, setConfig] = useState<ButtonGeneratorConfig>(defaultButtonConfig);
  const [previewState, setPreviewState] = useState<"default" | "hover" | "active" | "disabled">("default");

  const previewConfig = previewState === "disabled" ? { ...config, disabled: true } : config;
  const css = useMemo(() => generateButtonCss(previewConfig), [previewConfig]);
  const html = useMemo(() => generateButtonHtml(previewConfig), [previewConfig]);
  const jsx = useMemo(() => generateButtonJsx(previewConfig), [previewConfig]);
  const tailwind = useMemo(() => generateButtonTailwind(previewConfig), [previewConfig]);
  const tabs = useMemo<CodeOutputTab[]>(() => [
    { id: "css", label: "CSS", language: "css", filename: "button.css", code: css },
    { id: "html", label: "HTML", language: "html", filename: "button.html", code: html },
    { id: "jsx", label: "React JSX", language: "tsx", filename: "GeneratedButton.tsx", code: jsx },
    { id: "tailwind", label: "Tailwind", language: "txt", filename: "button-tailwind.txt", code: tailwind },
  ], [css, html, jsx, tailwind]);
  const warnings = useMemo<WarningMessage[]>(() => {
    const messages: WarningMessage[] = [];
    if (config.shadow > 32) messages.push({ id: "shadow", severity: "warning", message: "Large button shadows can look heavy on dense UIs. Test on real backgrounds." });
    if (config.fontSize < 14) messages.push({ id: "font", severity: "warning", message: "Very small font sizes may reduce tap readability on mobile." });
    if (config.disabled) messages.push({ id: "disabled", severity: "info", message: "Disabled buttons should still have accessible labels and clear disabled styling." });
    return messages;
  }, [config]);

  function patch(patchConfig: Partial<ButtonGeneratorConfig>) {
    setConfig((current) => ({ ...current, ...patchConfig }));
  }

  const previewSlot = (
    <div className="space-y-4">
      <style>{css}</style>
      <PreviewToolbar
        title="Button preview"
        description="Preview default, hover, active, and disabled states."
        actions={<SegmentedControl ariaLabel="Preview state" value={previewState} onChange={(value) => setPreviewState(value as typeof previewState)} options={(["default", "hover", "active", "disabled"] as const).map((state) => ({ value: state, label: state }))} />}
      />
      <div className="flex min-h-[420px] items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[radial-gradient(circle_at_top,var(--color-primary-soft),transparent_34%),linear-gradient(135deg,var(--color-preview-bg),var(--color-preview-bg-strong))] p-8">
        <div className={config.fullWidth ? "w-full max-w-md" : ""} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {buttonPresets.map((preset) => (
          <button key={preset.id} type="button" onClick={() => setConfig(preset.config)} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left transition hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]">
            <span className="block text-sm font-bold text-[var(--color-text)]">{preset.name}</span>
            <span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">{preset.description}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const controlsSlot = (
    <ToolControlPanel title="Button settings" description="Build a button with grouped Darma controls." badge={<Badge variant="soft">{config.variant}</Badge>}>
      <ControlSection title="Preset and text">
        <PresetGallery presets={buttonPresets} selectedId={buttonPresets.find((preset) => preset.config === config)?.id} onSelect={(_, preset) => setConfig(preset.config)} getId={(preset) => preset.id} getLabel={(preset) => preset.name} getDescription={(preset) => preset.description} />
        <Field label="Button text" density="compact"><Input size="sm" maxLength={40} value={config.text} onChange={(event) => patch({ text: event.target.value })} /></Field>
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
          <SliderNumberField label="Padding X" value={config.paddingX} min={6} max={56} unit="px" onChange={(value) => patch({ paddingX: value })} />
          <SliderNumberField label="Padding Y" value={config.paddingY} min={4} max={30} unit="px" onChange={(value) => patch({ paddingY: value })} />
          <SliderNumberField label="Radius" value={config.radius} min={0} max={80} unit="px" onChange={(value) => patch({ radius: value })} />
          <SliderNumberField label="Shadow" value={config.shadow} min={0} max={56} unit="px" onChange={(value) => patch({ shadow: value })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Colors">
        <ControlGrid columns={2}>
          <ColorField label="Background" value={config.background} onChange={(value) => patch({ background: value, borderColor: config.variant === "solid" ? value : config.borderColor })} />
          <ColorField label="Second color" value={config.background2} onChange={(value) => patch({ background2: value })} />
          <ColorField label="Text" value={config.textColor} onChange={(value) => patch({ textColor: value })} />
          <ColorField label="Border" value={config.borderColor} onChange={(value) => patch({ borderColor: value })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Advanced">
        <ControlGrid columns={2}>
          <CheckboxRow label="Full width" checked={config.fullWidth} onChange={(checked) => patch({ fullWidth: checked })} />
          <Field label="Icon position" density="compact"><Select size="sm" value={config.iconPosition} onChange={(event) => patch({ iconPosition: event.target.value as IconPosition })}><option value="left">Left</option><option value="right">Right</option></Select></Field>
        </ControlGrid>
      </ControlSection>
    </ToolControlPanel>
  );

  return (
    <ToolLayoutVisualGenerator
      previewSlot={previewSlot}
      controlsSlot={controlsSlot}
      actionsSlot={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setConfig(defaultButtonConfig)} leftIcon={<RotateCcw className="h-4 w-4" />}>Reset</Button><CopyButton text={css}>Copy CSS</CopyButton></div>}
      codeSlot={<div className="space-y-4"><WarningPanel title="Button notes" messages={warnings} /><CodeOutputPanel title="Generated button code" description="Standardized output for CSS, HTML, React JSX, and Tailwind-style snippets." tabs={tabs} defaultTab="css" /></div>}
    />
  );
}
