import type { LoaderSourceDefinition } from "../../src/app/tools/css-loaders/types";

const VALID_CATEGORIES = new Set([
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
]);

const CONTROL_KEYS = new Set(["color", "size", "speed", "background", "secondaryColor"]);
const DEFAULT_KEYS = new Set(["color", "secondaryColor", "size", "speed", "background"]);
const FLAG_KEYS = new Set(["popular", "singleElement", "cssOnly", "tailwind", "customizable"]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EXTERNAL_URL_PATTERN = /url\(\s*(['"]?)(?:https?:|\/\/|data:|blob:)/i;
const IMPORT_PATTERN = /@import\b/i;
const SCRIPT_PATTERN = /<\s*script\b|\bscript\s*:/i;
const POSITION_FIXED_PATTERN = /position\s*:\s*fixed\b/i;
const CSS_BLOCK_PATTERN = /(^|})\s*([^@{}][^{}]*)\{/g;

export function fail(message: string): never {
  throw new Error(`[css-loaders] ${message}`);
}

function assertObject(value: unknown, filename: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${filename}: expected a JSON object.`);
  }
}

function validateString(value: unknown, field: string, filename: string) {
  if (typeof value !== "string" || !value.trim()) {
    fail(`${filename}: required field "${field}" must be a non-empty string.`);
  }
}

function validateStringArray(value: unknown, field: string, filename: string) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string" || !item.trim())) {
    fail(`${filename}: required field "${field}" must be a non-empty string array.`);
  }
}

function validateBooleanObject(value: unknown, allowedKeys: Set<string>, field: string, filename: string) {
  if (value === undefined) return;
  assertObject(value, filename);

  for (const [key, item] of Object.entries(value)) {
    if (!allowedKeys.has(key)) {
      fail(`${filename}: unknown ${field} key "${key}".`);
    }
    if (typeof item !== "boolean") {
      fail(`${filename}: ${field}.${key} must be boolean.`);
    }
  }
}

function validateDefaults(value: unknown, filename: string) {
  if (value === undefined) return;
  assertObject(value, filename);

  for (const [key, item] of Object.entries(value)) {
    if (!DEFAULT_KEYS.has(key)) {
      fail(`${filename}: unknown defaults key "${key}".`);
    }

    if ((key === "size" || key === "speed") && (typeof item !== "number" || !Number.isFinite(item))) {
      fail(`${filename}: defaults.${key} must be a finite number.`);
    }

    if (key !== "size" && key !== "speed" && typeof item !== "string") {
      fail(`${filename}: defaults.${key} must be a string.`);
    }
  }
}

function validateSourceMeta(value: unknown, filename: string) {
  if (value === undefined) return;
  assertObject(value, filename);

  for (const [key, item] of Object.entries(value)) {
    if (!["name", "author", "license", "url"].includes(key)) {
      fail(`${filename}: unknown source key "${key}".`);
    }
    if (typeof item !== "string") {
      fail(`${filename}: source.${key} must be a string.`);
    }
  }
}

function stripCssComments(css: string) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function splitSelectors(selectorText: string) {
  return selectorText
    .split(",")
    .map((selector) => selector.trim())
    .filter(Boolean)
    .filter((selector) => !/^(?:from|to|\d+(?:\.\d+)?%)\b/i.test(selector));
}

function getCssSelectors(css: string) {
  const selectors: string[] = [];
  const cleanCss = stripCssComments(css);

  for (const match of cleanCss.matchAll(CSS_BLOCK_PATTERN)) {
    selectors.push(...splitSelectors(match[2]));
  }

  return selectors;
}

function hasGlobalElementSelector(selector: string, elementName: "body" | "html") {
  return new RegExp(`(^|[\\s>+~,])${elementName}(?=$|[\\s.#:[>+~])`, "i").test(selector);
}

function isSafeUniversalSelector(selector: string) {
  if (!selector.includes("*")) return true;

  const normalized = selector.replace(/::?[a-z-]+(?:\([^)]*\))?/gi, "").trim();
  if (!normalized.includes("*")) return true;

  return /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)[^,{]*\*/.test(normalized);
}

export function validateScopedCssSafety(css: string, filename: string) {
  for (const selector of getCssSelectors(css)) {
    if (hasGlobalElementSelector(selector, "body") || hasGlobalElementSelector(selector, "html")) {
      fail(`${filename}: generated CSS leaked global selector "${selector}".`);
    }

    if (!isSafeUniversalSelector(selector)) {
      fail(`${filename}: generated CSS contains unsafe universal selector "${selector}".`);
    }
  }
}

function validateLoaderSafety(definition: LoaderSourceDefinition, filename: string) {
  const raw = `${definition.html}\n${definition.css}`;

  if (SCRIPT_PATTERN.test(raw)) {
    fail(`${filename}: scripts are not allowed in loader HTML or CSS.`);
  }

  if (IMPORT_PATTERN.test(definition.css)) {
    fail(`${filename}: @import is not allowed. Loaders must be self-contained.`);
  }

  if (EXTERNAL_URL_PATTERN.test(definition.css)) {
    fail(`${filename}: external url(...) values are not allowed. Loaders must not pull remote assets.`);
  }

  if (POSITION_FIXED_PATTERN.test(definition.css)) {
    fail(`${filename}: position: fixed is not allowed in source loaders because it can create a global overlay.`);
  }

  for (const selector of getCssSelectors(definition.css)) {
    if (hasGlobalElementSelector(selector, "body") || hasGlobalElementSelector(selector, "html")) {
      fail(`${filename}: global body/html selector "${selector}" is not allowed.`);
    }

    if (!isSafeUniversalSelector(selector)) {
      fail(`${filename}: unsafe universal selector "${selector}" is not allowed. Scope it below a loader class.`);
    }
  }
}

export function validateLoaderSource(definition: unknown, filename: string): LoaderSourceDefinition {
  assertObject(definition, filename);

  validateString(definition.id, "id", filename);
  validateString(definition.name, "name", filename);
  validateString(definition.category, "category", filename);
  validateStringArray(definition.tags, "tags", filename);
  validateString(definition.html, "html", filename);
  validateString(definition.css, "css", filename);

  if (!ID_PATTERN.test(definition.id as string)) {
    fail(`${filename}: id "${definition.id as string}" must be lowercase kebab-case.`);
  }

  if (!VALID_CATEGORIES.has(definition.category as string)) {
    fail(`${filename}: category "${definition.category as string}" is not supported.`);
  }

  if (definition.tailwind !== undefined && (typeof definition.tailwind !== "string" || !definition.tailwind.trim())) {
    fail(`${filename}: tailwind must be a non-empty string when provided.`);
  }

  validateBooleanObject(definition.controls, CONTROL_KEYS, "controls", filename);
  validateDefaults(definition.defaults, filename);
  validateBooleanObject(definition.flags, FLAG_KEYS, "flags", filename);
  validateSourceMeta(definition.source, filename);

  const uniqueTags = new Set((definition.tags as string[]).map((tag) => tag.trim().toLowerCase()));
  if (uniqueTags.size !== (definition.tags as string[]).length) {
    fail(`${filename}: tags must be unique.`);
  }

  const validDefinition = definition as LoaderSourceDefinition;
  validateLoaderSafety(validDefinition, filename);

  return validDefinition;
}
