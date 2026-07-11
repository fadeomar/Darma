import type { ContrastPair, HarmonyMode, PaletteColor, PaletteOptions, PaletteSummary, WcagRating } from "./types";

const HEX_REGEX = /^#?([\da-f]{3}|[\da-f]{6})$/i;

export function normalizeHex(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(HEX_REGEX);
  if (!match) return null;

  const raw = match[1];
  if (raw.length === 3) {
    return `#${raw.split("").map((char) => char + char).join("")}`.toUpperCase();
  }

  return `#${raw}`.toUpperCase();
}

export function isValidHexColor(input: string): boolean {
  return normalizeHex(input) !== null;
}

export function randomHexColor(): string {
  const value = new Uint8Array(3);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(value);
  } else {
    value[0] = Math.floor(Math.random() * 256);
    value[1] = Math.floor(Math.random() * 256);
    value[2] = Math.floor(Math.random() * 256);
  }

  return rgbToHex(value[0], value[1], value[2]);
}

export function generatePalette(baseColor: string, options: PaletteOptions): PaletteColor[] {
  const normalized = normalizeHex(baseColor);
  if (!normalized) return [];

  const baseHsl = hexToHsl(normalized);
  const offsets = getHarmonyOffsets(options.harmony, options.size);
  const lightnessSteps = getLightnessSteps(options.size, options.harmony, baseHsl.l);
  const colors = offsets.map((offset, index) => {
    const locked = options.lockedColors?.[index];
    if (locked) return { ...locked, locked: true };

    const hue = normalizeHue(baseHsl.h + offset);
    const saturation = clamp(baseHsl.s + getSaturationShift(options.harmony, index), 28, 96);
    const lightness = clamp(lightnessSteps[index] ?? baseHsl.l, 8, 96);
    const hex = hslToHex(hue, saturation, lightness);

    return createPaletteColor(hex, index, false);
  });

  if (options.harmony === "monochromatic" || options.harmony === "shades" || options.harmony === "tints") {
    return colors.map((color, index) => ({ ...color, name: getRoleName(index, options.harmony) }));
  }

  return colors;
}

export function createPaletteColor(hexInput: string, index = 0, locked = false): PaletteColor {
  const hex = normalizeHex(hexInput) ?? "#000000";
  const { r, g, b } = hexToRgb(hex);
  const hsl = hexToHsl(hex);

  return {
    id: `color-${index + 1}`,
    name: getColorName(index),
    hex,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
    hue: Math.round(hsl.h),
    saturation: Math.round(hsl.s),
    lightness: Math.round(hsl.l),
    locked,
  };
}

export function getContrastRatio(foreground: string, background: string): number {
  const fg = hexToRgb(normalizeHex(foreground) ?? "#000000");
  const bg = hexToRgb(normalizeHex(background) ?? "#FFFFFF");
  const fgLuminance = getRelativeLuminance(fg.r, fg.g, fg.b);
  const bgLuminance = getRelativeLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function getWcagRating(ratio: number): WcagRating {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "Fail";
}

export function getReadableTextColor(background: string): "#000000" | "#FFFFFF" {
  return getContrastRatio("#000000", background) >= getContrastRatio("#FFFFFF", background) ? "#000000" : "#FFFFFF";
}

export function getContrastPairs(colors: PaletteColor[]): ContrastPair[] {
  const background = colors[0]?.hex ?? "#FFFFFF";
  const primary = colors[Math.min(2, colors.length - 1)]?.hex ?? "#2563EB";
  const muted = colors[Math.min(1, colors.length - 1)]?.hex ?? "#E2E8F0";
  const card = colors[Math.min(3, colors.length - 1)]?.hex ?? "#FFFFFF";
  const accent = colors[Math.min(4, colors.length - 1)]?.hex ?? primary;
  const ink = colors[colors.length - 1]?.hex ?? "#0F172A";
  const pairs = [
    { label: "Page background", background, foreground: getReadableTextColor(background) },
    { label: "Primary action", background: primary, foreground: getReadableTextColor(primary) },
    { label: "Muted chip", background: muted, foreground: getReadableTextColor(muted) },
    { label: "Card surface", background: card, foreground: getReadableTextColor(card) },
    { label: "Accent badge", background: accent, foreground: getReadableTextColor(accent) },
    { label: "Ink on background", background, foreground: ink },
  ];

  return pairs.map((pair) => {
    const ratio = getContrastRatio(pair.foreground, pair.background);
    return { ...pair, ratio, rating: getWcagRating(ratio) };
  });
}

export function getPaletteSummary(colors: PaletteColor[]): PaletteSummary {
  const pairs = getContrastPairs(colors);
  const aaPairs = pairs.filter((pair) => pair.rating !== "Fail").length;
  const totalPairs = pairs.length;
  const averageHue = colors.length ? colors.reduce((sum, color) => sum + color.hue, 0) / colors.length : 0;
  const averageSaturation = colors.length ? colors.reduce((sum, color) => sum + color.saturation, 0) / colors.length : 0;
  const averageLightness = colors.length ? colors.reduce((sum, color) => sum + color.lightness, 0) / colors.length : 0;
  const primary = colors[Math.min(2, colors.length - 1)]?.hex ?? colors[0]?.hex ?? "#2563EB";

  return {
    health: aaPairs === totalPairs ? "Excellent" : aaPairs >= Math.ceil(totalPairs * 0.7) ? "Good" : "Needs review",
    aaPairs,
    totalPairs,
    dominantHue: getHueFamily(averageHue),
    mood: getPaletteMood(averageSaturation, averageLightness),
    recommendedText: getReadableTextColor(primary) === "#FFFFFF" ? "Light text" : "Dark text",
  };
}

export function getColorUsage(color: PaletteColor, index: number): string {
  if (index === 0) return color.lightness > 80 ? "Page background" : "Deep surface";
  if (index === 1) return "Muted surface";
  if (index === 2) return "Primary action";
  if (index === 3) return "Card / section";
  if (index === 4) return "Accent / highlight";
  if (index === 5) return "Border / divider";
  if (index === 6) return "Support color";
  if (index === 7) return "Data / chart";
  return "Text / ink";
}

export function exportPaletteCssVariables(colors: PaletteColor[]): string {
  const lines = colors.flatMap((color, index) => {
    const tokenName = color.name.toLowerCase().replace(/\s+|\//g, "-");
    return [
      `  --color-palette-${index + 1}: ${color.hex};`,
      `  --color-${tokenName}: ${color.hex};`,
      `  --color-${tokenName}-text: ${getReadableTextColor(color.hex)};`,
    ];
  });
  return `:root {\n${lines.join("\n")}\n}`;
}

export function exportPaletteTailwindObject(colors: PaletteColor[]): string {
  const lines = colors.map((color, index) => {
    const tokenName = color.name.toLowerCase().replace(/\s+|\//g, "-");
    return `      "${tokenName}": "${color.hex}",\n      "${index + 1}": "${color.hex}",`;
  });
  return `colors: {\n  darma: {\n${lines.join("\n")}\n  }\n}`;
}

export function exportPaletteJson(colors: PaletteColor[]): string {
  return JSON.stringify(
    colors.map((color, index) => ({
      name: color.name.toLowerCase().replace(/\s+|\//g, "-"),
      usage: getColorUsage(color, index),
      step: index + 1,
      hex: color.hex,
      rgb: color.rgb,
      hsl: color.hsl,
      text: getReadableTextColor(color.hex),
      contrastWithText: getContrastRatio(getReadableTextColor(color.hex), color.hex),
    })),
    null,
    2,
  );
}

export function exportPaletteDesignTokens(colors: PaletteColor[]): string {
  const roles = colors.map((color, index) => {
    const key = color.name.toLowerCase().replace(/\s+|\//g, "-");
    return `  "${key}": { "value": "${color.hex}", "type": "color", "description": "${getColorUsage(color, index)}" },`;
  });
  return `{\n${roles.join("\n")}\n}`;
}

export function exportAccessibilityReport(colors: PaletteColor[]): string {
  return getContrastPairs(colors)
    .map((pair) => `${pair.label}: ${pair.foreground} on ${pair.background} = ${pair.ratio}:1 (${pair.rating})`)
    .join("\n");
}

export function exportHexList(colors: PaletteColor[]): string {
  return colors.map((color) => color.hex).join("\n");
}

export function exportGradientSuggestion(colors: PaletteColor[]): string {
  const start = colors[2]?.hex ?? colors[0]?.hex ?? "#2563EB";
  const middle = colors[4]?.hex ?? colors[Math.max(0, colors.length - 2)]?.hex;
  const end = colors[colors.length - 1]?.hex ?? "#7C3AED";
  return middle
    ? `linear-gradient(135deg, ${start} 0%, ${middle} 48%, ${end} 100%)`
    : `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
}

export function getAccessibilityStatus(rating: WcagRating): string {
  if (rating === "AAA") return "Excellent readability";
  if (rating === "AA") return "Accessible for normal text";
  return "Needs stronger contrast";
}

function getHarmonyOffsets(mode: HarmonyMode, size: number): number[] {
  const maps: Record<HarmonyMode, number[]> = {
    monochromatic: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    analogous: [-32, -20, -10, 0, 12, 24, 36, 48, -44],
    complementary: [0, 180, -12, 168, 12, 192, -24, 156, 24],
    "split-complementary": [0, 150, 210, -12, 162, 198, 12, 138, 222],
    triadic: [0, 120, 240, -12, 132, 228, 12, 108, 252],
    tetradic: [0, 90, 180, 270, -12, 102, 168, 282, 12],
    shades: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    tints: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  };

  const values = maps[mode];
  if (size <= values.length) return values.slice(0, size);
  return Array.from({ length: size }, (_, index) => values[index % values.length] + Math.floor(index / values.length) * 8);
}

function getLightnessSteps(size: number, mode?: HarmonyMode, baseLightness = 52): number[] {
  if (mode === "shades") {
    if (size === 3) return [66, 38, 14];
    if (size === 5) return [74, 56, 40, 26, 13];
    if (size === 7) return [80, 66, 53, 40, 28, 18, 9];
    return [88, 76, 64, 53, 42, 32, 23, 15, 7];
  }
  if (mode === "tints") {
    if (size === 3) return [96, 82, 66];
    if (size === 5) return [98, 92, 84, 74, 62];
    if (size === 7) return [99, 95, 90, 83, 75, 66, 55];
    return [99, 96, 92, 87, 80, 72, 63, 53, 42];
  }
  if (mode === "monochromatic") {
    if (size === 3) return [90, baseLightness, 20];
    if (size === 5) return [96, 80, baseLightness, 34, 16];
    if (size === 7) return [97, 88, 74, baseLightness, 38, 25, 14];
    return [98, 91, 82, 70, baseLightness, 40, 30, 22, 13];
  }
  if (size === 3) return [92, 54, 24];
  if (size === 5) return [95, 76, 54, 36, 18];
  if (size === 7) return [96, 84, 70, 55, 42, 30, 18];
  return [97, 88, 78, 66, 54, 43, 33, 24, 16];
}

function getSaturationShift(mode: HarmonyMode, index: number): number {
  if (mode === "monochromatic") return index % 2 === 0 ? -8 : 6;
  if (mode === "shades" || mode === "tints") return index % 2 === 0 ? -4 : 4;
  return index % 3 === 0 ? 0 : index % 3 === 1 ? -6 : 8;
}

function getColorName(index: number): string {
  const names = ["Background", "Muted", "Primary", "Card", "Accent", "Border", "Surface", "Highlight", "Ink"];
  return names[index] ?? `Color ${index + 1}`;
}

function getRoleName(index: number, mode: HarmonyMode): string {
  if (mode === "shades") {
    const names = ["Light", "Soft", "Base", "Deep", "Dark", "Darker", "Night", "Ink", "Black" ];
    return names[index] ?? getColorName(index);
  }
  if (mode === "tints") {
    const names = ["Cloud", "Mist", "Tint", "Soft", "Base", "Fresh", "Accent", "Deep", "Ink" ];
    return names[index] ?? getColorName(index);
  }
  return getColorName(index);
}

function getHueFamily(hue: number): string {
  if (hue < 15 || hue >= 345) return "Red";
  if (hue < 45) return "Orange";
  if (hue < 70) return "Yellow";
  if (hue < 165) return "Green";
  if (hue < 195) return "Cyan";
  if (hue < 255) return "Blue";
  if (hue < 290) return "Violet";
  if (hue < 345) return "Magenta";
  return "Neutral";
}

function getPaletteMood(saturation: number, lightness: number): string {
  if (saturation < 28) return lightness < 38 ? "Minimal and serious" : "Soft and neutral";
  if (lightness < 34) return "Deep and premium";
  if (lightness > 76) return "Light and airy";
  if (saturation > 72) return "Vibrant and expressive";
  return "Balanced and modern";
}

function normalizeHue(value: number): number {
  return ((value % 360) + 360) % 360;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function hexToRgb(hexInput: string): { r: number; g: number; b: number } {
  const hex = (normalizeHex(hexInput) ?? "#000000").slice(1);
  const value = Number.parseInt(hex, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      default:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const normalize = (value: number) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
}
