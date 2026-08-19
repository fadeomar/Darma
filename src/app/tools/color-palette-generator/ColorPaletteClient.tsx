"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Lock, RefreshCw, Shuffle, Unlock } from "lucide-react";
import { Badge, Button, CopyButton, Select } from "@/components/ui";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import {
  CodeOutputPanel,
  ColorField,
  CompactField,
  ControlSection,
  PreviewToolbar,
  SegmentedControl,
  ToolControlPanel,
  type CodeOutputTab,
} from "@/features/tools/components";
import { HARMONY_OPTIONS, PALETTE_PRESETS, STARTER_COLORS } from "./presets";
import {
  exportAccessibilityReport,
  exportGradientSuggestion,
  exportHexList,
  exportPaletteCssVariables,
  exportPaletteDesignTokens,
  exportPaletteJson,
  exportPaletteTailwindObject,
  generatePalette,
  getAccessibilityStatus,
  getColorUsage,
  getContrastPairs,
  getPaletteSummary,
  getReadableTextColor,
  normalizeHex,
  randomHexColor,
} from "./palette";
import { COLOR_WORKFLOW_ID, readColorWorkflowState, writeColorWorkflowState } from "@/features/tools/workflows/browserState";
import { useActiveWorkflowId } from "@/features/tools/workflows/useActiveWorkflow";
import type { HarmonyMode, PaletteColor, PalettePreset, PaletteSize, PaletteUiMode } from "./types";

type DetailsTab = "overview" | "accessibility" | "exports";

const PALETTE_SIZE_VALUES: PaletteSize[] = [3, 5, 7, 9];

export default function ColorPaletteClient() {
  const workflowId = useActiveWorkflowId();
  const [baseColor, setBaseColor] = useState("#2563EB");
  const [workflowReady, setWorkflowReady] = useState(false);
  const [harmony, setHarmony] = useState<HarmonyMode>("analogous");
  const [size, setSize] = useState<PaletteSize>(5);
  const [uiMode, setUiMode] = useState<PaletteUiMode>("light");
  const [activeTab, setActiveTab] = useState<DetailsTab>("overview");
  const [lockedColors, setLockedColors] = useState<Record<number, PaletteColor>>({});

  const normalizedBase = normalizeHex(baseColor);

  const colors = useMemo(
    () => generatePalette(normalizedBase ?? "#2563EB", { harmony, size, lockedColors }),
    [normalizedBase, harmony, size, lockedColors],
  );

  const contrastPairs = useMemo(() => getContrastPairs(colors), [colors]);
  const summary = useMemo(() => getPaletteSummary(colors), [colors]);

  useEffect(() => {
    if (workflowId !== COLOR_WORKFLOW_ID) {
      setWorkflowReady(false);
      return;
    }
    const stored = readColorWorkflowState();
    if (stored?.primary) setBaseColor(stored.primary);
    setWorkflowReady(true);
  }, [workflowId]);

  useEffect(() => {
    if (workflowId !== COLOR_WORKFLOW_ID || !workflowReady || !normalizedBase || colors.length === 0) return;
    const palette = colors.map((color) => color.hex);
    writeColorWorkflowState({
      primary: normalizedBase,
      secondary: palette[1] ?? palette.at(-1),
      palette,
    });
  }, [colors, normalizedBase, workflowId, workflowReady]);

  const tabs = useMemo<CodeOutputTab[]>(
    () => [
      { id: "css", label: "CSS variables", language: "css", filename: "darma-palette.css", code: exportPaletteCssVariables(colors) },
      { id: "tailwind", label: "Tailwind", language: "txt", filename: "darma-palette-tailwind.txt", code: exportPaletteTailwindObject(colors) },
      { id: "json", label: "JSON tokens", language: "json", filename: "darma-palette.json", code: exportPaletteJson(colors) },
      { id: "tokens", label: "Design tokens", language: "json", filename: "darma-palette-tokens.json", code: exportPaletteDesignTokens(colors) },
      { id: "gradient", label: "Gradient", language: "css", filename: "darma-palette-gradient.css", code: `.hero-gradient {\n  background: ${exportGradientSuggestion(colors)};\n}` },
      { id: "a11y", label: "A11y report", language: "txt", filename: "darma-palette-accessibility.txt", code: exportAccessibilityReport(colors) },
      { id: "hex", label: "HEX list", language: "txt", filename: "darma-palette.txt", code: exportHexList(colors) },
    ],
    [colors],
  );

  function handleBaseColorChange(value: string) {
    const stripped = value.replace(/[^\da-f#]/gi, "").replace(/#/g, "");
    const nextValue = `#${stripped.slice(0, 6)}`;
    setBaseColor(nextValue.toUpperCase());
    setLockedColors({});
  }

  function handleSizeChange(nextSize: PaletteSize) {
    setSize(nextSize);
    setLockedColors((current) => {
      const next: Record<number, PaletteColor> = {};
      Object.entries(current).forEach(([key, value]) => {
        const index = Number(key);
        if (index < nextSize) next[index] = value;
      });
      return next;
    });
  }

  function randomizeBaseColor() {
    setBaseColor(randomHexColor());
    setLockedColors({});
  }

  function regenerateUnlockedColors() {
    setBaseColor(randomHexColor());
  }

  function toggleLocked(index: number) {
    setLockedColors((current) => {
      const next = { ...current };
      if (next[index]) {
        delete next[index];
      } else if (colors[index]) {
        next[index] = { ...colors[index], locked: true };
      }
      return next;
    });
  }

  function applyStarterColor(color: string) {
    setBaseColor(color);
    setLockedColors({});
  }

  function applyPreset(preset: PalettePreset) {
    setBaseColor(preset.baseColor);
    setHarmony(preset.harmony);
    setSize(preset.size);
    setUiMode(preset.uiMode);
    setLockedColors({});
    setActiveTab("overview");
  }

  function handleDownload(tab: CodeOutputTab) {
    const mimeType =
      tab.language === "json" ? "application/json" :
      tab.language === "css" ? "text/css" :
      "text/plain";
    const blob = new Blob([tab.code], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = tab.filename ?? `darma-palette.${tab.language ?? "txt"}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const previewBackground = uiMode === "dark" ? "#0F172A" : "#F8FAFC";
  const previewText = uiMode === "dark" ? "#E2E8F0" : "#0F172A";
  const primaryColor = colors[Math.min(2, colors.length - 1)]?.hex ?? "#2563EB";
  const accentColor = colors[Math.min(4, colors.length - 1)]?.hex ?? primaryColor;

  const lockedCount = Object.keys(lockedColors).length;

  const previewSlot = (
    <div className="flex h-full min-h-0 flex-col">
      <PreviewToolbar
        title="Live palette"
        description="Tune the palette visually first. Lock any swatch you want to keep, then regenerate the rest."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={regenerateUnlockedColors} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Regenerate
            </Button>
            <Button variant="secondary" size="sm" onClick={randomizeBaseColor} leftIcon={<Shuffle className="h-4 w-4" />}>
              New base
            </Button>
            <CopyButton text={exportHexList(colors)} size="sm" variant="secondary">
              Copy HEX
            </CopyButton>
          </div>
        }
      />

      <div className="min-w-0 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="info">{HARMONY_OPTIONS.find((option) => option.value === harmony)?.label ?? harmony}</Badge>
            <Badge variant="outline">{colors.length} colors</Badge>
            {lockedCount ? <Badge variant="success">{lockedCount} locked</Badge> : null}
          </div>
          <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">Lock a swatch to preserve it while generating.</p>
        </div>

        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] shadow-[var(--shadow-sm)]">
          <div className="grid min-w-[680px]" style={{ gridTemplateColumns: `repeat(${colors.length}, minmax(128px, 1fr))` }}>
            {colors.map((color, index) => {
              const textColor = getReadableTextColor(color.hex);
              const isLocked = Boolean(lockedColors[index]);
              return (
                <div
                  key={`${color.hex}-${index}`}
                  className="group flex min-h-[250px] flex-col justify-between border-r border-black/10 p-4 last:border-r-0"
                  style={{ backgroundColor: color.hex, color: textColor }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.12em] opacity-80">{index + 1} / {colors.length}</p>
                      <p className="mt-2 truncate text-sm font-black">{color.name}</p>
                      <p className="mt-1 text-xs font-bold opacity-80">{getColorUsage(color, index)}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleLocked(index)}
                      leftIcon={isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      className="shrink-0 bg-white/15 text-current hover:bg-white/25 hover:text-current"
                    >
                      {isLocked ? "Unlock color" : "Lock color"}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="font-mono text-lg font-black">{color.hex}</p>
                      <p className="mt-1 hidden truncate text-xs font-semibold opacity-80 sm:block">{color.hsl}</p>
                      <p className="hidden truncate text-xs font-semibold opacity-80 sm:block">{color.rgb}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <CopyButton text={color.hex} size="sm" variant="secondary" className="bg-white/85 text-[var(--color-text-primary)] hover:bg-white">
                        Copy HEX
                      </CopyButton>
                      <CopyButton text={color.rgb} size="sm" variant="secondary" className="hidden bg-white/85 text-[var(--color-text-primary)] hover:bg-white sm:inline-flex">
                        RGB
                      </CopyButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-border-subtle)] p-4 sm:p-5">
        <div
          className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-5 sm:p-6"
          style={{ backgroundColor: previewBackground, color: previewText }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">UI preview</p>
              <h4 className="mt-2 text-2xl font-black">Design system surface</h4>
              <p className="mt-2 max-w-xl text-sm leading-6 opacity-80">
                See the palette in context before exporting tokens or checking every contrast pair.
              </p>
            </div>
            <SegmentedControl
              ariaLabel="Preview mode"
              value={uiMode}
              onChange={(v) => setUiMode(v as PaletteUiMode)}
              options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]}
              size="sm"
            />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-current/10 p-4" style={{ backgroundColor: colors[3]?.hex ?? "#FFFFFF", color: getReadableTextColor(colors[3]?.hex ?? "#FFFFFF") }}>
              <p className="text-xs font-black uppercase tracking-[0.12em] opacity-70">Card</p>
              <h5 className="mt-2 text-lg font-black">Campaign preview</h5>
              <p className="mt-1 text-sm opacity-80">Readable surfaces with generated design tokens.</p>
            </div>
            <div className="flex flex-col justify-center gap-2">
              <button className="rounded-full px-4 py-3 text-sm font-black" style={{ backgroundColor: primaryColor, color: getReadableTextColor(primaryColor) }}>
                Primary action
              </button>
              <span className="inline-flex w-fit rounded-full px-3 py-2 text-xs font-bold" style={{ backgroundColor: accentColor, color: getReadableTextColor(accentColor) }}>
                Accent badge
              </span>
            </div>
          </div>
        </div>

        <details className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-strong)]">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-[var(--color-text-primary)] marker:hidden">
            Palette insights & quick checks
          </summary>
          <div className="border-t border-[var(--color-border-subtle)] p-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Palette health" value={summary.health} tone={summary.health === "Needs review" ? "warning" : "success"} />
              <MetricCard label="Accessible pairs" value={`${summary.aaPairs}/${summary.totalPairs}`} tone={summary.aaPairs === summary.totalPairs ? "success" : "warning"} />
              <MetricCard label="Dominant hue" value={summary.dominantHue} />
              <MetricCard label="Mood" value={summary.mood} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <CheckItem ok={summary.health !== "Needs review"} label={`${summary.aaPairs}/${summary.totalPairs} contrast checks pass AA`} />
              <CheckItem ok={colors.length === size} label={`${colors.length} swatches generated`} />
              <CheckItem ok={lockedCount > 0} label={lockedCount ? `${lockedCount} locked swatch${lockedCount === 1 ? "" : "es"}` : "No locked swatches"} neutral={!lockedCount} />
              <CheckItem ok={Boolean(normalizedBase)} label={normalizedBase ? `Base color ${normalizedBase}` : "Base color is invalid"} />
            </div>
          </div>
        </details>
      </div>
    </div>
  );

  const controlsSlot = (
    <ToolControlPanel
      title="Palette controls"
      description="Start with the base color and harmony. Use presets only when you want a faster direction."
      badge={<Badge variant="success">Browser-only</Badge>}
    >
      <ControlSection title="Base color">
        <ColorField label="Base color" value={baseColor} onChange={handleBaseColorChange} error={normalizedBase ? undefined : "Use a 3 or 6 digit HEX color."} />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STARTER_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => applyStarterColor(color)}
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-2.5 text-xs font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-raised)] focus:outline-none focus:shadow-[var(--focus-ring)]"
            >
              <span className="h-3 w-3 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: color }} aria-hidden />
              {color}
            </button>
          ))}
        </div>
      </ControlSection>

      <ControlSection title="Harmony">
        <CompactField hint={HARMONY_OPTIONS.find((option) => option.value === harmony)?.description}>
          <Select value={harmony} onChange={(event) => setHarmony(event.target.value as HarmonyMode)}>
            {HARMONY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </CompactField>
      </ControlSection>

      <ControlSection title="Palette size">
        <SegmentedControl
          ariaLabel="Palette size"
          value={String(size)}
          onChange={(v) => handleSizeChange(Number(v) as PaletteSize)}
          options={PALETTE_SIZE_VALUES.map((value) => ({ value: String(value), label: String(value) }))}
          size="md"
          fullWidth
        />
      </ControlSection>

      <details className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-[var(--color-text-primary)] marker:hidden">
          Quick palette presets
        </summary>
        <div className="grid gap-2 border-t border-[var(--color-border-subtle)] p-3">
          {PALETTE_PRESETS.map((preset) => {
            const presetColors = generatePalette(preset.baseColor, { harmony: preset.harmony, size: preset.size, lockedColors: {} });
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-left transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-raised)] focus:outline-none focus:shadow-[var(--focus-ring)]"
              >
                <span className="grid h-9" style={{ gridTemplateColumns: `repeat(${presetColors.length}, minmax(0, 1fr))` }}>
                  {presetColors.map((color, index) => (
                    <span key={`${preset.id}-${color.hex}-${index}`} style={{ backgroundColor: color.hex }} aria-hidden />
                  ))}
                </span>
                <span className="block p-3">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-black text-[var(--color-text-primary)]">{preset.title}</span>
                    <span className="shrink-0 text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">{preset.size} colors</span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">{preset.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </details>

    </ToolControlPanel>
  );

  const detailsSlot = (
    <details className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-strong)] shadow-[var(--shadow-sm)]">
      <summary className="cursor-pointer list-none px-5 py-4 marker:hidden">
        <span className="flex flex-col gap-1">
          <span className="text-sm font-black text-[var(--color-text-primary)]">Accessibility, usage & developer exports</span>
          <span className="text-xs leading-5 text-[var(--color-text-tertiary)]">Inspect contrast pairs, semantic color roles, CSS variables, Tailwind, JSON, and design tokens when you need them.</span>
        </span>
      </summary>
      <div className="border-t border-[var(--color-border-subtle)]">
        <div className="flex justify-end px-5 py-4">
          <SegmentedControl
            ariaLabel="Palette detail tabs"
            value={activeTab}
            onChange={(value) => setActiveTab(value as DetailsTab)}
            options={[
              { value: "overview", label: "Usage" },
              { value: "accessibility", label: "A11y" },
              { value: "exports", label: "Exports" },
            ]}
            size="sm"
          />
        </div>

      {activeTab === "overview" ? (
        <div className="grid gap-4 p-5 lg:grid-cols-3">
          {colors.map((color, index) => (
            <div key={`${color.hex}-usage`} className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)] border border-black/10" style={{ backgroundColor: color.hex }} />
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-black text-[var(--color-text-primary)]">{color.name}</h4>
                  <p className="font-mono text-xs text-[var(--color-text-tertiary)]">{color.hex}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{getColorUsage(color, index)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">L {color.lightness}%</Badge>
                <Badge variant="outline">S {color.saturation}%</Badge>
                <Badge variant="outline">H {color.hue}°</Badge>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "accessibility" ? (
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <div>
              <h4 className="text-sm font-black text-[var(--color-text-primary)]">Accessibility summary</h4>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">AA target is 4.5:1 for normal text.</p>
            </div>
            <Badge variant={summary.health === "Needs review" ? "warning" : "success"}>{summary.aaPairs}/{summary.totalPairs} pass</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {contrastPairs.map((pair) => (
              <div key={pair.label} className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-4" style={{ backgroundColor: pair.background, color: pair.foreground }}>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-black">{pair.label}</h4>
                  <Badge variant={pair.rating === "Fail" ? "danger" : pair.rating === "AA" ? "success" : "default"}>{pair.rating}</Badge>
                </div>
                <p className="mt-3 text-2xl font-black">{pair.ratio}:1</p>
                <p className="mt-1 text-sm font-bold opacity-90">{getAccessibilityStatus(pair.rating)}</p>
                <p className="mt-1 truncate font-mono text-xs opacity-85">{pair.foreground} on {pair.background}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "exports" ? (
        <div className="p-5 pt-0">
          <CodeOutputPanel
            title="Export palette"
            description="Copy CSS variables, Tailwind tokens, JSON, design tokens, accessibility report, gradient, or plain HEX list."
            tabs={tabs}
            defaultTab="css"
            onDownload={handleDownload}
          />
        </div>
      ) : null}
      </div>
    </details>
  );

  return (
    <ToolLayoutVisualGenerator
      controlsPosition="right"
      previewSlot={previewSlot}
      controlsSlot={controlsSlot}
      presetsSlot={detailsSlot}
      actionsPlacement="under-preview"
    />
  );
}

function MetricCard({ label, value, tone = "info" }: { label: string; value: string; tone?: "info" | "success" | "warning" }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="truncate text-sm font-black text-[var(--color-text-primary)]">{value}</p>
        <Badge variant={tone === "success" ? "success" : tone === "warning" ? "warning" : "info"}>{tone}</Badge>
      </div>
    </div>
  );
}

function CheckItem({ label, ok, neutral = false }: { label: string; ok: boolean; neutral?: boolean }) {
  return (
    <div className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]">
      <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${neutral ? "text-[var(--color-text-tertiary)]" : ok ? "text-[var(--color-success-text)]" : "text-[var(--color-warning-text)]"}`} aria-hidden />
      <span>{label}</span>
    </div>
  );
}
