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

export type ColorFormat = "hex" | "rgb" | "hsl";

export type ParsedColorResult =
  | {
      ok: true;
      input: string;
      detectedFormat: ColorFormat;
      hex: string;
      rgb: RgbColor;
      hsl: HslColor;
      cssRgb: string;
      cssHsl: string;
      bestTextColor: "#000000" | "#ffffff";
      contrastWithBlack: number;
      contrastWithWhite: number;
      shades: ColorShade[];
    }
  | {
      ok: false;
      input: string;
      error: string;
    };

export type ColorShade = {
  label: string;
  hex: string;
  cssRgb: string;
  cssHsl: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round = (value: number, digits = 0) =>
  Number(value.toFixed(digits));

const toHexPart = (value: number) =>
  clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");

export function rgbToHex({ r, g, b }: RgbColor) {
  return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`.toLowerCase();
}

export function hexToRgb(input: string): RgbColor | null {
  const value = input.trim().replace(/^#/, "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h: round(h),
    s: round(s * 100),
    l: round(l * 100),
  };
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

function parseRgb(input: string): RgbColor | null {
  const match = input
    .trim()
    .match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/i);

  if (!match) return null;

  const values = match.slice(1, 4).map(Number);
  if (values.some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
    return null;
  }

  return {
    r: Math.round(values[0]),
    g: Math.round(values[1]),
    b: Math.round(values[2]),
  };
}

function parseHsl(input: string): HslColor | null {
  const match = input
    .trim()
    .match(/^hsla?\(\s*(-?[\d.]+)(?:deg)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*[\d.]+)?\s*\)$/i);

  if (!match) return null;

  const h = Number(match[1]);
  const s = Number(match[2]);
  const l = Number(match[3]);

  if ([h, s, l].some(Number.isNaN) || s < 0 || s > 100 || l < 0 || l > 100) {
    return null;
  }

  return { h, s, l };
}

function relativeLuminance({ r, g, b }: RgbColor) {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: RgbColor, b: RgbColor) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return round((light + 0.05) / (dark + 0.05), 2);
}

export function formatRgb({ r, g, b }: RgbColor) {
  return `rgb(${r}, ${g}, ${b})`;
}

export function formatHsl({ h, s, l }: HslColor) {
  return `hsl(${round(h)}, ${round(s)}%, ${round(l)}%)`;
}

function buildShades(hsl: HslColor): ColorShade[] {
  const stops = [
    { label: "Light +30", delta: 30 },
    { label: "Light +20", delta: 20 },
    { label: "Light +10", delta: 10 },
    { label: "Base", delta: 0 },
    { label: "Dark -10", delta: -10 },
    { label: "Dark -20", delta: -20 },
    { label: "Dark -30", delta: -30 },
  ];

  return stops.map(({ label, delta }) => {
    const shadeHsl = { ...hsl, l: clamp(hsl.l + delta, 0, 100) };
    const shadeRgb = hslToRgb(shadeHsl);
    return {
      label,
      hex: rgbToHex(shadeRgb),
      cssRgb: formatRgb(shadeRgb),
      cssHsl: formatHsl(shadeHsl),
    };
  });
}

export function parseColorInput(input: string): ParsedColorResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      ok: false,
      input,
      error: "Enter a HEX, RGB, or HSL color to start converting.",
    };
  }

  let detectedFormat: ColorFormat | null = null;
  let rgb: RgbColor | null = null;

  const hex = hexToRgb(trimmed);
  if (hex) {
    detectedFormat = "hex";
    rgb = hex;
  }

  if (!rgb) {
    const parsedRgb = parseRgb(trimmed);
    if (parsedRgb) {
      detectedFormat = "rgb";
      rgb = parsedRgb;
    }
  }

  if (!rgb) {
    const parsedHsl = parseHsl(trimmed);
    if (parsedHsl) {
      detectedFormat = "hsl";
      rgb = hslToRgb(parsedHsl);
    }
  }

  if (!rgb || !detectedFormat) {
    return {
      ok: false,
      input,
      error: "Use #3b82f6, #fff, rgb(59, 130, 246), or hsl(217, 91%, 60%).",
    };
  }

  const hsl = rgbToHsl(rgb);
  const finalHex = rgbToHex(rgb);
  const contrastWithBlack = contrastRatio(rgb, { r: 0, g: 0, b: 0 });
  const contrastWithWhite = contrastRatio(rgb, { r: 255, g: 255, b: 255 });

  return {
    ok: true,
    input,
    detectedFormat,
    hex: finalHex,
    rgb,
    hsl,
    cssRgb: formatRgb(rgb),
    cssHsl: formatHsl(hsl),
    bestTextColor: contrastWithBlack >= contrastWithWhite ? "#000000" : "#ffffff",
    contrastWithBlack,
    contrastWithWhite,
    shades: buildShades(hsl),
  };
}

export const COLOR_EXAMPLES = [
  { label: "Darma blue", value: "#3b82f6" },
  { label: "Soft purple", value: "#8b5cf6" },
  { label: "Emerald", value: "rgb(16, 185, 129)" },
  { label: "Sunset", value: "hsl(24, 95%, 53%)" },
  { label: "Shorthand", value: "#f59" },
  { label: "Dark slate", value: "#0f172a" },
];
