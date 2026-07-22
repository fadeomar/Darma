import { buildFilterString, createDefaultFilterState, getActiveRasterAdjustments } from "./adjustments";
import { cropToPixels, getOrientedDimensions } from "./crop";
import { getCanvasTransform } from "./transforms";
import type { NormalizedCrop, Orientation, PhotoAdjustments } from "../types";

export type RenderPhotoParams = {
  source: CanvasImageSource;
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
  adjustments: PhotoAdjustments;
  orientation: Orientation;
  crop: NormalizedCrop;
  backgroundColor?: string | null;
};

export type RenderGeometry = {
  orientedWidth: number;
  orientedHeight: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  scaleX: number;
  scaleY: number;
};

export function calculateRenderGeometry(
  sourceWidth: number,
  sourceHeight: number,
  orientation: Orientation,
  crop: NormalizedCrop,
  outputWidth: number,
  outputHeight: number,
): RenderGeometry {
  const oriented = getOrientedDimensions(sourceWidth, sourceHeight, orientation);
  const cropPixels = cropToPixels(crop, oriented.width, oriented.height);
  return {
    orientedWidth: oriented.width,
    orientedHeight: oriented.height,
    cropX: cropPixels.x,
    cropY: cropPixels.y,
    cropWidth: cropPixels.width,
    cropHeight: cropPixels.height,
    scaleX: outputWidth / cropPixels.width,
    scaleY: outputHeight / cropPixels.height,
  };
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function applyRasterAdjustments(imageData: ImageData, adjustments: PhotoAdjustments): ImageData {
  const exposureFactor = 2 ** adjustments.exposure;
  const temperature = adjustments.temperature / 100;
  const highlights = adjustments.highlights / 100;
  const shadows = adjustments.shadows / 100;
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    let red = data[index] * exposureFactor;
    let green = data[index + 1] * exposureFactor;
    let blue = data[index + 2] * exposureFactor;

    if (temperature !== 0) {
      red += 34 * temperature;
      green += 4 * temperature;
      blue -= 34 * temperature;
    }

    if (highlights !== 0 || shadows !== 0) {
      const luminance = Math.min(1, Math.max(0, (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255));
      const highlightWeight = smoothstep(0.45, 1, luminance);
      const shadowWeight = 1 - smoothstep(0, 0.55, luminance);
      const delta = 90 * (highlights * highlightWeight + shadows * shadowWeight);
      red += delta;
      green += delta;
      blue += delta;
    }

    data[index] = Math.min(255, Math.max(0, Math.round(red)));
    data[index + 1] = Math.min(255, Math.max(0, Math.round(green)));
    data[index + 2] = Math.min(255, Math.max(0, Math.round(blue)));
  }
  return imageData;
}

export function drawPhotoToContext(context: CanvasRenderingContext2D, params: RenderPhotoParams): RenderGeometry {
  const {
    source,
    sourceWidth,
    sourceHeight,
    outputWidth,
    outputHeight,
    adjustments,
    orientation,
    crop,
  } = params;
  const geometry = calculateRenderGeometry(sourceWidth, sourceHeight, orientation, crop, outputWidth, outputHeight);
  const transform = getCanvasTransform(sourceWidth, sourceHeight, orientation);

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, outputWidth, outputHeight);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.filter = buildFilterString(adjustments);
  context.scale(geometry.scaleX, geometry.scaleY);
  context.translate(-geometry.cropX, -geometry.cropY);
  context.translate(transform.centerX, transform.centerY);
  context.scale(transform.scaleX, transform.scaleY);
  context.rotate(transform.radians);
  context.drawImage(source, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);
  context.restore();
  context.filter = "none";

  if (getActiveRasterAdjustments(adjustments).length > 0) {
    const imageData = context.getImageData(0, 0, outputWidth, outputHeight);
    context.putImageData(applyRasterAdjustments(imageData, adjustments), 0, 0);
  }
  return geometry;
}

export function renderPhotoToCanvas(canvas: HTMLCanvasElement, params: RenderPhotoParams): RenderGeometry {
  if (canvas.width !== params.outputWidth) canvas.width = params.outputWidth;
  if (canvas.height !== params.outputHeight) canvas.height = params.outputHeight;

  const context = canvas.getContext("2d", { alpha: true, willReadFrequently: getActiveRasterAdjustments(params.adjustments).length > 0 });
  if (!context) throw new Error("canvas-context");
  const geometry = drawPhotoToContext(context, params);

  if (params.backgroundColor) {
    context.save();
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = params.backgroundColor;
    context.fillRect(0, 0, params.outputWidth, params.outputHeight);
    context.restore();
  }
  return geometry;
}

export function createBeforeAdjustments(): PhotoAdjustments {
  return createDefaultFilterState();
}
