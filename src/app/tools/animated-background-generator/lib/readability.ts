import type { AnimatedBackgroundState, ForegroundMode, ForegroundTone } from "@/types/animatedBackgroundTypes";

const LIGHT_FOREGROUND = "#f8fafc";
const DARK_FOREGROUND = "#0f172a";
const LIGHT_SCRIM = "#ffffff";
const DARK_SCRIM = "#020617";
const NORMAL_TEXT_AA = 4.5;
const MAX_SCRIM_OPACITY = 0.82;

type Rgb = { r: number; g: number; b: number };

export type AnimatedBackgroundReadabilityStatus = "AAA" | "AA" | "Large text only" | "Fail";

export type AnimatedBackgroundReadabilityAnalysis = {
  requestedMode: ForegroundMode;
  resolvedTone: ForegroundTone;
  foregroundColor: string;
  alternateForegroundColor: string;
  rawMinContrast: number;
  rawAverageContrast: number;
  protectedMinContrast: number;
  protectedAverageContrast: number;
  alternateMinContrast: number;
  sampleCount: number;
  needsProtection: boolean;
  protectionApplied: boolean;
  scrimColor: string;
  scrimOpacity: number;
  status: AnimatedBackgroundReadabilityStatus;
  meetsNormalTextAA: boolean;
  recommendation: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(value: string): Rgb {
  const normalized = /^#[0-9a-f]{6}$/i.test(value) ? value.slice(1) : "000000";
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b]
    .map((channel) => Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function blend(foreground: Rgb, background: Rgb, alpha: number): Rgb {
  const safeAlpha = clamp(alpha, 0, 1);
  return {
    r: foreground.r * safeAlpha + background.r * (1 - safeAlpha),
    g: foreground.g * safeAlpha + background.g * (1 - safeAlpha),
    b: foreground.b * safeAlpha + background.b * (1 - safeAlpha),
  };
}

function linearChannel(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color: Rgb): number {
  return 0.2126 * linearChannel(color.r) + 0.7152 * linearChannel(color.g) + 0.0722 * linearChannel(color.b);
}

function contrastRatio(foreground: Rgb, background: Rgb): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function uniqueSamples(samples: Rgb[]): Rgb[] {
  const seen = new Set<string>();
  return samples.filter((sample) => {
    const key = rgbToHex(sample);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Builds conservative color samples from the configured base, gradient accents,
 * overlapping accents, and particle highlights. This is an estimate based on
 * exported settings rather than a claim about every animated pixel at runtime.
 */
export function buildAnimatedBackgroundColorSamples(state: AnimatedBackgroundState): string[] {
  const background = hexToRgb(state.background);
  const accents = (state.colors.length ? state.colors : ["#38bdf8", "#6366f1"]).map(hexToRgb);
  const softAlpha = clamp(0.2 + state.opacity * 0.34, 0.24, 0.52);
  const hotspotAlpha = clamp(0.38 + state.opacity * 0.36, 0.46, 0.72);
  const whiteHighlightAlpha = clamp(state.opacity * 0.26, 0.08, 0.24);
  const white = hexToRgb("#ffffff");

  const samples: Rgb[] = [background];

  accents.forEach((accent, index) => {
    const soft = blend(accent, background, softAlpha);
    const hotspot = blend(accent, background, hotspotAlpha);
    const particleHighlight = blend(white, hotspot, whiteHighlightAlpha);
    const nextAccent = accents[(index + 1) % accents.length];
    const overlap = blend(nextAccent, soft, softAlpha * 0.72);

    samples.push(soft, hotspot, particleHighlight, overlap);
  });

  return uniqueSamples(samples).map(rgbToHex);
}

function contrastStats(foreground: Rgb, samples: Rgb[]) {
  const ratios = samples.map((sample) => contrastRatio(foreground, sample));
  return {
    min: Math.min(...ratios),
    average: ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length,
  };
}

function findScrimOpacity(foreground: Rgb, samples: Rgb[], scrim: Rgb): number {
  const withoutScrim = contrastStats(foreground, samples).min;
  if (withoutScrim >= NORMAL_TEXT_AA) return 0;

  const withMaximum = contrastStats(
    foreground,
    samples.map((sample) => blend(scrim, sample, MAX_SCRIM_OPACITY)),
  ).min;
  if (withMaximum < NORMAL_TEXT_AA) return MAX_SCRIM_OPACITY;

  let low = 0;
  let high = MAX_SCRIM_OPACITY;
  for (let index = 0; index < 16; index += 1) {
    const midpoint = (low + high) / 2;
    const minimum = contrastStats(
      foreground,
      samples.map((sample) => blend(scrim, sample, midpoint)),
    ).min;
    if (minimum >= NORMAL_TEXT_AA) high = midpoint;
    else low = midpoint;
  }

  return Math.ceil(high * 1000) / 1000;
}

function readabilityStatus(contrast: number): AnimatedBackgroundReadabilityStatus {
  if (contrast >= 7) return "AAA";
  if (contrast >= NORMAL_TEXT_AA) return "AA";
  if (contrast >= 3) return "Large text only";
  return "Fail";
}

export function getAnimatedBackgroundReadability(
  state: AnimatedBackgroundState,
): AnimatedBackgroundReadabilityAnalysis {
  const samples = buildAnimatedBackgroundColorSamples(state).map(hexToRgb);
  const light = hexToRgb(LIGHT_FOREGROUND);
  const dark = hexToRgb(DARK_FOREGROUND);
  const lightStats = contrastStats(light, samples);
  const darkStats = contrastStats(dark, samples);

  const resolvedTone: ForegroundTone = state.foregroundMode === "auto"
    ? lightStats.min >= darkStats.min ? "light" : "dark"
    : state.foregroundMode;

  const foreground = resolvedTone === "light" ? light : dark;
  const foregroundColor = resolvedTone === "light" ? LIGHT_FOREGROUND : DARK_FOREGROUND;
  const alternateForegroundColor = resolvedTone === "light" ? DARK_FOREGROUND : LIGHT_FOREGROUND;
  const rawStats = resolvedTone === "light" ? lightStats : darkStats;
  const alternateStats = resolvedTone === "light" ? darkStats : lightStats;
  const scrimColor = resolvedTone === "light" ? DARK_SCRIM : LIGHT_SCRIM;
  const scrim = hexToRgb(scrimColor);
  const needsProtection = rawStats.min < NORMAL_TEXT_AA;
  const scrimOpacity = state.readabilityProtection && needsProtection
    ? findScrimOpacity(foreground, samples, scrim)
    : 0;
  const protectedSamples = scrimOpacity
    ? samples.map((sample) => blend(scrim, sample, scrimOpacity))
    : samples;
  const protectedStats = contrastStats(foreground, protectedSamples);
  const protectionApplied = scrimOpacity > 0;
  const status = readabilityStatus(protectedStats.min);

  let recommendation: string;
  if (state.foregroundMode === "auto" && protectionApplied) {
    recommendation = `${resolvedTone === "light" ? "Light" : "Dark"} foreground selected automatically with a ${Math.round(scrimOpacity * 100)}% protective scrim.`;
  } else if (state.foregroundMode === "auto") {
    recommendation = `${resolvedTone === "light" ? "Light" : "Dark"} foreground selected automatically; no protective scrim is required.`;
  } else if (!state.readabilityProtection && needsProtection) {
    recommendation = `Enable readability protection or switch to ${alternateStats.min > rawStats.min ? resolvedTone === "light" ? "dark" : "light" : "auto"} foreground.`;
  } else if (protectionApplied) {
    recommendation = `${resolvedTone === "light" ? "Light" : "Dark"} foreground is protected by a ${Math.round(scrimOpacity * 100)}% scrim.`;
  } else {
    recommendation = `${resolvedTone === "light" ? "Light" : "Dark"} foreground meets the estimated contrast target without protection.`;
  }

  return {
    requestedMode: state.foregroundMode,
    resolvedTone,
    foregroundColor,
    alternateForegroundColor,
    rawMinContrast: Number(rawStats.min.toFixed(2)),
    rawAverageContrast: Number(rawStats.average.toFixed(2)),
    protectedMinContrast: Number(protectedStats.min.toFixed(2)),
    protectedAverageContrast: Number(protectedStats.average.toFixed(2)),
    alternateMinContrast: Number(alternateStats.min.toFixed(2)),
    sampleCount: samples.length,
    needsProtection,
    protectionApplied,
    scrimColor,
    scrimOpacity,
    status,
    meetsNormalTextAA: protectedStats.min >= NORMAL_TEXT_AA,
    recommendation,
  };
}

export function rgbaFromHex(color: string, alpha: number): string {
  const { r, g, b } = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1).toFixed(3)})`;
}
