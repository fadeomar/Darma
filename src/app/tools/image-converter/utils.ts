import type { ImageOutputFormat } from "./types";

export const IMAGE_OUTPUT_OPTIONS: Array<{ label: string; value: ImageOutputFormat; extension: string }> = [
  { label: "PNG", value: "image/png", extension: "png" },
  { label: "JPEG", value: "image/jpeg", extension: "jpg" },
  { label: "WebP", value: "image/webp", extension: "webp" },
];

export function outputFilename(originalName: string, format: ImageOutputFormat): string {
  const option = IMAGE_OUTPUT_OPTIONS.find((item) => item.value === format) ?? IMAGE_OUTPUT_OPTIONS[0];
  const base = originalName.replace(/\.[^.]+$/, "") || "converted-image";
  return `${base}.${option.extension}`;
}

export async function convertImage(file: File, format: ImageOutputFormat, quality = 0.92): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas is not available in this browser.");
  }

  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not convert image."));
          return;
        }
        resolve(blob);
      },
      format,
      quality,
    );
  });
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
