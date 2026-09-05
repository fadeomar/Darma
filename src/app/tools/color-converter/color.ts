export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export type HslColor = {
  h: number;
  s: number;
  l: number;
};

export type HsvColor = {
  h: number;
  s: number;
  v: number;
};

export type HwbColor = {
  h: number;
  w: number;
  b: number;
};

export type CmykColor = {
  c: number;
  m: number;
  y: number;
  k: number;
};

export type LabColor = {
  l: number;
  a: number;
  b: number;
};

export type OklchColor = {
  l: number;
  c: number;
  h: number;
};

export type ColorFormat = "hex" | "rgb" | "hsl" | "css-name";

export type ColorShade = {
  label: string;
  hex: string;
  cssRgb: string;
  cssHsl: string;
  bestTextColor: "#000000" | "#ffffff";
  contrast: number;
  accessibility: "AAA" | "AA" | "Large" | "Fail";
};

export type ColorRelationship = {
  label: string;
  hex: string;
  cssHsl: string;
};

export type ColorExportBundle = {
  cssVariables: string;
  jsonToken: string;
  tailwindConfig: string;
  scssMap: string;
};

export type ParsedColorResult =
  | {
      ok: true;
      input: string;
      detectedFormat: ColorFormat;
      alpha: number;
      hasAlpha: boolean;
      hex: string;
      hexAlpha: string;
      rgb: RgbColor;
      hsl: HslColor;
      hsv: HsvColor;
      hwb: HwbColor;
      cmyk: CmykColor;
      lab: LabColor;
      oklch: OklchColor;
      cssRgb: string;
      cssModernRgb: string;
      cssHsl: string;
      cssModernHsl: string;
      cssHwb: string;
      bestTextColor: "#000000" | "#ffffff";
      contrastWithBlack: number;
      contrastWithWhite: number;
      contrastLevelBlack: ColorShade["accessibility"];
      contrastLevelWhite: ColorShade["accessibility"];
      shades: ColorShade[];
      relationships: ColorRelationship[];
      exports: ColorExportBundle;
    }
  | {
      ok: false;
      input: string;
      error: string;
    };

const CSS_COLOR_NAMES: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  transparent: "#00000000",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  cyan: "#00ffff",
  aqua: "#00ffff",
  magenta: "#ff00ff",
  fuchsia: "#ff00ff",
  gray: "#808080",
  grey: "#808080",
  silver: "#c0c0c0",
  maroon: "#800000",
  olive: "#808000",
  purple: "#800080",
  teal: "#008080",
  navy: "#000080",
  orange: "#ffa500",
  pink: "#ffc0cb",
  brown: "#a52a2a",
  gold: "#ffd700",
  tomato: "#ff6347",
  coral: "#ff7f50",
  indigo: "#4b0082",
  violet: "#ee82ee",
  lime: "#00ff00",
  crimson: "#dc143c",
  salmon: "#fa8072",
  turquoise: "#40e0d0",
  beige: "#f5f5dc",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  plum: "#dda0dd",
  tan: "#d2b48c",
  wheat: "#f5deb3",
  slateblue: "#6a5acd",
  seagreen: "#2e8b57",
  rebeccapurple: "#663399",
  dodgerblue: "#1e90ff",
  royalblue: "#4169e1",
  deepskyblue: "#00bfff",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 0) => Number(value.toFixed(digits));
const toHexPart = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
const toAlphaHexPart = (value: number) => toHexPart(clamp(value, 0, 1) * 255);

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function parseAlpha(value?: string) {
  if (!value) return 1;
  const trimmed = value.trim();
  if (trimmed.endsWith("%")) {
    const parsed = parseNumber(trimmed.slice(0, -1));
    return parsed === null ? null : clamp(parsed / 100, 0, 1);
  }
  const parsed = parseNumber(trimmed);
  return parsed === null ? null : clamp(parsed, 0, 1);
}

function splitFunctionArgs(body: string) {
  return body
    .trim()
    .replace(/\s*,\s*/g, " ")
    .replace(/\s*\/\s*/g, " / ")
    .split(/\s+/)
    .filter(Boolean);
}

function parseRgbChannel(value: string) {
  const trimmed = value.trim();
  if (trimmed.endsWith("%")) {
    const parsed = parseNumber(trimmed.slice(0, -1));
    return parsed === null ? null : clamp(Math.round((parsed / 100) * 255), 0, 255);
  }
  const parsed = parseNumber(trimmed);
  return parsed === null ? null : clamp(Math.round(parsed), 0, 255);
}

function parsePercentChannel(value: string) {
  const trimmed = value.trim();
  const parsed = parseNumber(trimmed.endsWith("%") ? trimmed.slice(0, -1) : trimmed);
  return parsed === null ? null : clamp(parsed, 0, 100);
}

function parseHue(value: string) {
  const parsed = parseNumber(value.replace(/deg$/i, "").replace(/turn$/i, ""));
  if (parsed === null) return null;
  if (/turn$/i.test(value)) return ((parsed * 360) % 360 + 360) % 360;
  return ((parsed % 360) + 360) % 360;
}

export function rgbToHex({ r, g, b }: RgbColor) {
  return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`.toLowerCase();
}

export function rgbToHexAlpha(rgb: RgbColor, alpha = 1) {
  const base = rgbToHex(rgb);
  return alpha >= 1 ? base : `${base}${toAlphaHexPart(alpha)}`.toLowerCase();
}

export function hexToRgb(input: string): { rgb: RgbColor; alpha: number } | null {
  const value = input.trim().replace(/^#/, "");
  const normalized =
    value.length === 3 || value.length === 4
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;

  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(normalized)) return null;

  return {
    rgb: {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    },
    alpha: normalized.length === 8 ? round(Number.parseInt(normalized.slice(6, 8), 16) / 255, 3) : 1,
  };
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;

  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h: round(h), s: round(s * 100), l: round(l * 100) };
}

export function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const normalizedHue = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const m = ln - c / 2;
  let rn = 0;
  let gn = 0;
  let bn = 0;

  if (normalizedHue < 60) [rn, gn, bn] = [c, x, 0];
  else if (normalizedHue < 120) [rn, gn, bn] = [x, c, 0];
  else if (normalizedHue < 180) [rn, gn, bn] = [0, c, x];
  else if (normalizedHue < 240) [rn, gn, bn] = [0, x, c];
  else if (normalizedHue < 300) [rn, gn, bn] = [x, 0, c];
  else [rn, gn, bn] = [c, 0, x];

  return {
    r: Math.round((rn + m) * 255),
    g: Math.round((gn + m) * 255),
    b: Math.round((bn + m) * 255),
  };
}

export function rgbToHsv({ r, g, b }: RgbColor): HsvColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const hsl = rgbToHsl({ r, g, b });
  const s = max === 0 ? 0 : delta / max;
  return { h: hsl.h, s: round(s * 100), v: round(max * 100) };
}

export function rgbToHwb(rgb: RgbColor): HwbColor {
  const { r, g, b } = rgb;
  const h = rgbToHsl(rgb).h;
  const whiteness = Math.min(r, g, b) / 255;
  const blackness = 1 - Math.max(r, g, b) / 255;
  return { h, w: round(whiteness * 100), b: round(blackness * 100) };
}

export function rgbToCmyk({ r, g, b }: RgbColor): CmykColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: round(((1 - rn - k) / (1 - k)) * 100),
    m: round(((1 - gn - k) / (1 - k)) * 100),
    y: round(((1 - bn - k) / (1 - k)) * 100),
    k: round(k * 100),
  };
}

function srgbToLinear(value: number) {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function rgbToLab({ r, g, b }: RgbColor): LabColor {
  const rn = srgbToLinear(r);
  const gn = srgbToLinear(g);
  const bn = srgbToLinear(b);

  const x = rn * 0.4124564 + gn * 0.3575761 + bn * 0.1804375;
  const y = rn * 0.2126729 + gn * 0.7151522 + bn * 0.072175;
  const z = rn * 0.0193339 + gn * 0.119192 + bn * 0.9503041;

  const xn = 0.95047;
  const yn = 1;
  const zn = 1.08883;
  const f = (value: number) => (value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116);
  const fx = f(x / xn);
  const fy = f(y / yn);
  const fz = f(z / zn);

  return { l: round(116 * fy - 16), a: round(500 * (fx - fy)), b: round(200 * (fy - fz)) };
}

export function rgbToOklch({ r, g, b }: RgbColor): OklchColor {
  const rn = srgbToLinear(r);
  const gn = srgbToLinear(g);
  const bn = srgbToLinear(b);

  const l = Math.cbrt(0.4122214708 * rn + 0.5363325363 * gn + 0.0514459929 * bn);
  const m = Math.cbrt(0.2119034982 * rn + 0.6806995451 * gn + 0.1073969566 * bn);
  const s = Math.cbrt(0.0883024619 * rn + 0.2817188376 * gn + 0.6299787005 * bn);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.sqrt(okA * okA + okB * okB);
  const h = ((Math.atan2(okB, okA) * 180) / Math.PI + 360) % 360;

  return { l: round(okL * 100, 1), c: round(c, 4), h: round(h, 1) };
}

function parseRgb(input: string): { rgb: RgbColor; alpha: number } | null {
  const match = input.trim().match(/^rgba?\((.*)\)$/i);
  if (!match) return null;
  const parts = splitFunctionArgs(match[1]);
  const slashIndex = parts.indexOf("/");
  const channels = slashIndex >= 0 ? parts.slice(0, slashIndex) : parts.slice(0, 3);
  const alphaValue = slashIndex >= 0 ? parts[slashIndex + 1] : parts[3];
  if (channels.length < 3) return null;

  const parsedChannels = channels.slice(0, 3).map(parseRgbChannel);
  const alpha = parseAlpha(alphaValue);
  if (parsedChannels.some((value) => value === null) || alpha === null) return null;

  return {
    rgb: { r: parsedChannels[0] ?? 0, g: parsedChannels[1] ?? 0, b: parsedChannels[2] ?? 0 },
    alpha,
  };
}

function parseHsl(input: string): { rgb: RgbColor; hsl: HslColor; alpha: number } | null {
  const match = input.trim().match(/^hsla?\((.*)\)$/i);
  if (!match) return null;
  const parts = splitFunctionArgs(match[1]);
  const slashIndex = parts.indexOf("/");
  const channels = slashIndex >= 0 ? parts.slice(0, slashIndex) : parts.slice(0, 3);
  const alphaValue = slashIndex >= 0 ? parts[slashIndex + 1] : parts[3];
  if (channels.length < 3) return null;

  const h = parseHue(channels[0]);
  const s = parsePercentChannel(channels[1]);
  const l = parsePercentChannel(channels[2]);
  const alpha = parseAlpha(alphaValue);
  if (h === null || s === null || l === null || alpha === null) return null;

  const hsl = { h, s, l };
  return { rgb: hslToRgb(hsl), hsl, alpha };
}

export function relativeLuminance({ r, g, b }: RgbColor) {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: RgbColor, b: RgbColor) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return round((light + 0.05) / (dark + 0.05), 2);
}

function contrastLevel(ratio: number): ColorShade["accessibility"] {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "Large";
  return "Fail";
}

function bestTextFor(rgb: RgbColor): { color: "#000000" | "#ffffff"; contrast: number } {
  const black = contrastRatio(rgb, { r: 0, g: 0, b: 0 });
  const white = contrastRatio(rgb, { r: 255, g: 255, b: 255 });
  return black >= white ? { color: "#000000", contrast: black } : { color: "#ffffff", contrast: white };
}

export function formatRgb({ r, g, b }: RgbColor, alpha = 1) {
  return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${round(alpha, 2)})`;
}

export function formatModernRgb({ r, g, b }: RgbColor, alpha = 1) {
  return alpha >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${round(alpha, 2)})`;
}

export function formatHsl({ h, s, l }: HslColor, alpha = 1) {
  return alpha >= 1
    ? `hsl(${round(h)}, ${round(s)}%, ${round(l)}%)`
    : `hsla(${round(h)}, ${round(s)}%, ${round(l)}%, ${round(alpha, 2)})`;
}

export function formatModernHsl({ h, s, l }: HslColor, alpha = 1) {
  return alpha >= 1
    ? `hsl(${round(h)} ${round(s)}% ${round(l)}%)`
    : `hsl(${round(h)} ${round(s)}% ${round(l)}% / ${round(alpha, 2)})`;
}

export function formatHwb({ h, w, b }: HwbColor, alpha = 1) {
  return alpha >= 1
    ? `hwb(${round(h)} ${round(w)}% ${round(b)}%)`
    : `hwb(${round(h)} ${round(w)}% ${round(b)}% / ${round(alpha, 2)})`;
}

export function formatCmyk({ c, m, y, k }: CmykColor) {
  return `${round(c)}%, ${round(m)}%, ${round(y)}%, ${round(k)}%`;
}

export function formatLab({ l, a, b }: LabColor) {
  return `${round(l)}, ${round(a)}, ${round(b)}`;
}

export function formatOklch({ l, c, h }: OklchColor) {
  return `${round(l, 1)}% ${round(c, 4)} ${round(h, 1)}`;
}

function buildShades(hsl: HslColor): ColorShade[] {
  const stops = [
    { label: "50", lightness: 97 },
    { label: "100", lightness: 92 },
    { label: "200", lightness: 84 },
    { label: "300", lightness: 74 },
    { label: "400", lightness: 64 },
    { label: "500", lightness: clamp(hsl.l, 30, 58) },
    { label: "600", lightness: 42 },
    { label: "700", lightness: 34 },
    { label: "800", lightness: 26 },
    { label: "900", lightness: 18 },
    { label: "950", lightness: 11 },
  ];

  return stops.map(({ label, lightness }) => {
    const shadeHsl = { ...hsl, s: clamp(hsl.s, 12, 100), l: lightness };
    const shadeRgb = hslToRgb(shadeHsl);
    const text = bestTextFor(shadeRgb);
    return {
      label,
      hex: rgbToHex(shadeRgb),
      cssRgb: formatRgb(shadeRgb),
      cssHsl: formatHsl(shadeHsl),
      bestTextColor: text.color,
      contrast: text.contrast,
      accessibility: contrastLevel(text.contrast),
    };
  });
}

function buildRelationships(hsl: HslColor): ColorRelationship[] {
  const items = [
    { label: "Complementary", h: hsl.h + 180, s: hsl.s, l: hsl.l },
    { label: "Analogous -30", h: hsl.h - 30, s: hsl.s, l: hsl.l },
    { label: "Analogous +30", h: hsl.h + 30, s: hsl.s, l: hsl.l },
    { label: "Triadic A", h: hsl.h + 120, s: hsl.s, l: hsl.l },
    { label: "Triadic B", h: hsl.h + 240, s: hsl.s, l: hsl.l },
    { label: "Muted", h: hsl.h, s: clamp(hsl.s * 0.45, 0, 100), l: hsl.l },
  ];

  return items.map(({ label, h, s, l }) => {
    const normalizedHsl = { h: ((h % 360) + 360) % 360, s, l };
    const rgb = hslToRgb(normalizedHsl);
    return { label, hex: rgbToHex(rgb), cssHsl: formatHsl(normalizedHsl) };
  });
}

function buildExports(hex: string, rgb: RgbColor, hsl: HslColor, alpha: number, shades: ColorShade[]) {
  const cssRgbChannels = `${rgb.r} ${rgb.g} ${rgb.b}`;
  const shadeVariables = shades.map((shade) => `  --color-brand-${shade.label}: ${shade.hex};`).join("\n");
  const cssVariables = `:root {\n  --color-brand: ${hex};\n  --color-brand-rgb: ${cssRgbChannels};\n  --color-brand-hsl: ${round(hsl.h)} ${round(hsl.s)}% ${round(hsl.l)}%;\n${shadeVariables}\n}`;

  const token = {
    color: {
      brand: {
        value: hex,
        alpha,
        rgb,
        hsl,
        shades: Object.fromEntries(shades.map((shade) => [shade.label, shade.hex])),
      },
    },
  };

  const tailwindConfig = `theme: {\n  extend: {\n    colors: {\n      brand: {\n${shades
    .map((shade) => `        ${shade.label}: "${shade.hex}",`)
    .join("\n")}\n        DEFAULT: "${hex}",\n      },\n    },\n  },\n}`;

  const scssMap = `$brand: (\n${shades.map((shade) => `  ${shade.label}: ${shade.hex},`).join("\n")}\n  base: ${hex}\n);`;

  return {
    cssVariables,
    jsonToken: JSON.stringify(token, null, 2),
    tailwindConfig,
    scssMap,
  };
}

function namedColor(input: string) {
  const normalized = input.trim().toLowerCase().replace(/\s+/g, "");
  return CSS_COLOR_NAMES[normalized] ?? null;
}

export function parseColorInput(input: string): ParsedColorResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      ok: false,
      input,
      error: "Enter a HEX, RGB, HSL, RGBA, HSLA, or CSS color name to start converting.",
    };
  }

  let detectedFormat: ColorFormat | null = null;
  let rgb: RgbColor | null = null;
  let hslFromInput: HslColor | null = null;
  let alpha = 1;

  const nameHex = namedColor(trimmed);
  if (nameHex) {
    const parsed = hexToRgb(nameHex);
    if (parsed) {
      detectedFormat = "css-name";
      rgb = parsed.rgb;
      alpha = parsed.alpha;
    }
  }

  if (!rgb) {
    const hex = hexToRgb(trimmed);
    if (hex) {
      detectedFormat = "hex";
      rgb = hex.rgb;
      alpha = hex.alpha;
    }
  }

  if (!rgb) {
    const parsedRgb = parseRgb(trimmed);
    if (parsedRgb) {
      detectedFormat = "rgb";
      rgb = parsedRgb.rgb;
      alpha = parsedRgb.alpha;
    }
  }

  if (!rgb) {
    const parsedHsl = parseHsl(trimmed);
    if (parsedHsl) {
      detectedFormat = "hsl";
      rgb = parsedHsl.rgb;
      hslFromInput = parsedHsl.hsl;
      alpha = parsedHsl.alpha;
    }
  }

  if (!rgb || !detectedFormat) {
    return {
      ok: false,
      input,
      error: "Use #3b82f6, #fff, #3b82f680, rgb(59 130 246 / .8), hsl(217 91% 60%), or a CSS color name.",
    };
  }

  const hsl = hslFromInput ?? rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);
  const hwb = rgbToHwb(rgb);
  const cmyk = rgbToCmyk(rgb);
  const lab = rgbToLab(rgb);
  const oklch = rgbToOklch(rgb);
  const finalHex = rgbToHex(rgb);
  const hexAlpha = rgbToHexAlpha(rgb, alpha);
  const contrastWithBlack = contrastRatio(rgb, { r: 0, g: 0, b: 0 });
  const contrastWithWhite = contrastRatio(rgb, { r: 255, g: 255, b: 255 });
  const bestTextColor = contrastWithBlack >= contrastWithWhite ? "#000000" : "#ffffff";
  const shades = buildShades(hsl);

  return {
    ok: true,
    input,
    detectedFormat,
    alpha,
    hasAlpha: alpha < 1,
    hex: finalHex,
    hexAlpha,
    rgb,
    hsl,
    hsv,
    hwb,
    cmyk,
    lab,
    oklch,
    cssRgb: formatRgb(rgb),
    cssModernRgb: formatModernRgb(rgb, alpha),
    cssHsl: formatHsl(hsl),
    cssModernHsl: formatModernHsl(hsl, alpha),
    cssHwb: formatHwb(hwb, alpha),
    bestTextColor,
    contrastWithBlack,
    contrastWithWhite,
    contrastLevelBlack: contrastLevel(contrastWithBlack),
    contrastLevelWhite: contrastLevel(contrastWithWhite),
    shades,
    relationships: buildRelationships(hsl),
    exports: buildExports(finalHex, rgb, hsl, alpha, shades),
  };
}

export const COLOR_EXAMPLES = [
  { label: "Darma blue", value: "#3b82f6" },
  { label: "Burgundy", value: "#800020" },
  { label: "Alpha HEX", value: "#3b82f680" },
  { label: "Modern RGB", value: "rgb(128 0 32 / .8)" },
  { label: "Modern HSL", value: "hsl(217 91% 60%)" },
  { label: "CSS name", value: "rebeccapurple" },
  { label: "Emerald", value: "rgb(16, 185, 129)" },
  { label: "Sunset", value: "hsl(24, 95%, 53%)" },
  { label: "Slate UI", value: "#334155" },
  { label: "Success green", value: "#16a34a" },
  { label: "Warning amber", value: "#d97706" },
  { label: "Danger red", value: "#dc2626" },
  { label: "Brand violet", value: "#7c3aed" },
  { label: "Soft cyan", value: "#06b6d4" },
  { label: "Warm coral", value: "#f97360" },
  { label: "Muted olive", value: "#6b7d37" },
  { label: "RGB alpha", value: "rgb(14 165 233 / 65%)" },
  { label: "HSL alpha", value: "hsl(262 83% 58% / .72)" },
  { label: "Named tomato", value: "tomato" },
  { label: "Transparent blue", value: "#2563eb33" },
];
