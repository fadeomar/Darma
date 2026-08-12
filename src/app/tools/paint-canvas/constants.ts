import type { CanvasBackground, CanvasPreset, CanvasSize } from "./types";

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;
export const DEFAULT_CANVAS_SIZE: CanvasSize = { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
export const MIN_CANVAS_DIMENSION = 128;
export const MAX_CANVAS_DIMENSION = 4096;
export const HISTORY_LIMIT = 50;
export const LARGE_DOCUMENT_HISTORY_LIMIT = 12;
export const LARGE_DOCUMENT_SNAPSHOT_BYTES = 1_000_000;
export const AUTOSAVE_DELAY_MS = 700;
export const PAINT_PROJECT_VERSION = 1;
export const BACKGROUND = "#ffffff";
export const DEFAULT_BACKGROUND: CanvasBackground = { mode: "solid", color: BACKGROUND };

export const CANVAS_PRESETS: CanvasPreset[] = [
  { id: "default", label: "Darma canvas", hint: "1200 × 800", width: 1200, height: 800 },
  { id: "hd", label: "HD / YouTube", hint: "1280 × 720", width: 1280, height: 720 },
  { id: "full-hd", label: "Full HD", hint: "1920 × 1080", width: 1920, height: 1080 },
  { id: "square", label: "Square", hint: "1080 × 1080", width: 1080, height: 1080 },
  { id: "portrait", label: "Social portrait", hint: "1080 × 1350", width: 1080, height: 1350 },
  { id: "story", label: "Story / Reel", hint: "1080 × 1920", width: 1080, height: 1920 },
  { id: "presentation", label: "Presentation", hint: "1600 × 900", width: 1600, height: 900 },
];

export const SWATCHES = [
  "#111827",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#2563eb",
  "#7c3aed",
  "#ec4899",
  "#64748b",
];
