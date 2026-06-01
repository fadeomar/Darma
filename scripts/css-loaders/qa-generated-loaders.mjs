import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const generatedDir = path.join(root, "src/app/tools/css-loaders/data/generated");
const loadersDir = path.join(generatedDir, "loaders");
const categoriesDir = path.join(generatedDir, "categories");
const manifestPath = path.join(generatedDir, "loader-detail-manifest.ts");
const indexPath = path.join(generatedDir, "loader-index.json");
const sourceStatsPath = path.join(generatedDir, "source-stats.json");

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${path.relative(root, filePath)}: ${error.message}`);
    return null;
  }
}

function usesCssVariable(css, variableName) {
  return new RegExp(`var\\(\\s*${variableName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`).test(css);
}

function findRawStyleAttributes(reactCode) {
  return /\sstyle=(["']).*?\1/s.test(reactCode);
}

function findHyphenatedSvgAttributes(reactCode) {
  const allowedPrefixes = ["data-", "aria-"];
  const attrPattern = /\s([a-zA-Z][\w-]*-[\w-]+)=/g;
  const matches = [];
  for (const match of reactCode.matchAll(attrPattern)) {
    const attr = match[1];
    if (!allowedPrefixes.some((prefix) => attr.startsWith(prefix))) matches.push(attr);
  }
  return matches;
}

if (!existsSync(loadersDir)) fail("generated loaders directory is missing");
if (!existsSync(categoriesDir)) fail("generated categories directory is missing");
if (!existsSync(manifestPath)) fail("loader detail manifest is missing");
if (!existsSync(indexPath)) fail("loader index is missing");
if (!existsSync(sourceStatsPath)) fail("source stats are missing");

const loaderFiles = existsSync(loadersDir) ? readdirSync(loadersDir).filter((file) => file.endsWith(".json")).sort() : [];
const loaders = loaderFiles.map((file) => readJson(path.join(loadersDir, file))).filter(Boolean);
const loaderIds = new Set();
const indexItems = readJson(indexPath) ?? [];
const sourceStats = readJson(sourceStatsPath) ?? { total: 0, groups: {} };
const manifest = existsSync(manifestPath) ? readFileSync(manifestPath, "utf8") : "";

if (loaders.length !== indexItems.length) {
  fail(`loader index count (${indexItems.length}) does not match detail file count (${loaders.length})`);
}

if (sourceStats.total && sourceStats.total !== loaders.length) {
  fail(`source stats total (${sourceStats.total}) does not match detail file count (${loaders.length})`);
}

for (const loader of loaders) {
  const id = loader.id;
  const css = loader.code?.css ?? "";
  const html = loader.code?.html ?? "";
  const react = loader.code?.react ?? "";
  const rootClass = `darma-loader-${id}`;

  if (loaderIds.has(id)) fail(`${id}: duplicate loader id`);
  loaderIds.add(id);

  if (!html.includes(rootClass)) fail(`${id}: HTML does not include scoped root class ${rootClass}`);
  if (!css.includes(`.${rootClass}`)) fail(`${id}: CSS does not include scoped root selector .${rootClass}`);
  if (new RegExp(`id=["'][^"']*["']["']`).test(html)) fail(`${id}: malformed double-quoted id attribute`);
  if (/\b(?:undefined|null|NaN)\b/.test(`${html}\n${css}\n${react}`)) fail(`${id}: generated output contains undefined/null/NaN token`);
  if (/position\s*:\s*fixed\b/i.test(css)) fail(`${id}: generated CSS contains position: fixed`);
  if (/url\(\s*(['"]?)(?:https?:|\/\/|data:|blob:)/i.test(css)) fail(`${id}: generated CSS contains external or embedded url()`);
  if (/perspective\(\s*(?:0|-)/i.test(css)) fail(`${id}: generated CSS contains invalid perspective()`);
  if (/\.loader\b/.test(css)) warn(`${id}: CSS still contains a generic .loader selector`);
  if (/@keyframes\s+(?!darma-loader-)/.test(css)) fail(`${id}: CSS contains unscoped keyframes`);

  if (loader.controls?.color && !usesCssVariable(css, "--loader-color") && !/currentColor\b/.test(css)) {
    fail(`${id}: color control is enabled but CSS does not use --loader-color/currentColor`);
  }

  if (loader.controls?.secondaryColor && !usesCssVariable(css, "--loader-secondary-color")) {
    fail(`${id}: secondary color control is enabled but CSS does not use --loader-secondary-color`);
  }

  if (loader.controls?.background && !usesCssVariable(css, "--loader-bg")) {
    fail(`${id}: background control is enabled but CSS does not use --loader-bg`);
  }

  if (loader.controls?.speed && !/\banimation(?:-duration)?\s*:/i.test(css)) {
    fail(`${id}: speed/duration control is enabled but CSS has no animation declaration`);
  }

  const hyphenAttrs = findHyphenatedSvgAttributes(react);
  if (hyphenAttrs.length) fail(`${id}: React output contains JSX-invalid hyphenated attributes: ${[...new Set(hyphenAttrs)].join(", ")}`);
  if (findRawStyleAttributes(react)) fail(`${id}: React output contains raw style= string attribute`);

  if (!manifest.includes(`"${id}": () => import("./loaders/${id}.json")`)) {
    fail(`${id}: missing from loader detail manifest`);
  }
}

const indexIds = new Set(indexItems.map((item) => item.id));
for (const id of indexIds) {
  if (!loaderIds.has(id)) fail(`${id}: appears in index but detail file is missing`);
}
for (const id of loaderIds) {
  if (!indexIds.has(id)) fail(`${id}: detail file exists but index entry is missing`);
}

if (existsSync(categoriesDir)) {
  const categoryFiles = readdirSync(categoriesDir).filter((file) => file.endsWith(".json")).sort();
  for (const file of categoryFiles) {
    const category = file.replace(/\.json$/, "");
    const items = readJson(path.join(categoriesDir, file)) ?? [];
    for (const item of items) {
      if (!loaderIds.has(item.id)) fail(`${category}/${item.id}: category item is missing detail file`);
      if (category !== "popular" && item.category !== category) {
        fail(`${category}/${item.id}: category file contains item from ${item.category}`);
      }
      if (category === "popular" && !item.flags?.popular) {
        fail(`${category}/${item.id}: popular category contains non-popular item`);
      }
    }
  }
}

console.log(`[css-loaders qa] checked ${loaders.length} generated loaders, ${indexItems.length} index entries.`);
if (warnings.length) {
  console.warn(`[css-loaders qa] warnings (${warnings.length}):`);
  for (const message of warnings.slice(0, 25)) console.warn(`- ${message}`);
  if (warnings.length > 25) console.warn(`- ...and ${warnings.length - 25} more`);
}
if (failures.length) {
  console.error(`[css-loaders qa] failures (${failures.length}):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
console.log("[css-loaders qa] passed.");
