import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { LoaderDefinition, LoaderFormat, LoaderIndexItem, LoaderPreviewItem, LoaderSourceDefinition } from "../../src/app/tools/css-loaders/types";
import { generateReactCode } from "./generate-react-code.ts";
import { detectAvailableControls, scopeLoaderCode } from "./normalize-css.ts";
import { fail, validateLoaderSource } from "./validate-loader.ts";

const PROJECT_ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const CSS_LOADERS_DIR = path.join(PROJECT_ROOT, "src/app/tools/css-loaders");
const SOURCE_LOADERS_DIR = path.join(CSS_LOADERS_DIR, "data/source/loaders");
const GENERATED_DIR = path.join(CSS_LOADERS_DIR, "data/generated");
const GENERATED_LOADERS_DIR = path.join(GENERATED_DIR, "loaders");
const GENERATED_CATEGORIES_DIR = path.join(GENERATED_DIR, "categories");

type SourceFile = {
  filename: string;
  relativePath: string;
  sourceGroup: string;
  definition: LoaderSourceDefinition;
};

function getFormats(definition: LoaderSourceDefinition): LoaderFormat[] {
  const formats: LoaderFormat[] = ["html", "css", "react"];
  if (definition.tailwind) formats.push("tailwind");
  return formats;
}

function normalizeControls(definition: LoaderSourceDefinition, scopedCss: string): NonNullable<LoaderSourceDefinition["controls"]> {
  // Detect which CSS variables the loader actually uses, so we only expose controls
  // that will produce a visible effect. Source can still explicitly disable a control
  // by setting it to `false`.
  const detected = detectAvailableControls(scopedCss);
  const source = definition.controls ?? {};

  return {
    color: source.color === false ? false : detected.color,
    size: source.size === false ? false : true,
    speed: source.speed === false ? false : detected.speed,
    background: source.background === true && detected.background,
    secondaryColor: source.secondaryColor === true && detected.secondaryColor,
  };
}

function normalizeDefaults(definition: LoaderSourceDefinition): NonNullable<LoaderSourceDefinition["defaults"]> {
  return {
    ...definition.defaults,
  };
}

function normalizeFlags(definition: LoaderSourceDefinition): NonNullable<LoaderSourceDefinition["flags"]> {
  return {
    ...definition.flags,
    tailwind: Boolean(definition.tailwind) || definition.flags?.tailwind,
  };
}

function buildSearchText(item: LoaderIndexItem) {
  const activeFlags = Object.entries(item.flags)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key);

  return [item.id, item.name, item.category, ...item.tags, ...item.formats, ...activeFlags].join(" ").toLowerCase();
}

function createLoaderDefinition(sourceFile: SourceFile): LoaderDefinition {
  const { definition, filename } = sourceFile;
  const scoped = scopeLoaderCode(definition, filename);
  const formats = getFormats(definition);
  const flags = normalizeFlags(definition);
  const indexItem: LoaderIndexItem = {
    id: definition.id,
    name: definition.name,
    category: definition.category,
    tags: definition.tags,
    formats,
    flags,
  };

  const defaults = normalizeDefaults(definition);
  const previewItem: LoaderPreviewItem = {
    ...indexItem,
    searchText: buildSearchText(indexItem),
    previewHtml: scoped.html,
    previewCss: scoped.css,
    ...(Object.keys(defaults).length ? { defaults } : {}),
  };

  return {
    ...previewItem,
    code: {
      html: scoped.html,
      css: scoped.css,
      react: generateReactCode(definition, scoped.html),
      ...(definition.tailwind ? { tailwind: definition.tailwind } : {}),
    },
    controls: normalizeControls(definition, scoped.css),
    defaults: normalizeDefaults(definition),
    ...(definition.source ? { source: definition.source } : {}),
  };
}

async function collectJsonFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => {
    fail(`source directory not found: ${directory}`);
  });

  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(absolutePath)));
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(absolutePath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

async function readSourceLoaders() {
  const jsonFiles = await collectJsonFiles(SOURCE_LOADERS_DIR);

  if (!jsonFiles.length) {
    fail(`no source JSON files found in ${SOURCE_LOADERS_DIR}`);
  }

  const sources: SourceFile[] = [];

  for (const absolutePath of jsonFiles) {
    const relativePath = path.relative(SOURCE_LOADERS_DIR, absolutePath).replace(/\\/g, "/");
    const sourceGroup = relativePath.includes("/") ? relativePath.split("/")[0] : "uncategorized";
    const raw = await fs.readFile(absolutePath, "utf8");
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      fail(`${relativePath}: invalid JSON. ${(error as Error).message}`);
    }

    sources.push({ filename: relativePath, relativePath, sourceGroup, definition: validateLoaderSource(parsed, relativePath) });
  }

  const seenIds = new Map<string, string>();
  for (const source of sources) {
    const previousFilename = seenIds.get(source.definition.id);
    if (previousFilename) {
      fail(`${source.filename}: duplicate id "${source.definition.id}" already used by ${previousFilename}.`);
    }
    seenIds.set(source.definition.id, source.filename);
  }

  return sources;
}

async function writeJson(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function buildLoaderDetailManifest(definitions: LoaderDefinition[]) {
  const entries = definitions
    .map((definition) => `  "${definition.id}": () => import("./loaders/${definition.id}.json"),`)
    .join("\n");

  return [
    "export const loaderDetailLoaders: Record<string, () => Promise<unknown>> = {",
    entries,
    "};",
    "",
  ].join("\n");
}

async function writeText(filePath: string, value: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, "utf8");
}

async function cleanGeneratedDirectory() {
  await fs.rm(GENERATED_LOADERS_DIR, { recursive: true, force: true });
  await fs.rm(GENERATED_CATEGORIES_DIR, { recursive: true, force: true });
  await fs.rm(path.join(GENERATED_DIR, "loader-definitions.json"), { force: true });
  await fs.rm(path.join(GENERATED_DIR, "loader-detail-manifest.ts"), { force: true });
  await fs.mkdir(GENERATED_LOADERS_DIR, { recursive: true });
  await fs.mkdir(GENERATED_CATEGORIES_DIR, { recursive: true });
}

function buildSourceStats(sourceFiles: SourceFile[]) {
  return sourceFiles.reduce<Record<string, number>>((stats, sourceFile) => {
    stats[sourceFile.sourceGroup] = (stats[sourceFile.sourceGroup] ?? 0) + 1;
    return stats;
  }, {});
}

async function main() {
  const sourceFiles = await readSourceLoaders();
  const definitions = sourceFiles.map((sourceFile) => createLoaderDefinition(sourceFile));
  const sortedDefinitions = definitions.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  const previewItems: LoaderPreviewItem[] = sortedDefinitions.map(({ code: _code, controls: _controls, source: _source, ...item }) => item);
  const indexItems: LoaderIndexItem[] = previewItems.map(({ previewHtml: _previewHtml, previewCss: _previewCss, defaults: _defaults, ...item }) => item);

  await cleanGeneratedDirectory();
  await writeJson(path.join(GENERATED_DIR, "loader-index.json"), indexItems);
  await writeText(path.join(GENERATED_DIR, "loader-detail-manifest.ts"), buildLoaderDetailManifest(sortedDefinitions));
  await writeJson(path.join(GENERATED_DIR, "source-stats.json"), {
    total: sourceFiles.length,
    groups: buildSourceStats(sourceFiles),
  });

  for (const definition of sortedDefinitions) {
    await writeJson(path.join(GENERATED_LOADERS_DIR, `${definition.id}.json`), definition);
  }

  const categories = new Map<string, LoaderPreviewItem[]>();
  for (const item of previewItems) {
    const categoryItems = categories.get(item.category) ?? [];
    categoryItems.push(item);
    categories.set(item.category, categoryItems);
  }

  const popularItems = previewItems.filter((item) => item.flags.popular);
  if (popularItems.length) {
    categories.set("popular", popularItems);
  }

  for (const [category, items] of [...categories.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    await writeJson(path.join(GENERATED_CATEGORIES_DIR, `${category}.json`), items);
  }

  console.log(`[css-loaders] generated ${indexItems.length} loaders across ${categories.size} categories from ${Object.keys(buildSourceStats(sourceFiles)).length} source groups.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
