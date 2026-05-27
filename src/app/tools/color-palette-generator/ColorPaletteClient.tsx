"use client";

import { useMemo, useState } from "react";
import { Download, Lock, RefreshCw, Shuffle, Unlock } from "lucide-react";
import { Badge, Button, CopyButton, Field, Input, Select, Tabs, Textarea } from "@/components/ui";
import { HARMONY_OPTIONS, PALETTE_SIZE_OPTIONS, STARTER_COLORS } from "./presets";
import {
  createPaletteColor,
  exportHexList,
  exportPaletteCssVariables,
  exportPaletteJson,
  exportPaletteTailwindObject,
  generatePalette,
  getContrastPairs,
  getReadableTextColor,
  isValidHexColor,
  normalizeHex,
  randomHexColor,
} from "./palette";
import type { HarmonyMode, PaletteColor, PaletteSize, PaletteUiMode } from "./types";

type ExportMode = "hex" | "css" | "tailwind" | "json";

const UI_MODE_TABS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] satisfies Array<{ value: PaletteUiMode; label: string }>;

const EXPORT_TABS = [
  { value: "hex", label: "HEX" },
  { value: "css", label: "CSS variables" },
  { value: "tailwind", label: "Tailwind object" },
  { value: "json", label: "JSON tokens" },
] satisfies Array<{ value: ExportMode; label: string }>;

export default function ColorPaletteClient() {
  const [baseColor, setBaseColor] = useState("#2563EB");
  const [harmony, setHarmony] = useState<HarmonyMode>("analogous");
  const [size, setSize] = useState<PaletteSize>(5);
  const [uiMode, setUiMode] = useState<PaletteUiMode>("light");
  const [lockedColors, setLockedColors] = useState<Record<number, PaletteColor>>({});
  const [exportMode, setExportMode] = useState<ExportMode>("css");

  const normalizedBase = normalizeHex(baseColor);
  const error = normalizedBase ? null : "Enter a valid 3 or 6 digit HEX color, for example #2563EB.";

  const colors = useMemo(
    () => generatePalette(normalizedBase ?? "#2563EB", { harmony, size, lockedColors }),
    [normalizedBase, harmony, size, lockedColors],
  );

  const contrastPairs = useMemo(() => getContrastPairs(colors), [colors]);
  const exportValue = useMemo(() => {
    if (exportMode === "hex") return exportHexList(colors);
    if (exportMode === "json") return exportPaletteJson(colors);
    if (exportMode === "tailwind") return exportPaletteTailwindObject(colors);
    return exportPaletteCssVariables(colors);
  }, [colors, exportMode]);

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
    const randomBase = randomHexColor();
    setBaseColor(randomBase);
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

  function handleDownload() {
    const extension = exportMode === "json" ? "json" : exportMode === "css" ? "css" : "txt";
    const mimeType = exportMode === "json" ? "application/json" : exportMode === "css" ? "text/css" : "text/plain";
    const blob = new Blob([exportValue], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `darma-color-palette.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const previewBackground = uiMode === "dark" ? "#0F172A" : "#F8FAFC";
  const previewText = uiMode === "dark" ? "#E2E8F0" : "#0F172A";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[var(--color-text)]">Color Palette Generator</h2>
            <Badge variant="success">Browser-only</Badge>
            <Badge variant="outline">WCAG contrast</Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Generate harmony palettes, inspect readable color values, lock favorite swatches, and export copy-ready CSS variables or design tokens.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={randomizeBaseColor} leftIcon={<Shuffle className="h-4 w-4" />}>
            Random palette
          </Button>
          <Button onClick={regenerateUnlockedColors} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Regenerate unlocked
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_180px]">
        <Field label="Base color" description="Use a HEX value or the native color picker." error={error}>
          <div className="flex gap-2">
            <Input
              value={baseColor}
              maxLength={7}
              onChange={(event) => handleBaseColorChange(event.target.value)}
              placeholder="#2563EB"
              aria-invalid={Boolean(error)}
              className="font-mono"
            />
            <input
              type="color"
              value={isValidHexColor(baseColor) ? baseColor : "#2563EB"}
              onChange={(event) => handleBaseColorChange(event.target.value)}
              className="h-11 w-14 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-1"
              aria-label="Choose base color"
            />
          </div>
        </Field>

        <Field label="Harmony mode" description={HARMONY_OPTIONS.find((option) => option.value === harmony)?.description}>
          <Select value={harmony} onChange={(event) => setHarmony(event.target.value as HarmonyMode)}>
            {HARMONY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Palette size" description="Pick a compact or expanded palette.">
          <Select value={String(size)} onChange={(event) => handleSizeChange(Number(event.target.value) as PaletteSize)}>
            {PALETTE_SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Preview mode" description="Test the palette against a light or dark surface.">
          <Tabs
            value={uiMode}
            onChange={(value) => setUiMode(value as PaletteUiMode)}
            ariaLabel="Preview mode"
            items={UI_MODE_TABS}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        {STARTER_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => applyStarterColor(color)}
            className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-xs font-bold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]"
          >
            <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color }} aria-hidden />
            {color}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] shadow-[var(--shadow-soft)]">
        <div className="grid min-h-64 md:grid-cols-5 lg:grid-cols-9">
          {colors.map((color, index) => {
            const textColor = getReadableTextColor(color.hex);
            const isLocked = Boolean(lockedColors[index]);
            return (
              <div key={`${color.hex}-${index}`} className="group flex min-h-52 flex-col justify-between p-4" style={{ backgroundColor: color.hex, color: textColor }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-black/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-current">{color.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleLocked(index)}
                    leftIcon={isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    className="bg-white/15 text-current hover:bg-white/25 hover:text-current"
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
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[var(--color-text)]">Accessibility checks</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">Automatic text colors are tested against common UI roles.</p>
            </div>
            <Badge variant="outline">AA target: 4.5:1</Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {contrastPairs.map((pair) => (
              <div key={pair.label} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4" style={{ backgroundColor: pair.background, color: pair.foreground }}>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-black">{pair.label}</h4>
                  <Badge variant={pair.rating === "Fail" ? "danger" : pair.rating === "AA" ? "success" : "default"}>{pair.rating}</Badge>
                </div>
                <p className="mt-3 text-2xl font-black">{pair.ratio}:1</p>
                <p className="mt-1 font-mono text-xs opacity-85">{pair.foreground} on {pair.background}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] p-5" style={{ backgroundColor: previewBackground, color: previewText }}>
            <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">Palette preview</p>
            <h4 className="mt-2 text-2xl font-black">Design system surface</h4>
            <p className="mt-2 max-w-xl text-sm leading-6 opacity-80">Use the generated swatches as background, muted, primary, card, accent, and border tokens.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full px-4 py-2 text-sm font-bold" style={{ backgroundColor: colors[2]?.hex, color: getReadableTextColor(colors[2]?.hex ?? "#2563EB") }}>Primary action</span>
              <span className="rounded-full px-4 py-2 text-sm font-bold" style={{ backgroundColor: colors[1]?.hex, color: getReadableTextColor(colors[1]?.hex ?? "#E2E8F0") }}>Muted chip</span>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[var(--color-text)]">Export palette</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">Copy the palette as CSS, JSON, Tailwind-style tokens, or a plain HEX list.</p>
            </div>
          </div>
          <Tabs value={exportMode} onChange={(value) => setExportMode(value as ExportMode)} items={EXPORT_TABS} ariaLabel="Export format" className="mt-4" />
          <Textarea readOnly value={exportValue} className="mt-4 min-h-72 font-mono text-xs leading-5" />
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={exportValue}>Copy all</CopyButton>
            <Button variant="secondary" onClick={handleDownload} leftIcon={<Download className="h-4 w-4" />}>
              Download
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
