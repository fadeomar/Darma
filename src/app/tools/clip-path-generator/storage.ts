import { MAX_POINTS, MIN_POINTS, clonePoints, normalizePoint } from "./clipPath";
import { clampSnapSize, createDefaultStudioSettings } from "./studio";
import type {
  CanvasAspectRatio,
  ClipPathStudioSettings,
  ClipPoint,
  PreviewObjectFit,
  PreviewObjectPosition,
  SavedClipPathShape,
} from "./types";

export const SAVED_SHAPES_STORAGE_KEY = "darma.clip-path.saved-shapes.v1";
export const SAVED_SHAPES_VERSION = 1;
export const MAX_SAVED_SHAPES = 30;
export const MAX_SAVED_SHAPES_CHARS = 100_000;
export const MAX_SAVED_SHAPE_NAME_LENGTH = 60;

export type SavedShapeStoreResult =
  | { ok: true; items: SavedClipPathShape[] }
  | { ok: false; error: string; items: [] };

const ASPECT_RATIOS: CanvasAspectRatio[] = ["square", "4:3", "16:9", "9:16", "free"];
const OBJECT_FITS: PreviewObjectFit[] = ["cover", "contain", "fill"];
const OBJECT_POSITIONS: PreviewObjectPosition[] = ["center", "top", "bottom", "left", "right"];

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function parsePoints(value: unknown): ClipPoint[] | null {
  if (!Array.isArray(value) || value.length < MIN_POINTS || value.length > MAX_POINTS) return null;
  const points: ClipPoint[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
    const { x, y } = candidate as Record<string, unknown>;
    if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (x < 0 || x > 100 || y < 0 || y > 100) return null;
    points.push(normalizePoint({ x, y }));
  }
  return points;
}

function parseSettings(value: unknown): ClipPathStudioSettings | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const defaults = createDefaultStudioSettings();
  const aspectRatio = ASPECT_RATIOS.includes(candidate.aspectRatio as CanvasAspectRatio)
    ? (candidate.aspectRatio as CanvasAspectRatio)
    : null;
  const objectFit = OBJECT_FITS.includes(candidate.objectFit as PreviewObjectFit)
    ? (candidate.objectFit as PreviewObjectFit)
    : null;
  const objectPosition = OBJECT_POSITIONS.includes(candidate.objectPosition as PreviewObjectPosition)
    ? (candidate.objectPosition as PreviewObjectPosition)
    : null;
  if (!aspectRatio || !objectFit || !objectPosition) return null;
  if (typeof candidate.backgroundColor !== "string" || !/^#[0-9a-f]{6}$/i.test(candidate.backgroundColor)) return null;
  const booleanKeys = [
    "checkerboard",
    "showGhost",
    "showOutline",
    "showPointLabels",
    "showHandles",
    "showGrid",
    "snapEnabled",
    "webkitFallback",
  ] as const;
  if (booleanKeys.some((key) => !isBoolean(candidate[key]))) return null;
  if (typeof candidate.snapSize !== "number" || !Number.isFinite(candidate.snapSize)) return null;
  return {
    ...defaults,
    aspectRatio,
    objectFit,
    objectPosition,
    backgroundColor: candidate.backgroundColor,
    checkerboard: candidate.checkerboard as boolean,
    showGhost: candidate.showGhost as boolean,
    showOutline: candidate.showOutline as boolean,
    showPointLabels: candidate.showPointLabels as boolean,
    showHandles: candidate.showHandles as boolean,
    showGrid: candidate.showGrid as boolean,
    snapEnabled: candidate.snapEnabled as boolean,
    snapSize: clampSnapSize(candidate.snapSize),
    webkitFallback: candidate.webkitFallback as boolean,
  };
}

export function normalizeSavedShapeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_SAVED_SHAPE_NAME_LENGTH);
}

export function createSavedShape(
  input: {
    id: string;
    name: string;
    className: string;
    points: ClipPoint[];
    settings: ClipPathStudioSettings;
    timestamp?: string;
  },
): SavedClipPathShape {
  const timestamp = input.timestamp ?? new Date().toISOString();
  return {
    id: input.id,
    version: SAVED_SHAPES_VERSION,
    name: normalizeSavedShapeName(input.name) || "Untitled shape",
    className: input.className.slice(0, 100),
    points: clonePoints(input.points),
    settings: { ...input.settings, snapSize: clampSnapSize(input.settings.snapSize) },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function parseSavedShapeStore(raw: string | null): SavedShapeStoreResult {
  if (!raw) return { ok: true, items: [] };
  if (raw.length > MAX_SAVED_SHAPES_CHARS) return { ok: false, error: "Saved shape data is too large.", items: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Saved shape data is malformed.", items: [] };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Saved shape data is malformed.", items: [] };
  }
  const store = parsed as Record<string, unknown>;
  if (store.kind !== "darma.clip-path.saved-shapes" || store.version !== SAVED_SHAPES_VERSION || !Array.isArray(store.items)) {
    return { ok: false, error: "Saved shape data uses an unsupported format.", items: [] };
  }
  if (store.items.length > MAX_SAVED_SHAPES) {
    return { ok: false, error: `Saved shapes cannot exceed ${MAX_SAVED_SHAPES} items.`, items: [] };
  }
  const items: SavedClipPathShape[] = [];
  for (const item of store.items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { ok: false, error: "A saved shape entry is malformed.", items: [] };
    }
    const candidate = item as Record<string, unknown>;
    const points = parsePoints(candidate.points);
    const settings = parseSettings(candidate.settings);
    if (
      candidate.version !== SAVED_SHAPES_VERSION ||
      typeof candidate.id !== "string" ||
      !candidate.id ||
      typeof candidate.name !== "string" ||
      !normalizeSavedShapeName(candidate.name) ||
      typeof candidate.className !== "string" ||
      !points ||
      !settings ||
      !isIsoDate(candidate.createdAt) ||
      !isIsoDate(candidate.updatedAt)
    ) {
      return { ok: false, error: "A saved shape entry is malformed.", items: [] };
    }
    items.push({
      id: candidate.id.slice(0, 100),
      version: SAVED_SHAPES_VERSION,
      name: normalizeSavedShapeName(candidate.name),
      className: candidate.className.slice(0, 100),
      points,
      settings,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    });
  }
  return { ok: true, items };
}

export function serializeSavedShapeStore(items: SavedClipPathShape[]): string {
  const safeItems = items.slice(0, MAX_SAVED_SHAPES);
  const raw = JSON.stringify({
    kind: "darma.clip-path.saved-shapes",
    version: SAVED_SHAPES_VERSION,
    items: safeItems,
  });
  if (raw.length > MAX_SAVED_SHAPES_CHARS) throw new Error("Saved shape data exceeds the storage limit.");
  return raw;
}




