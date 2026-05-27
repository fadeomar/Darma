"use client";

import { useMemo, useState } from "react";
import { Lock, RefreshCw, Shuffle, Unlock } from "lucide-react";
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
import { HARMONY_OPTIONS, STARTER_COLORS } from "./presets";
import {
  exportHexList,
  exportPaletteCssVariables,
  exportPaletteJson,
  exportPaletteTailwindObject,
  generatePalette,
  getContrastPairs,
  getReadableTextColor,
  normalizeHex,
  randomHexColor,
} from "./palette";
import type { HarmonyMode, PaletteColor, PaletteSize, PaletteUiMode } from "./types";

export default function ColorPaletteClient() {
  const [baseColor, setBaseColor] = useState("#2563EB");
  const [harmony, setHarmony] = useState<HarmonyMode>("analogous");
  const [size, setSize] = useState<PaletteSize>(5);
  const [uiMode, setUiMode] = useState<PaletteUiMode>("light");
  const [lockedColors, setLockedColors] = useState<Record<number, PaletteColor>>({});

  const normalizedBase = normalizeHex(baseColor);

  const colors = useMemo(
    () => generatePalette(normalizedBase ?? "#2563EB", { harmony, size, lockedColors }),
    [normalizedBase, harmony, size, lockedColors],
  );

  const contrastPairs = useMemo(() => getContrastPairs(colors), [colors]);

  const tabs = useMemo<CodeOutputTab[]>(
    () => [
      { id: "css", label: "CSS variables", language: "css", filename: "darma-palette.css", code: exportPaletteCssVariables(colors) },
      { id: "tailwind", label: "Tailwind", language: "txt", filename: "darma-palette-tailwind.txt", code: exportPaletteTailwindObject(colors) },
      { id: "json", label: "JSON tokens", language: "json", filename: "darma-palette.json", code: exportPaletteJson(colors) },
      { id: "hex", label: "HEX list", language: "txt", filename: "darma-palette.txt", code: exportHexList(colors) },
    ],
    [colors],
  );

  function handleBaseColorChange(value: string) {
    const nextValue = value.startsWith("#") ? value.slice(0, 7) : `#${value.replace("#", "").slice(0, 6)}`;
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

  const previewSlot = (
    <div className="flex flex-col">
      <PreviewToolbar
        title="Color palette"
        description="Lock any swatch to keep it when regenerating unlocked colors."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={randomizeBaseColor} leftIcon={<Shuffle className="h-4 w-4" />}>
              Random
            </Button>
            <Button size="sm" onClick={regenerateUnlockedColors} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Regenerate
            </Button>
          </div>
        }
      />
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${colors.length}, minmax(0, 1fr))` }}
      >
        {colors.map((color, index) => {
          const textColor = getReadableTextColor(color.hex);
          const isLocked = Boolean(lockedColors[index]);
          return (
            <div
              key={`${color.hex}-${index}`}
              className="group flex min-h-52 flex-col justify-between p-4"
              style={{ backgroundColor: color.hex, color: textColor }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate rounded-full bg-black/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-current">
                  {color.name}
                </span>
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
                  <p className="mt-1 text-xs font-semibold opacity-85">{color.hsl}</p>
                  <p className="text-xs font-semibold opacity-85">{color.rgb}</p>
                </div>
                <CopyButton text={color.hex} size="sm" variant="secondary" className="bg-white/85 text-[var(--color-text-primary)] hover:bg-white">
                  Copy HEX
                </CopyButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const controlsSlot = (
    <ToolControlPanel
      title="Palette settings"
      description="Choose a base color, harmony mode, and palette size."
      badge={<Badge variant="success">Browser-only</Badge>}
    >
      <ControlSection>
        <ColorField label="Base color" value={baseColor} onChange={handleBaseColorChange} />
      </ControlSection>

      <ControlSection title="Harmony mode">
        <CompactField
          hint={HARMONY_OPTIONS.find((option) => option.value === harmony)?.description}
        >
          <Select value={harmony} onChange={(event) => setHarmony(event.target.value as HarmonyMode)}>
            {HARMONY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </CompactField>
      </ControlSection>

      <ControlSection title="Palette size">
        <SegmentedControl
          ariaLabel="Palette size"
          value={String(size)}
          onChange={(v) => handleSizeChange(Number(v) as PaletteSize)}
          options={[
            { value: "3", label: "3" },
            { value: "5", label: "5" },
            { value: "7", label: "7" },
            { value: "9", label: "9" },
          ]}
          size="md"
          fullWidth
        />
      </ControlSection>

      <ControlSection title="Preview mode">
        <SegmentedControl
          ariaLabel="Preview mode"
          value={uiMode}
          onChange={(v) => setUiMode(v as PaletteUiMode)}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
          size="md"
          fullWidth
        />
      </ControlSection>

      <ControlSection title="Preset colors">
        <div className="flex flex-wrap gap-1.5">
          {STARTER_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => applyStarterColor(color)}
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-2.5 text-[11px] font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-raised)]"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              {color}
            </button>
          ))}
        </div>
      </ControlSection>
    </ToolControlPanel>
  );

  const codeSlot = (
    <CodeOutputPanel
      title="Export palette"
      description="Copy as CSS variables, Tailwind tokens, JSON, or a plain HEX list."
      tabs={tabs}
      defaultTab="css"
      onDownload={handleDownload}
    />
  );

  const presetsSlot = (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-strong)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Accessibility checks</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
            Auto text colors tested against common UI roles.
          </p>
        </div>
        <Badge variant="outline">AA target: 4.5:1</Badge>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-2">
          {contrastPairs.map((pair) => (
            <div
              key={pair.label}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
              style={{ backgroundColor: pair.background, color: pair.foreground }}
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-black">{pair.label}</h4>
                <Badge variant={pair.rating === "Fail" ? "danger" : pair.rating === "AA" ? "success" : "default"}>
                  {pair.rating}
                </Badge>
              </div>
              <p className="mt-3 text-2xl font-black">{pair.ratio}:1</p>
              <p className="mt-1 font-mono text-xs opacity-85">
                {pair.foreground} on {pair.background}
              </p>
            </div>
          ))}
        </div>
        <div
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-5"
          style={{ backgroundColor: previewBackground, color: previewText }}
        >
          <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">Palette preview</p>
          <h4 className="mt-2 text-2xl font-black">Design system surface</h4>
          <p className="mt-2 max-w-xl text-sm leading-6 opacity-80">
            Use the generated swatches as background, muted, primary, card, accent, and border tokens.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className="rounded-full px-4 py-2 text-sm font-bold"
              style={{ backgroundColor: colors[2]?.hex, color: getReadableTextColor(colors[2]?.hex ?? "#2563EB") }}
            >
              Primary action
            </span>
            <span
              className="rounded-full px-4 py-2 text-sm font-bold"
              style={{ backgroundColor: colors[1]?.hex, color: getReadableTextColor(colors[1]?.hex ?? "#E2E8F0") }}
            >
              Muted chip
            </span>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <ToolLayoutVisualGenerator
      previewSlot={previewSlot}
      controlsSlot={controlsSlot}
      codeSlot={codeSlot}
      presetsSlot={presetsSlot}
    />
  );
}
