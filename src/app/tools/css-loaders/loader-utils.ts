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

export function getDefaultLoaderCustomization(loader: LoaderDefinition): LoaderCustomizationState {
  return {
    color: loader.defaults.color ?? "#6366f1",
    secondaryColor: loader.defaults.secondaryColor ?? "#a5b4fc",
    size: loader.defaults.size ?? 56,
    speed: loader.defaults.speed ?? 1,
    background: loader.defaults.background ?? "#ffffff",
  };
}

export function getLoaderInlineStyle(customization: LoaderCustomizationState, baseSize = 56): CSSProperties {
  const safeBaseSize = Math.max(baseSize || 56, 1);
  const scale = Math.max(customization.size, 12) / safeBaseSize;

  return {
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
    `  --loader-color: ${customization.color};`,
    `  --loader-secondary-color: ${customization.secondaryColor};`,
    `  --loader-size: ${customization.size}px;`,
    `  --loader-speed: ${customization.speed}s;`,
    `  --loader-bg: ${customization.background};`,
    "}",
  ].join("\n");
}

export function buildCustomizedLoaderCss(loader: LoaderDefinition, customization: LoaderCustomizationState) {
  const baseSize = loader.defaults.size ?? 56;
  const scale = Math.max(customization.size, 12) / Math.max(baseSize, 1);
  const controls = loader.controls;
  const scopedSelector = `.darma-loader-${loader.id}-preview`;
  const htmlSelector = `.darma-loader-${loader.id}`;
  const rules = [buildLoaderCssVariables(scopedSelector, customization), "", loader.code.css.trim()];

  // Loaders now reference --loader-color / --loader-secondary-color / --loader-bg directly
  // in their CSS (auto-injected at build time from defaults). No color bridge is needed.

  if (controls.size) {
    rules.push("/* Size bridge */");
    rules.push(`${scopedSelector} .css-loader-custom-scale {\n  transform: scale(${Number(scale.toFixed(3))});\n  transform-origin: center;\n}`);
  }

  if (controls.speed) {
    // Fallback bridge: forces animation-duration on loaders whose CSS hardcodes the duration
    // instead of using var(--loader-speed). Loaders that already use the variable are
    // unaffected because the variable resolves to the same value here.
    rules.push("/* Speed bridge */");
    rules.push(
      `${scopedSelector} ${htmlSelector},\n${scopedSelector} ${htmlSelector} *,\n${scopedSelector} ${htmlSelector}::before,\n${scopedSelector} ${htmlSelector}::after,\n${scopedSelector} ${htmlSelector} *::before,\n${scopedSelector} ${htmlSelector} *::after {\n  animation-duration: var(--loader-speed) !important;\n}`,
    );
  }

  return rules.join("\n").trim() + "\n";
}

export function buildCustomizedLoaderHtml(loader: LoaderDefinition, customization?: LoaderCustomizationState) {
  if (!customization) return loader.code.html.trim();

  return [
    `<div class="darma-loader-${loader.id}-preview" style="--loader-color: ${customization.color}; --loader-secondary-color: ${customization.secondaryColor}; --loader-size: ${customization.size}px; --loader-speed: ${customization.speed}s; --loader-bg: ${customization.background};">`,
    `  <div class="css-loader-custom-scale">${loader.code.html.trim()}</div>`,
    "</div>",
  ].join("\n");
}

export function buildCustomizedReactCode(loader: LoaderDefinition, customization: LoaderCustomizationState) {
  const componentName = `${loader.id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}Loader`;

  return `import type { CSSProperties } from "react";\n\nexport default function ${componentName}() {\n  return (\n    <div\n      className="darma-loader-${loader.id}-preview"\n      style={\n        {\n          "--loader-color": "${customization.color}",\n          "--loader-secondary-color": "${customization.secondaryColor}",\n          "--loader-size": "${customization.size}px",\n          "--loader-speed": "${customization.speed}s",\n          "--loader-bg": "${customization.background}",\n        } as CSSProperties\n      }\n    >\n      <div className="css-loader-custom-scale">\n        ${loader.code.html.trim().replace(/class=/g, "className=")}\n      </div>\n    </div>\n  );\n}\n`;
}

export function buildCustomizedTailwindCode(loader: LoaderDefinition, customization: LoaderCustomizationState) {
  if (!loader.code.tailwind) return undefined;

  return [
    `{/* color ${customization.color}, size ${customization.size}px, speed ${customization.speed}s */}`,
    loader.code.tailwind.trim(),
  ].join("\n");
}
