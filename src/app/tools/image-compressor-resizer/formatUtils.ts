import type { OutputFormat, OutputMimeType } from "./types";

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function savingsPercent(originalBytes: number, outputBytes: number): number {
  if (!Number.isFinite(originalBytes) || originalBytes <= 0) return 0;
  return Math.max(0, Math.round(((originalBytes - outputBytes) / originalBytes) * 100));
}

export function resolveOutputMimeType(format: OutputFormat, originalType: string): OutputMimeType {
  if (format !== "original") return format as OutputMimeType;
  if (
    originalType === "image/png" ||
    originalType === "image/jpeg" ||
    originalType === "image/webp"
  ) {
    return originalType as OutputMimeType;
  }
  return "image/webp";
}

export function getExtension(mimeType: OutputMimeType): string {
  const map: Record<OutputMimeType, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[mimeType] ?? "jpg";
}

export function buildOutputFilename(originalName: string, mimeType: OutputMimeType): string {
  const ext = getExtension(mimeType);
  const base = originalName.trim() || "image";
  const withoutExt = base.replace(/\.[^.]+$/, "");
  return `${withoutExt}-optimized.${ext}`;
}

export function formatMimeLabel(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WebP",
    "image/gif": "GIF",
    "image/bmp": "BMP",
  };
  return map[mimeType] ?? (mimeType.split("/")[1]?.toUpperCase() ?? "Image");
}
