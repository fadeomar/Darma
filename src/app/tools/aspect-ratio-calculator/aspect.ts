// ─── Aspect ratio logic ────────────────────────────────────────────────────
// Professional ratio utilities for designers, creators, and developers. All
// calculations are pure and browser-local.

export type RatioPreset = {
  id: string;
  label: string;
  w: number;
  h: number;
  hint: string;
  group: "video" | "social" | "photo" | "web" | "print";
  useCases: string[];
};

export const RATIO_PRESETS: RatioPreset[] = [
  { id: "16-9", label: "16:9", w: 16, h: 9, hint: "Widescreen video, YouTube, presentations", group: "video", useCases: ["YouTube", "Video thumbnail", "Slides"] },
  { id: "9-16", label: "9:16", w: 9, h: 16, hint: "Vertical video for Reels, Stories, Shorts, TikTok", group: "social", useCases: ["Reels", "Stories", "Shorts"] },
  { id: "1-1", label: "1:1", w: 1, h: 1, hint: "Square posts, avatars, product cards", group: "social", useCases: ["Instagram post", "Avatar", "Catalog"] },
  { id: "4-5", label: "4:5", w: 4, h: 5, hint: "Portrait feed posts with more vertical space", group: "social", useCases: ["Instagram portrait", "Facebook feed"] },
  { id: "5-4", label: "5:4", w: 5, h: 4, hint: "Landscape feed and compact poster layouts", group: "social", useCases: ["Social landscape", "Poster crop"] },
  { id: "4-3", label: "4:3", w: 4, h: 3, hint: "Classic photo, older displays, education slides", group: "photo", useCases: ["Classic photo", "Slides"] },
  { id: "3-2", label: "3:2", w: 3, h: 2, hint: "DSLR photos and many print crops", group: "photo", useCases: ["DSLR", "Print"] },
  { id: "2-3", label: "2:3", w: 2, h: 3, hint: "Portrait print, poster, Pinterest-style artwork", group: "print", useCases: ["Poster", "Pinterest", "Print"] },
  { id: "21-9", label: "21:9", w: 21, h: 9, hint: "Cinematic ultrawide banners and hero sections", group: "video", useCases: ["Cinema", "Hero banner"] },
  { id: "2-1", label: "2:1", w: 2, h: 1, hint: "Wide cards, open graph previews, panoramic banners", group: "web", useCases: ["Open Graph", "Wide card"] },
  { id: "3-1", label: "3:1", w: 3, h: 1, hint: "Website banners and thin hero strips", group: "web", useCases: ["Web banner", "Header"] },
  { id: "1-91-1", label: "1.91:1", w: 1.91, h: 1, hint: "Common link preview / ad card crop", group: "web", useCases: ["Link preview", "Ad card"] },
];

export type Dimension = {
  width: number;
  height: number;
};

export type SimplifiedRatio = {
  w: number;
  h: number;
  /** Decimal ratio (width / height), e.g. 1.778 for 16:9. */
  decimal: number;
  label: string;
  orientation: "landscape" | "portrait" | "square";
};

export type ResizeResult = Dimension & {
  scale: number;
  mode: "contain" | "cover";
};

export type CropResult = Dimension & {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
};

/** Greatest common divisor (Euclid), tolerant of order and zero. */
export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

function hasPositiveFiniteValues(...values: number[]): boolean {
  return values.every((value) => Number.isFinite(value) && value > 0);
}

/** Height implied by a ratio and a width. NaN on invalid input. */
export function heightFromWidth(ratioW: number, ratioH: number, width: number): number {
  if (!hasPositiveFiniteValues(ratioW, ratioH, width)) return NaN;
  return (width * ratioH) / ratioW;
}

/** Width implied by a ratio and a height. NaN on invalid input. */
export function widthFromHeight(ratioW: number, ratioH: number, height: number): number {
  if (!hasPositiveFiniteValues(ratioW, ratioH, height)) return NaN;
  return (height * ratioW) / ratioH;
}

/** Round a pixel dimension to a tidy value for display. */
export function roundDimension(value: number): number {
  if (!Number.isFinite(value)) return NaN;
  return Math.round(value * 100) / 100;
}

export function orientationFor(width: number, height: number): SimplifiedRatio["orientation"] {
  if (!hasPositiveFiniteValues(width, height)) return "landscape";
  if (Math.abs(width - height) < 0.0001) return "square";
  return width > height ? "landscape" : "portrait";
}

/**
 * Reduce a width×height pair to its simplest whole-number ratio. Falls back to
 * a "x:1" decimal label when the values are not clean integers.
 */
export function simplifyRatio(width: number, height: number): SimplifiedRatio | null {
  if (!hasPositiveFiniteValues(width, height)) return null;

  const decimal = width / height;
  const orientation = orientationFor(width, height);

  if (Number.isInteger(width) && Number.isInteger(height)) {
    const divisor = gcd(width, height);
    const w = width / divisor;
    const h = height / divisor;
    return { w, h, decimal, label: `${w}:${h}`, orientation };
  }

  return { w: decimal, h: 1, decimal, label: `${roundDimension(decimal)}:1`, orientation };
}

export function ratioDecimal(ratioW: number, ratioH: number): number {
  if (!hasPositiveFiniteValues(ratioW, ratioH)) return NaN;
  return ratioW / ratioH;
}

export function dimensionsFromRatioAndLongEdge(ratioW: number, ratioH: number, longEdge: number): Dimension | null {
  if (!hasPositiveFiniteValues(ratioW, ratioH, longEdge)) return null;
  if (ratioW >= ratioH) return { width: roundDimension(longEdge), height: roundDimension(heightFromWidth(ratioW, ratioH, longEdge)) };
  return { width: roundDimension(widthFromHeight(ratioW, ratioH, longEdge)), height: roundDimension(longEdge) };
}

export function fitWithinBounds(width: number, height: number, maxWidth: number, maxHeight: number, mode: "contain" | "cover" = "contain"): ResizeResult | null {
  if (!hasPositiveFiniteValues(width, height, maxWidth, maxHeight)) return null;
  const widthScale = maxWidth / width;
  const heightScale = maxHeight / height;
  const scale = mode === "contain" ? Math.min(widthScale, heightScale) : Math.max(widthScale, heightScale);
  return { width: roundDimension(width * scale), height: roundDimension(height * scale), scale, mode };
}

export function cropToRatio(width: number, height: number, ratioW: number, ratioH: number): CropResult | null {
  if (!hasPositiveFiniteValues(width, height, ratioW, ratioH)) return null;
  const target = ratioW / ratioH;
  const current = width / height;

  if (Math.abs(target - current) < 0.0001) {
    return { width, height, cropX: 0, cropY: 0, cropWidth: width, cropHeight: height };
  }

  if (current > target) {
    const cropWidth = height * target;
    return {
      width: roundDimension(cropWidth),
      height: roundDimension(height),
      cropX: roundDimension((width - cropWidth) / 2),
      cropY: 0,
      cropWidth: roundDimension(cropWidth),
      cropHeight: roundDimension(height),
    };
  }

  const cropHeight = width / target;
  return {
    width: roundDimension(width),
    height: roundDimension(cropHeight),
    cropX: 0,
    cropY: roundDimension((height - cropHeight) / 2),
    cropWidth: roundDimension(width),
    cropHeight: roundDimension(cropHeight),
  };
}

export function scaledDimensions(width: number, height: number, percentage: number): Dimension | null {
  if (!hasPositiveFiniteValues(width, height, percentage)) return null;
  const scale = percentage / 100;
  return { width: roundDimension(width * scale), height: roundDimension(height * scale) };
}

export function cssAspectRatio(ratioW: number, ratioH: number): string {
  if (!hasPositiveFiniteValues(ratioW, ratioH)) return "";
  return `aspect-ratio: ${roundDimension(ratioW)} / ${roundDimension(ratioH)};`;
}

export function paddingTopPercent(ratioW: number, ratioH: number): number {
  if (!hasPositiveFiniteValues(ratioW, ratioH)) return NaN;
  return roundDimension((ratioH / ratioW) * 100);
}

export function closestPreset(width: number, height: number): RatioPreset | null {
  if (!hasPositiveFiniteValues(width, height)) return null;
  const decimal = width / height;
  return RATIO_PRESETS.reduce<RatioPreset | null>((best, preset) => {
    if (!best) return preset;
    const bestDelta = Math.abs(best.w / best.h - decimal);
    const nextDelta = Math.abs(preset.w / preset.h - decimal);
    return nextDelta < bestDelta ? preset : best;
  }, null);
}

export function formatDimensionPair(width: number, height: number, unit = "px"): string {
  if (!hasPositiveFiniteValues(width, height)) return "";
  return `${roundDimension(width)} × ${roundDimension(height)} ${unit}`;
}
