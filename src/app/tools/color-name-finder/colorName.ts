export type RgbColor = { r: number; g: number; b: number };
export type HslColor = { h: number; s: number; l: number };
type ColorSource = "CSS" | "Human" | "XKCD" | "Design";
type ColorFormat = "hex" | "rgb" | "hsl" | "name";

type LabColor = { l: number; a: number; b: number };

export type ParsedColor = {
  ok: true;
  input: string;
  detectedFormat: ColorFormat;
  hex: string;
  rgb: RgbColor;
  hsl: HslColor;
  cssRgb: string;
  cssHsl: string;
  cmyk: string;
  lab: LabColor;
  oklch: string;
  bestTextColor: "#000000" | "#ffffff";
  contrastBlack: number;
  contrastWhite: number;
  alpha: number;
  hasAlpha: boolean;
  alphaNotice?: string;
  matchedInputName?: string;
} | { ok: false; input: string; error: string };

export type NamedColor = { name: string; hex: string; source: ColorSource; family?: string };
export type ColorMatch = NamedColor & { distance: number; confidence: number };
export type SourceMatch = { source: ColorSource; match: ColorMatch | null };

const SOURCE_ORDER: ColorSource[] = ["Human", "CSS", "XKCD", "Design"];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round = (v: number, d = 0) => Number(v.toFixed(d));
const hexPart = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const CSS_COLORS: NamedColor[] = [
  { name: "Alice Blue", hex: "#f0f8ff", source: "CSS", family: "Blue" },
  { name: "Antique White", hex: "#faebd7", source: "CSS", family: "Orange" },
  { name: "Aqua", hex: "#00ffff", source: "CSS", family: "Cyan" },
  { name: "Aquamarine", hex: "#7fffd4", source: "CSS", family: "Green" },
  { name: "Azure", hex: "#f0ffff", source: "CSS", family: "Cyan" },
  { name: "Beige", hex: "#f5f5dc", source: "CSS", family: "Yellow" },
  { name: "Bisque", hex: "#ffe4c4", source: "CSS", family: "Orange" },
  { name: "Black", hex: "#000000", source: "CSS", family: "Neutral" },
  { name: "Blanched Almond", hex: "#ffebcd", source: "CSS", family: "Orange" },
  { name: "Blue", hex: "#0000ff", source: "CSS", family: "Blue" },
  { name: "Blue Violet", hex: "#8a2be2", source: "CSS", family: "Purple" },
  { name: "Brown", hex: "#a52a2a", source: "CSS", family: "Red" },
  { name: "Burly Wood", hex: "#deb887", source: "CSS", family: "Orange" },
  { name: "Cadet Blue", hex: "#5f9ea0", source: "CSS", family: "Cyan" },
  { name: "Chartreuse", hex: "#7fff00", source: "CSS", family: "Green" },
  { name: "Chocolate", hex: "#d2691e", source: "CSS", family: "Orange" },
  { name: "Coral", hex: "#ff7f50", source: "CSS", family: "Red" },
  { name: "Cornflower Blue", hex: "#6495ed", source: "CSS", family: "Blue" },
  { name: "Cornsilk", hex: "#fff8dc", source: "CSS", family: "Yellow" },
  { name: "Crimson", hex: "#dc143c", source: "CSS", family: "Red" },
  { name: "Cyan", hex: "#00ffff", source: "CSS", family: "Cyan" },
  { name: "Dark Blue", hex: "#00008b", source: "CSS", family: "Blue" },
  { name: "Dark Cyan", hex: "#008b8b", source: "CSS", family: "Cyan" },
  { name: "Dark Goldenrod", hex: "#b8860b", source: "CSS", family: "Orange" },
  { name: "Dark Gray", hex: "#a9a9a9", source: "CSS", family: "Neutral" },
  { name: "Dark Green", hex: "#006400", source: "CSS", family: "Green" },
  { name: "Dark Grey", hex: "#a9a9a9", source: "CSS", family: "Neutral" },
  { name: "Dark Khaki", hex: "#bdb76b", source: "CSS", family: "Yellow" },
  { name: "Dark Magenta", hex: "#8b008b", source: "CSS", family: "Pink" },
  { name: "Dark Olive Green", hex: "#556b2f", source: "CSS", family: "Green" },
  { name: "Dark Orange", hex: "#ff8c00", source: "CSS", family: "Orange" },
  { name: "Dark Orchid", hex: "#9932cc", source: "CSS", family: "Purple" },
  { name: "Dark Red", hex: "#8b0000", source: "CSS", family: "Red" },
  { name: "Dark Salmon", hex: "#e9967a", source: "CSS", family: "Red" },
  { name: "Dark Sea Green", hex: "#8fbc8f", source: "CSS", family: "Green" },
  { name: "Dark Slate Blue", hex: "#483d8b", source: "CSS", family: "Blue" },
  { name: "Dark Slate Gray", hex: "#2f4f4f", source: "CSS", family: "Cyan" },
  { name: "Dark Slate Grey", hex: "#2f4f4f", source: "CSS", family: "Cyan" },
  { name: "Dark Turquoise", hex: "#00ced1", source: "CSS", family: "Cyan" },
  { name: "Dark Violet", hex: "#9400d3", source: "CSS", family: "Purple" },
  { name: "Deep Pink", hex: "#ff1493", source: "CSS", family: "Pink" },
  { name: "Deep Sky Blue", hex: "#00bfff", source: "CSS", family: "Blue" },
  { name: "Dim Gray", hex: "#696969", source: "CSS", family: "Neutral" },
  { name: "Dim Grey", hex: "#696969", source: "CSS", family: "Neutral" },
  { name: "Dodger Blue", hex: "#1e90ff", source: "CSS", family: "Blue" },
  { name: "Firebrick", hex: "#b22222", source: "CSS", family: "Red" },
  { name: "Floral White", hex: "#fffaf0", source: "CSS", family: "Orange" },
  { name: "Forest Green", hex: "#228b22", source: "CSS", family: "Green" },
  { name: "Fuchsia", hex: "#ff00ff", source: "CSS", family: "Pink" },
  { name: "Gainsboro", hex: "#dcdcdc", source: "CSS", family: "Neutral" },
  { name: "Ghost White", hex: "#f8f8ff", source: "CSS", family: "Blue" },
  { name: "Gold", hex: "#ffd700", source: "CSS", family: "Yellow" },
  { name: "Goldenrod", hex: "#daa520", source: "CSS", family: "Orange" },
  { name: "Gray", hex: "#808080", source: "CSS", family: "Neutral" },
  { name: "Green", hex: "#008000", source: "CSS", family: "Green" },
  { name: "Green Yellow", hex: "#adff2f", source: "CSS", family: "Green" },
  { name: "Grey", hex: "#808080", source: "CSS", family: "Neutral" },
  { name: "Honeydew", hex: "#f0fff0", source: "CSS", family: "Green" },
  { name: "Hot Pink", hex: "#ff69b4", source: "CSS", family: "Pink" },
  { name: "Indian Red", hex: "#cd5c5c", source: "CSS", family: "Red" },
  { name: "Indigo", hex: "#4b0082", source: "CSS", family: "Purple" },
  { name: "Ivory", hex: "#fffff0", source: "CSS", family: "Yellow" },
  { name: "Khaki", hex: "#f0e68c", source: "CSS", family: "Yellow" },
  { name: "Lavender", hex: "#e6e6fa", source: "CSS", family: "Blue" },
  { name: "Lavender Blush", hex: "#fff0f5", source: "CSS", family: "Pink" },
  { name: "Lawn Green", hex: "#7cfc00", source: "CSS", family: "Green" },
  { name: "Lemon Chiffon", hex: "#fffacd", source: "CSS", family: "Yellow" },
  { name: "Light Blue", hex: "#add8e6", source: "CSS", family: "Cyan" },
  { name: "Light Coral", hex: "#f08080", source: "CSS", family: "Red" },
  { name: "Light Cyan", hex: "#e0ffff", source: "CSS", family: "Cyan" },
  { name: "Light Goldenrod Yellow", hex: "#fafad2", source: "CSS", family: "Yellow" },
  { name: "Light Gray", hex: "#d3d3d3", source: "CSS", family: "Neutral" },
  { name: "Light Green", hex: "#90ee90", source: "CSS", family: "Green" },
  { name: "Light Grey", hex: "#d3d3d3", source: "CSS", family: "Neutral" },
  { name: "Light Pink", hex: "#ffb6c1", source: "CSS", family: "Red" },
  { name: "Light Salmon", hex: "#ffa07a", source: "CSS", family: "Red" },
  { name: "Light Sea Green", hex: "#20b2aa", source: "CSS", family: "Cyan" },
  { name: "Light Sky Blue", hex: "#87cefa", source: "CSS", family: "Blue" },
  { name: "Light Slate Gray", hex: "#778899", source: "CSS", family: "Blue" },
  { name: "Light Slate Grey", hex: "#778899", source: "CSS", family: "Blue" },
  { name: "Light Steel Blue", hex: "#b0c4de", source: "CSS", family: "Blue" },
  { name: "Light Yellow", hex: "#ffffe0", source: "CSS", family: "Yellow" },
  { name: "Lime", hex: "#00ff00", source: "CSS", family: "Green" },
  { name: "Lime Green", hex: "#32cd32", source: "CSS", family: "Green" },
  { name: "Linen", hex: "#faf0e6", source: "CSS", family: "Orange" },
  { name: "Magenta", hex: "#ff00ff", source: "CSS", family: "Pink" },
  { name: "Maroon", hex: "#800000", source: "CSS", family: "Red" },
  { name: "Medium Aquamarine", hex: "#66cdaa", source: "CSS", family: "Green" },
  { name: "Medium Blue", hex: "#0000cd", source: "CSS", family: "Blue" },
  { name: "Medium Orchid", hex: "#ba55d3", source: "CSS", family: "Purple" },
  { name: "Medium Purple", hex: "#9370db", source: "CSS", family: "Purple" },
  { name: "Medium Sea Green", hex: "#3cb371", source: "CSS", family: "Green" },
  { name: "Medium Slate Blue", hex: "#7b68ee", source: "CSS", family: "Blue" },
  { name: "Medium Spring Green", hex: "#00fa9a", source: "CSS", family: "Green" },
  { name: "Medium Turquoise", hex: "#48d1cc", source: "CSS", family: "Cyan" },
  { name: "Medium Violet Red", hex: "#c71585", source: "CSS", family: "Pink" },
  { name: "Midnight Blue", hex: "#191970", source: "CSS", family: "Blue" },
  { name: "Mint Cream", hex: "#f5fffa", source: "CSS", family: "Green" },
  { name: "Misty Rose", hex: "#ffe4e1", source: "CSS", family: "Red" },
  { name: "Moccasin", hex: "#ffe4b5", source: "CSS", family: "Orange" },
  { name: "Navajo White", hex: "#ffdead", source: "CSS", family: "Orange" },
  { name: "Navy", hex: "#000080", source: "CSS", family: "Blue" },
  { name: "Old Lace", hex: "#fdf5e6", source: "CSS", family: "Orange" },
  { name: "Olive", hex: "#808000", source: "CSS", family: "Yellow" },
  { name: "Olive Drab", hex: "#6b8e23", source: "CSS", family: "Green" },
  { name: "Orange", hex: "#ffa500", source: "CSS", family: "Orange" },
  { name: "Orange Red", hex: "#ff4500", source: "CSS", family: "Red" },
  { name: "Orchid", hex: "#da70d6", source: "CSS", family: "Pink" },
  { name: "Pale Goldenrod", hex: "#eee8aa", source: "CSS", family: "Yellow" },
  { name: "Pale Green", hex: "#98fb98", source: "CSS", family: "Green" },
  { name: "Pale Turquoise", hex: "#afeeee", source: "CSS", family: "Cyan" },
  { name: "Pale Violet Red", hex: "#db7093", source: "CSS", family: "Pink" },
  { name: "Papaya Whip", hex: "#ffefd5", source: "CSS", family: "Orange" },
  { name: "Peach Puff", hex: "#ffdab9", source: "CSS", family: "Orange" },
  { name: "Peru", hex: "#cd853f", source: "CSS", family: "Orange" },
  { name: "Pink", hex: "#ffc0cb", source: "CSS", family: "Red" },
  { name: "Plum", hex: "#dda0dd", source: "CSS", family: "Pink" },
  { name: "Powder Blue", hex: "#b0e0e6", source: "CSS", family: "Cyan" },
  { name: "Purple", hex: "#800080", source: "CSS", family: "Pink" },
  { name: "Rebecca Purple", hex: "#663399", source: "CSS", family: "Purple" },
  { name: "Red", hex: "#ff0000", source: "CSS", family: "Red" },
  { name: "Rosy Brown", hex: "#bc8f8f", source: "CSS", family: "Red" },
  { name: "Royal Blue", hex: "#4169e1", source: "CSS", family: "Blue" },
  { name: "Saddle Brown", hex: "#8b4513", source: "CSS", family: "Orange" },
  { name: "Salmon", hex: "#fa8072", source: "CSS", family: "Red" },
  { name: "Sandy Brown", hex: "#f4a460", source: "CSS", family: "Orange" },
  { name: "Sea Green", hex: "#2e8b57", source: "CSS", family: "Green" },
  { name: "Seashell", hex: "#fff5ee", source: "CSS", family: "Orange" },
  { name: "Sienna", hex: "#a0522d", source: "CSS", family: "Orange" },
  { name: "Silver", hex: "#c0c0c0", source: "CSS", family: "Neutral" },
  { name: "Sky Blue", hex: "#87ceeb", source: "CSS", family: "Blue" },
  { name: "Slate Blue", hex: "#6a5acd", source: "CSS", family: "Blue" },
  { name: "Slate Gray", hex: "#708090", source: "CSS", family: "Blue" },
  { name: "Slate Grey", hex: "#708090", source: "CSS", family: "Blue" },
  { name: "Snow", hex: "#fffafa", source: "CSS", family: "Red" },
  { name: "Spring Green", hex: "#00ff7f", source: "CSS", family: "Green" },
  { name: "Steel Blue", hex: "#4682b4", source: "CSS", family: "Blue" },
  { name: "Tan", hex: "#d2b48c", source: "CSS", family: "Orange" },
  { name: "Teal", hex: "#008080", source: "CSS", family: "Cyan" },
  { name: "Thistle", hex: "#d8bfd8", source: "CSS", family: "Pink" },
  { name: "Tomato", hex: "#ff6347", source: "CSS", family: "Red" },
  { name: "Turquoise", hex: "#40e0d0", source: "CSS", family: "Cyan" },
  { name: "Violet", hex: "#ee82ee", source: "CSS", family: "Pink" },
  { name: "Wheat", hex: "#f5deb3", source: "CSS", family: "Orange" },
  { name: "White", hex: "#ffffff", source: "CSS", family: "Neutral" },
  { name: "Whitesmoke", hex: "#f5f5f5", source: "CSS", family: "Neutral" },
  { name: "Yellow", hex: "#ffff00", source: "CSS", family: "Yellow" },
  { name: "Yellow Green", hex: "#9acd32", source: "CSS", family: "Green" },
];

const HUMAN_COLORS: NamedColor[] = [
  { name: "Burgundy", hex: "#800020", source: "Human", family: "Red" },
  { name: "Wine Red", hex: "#722f37", source: "Human", family: "Red" },
  { name: "Cherry Red", hex: "#990f02", source: "Human", family: "Red" },
  { name: "Ruby", hex: "#9b111e", source: "Human", family: "Red" },
  { name: "Scarlet", hex: "#ff2400", source: "Human", family: "Red" },
  { name: "Carmine", hex: "#960018", source: "Human", family: "Red" },
  { name: "Brick Red", hex: "#b22222", source: "Human", family: "Red" },
  { name: "Blood Red", hex: "#880808", source: "Human", family: "Red" },
  { name: "Terracotta", hex: "#e2725b", source: "Human", family: "Orange" },
  { name: "Rust", hex: "#b7410e", source: "Human", family: "Orange" },
  { name: "Burnt Orange", hex: "#cc5500", source: "Human", family: "Orange" },
  { name: "Peach", hex: "#ffe5b4", source: "Human", family: "Orange" },
  { name: "Apricot", hex: "#fbceb1", source: "Human", family: "Orange" },
  { name: "Mustard", hex: "#ffdb58", source: "Human", family: "Yellow" },
  { name: "Lemon", hex: "#fff44f", source: "Human", family: "Yellow" },
  { name: "Butter", hex: "#fff1a8", source: "Human", family: "Yellow" },
  { name: "Sage", hex: "#9caf88", source: "Human", family: "Green" },
  { name: "Moss Green", hex: "#8a9a5b", source: "Human", family: "Green" },
  { name: "Olive Green", hex: "#708238", source: "Human", family: "Green" },
  { name: "Pine Green", hex: "#01796f", source: "Human", family: "Green" },
  { name: "Hunter Green", hex: "#355e3b", source: "Human", family: "Green" },
  { name: "Mint", hex: "#98ff98", source: "Human", family: "Green" },
  { name: "Seafoam", hex: "#93e9be", source: "Human", family: "Cyan" },
  { name: "Azure", hex: "#007fff", source: "Human", family: "Blue" },
  { name: "Cobalt", hex: "#0047ab", source: "Human", family: "Blue" },
  { name: "Sapphire", hex: "#0f52ba", source: "Human", family: "Blue" },
  { name: "Denim", hex: "#1560bd", source: "Human", family: "Blue" },
  { name: "Baby Blue", hex: "#89cff0", source: "Human", family: "Blue" },
  { name: "Midnight Navy", hex: "#020035", source: "Human", family: "Blue" },
  { name: "Amethyst", hex: "#9966cc", source: "Human", family: "Purple" },
  { name: "Lilac", hex: "#c8a2c8", source: "Human", family: "Purple" },
  { name: "Mauve", hex: "#e0b0ff", source: "Human", family: "Purple" },
  { name: "Eggplant", hex: "#614051", source: "Human", family: "Purple" },
  { name: "Rose", hex: "#e3242b", source: "Human", family: "Red" },
  { name: "Blush", hex: "#de5d83", source: "Human", family: "Pink" },
  { name: "Dusty Rose", hex: "#c08081", source: "Human", family: "Pink" },
  { name: "Charcoal", hex: "#36454f", source: "Human", family: "Neutral" },
  { name: "Graphite", hex: "#383838", source: "Human", family: "Neutral" },
  { name: "Taupe", hex: "#483c32", source: "Human", family: "Brown" },
  { name: "Sand", hex: "#c2b280", source: "Human", family: "Neutral" },
  { name: "Cream", hex: "#fffdd0", source: "Human", family: "Neutral" },
  { name: "Ecru", hex: "#c2b280", source: "Human", family: "Neutral" },
  { name: "Coffee", hex: "#6f4e37", source: "Human", family: "Brown" },
  { name: "Espresso", hex: "#4b3621", source: "Human", family: "Brown" },
];

const XKCD_COLORS: NamedColor[] = [
  { name: "XKCD Wine", hex: "#80013f", source: "XKCD", family: "Red" },
  { name: "XKCD Burgundy", hex: "#610023", source: "XKCD", family: "Red" },
  { name: "XKCD Dark Red", hex: "#840000", source: "XKCD", family: "Red" },
  { name: "XKCD Dried Blood", hex: "#4b0101", source: "XKCD", family: "Red" },
  { name: "XKCD Brick Red", hex: "#8f1402", source: "XKCD", family: "Red" },
  { name: "XKCD Rust Red", hex: "#aa2704", source: "XKCD", family: "Orange" },
  { name: "XKCD Burnt Orange", hex: "#c04e01", source: "XKCD", family: "Orange" },
  { name: "XKCD Mustard", hex: "#ceb301", source: "XKCD", family: "Yellow" },
  { name: "XKCD Olive", hex: "#6e750e", source: "XKCD", family: "Green" },
  { name: "XKCD Sage", hex: "#87ae73", source: "XKCD", family: "Green" },
  { name: "XKCD Grass Green", hex: "#3f9b0b", source: "XKCD", family: "Green" },
  { name: "XKCD Teal", hex: "#029386", source: "XKCD", family: "Cyan" },
  { name: "XKCD Dark Teal", hex: "#014d4e", source: "XKCD", family: "Cyan" },
  { name: "XKCD Sky Blue", hex: "#75bbfd", source: "XKCD", family: "Blue" },
  { name: "XKCD Light Blue", hex: "#95d0fc", source: "XKCD", family: "Blue" },
  { name: "XKCD Dark Blue", hex: "#00035b", source: "XKCD", family: "Blue" },
  { name: "XKCD Royal Blue", hex: "#0504aa", source: "XKCD", family: "Blue" },
  { name: "XKCD Purple", hex: "#7e1e9c", source: "XKCD", family: "Purple" },
  { name: "XKCD Mauve", hex: "#ae7181", source: "XKCD", family: "Purple" },
  { name: "XKCD Dusty Pink", hex: "#d58a94", source: "XKCD", family: "Pink" },
  { name: "XKCD Charcoal", hex: "#343837", source: "XKCD", family: "Neutral" },
  { name: "XKCD Warm Grey", hex: "#978a84", source: "XKCD", family: "Neutral" },
];

const DESIGN_COLORS: NamedColor[] = [
  { name: "Tailwind Slate", hex: "#64748b", source: "Design", family: "Neutral" },
  { name: "Tailwind Zinc", hex: "#71717a", source: "Design", family: "Neutral" },
  { name: "Tailwind Stone", hex: "#78716c", source: "Design", family: "Neutral" },
  { name: "Tailwind Red", hex: "#ef4444", source: "Design", family: "Red" },
  { name: "Tailwind Rose", hex: "#f43f5e", source: "Design", family: "Red" },
  { name: "Tailwind Orange", hex: "#f97316", source: "Design", family: "Orange" },
  { name: "Tailwind Amber", hex: "#f59e0b", source: "Design", family: "Yellow" },
  { name: "Tailwind Yellow", hex: "#eab308", source: "Design", family: "Yellow" },
  { name: "Tailwind Lime", hex: "#84cc16", source: "Design", family: "Green" },
  { name: "Tailwind Green", hex: "#22c55e", source: "Design", family: "Green" },
  { name: "Tailwind Emerald", hex: "#10b981", source: "Design", family: "Green" },
  { name: "Tailwind Teal", hex: "#14b8a6", source: "Design", family: "Cyan" },
  { name: "Tailwind Cyan", hex: "#06b6d4", source: "Design", family: "Cyan" },
  { name: "Tailwind Sky", hex: "#0ea5e9", source: "Design", family: "Blue" },
  { name: "Tailwind Blue", hex: "#3b82f6", source: "Design", family: "Blue" },
  { name: "Tailwind Indigo", hex: "#6366f1", source: "Design", family: "Blue" },
  { name: "Tailwind Violet", hex: "#8b5cf6", source: "Design", family: "Purple" },
  { name: "Tailwind Purple", hex: "#a855f7", source: "Design", family: "Purple" },
  { name: "Tailwind Fuchsia", hex: "#d946ef", source: "Design", family: "Pink" },
  { name: "Tailwind Pink", hex: "#ec4899", source: "Design", family: "Pink" },
  { name: "Deep Navy", hex: "#0f172a", source: "Design", family: "Blue" },
  { name: "Soft Mint", hex: "#d1fae5", source: "Design", family: "Green" },
  { name: "Soft Rose", hex: "#ffe4e6", source: "Design", family: "Pink" },
  { name: "Warm Sand", hex: "#f5e6c8", source: "Design", family: "Neutral" },
];

export const NAMED_COLORS: NamedColor[] = [...HUMAN_COLORS, ...CSS_COLORS, ...XKCD_COLORS, ...DESIGN_COLORS];

export function rgbToHex(rgb: RgbColor) { return `#${hexPart(rgb.r)}${hexPart(rgb.g)}${hexPart(rgb.b)}`; }

type ParsedRgbInput = { rgb: RgbColor; alpha: number };
type ParsedHslInput = { hsl: HslColor; alpha: number };

function parseAlpha(value: string | undefined): number {
  if (!value) return 1;
  const raw = value.trim();
  if (!raw) return 1;
  const alpha = raw.endsWith("%") ? Number(raw.slice(0, -1)) / 100 : Number(raw);
  return Number.isFinite(alpha) ? clamp(alpha, 0, 1) : 1;
}

function parseRgbChannel(value: string): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const parsed = raw.endsWith("%") ? Number(raw.slice(0, -1)) * 2.55 : Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 255) return null;
  return Math.round(parsed);
}

function splitCssFunctionArgs(body: string) {
  const [channelsPart, slashAlpha] = body.split("/").map((part) => part.trim());
  const commaMode = channelsPart.includes(",");
  const parts = commaMode ? channelsPart.split(",").map((part) => part.trim()) : channelsPart.split(/\s+/).filter(Boolean);
  const alpha = slashAlpha ?? (commaMode && parts.length > 3 ? parts[3] : undefined);
  return { parts: parts.slice(0, 3), alpha };
}

export function hexToRgb(input: string): RgbColor | null {
  return parseHex(input)?.rgb ?? null;
}

function parseHex(input: string): ParsedRgbInput | null {
  const value = input.trim().replace(/^#/, "");
  if (![3, 4, 6, 8].includes(value.length) || !/^[0-9a-fA-F]+$/.test(value)) return null;
  const full = value.length === 3 || value.length === 4 ? value.split("").map((c) => c + c).join("") : value;
  const rgb = { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) };
  const alpha = full.length === 8 ? round(parseInt(full.slice(6, 8), 16) / 255, 3) : 1;
  return { rgb, alpha };
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), delta = max - min;
  let h = 0; const l = (max + min) / 2;
  if (delta) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h: round(h), s: round(s * 100), l: round(l * 100) };
}

export function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const hue = ((h % 360) + 360) % 360, sn = clamp(s, 0, 100) / 100, ln = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn, x = c * (1 - Math.abs(((hue / 60) % 2) - 1)), m = ln - c / 2;
  let rn = 0, gn = 0, bn = 0;
  if (hue < 60) [rn, gn, bn] = [c, x, 0]; else if (hue < 120) [rn, gn, bn] = [x, c, 0]; else if (hue < 180) [rn, gn, bn] = [0, c, x]; else if (hue < 240) [rn, gn, bn] = [0, x, c]; else if (hue < 300) [rn, gn, bn] = [x, 0, c]; else [rn, gn, bn] = [c, 0, x];
  return { r: Math.round((rn + m) * 255), g: Math.round((gn + m) * 255), b: Math.round((bn + m) * 255) };
}

function parseRgb(input: string): ParsedRgbInput | null {
  const match = input.trim().match(/^rgba?\((.*)\)$/i);
  if (!match) return null;
  const { parts, alpha } = splitCssFunctionArgs(match[1]);
  if (parts.length !== 3) return null;
  const channels = parts.map(parseRgbChannel);
  if (channels.some((v) => v === null)) return null;
  const [r, g, b] = channels as number[];
  return { rgb: { r, g, b }, alpha: parseAlpha(alpha) };
}

function parseHsl(input: string): ParsedHslInput | null {
  const match = input.trim().match(/^hsla?\((.*)\)$/i);
  if (!match) return null;
  const { parts, alpha } = splitCssFunctionArgs(match[1]);
  if (parts.length !== 3) return null;
  const h = Number(parts[0].replace(/deg$/i, ""));
  const s = Number(parts[1].replace(/%$/, ""));
  const l = Number(parts[2].replace(/%$/, ""));
  if ([h, s, l].some((v) => !Number.isFinite(v)) || s < 0 || s > 100 || l < 0 || l > 100) return null;
  return { hsl: { h, s, l }, alpha: parseAlpha(alpha) };
}

function parseNamedColor(input: string): ParsedRgbInput & { matchedInputName: string } | null {
  const normalized = normalizeName(input.trim());
  if (!normalized) return null;
  const named = NAMED_COLORS.find((color) => normalizeName(color.name) === normalized);
  if (!named) return null;
  const rgb = hexToRgb(named.hex);
  return rgb ? { rgb, alpha: 1, matchedInputName: named.name } : null;
}

export function parseColor(input: string): ParsedColor {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, input, error: "Enter HEX, RGB, RGBA, HSL, HSLA, or a known color name." };
  let detectedFormat: ColorFormat = "hex";
  let alpha = 1;
  let matchedInputName: string | undefined;
  let rgb = parseHex(trimmed)?.rgb ?? null;
  const parsedHex = parseHex(trimmed);
  if (parsedHex) { rgb = parsedHex.rgb; alpha = parsedHex.alpha; }
  if (!rgb) { const next = parseRgb(trimmed); if (next) { rgb = next.rgb; alpha = next.alpha; detectedFormat = "rgb"; } }
  if (!rgb) { const next = parseHsl(trimmed); if (next) { rgb = hslToRgb(next.hsl); alpha = next.alpha; detectedFormat = "hsl"; } }
  if (!rgb) { const next = parseNamedColor(trimmed); if (next) { rgb = next.rgb; alpha = next.alpha; detectedFormat = "name"; matchedInputName = next.matchedInputName; } }
  if (!rgb) return { ok: false, input, error: "Try #800020, #800020cc, rgb(128 0 32 / .8), rgba(128, 0, 32, .8), hsl(345 100% 25%), or Burgundy." };
  const hsl = rgbToHsl(rgb), hex = rgbToHex(rgb).toLowerCase();
  const contrastBlack = contrastRatio(rgb, { r: 0, g: 0, b: 0 });
  const contrastWhite = contrastRatio(rgb, { r: 255, g: 255, b: 255 });
  const hasAlpha = alpha < 1;
  return {
    ok: true,
    input,
    detectedFormat,
    hex,
    rgb,
    hsl,
    cssRgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    cssHsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    cmyk: rgbToCmyk(rgb),
    lab: rgbToLab(rgb),
    oklch: rgbToOklch(rgb),
    bestTextColor: getBestTextColor(rgb),
    contrastBlack,
    contrastWhite,
    alpha,
    hasAlpha,
    alphaNotice: hasAlpha ? "Alpha detected. Matching, contrast, and palettes use the solid RGB color." : undefined,
    matchedInputName,
  };
}

function rgbToCmyk({ r, g, b }: RgbColor) {
  const rn = r / 255, gn = g / 255, bn = b / 255, k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return "cmyk(0%, 0%, 0%, 100%)";
  const c = (1 - rn - k) / (1 - k), m = (1 - gn - k) / (1 - k), y = (1 - bn - k) / (1 - k);
  return `cmyk(${round(c * 100)}%, ${round(m * 100)}%, ${round(y * 100)}%, ${round(k * 100)}%)`;
}

function relativeLuminance({ r, g, b }: RgbColor) {
  const channel = (v: number) => { const n = v / 255; return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4); };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: RgbColor, b: RgbColor) {
  const l1 = relativeLuminance(a), l2 = relativeLuminance(b);
  return round((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05), 2);
}


export function getBestTextColor(rgb: RgbColor): "#000000" | "#ffffff" {
  return contrastRatio(rgb, { r: 0, g: 0, b: 0 }) >= contrastRatio(rgb, { r: 255, g: 255, b: 255 }) ? "#000000" : "#ffffff";
}

export function blendRgbOver(foreground: RgbColor, alpha: number, background: RgbColor): RgbColor {
  const a = clamp(alpha, 0, 1);
  return {
    r: Math.round(foreground.r * a + background.r * (1 - a)),
    g: Math.round(foreground.g * a + background.g * (1 - a)),
    b: Math.round(foreground.b * a + background.b * (1 - a)),
  };
}

function rgbToLab({ r, g, b }: RgbColor): LabColor {
  const pivotRgb = (v: number) => { const n = v / 255; return n > 0.04045 ? Math.pow((n + 0.055) / 1.055, 2.4) : n / 12.92; };
  const rn = pivotRgb(r), gn = pivotRgb(g), bn = pivotRgb(b);
  let x = (rn * 0.4124 + gn * 0.3576 + bn * 0.1805) / 0.95047;
  let y = (rn * 0.2126 + gn * 0.7152 + bn * 0.0722) / 1.00000;
  let z = (rn * 0.0193 + gn * 0.1192 + bn * 0.9505) / 1.08883;
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  x = f(x); y = f(y); z = f(z);
  return { l: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
}


function rgbToOklch({ r, g, b }: RgbColor) {
  const linear = (value: number) => {
    const n = value / 255;
    return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  const rn = linear(r), gn = linear(g), bn = linear(b);
  const l = 0.4122214708 * rn + 0.5363325363 * gn + 0.0514459929 * bn;
  const m = 0.2119034982 * rn + 0.6806995451 * gn + 0.1073969566 * bn;
  const ss = 0.0883024619 * rn + 0.2817188376 * gn + 0.6299787005 * bn;
  const lRoot = Math.cbrt(l), mRoot = Math.cbrt(m), sRoot = Math.cbrt(ss);
  const okL = 0.2104542553 * lRoot + 0.7936177850 * mRoot - 0.0040720468 * sRoot;
  const okA = 1.9779984951 * lRoot - 2.4285922050 * mRoot + 0.4505937099 * sRoot;
  const okB = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.8086757660 * sRoot;
  const chroma = Math.sqrt(okA * okA + okB * okB);
  const hue = chroma < 0.0001 ? 0 : ((Math.atan2(okB, okA) * 180 / Math.PI) + 360) % 360;
  return `oklch(${round(okL * 100, 2)}% ${round(chroma, 4)} ${round(hue, 2)})`;
}

function deltaE(a: LabColor, b: LabColor) { return Math.sqrt((a.l - b.l) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2); }

function scoreColor(rgb: RgbColor, color: NamedColor): ColorMatch {
  const distance = deltaE(rgbToLab(rgb), rgbToLab(hexToRgb(color.hex)!));
  return { ...color, distance, confidence: clamp(round(100 - distance * 1.6, 1), 0, 100) };
}

export function findClosestColors(rgb: RgbColor, limit = 10): ColorMatch[] {
  return NAMED_COLORS.map((color) => scoreColor(rgb, color)).sort((a, b) => a.distance - b.distance).slice(0, limit);
}

export function findSourceMatches(rgb: RgbColor): SourceMatch[] {
  return SOURCE_ORDER.map((source) => {
    const sourceColors = NAMED_COLORS.filter((color) => color.source === source);
    const match = sourceColors.map((color) => scoreColor(rgb, color)).sort((a, b) => a.distance - b.distance)[0] ?? null;
    return { source, match };
  });
}

export function getColorProfile(hsl: HslColor) {
  const temperature = hsl.h < 75 || hsl.h >= 300 ? "Warm" : hsl.h >= 75 && hsl.h < 170 ? "Natural" : "Cool";
  const depth = hsl.l < 20 ? "Very dark" : hsl.l < 38 ? "Deep" : hsl.l < 64 ? "Balanced" : hsl.l < 82 ? "Light" : "Very light";
  const vibrance = hsl.s < 18 ? "Muted" : hsl.s < 45 ? "Soft" : hsl.s < 72 ? "Rich" : "Vibrant";
  const family = hsl.s < 8 ? "Neutral" : hsl.h < 18 || hsl.h >= 345 ? "Red" : hsl.h < 45 ? "Orange" : hsl.h < 70 ? "Yellow" : hsl.h < 165 ? "Green" : hsl.h < 195 ? "Cyan" : hsl.h < 255 ? "Blue" : hsl.h < 292 ? "Purple" : hsl.h < 345 ? "Pink" : "Red";
  const mood = [depth, vibrance, temperature].filter(Boolean).join(" · ");
  return { temperature, depth, vibrance, family, mood };
}

export function buildHarmony(hex: string) {
  const rgb = hexToRgb(hex)!;
  const hsl = rgbToHsl(rgb);
  const make = (name: string, hue: number) => {
    const next = { ...hsl, h: ((hue % 360) + 360) % 360 };
    return { name, hex: rgbToHex(hslToRgb(next)) };
  };
  return [make("Complementary", hsl.h + 180), make("Analogous -", hsl.h - 30), make("Analogous +", hsl.h + 30), make("Triadic A", hsl.h + 120), make("Triadic B", hsl.h + 240)];
}

export function buildScale(hsl: HslColor) {
  const stops = [96, 90, 82, 72, 62, 52, 42, 32, 24, 16, 10];
  return stops.map((l, i) => ({ label: i === 10 ? "950" : String((i + 1) * 100 - 50), hex: rgbToHex(hslToRgb({ ...hsl, l })) }));
}

export const COLOR_NAME_EXAMPLES = ["#800020", "#800020cc", "rgb(128 0 32 / .8)", "Burgundy", "#3b82f6", "hsl(24 95% 53%)"];

export type WcagStatus = "AAA" | "AA" | "Large text only" | "Fail";
export type ShadeAccessibility = { label: string; hex: string; recommendedText: "#000000" | "#ffffff"; contrast: number; status: WcagStatus };
export type FrameworkMatch = { system: string; name: string; hex: string; confidence: number; distance: number };
export type UsageRecommendations = { summary: string; personality: string[]; best: string[]; care: string[]; avoid: string[] };

export function getWcagStatus(ratio: number): WcagStatus {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "Large text only";
  return "Fail";
}

export function buildShadeAccessibility(scale: Array<{ label: string; hex: string }>): ShadeAccessibility[] {
  return scale.map((item) => {
    const rgb = hexToRgb(item.hex)!;
    const black = contrastRatio(rgb, { r: 0, g: 0, b: 0 });
    const white = contrastRatio(rgb, { r: 255, g: 255, b: 255 });
    const recommendedText = black >= white ? "#000000" : "#ffffff";
    const contrast = Math.max(black, white);
    return { label: item.label, hex: item.hex, recommendedText, contrast, status: getWcagStatus(contrast) };
  });
}

const TAILWIND_PALETTES: Record<string, Record<string, string>> = {
  slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617" },
  gray: { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db", 400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151", 800: "#1f2937", 900: "#111827", 950: "#030712" },
  zinc: { 50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa", 500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b", 950: "#09090b" },
  neutral: { 50: "#fafafa", 100: "#f5f5f5", 200: "#e5e5e5", 300: "#d4d4d4", 400: "#a3a3a3", 500: "#737373", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717", 950: "#0a0a0a" },
  stone: { 50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e", 500: "#78716c", 600: "#57534e", 700: "#44403c", 800: "#292524", 900: "#1c1917", 950: "#0c0a09" },
  red: { 50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d", 950: "#450a0a" },
  orange: { 50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12", 950: "#431407" },
  amber: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f", 950: "#451a03" },
  yellow: { 50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15", 500: "#eab308", 600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 900: "#713f12", 950: "#422006" },
  lime: { 50: "#f7fee7", 100: "#ecfccb", 200: "#d9f99d", 300: "#bef264", 400: "#a3e635", 500: "#84cc16", 600: "#65a30d", 700: "#4d7c0f", 800: "#3f6212", 900: "#365314", 950: "#1a2e05" },
  green: { 50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d", 950: "#052e16" },
  emerald: { 50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b", 950: "#022c22" },
  teal: { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a", 950: "#042f2e" },
  cyan: { 50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63", 950: "#083344" },
  sky: { 50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e", 950: "#082f49" },
  blue: { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554" },
  indigo: { 50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81", 950: "#1e1b4b" },
  violet: { 50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065" },
  purple: { 50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87", 950: "#3b0764" },
  fuchsia: { 50: "#fdf4ff", 100: "#fae8ff", 200: "#f5d0fe", 300: "#f0abfc", 400: "#e879f9", 500: "#d946ef", 600: "#c026d3", 700: "#a21caf", 800: "#86198f", 900: "#701a75", 950: "#4a044e" },
  pink: { 50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8", 300: "#f9a8d4", 400: "#f472b6", 500: "#ec4899", 600: "#db2777", 700: "#be185d", 800: "#9d174d", 900: "#831843", 950: "#500724" },
  rose: { 50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337", 950: "#4c0519" },
};

const BOOTSTRAP_COLORS: Array<{ name: string; hex: string }> = [
  { name: "primary", hex: "#0d6efd" }, { name: "primary-text-emphasis", hex: "#052c65" },
  { name: "secondary", hex: "#6c757d" }, { name: "secondary-text-emphasis", hex: "#2b2f32" },
  { name: "success", hex: "#198754" }, { name: "success-text-emphasis", hex: "#0a3622" },
  { name: "danger", hex: "#dc3545" }, { name: "danger-text-emphasis", hex: "#58151c" },
  { name: "warning", hex: "#ffc107" }, { name: "warning-text-emphasis", hex: "#664d03" },
  { name: "info", hex: "#0dcaf0" }, { name: "info-text-emphasis", hex: "#055160" },
  { name: "light", hex: "#f8f9fa" }, { name: "dark", hex: "#212529" },
];

const MATERIAL_PALETTES: Record<string, Record<string, string>> = {
  Red: { 500: "#f44336", 700: "#d32f2f", 900: "#b71c1c" },
  Pink: { 500: "#e91e63", 700: "#c2185b", 900: "#880e4f" },
  Purple: { 500: "#9c27b0", 700: "#7b1fa2", 900: "#4a148c" },
  "Deep Purple": { 500: "#673ab7", 700: "#512da8", 900: "#311b92" },
  Indigo: { 500: "#3f51b5", 700: "#303f9f", 900: "#1a237e" },
  Blue: { 500: "#2196f3", 700: "#1976d2", 900: "#0d47a1" },
  Cyan: { 500: "#00bcd4", 700: "#0097a7", 900: "#006064" },
  Teal: { 500: "#009688", 700: "#00796b", 900: "#004d40" },
  Green: { 500: "#4caf50", 700: "#388e3c", 900: "#1b5e20" },
  Amber: { 500: "#ffc107", 700: "#ffa000", 900: "#ff6f00" },
  Orange: { 500: "#ff9800", 700: "#f57c00", 900: "#e65100" },
  "Deep Orange": { 500: "#ff5722", 700: "#e64a19", 900: "#bf360c" },
  Brown: { 500: "#795548", 700: "#5d4037", 900: "#3e2723" },
  Grey: { 500: "#9e9e9e", 700: "#616161", 900: "#212121" },
  "Blue Grey": { 500: "#607d8b", 700: "#455a64", 900: "#263238" },
};

const FRAMEWORK_COLORS: Array<{ system: string; name: string; hex: string }> = [
  ...Object.entries(TAILWIND_PALETTES).flatMap(([family, shades]) => Object.entries(shades).map(([shade, hex]) => ({ system: "Tailwind", name: `${family}-${shade}`, hex }))),
  ...BOOTSTRAP_COLORS.map((item) => ({ system: "Bootstrap", name: item.name, hex: item.hex })),
  ...Object.entries(MATERIAL_PALETTES).flatMap(([family, shades]) => Object.entries(shades).map(([shade, hex]) => ({ system: "Material", name: `${family} ${shade}`, hex }))),
];

const FRAMEWORK_SYSTEM_ORDER = ["Tailwind", "Bootstrap", "Material"];

export function findFrameworkMatches(rgb: RgbColor, limit = 6): FrameworkMatch[] {
  const targetLab = rgbToLab(rgb);
  const matches = FRAMEWORK_COLORS.map((item) => {
    const distance = round(deltaE(targetLab, rgbToLab(hexToRgb(item.hex)!)), 1);
    return { ...item, distance, confidence: clamp(round(100 - distance * 1.15, 1), 0, 100) };
  });

  return FRAMEWORK_SYSTEM_ORDER.flatMap((system) => matches
    .filter((item) => item.system === system)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 2))
    .slice(0, limit);
}

export function getUsageRecommendations(hsl: HslColor): UsageRecommendations {
  const profile = getColorProfile(hsl);
  const isDark = hsl.l < 36;
  const isLight = hsl.l > 78;
  const isVeryVibrant = hsl.s > 72;
  const personality = [profile.temperature, profile.depth, profile.vibrance, profile.family].filter(Boolean);
  const best = [
    `${profile.family} identity accents`,
    isDark ? "Premium hero blocks with light text" : isLight ? "Soft backgrounds and surfaces" : "Buttons, badges, and active states",
    profile.vibrance === "Muted" || profile.vibrance === "Soft" ? "Editorial layouts and calm UI areas" : "Campaign visuals and attention points",
  ];
  const care = [
    isDark ? "Small dark text on this color" : "White text on this color unless contrast passes",
    isVeryVibrant ? "Very large backgrounds; it may feel intense" : "Low-contrast neighboring colors",
    "Using it as the only signal without labels or icons",
  ];
  const avoid = [
    profile.family === "Red" || profile.family === "Pink" ? "Success states where green is expected" : "Critical states unless the meaning is clear",
    isLight ? "Tiny white text" : "Tiny black text",
  ];
  const summary = `Use it as a ${profile.depth.toLowerCase()} ${profile.family.toLowerCase()} color with a ${profile.vibrance.toLowerCase()} feel. Pair it with the recommended text color and validate contrast for production UI.`;
  return { summary, personality, best, care, avoid };
}



export type CompositeColor = {
  surface: string;
  backgroundHex: string;
  hex: string;
  recommendedText: "#000000" | "#ffffff";
  contrast: number;
};

export function buildAlphaComposites(rgb: RgbColor, alpha: number): CompositeColor[] {
  const backgrounds = [
    { surface: "White", rgb: { r: 255, g: 255, b: 255 }, hex: "#ffffff" },
    { surface: "Darma surface", rgb: { r: 248, g: 250, b: 252 }, hex: "#f8fafc" },
    { surface: "Black", rgb: { r: 0, g: 0, b: 0 }, hex: "#000000" },
  ];
  return backgrounds.map((background) => {
    const composite = blendRgbOver(rgb, alpha, background.rgb);
    const black = contrastRatio(composite, { r: 0, g: 0, b: 0 });
    const white = contrastRatio(composite, { r: 255, g: 255, b: 255 });
    const recommendedText = black >= white ? "#000000" : "#ffffff";
    return { surface: background.surface, backgroundHex: background.hex, hex: rgbToHex(composite), recommendedText, contrast: Math.max(black, white) };
  });
}

export type VisionSimulation = {
  label: string;
  hex: string;
  recommendedText: "#000000" | "#ffffff";
  note: string;
};

function applyMatrix(rgb: RgbColor, matrix: number[]): RgbColor {
  return {
    r: clamp(Math.round(rgb.r * matrix[0] + rgb.g * matrix[1] + rgb.b * matrix[2]), 0, 255),
    g: clamp(Math.round(rgb.r * matrix[3] + rgb.g * matrix[4] + rgb.b * matrix[5]), 0, 255),
    b: clamp(Math.round(rgb.r * matrix[6] + rgb.g * matrix[7] + rgb.b * matrix[8]), 0, 255),
  };
}

export function buildVisionSimulations(rgb: RgbColor): VisionSimulation[] {
  const grayscale = (() => {
    const y = Math.round(0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b);
    return { r: y, g: y, b: y };
  })();
  const items = [
    { label: "Normal", rgb, note: "Original color" },
    { label: "Protanopia", rgb: applyMatrix(rgb, [0.56667, 0.43333, 0, 0.55833, 0.44167, 0, 0, 0.24167, 0.75833]), note: "Red-blind preview" },
    { label: "Deuteranopia", rgb: applyMatrix(rgb, [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7]), note: "Green-blind preview" },
    { label: "Tritanopia", rgb: applyMatrix(rgb, [0.95, 0.05, 0, 0, 0.43333, 0.56667, 0, 0.475, 0.525]), note: "Blue-blind preview" },
    { label: "Monochrome", rgb: grayscale, note: "No-color fallback" },
  ];
  return items.map((item) => ({ label: item.label, hex: rgbToHex(item.rgb), recommendedText: getBestTextColor(item.rgb), note: item.note }));
}

export type ProductionCheck = {
  title: string;
  status: "Good" | "Review" | "Risk";
  detail: string;
};

export function buildProductionChecks(parsed: Extract<ParsedColor, { ok: true }>, frameworkMatches: FrameworkMatch[]): ProductionCheck[] {
  const textRatio = Math.max(parsed.contrastBlack, parsed.contrastWhite);
  const nearestFramework = frameworkMatches[0];
  return [
    {
      title: "Text contrast",
      status: textRatio >= 7 ? "Good" : textRatio >= 4.5 ? "Review" : "Risk",
      detail: `${parsed.bestTextColor === "#000000" ? "Black" : "White"} text gives ${textRatio}:1 contrast.`,
    },
    {
      title: "Alpha handling",
      status: parsed.hasAlpha ? "Review" : "Good",
      detail: parsed.hasAlpha ? "Preview the composite colors before using it on real surfaces." : "Solid color; matching and exports are stable.",
    },
    {
      title: "Framework mapping",
      status: nearestFramework && nearestFramework.confidence >= 78 ? "Good" : "Review",
      detail: nearestFramework ? `Closest token: ${nearestFramework.system} ${nearestFramework.name} (${nearestFramework.confidence}%).` : "No framework token available.",
    },
    {
      title: "Signal safety",
      status: parsed.hsl.s > 75 && parsed.hsl.l > 45 && parsed.hsl.l < 68 ? "Review" : "Good",
      detail: parsed.hsl.s > 75 ? "Use labels/icons with intense colors so meaning is not color-only." : "Good for calm UI usage with normal labeling.",
    },
  ];
}

export type SemanticRole = {
  role: string;
  fit: "Strong" | "Good" | "Use care";
  detail: string;
};

export function getSemanticRoles(hsl: HslColor, contrastBlack: number, contrastWhite: number): SemanticRole[] {
  const profile = getColorProfile(hsl);
  const isDark = hsl.l < 36;
  const isLight = hsl.l > 78;
  const readable = Math.max(contrastBlack, contrastWhite) >= 4.5;
  return [
    {
      role: "Brand accent",
      fit: hsl.s > 25 ? "Strong" : "Good",
      detail: `${profile.family} accents, logos, active states, and campaign highlights.`,
    },
    {
      role: "Button background",
      fit: readable && !isLight ? "Strong" : readable ? "Good" : "Use care",
      detail: readable ? "Works with the recommended text color." : "Needs a darker/lighter companion for readable labels.",
    },
    {
      role: "Page background",
      fit: isLight ? "Strong" : hsl.l > 60 ? "Good" : "Use care",
      detail: isLight ? "Soft enough for large surfaces." : "Better as a section, card, or hero surface than full-page background.",
    },
    {
      role: "Status meaning",
      fit: profile.family === "Red" || profile.family === "Green" || profile.family === "Yellow" ? "Good" : "Use care",
      detail: "Use clear text labels so status does not rely on color alone.",
    },
  ];
}
