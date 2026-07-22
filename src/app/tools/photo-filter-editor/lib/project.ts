import { FILTER_CONTROLS, clampFilterState, createDefaultFilterState, createDefaultOrientation } from "./adjustments";
import { clampCrop, FULL_CROP } from "./crop";
import { MAX_OUTPUT_EDGE, MIN_OUTPUT_EDGE, createDefaultExportSettings, clampOutputEdge, clampQuality, sanitizeFilename } from "./resize";
import type { ExportFormat, ExportSettings, Orientation, PhotoAdjustments, PhotoEditState, PhotoProjectV1, PreviewSettings } from "../types";

export const PROJECT_KIND = "darma.photo-filter-project" as const;
export const PROJECT_VERSION = 1 as const;
export const MAX_PROJECT_JSON_CHARS = 100_000;

export type ProjectParseResult =
  | { ok: true; project: PhotoProjectV1 }
  | { ok: false; error: string };

export function createDefaultEditState(): PhotoEditState {
  return { adjustments: createDefaultFilterState(), crop: { ...FULL_CROP }, orientation: createDefaultOrientation() };
}

export function createDefaultPreviewSettings(): PreviewSettings {
  return { background: "checkerboard", showOverlays: true, comparisonEnabled: true, comparisonPosition: 50 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeOrientation(value: Orientation): Orientation {
  return {
    rotate: [0, 90, 180, 270].includes(value.rotate) ? value.rotate : 0,
    flipH: value.flipH === true,
    flipV: value.flipV === true,
  };
}

function normalizeExportSettings(value: ExportSettings): ExportSettings {
  const defaults = createDefaultExportSettings();
  return {
    format: value.format === "jpeg" || value.format === "webp" || value.format === "png" ? value.format : defaults.format,
    quality: clampQuality(value.quality),
    backgroundColor: /^#[0-9a-f]{6}$/i.test(value.backgroundColor) ? value.backgroundColor : defaults.backgroundColor,
    filename: sanitizeFilename(value.filename),
    resizeMode: value.resizeMode === "custom" || value.resizeMode === "scale" || value.resizeMode === "original" ? value.resizeMode : defaults.resizeMode,
    width: clampOutputEdge(value.width),
    height: clampOutputEdge(value.height),
    lockAspect: value.lockAspect !== false,
    scalePercent: Number.isFinite(value.scalePercent) ? Math.min(400, Math.max(1, value.scalePercent)) : defaults.scalePercent,
    allowUpscale: value.allowUpscale === true,
  };
}

function normalizePreviewSettings(value: PreviewSettings): PreviewSettings {
  return {
    background: value.background === "light" || value.background === "dark" || value.background === "checkerboard" ? value.background : "checkerboard",
    showOverlays: value.showOverlays !== false,
    comparisonEnabled: value.comparisonEnabled !== false,
    comparisonPosition: Number.isFinite(value.comparisonPosition) ? Math.min(100, Math.max(0, value.comparisonPosition)) : 50,
  };
}

export function createPhotoProject(
  name: string,
  edit: PhotoEditState,
  exportSettings: ExportSettings,
  preview: PreviewSettings,
): PhotoProjectV1 {
  return {
    kind: PROJECT_KIND,
    version: PROJECT_VERSION,
    name: name.trim().slice(0, 80) || "Untitled photo project",
    edit: {
      adjustments: clampFilterState(edit.adjustments),
      crop: clampCrop(edit.crop),
      orientation: normalizeOrientation(edit.orientation),
    },
    export: normalizeExportSettings(exportSettings),
    preview: normalizePreviewSettings(preview),
  };
}

export function serializeProject(project: PhotoProjectV1): string {
  return JSON.stringify(project, null, 2);
}

function parseAdjustments(value: unknown): PhotoAdjustments | null {
  if (!isRecord(value)) return null;
  const next = {} as PhotoAdjustments;
  for (const control of FILTER_CONTROLS) {
    const raw = value[control.key];
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw < control.min || raw > control.max) return null;
    next[control.key] = raw;
  }
  return next;
}

function parseOrientation(value: unknown): Orientation | null {
  if (!isRecord(value)) return null;
  if (typeof value.rotate !== "number" || ![0, 90, 180, 270].includes(value.rotate)) return null;
  if (typeof value.flipH !== "boolean" || typeof value.flipV !== "boolean") return null;
  return { rotate: value.rotate as Orientation["rotate"], flipH: value.flipH, flipV: value.flipV };
}

function parseExportSettings(value: unknown): ExportSettings | null {
  if (!isRecord(value)) return null;
  const format: ExportFormat | null = value.format === "png" || value.format === "jpeg" || value.format === "webp" ? value.format : null;
  const resizeMode = value.resizeMode === "original" || value.resizeMode === "custom" || value.resizeMode === "scale" ? value.resizeMode : null;
  if (!format || !resizeMode) return null;
  if (typeof value.quality !== "number" || !Number.isFinite(value.quality) || value.quality < 0.1 || value.quality > 1) return null;
  if (typeof value.backgroundColor !== "string" || !/^#[0-9a-f]{6}$/i.test(value.backgroundColor)) return null;
  if (typeof value.filename !== "string" || value.filename.length > 80) return null;
  if (typeof value.width !== "number" || !Number.isFinite(value.width) || value.width < MIN_OUTPUT_EDGE || value.width > MAX_OUTPUT_EDGE) return null;
  if (typeof value.height !== "number" || !Number.isFinite(value.height) || value.height < MIN_OUTPUT_EDGE || value.height > MAX_OUTPUT_EDGE) return null;
  if (typeof value.lockAspect !== "boolean" || typeof value.allowUpscale !== "boolean") return null;
  if (typeof value.scalePercent !== "number" || !Number.isFinite(value.scalePercent) || value.scalePercent < 1 || value.scalePercent > 400) return null;
  return normalizeExportSettings({
    format,
    quality: value.quality,
    backgroundColor: value.backgroundColor,
    filename: value.filename,
    resizeMode,
    width: value.width,
    height: value.height,
    lockAspect: value.lockAspect,
    scalePercent: value.scalePercent,
    allowUpscale: value.allowUpscale,
  });
}

function parsePreviewSettings(value: unknown): PreviewSettings | null {
  if (!isRecord(value)) return null;
  if (value.background !== "checkerboard" && value.background !== "light" && value.background !== "dark") return null;
  if (typeof value.showOverlays !== "boolean" || typeof value.comparisonEnabled !== "boolean") return null;
  if (typeof value.comparisonPosition !== "number" || !Number.isFinite(value.comparisonPosition) || value.comparisonPosition < 0 || value.comparisonPosition > 100) return null;
  return {
    background: value.background,
    showOverlays: value.showOverlays,
    comparisonEnabled: value.comparisonEnabled,
    comparisonPosition: value.comparisonPosition,
  };
}

export function parseProjectJson(text: string): ProjectParseResult {
  if (typeof text !== "string" || text.length === 0) return { ok: false, error: "Choose a photo project JSON file." };
  if (text.length > MAX_PROJECT_JSON_CHARS) return { ok: false, error: "The project file is too large." };
  if (projectContainsImageData(text)) return { ok: false, error: "Project files cannot contain embedded image data." };

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "The project file is not valid JSON." };
  }
  if (!isRecord(raw)) return { ok: false, error: "The project file must contain an object." };
  if (raw.kind !== PROJECT_KIND) return { ok: false, error: "This is not a Darma photo project file." };
  if (raw.version !== PROJECT_VERSION) return { ok: false, error: "This photo project version is not supported." };
  if (typeof raw.name !== "string" || raw.name.length > 80) return { ok: false, error: "The project name is invalid." };
  if (!isRecord(raw.edit)) return { ok: false, error: "The project is missing its edit settings." };

  const adjustments = parseAdjustments(raw.edit.adjustments);
  if (!adjustments) return { ok: false, error: "The project has invalid adjustment values." };
  if (!isRecord(raw.edit.crop)) return { ok: false, error: "The project has invalid crop settings." };
  const cropRaw = raw.edit.crop;
  if ([cropRaw.x, cropRaw.y, cropRaw.width, cropRaw.height].some((value) => typeof value !== "number" || !Number.isFinite(value))) {
    return { ok: false, error: "The project crop contains invalid numbers." };
  }
  const crop = clampCrop({ x: cropRaw.x as number, y: cropRaw.y as number, width: cropRaw.width as number, height: cropRaw.height as number });
  if (
    Math.abs(crop.x - (cropRaw.x as number)) > 0.0001
    || Math.abs(crop.y - (cropRaw.y as number)) > 0.0001
    || Math.abs(crop.width - (cropRaw.width as number)) > 0.0001
    || Math.abs(crop.height - (cropRaw.height as number)) > 0.0001
  ) return { ok: false, error: "The project crop is outside the image bounds." };

  const orientation = parseOrientation(raw.edit.orientation);
  if (!orientation) return { ok: false, error: "The project transform settings are invalid." };
  const exportSettings = parseExportSettings(raw.export);
  if (!exportSettings) return { ok: false, error: "The project export settings are invalid." };
  const preview = parsePreviewSettings(raw.preview);
  if (!preview) return { ok: false, error: "The project preview settings are invalid." };

  return {
    ok: true,
    project: {
      kind: PROJECT_KIND,
      version: PROJECT_VERSION,
      name: raw.name.trim() || "Imported photo project",
      edit: { adjustments, crop, orientation },
      export: exportSettings,
      preview,
    },
  };
}

export function projectContainsImageData(text: string): boolean {
  return /data:image\//i.test(text) || /"image(Data|Src|Url|Binary)"\s*:/i.test(text);
}
