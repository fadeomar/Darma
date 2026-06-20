// ─── Aspect ratio logic ────────────────────────────────────────────────────
// Solve a missing dimension from a ratio, and reduce a width×height pair to its
// simplest whole-number ratio. All pure and browser-local.

export type RatioPreset = {
  id: string;
  label: string;
  w: number;
  h: number;
  hint: string;
};

export const RATIO_PRESETS: RatioPreset[] = [
  { id: "16-9", label: "16:9", w: 16, h: 9, hint: "Widescreen video, YouTube" },
  { id: "9-16", label: "9:16", w: 9, h: 16, hint: "Reels, Stories, TikTok" },
  { id: "4-3", label: "4:3", w: 4, h: 3, hint: "Classic photo, slides" },
  { id: "3-2", label: "3:2", w: 3, h: 2, hint: "DSLR photos, prints" },
  { id: "1-1", label: "1:1", w: 1, h: 1, hint: "Square posts, avatars" },
  { id: "21-9", label: "21:9", w: 21, h: 9, hint: "Ultrawide, cinematic" },
  { id: "2-1", label: "2:1", w: 2, h: 1, hint: "Twitter / X cards" },
];

/** Greatest common divisor (Euclid), tolerant of order and zero. */
export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

/** Height implied by a ratio and a width. NaN on invalid input. */
export function heightFromWidth(ratioW: number, ratioH: number, width: number): number {
  if (!ratioW || !Number.isFinite(ratioW) || !Number.isFinite(ratioH) || !Number.isFinite(width)) return NaN;
  return (width * ratioH) / ratioW;
}

/** Width implied by a ratio and a height. NaN on invalid input. */
export function widthFromHeight(ratioW: number, ratioH: number, height: number): number {
  if (!ratioH || !Number.isFinite(ratioW) || !Number.isFinite(ratioH) || !Number.isFinite(height)) return NaN;
  return (height * ratioW) / ratioH;
}

export type SimplifiedRatio = {
  w: number;
  h: number;
  /** Decimal ratio (width / height), e.g. 1.778 for 16:9. */
  decimal: number;
  label: string;
};

/**
 * Reduce a width×height pair to its simplest whole-number ratio. Falls back to
 * a "x:1" decimal label when the values are not clean integers.
 */
export function simplifyRatio(width: number, height: number): SimplifiedRatio | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;

  const decimal = width / height;

  if (Number.isInteger(width) && Number.isInteger(height)) {
    const divisor = gcd(width, height);
    const w = width / divisor;
    const h = height / divisor;
    return { w, h, decimal, label: `${w}:${h}` };
  }

  return { w: decimal, h: 1, decimal, label: `${Math.round(decimal * 1000) / 1000}:1` };
}

/** Round a pixel dimension to a tidy value for display. */
export function roundDimension(value: number): number {
  if (!Number.isFinite(value)) return NaN;
  return Math.round(value * 100) / 100;
}
