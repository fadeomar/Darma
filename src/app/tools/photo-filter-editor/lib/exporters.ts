import { EXPORT_MIME } from "../filters";
import { cropToPixels, getOrientedDimensions } from "./crop";
import { renderPhotoToCanvas } from "./renderPipeline";
import { calculateOutputDimensions, sanitizeFilename } from "./resize";
import type { ExportSettings, LoadedPhoto, PhotoEditState } from "../types";

export type ExportPlan = ReturnType<typeof createExportPlan>;

export function createExportPlan(photo: LoadedPhoto, edit: PhotoEditState, settings: ExportSettings) {
  const oriented = getOrientedDimensions(photo.info.width, photo.info.height, edit.orientation);
  const cropPixels = cropToPixels(edit.crop, oriented.width, oriented.height);
  const dimensions = calculateOutputDimensions(cropPixels.width, cropPixels.height, settings);
  const extension = settings.format === "jpeg" ? "jpg" : settings.format;
  return {
    ...dimensions,
    cropPixels,
    mimeType: EXPORT_MIME[settings.format],
    filename: `${sanitizeFilename(settings.filename)}.${extension}`,
    backgroundColor: settings.format === "jpeg" ? settings.backgroundColor : null,
    quality: settings.format === "png" ? undefined : settings.quality,
  };
}

export function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("blob"));
    }, mimeType, quality);
  });
}

export async function createEditedImageBlob(photo: LoadedPhoto, edit: PhotoEditState, settings: ExportSettings) {
  const plan = createExportPlan(photo, edit, settings);
  const canvas = document.createElement("canvas");
  renderPhotoToCanvas(canvas, {
    source: photo.original,
    sourceWidth: photo.info.width,
    sourceHeight: photo.info.height,
    outputWidth: plan.width,
    outputHeight: plan.height,
    adjustments: edit.adjustments,
    orientation: edit.orientation,
    crop: edit.crop,
    backgroundColor: plan.backgroundColor,
  });
  const blob = await canvasToBlob(canvas, plan.mimeType, plan.quality);
  canvas.width = 1;
  canvas.height = 1;
  return { blob, plan };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

let webpSupport: boolean | null = null;
export function browserSupportsWebP(): boolean {
  if (webpSupport !== null) return webpSupport;
  try {
    const canvas = document.createElement("canvas");
    webpSupport = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}
