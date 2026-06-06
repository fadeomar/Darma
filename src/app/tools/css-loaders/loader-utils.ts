import type { CSSProperties } from "react";
import type { LoaderCategory, LoaderCustomizationState, LoaderDefinition, LoaderFormat, LoaderIndexItem } from "./types";
import type { LoaderFilterState, LoaderSortKey } from "./filter-utils";

export const DEFAULT_LOADER_FILTERS: LoaderFilterState = {
  query: "",
  category: "all",
  format: "all",
  sort: "popular",
  savedOnly: false,
};

export const LOADER_CATEGORIES: LoaderCategory[] = [
  "all",
  "popular",
  "dots",
  "spinners",
  "bars",
  "pulse",
  "skeleton",
  "button",
  "progress",
  "minimal",
  "fun",
  "tailwind",
  "creative",
];

export const LOADER_FORMATS: Array<"all" | LoaderFormat> = ["all", "html", "css", "react", "tailwind"];

type LoaderControlAvailability = LoaderDefinition["controls"];

const VAR_CALL_PATTERN = /var\([^)]*\)/g;
const TIME_TOKEN_PATTERN = /(^|[^\w.-])(\d*\.?\d+)(ms|s)\b/g;
const ANIMATION_DECLARATION_PATTERN = /(^|[;{}\n]\s*)(animation(?:-duration)?\s*:\s*)([^;{}]+)/gi;
const TIMING_VARIABLE_PATTERN = /(--[a-z0-9_-]*(?:time|speed|duration|animation)[a-z0-9_-]*\s*:\s*)([^;{}]+)/gi;
const LOADER_SPEED_VAR_FALLBACK_PATTERN = /var\(\s*--loader-speed\s*,\s*(\d*\.?\d+)(ms|s)\s*\)/i;

export function formatLoaderLabel(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getLoaderSearchText(loader: LoaderIndexItem) {
  if (loader.searchText) return loader.searchText;

  const activeFlags = Object.entries(loader.flags)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key);

  return [loader.id, loader.name, loader.category, ...loader.tags, ...loader.formats, ...activeFlags]
    .join(" ")
    .toLowerCase();
}

export function sortLoaders(loaders: LoaderIndexItem[], sort: LoaderSortKey) {
  return [...loaders].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);

    return Number(Boolean(b.flags.popular)) - Number(Boolean(a.flags.popular)) || a.name.localeCompare(b.name);
  });
}

export function getLoaderFormatLabel(format: "all" | LoaderFormat) {
  if (format === "all") return "All formats";
  if (format === "css") return "HTML + CSS";
  return format.toUpperCase();
}

function maskVarCalls(css: string): { masked: string; restore: (input: string) => string } {
  const calls: string[] = [];
  const masked = css.replace(VAR_CALL_PATTERN, (match) => {
    const placeholder = `__LOADER_VAR_${calls.length}__`;
    calls.push(match);
    return placeholder;
  });

  return {
    masked,
    restore: (input: string) => calls.reduce((output, call, index) => output.replace(`__LOADER_VAR_${index}__`, call), input),
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function expandShortHex(hex: string) {
  const cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    return `#${cleaned[0]}${cleaned[0]}${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}`;
  }
  return hex;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = expandShortHex(hex).replace("#", "").toLowerCase();
  if (cleaned.length !== 6 || !/^[0-9a-f]{6}$/.test(cleaned)) return null;

  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  };
}

function isHexColor(value?: string) {
  return Boolean(value && /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value));
}

function containsDefaultColorValue(css: string, value?: string) {
  if (!isHexColor(value)) return false;
  const expanded = expandShortHex(value as string);
  const values = new Set([value as string, expanded]);
  return [...values].some((color) => new RegExp(`${escapeRegExp(color)}(?![0-9a-fA-F])`, "i").test(css));
}

function countCssVariableUses(css: string, variableName: string) {
  return (css.match(new RegExp(`var\\(\\s*${escapeRegExp(variableName)}\\b`, "g")) ?? []).length;
}

function hasMeaningfulVariableUse(css: string, variableName: string) {
  const uses = countCssVariableUses(css, variableName);
  if (uses === 0) return false;

  const relevantLines = css
    .split(/\n|}/)
    .filter((line) => line.includes(`var(${variableName}`) || line.includes(`var( ${variableName}`));

  return relevantLines.some((line) => !/^\s*(?:--[a-z0-9_-]+|color)\s*:/i.test(line.trim()));
}

function getTimeTokens(value: string) {
  const tokens: number[] = [];

  for (const match of value.matchAll(TIME_TOKEN_PATTERN)) {
    const amount = Number(match[2]);
    if (!Number.isFinite(amount)) continue;
    tokens.push(match[3] === "ms" ? amount / 1000 : amount);
  }

  return tokens;
}

function getAnimationTimeTokens(css: string) {
  const tokens: number[] = [];

  ANIMATION_DECLARATION_PATTERN.lastIndex = 0;
  TIMING_VARIABLE_PATTERN.lastIndex = 0;

  for (const match of css.matchAll(ANIMATION_DECLARATION_PATTERN)) {
    tokens.push(...getTimeTokens(match[3]));
  }

  for (const match of css.matchAll(TIMING_VARIABLE_PATTERN)) {
    tokens.push(...getTimeTokens(match[2]));
  }

  return tokens.filter((value) => value > 0);
}

function hasCustomizableAnimationTiming(css: string) {
  ANIMATION_DECLARATION_PATTERN.lastIndex = 0;
  TIMING_VARIABLE_PATTERN.lastIndex = 0;
  return ANIMATION_DECLARATION_PATTERN.test(css) || TIMING_VARIABLE_PATTERN.test(css);
}

function getLoaderSpeedVariableFallback(css: string) {
  const match = css.match(LOADER_SPEED_VAR_FALLBACK_PATTERN);
  if (!match) return undefined;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return match[2] === "ms" ? amount / 1000 : amount;
}

export function getLoaderBaseAnimationSpeed(loader: LoaderDefinition) {
  const speedVariableFallback = getLoaderSpeedVariableFallback(loader.code.css);
  if (speedVariableFallback) return speedVariableFallback;

  const cssDurations = getAnimationTimeTokens(loader.code.css);
  const cssBase = cssDurations.length ? Math.max(...cssDurations) : undefined;
  const defaultSpeed = typeof loader.defaults.speed === "number" && Number.isFinite(loader.defaults.speed) ? loader.defaults.speed : undefined;

  return cssBase ?? defaultSpeed ?? 1;
}

export function getEffectiveLoaderControls(loader: LoaderDefinition): LoaderControlAvailability {
  const css = loader.code.css;

  const colorSupported =
    hasMeaningfulVariableUse(css, "--loader-color") ||
    containsDefaultColorValue(css, loader.defaults.color) ||
    /currentColor\b/.test(css);

  const secondarySupported = hasMeaningfulVariableUse(css, "--loader-secondary-color") || containsDefaultColorValue(css, loader.defaults.secondaryColor);
  const backgroundSupported = hasMeaningfulVariableUse(css, "--loader-bg") || containsDefaultColorValue(css, loader.defaults.background);

  return {
    color: Boolean(loader.controls.color && colorSupported),
    secondaryColor: Boolean(loader.controls.secondaryColor && secondarySupported),
    size: Boolean(loader.controls.size),
    speed: Boolean(loader.controls.speed && hasCustomizableAnimationTiming(css)),
    background: Boolean(loader.controls.background && backgroundSupported),
  };
}

export function getDefaultLoaderCustomization(loader: LoaderDefinition): LoaderCustomizationState {
  return {
    color: loader.defaults.color ?? "#6366f1",
    secondaryColor: loader.defaults.secondaryColor ?? "#a5b4fc",
    size: loader.defaults.size ?? 56,
    speed: getEffectiveLoaderControls(loader).speed ? getLoaderBaseAnimationSpeed(loader) : loader.defaults.speed ?? 1,
    background: loader.defaults.background ?? "#ffffff",
  };
}

export function getLoaderInlineStyle(customization: LoaderCustomizationState, baseSize = 56): CSSProperties {
  const safeBaseSize = Math.max(baseSize || 56, 1);
  const scale = Math.max(customization.size, 12) / safeBaseSize;

  return {
    color: customization.color,
    "--loader-color": customization.color,
    "--loader-secondary-color": customization.secondaryColor,
    "--loader-size": `${customization.size}px`,
    "--loader-scale": String(Number(scale.toFixed(3))),
    "--loader-speed": `${customization.speed}s`,
    "--loader-bg": customization.background,
  } as CSSProperties;
}

export function buildLoaderCssVariables(selector: string, customization: LoaderCustomizationState) {
  return [
    `${selector} {`,
    `  color: ${customization.color};`,
    `  --loader-color: ${customization.color};`,
    `  --loader-secondary-color: ${customization.secondaryColor};`,
    `  --loader-size: ${customization.size}px;`,
    `  --loader-speed: ${customization.speed}s;`,
    `  --loader-bg: ${customization.background};`,
    "}",
  ].join("\n");
}

function replaceColorWithVariable(css: string, value: string | undefined, variableName: string) {
  if (!isHexColor(value)) return css;

  const replacement = `var(${variableName}, ${value})`;
  const { masked, restore } = maskVarCalls(css);
  let output = masked;
  const expanded = expandShortHex(value as string);
  const colors = new Set([value as string, expanded]);

  for (const color of colors) {
    output = output.replace(new RegExp(`${escapeRegExp(color)}(?![0-9a-fA-F])`, "gi"), replacement);
  }

  const rgb = hexToRgb(value as string);
  if (rgb) {
    output = output.replace(new RegExp(`rgb\\(\\s*${rgb.r}\\s*,\\s*${rgb.g}\\s*,\\s*${rgb.b}\\s*\\)`, "gi"), replacement);
    output = output.replace(new RegExp(`rgba\\(\\s*${rgb.r}\\s*,\\s*${rgb.g}\\s*,\\s*${rgb.b}\\s*,\\s*([0-9.]+)\\s*\\)`, "gi"), (_match, alpha) => {
      const alphaNumber = Number(alpha);
      if (!Number.isFinite(alphaNumber)) return replacement;
      const percent = Math.max(0, Math.min(100, Math.round(alphaNumber * 100)));
      if (percent >= 100) return replacement;
      if (percent <= 0) return "transparent";
      return `color-mix(in srgb, ${replacement} ${percent}%, transparent)`;
    });
  }

  return restore(output);
}

function injectCustomizationVariables(css: string, loader: LoaderDefinition, controls: LoaderControlAvailability) {
  let output = css;

  if (controls.color) {
    output = replaceColorWithVariable(output, loader.defaults.color, "--loader-color");
  }

  if (controls.secondaryColor) {
    output = replaceColorWithVariable(output, loader.defaults.secondaryColor, "--loader-secondary-color");
  }

  if (controls.background) {
    output = replaceColorWithVariable(output, loader.defaults.background, "--loader-bg");
  }

  return output;
}

function scaleTimeValue(value: string, factor: number) {
  const scaled = value.replace(TIME_TOKEN_PATTERN, (_match, prefix: string, amount: string, unit: string) => {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric)) return `${prefix}${amount}${unit}`;
    const seconds = unit === "ms" ? numeric / 1000 : numeric;
    const scaledSeconds = Math.max(0.001, seconds * factor);
    const rounded = Number(scaledSeconds.toFixed(3));
    return `${prefix}${rounded}s`;
  });

  return scaled;
}

function scaleAnimationTimings(css: string, factor: number) {
  if (!Number.isFinite(factor) || factor <= 0 || Math.abs(factor - 1) < 0.001) return css;

  const { masked, restore } = maskVarCalls(css);

  const scaled = masked
    .replace(ANIMATION_DECLARATION_PATTERN, (_match, lead: string, prefix: string, value: string) => `${lead}${prefix}${scaleTimeValue(value, factor)}`)
    .replace(TIMING_VARIABLE_PATTERN, (_match, prefix: string, value: string) => `${prefix}${scaleTimeValue(value, factor)}`);

  return restore(scaled);
}

export function buildCustomizedLoaderCss(loader: LoaderDefinition, customization: LoaderCustomizationState) {
  const baseSize = loader.defaults.size ?? 56;
  const scale = Math.max(customization.size, 12) / Math.max(baseSize, 1);
  const controls = getEffectiveLoaderControls(loader);
  const scopedSelector = `.darma-loader-${loader.id}-preview`;
  let customizedCss = injectCustomizationVariables(loader.code.css.trim(), loader, controls);

  if (controls.speed) {
    const baseSpeed = Math.max(getLoaderBaseAnimationSpeed(loader), 0.001);
    customizedCss = scaleAnimationTimings(customizedCss, customization.speed / baseSpeed);
  }

  const rules = [buildLoaderCssVariables(scopedSelector, customization), "", customizedCss];

  if (controls.size) {
    rules.push("/* Size bridge */");
    rules.push(`${scopedSelector} .css-loader-custom-scale {\n  transform: scale(${Number(scale.toFixed(3))});\n  transform-origin: center;\n}`);
  }

  return rules.join("\n").trim() + "\n";
}

export function buildCustomizedLoaderHtml(loader: LoaderDefinition, customization?: LoaderCustomizationState) {
  if (!customization) return loader.code.html.trim();

  return [
    `<div class="darma-loader-${loader.id}-preview" style="color: ${customization.color}; --loader-color: ${customization.color}; --loader-secondary-color: ${customization.secondaryColor}; --loader-size: ${customization.size}px; --loader-speed: ${customization.speed}s; --loader-bg: ${customization.background};">`,
    `  <div class="css-loader-custom-scale">${loader.code.html.trim()}</div>`,
    "</div>",
  ].join("\n");
}

function toCamelCaseAttribute(attributeName: string) {
  if (attributeName === "class") return "className";
  if (attributeName === "for") return "htmlFor";
  if (attributeName === "xlink:href") return "href";
  if (attributeName.includes(":")) {
    return attributeName.replace(/:([a-z])/g, (_match, char: string) => char.toUpperCase());
  }
  if (attributeName.startsWith("data-") || attributeName.startsWith("aria-")) return attributeName;

  return attributeName.replace(/-([a-z])/g, (_match, char: string) => char.toUpperCase());
}

function toStyleKey(propertyName: string) {
  const trimmed = propertyName.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("--")) return JSON.stringify(trimmed);
  return trimmed.replace(/-([a-z])/g, (_match, char: string) => char.toUpperCase());
}

function escapeJsString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function convertStyleAttribute(styleValue: string) {
  const declarations = styleValue
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separatorIndex = declaration.indexOf(":");
      if (separatorIndex === -1) return null;

      const key = toStyleKey(declaration.slice(0, separatorIndex));
      const value = declaration.slice(separatorIndex + 1).trim();
      if (!key || !value) return null;

      return `${key}: "${escapeJsString(value)}"`;
    })
    .filter((declaration): declaration is string => Boolean(declaration));

  if (!declarations.length) return "style={{}}";
  return `style={{ ${declarations.join(", ")} } as CSSProperties}`;
}

function htmlToJsx(html: string) {
  return html
    .replace(/style=([\'\"])([\s\S]*?)\1/g, (_match, _quote: string, styleValue: string) => convertStyleAttribute(styleValue))
    .replace(/\s([a-zA-Z_:][\w:.-]*)=/g, (_match, attributeName: string) => ` ${toCamelCaseAttribute(attributeName)}=`)
    .replace(/<!--([\s\S]*?)-->/g, "{/*$1*/}");
}

export function buildCustomizedReactCode(loader: LoaderDefinition, customization: LoaderCustomizationState) {
  const componentName = `${loader.id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}Loader`;

  return `import type { CSSProperties } from "react";\n\nexport default function ${componentName}() {\n  return (\n    <div\n      className="darma-loader-${loader.id}-preview"\n      style={\n        {\n          color: "${customization.color}",\n          "--loader-color": "${customization.color}",\n          "--loader-secondary-color": "${customization.secondaryColor}",\n          "--loader-size": "${customization.size}px",\n          "--loader-speed": "${customization.speed}s",\n          "--loader-bg": "${customization.background}",\n        } as CSSProperties\n      }\n    >\n      <div className="css-loader-custom-scale">\n        ${htmlToJsx(loader.code.html.trim())}\n      </div>\n    </div>\n  );\n}\n`;
}

export function buildCustomizedTailwindCode(loader: LoaderDefinition, customization: LoaderCustomizationState) {
  if (!loader.code.tailwind) return undefined;

  return [
    `{/* color ${customization.color}, size ${customization.size}px, speed ${customization.speed}s */}`,
    loader.code.tailwind.trim(),
  ].join("\n");
}
