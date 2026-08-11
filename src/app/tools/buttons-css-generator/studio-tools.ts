import { defaultButtonConfig } from "./presets";
import type {
  ButtonBorderStyle,
  ButtonGeneratorConfig,
  ButtonStyle,
  PreviewBackground,
  PreviewContext,
} from "./types";

export type ButtonStudioShareState = {
  version: 2;
  config: ButtonGeneratorConfig;
  previewBackground: PreviewBackground;
  customPreviewBackground: string;
  previewContext: PreviewContext;
  previewDevice: "desktop" | "tablet" | "mobile";
  previewInput: "mouse" | "touch" | "keyboard";
  motionPreview: "normal" | "reduced";
};

export type CssImportResult = {
  config: ButtonGeneratorConfig;
  matchedProperties: number;
  warnings: string[];
  selector: string | null;
};

export type ButtonLearningNote = {
  label: string;
  css: string;
  explanation: string;
};

const SHARE_VERSION = 2;
const MAX_SHARE_TOKEN_LENGTH = 24000;
const MAX_CUSTOM_CSS_LENGTH = 2400;

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeButtonStudioState(state: ButtonStudioShareState) {
  return toBase64Url(JSON.stringify(state));
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? value as T : fallback;
}

function colorValue(value: unknown, fallback: string) {
  return typeof value === "string" ? normalizeColor(value) ?? fallback : fallback;
}

function normalizeSharedConfig(raw: Partial<ButtonGeneratorConfig>): ButtonGeneratorConfig {
  const base = defaultButtonConfig;
  return {
    ...base,
    style: enumValue(raw.style, ["solid", "outline", "ghost", "gradient", "glass", "neumorphic", "three-d"], base.style),
    shape: enumValue(raw.shape, ["square", "rounded", "pill"], base.shape),
    contentMode: enumValue(raw.contentMode, ["text", "text-icon", "icon-only"], base.contentMode),
    loading: Boolean(raw.loading),
    className: typeof raw.className === "string" ? raw.className.slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, "-") || base.className : base.className,
    text: typeof raw.text === "string" ? raw.text.slice(0, 80) : base.text,
    fontSize: clampNumber(raw.fontSize, base.fontSize, 10, 40),
    fontWeight: clampNumber(raw.fontWeight, base.fontWeight, 100, 900),
    lineHeight: clampNumber(raw.lineHeight, base.lineHeight, 0.8, 2.4),
    letterSpacing: clampNumber(raw.letterSpacing, base.letterSpacing, -3, 8),
    radius: clampNumber(raw.radius, base.radius, 0, 999),
    paddingX: clampNumber(raw.paddingX, base.paddingX, 0, 96),
    paddingY: clampNumber(raw.paddingY, base.paddingY, 0, 64),
    minWidth: clampNumber(raw.minWidth, base.minWidth, 0, 640),
    background: colorValue(raw.background, base.background),
    background2: colorValue(raw.background2, base.background2),
    gradientAngle: clampNumber(raw.gradientAngle, base.gradientAngle, 0, 360),
    textColor: colorValue(raw.textColor, base.textColor),
    borderEnabled: Boolean(raw.borderEnabled),
    borderWidth: clampNumber(raw.borderWidth, base.borderWidth, 1, 12),
    borderStyle: enumValue(raw.borderStyle, ["solid", "dashed", "dotted", "double"], base.borderStyle),
    borderColor: colorValue(raw.borderColor, base.borderColor),
    shadowEnabled: Boolean(raw.shadowEnabled),
    shadowX: clampNumber(raw.shadowX, base.shadowX, -64, 64),
    shadowY: clampNumber(raw.shadowY, base.shadowY, -64, 96),
    shadowBlur: clampNumber(raw.shadowBlur, base.shadowBlur, 0, 128),
    shadowSpread: clampNumber(raw.shadowSpread, base.shadowSpread, -48, 64),
    shadowColor: colorValue(raw.shadowColor, base.shadowColor),
    shadowOpacity: clampNumber(raw.shadowOpacity, base.shadowOpacity, 0, 1),
    shadowInset: Boolean(raw.shadowInset),
    hoverEffect: enumValue(raw.hoverEffect, ["lift", "glow", "darken", "scale", "slide", "shine", "fill", "pulse", "bounce", "icon-shift", "none"], base.hoverEffect),
    motionDuration: clampNumber(raw.motionDuration, base.motionDuration, 0, 2000),
    motionEasing: enumValue(raw.motionEasing, ["ease", "ease-out", "ease-in-out", "linear"], base.motionEasing),
    customizeHoverState: Boolean(raw.customizeHoverState),
    hoverBackground: colorValue(raw.hoverBackground, base.hoverBackground),
    hoverTextColor: colorValue(raw.hoverTextColor, base.hoverTextColor),
    hoverBorderColor: colorValue(raw.hoverBorderColor, base.hoverBorderColor),
    hoverTranslateY: clampNumber(raw.hoverTranslateY, base.hoverTranslateY, -32, 32),
    hoverScale: clampNumber(raw.hoverScale, base.hoverScale, 0.5, 1.5),
    hoverShadowY: clampNumber(raw.hoverShadowY, base.hoverShadowY, -32, 96),
    hoverShadowBlur: clampNumber(raw.hoverShadowBlur, base.hoverShadowBlur, 0, 128),
    customizeActiveState: Boolean(raw.customizeActiveState),
    activeBackground: colorValue(raw.activeBackground, base.activeBackground),
    activeTextColor: colorValue(raw.activeTextColor, base.activeTextColor),
    activeBorderColor: colorValue(raw.activeBorderColor, base.activeBorderColor),
    activeTranslateY: clampNumber(raw.activeTranslateY, base.activeTranslateY, -16, 24),
    activeScale: clampNumber(raw.activeScale, base.activeScale, 0.5, 1.3),
    activeEffect: raw.activeEffect === undefined ? base.activeEffect : Boolean(raw.activeEffect),
    disabled: Boolean(raw.disabled),
    disabledOpacity: clampNumber(raw.disabledOpacity, base.disabledOpacity, 0.1, 1),
    iconPosition: enumValue(raw.iconPosition, ["left", "right"], base.iconPosition),
    iconSymbol: typeof raw.iconSymbol === "string" ? raw.iconSymbol.slice(0, 8) : base.iconSymbol,
    uppercase: Boolean(raw.uppercase),
    fullWidth: Boolean(raw.fullWidth),
    mobileFullWidth: Boolean(raw.mobileFullWidth),
    includeFocusRing: raw.includeFocusRing === undefined ? base.includeFocusRing : Boolean(raw.includeFocusRing),
    focusRingColor: colorValue(raw.focusRingColor, base.focusRingColor),
    focusRingWidth: clampNumber(raw.focusRingWidth, base.focusRingWidth, 1, 12),
    focusRingOffset: clampNumber(raw.focusRingOffset, base.focusRingOffset, 0, 16),
    includeReducedMotion: raw.includeReducedMotion === undefined ? base.includeReducedMotion : Boolean(raw.includeReducedMotion),
    customCss: sanitizeCustomCssOverrides(raw.customCss ?? ""),
  };
}

export function decodeButtonStudioState(value: string): ButtonStudioShareState | null {
  try {
    if (!value || value.length > MAX_SHARE_TOKEN_LENGTH) return null;
    const parsed = JSON.parse(fromBase64Url(value)) as Partial<ButtonStudioShareState> & { version?: number };
    if (![1, SHARE_VERSION].includes(parsed.version ?? 0) || !parsed.config || typeof parsed.config !== "object") return null;
    if (!(["light", "dark", "gradient", "custom"] as string[]).includes(parsed.previewBackground ?? "")) return null;
    if (!(["canvas", "landing", "form", "pricing", "checkout"] as string[]).includes(parsed.previewContext ?? "")) return null;
    if (!(["desktop", "tablet", "mobile"] as string[]).includes(parsed.previewDevice ?? "")) return null;
    const config = normalizeSharedConfig(parsed.config as Partial<ButtonGeneratorConfig>);
    const previewInput = (["mouse", "touch", "keyboard"] as string[]).includes(parsed.previewInput ?? "") ? parsed.previewInput as ButtonStudioShareState["previewInput"] : "mouse";
    const motionPreview = (["normal", "reduced"] as string[]).includes(parsed.motionPreview ?? "") ? parsed.motionPreview as ButtonStudioShareState["motionPreview"] : "normal";
    return {
      version: SHARE_VERSION,
      config,
      previewBackground: parsed.previewBackground as PreviewBackground,
      customPreviewBackground: colorValue(parsed.customPreviewBackground, "#f8fafc"),
      previewContext: parsed.previewContext as PreviewContext,
      previewDevice: parsed.previewDevice as "desktop" | "tablet" | "mobile",
      previewInput,
      motionPreview,
    };
  } catch {
    return null;
  }
}

export function sanitizeCustomCssOverrides(value: string) {
  const input = value.slice(0, MAX_CUSTOM_CSS_LENGTH);
  return input
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const separator = chunk.indexOf(":");
      if (separator < 1) return null;
      const property = chunk.slice(0, separator).trim().toLowerCase();
      const cssValue = chunk.slice(separator + 1).trim();
      if (!/^(?:--[a-z0-9_-]+|[a-z-]+)$/i.test(property)) return null;
      if (!cssValue || /[{}<>@]/.test(cssValue) || /url\s*\(|expression\s*\(/i.test(cssValue)) return null;
      return `${property}: ${cssValue};`;
    })
    .filter((declaration): declaration is string => Boolean(declaration))
    .join("\n");
}

function parsePx(value: string | undefined) {
  if (!value) return null;
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)px$/i);
  return match ? Number(match[1]) : null;
}

function parseNumber(value: string | undefined) {
  if (!value) return null;
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : null;
}

function componentToHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
}

function normalizeColor(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed.slice(1).split("").map((part) => `${part}${part}`).join("")}`;
  }
  const rgb = trimmed.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)/i);
  if (rgb) return `#${componentToHex(Number(rgb[1]))}${componentToHex(Number(rgb[2]))}${componentToHex(Number(rgb[3]))}`;
  const named: Record<string, string> = { white: "#ffffff", black: "#000000", transparent: "transparent" };
  return named[trimmed] ?? null;
}

function parseDeclarations(block: string) {
  const entries: Array<[string, string]> = [];
  block.split(";").forEach((part) => {
    const separator = part.indexOf(":");
    if (separator < 1) return;
    const property = part.slice(0, separator).trim().toLowerCase();
    const value = part.slice(separator + 1).trim().replace(/\s*!important\s*$/i, "");
    if (property && value) entries.push([property, value]);
  });
  return entries;
}

function declarationMap(entries: Array<[string, string]>) {
  return Object.fromEntries(entries);
}

function findRule(css: string, matcher: (selector: string) => boolean) {
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = ruleRegex.exec(css))) {
    const selector = match[1].trim();
    if (selector.startsWith("@") || !matcher(selector)) continue;
    return { selector, body: match[2], entries: parseDeclarations(match[2]) };
  }
  return null;
}

function parseGradient(value: string | undefined) {
  if (!value) return null;
  const match = value.match(/linear-gradient\(\s*(-?\d+(?:\.\d+)?)deg\s*,\s*([^,]+)\s*,\s*([^\)]+)\)/i);
  if (!match) return null;
  const first = normalizeColor(match[2]);
  const second = normalizeColor(match[3]);
  if (!first || !second || first === "transparent" || second === "transparent") return null;
  return { angle: Math.round(Number(match[1])), first, second };
}

function parseBorder(value: string | undefined) {
  if (!value || /^(none|0(?:px)?\s)/i.test(value.trim())) return null;
  const width = value.match(/(\d+(?:\.\d+)?)px/);
  const style = value.match(/\b(solid|dashed|dotted|double)\b/i);
  const colorToken = value.match(/(#[0-9a-f]{3,8}|rgba?\([^)]*\)|\bblack\b|\bwhite\b)/i);
  const color = normalizeColor(colorToken?.[1]);
  return {
    width: width ? Math.max(1, Math.round(Number(width[1]))) : null,
    style: style?.[1]?.toLowerCase() as ButtonBorderStyle | undefined,
    color: color && color !== "transparent" ? color : null,
  };
}

function parseShadow(value: string | undefined) {
  if (!value || value.trim() === "none") return null;
  const first = value.split(/,(?![^()]*\))/)[0].trim();
  const inset = /\binset\b/i.test(first);
  const lengths = [...first.matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((match) => Number(match[1]));
  if (lengths.length < 2) return null;
  const colorToken = first.match(/(#[0-9a-f]{3,8}|rgba?\([^)]*\)|\bblack\b|\bwhite\b)/i)?.[1];
  const color = normalizeColor(colorToken) ?? "#000000";
  const alphaMatch = colorToken?.match(/rgba\([^,]+,[^,]+,[^,]+,\s*(\d*\.?\d+)\s*\)/i);
  return {
    x: lengths[0] ?? 0,
    y: lengths[1] ?? 0,
    blur: Math.max(0, lengths[2] ?? 0),
    spread: lengths[3] ?? 0,
    color: color === "transparent" ? "#000000" : color,
    opacity: alphaMatch ? Math.max(0, Math.min(1, Number(alphaMatch[1]))) : 0.24,
    inset,
  };
}

function parseTransform(value: string | undefined) {
  const translateMatch = value?.match(/translateY\(\s*(-?(?:\d+(?:\.\d+)?|\.\d+))px\s*\)/i);
  const scaleMatch = value?.match(/scale\(\s*((?:\d+(?:\.\d+)?|\.\d+))\s*\)/i);
  return {
    translateY: translateMatch ? Number(translateMatch[1]) : null,
    scale: scaleMatch ? Number(scaleMatch[1]) : null,
  };
}

function parseBaseRule(entries: Array<[string, string]>, base: ButtonGeneratorConfig) {
  const map = declarationMap(entries);
  const next: ButtonGeneratorConfig = { ...base };
  const consumed = new Set<string>();
  let matched = 0;
  const use = (...properties: string[]) => properties.forEach((property) => consumed.add(property));
  const hit = (count = 1) => { matched += count; };

  const gradient = parseGradient(map.background) ?? parseGradient(map["background-image"]);
  if (gradient) {
    next.style = "gradient";
    next.background = gradient.first;
    next.background2 = gradient.second;
    next.gradientAngle = ((gradient.angle % 360) + 360) % 360;
    use("background", "background-image");
    hit(3);
  } else {
    const background = normalizeColor(map["background-color"] ?? map.background);
    if (background) {
      if (background === "transparent") next.style = map.border && map.border !== "none" ? "outline" : "ghost";
      else { next.style = "solid"; next.background = background; }
      use("background", "background-color");
      hit();
    }
  }

  const textColor = normalizeColor(map.color);
  if (textColor && textColor !== "transparent") { next.textColor = textColor; use("color"); hit(); }

  const padding = map.padding?.trim().split(/\s+/);
  if (padding?.length) {
    const y = parsePx(padding[0]);
    const x = parsePx(padding[1] ?? padding[0]);
    if (x !== null && y !== null) { next.paddingX = x; next.paddingY = y; use("padding"); hit(2); }
  }
  const px = parsePx(map["padding-inline"]);
  if (px !== null) { next.paddingX = px; use("padding-inline"); hit(); }
  const py = parsePx(map["padding-block"]);
  if (py !== null) { next.paddingY = py; use("padding-block"); hit(); }

  const radius = parsePx(map["border-radius"]);
  if (radius !== null) {
    next.radius = Math.min(999, radius);
    next.shape = radius >= 80 ? "pill" : radius === 0 ? "square" : "rounded";
    use("border-radius"); hit();
  }

  const border = parseBorder(map.border);
  if (border) {
    next.borderEnabled = true;
    if (border.width !== null) next.borderWidth = border.width;
    if (border.style) next.borderStyle = border.style;
    if (border.color) next.borderColor = border.color;
    if ((map.background ?? map["background-color"])?.trim() === "transparent") next.style = "outline";
    use("border"); hit();
  }
  const borderWidth = parsePx(map["border-width"]);
  if (borderWidth !== null) { next.borderEnabled = true; next.borderWidth = Math.max(1, borderWidth); use("border-width"); hit(); }
  if (["solid", "dashed", "dotted", "double"].includes(map["border-style"])) { next.borderEnabled = true; next.borderStyle = map["border-style"] as ButtonBorderStyle; use("border-style"); hit(); }
  const borderColor = normalizeColor(map["border-color"]);
  if (borderColor && borderColor !== "transparent") { next.borderEnabled = true; next.borderColor = borderColor; use("border-color"); hit(); }

  const fontSize = parsePx(map["font-size"]);
  if (fontSize !== null) { next.fontSize = fontSize; use("font-size"); hit(); }
  const fontWeight = parseNumber(map["font-weight"]);
  if (fontWeight !== null) { next.fontWeight = Math.max(100, Math.min(900, Math.round(fontWeight / 100) * 100)); use("font-weight"); hit(); }
  const lineHeight = parseNumber(map["line-height"]);
  if (lineHeight !== null) { next.lineHeight = lineHeight; use("line-height"); hit(); }
  const letterSpacing = parsePx(map["letter-spacing"]);
  if (letterSpacing !== null) { next.letterSpacing = letterSpacing; use("letter-spacing"); hit(); }

  const minWidth = parsePx(map["min-width"]);
  if (minWidth !== null) { next.minWidth = minWidth; use("min-width"); hit(); }
  if (map.width?.trim() === "100%") { next.fullWidth = true; use("width"); hit(); }
  if (map["text-transform"]?.toLowerCase() === "uppercase") { next.uppercase = true; use("text-transform"); hit(); }
  if (map["text-transform"]?.toLowerCase() === "none") { next.uppercase = false; use("text-transform"); hit(); }

  const shadow = parseShadow(map["box-shadow"]);
  if (map["box-shadow"]?.trim() === "none") { next.shadowEnabled = false; use("box-shadow"); hit(); }
  else if (shadow) {
    next.shadowEnabled = true;
    next.shadowX = shadow.x;
    next.shadowY = shadow.y;
    next.shadowBlur = shadow.blur;
    next.shadowSpread = shadow.spread;
    next.shadowColor = shadow.color;
    next.shadowOpacity = shadow.opacity;
    next.shadowInset = shadow.inset;
    use("box-shadow"); hit();
  }

  const duration = map.transition?.match(/(\d+(?:\.\d+)?)(ms|s)\b/i);
  if (duration) {
    next.motionDuration = Math.round(Number(duration[1]) * (duration[2].toLowerCase() === "s" ? 1000 : 1));
    const easing = map.transition.match(/\b(ease-out|ease-in-out|ease|linear)\b/i)?.[1]?.toLowerCase();
    if (easing) next.motionEasing = easing as ButtonGeneratorConfig["motionEasing"];
    use("transition"); hit(easing ? 2 : 1);
  }

  const unknown = entries.filter(([property]) => !consumed.has(property));
  if (unknown.length) next.customCss = sanitizeCustomCssOverrides(unknown.map(([property, value]) => `${property}: ${value};`).join("\n"));
  else next.customCss = "";
  return { next, matched, unknownCount: unknown.length };
}

export function importButtonCss(css: string, baseConfig: ButtonGeneratorConfig): CssImportResult {
  const input = css.slice(0, 18000).replace(/\/\*[\s\S]*?\*\//g, "");
  const baseRule = findRule(input, (selector) => !/:hover|:active|:focus|:disabled|\.is-preview-/i.test(selector) && (/\bbutton\b/i.test(selector) || /[.#][a-zA-Z_][\w-]*/.test(selector)));
  if (!baseRule) return { config: baseConfig, matchedProperties: 0, warnings: ["No standard CSS rule was found."], selector: null };

  const { next, matched: baseMatched, unknownCount } = parseBaseRule(baseRule.entries, baseConfig);
  let matched = baseMatched;
  const warnings: string[] = [];

  const classMatch = baseRule.selector.match(/\.([a-zA-Z_][\w-]*)/);
  if (classMatch) next.className = classMatch[1];

  const hoverRule = findRule(input, (selector) => /:hover|\.is-preview-hover/i.test(selector));
  if (hoverRule) {
    const map = declarationMap(hoverRule.entries);
    const background = normalizeColor(map["background-color"] ?? map.background);
    const color = normalizeColor(map.color);
    const borderColor = normalizeColor(map["border-color"]);
    const transform = parseTransform(map.transform);
    const shadow = parseShadow(map["box-shadow"]);
    let hoverMatched = 0;
    if (background && background !== "transparent") { next.hoverBackground = background; hoverMatched++; }
    if (color && color !== "transparent") { next.hoverTextColor = color; hoverMatched++; }
    if (borderColor && borderColor !== "transparent") { next.hoverBorderColor = borderColor; hoverMatched++; }
    if (transform.translateY !== null) { next.hoverTranslateY = transform.translateY; hoverMatched++; }
    if (transform.scale !== null) { next.hoverScale = transform.scale; hoverMatched++; }
    if (shadow) { next.hoverShadowY = shadow.y; next.hoverShadowBlur = shadow.blur; hoverMatched++; }
    if (hoverMatched) { next.customizeHoverState = true; matched += hoverMatched; }
  }

  const activeRule = findRule(input, (selector) => /:active|\.is-preview-active/i.test(selector));
  if (activeRule) {
    const map = declarationMap(activeRule.entries);
    const background = normalizeColor(map["background-color"] ?? map.background);
    const color = normalizeColor(map.color);
    const borderColor = normalizeColor(map["border-color"]);
    const transform = parseTransform(map.transform);
    let activeMatched = 0;
    if (background && background !== "transparent") { next.activeBackground = background; activeMatched++; }
    if (color && color !== "transparent") { next.activeTextColor = color; activeMatched++; }
    if (borderColor && borderColor !== "transparent") { next.activeBorderColor = borderColor; activeMatched++; }
    if (transform.translateY !== null) { next.activeTranslateY = transform.translateY; activeMatched++; }
    if (transform.scale !== null) { next.activeScale = transform.scale; activeMatched++; }
    if (activeMatched) { next.activeEffect = true; next.customizeActiveState = true; matched += activeMatched; }
  }

  const mobileWidthRule = /@media\s*\([^)]*max-width\s*:\s*(?:640|639|600|576)px[^)]*\)\s*\{[\s\S]*?width\s*:\s*100%\s*;?[\s\S]*?\}/i.test(input);
  if (mobileWidthRule && !next.fullWidth) { next.mobileFullWidth = true; matched++; }

  const focusRule = findRule(input, (selector) => /:focus(?:-visible)?|\.is-preview-focus/i.test(selector));
  if (focusRule) {
    const map = declarationMap(focusRule.entries);
    const outline = map.outline?.match(/(\d+(?:\.\d+)?)px\s+\w+\s+(#[0-9a-f]{3,8}|rgba?\([^)]*\)|\bblack\b|\bwhite\b)/i);
    const offset = parsePx(map["outline-offset"]);
    if (outline) {
      const color = normalizeColor(outline[2]);
      next.includeFocusRing = true;
      next.focusRingWidth = Math.max(1, Number(outline[1]));
      if (color && color !== "transparent") next.focusRingColor = color;
      matched += 2;
    }
    if (offset !== null) { next.focusRingOffset = offset; matched++; }
  }

  if (unknownCount) warnings.push(`${unknownCount} base declaration${unknownCount === 1 ? "" : "s"} could not be mapped to controls and were kept as scoped custom CSS.`);
  if (!hoverRule) warnings.push("No hover rule was detected; the current hover preset remains in place.");
  if (matched === 0) warnings.push("The CSS was readable, but none of its declarations matched the studio controls.");

  return { config: next, matchedProperties: matched, warnings, selector: baseRule.selector };
}

export function getButtonLearningNotes(config: ButtonGeneratorConfig): ButtonLearningNote[] {
  const radius = config.shape === "pill" ? 999 : config.shape === "square" ? 0 : config.radius;
  const background = config.style === "gradient"
    ? `linear-gradient(${config.gradientAngle}deg, ${config.background}, ${config.background2})`
    : config.style === "outline" || config.style === "ghost"
      ? "transparent"
      : config.background;
  const shadow = config.shadowEnabled
    ? `${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px ${config.shadowSpread}px ${config.shadowColor}`
    : "none";
  const notes: ButtonLearningNote[] = [
    { label: "Background", css: `background: ${background};`, explanation: "Sets the main fill. Gradients combine two colors at the selected angle." },
    { label: "Shape", css: `border-radius: ${radius}px;`, explanation: "Controls how sharp, rounded, or pill-shaped the button appears." },
    { label: "Spacing", css: `padding: ${config.paddingY}px ${config.paddingX}px;`, explanation: "Vertical and horizontal padding define the button's visual and touch size." },
    { label: "Typography", css: `font: ${config.fontWeight} ${config.fontSize}px/${config.lineHeight} inherit;`, explanation: "Font size, weight, and line height determine label hierarchy and height." },
    { label: "Shadow", css: `box-shadow: ${shadow};`, explanation: "Shadow creates depth or glow; keep blur and opacity controlled for cleaner UI." },
    { label: "Motion", css: `transition-duration: ${config.motionDuration}ms;`, explanation: "Transition timing controls how quickly hover and press feedback settle." },
  ];
  if (config.includeFocusRing) notes.push({ label: "Keyboard focus", css: `outline: ${config.focusRingWidth}px solid ${config.focusRingColor};`, explanation: "A visible :focus-visible ring helps keyboard users keep track of focus." });
  if (config.customCss) notes.push({ label: "Custom override", css: config.customCss.split("\n")[0] ?? "", explanation: "Custom declarations are appended after the generated base declarations, so they win in the cascade." });
  return notes;
}
