import type { LoaderSourceDefinition } from "../../src/app/tools/css-loaders/types";
import { fail, validateScopedCssSafety } from "./validate-loader.ts";

const CLASS_PATTERN = /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g;
const HTML_CLASS_PATTERN = /class=(['"])(.*?)\1/g;
const KEYFRAMES_PATTERN = /@keyframes\s+([_a-zA-Z][_a-zA-Z0-9-]*)/g;
const VAR_CALL_PATTERN = /var\([^)]*\)/g;

type TransformResult = {
  html: string;
  css: string;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toScopedClassName(id: string, className: string) {
  if (className === "loader") return `darma-loader-${id}`;

  const shortName = className.replace(/^loader[-_]?/, "");
  return `darma-loader-${id}__${shortName || className}`;
}

function collectClassNames(html: string, css: string) {
  const classNames = new Set<string>();

  for (const match of html.matchAll(HTML_CLASS_PATTERN)) {
    match[2]
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => classNames.add(item));
  }

  for (const match of css.matchAll(CLASS_PATTERN)) {
    classNames.add(match[1]);
  }

  return [...classNames].sort((a, b) => b.length - a.length || a.localeCompare(b));
}

function collectKeyframeNames(css: string) {
  return [...css.matchAll(KEYFRAMES_PATTERN)].map((match) => match[1]);
}

function scopeHtml(html: string, classMap: Map<string, string>) {
  return html.replace(HTML_CLASS_PATTERN, (_match, quote: string, rawClassNames: string) => {
    const scopedClassNames = rawClassNames
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((className) => classMap.get(className) ?? className)
      .join(" ");

    return `class=${quote}${scopedClassNames}${quote}`;
  });
}

function scopeKeyframes(css: string, id: string) {
  let output = css;

  for (const keyframeName of collectKeyframeNames(css)) {
    const scopedKeyframeName = `darma-loader-${id}-${keyframeName}`;
    const keyframeNamePattern = new RegExp(String.raw`(@keyframes\s+)${escapeRegExp(keyframeName)}\b`, "g");
    const animationValuePattern = new RegExp(String.raw`\b${escapeRegExp(keyframeName)}\b`, "g");

    output = output.replace(keyframeNamePattern, `$1${scopedKeyframeName}`);
    output = output.replace(/(animation(?:-name)?\s*:\s*)([^;{}]+)/g, (_match, prefix: string, value: string) => {
      return `${prefix}${value.replace(animationValuePattern, scopedKeyframeName)}`;
    });
  }

  return output;
}

function scopeCss(css: string, id: string, classMap: Map<string, string>) {
  let output = scopeKeyframes(css, id);

  for (const [className, scopedClassName] of classMap.entries()) {
    output = output.replace(new RegExp(String.raw`\.${escapeRegExp(className)}(?![_a-zA-Z0-9-])`, "g"), `.${scopedClassName}`);
  }

  return output;
}

function withLoaderVariableFallbacks(css: string, definition: LoaderSourceDefinition) {
  const defaults = {
    color: definition.defaults?.color ?? "#6366f1",
    secondaryColor: definition.defaults?.secondaryColor ?? "#a5b4fc",
    size: `${definition.defaults?.size ?? 56}px`,
    speed: `${definition.defaults?.speed ?? 1}s`,
    background: definition.defaults?.background ?? "transparent",
  };

  return css
    .replace(/var\(\s*--loader-color\s*\)/g, `var(--loader-color, ${defaults.color})`)
    .replace(/var\(\s*--loader-secondary-color\s*\)/g, `var(--loader-secondary-color, ${defaults.secondaryColor})`)
    .replace(/var\(\s*--loader-size\s*\)/g, `var(--loader-size, ${defaults.size})`)
    .replace(/var\(\s*--loader-speed\s*\)/g, `var(--loader-speed, ${defaults.speed})`)
    .replace(/var\(\s*--loader-bg\s*\)/g, `var(--loader-bg, ${defaults.background})`);
}

function expandShortHex(hex: string): string {
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

function maskVarCalls(css: string): { masked: string; restore: (input: string) => string } {
  const calls: string[] = [];
  const masked = css.replace(VAR_CALL_PATTERN, (match) => {
    const placeholder = `__VAR_${calls.length}__`;
    calls.push(match);
    return placeholder;
  });
  return {
    masked,
    restore: (input: string) => {
      let output = input;
      for (let i = 0; i < calls.length; i++) {
        output = output.replace(`__VAR_${i}__`, calls[i]);
      }
      return output;
    },
  };
}

/**
 * Replace hardcoded color values matching the loader's defaults with var(--loader-*, default) expressions.
 * Skips matches inside existing var() calls to avoid double-wrapping fallbacks.
 */
function injectLoaderVariables(css: string, definition: LoaderSourceDefinition): string {
  const defaults = definition.defaults;
  if (!defaults) return css;

  const colorMappings: Array<{ value: string; varName: string }> = [];
  if (defaults.color) colorMappings.push({ value: defaults.color, varName: "--loader-color" });
  if (defaults.secondaryColor) colorMappings.push({ value: defaults.secondaryColor, varName: "--loader-secondary-color" });
  if (defaults.background && defaults.background !== "transparent") {
    colorMappings.push({ value: defaults.background, varName: "--loader-bg" });
  }

  if (!colorMappings.length) return css;

  const { masked, restore } = maskVarCalls(css);
  let output = masked;

  for (const { value, varName } of colorMappings) {
    if (!value.startsWith("#")) continue;

    const expanded = expandShortHex(value);
    const rgb = hexToRgb(expanded);
    const replacement = `var(${varName}, ${value})`;

    // Replace expanded 6-digit hex (case-insensitive, with boundary)
    const expandedPattern = new RegExp(escapeRegExp(expanded) + "(?![0-9a-fA-F])", "gi");
    output = output.replace(expandedPattern, replacement);

    // Replace original (possibly short) hex if different from expanded
    if (value.toLowerCase() !== expanded.toLowerCase()) {
      const originalPattern = new RegExp(escapeRegExp(value) + "(?![0-9a-fA-F])", "gi");
      output = output.replace(originalPattern, replacement);
    }

    if (rgb) {
      // rgb(r, g, b)
      const rgbPattern = new RegExp(`rgb\\(\\s*${rgb.r}\\s*,\\s*${rgb.g}\\s*,\\s*${rgb.b}\\s*\\)`, "g");
      output = output.replace(rgbPattern, replacement);

      // rgba(r, g, b, alpha) — convert to color-mix for transparency control
      const rgbaPattern = new RegExp(`rgba\\(\\s*${rgb.r}\\s*,\\s*${rgb.g}\\s*,\\s*${rgb.b}\\s*,\\s*([0-9.]+)\\s*\\)`, "g");
      output = output.replace(rgbaPattern, (_, alpha) => {
        const alphaNum = parseFloat(alpha);
        if (!Number.isFinite(alphaNum)) return replacement;
        const percent = Math.max(0, Math.min(100, Math.round(alphaNum * 100)));
        if (percent >= 100) return replacement;
        if (percent <= 0) return "transparent";
        return `color-mix(in srgb, ${replacement} ${percent}%, transparent)`;
      });
    }
  }

  return restore(output);
}

function validateScopedOutput(definition: LoaderSourceDefinition, scoped: TransformResult, filename: string) {
  const expectedRootClass = `darma-loader-${definition.id}`;

  if (!scoped.html.includes(expectedRootClass)) {
    fail(`${filename}: generated preview HTML does not contain scoped root class "${expectedRootClass}".`);
  }

  if (!scoped.css.includes(`.${expectedRootClass}`)) {
    fail(`${filename}: generated preview CSS does not contain scoped root selector ".${expectedRootClass}".`);
  }

  for (const keyframeName of collectKeyframeNames(scoped.css)) {
    if (!keyframeName.startsWith(`darma-loader-${definition.id}-`)) {
      fail(`${filename}: generated CSS contains unscoped keyframe "${keyframeName}".`);
    }
  }

  validateScopedCssSafety(scoped.css, filename);
}

export function scopeLoaderCode(definition: LoaderSourceDefinition, filename: string): TransformResult {
  const classNames = collectClassNames(definition.html, definition.css);
  const classMap = new Map(classNames.map((className) => [className, toScopedClassName(definition.id, className)]));
  const scopedCss = scopeCss(definition.css, definition.id, classMap);
  const injectedCss = injectLoaderVariables(scopedCss, definition);
  const scoped = {
    html: scopeHtml(definition.html, classMap),
    css: withLoaderVariableFallbacks(injectedCss, definition),
  };

  validateScopedOutput(definition, scoped, filename);

  return scoped;
}

export function detectAvailableControls(css: string) {
  return {
    color: /var\(\s*--loader-color\b/.test(css),
    secondaryColor: /var\(\s*--loader-secondary-color\b/.test(css),
    background: /var\(\s*--loader-bg\b/.test(css),
    speed: /\banimation(?:-duration)?\s*:/.test(css),
  };
}
