import type { ExportSettings, ResizeMode } from "../types";

export const MAX_OUTPUT_PIXELS = 24_000_000;
export const MAX_OUTPUT_EDGE = 12_000;
export const MIN_OUTPUT_EDGE = 16;

export type OutputDimensionsResult = {
  width: number;
  height: number;
  requestedWidth: number;
  requestedHeight: number;
  wasDownscaled: boolean;
  wouldUpscale: boolean;
  sourceWidth: number;
  sourceHeight: number;
};

export function createDefaultExportSettings(): ExportSettings {
  return {
    format: "png",
    quality: 0.92,
    backgroundColor: "#ffffff",
    filename: "edited-photo",
    resizeMode: "original",
    width: 1920,
    height: 1080,
    lockAspect: true,
    scalePercent: 100,
    allowUpscale: false,
  };
}

export function clampQuality(value: number): number {
  if (!Number.isFinite(value)) return 0.92;
  return Math.min(1, Math.max(0.1, value));
}

export function clampOutputEdge(value: number): number {
  if (!Number.isFinite(value)) return MIN_OUTPUT_EDGE;
  return Math.round(Math.min(MAX_OUTPUT_EDGE, Math.max(MIN_OUTPUT_EDGE, value)));
}

export function sanitizeFilename(value: string, fallback = "edited-photo"): string {
  const cleaned = value.trim().replace(/\.[a-z0-9]+$/i, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.slice(0, 80) || fallback;
}

export function applyPixelBudget(width: number, height: number, maxPixels = MAX_OUTPUT_PIXELS): { width: number; height: number; downscaled: boolean } {
  const rawWidth = Math.max(1, Number.isFinite(width) ? width : MIN_OUTPUT_EDGE);
  const rawHeight = Math.max(1, Number.isFinite(height) ? height : MIN_OUTPUT_EDGE);
  const edgeScale = Math.min(1, MAX_OUTPUT_EDGE / rawWidth, MAX_OUTPUT_EDGE / rawHeight);
  let safeWidth = Math.max(MIN_OUTPUT_EDGE, Math.floor(rawWidth * edgeScale));
  let safeHeight = Math.max(MIN_OUTPUT_EDGE, Math.floor(rawHeight * edgeScale));
  const pixels = safeWidth * safeHeight;
  let budgetScale = 1;
  if (pixels > maxPixels) {
    budgetScale = Math.sqrt(maxPixels / pixels);
    safeWidth = Math.max(MIN_OUTPUT_EDGE, Math.floor(safeWidth * budgetScale));
    safeHeight = Math.max(MIN_OUTPUT_EDGE, Math.floor(safeHeight * budgetScale));
  }
  return { width: safeWidth, height: safeHeight, downscaled: edgeScale < 1 || budgetScale < 1 };
}

export function calculateOutputDimensions(
  sourceCropWidth: number,
  sourceCropHeight: number,
  settings: Pick<ExportSettings, "resizeMode" | "width" | "height" | "lockAspect" | "scalePercent" | "allowUpscale">,
  maxPixels = MAX_OUTPUT_PIXELS,
): OutputDimensionsResult {
  const sourceWidth = Math.max(1, Math.round(Number.isFinite(sourceCropWidth) ? sourceCropWidth : MIN_OUTPUT_EDGE));
  const sourceHeight = Math.max(1, Math.round(Number.isFinite(sourceCropHeight) ? sourceCropHeight : MIN_OUTPUT_EDGE));
  const aspect = sourceWidth / sourceHeight;
  let requestedWidth = sourceWidth;
  let requestedHeight = sourceHeight;

  if (settings.resizeMode === "scale") {
    const scale = Math.min(400, Math.max(1, Number.isFinite(settings.scalePercent) ? settings.scalePercent : 100)) / 100;
    requestedWidth = Math.round(sourceWidth * scale);
    requestedHeight = Math.round(sourceHeight * scale);
  } else if (settings.resizeMode === "custom") {
    requestedWidth = clampOutputEdge(settings.width);
    requestedHeight = clampOutputEdge(settings.height);
    if (settings.lockAspect) requestedHeight = Math.max(1, Math.round(requestedWidth / aspect));
  }

  const wouldUpscale = requestedWidth > sourceWidth + 1 || requestedHeight > sourceHeight + 1;
  let preventedUpscale = false;
  if (wouldUpscale && !settings.allowUpscale) {
    const scale = Math.min(1, sourceWidth / requestedWidth, sourceHeight / requestedHeight);
    requestedWidth = Math.max(1, Math.floor(requestedWidth * scale));
    requestedHeight = Math.max(1, Math.floor(requestedHeight * scale));
    preventedUpscale = true;
  }

  const budget = applyPixelBudget(requestedWidth, requestedHeight, maxPixels);
  return {
    width: budget.width,
    height: budget.height,
    requestedWidth,
    requestedHeight,
    wasDownscaled: budget.downscaled || preventedUpscale,
    wouldUpscale,
    sourceWidth,
    sourceHeight,
  };
}

function fitLockedDimensions(width: number, height: number): { width: number; height: number } {
  const budget = applyPixelBudget(width, height, Number.MAX_SAFE_INTEGER);
  return { width: budget.width, height: budget.height };
}

export function setLockedWidth(width: number, aspect: number): { width: number; height: number } {
  const safeWidth = clampOutputEdge(width);
  return fitLockedDimensions(safeWidth, safeWidth / Math.max(0.01, aspect));
}

export function setLockedHeight(height: number, aspect: number): { width: number; height: number } {
  const safeHeight = clampOutputEdge(height);
  return fitLockedDimensions(safeHeight * Math.max(0.01, aspect), safeHeight);
}

export const COMMON_SIZE_PRESETS: Array<{
  id: string;
  label: string;
  mode: ResizeMode;
  width?: number;
  height?: number;
}> = [
  { id: "original", label: "Original crop", mode: "original" },
  { id: "1080-wide", label: "1080px wide", mode: "custom", width: 1080 },
  { id: "1920-wide", label: "1920px wide", mode: "custom", width: 1920 },
  { id: "instagram-square", label: "Instagram square", mode: "custom", width: 1080, height: 1080 },
  { id: "instagram-portrait", label: "Instagram portrait", mode: "custom", width: 1080, height: 1350 },
  { id: "story", label: "Story", mode: "custom", width: 1080, height: 1920 },
];
