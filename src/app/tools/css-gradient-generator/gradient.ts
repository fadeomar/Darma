import Color from "colorjs.io";
import { parseGradient, parseMultipleGradients, type ParsedGradient } from "./parseGradient";

export type GradientType = "linear" | "radial" | "conic";
export type HueInterpolation = "shorter" | "longer" | "increasing" | "decreasing";
export type GradientShape = "circle" | "ellipse";

export type GradientStop = {
  id: string;
  kind: "stop";
  color: string;
  auto: number | null;
  position1: number | null;
  position2: number | null;
  manual?: boolean;
};

export type GradientHint = {
  id: string;
  kind: "hint";
  auto: number | null;
  percentage: number | null;
  manual?: boolean;
};

export type GradientStopItem = GradientStop | GradientHint;

export type GradientLayer = {
  id: string;
  name: string;
  visible: boolean;
  type: GradientType;
  space: string;
  interpolation: HueInterpolation;
  stops: GradientStopItem[];
  linear: {
    namedAngle: string;
    angle: number;
  };
  radial: {
    shape: GradientShape;
    size: string;
    namedPosition: string;
    position: { x: number | null; y: number | null };
  };
  conic: {
    angle: number;
    namedPosition: string;
    position: { x: number | null; y: number | null };
  };
};

export type GradientState = {
  layers: GradientLayer[];
  activeLayerId: string;
  modernPreview: boolean;
};

export type GradientValidation = {
  ok: boolean;
  errors: string[];
};

export type GradientPreset = {
  label: string;
  css: string;
  state: GradientState;
};

export const COLOR_SPACES = [
  { label: "Default", options: ["oklab"] },
  { label: "Cylindrical", options: ["oklch", "lch", "hsl", "hwb"] },
  { label: "Cartesian / wide gamut", options: ["lab", "srgb", "srgb-linear", "xyz", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020"] },
];

export const COLOR_SPACE_OPTIONS = COLOR_SPACES.flatMap((group) => group.options);
export const HUE_INTERPOLATIONS: HueInterpolation[] = ["shorter", "longer", "increasing", "decreasing"];
export const GRADIENT_POSITIONS = ["center", "top left", "top", "top right", "right", "bottom right", "bottom", "bottom left", "left"];
export const LINEAR_DIRECTIONS = ["to top left", "to top", "to top right", "to right", "to bottom right", "to bottom", "to bottom left", "to left"];
export const RADIAL_SIZES = ["closest-side", "closest-corner", "farthest-side", "farthest-corner", "120px", "45%", "60% 40%"];

const NAME_TO_DEG: Record<string, number> = {
  "to top": 0,
  "to top right": 45,
  "to right": 90,
  "to bottom right": 135,
  "to bottom": 180,
  "to bottom left": 225,
  "to left": 270,
  "to top left": 315,
};

const POSITION_TO_PERCENT: Record<string, { x: number; y: number }> = {
  center: { x: 50, y: 50 },
  top: { x: 50, y: 0 },
  right: { x: 100, y: 50 },
  bottom: { x: 50, y: 100 },
  left: { x: 0, y: 50 },
  "top right": { x: 100, y: 0 },
  "bottom right": { x: 100, y: 100 },
  "bottom left": { x: 0, y: 100 },
  "top left": { x: 0, y: 0 },
};

const PRESET_CSS = [
  { label: "Wild Flower", css: "linear-gradient(to top right in oklab, oklch(60% .5 353), oklch(80% .5 325))" },
  { label: "Tri Dye", css: "radial-gradient(farthest-corner circle at 50% 115% in oklch, oklch(80% .3 34), oklch(90% .3 200))" },
  { label: "Peaches", css: "linear-gradient(to bottom left in oklab, oklch(55% .45 350), oklch(95% .4 95))" },
  { label: "Midnight", css: "radial-gradient(farthest-corner circle at top right in oklab, oklch(80% .4 222), oklch(35% .5 313))" },
  { label: "Stripes", css: "linear-gradient(to top right in oklab, #fff, #000 0% 20%, #fff 0% 40%, #000 0% 60%, #fff 0% 80%, #000 0% 100%)" },
  { label: "Chlorophyll", css: "conic-gradient(from 0deg at top left in oklch, oklch(75% 0.5 156), oklch(70% 0.5 261))" },
  { label: "Honeycomb", css: "linear-gradient(to bottom right in oklab, oklch(95% .5 110), oklch(72% .5 90))" },
  { label: "Blue Razzberry", css: "linear-gradient(to bottom right in oklch, oklch(70% .5 340), oklch(90% .3 200))" },
  { label: "Mmm Pie", css: "conic-gradient(from 0deg at center in oklch, oklch(77% 0.50 200), 26%, oklch(77% 0.50 230) 0%, 46%, oklch(77% 0.50 260) 0%, 59%, oklch(77% 0.50 280) 0%, 82%, oklch(77% 0.50 300) 0%)" },
  { label: "Huey", css: "conic-gradient(in oklch longer hue, oklch(70% .3 0), oklch(70% .3 0))" },
  { label: "Solid Yo.", css: "linear-gradient(in oklab, oklch(70% .3 0) 0 0)" },
  { label: "Soundwave", css: "radial-gradient(farthest-corner circle at top left in oklch, oklch(95% .25 160), 26%, oklch(75% 0.50 180) 0%, 46%, oklch(75% 0.50 210) 0%, 60%, oklch(75% 0.50 230) 0%, 82%, oklch(75% 0.50 260) 0%)" },
  { label: "Palette", css: "linear-gradient(to bottom in oklch, oklch(95% .2 5), 10%, oklch(95% .25 5) 0%, 26%, oklch(95% .3 5) 0%, 46%, oklch(95% .35 5) 0%, 72%, oklch(95% .4 5) 0%)" },
  { label: "Sunburst", css: "conic-gradient(from 0deg at bottom left in oklab, #fff, 2%, #f00 0%, 8%, #fff 0%, 13%, #f00 0%, 18%, #fff 0%, 21%, #f00 0%, 24%, #fff 0%)" },
  { label: "LearnUI", css: "linear-gradient(to right in lch, color(display-p3 25% 25% 100%), color(display-p3 100% 85% 30%))" },
  { label: "Neon Stripe", css: "linear-gradient(to right in oklab, #0ff, #0ff 0% 12%, #111 0% 24%, #ff0 0% 36%, #111 0% 48%, #f0f 0% 60%, #111 0% 72%, #0ff 0% 84%, #111 0% 100%)" },
];

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function uid(prefix = "id") {
  try {
    return `${prefix}-${crypto.randomUUID()}`;
  } catch {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function toNumber(value: unknown, fallback: number | null = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const next = Number(String(value).replace("%", ""));
  return Number.isFinite(next) ? next : fallback;
}

function normalizeNamedPosition(name?: string | null) {
  const normalized = (name ?? "center").toLowerCase();
  const aliases: Record<string, string> = {
    "top center": "top",
    "bottom center": "bottom",
    "left center": "left",
    "right center": "right",
  };
  return aliases[normalized] ?? normalized;
}

function toDegrees(valueWithUnit?: string | null) {
  if (!valueWithUnit) return 0;
  const value = valueWithUnit.trim().toLowerCase();
  let degrees = Number.NaN;
  if (value.endsWith("deg")) degrees = Number.parseFloat(value);
  else if (value.endsWith("turn")) degrees = Number.parseFloat(value) * 360;
  else if (value.endsWith("rad")) degrees = Number.parseFloat(value) * (180 / Math.PI);
  else if (value.endsWith("grad")) degrees = Number.parseFloat(value) * 0.9;
  else degrees = Number.parseFloat(value);
  return Number.isFinite(degrees) ? Number.parseFloat(degrees.toFixed(4)) : 0;
}

export function isCylindricalSpace(space: string) {
  return ["hsl", "hwb", "lch", "oklch"].includes(space);
}

export function namedPositionToPercent(namedPosition: string) {
  return POSITION_TO_PERCENT[namedPosition] ?? POSITION_TO_PERCENT.center;
}

export function directionToDeg(direction: string) {
  return NAME_TO_DEG[direction] ?? 90;
}

export function angleToDirection(angle: number) {
  const normalized = ((angle % 360) + 360) % 360;
  const match = Object.entries(NAME_TO_DEG).find(([, degrees]) => Math.abs(degrees - normalized) <= 0.5);
  return match?.[0] ?? "--";
}

function cloneLayer(layer: GradientLayer): GradientLayer {
  return {
    ...layer,
    stops: layer.stops.map((stop) => ({ ...stop, id: uid(stop.kind) })),
    linear: { ...layer.linear },
    radial: { ...layer.radial, position: { ...layer.radial.position } },
    conic: { ...layer.conic, position: { ...layer.conic.position } },
  };
}

export function createStop(color = "oklch(70% 0.5 340)", position1: number | null = null, position2: number | null = null): GradientStop {
  return {
    id: uid("stop"),
    kind: "stop",
    color,
    auto: null,
    position1,
    position2,
  };
}

export function createHint(percentage: number | null = null): GradientHint {
  return {
    id: uid("hint"),
    kind: "hint",
    auto: null,
    percentage,
  };
}

function genStopMap(stops: GradientStopItem[]) {
  const colors = stops.filter((stop) => stop.kind === "stop");
  const hints = stops.filter((stop) => stop.kind === "hint");
  if (colors.length <= 1) return stops.map((_, index) => (index === 0 ? 0 : 100));

  const colorIncrements = 100 / (colors.length - 1);
  const hintStart = Math.round(colorIncrements / 2);
  const increment = Math.round(colorIncrements);
  const generated: number[] = [];

  for (let i = 0; i <= hints.length; i += 1) {
    let stopPos = increment * i;
    const hintPos = hintStart + increment * i;
    if (stopPos === 99) stopPos = 100;
    generated.unshift(stopPos);
    if (hints[i]) generated.unshift(hintPos);
  }

  return generated.reverse();
}

export function updateStops(stops: GradientStopItem[]) {
  const autoStops = genStopMap(stops);
  return stops.map((stop, index) => {
    const autoVal = autoStops[index] ?? null;
    if (stop.kind === "stop") {
      if (stops.length === 1) {
        return { ...stop, auto: autoVal, position1: 0, position2: 100, manual: undefined };
      }
      if (stop.manual) return { ...stop, auto: autoVal, manual: undefined };

      const prevAuto = stop.auto;
      const p1Unset = stop.position1 == null || (prevAuto != null && String(stop.position1) === String(prevAuto));
      const p2Unset = stop.position2 == null;
      const hadLinked = !p2Unset && (String(stop.position2) === String(stop.position1) || (prevAuto != null && String(stop.position2) === String(prevAuto)));

      let position1 = stop.position1;
      let position2 = stop.position2;
      if (p1Unset) position1 = autoVal;
      if (p2Unset) position2 = p1Unset ? autoVal : position1;
      else if (hadLinked) position2 = position1 ?? autoVal;
      return { ...stop, auto: autoVal, position1, position2, manual: undefined };
    }

    if (stop.percentage == null || (stop.auto != null && String(stop.percentage) === String(stop.auto))) {
      return { ...stop, auto: autoVal, percentage: autoVal, manual: undefined };
    }
    return { ...stop, auto: autoVal, manual: undefined };
  });
}

export function ensureHints(stops: GradientStopItem[]) {
  const colors = stops.filter((stop): stop is GradientStop => stop.kind === "stop");
  if (colors.length <= 1) return updateStops(colors);
  const next: GradientStopItem[] = [];
  colors.forEach((stop, index) => {
    next.push(stop);
    if (index < colors.length - 1) next.push(createHint());
  });
  return updateStops(next);
}

export function removeStopItem(stops: GradientStopItem[], index: number) {
  const target = stops[index];
  if (!target) return stops;
  const colorCount = stops.filter((stop) => stop.kind === "stop").length;
  if (target.kind === "stop" && colorCount <= 1) return stops;

  const next = [...stops];
  if (target.kind === "stop") {
    if (next[index + 1]?.kind === "hint") next.splice(index, 2);
    else if (next[index - 1]?.kind === "hint") next.splice(index - 1, 2);
    else next.splice(index, 1);
  } else {
    next.splice(index, 1);
  }
  return updateStops(next);
}

export function duplicateStopItem(stops: GradientStopItem[], index: number) {
  const target = stops[index];
  if (!target || target.kind !== "stop") return stops;
  const copy: GradientStop = {
    ...target,
    id: uid("stop"),
    position1: target.position1 == null ? null : clamp(target.position1 + 8, 0, 100),
    position2: target.position2 == null ? null : clamp(target.position2 + 8, 0, 100),
    manual: true,
  };
  const next = [...stops];
  next.splice(index + 1, 0, createHint(), copy);
  return updateStops(next);
}

export function reverseStops(stops: GradientStopItem[]) {
  const mapped = stops.map((stop) => {
    if (stop.kind === "stop") {
      return {
        ...stop,
        position1: stop.position1 == null ? null : 100 - stop.position1,
        position2: stop.position2 == null ? null : 100 - stop.position2,
        manual: true,
      } satisfies GradientStop;
    }
    return {
      ...stop,
      percentage: stop.percentage == null ? null : 100 - stop.percentage,
      manual: true,
    } satisfies GradientHint;
  });
  return updateStops(mapped.reverse());
}

function spaceToString(space: string, interpolation: HueInterpolation) {
  return isCylindricalSpace(space) && interpolation !== "shorter" ? `in ${space} ${interpolation} hue` : `in ${space}`;
}

function positionToString(namedPosition: string, position: { x: number | null; y: number | null }) {
  if (namedPosition && namedPosition !== "--") {
    if (namedPosition === "center") return "";
    return namedPosition;
  }
  if (position.x != null) {
    const x = position.x;
    const y = position.y ?? 50;
    if (String(x) === "50" && String(y) === "50") return "";
    return `${x}% ${y}%`;
  }
  return "";
}

function linearAngleToken(linear: GradientLayer["linear"]) {
  if (linear.namedAngle && linear.namedAngle !== "--") {
    if (linear.namedAngle === "to bottom") return "";
    return linear.namedAngle;
  }
  if (linear.angle != null) {
    const n = Number(linear.angle);
    if (!Number.isNaN(n) && n % 360 === 180) return "";
    return `${linear.angle}deg`;
  }
  return "";
}

function maybeConvertColor(color: string, convertColors?: boolean) {
  if (!convertColors) return color;
  try {
    return new Color(color).toGamut({ space: "srgb", method: "clip" }).to("srgb").toString({ format: "hex" });
  } catch {
    return color;
  }
}

function fmtPos(value: number | string | null | undefined) {
  if (value == null) return null;
  const str = String(value).trim();
  if (!str) return null;
  if (/[a-z%]/i.test(str)) return str;
  return `${str}%`;
}

function asNumberPercent(value: unknown) {
  if (value == null) return null;
  const str = String(value).trim();
  if (/^[-+]?\d*\.?\d+%?$/.test(str)) return Number(str.replace("%", ""));
  return null;
}

function isFifty(value: unknown) {
  const n = asNumberPercent(value);
  return n != null && Number(n) === 50;
}

function stopsToStrings(stops: GradientStopItem[], options: { convertColors?: boolean; newLines?: boolean } = {}) {
  const stopIndices = stops.map((stop, index) => (stop.kind === "stop" ? index : null)).filter((index) => index !== null) as number[];
  const firstStopIdx = stopIndices[0];
  type StopOut = { kind: "stop"; color: string; posA?: string | null; posB?: string | null } | { kind: "hint"; text: string };
  const out: StopOut[] = [];

  stops.forEach((stop, index) => {
    if (stop.kind === "stop") {
      let p1: number | null = stop.position1;
      const p2: number | null = stop.position2;
      if (p1 != null && stop.auto != null && String(p1) === String(stop.auto)) p1 = null;
      if (index === firstStopIdx && asNumberPercent(p1) === 0) p1 = null;
      const colorStr = maybeConvertColor(stop.color, options.convertColors);
      const a = fmtPos(p1);
      const b = fmtPos(p2);
      if (a && b && a !== b) out.push({ kind: "stop", color: colorStr, posA: a, posB: b });
      else if (a || b) out.push({ kind: "stop", color: colorStr, posA: a ?? b });
      else out.push({ kind: "stop", color: colorStr });
      return;
    }

    if (stop.percentage == null) return;
    if (stop.auto != null && String(stop.percentage) === String(stop.auto)) return;
    if (isFifty(stop.percentage)) return;
    out.push({ kind: "hint", text: `${stop.percentage}%` });
  });

  const colorStops = out.filter((item): item is Extract<StopOut, { kind: "stop" }> => item.kind === "stop");
  const maxColorLen = colorStops.reduce((max, stop) => Math.max(max, stop.color.length), 0);
  const hasLongColor = maxColorLen >= 20 || colorStops.some((stop) => /\(|\s/.test(stop.color));
  const useNewLines = options.newLines === true || (options.newLines !== false && hasLongColor);

  if (!useNewLines) {
    return out
      .map((item) => {
        if (item.kind === "hint") return item.text;
        return [item.color, item.posA, item.posB].filter(Boolean).join(" ");
      })
      .join(", ");
  }

  return out
    .map((item) => {
      if (item.kind === "hint") return item.text;
      const pad = item.posA || item.posB ? " ".repeat(Math.max(1, maxColorLen - item.color.length + 1)) : "";
      const parts = [item.color];
      if (item.posA) parts.push(pad + item.posA);
      if (item.posB) parts.push(` ${item.posB}`);
      return parts.join("");
    })
    .join(",\n    ");
}

export function buildLayerGradientStrings(layer: GradientLayer) {
  if (!layer.visible) return { modern: "", classic: "" };

  if (layer.type === "linear") {
    const tokens = [linearAngleToken(layer.linear), spaceToString(layer.space, layer.interpolation)].filter(Boolean).join(" ");
    const modern = `linear-gradient(\n    ${tokens},\n    ${stopsToStrings(layer.stops)}\n  )`;
    const angleToken = linearAngleToken(layer.linear);
    const classic = `linear-gradient(${angleToken ? `${angleToken}, ` : ""}${stopsToStrings(layer.stops, { convertColors: true })})`;
    return { modern, classic };
  }

  if (layer.type === "radial") {
    const pos = positionToString(layer.radial.namedPosition, layer.radial.position);
    const posPart = pos && pos !== "center" ? `at ${pos}` : "";
    const tokens = [layer.radial.size, layer.radial.shape, posPart, spaceToString(layer.space, layer.interpolation)].filter(Boolean).join(" ");
    const modern = `radial-gradient(\n    ${tokens},\n    ${stopsToStrings(layer.stops)}\n  )`;
    const classic = `radial-gradient(${[layer.radial.size, layer.radial.shape].filter(Boolean).join(" ")}${pos ? ` at ${pos}` : ""}, ${stopsToStrings(layer.stops, { convertColors: true })})`;
    return { modern, classic };
  }

  const pos = positionToString(layer.conic.namedPosition, layer.conic.position);
  const posPart = pos && pos !== "center" ? `at ${pos}` : "";
  const fromPart = (Number(layer.conic.angle) || 0) % 360 === 0 ? "" : `from ${layer.conic.angle}deg`;
  const tokens = [fromPart, posPart, spaceToString(layer.space, layer.interpolation)].filter(Boolean).join(" ");
  const modern = `conic-gradient(\n    ${tokens},\n    ${stopsToStrings(layer.stops)}\n  )`;
  const classic = `conic-gradient(${`${fromPart} ${posPart}`.trim()}${fromPart || posPart ? ", " : ""}${stopsToStrings(layer.stops, { convertColors: true })})`;
  return { modern, classic };
}

export function buildBackgroundCss(state: GradientState) {
  const visible = state.layers.filter((layer) => layer.visible);
  const modern = visible.map((layer) => buildLayerGradientStrings(layer).modern).filter(Boolean).join(",\n  ");
  const classic = visible.map((layer) => buildLayerGradientStrings(layer).classic).filter(Boolean).join(",\n  ");
  return { modern, classic };
}

export function buildCssSnippet(state: GradientState) {
  const { modern, classic } = buildBackgroundCss(state);
  return `.gradient-background {\n  --sdr-gradient: ${classic};\n  --hdr-gradient: ${modern};\n\n  background: var(--sdr-gradient);\n}\n\n@supports (color: oklch(50% 0.1 180)) {\n  .gradient-background {\n    background: var(--hdr-gradient);\n  }\n}`;
}

export function buildTailwindArbitraryClass(state: GradientState) {
  const { modern } = buildBackgroundCss(state);
  return `bg-[${modern.replace(/\s+/g, "_").replace(/,/g, ",")}]`;
}

export function createDefaultLayer(): GradientLayer {
  return {
    id: uid("layer"),
    name: "Layer 1",
    visible: true,
    type: "linear",
    space: "oklab",
    interpolation: "shorter",
    stops: updateStops([
      createStop("oklch(70% 0.5 340)", 0, 0),
      createHint(50),
      createStop("oklch(90% 0.5 200)", 100, 100),
    ]),
    linear: { namedAngle: "to right", angle: 90 },
    radial: { shape: "circle", size: "farthest-corner", namedPosition: "center", position: { x: null, y: null } },
    conic: { angle: 0, namedPosition: "center", position: { x: null, y: null } },
  };
}

export const DEFAULT_GRADIENT: GradientState = {
  layers: [createDefaultLayer()],
  activeLayerId: "",
  modernPreview: true,
};
DEFAULT_GRADIENT.activeLayerId = DEFAULT_GRADIENT.layers[0].id;

export function getActiveLayer(state: GradientState) {
  return state.layers.find((layer) => layer.id === state.activeLayerId) ?? state.layers[0];
}

export function updateActiveLayer(state: GradientState, updater: (layer: GradientLayer) => GradientLayer): GradientState {
  const activeId = state.activeLayerId;
  const layers = state.layers.map((layer) => (layer.id === activeId ? updater(layer) : layer));
  return { ...state, layers };
}

export function addLayer(state: GradientState, seed: "new" | "duplicate" = "duplicate") {
  const activeLayer = getActiveLayer(state) ?? createDefaultLayer();
  const layer = seed === "duplicate" ? cloneLayer(activeLayer) : createDefaultLayer();
  layer.id = uid("layer");
  layer.name = seed === "duplicate" ? `${activeLayer.name} copy` : `Layer ${state.layers.length + 1}`;
  if (seed === "new") {
    layer.stops = updateStops([createStop(randomOKLCH(), 0, 0), createHint(50), createStop(randomOKLCH(), 100, 100)]);
    layer.linear.namedAngle = LINEAR_DIRECTIONS[Math.floor(Math.random() * LINEAR_DIRECTIONS.length)];
    layer.linear.angle = directionToDeg(layer.linear.namedAngle);
  }
  layer.stops = layer.stops.map((stop) => (stop.kind === "stop" ? { ...stop, color: withAlpha(stop.color, 0.58) } : stop));
  return { ...state, layers: [layer, ...state.layers], activeLayerId: layer.id };
}

export function moveLayer(state: GradientState, from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= state.layers.length || to >= state.layers.length) return state;
  const layers = [...state.layers];
  const [moved] = layers.splice(from, 1);
  layers.splice(to, 0, moved);
  return { ...state, layers };
}

export function deleteLayer(state: GradientState, id: string) {
  if (state.layers.length <= 1) return state;
  const layers = state.layers.filter((layer) => layer.id !== id);
  const activeLayerId = state.activeLayerId === id ? layers[0].id : state.activeLayerId;
  return { ...state, layers, activeLayerId };
}

export function createStateFromLayers(layers: GradientLayer[]) {
  const normalized = layers.length ? layers : [createDefaultLayer()];
  return { layers: normalized, activeLayerId: normalized[0].id, modernPreview: true } satisfies GradientState;
}

function gradientStopFromParsed(stop: ParsedGradient["stops"][number]): GradientStopItem {
  if (stop.kind === "hint") {
    return createHint(toNumber(stop.percentage, null));
  }
  return createStop(stop.color, toNumber(stop.position1, null), toNumber(stop.position2, null));
}

export function layerFromParsed(parsed: ParsedGradient, index = 0): GradientLayer {
  const layer = createDefaultLayer();
  layer.id = uid("layer");
  layer.name = `Imported ${index + 1}`;
  layer.type = parsed.type;
  layer.space = parsed.space ?? "oklab";
  layer.interpolation = parsed.interpolation ?? "shorter";

  if (parsed.type === "linear") {
    const namedAngle = parsed.linear?.angleKeyword ?? "to bottom";
    if (parsed.linear?.angleDeg) {
      const angle = toDegrees(parsed.linear.angleDeg);
      layer.linear = { angle, namedAngle: angleToDirection(angle) };
    } else {
      layer.linear = { namedAngle, angle: directionToDeg(namedAngle) };
    }
  } else if (parsed.type === "radial") {
    const namedPosition = parsed.radial?.namedPosition ? normalizeNamedPosition(parsed.radial.namedPosition) : parsed.radial?.position?.x ? "--" : "center";
    layer.radial = {
      shape: parsed.radial?.shape ?? "circle",
      size: parsed.radial?.size ?? "farthest-corner",
      namedPosition,
      position: {
        x: toNumber(parsed.radial?.position?.x, null),
        y: toNumber(parsed.radial?.position?.y, null),
      },
    };
  } else {
    const namedPosition = parsed.conic?.namedPosition ? normalizeNamedPosition(parsed.conic.namedPosition) : parsed.conic?.position?.x ? "--" : "center";
    layer.conic = {
      angle: parsed.conic?.fromDeg ? toDegrees(parsed.conic.fromDeg) : 0,
      namedPosition,
      position: {
        x: toNumber(parsed.conic?.position?.x, null),
        y: toNumber(parsed.conic?.position?.y, null),
      },
    };
  }

  const parsedStops = parsed.stops.map(gradientStopFromParsed);
  layer.stops = parsedStops.some((stop) => stop.kind === "hint") ? updateStops(parsedStops) : ensureHints(parsedStops);
  return layer;
}

export function importCssGradients(input: string) {
  const parsed = parseMultipleGradients(input);
  if (!parsed.length) parsed.push(parseGradient(input));
  return createStateFromLayers(parsed.map((gradient, index) => layerFromParsed(gradient, index)));
}

export function validateGradient(state: GradientState): GradientValidation {
  const errors: string[] = [];
  if (!state.layers.length) errors.push("Add at least one gradient layer.");
  state.layers.forEach((layer, layerIndex) => {
    const visibleStopCount = layer.stops.filter((stop) => stop.kind === "stop").length;
    if (visibleStopCount < 1) errors.push(`Layer ${layerIndex + 1} needs at least one color stop.`);
    layer.stops.forEach((stop, stopIndex) => {
      if (stop.kind === "stop") {
        try {
          new Color(stop.color);
        } catch {
          errors.push(`Layer ${layerIndex + 1}, stop ${stopIndex + 1}: use a valid CSS color.`);
        }
      }
    });
  });
  return { ok: errors.length === 0, errors };
}

export function colorToHex(color: string) {
  try {
    return new Color(color).toGamut({ space: "srgb", method: "clip" }).to("srgb").toString({ format: "hex" });
  } catch {
    return "#ffffff";
  }
}

export function normalizeHexColor(value: string) {
  try {
    return colorToHex(value).toLowerCase();
  } catch {
    return value;
  }
}

export function contrastTextColor(color: string) {
  try {
    const c = new Color(color);
    const white = c.contrast("white", "WCAG21");
    const black = c.contrast("black", "WCAG21");
    return white > black ? "#ffffff" : "#000000";
  } catch {
    return "#000000";
  }
}

export function randomOKLCH() {
  const lightness = Math.round(58 + Math.random() * 32);
  const chroma = (0.18 + Math.random() * 0.32).toFixed(2);
  const hue = Math.round(Math.random() * 360);
  return `oklch(${lightness}% ${chroma} ${hue})`;
}

export function randomLayerColor() {
  return randomOKLCH();
}

function withAlpha(color: string, alpha: number) {
  const safeAlpha = clamp(alpha, 0, 1);
  if (/^#([0-9a-f]{3,8})$/i.test(color)) {
    try {
      const hex = colorToHex(color).replace("#", "");
      const alphaHex = Math.round(safeAlpha * 255).toString(16).padStart(2, "0");
      return `#${hex}${alphaHex}`;
    } catch {
      return color;
    }
  }
  if (/\(/.test(color) && !/\/\s*\d*\.?\d+/.test(color)) return color.replace(/\)$/, ` / ${safeAlpha})`);
  return color;
}

export function createRandomGradient(): GradientState {
  const type: GradientType = Math.random() > 0.35 ? "linear" : Math.random() > 0.5 ? "radial" : "conic";
  const layer = createDefaultLayer();
  layer.type = type;
  layer.space = Math.random() > 0.2 ? "oklch" : "oklab";
  layer.interpolation = layer.space === "oklch" && Math.random() > 0.55 ? "longer" : "shorter";
  layer.linear.angle = Math.round(Math.random() * 360);
  layer.linear.namedAngle = angleToDirection(layer.linear.angle);
  layer.radial.shape = Math.random() > 0.5 ? "circle" : "ellipse";
  layer.radial.namedPosition = GRADIENT_POSITIONS[Math.floor(Math.random() * GRADIENT_POSITIONS.length)];
  layer.conic.angle = Math.round(Math.random() * 360);
  layer.conic.namedPosition = GRADIENT_POSITIONS[Math.floor(Math.random() * GRADIENT_POSITIONS.length)];
  const stopCount = Math.random() > 0.55 ? 3 : 2;
  const stops: GradientStopItem[] = [];
  for (let i = 0; i < stopCount; i += 1) {
    const position = Math.round((100 / (stopCount - 1)) * i);
    stops.push(createStop(randomOKLCH(), position, position));
    if (i < stopCount - 1) stops.push(createHint());
  }
  layer.stops = updateStops(stops);
  return createStateFromLayers([layer]);
}

export const GRADIENT_PRESETS: GradientPreset[] = PRESET_CSS.map((preset) => {
  try {
    return { ...preset, state: importCssGradients(preset.css) };
  } catch {
    return { ...preset, state: DEFAULT_GRADIENT };
  }
});
