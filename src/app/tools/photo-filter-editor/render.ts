import { buildFilterString, createDefaultFilterState } from "./filters";
import { composeFilterLayers, curveIsNeutral, HSL_BANDS, hslIsNeutral } from "./advanced";
import { sampleCubeLut } from "./lut";
import { applySpotHealToImageData } from "./smart";
import type { AdvancedEditState, BackgroundMask, CropState, CurvePoints, FilterState, LutDefinition, Orientation, SmartEditState } from "./types";

export type RenderResult = {
  width: number;
  height: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const clampByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  if (delta !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }
  if (h < 0) h += 360;
  return [h, saturation, l] as const;
}

function hslToRgb(h: number, s: number, l: number) {
  const hue = ((h % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - chroma / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hue < 60) [rp, gp] = [chroma, x];
  else if (hue < 120) [rp, gp] = [x, chroma];
  else if (hue < 180) [gp, bp] = [chroma, x];
  else if (hue < 240) [gp, bp] = [x, chroma];
  else if (hue < 300) [rp, bp] = [x, chroma];
  else [rp, bp] = [chroma, x];
  return [(rp + m) * 255, (gp + m) * 255, (bp + m) * 255] as const;
}

function hueDistance(a: number, b: number) {
  const delta = Math.abs(a - b) % 360;
  return Math.min(delta, 360 - delta);
}

function curveValue(points: CurvePoints, input: number) {
  const xs = [0, 64, 128, 192, 255];
  const x = Math.max(0, Math.min(255, input));
  let segment = 0;
  while (segment < xs.length - 2 && x > xs[segment + 1]) segment += 1;
  const x0 = xs[segment];
  const x1 = xs[segment + 1];
  const t = (x - x0) / Math.max(1, x1 - x0);
  return points[segment] * (1 - t) + points[segment + 1] * t;
}

function applyAdvancedAdjustments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  advanced: AdvancedEditState | undefined,
  lut: LutDefinition | null | undefined,
) {
  if (!advanced) return;
  const useHsl = !hslIsNeutral(advanced.hsl);
  const useCurves = !curveIsNeutral(advanced.curves);
  const useLut = Boolean(lut && advanced.lutIntensity > 0);
  if (!useHsl && !useCurves && !useLut) return;

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch {
    return;
  }
  const data = imageData.data;
  const lutStrength = Math.max(0, Math.min(1, advanced.lutIntensity));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (useHsl) {
      let [h, saturation, lightness] = rgbToHsl(r, g, b);
      let hueShift = 0;
      let saturationShift = 0;
      let lightnessShift = 0;
      let totalWeight = 0;
      for (const bandInfo of HSL_BANDS) {
        const distance = hueDistance(h, bandInfo.center);
        const weight = Math.max(0, 1 - distance / 55);
        if (weight <= 0) continue;
        const band = advanced.hsl[bandInfo.id];
        hueShift += band.hue * weight;
        saturationShift += (band.saturation / 100) * weight;
        lightnessShift += (band.lightness / 100) * weight;
        totalWeight += weight;
      }
      if (totalWeight > 0) {
        h += hueShift / totalWeight;
        saturation = clamp01(saturation + saturationShift / totalWeight);
        lightness = clamp01(lightness + (lightnessShift / totalWeight) * 0.55);
        [r, g, b] = hslToRgb(h, saturation, lightness);
      }
    }

    if (useCurves) {
      r = curveValue(advanced.curves.rgb, r);
      g = curveValue(advanced.curves.rgb, g);
      b = curveValue(advanced.curves.rgb, b);
      r = curveValue(advanced.curves.red, r);
      g = curveValue(advanced.curves.green, g);
      b = curveValue(advanced.curves.blue, b);
    }

    if (useLut && lut) {
      const sampled = sampleCubeLut(lut, r / 255, g / 255, b / 255);
      r = r * (1 - lutStrength) + sampled[0] * 255 * lutStrength;
      g = g * (1 - lutStrength) + sampled[1] * 255 * lutStrength;
      b = b * (1 - lutStrength) + sampled[2] * 255 * lutStrength;
    }

    data[i] = clampByte(r);
    data[i + 1] = clampByte(g);
    data[i + 2] = clampByte(b);
  }
  ctx.putImageData(imageData, 0, 0);
}

function applyOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, advanced?: AdvancedEditState) {
  if (!advanced || advanced.overlay.type === "none" || advanced.overlay.intensity <= 0) return;
  const intensity = Math.max(0, Math.min(1, advanced.overlay.intensity));
  ctx.save();

  if (advanced.overlay.type === "light-leak") {
    ctx.globalCompositeOperation = "screen";
    const gradient = ctx.createRadialGradient(width * 0.08, height * 0.45, 0, width * 0.08, height * 0.45, Math.max(width, height) * 0.85);
    gradient.addColorStop(0, `rgba(255,92,55,${0.62 * intensity})`);
    gradient.addColorStop(0.38, `rgba(255,165,76,${0.28 * intensity})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else if (advanced.overlay.type === "warm-glow" || advanced.overlay.type === "cool-glow") {
    ctx.globalCompositeOperation = "soft-light";
    const warm = advanced.overlay.type === "warm-glow";
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, warm ? `rgba(255,170,80,${0.42 * intensity})` : `rgba(80,160,255,${0.38 * intensity})`);
    gradient.addColorStop(1, warm ? `rgba(255,70,120,${0.18 * intensity})` : `rgba(105,70,255,${0.16 * intensity})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else if (advanced.overlay.type === "film-dust") {
    ctx.globalCompositeOperation = "screen";
    const count = Math.max(35, Math.round((width * height) / 18000));
    for (let index = 0; index < count; index += 1) {
      const seed = Math.sin((index + 1) * 91.731) * 43758.5453;
      const seed2 = Math.sin((index + 1) * 37.119) * 24634.6345;
      const x = (seed - Math.floor(seed)) * width;
      const y = (seed2 - Math.floor(seed2)) * height;
      const radius = 0.4 + ((index * 17) % 9) * 0.22;
      ctx.fillStyle = `rgba(255,255,255,${(0.08 + ((index * 13) % 10) / 100) * intensity})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}


export function createDefaultCrop(): CropState {
  return {
    ratioId: "original",
    positionX: 0.5,
    positionY: 0.5,
    width: 1,
    height: 1,
  };
}

export function ratioValue(id: CropState["ratioId"]): number | null {
  if (id === "1:1") return 1;
  if (id === "4:3") return 4 / 3;
  if (id === "3:2") return 3 / 2;
  if (id === "5:4") return 5 / 4;
  if (id === "16:9") return 16 / 9;
  if (id === "9:16") return 9 / 16;
  return null;
}

export function resolveCrop(crop: CropState, imageWidth: number, imageHeight: number): CropState {
  const safeWidth = Math.max(1, imageWidth);
  const safeHeight = Math.max(1, imageHeight);
  const ratio = ratioValue(crop.ratioId);

  let width = clamp01(crop.width || 1);
  let height = clamp01(crop.height || 1);

  if (crop.ratioId === "original") {
    width = 1;
    height = 1;
  } else if (ratio) {
    const imageRatio = safeWidth / safeHeight;
    if (imageRatio > ratio) {
      width = ratio / imageRatio;
      height = 1;
    } else {
      width = 1;
      height = imageRatio / ratio;
    }
  }

  width = Math.max(0.1, Math.min(1, width));
  height = Math.max(0.1, Math.min(1, height));

  return {
    ...crop,
    width,
    height,
    positionX: clamp01(crop.positionX),
    positionY: clamp01(crop.positionY),
  };
}

export function getCropPixels(crop: CropState, imageWidth: number, imageHeight: number) {
  const resolved = resolveCrop(crop, imageWidth, imageHeight);
  const width = Math.max(1, Math.round(imageWidth * resolved.width));
  const height = Math.max(1, Math.round(imageHeight * resolved.height));
  const maxX = Math.max(0, imageWidth - width);
  const maxY = Math.max(0, imageHeight - height);
  const x = Math.round(maxX * resolved.positionX);
  const y = Math.round(maxY * resolved.positionY);
  return { x, y, width, height };
}

export function getNaturalOutputDimensions(
  imageWidth: number,
  imageHeight: number,
  crop: CropState,
  orientation: Orientation,
) {
  const rect = getCropPixels(crop, imageWidth, imageHeight);
  const swap = orientation.rotate === 90 || orientation.rotate === 270;
  return swap
    ? { width: rect.height, height: rect.width }
    : { width: rect.width, height: rect.height };
}

function getRenderDimensions(
  naturalWidth: number,
  naturalHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  maxDimension?: number,
) {
  let width = targetWidth && targetWidth > 0 ? Math.round(targetWidth) : naturalWidth;
  let height = targetHeight && targetHeight > 0 ? Math.round(targetHeight) : naturalHeight;

  if (targetWidth && !targetHeight) {
    height = Math.max(1, Math.round((targetWidth / naturalWidth) * naturalHeight));
  } else if (!targetWidth && targetHeight) {
    width = Math.max(1, Math.round((targetHeight / naturalHeight) * naturalWidth));
  }

  if (maxDimension && Math.max(width, height) > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  return { width, height };
}

function applyCanvasAdjustments(ctx: CanvasRenderingContext2D, width: number, height: number, filters: FilterState) {
  const defaults = createDefaultFilterState();
  const needsPixelWork =
    filters.exposure !== defaults.exposure ||
    filters.highlights !== defaults.highlights ||
    filters.shadows !== defaults.shadows ||
    filters.whites !== defaults.whites ||
    filters.blacks !== defaults.blacks ||
    filters.vibrance !== defaults.vibrance ||
    filters.temperature !== defaults.temperature ||
    filters.tint !== defaults.tint ||
    filters.fade !== defaults.fade ||
    filters.vignette !== defaults.vignette ||
    filters.grain !== defaults.grain;

  if (!needsPixelWork) return;

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch {
    return;
  }

  const data = imageData.data;
  const exposure = 2 ** filters.exposure;
  const shadowAmount = filters.shadows / 100;
  const highlightAmount = filters.highlights / 100;
  const whiteAmount = filters.whites / 100;
  const blackAmount = filters.blacks / 100;
  const vibranceAmount = filters.vibrance / 100;
  const temperatureAmount = filters.temperature / 100;
  const tintAmount = filters.tint / 100;
  const fadeAmount = filters.fade;
  const vignetteAmount = filters.vignette;
  const grainAmount = filters.grain;
  const cx = width / 2;
  const cy = height / 2;
  const maxDistance = Math.sqrt(cx * cx + cy * cy) || 1;

  for (let i = 0; i < data.length; i += 4) {
    const pixel = i / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);

    let r = data[i] * exposure;
    let g = data[i + 1] * exposure;
    let b = data[i + 2] * exposure;

    const luminance = clamp01((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255);

    if (shadowAmount !== 0) {
      const weight = (1 - luminance) ** 2;
      const delta = shadowAmount * weight * 72;
      r += delta;
      g += delta;
      b += delta;
    }

    if (highlightAmount !== 0) {
      const weight = luminance ** 2;
      const delta = highlightAmount * weight * 72;
      r += delta;
      g += delta;
      b += delta;
    }

    if (whiteAmount !== 0) {
      const weight = Math.max(0, (luminance - 0.58) / 0.42);
      const delta = whiteAmount * weight * 54;
      r += delta;
      g += delta;
      b += delta;
    }

    if (blackAmount !== 0) {
      const weight = Math.max(0, (0.42 - luminance) / 0.42);
      const delta = blackAmount * weight * 54;
      r += delta;
      g += delta;
      b += delta;
    }

    if (temperatureAmount !== 0) {
      r += temperatureAmount * 28;
      g += temperatureAmount * 6;
      b -= temperatureAmount * 28;
    }

    if (tintAmount !== 0) {
      r += tintAmount * 13;
      g -= tintAmount * 24;
      b += tintAmount * 13;
    }

    if (vibranceAmount !== 0) {
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max <= 0 ? 0 : (max - min) / max;
      const protection = 1 - saturation;
      const average = (r + g + b) / 3;
      const amount = vibranceAmount * protection * 0.75;
      r += (r - average) * amount;
      g += (g - average) * amount;
      b += (b - average) * amount;
    }

    if (fadeAmount > 0) {
      const fadeTarget = 164;
      const amount = fadeAmount * 0.55;
      r += (fadeTarget - r) * amount;
      g += (fadeTarget - g) * amount;
      b += (fadeTarget - b) * amount;
    }

    if (vignetteAmount > 0) {
      const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDistance;
      const edge = Math.max(0, (distance - 0.34) / 0.66);
      const factor = 1 - vignetteAmount * edge * edge * 0.78;
      r *= factor;
      g *= factor;
      b *= factor;
    }

    if (grainAmount > 0) {
      // Deterministic hash-based grain avoids flicker between preview renders.
      const hash = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233) * 43758.5453;
      const noise = (hash - Math.floor(hash) - 0.5) * grainAmount * 38;
      r += noise;
      g += noise;
      b += noise;
    }

    data[i] = clampByte(r);
    data[i + 1] = clampByte(g);
    data[i + 2] = clampByte(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

function buildTransformedMask(
  mask: BackgroundMask,
  cropPixels: { x: number; y: number; width: number; height: number },
  output: { width: number; height: number },
  orientation: Orientation,
  feather: number,
) {
  const source = document.createElement("canvas");
  source.width = mask.width;
  source.height = mask.height;
  const sourceCtx = source.getContext("2d");
  if (!sourceCtx) throw new Error("Canvas is unavailable in this browser.");
  const rgba = new Uint8ClampedArray(mask.width * mask.height * 4);
  for (let index = 0; index < mask.alpha.length; index += 1) {
    const offset = index * 4;
    rgba[offset] = 255;
    rgba[offset + 1] = 255;
    rgba[offset + 2] = 255;
    rgba[offset + 3] = mask.alpha[index];
  }
  sourceCtx.putImageData(new ImageData(rgba, mask.width, mask.height), 0, 0);

  const transformed = document.createElement("canvas");
  transformed.width = output.width;
  transformed.height = output.height;
  const ctx = transformed.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (feather > 0) ctx.filter = `blur(${Math.max(0, feather)}px)`;
  ctx.translate(output.width / 2, output.height / 2);
  ctx.rotate((orientation.rotate * Math.PI) / 180);
  ctx.scale(orientation.flipH ? -1 : 1, orientation.flipV ? -1 : 1);
  const swap = orientation.rotate === 90 || orientation.rotate === 270;
  const drawWidth = swap ? output.height : output.width;
  const drawHeight = swap ? output.width : output.height;
  ctx.drawImage(
    source,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight,
  );
  return transformed;
}

function applySmartEdits(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  smart: SmartEditState | undefined,
  backgroundMask: BackgroundMask | null | undefined,
  cropPixels: { x: number; y: number; width: number; height: number },
  sourceSize: { width: number; height: number },
  orientation: Orientation,
  jpegBackground: boolean | undefined,
) {
  if (!smart) return;

  if (smart.healStrokes.length) {
    try {
      const healed = applySpotHealToImageData(ctx.getImageData(0, 0, width, height), smart.healStrokes);
      ctx.putImageData(healed, 0, 0);
    } catch {
      // A browser denying readback should not block the rest of the editor.
    }
  }

  if (!smart.backgroundEnabled || !backgroundMask) return;
  const maskCrop = {
    x: (cropPixels.x / Math.max(1, sourceSize.width)) * backgroundMask.width,
    y: (cropPixels.y / Math.max(1, sourceSize.height)) * backgroundMask.height,
    width: (cropPixels.width / Math.max(1, sourceSize.width)) * backgroundMask.width,
    height: (cropPixels.height / Math.max(1, sourceSize.height)) * backgroundMask.height,
  };
  const maskCanvas = buildTransformedMask(backgroundMask, maskCrop, { width, height }, orientation, smart.maskFeather);
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(maskCanvas, 0, 0, width, height);
  ctx.restore();

  const fill = jpegBackground && smart.backgroundFill === "transparent" ? "#ffffff" :
    smart.backgroundFill === "white" ? "#ffffff" :
    smart.backgroundFill === "color" ? smart.backgroundColor : null;
  if (fill) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

export function renderPhotoToCanvas(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  options: {
    filters: FilterState;
    orientation: Orientation;
    crop: CropState;
    targetWidth?: number;
    targetHeight?: number;
    maxDimension?: number;
    jpegBackground?: boolean;
    advanced?: AdvancedEditState;
    lut?: LutDefinition | null;
    smart?: SmartEditState;
    backgroundMask?: BackgroundMask | null;
  },
): RenderResult {
  const { filters, orientation } = options;
  const effectiveFilters = options.advanced ? composeFilterLayers(filters, options.advanced.layers) : filters;
  const cropPixels = getCropPixels(options.crop, image.naturalWidth, image.naturalHeight);
  const natural = getNaturalOutputDimensions(image.naturalWidth, image.naturalHeight, options.crop, orientation);
  const output = getRenderDimensions(
    natural.width,
    natural.height,
    options.targetWidth,
    options.targetHeight,
    options.maxDimension,
  );

  canvas.width = output.width;
  canvas.height = output.height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  ctx.save();
  if (options.jpegBackground) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, output.width, output.height);
  } else {
    ctx.clearRect(0, 0, output.width, output.height);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.filter = buildFilterString(effectiveFilters);
  ctx.translate(output.width / 2, output.height / 2);
  ctx.rotate((orientation.rotate * Math.PI) / 180);
  ctx.scale(orientation.flipH ? -1 : 1, orientation.flipV ? -1 : 1);

  const swap = orientation.rotate === 90 || orientation.rotate === 270;
  const drawWidth = swap ? output.height : output.width;
  const drawHeight = swap ? output.width : output.height;

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight,
  );
  ctx.restore();

  // Pixel-based adjustments happen after CSS-compatible filters so preview and
  // export use the exact same local rendering path.
  applyCanvasAdjustments(ctx, output.width, output.height, effectiveFilters);
  applyAdvancedAdjustments(ctx, output.width, output.height, options.advanced, options.lut);
  applyOverlay(ctx, output.width, output.height, options.advanced);
  applySmartEdits(
    ctx,
    output.width,
    output.height,
    options.smart,
    options.backgroundMask,
    cropPixels,
    { width: image.naturalWidth, height: image.naturalHeight },
    orientation,
    options.jpegBackground,
  );
  return output;
}

export function approximateBlobSize(previewBlobSize: number, previewPixels: number, outputPixels: number) {
  if (previewBlobSize <= 0 || previewPixels <= 0 || outputPixels <= 0) return 0;
  const scale = Math.max(0.1, outputPixels / previewPixels);
  return Math.round(previewBlobSize * scale ** 0.9);
}
