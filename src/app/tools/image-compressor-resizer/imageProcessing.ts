import type { ImageInputState, ImageOutputState, OutputFormat, OutputMimeType } from "./types";
import { resolveOutputMimeType, savingsPercent } from "./formatUtils";

export type ProcessingOptions = {
  quality: number;
  outputFormat: OutputFormat;
  targetWidth: number;
  targetHeight: number;
  keepAspectRatio: boolean;
  doNotEnlarge: boolean;
};

export async function loadImageFromFile(file: File): Promise<ImageInputState> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = objectUrl;
    await img.decode();
    return {
      file,
      objectUrl,
      name: file.name,
      size: file.size,
      width: img.naturalWidth,
      height: img.naturalHeight,
      type: file.type,
    };
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new Error("We could not read this image. Try another file.");
  }
}

export function calculateOutputDimensions(
  originalWidth: number,
  originalHeight: number,
  options: Pick<ProcessingOptions, "targetWidth" | "targetHeight" | "keepAspectRatio" | "doNotEnlarge">,
): { width: number; height: number } {
  const { targetWidth, targetHeight, keepAspectRatio, doNotEnlarge } = options;
  const ratio = originalWidth / (originalHeight || 1);

  let outWidth = originalWidth;
  let outHeight = originalHeight;

  if (targetWidth > 0 && targetHeight > 0) {
    outWidth = targetWidth;
    outHeight = keepAspectRatio ? Math.round(targetWidth / ratio) : targetHeight;
  } else if (targetWidth > 0) {
    outWidth = targetWidth;
    outHeight = keepAspectRatio ? Math.round(targetWidth / ratio) : originalHeight;
  } else if (targetHeight > 0) {
    outHeight = targetHeight;
    outWidth = keepAspectRatio ? Math.round(targetHeight * ratio) : originalWidth;
  }

  if (doNotEnlarge) {
    outWidth = Math.min(outWidth, originalWidth);
    outHeight = Math.min(outHeight, originalHeight);
  }

  return {
    width: Math.max(1, Math.round(outWidth)),
    height: Math.max(1, Math.round(outHeight)),
  };
}

function blobFromCanvas(
  canvas: HTMLCanvasElement,
  mimeType: OutputMimeType,
  quality: number | undefined,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Could not prepare the optimized image. Try another format."));
      },
      mimeType,
      quality,
    );
  });
}

function buildCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
  mimeType: OutputMimeType,
): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  if (mimeType === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return ctx;
}

export async function processImage(
  input: ImageInputState,
  options: ProcessingOptions,
): Promise<ImageOutputState> {
  const img = new Image();
  img.decoding = "async";
  img.src = input.objectUrl;
  await img.decode();

  const mimeType = resolveOutputMimeType(options.outputFormat, input.type);
  const { width, height } = calculateOutputDimensions(input.width, input.height, options);
  const ctx = buildCanvas(img, width, height, mimeType);
  const quality = mimeType === "image/png" ? undefined : options.quality;
  const blob = await blobFromCanvas(ctx.canvas, mimeType, quality);

  return {
    blob,
    objectUrl: URL.createObjectURL(blob),
    size: blob.size,
    width,
    height,
    type: mimeType,
    savedPercent: savingsPercent(input.size, blob.size),
  };
}

export type TargetSizeResult = {
  result: ImageOutputState;
  targetReached: boolean;
};

export async function processImageWithTargetSize(
  input: ImageInputState,
  options: ProcessingOptions & { targetFileSizeBytes: number },
): Promise<TargetSizeResult> {
  const MIN_QUALITY = 0.25;
  const MAX_ATTEMPTS = 8;

  const mimeType = resolveOutputMimeType(options.outputFormat, input.type);
  const { width, height } = calculateOutputDimensions(input.width, input.height, options);

  const img = new Image();
  img.decoding = "async";
  img.src = input.objectUrl;
  await img.decode();

  const ctx = buildCanvas(img, width, height, mimeType);

  // PNG is lossless — single export, no iterative quality reduction possible
  if (mimeType === "image/png") {
    const blob = await blobFromCanvas(ctx.canvas, mimeType, undefined);
    return {
      result: {
        blob,
        objectUrl: URL.createObjectURL(blob),
        size: blob.size,
        width,
        height,
        type: mimeType,
        savedPercent: savingsPercent(input.size, blob.size),
      },
      targetReached: blob.size <= options.targetFileSizeBytes,
    };
  }

  let quality = Math.min(options.quality, 0.92);
  let lastBlob: Blob | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const blob = await blobFromCanvas(ctx.canvas, mimeType, quality);
    lastBlob = blob;

    if (blob.size <= options.targetFileSizeBytes) {
      return {
        result: {
          blob,
          objectUrl: URL.createObjectURL(blob),
          size: blob.size,
          width,
          height,
          type: mimeType,
          savedPercent: savingsPercent(input.size, blob.size),
        },
        targetReached: true,
      };
    }

    if (quality <= MIN_QUALITY) break;

    // Adaptive reduction: proportional to how far we are from target
    const overageRatio = options.targetFileSizeBytes / blob.size;
    const factor = Math.min(0.85, Math.max(0.45, overageRatio));
    quality = Math.max(MIN_QUALITY, quality * factor);
  }

  const blob = lastBlob!;
  return {
    result: {
      blob,
      objectUrl: URL.createObjectURL(blob),
      size: blob.size,
      width,
      height,
      type: mimeType,
      savedPercent: savingsPercent(input.size, blob.size),
    },
    targetReached: blob.size <= options.targetFileSizeBytes,
  };
}
