import { normalizePoint } from "./clipPath";
import { getAspectRatioValue } from "./studio";
import type { CanvasAspectRatio, ClipPoint, PreviewObjectFit, PreviewObjectPosition } from "./types";

export const MAX_PNG_EXPORT_PIXELS = 24_000_000;
export const MAX_EMBEDDED_SVG_IMAGE_BYTES = 8 * 1024 * 1024;

export type ExportImagePlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function sanitizeFilename(value: string, fallback = "clip-shape"): string {
  const safe = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return safe || fallback;
}

export function resolveExportAspectRatio(
  aspectRatio: CanvasAspectRatio,
  renderedWidth?: number,
  renderedHeight?: number,
): number {
  const fixedRatio = getAspectRatioValue(aspectRatio);
  if (fixedRatio) return fixedRatio;
  if (
    typeof renderedWidth === "number" &&
    typeof renderedHeight === "number" &&
    Number.isFinite(renderedWidth) &&
    Number.isFinite(renderedHeight) &&
    renderedWidth > 0 &&
    renderedHeight > 0
  ) {
    return renderedWidth / renderedHeight;
  }
  return 4 / 3;
}

export function getSvgDimensions(
  aspectRatio: CanvasAspectRatio,
  base = 1000,
  renderedWidth?: number,
  renderedHeight?: number,
): { width: number; height: number } {
  const ratio = resolveExportAspectRatio(aspectRatio, renderedWidth, renderedHeight);
  if (ratio >= 1) return { width: base, height: Math.round(base / ratio) };
  return { width: Math.round(base * ratio), height: base };
}

export function pointsToExportCoordinates(points: ClipPoint[], width: number, height: number): ClipPoint[] {
  return points.map((point) => {
    const normalized = normalizePoint(point);
    return {
      x: Math.round((normalized.x / 100) * width * 100) / 100,
      y: Math.round((normalized.y / 100) * height * 100) / 100,
    };
  });
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character];
  });
}

function getPreserveAspectRatio(objectFit: PreviewObjectFit, objectPosition: PreviewObjectPosition): string {
  if (objectFit === "fill") return "none";
  const align: Record<PreviewObjectPosition, string> = {
    center: "xMidYMid",
    top: "xMidYMin",
    bottom: "xMidYMax",
    left: "xMinYMid",
    right: "xMaxYMid",
  };
  return `${align[objectPosition]} ${objectFit === "cover" ? "slice" : "meet"}`;
}

export function generateClipPathSvg(options: {
  points: ClipPoint[];
  className: string;
  aspectRatio: CanvasAspectRatio;
  backgroundColor?: string;
  embeddedImageDataUrl?: string | null;
  objectFit?: PreviewObjectFit;
  objectPosition?: PreviewObjectPosition;
  renderedArtboardWidth?: number;
  renderedArtboardHeight?: number;
}): string {
  const { width, height } = getSvgDimensions(
    options.aspectRatio,
    1000,
    options.renderedArtboardWidth,
    options.renderedArtboardHeight,
  );
  const coordinates = pointsToExportCoordinates(options.points, width, height);
  const polygon = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const id = `${sanitizeFilename(options.className)}-clip`;
  const backgroundColor = /^#[0-9a-f]{6}$/i.test(options.backgroundColor ?? "")
    ? options.backgroundColor
    : "#7c3aed";
  const content = options.embeddedImageDataUrl
    ? `  <image href="${escapeXml(options.embeddedImageDataUrl)}" width="${width}" height="${height}" preserveAspectRatio="${getPreserveAspectRatio(options.objectFit ?? "cover", options.objectPosition ?? "center")}" clip-path="url(#${id})" />`
    : `  <polygon points="${polygon}" fill="${backgroundColor}" clip-path="url(#${id})" />`;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title">`,
    `  <title id="title">${escapeXml(options.className || "Clip path shape")}</title>`,
    "  <defs>",
    `    <clipPath id="${id}" clipPathUnits="userSpaceOnUse">`,
    `      <polygon points="${polygon}" />`,
    "    </clipPath>",
    "  </defs>",
    content,
    "</svg>",
    "",
  ].join("\n");
}

export function calculateSafeExportSize(
  width: number,
  height: number,
  maxPixels = MAX_PNG_EXPORT_PIXELS,
): { width: number; height: number; downscaled: boolean } {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(maxPixels) ||
    width <= 0 ||
    height <= 0 ||
    maxPixels <= 0
  ) {
    return { width: 0, height: 0, downscaled: false };
  }
  const pixels = width * height;
  if (pixels <= maxPixels) {
    return {
      width: Math.max(1, Math.floor(width)),
      height: Math.max(1, Math.floor(height)),
      downscaled: false,
    };
  }
  const scale = Math.sqrt(maxPixels / pixels);
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
    downscaled: true,
  };
}

export function getObjectPositionFactors(position: PreviewObjectPosition): { x: number; y: number } {
  const factors: Record<PreviewObjectPosition, { x: number; y: number }> = {
    center: { x: 0.5, y: 0.5 },
    top: { x: 0.5, y: 0 },
    bottom: { x: 0.5, y: 1 },
    left: { x: 0, y: 0.5 },
    right: { x: 1, y: 0.5 },
  };
  return factors[position];
}

export function calculateObjectFitPlacement(options: {
  sourceWidth: number;
  sourceHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  objectFit: PreviewObjectFit;
  objectPosition: PreviewObjectPosition;
}): ExportImagePlacement {
  const { sourceWidth, sourceHeight, canvasWidth, canvasHeight, objectFit, objectPosition } = options;
  if (
    ![sourceWidth, sourceHeight, canvasWidth, canvasHeight].every(Number.isFinite) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    canvasWidth <= 0 ||
    canvasHeight <= 0
  ) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  if (objectFit === "fill") {
    return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  }
  const scale = objectFit === "cover"
    ? Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight)
    : Math.min(canvasWidth / sourceWidth, canvasHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const factors = getObjectPositionFactors(objectPosition);
  return {
    x: (canvasWidth - width) * factors.x,
    y: (canvasHeight - height) * factors.y,
    width,
    height,
  };
}

export function calculatePreviewExportSize(options: {
  sourceWidth: number;
  sourceHeight: number;
  artboardAspectRatio: number;
  objectFit: PreviewObjectFit;
  maxPixels?: number;
}): { width: number; height: number; downscaled: boolean } {
  const { sourceWidth, sourceHeight, artboardAspectRatio, objectFit } = options;
  if (
    ![sourceWidth, sourceHeight, artboardAspectRatio].every(Number.isFinite) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    artboardAspectRatio <= 0
  ) {
    return { width: 0, height: 0, downscaled: false };
  }

  const sourceRatio = sourceWidth / sourceHeight;
  let width: number;
  let height: number;

  if (objectFit === "contain") {
    if (sourceRatio >= artboardAspectRatio) {
      width = sourceWidth;
      height = width / artboardAspectRatio;
    } else {
      height = sourceHeight;
      width = height * artboardAspectRatio;
    }
  } else if (sourceRatio >= artboardAspectRatio) {
    height = sourceHeight;
    width = height * artboardAspectRatio;
  } else {
    width = sourceWidth;
    height = width / artboardAspectRatio;
  }

  return calculateSafeExportSize(width, height, options.maxPixels ?? MAX_PNG_EXPORT_PIXELS);
}

export async function loadLocalImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("The image could not be decoded for export."));
    image.src = url;
  });
  if (typeof image.decode === "function") await image.decode();
  return image;
}

export async function createClippedPngBlob(
  imageUrl: string,
  points: ClipPoint[],
  options: {
    aspectRatio: CanvasAspectRatio;
    objectFit: PreviewObjectFit;
    objectPosition: PreviewObjectPosition;
    renderedArtboardWidth?: number;
    renderedArtboardHeight?: number;
    maxPixels?: number;
  },
): Promise<{ blob: Blob; width: number; height: number; downscaled: boolean }> {
  const image = await loadLocalImage(imageUrl);
  const artboardAspectRatio = resolveExportAspectRatio(
    options.aspectRatio,
    options.renderedArtboardWidth,
    options.renderedArtboardHeight,
  );
  const safe = calculatePreviewExportSize({
    sourceWidth: image.naturalWidth,
    sourceHeight: image.naturalHeight,
    artboardAspectRatio,
    objectFit: options.objectFit,
    maxPixels: options.maxPixels,
  });
  if (safe.width === 0 || safe.height === 0) throw new Error("The image has invalid dimensions.");
  const canvas = document.createElement("canvas");
  canvas.width = safe.width;
  canvas.height = safe.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas export is unavailable in this browser.");
  const coordinates = pointsToExportCoordinates(points, safe.width, safe.height);
  context.save();
  context.beginPath();
  coordinates.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.closePath();
  context.clip();
  const placement = calculateObjectFitPlacement({
    sourceWidth: image.naturalWidth,
    sourceHeight: image.naturalHeight,
    canvasWidth: safe.width,
    canvasHeight: safe.height,
    objectFit: options.objectFit,
    objectPosition: options.objectPosition,
  });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, placement.x, placement.y, placement.width, placement.height);
  context.restore();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("PNG export failed."))), "image/png");
  });
  return { blob, ...safe };
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function objectUrlToDataUrl(url: string): Promise<{ dataUrl: string; bytes: number }> {
  const response = await fetch(url);
  const blob = await response.blob();
  if (blob.size > MAX_EMBEDDED_SVG_IMAGE_BYTES) {
    throw new Error("The image is too large to embed safely in SVG.");
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Image embedding failed.")));
    reader.onerror = () => reject(new Error("Image embedding failed."));
    reader.readAsDataURL(blob);
  });
  return { dataUrl, bytes: blob.size };
}
