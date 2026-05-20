import type { ImageOutputFormat } from "./types";

export const OUTPUT_FORMATS: Array<{
  label: string;
  value: ImageOutputFormat;
  extension: string;
}> = [
  { label: "PNG", value: "image/png", extension: "png" },
  { label: "JPEG", value: "image/jpeg", extension: "jpg" },
  { label: "WebP", value: "image/webp", extension: "webp" },
];

export function getExtension(format: ImageOutputFormat): string {
  return OUTPUT_FORMATS.find((item) => item.value === format)?.extension ?? "png";
}

export function replaceExtension(filename: string, extension: string): string {
  const cleaned = filename.trim() || "converted-image";
  return cleaned.replace(/\.[^.]+$/, "") + `.${extension}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
