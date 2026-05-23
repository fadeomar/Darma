"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button, CopyButton, Input, Select, Slider, Tabs } from "@/components/ui";
import { buttonPresets, defaultButtonConfig } from "./presets";
import { generateButtonCss, generateButtonHtml, generateButtonJsx, generateButtonTailwind } from "./generators";
import type { ButtonGeneratorConfig, ButtonHoverEffect, ButtonVariant, IconPosition } from "./types";

const outputTabs = [
  { value: "css", label: "CSS" },
  { value: "tailwind", label: "Tailwind" },
  { value: "jsx", label: "React JSX" },
  { value: "html", label: "HTML" },
] as const;

type OutputTab = (typeof outputTabs)[number]["value"];

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

function updateNumber<K extends keyof ButtonGeneratorConfig>(config: ButtonGeneratorConfig, key: K, value: number) {
  return { ...config, [key]: value };
}

export default function ButtonsCssGeneratorClient() {
  const [config, setConfig] = useState<ButtonGeneratorConfig>(defaultButtonConfig);
  const [output, setOutput] = useState<OutputTab>("css");

  function handleOutputChange(value: OutputTab) {
    setOutput(value);
  }

  const css = useMemo(() => generateButtonCss(config), [config]);
  const html = useMemo(() => generateButtonHtml(config), [config]);
  const code = output === "css" ? css : output === "tailwind" ? generateButtonTailwind(config) : output === "jsx" ? generateButtonJsx(config) : html;

  return (
    <div className="space-y-6">
      <style>{css}</style>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-5">
          <div className="flex min-h-[260px] items-center justify-center rounded-[var(--radius-lg)] bg-[radial-gradient(circle_at_top,#e0e7ff,transparent_34%),linear-gradient(135deg,#f8fafc,#eef2ff)] p-6 dark:bg-[radial-gradient(circle_at_top,#1e293b,transparent_34%),linear-gradient(135deg,#020617,#111827)]">
            <div className={config.fullWidth ? "w-full" : ""} dangerouslySetInnerHTML={{ __html: html }} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {buttonPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setConfig(preset.config)}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left transition hover:border-[var(--color-accent)]"
              >
                <span className="block text-sm font-bold text-[var(--color-text)]">{preset.name}</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">{preset.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <label className="grid gap-2 text-sm font-semibold text-[var(--color-text)]">
            Button text
            <Input maxLength={40} value={config.text} onChange={(event) => setConfig({ ...config, text: event.target.value })} />
          </label>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text)]">
              Variant
              <Select value={config.variant} onChange={(event) => setConfig({ ...config, variant: event.target.value as ButtonVariant })}>
                {variants.map((variant) => <option key={variant.value} value={variant.value}>{variant.label}</option>)}
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text)]">
              Hover effect
              <Select value={config.hoverEffect} onChange={(event) => setConfig({ ...config, hoverEffect: event.target.value as ButtonHoverEffect })}>
                <option value="lift">Lift</option>
                <option value="glow">Glow</option>
                <option value="darken">Darken</option>
                <option value="scale">Scale</option>
                <option value="none">None</option>
              </Select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text)]">Background <Input type="color" value={config.background} onChange={(event) => setConfig({ ...config, background: event.target.value, borderColor: event.target.value })} /></label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text)]">Second color <Input type="color" value={config.background2} onChange={(event) => setConfig({ ...config, background2: event.target.value })} /></label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text)]">Text <Input type="color" value={config.textColor} onChange={(event) => setConfig({ ...config, textColor: event.target.value })} /></label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text)]">Border <Input type="color" value={config.borderColor} onChange={(event) => setConfig({ ...config, borderColor: event.target.value })} /></label>
          </div>

          {[
            ["Font size", "fontSize", 12, 24, 1],
            ["Font weight", "fontWeight", 300, 900, 100],
            ["Border radius", "radius", 0, 40, 1],
            ["Padding X", "paddingX", 8, 44, 1],
            ["Padding Y", "paddingY", 6, 24, 1],
            ["Shadow", "shadow", 0, 40, 1],
          ].map(([label, key, min, max, step]) => (
            <label key={key as string} className="grid gap-1 text-sm font-semibold text-[var(--color-text)]">
              <span className="flex justify-between"><span>{label}</span><span className="text-[var(--color-text-muted)]">{String(config[key as keyof ButtonGeneratorConfig])}</span></span>
              <Slider min={min as number} max={max as number} step={step as number} value={Number(config[key as keyof ButtonGeneratorConfig])} onChange={(event) => setConfig(updateNumber(config, key as keyof ButtonGeneratorConfig, Number(event.target.value)))} />
            </label>
          ))}

          <div className="grid gap-2 text-sm text-[var(--color-text)]">
            <label className="flex items-center gap-2"><input type="checkbox" checked={config.fullWidth} onChange={(event) => setConfig({ ...config, fullWidth: event.target.checked })} /> Full width</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={config.activeEffect} onChange={(event) => setConfig({ ...config, activeEffect: event.target.checked })} /> Active press effect</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={config.disabled} onChange={(event) => setConfig({ ...config, disabled: event.target.checked })} /> Disabled state</label>
            <label className="grid gap-2 font-semibold">
              Icon position
              <Select value={config.iconPosition} onChange={(event) => setConfig({ ...config, iconPosition: event.target.value as IconPosition })}>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </Select>
            </label>
          </div>

          <Button variant="ghost" onClick={() => setConfig(defaultButtonConfig)} leftIcon={<RotateCcw className="h-4 w-4" />}>Reset to default</Button>
        </div>
      </div>

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs items={outputTabs} value={output} onChange={handleOutputChange} ariaLabel="Button output format" />
          <CopyButton text={code}>Copy {output.toUpperCase()}</CopyButton>
        </div>
        <pre className="mt-4 max-h-[420px] overflow-auto rounded-[var(--radius-md)] bg-slate-950 p-4 text-xs leading-6 text-slate-100"><code>{code}</code></pre>
      </div>
    </div>
  );
}
