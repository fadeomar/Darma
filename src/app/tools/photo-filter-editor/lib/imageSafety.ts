import type { LoadedPhoto } from "../types";

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_SOURCE_PIXELS = 50_000_000;
export const MAX_SOURCE_EDGE = 16_000;
export const MAX_PREVIEW_PIXELS = 4_000_000;
export const SUPPORTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"] as const;

export type ImageLoadResult =
  | { ok: true; photo: LoadedPhoto; warning?: string }
  | { ok: false; error: string };

function isSupportedType(type: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(type as (typeof SUPPORTED_IMAGE_TYPES)[number]);
}

export function validateImageFile(file: File): string | null {
  if (!isSupportedType(file.type)) return "Choose a PNG, JPEG, WebP, GIF, or BMP image.";
  if (file.size > MAX_IMAGE_BYTES) return "That image is larger than 25 MB. Choose a smaller file.";
  return null;
}

export function calculatePreviewDimensions(width: number, height: number, maxPixels = MAX_PREVIEW_PIXELS) {
  const pixels = width * height;
  if (pixels <= maxPixels) return { width, height, scaled: false };
  const scale = Math.sqrt(maxPixels / pixels);
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
    scaled: true,
  };
}

function decodeImage(url: string, signal?: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    const abort = () => {
      image.src = "";
      reject(new DOMException("Image load cancelled", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    image.onload = () => {
      signal?.removeEventListener("abort", abort);
      resolve(image);
    };
    image.onerror = () => {
      signal?.removeEventListener("abort", abort);
      reject(new Error("decode"));
    };
    image.src = url;
  });
}

export async function loadPhotoFile(file: File, signal?: AbortSignal): Promise<ImageLoadResult> {
  const validation = validateImageFile(file);
  if (validation) return { ok: false, error: validation };

  const objectUrl = URL.createObjectURL(file);
  try {
    const original = await decodeImage(objectUrl, signal);
    const width = original.naturalWidth;
    const height = original.naturalHeight;
    const pixels = width * height;
    if (width < 1 || height < 1) {
      URL.revokeObjectURL(objectUrl);
      return { ok: false, error: "The image has invalid dimensions." };
    }
    if (width > MAX_SOURCE_EDGE || height > MAX_SOURCE_EDGE || pixels > MAX_SOURCE_PIXELS) {
      URL.revokeObjectURL(objectUrl);
      return { ok: false, error: "The decoded image is too large to process safely in this browser." };
    }

    const previewDimensions = calculatePreviewDimensions(width, height);
    let preview: CanvasImageSource = original;
    if (previewDimensions.scaled) {
      const canvas = document.createElement("canvas");
      canvas.width = previewDimensions.width;
      canvas.height = previewDimensions.height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        return { ok: false, error: "This browser could not create a safe preview canvas." };
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(original, 0, 0, previewDimensions.width, previewDimensions.height);
      preview = canvas;
    }

    return {
      ok: true,
      photo: {
        original,
        preview,
        previewWidth: previewDimensions.width,
        previewHeight: previewDimensions.height,
        objectUrl,
        info: { fileName: file.name, mimeType: file.type, width, height, bytes: file.size },
      },
      warning: previewDimensions.scaled
        ? "A smaller working preview is used for smooth editing. Export still uses the original source."
        : file.type === "image/gif"
          ? "Animated GIFs are edited as a single decoded frame."
          : undefined,
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    if (error instanceof DOMException && error.name === "AbortError") return { ok: false, error: "Image loading was cancelled." };
    return { ok: false, error: "The file could not be decoded as an image." };
  }
}

export function releaseLoadedPhoto(photo: LoadedPhoto | null): void {
  if (!photo) return;
  URL.revokeObjectURL(photo.objectUrl);
  if (typeof ImageBitmap !== "undefined" && photo.preview instanceof ImageBitmap) photo.preview.close();
}
