#!/usr/bin/env node
/**
 * Static UI foundation audit — read-only scanner.
 *
 * Node built-ins only. Never writes to application source. Never exits non-zero
 * for findings (only for its own internal errors), so it can never fail a build.
 *
 *   node scripts/ui-audit-static.mjs            # human summary
 *   node scripts/ui-audit-static.mjs --json     # machine inventory to stdout
 *   node scripts/ui-audit-static.mjs --write    # refresh docs/ui-audit/tool-layout-inventory.json
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, relative, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = "src/features/tools/registry/index.ts";
const TOOLS_APP_DIR = "src/app/tools";
const OUT_JSON = "docs/ui-audit/tool-layout-inventory.json";

/** Folders under src/app/tools that are routing/meta, not registered tools. */
const NON_TOOL_DIRS = new Set(["_shared", "audience", "category", "fun", "privacy", "workflows"]);

const SCAN_EXT = new Set([".ts", ".tsx", ".css", ".mjs"]);

// ---------------------------------------------------------------- fs helpers

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(join(ROOT, dir), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const rel = `${dir}/${e.name}`;
    if (e.name === "node_modules" || e.name === ".next" || e.name === ".git") continue;
    if (e.isDirectory()) walk(rel, out);
    else if (SCAN_EXT.has(extname(e.name))) out.push(rel);
  }
  return out;
}

const read = (rel) => {
  try {
    return readFileSync(join(ROOT, rel), "utf8");
  } catch {
    return "";
  }
};

const lineOf = (src, index) => src.slice(0, index).split("\n").length;

// ------------------------------------------------------------ registry parse

/**
 * The registry is one object literal per line. We pull the fields we need with
 * scoped regexes rather than evaluating the module (no TS runtime available).
 */
function parseRegistry() {
  const src = read(REGISTRY);
  const tools = [];
  for (const line of src.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("{ id:")) continue;
    const str = (key) => {
      const m = t.match(new RegExp(`\\b${key}:\\s*"([^"]*)"`));
      return m ? m[1] : null;
    };
    const arr = (key) => {
      const m = t.match(new RegExp(`\\b${key}:\\s*\\[([^\\]]*)\\]`));
      if (!m) return [];
      return [...m[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]);
    };
    const num = (key) => {
      const m = t.match(new RegExp(`\\b${key}:\\s*(-?\\d+)`));
      return m ? Number(m[1]) : null;
    };
    tools.push({
      id: str("id"),
      title: str("title"),
      href: str("href"),
      layoutType: str("layoutType"),
      status: str("status"),
      visibility: str("visibility"),
      privacy: str("privacy"),
      completion: num("completion"),
      mainCategory: arr("mainCategory"),
      secondaryCategory: arr("secondaryCategory"),
      audiences: arr("audiences"),
    });
  }
  return tools;
}

// ------------------------------------------------------------------ patterns

/** Each pattern is scored into a risk bucket used by the composite score. */
const PATTERNS = [
  // --- text wrapping / shrink ---
  { id: "global-word-break", bucket: "text", re: /^\s*\*\s*\{[^}]*word-break\s*:\s*break-(word|all)/gms, sev: "high" },
  { id: "word-break-break-all", bucket: "text", re: /word-break\s*:\s*break-all/g, sev: "high" },
  { id: "break-all-class", bucket: "text", re: /\bbreak-all\b/g, sev: "med" },
  { id: "overflow-wrap-anywhere", bucket: "text", re: /overflow-wrap\s*:\s*anywhere/g, sev: "med" },
  { id: "whitespace-nowrap", bucket: "text", re: /(white-space\s*:\s*nowrap|\bwhitespace-nowrap\b)/g, sev: "low" },
  { id: "truncate", bucket: "text", re: /\btruncate\b/g, sev: "low" },

  // --- fixed sizing / responsive ---
  { id: "viewport-height-full", bucket: "responsive", re: /(\b(min-)?h-screen\b|:\s*100vh|\bh-\[100vh\]|\bmin-h-\[100vh\])/g, sev: "med" },
  { id: "large-fixed-min-height", bucket: "responsive", re: /min-h-\[(\d{3,})px\]|min-height\s*:\s*(\d{3,})px/g, sev: "med" },
  { id: "large-fixed-height", bucket: "responsive", re: /\bh-\[(\d{3,})px\]|(?<![-\w])height\s*:\s*(\d{3,})px/g, sev: "med" },
  { id: "fixed-width-px", bucket: "responsive", re: /\bw-\[(\d{3,})px\]|(?<![-\w])width\s*:\s*(\d{3,})px/g, sev: "med" },
  { id: "min-width-px", bucket: "responsive", re: /\bmin-w-\[(\d{3,})px\]|min-width\s*:\s*(\d{3,})px/g, sev: "high" },
  { id: "overflow-x-hidden", bucket: "responsive", re: /(overflow-x\s*:\s*hidden|\boverflow-x-hidden\b)/g, sev: "med" },
  { id: "absolute-positioning", bucket: "responsive", re: /(position\s*:\s*absolute|\babsolute\b(?=[\s"'`]))/g, sev: "low" },
  { id: "sticky-fixed-offset", bucket: "responsive", re: /\bsticky\s+top-\d+|position\s*:\s*sticky/g, sev: "low" },

  // --- layout / grid shrink safety ---
  { id: "grid-cols-unguarded", bucket: "spacing", re: /grid-template-columns\s*:\s*(?![^;]*minmax\(0)[^;]*1fr/g, sev: "med" },
  { id: "grid-cols-arbitrary", bucket: "spacing", re: /grid-cols-\[[^\]]*\]/g, sev: "low" },
  { id: "empty-column-placeholder", bucket: "spacing", re: /<div className="hidden lg:block" \/>|<div className="hidden xl:block" \/>/g, sev: "high" },

  // --- theme / contrast ---
  { id: "raw-hex-color", bucket: "theme", re: /#[0-9a-fA-F]{3,8}\b/g, sev: "low" },
  { id: "raw-rgb-hsl", bucket: "theme", re: /\b(rgba?|hsla?)\(\s*\d/g, sev: "low" },
  { id: "hardcoded-white-black-text", bucket: "theme", re: /text-white\b|text-black\b|color\s*:\s*#(fff|ffffff|000|000000)\b/g, sev: "med" },
  { id: "low-opacity-text", bucket: "theme", re: /\btext-\w+\/(?:[1-4]?\d)\b|opacity-(?:[1-4]?\d)\b/g, sev: "low" },

  // --- accessibility ---
  { id: "focus-outline-suppressed", bucket: "a11y", re: /outline\s*:\s*none|\boutline-none\b/g, sev: "med" },
  { id: "click-handler-on-div", bucket: "a11y", re: /<(div|span|li)[^>]*\sonClick=/g, sev: "med" },
  { id: "animation-no-reduced-motion", bucket: "a11y", re: /@keyframes\s+/g, sev: "low" },
  { id: "aria-label", bucket: "a11y-good", re: /aria-label(?:ledby)?=/g, sev: "info" },
  { id: "sr-only", bucket: "a11y-good", re: /\bsr-only\b/g, sev: "info" },
];

function scanFile(rel) {
  const src = read(rel);
  const hits = {};
  for (const p of PATTERNS) {
    p.re.lastIndex = 0;
    const found = [...src.matchAll(p.re)];
    if (!found.length) continue;
    hits[p.id] = {
      count: found.length,
      sev: p.sev,
      bucket: p.bucket,
      lines: found.slice(0, 6).map((m) => lineOf(src, m.index)),
    };
  }
  return { file: rel, loc: src.split("\n").length, bytes: src.length, hits };
}

// ------------------------------------------------------------------- scoring

const WEIGHTS = { custom: 20, responsive: 20, text: 15, css: 15, spacing: 15, theme: 10, a11y: 5 };
const SEV_VALUE = { high: 3, med: 2, low: 1, info: 0 };

function bucketPressure(files, bucket) {
  let raw = 0;
  for (const f of files) {
    for (const [id, h] of Object.entries(f.hits)) {
      if (h.bucket !== bucket) continue;
      void id;
      raw += SEV_VALUE[h.sev] * Math.min(h.count, 8);
    }
  }
  // saturating curve: 0 -> 0, ~24 raw -> ~0.75, plateaus at 1
  return 1 - Math.exp(-raw / 18);
}

function scoreTool(tool, files, localCssLoc, hasCanvas) {
  const totalLoc = files.reduce((a, f) => a + f.loc, 0);
  const custom = Math.min(1, totalLoc / 2200) * (hasCanvas ? 1 : 0.8);
  const css = Math.min(1, localCssLoc / 900);
  const parts = {
    custom: WEIGHTS.custom * custom,
    responsive: WEIGHTS.responsive * bucketPressure(files, "responsive"),
    text: WEIGHTS.text * bucketPressure(files, "text"),
    css: WEIGHTS.css * css,
    spacing: WEIGHTS.spacing * bucketPressure(files, "spacing"),
    theme: WEIGHTS.theme * bucketPressure(files, "theme"),
    a11y: WEIGHTS.a11y * bucketPressure(files, "a11y"),
  };
  const score = Math.round(Object.values(parts).reduce((a, b) => a + b, 0));
  const breakdown = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, Math.round(v * 10) / 10]));
  return { score: Math.min(100, score), breakdown };
}

// ---------------------------------------------------------------------- main

function main() {
  const tools = parseRegistry();
  const routeDirs = readdirSync(join(ROOT, TOOLS_APP_DIR), { withFileTypes: true })
    .filter((e) => e.isDirectory() && !NON_TOOL_DIRS.has(e.name))
    .map((e) => e.name);

  const sharedFiles = [
    ...walk("src/features/tools/layouts"),
    ...walk("src/features/tools/components"),
    ...walk("src/features/tools/ui"),
    ...walk("src/components/ui"),
    ...walk("src/styles"),
    "src/app/globals.css",
    "src/app/tools/style.css",
  ].map(scanFile);

  const inventory = tools.map((tool) => {
    const dir = `${TOOLS_APP_DIR}/${tool.id}`;
    const files = walk(dir).map(scanFile);
    const cssFiles = files.filter((f) => f.file.endsWith(".css"));
    const localCssLoc = cssFiles.reduce((a, f) => a + f.loc, 0);
    const src = files.map((f) => read(f.file)).join("\n");
    const hasCanvas = /<canvas|useRef<HTMLCanvasElement|getContext\(/.test(src);
    const sharedComponents = [
      ...new Set(
        [...src.matchAll(/from "@\/(?:components\/ui|features\/tools\/(?:components|layouts|ui))(?:\/[\w.]+)?"/g)].flatMap(
          () => [],
        ),
      ),
    ];
    const usedShared = [
      ...new Set(
        [...src.matchAll(/\b(ToolPage|ToolLayout\w+|ToolPageShell|ToolContentCard|ControlSection|ControlGrid|ResultPanel|CodeOutputPanel|EditorPanel|PreviewToolbar|PresetGallery|SegmentedControl|ToolActionBar|ToolControlPanel|ToolMobileActions|WarningPanel|PreviewFrame|SurfaceCard|ActionBar|EmptyState|Tabs)\b/g)].map(
          (m) => m[1],
        ),
      ),
    ].sort();
    void sharedComponents;
    const { score, breakdown } = scoreTool(tool, files, localCssLoc, hasCanvas);
    const flags = {};
    for (const f of files) for (const [id, h] of Object.entries(f.hits)) flags[id] = (flags[id] ?? 0) + h.count;

    return {
      ...tool,
      routeDir: dir,
      routeDirExists: routeDirs.includes(tool.id),
      fileCount: files.length,
      totalLoc: files.reduce((a, f) => a + f.loc, 0),
      localCssFiles: cssFiles.map((f) => ({ file: f.file, loc: f.loc })),
      localCssLoc,
      hasCanvasOrEditor: hasCanvas,
      sharedUiUsed: usedShared,
      patternFlags: flags,
      staticRiskScore: score,
      riskBreakdown: breakdown,
    };
  });

  inventory.sort((a, b) => b.staticRiskScore - a.staticRiskScore);

  const orphanRoutes = routeDirs.filter((d) => !tools.some((t) => t.id === d));

  const result = {
    generatedBy: "scripts/ui-audit-static.mjs",
    generatedAt: new Date().toISOString().slice(0, 10),
    registeredToolCount: tools.length,
    routeDirCount: routeDirs.length,
    excludedNonToolDirs: [...NON_TOOL_DIRS],
    orphanRouteDirs: orphanRoutes,
    layoutFamilies: [...new Set(tools.map((t) => t.layoutType))].filter(Boolean),
    sharedFiles: sharedFiles
      .filter((f) => Object.keys(f.hits).length)
      .map((f) => ({ file: f.file, loc: f.loc, hits: f.hits })),
    tools: inventory,
  };

  if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  if (process.argv.includes("--write")) {
    const outDir = join(ROOT, dirname(OUT_JSON));
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    writeFileSync(join(ROOT, OUT_JSON), `${JSON.stringify(result, null, 2)}\n`);
    console.log(`wrote ${OUT_JSON}`);
  }

  console.log(`Registered tools: ${result.registeredToolCount}`);
  console.log(`Route dirs (tools only): ${result.routeDirCount}`);
  if (orphanRoutes.length) console.log(`Unregistered route dirs: ${orphanRoutes.join(", ")}`);
  console.log(`Layout families: ${result.layoutFamilies.join(", ")}`);
  console.log("\nTop 15 by static UI risk:");
  for (const t of inventory.slice(0, 15)) {
    console.log(`  ${String(t.staticRiskScore).padStart(3)}  ${t.id.padEnd(38)} ${t.layoutType ?? "-"}  loc=${t.totalLoc} css=${t.localCssLoc}`);
  }
  console.log("\nShared-file pattern hits:");
  for (const f of result.sharedFiles) {
    const top = Object.entries(f.hits)
      .filter(([, h]) => h.sev === "high" || h.sev === "med")
      .map(([id, h]) => `${id}x${h.count}`);
    if (top.length) console.log(`  ${relative(".", f.file)}: ${top.join(", ")}`);
  }
}

try {
  main();
} catch (err) {
  console.error("[ui-audit-static] scan failed (non-fatal):", err.message);
}
void statSync;
