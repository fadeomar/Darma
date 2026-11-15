export type Color = { r: number; g: number; b: number; a: number };
export type Target = "normal-aa" | "normal-aaa" | "large-aa" | "large-aaa" | "ui-aa";
export type Settings = { foreground: string; background: string; target: Target };
export const DEFAULT_SETTINGS: Settings = { foreground: "#777777", background: "#FFFFFF", target: "normal-aa" };
export const TARGETS: Record<Target, { label: string; minimum: number }> = {
  "normal-aa": { label: "Normal text · AA", minimum: 4.5 },
  "normal-aaa": { label: "Normal text · AAA", minimum: 7 },
  "large-aa": { label: "Large text · AA", minimum: 3 },
  "large-aaa": { label: "Large text · AAA", minimum: 4.5 },
  "ui-aa": { label: "UI & graphics · AA", minimum: 3 },
};
const NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
function numeric(raw: string, scale = 1): number | null {
  const percent = raw.endsWith("%"), value = percent ? raw.slice(0, -1) : raw;
  if (!NUMBER.test(value)) return null;
  const n = percent ? Number(value) / 100 * scale : Number(value);
  return Number.isFinite(n) ? n : null;
}
function bounded(n: number | null, max: number): n is number { return n !== null && n >= 0 && n <= max; }
export function parseColor(input: string): Color | null {
  const text = input.trim();
  if (text.length > 120) return null;
  const hex = text.match(/^#?([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i);
  if (hex) {
    let value = hex[1];
    if (value.length <= 4) value = value.split("").map((c) => c + c).join("");
    return { r: parseInt(value.slice(0, 2), 16), g: parseInt(value.slice(2, 4), 16), b: parseInt(value.slice(4, 6), 16), a: value.length === 8 ? parseInt(value.slice(6), 16) / 255 : 1 };
  }
  const fn = text.match(/^(rgba?|hsla?)\(([^()]+)\)$/i);
  if (!fn) return null;
  const body = fn[2].trim(), comma = body.includes(",");
  if (comma && body.includes("/")) return null;
  const parts = comma ? body.split(",").map((p) => p.trim()) : body.split(/\s*\/\s*/);
  let channels: string[], alpha: string | undefined;
  if (comma) { if (parts.length !== 3 && parts.length !== 4) return null; channels = parts.slice(0, 3); alpha = parts[3]; }
  else { if (parts.length > 2) return null; channels = parts[0].split(/\s+/); alpha = parts[1]; }
  if (channels.length !== 3 || channels.some((c) => !c)) return null;
  const a = alpha === undefined ? 1 : numeric(alpha, 1);
  if (!bounded(a, 1)) return null;
  if (/^rgb/i.test(fn[1])) {
    if (comma && channels.some((c) => c.endsWith("%")) && !channels.every((c) => c.endsWith("%"))) return null;
    const [r, g, b] = channels.map((c) => numeric(c, 255));
    return bounded(r, 255) && bounded(g, 255) && bounded(b, 255) ? { r, g, b, a } : null;
  }
  const hue = channels[0].match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(deg|turn|rad|grad)?$/i);
  if (!hue || !channels[1].endsWith("%") || !channels[2].endsWith("%")) return null;
  const s = numeric(channels[1], 1), l = numeric(channels[2], 1);
  if (!bounded(s, 1) || !bounded(l, 1)) return null;
  const units: Record<string, number> = { deg: 1, turn: 360, rad: 180 / Math.PI, grad: .9 };
  const degrees = Number(hue[1]) * units[(hue[2] || "deg").toLowerCase()];
  if (!Number.isFinite(degrees)) return null;
  const h = ((degrees % 360) + 360) % 360 / 60, c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(h % 2 - 1)), m = l - c / 2;
  const rgb = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x];
  return { r: (rgb[0] + m) * 255, g: (rgb[1] + m) * 255, b: (rgb[2] + m) * 255, a };
}
export function toHex(color: Color): string { return "#" + [color.r, color.g, color.b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("").toUpperCase(); }
export function colorInput(color: Color): string {
  if (color.a === 1) return toHex(color);
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${Number(color.a.toFixed(6))})`;
}
export function colorCss(color: Color): string { return `rgb(${color.r} ${color.g} ${color.b} / ${color.a})`; }
export function composite(fg: Color, bg: Color): Color { return { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 }; }
export function luminance(color: Color): number {
  const channel = (c: number) => { const v = c / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
  return .2126 * channel(color.r) + .7152 * channel(color.g) + .0722 * channel(color.b);
}
export function contrastRatio(fg: Color, bg: Color): number {
  const a = luminance(composite(fg, bg)), b = luminance(bg);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
export function checkContrast(settings: Settings) {
  const foreground = parseColor(settings.foreground), background = parseColor(settings.background);
  if (!foreground || !background || background.a !== 1) return null;
  const ratio = contrastRatio(foreground, background);
  return { foreground, background, effective: composite(foreground, background), ratio, checks: (Object.keys(TARGETS) as Target[]).map((id) => ({ id, ...TARGETS[id], pass: ratio >= TARGETS[id].minimum })) };
}
export function formatRatio(ratio: number): string { return ratio.toFixed([3, 4.5, 7].some((limit) => Math.abs(ratio - limit) < .005) ? 6 : 2); }
export type Alternative = { value: string; ratio: number; distance: number };
export function findAlternatives(settings: Settings, change: "foreground" | "background"): Alternative[] {
  const result = checkContrast(settings);
  if (!result) return [];
  const minimum = TARGETS[settings.target].minimum;
  if (result.ratio >= minimum) return [];
  const original = result[change], candidates: Alternative[] = [], seen = new Set<string>();
  for (const end of [0, 255]) {
    const sample = (amount: number) => {
      const color = { ...original, r: Math.round(original.r * (1 - amount) + end * amount), g: Math.round(original.g * (1 - amount) + end * amount), b: Math.round(original.b * (1 - amount) + end * amount) };
      const value = colorInput(color), verified = checkContrast({ ...settings, [change]: value });
      return { color, value, ratio: verified?.ratio ?? 0 };
    };
    if (sample(1).ratio < minimum) continue;
    let low = 0, high = 1;
    for (let i = 0; i < 28; i++) { const mid = (low + high) / 2; if (sample(mid).ratio >= minimum) high = mid; else low = mid; }
    for (const extra of [0, .14, .3]) {
      const { color, value, ratio } = sample(Math.min(1, high + extra));
      if (ratio < minimum || seen.has(value)) continue;
      seen.add(value);
      candidates.push({ value, ratio, distance: (color.r - original.r) ** 2 + (color.g - original.g) ** 2 + (color.b - original.b) ** 2 });
    }
  }
  return candidates.sort((a, b) => a.distance - b.distance).slice(0, 3);
}
export function serializeSettings(settings: Settings): string { return new URLSearchParams({ fg: settings.foreground, bg: settings.background, target: settings.target }).toString(); }
export function readSettings(search: string): Settings | null {
  if (search.length > 700) return null;
  const params = new URLSearchParams(search), target = params.get("target") ?? "normal-aa";
  if (!Object.hasOwn(TARGETS, target)) return null;
  const settings: Settings = { foreground: params.get("fg") ?? DEFAULT_SETTINGS.foreground, background: params.get("bg") ?? DEFAULT_SETTINGS.background, target: target as Target };
  return checkContrast(settings) ? settings : null;
}
export function buildReport(settings: Settings): string {
  const result = checkContrast(settings);
  if (!result) return "";
  return ["Darma Contrast Checker · WCAG 2.2", `Text: ${settings.foreground}`, `Text opacity: ${Number((result.foreground.a * 100).toFixed(2))}%`, `Background: ${settings.background}`, `Effective text color: ${colorCss(result.effective)}`, `Contrast ratio: ${result.ratio.toFixed(8)}:1`, `Selected target: ${TARGETS[settings.target].label}`, ...result.checks.map((check) => `${check.label}: ${check.pass ? "Pass" : "Fail"} (requires ${check.minimum}:1)`), "Color-pair check only; not an accessibility audit of an entire page."].join("\n");
}
export function buildCss(settings: Settings): string {
  const result = checkContrast(settings);
  return result ? `:root {\n  --text-color: ${colorCss(result.foreground)};\n  --background-color: ${colorCss(result.background)};\n}\n\n.readable-pair {\n  color: var(--text-color);\n  background-color: var(--background-color);\n}` : "";
}
