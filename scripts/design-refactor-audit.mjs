import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SOURCE_DIR = join(ROOT, "src");

const patterns = [
  "bg-slate-",
  "text-slate-",
  "border-slate-",
  "bg-gray-",
  "text-gray-",
  "border-gray-",
  "bg-blue-",
  "text-blue-",
  "border-blue-",
  "bg-indigo-",
  "text-indigo-",
  "bg-purple-",
  "text-purple-",
  "from-blue-",
  "to-purple-",
  "rounded-3xl",
  "rounded-[2rem]",
  "shadow-xl",
  "shadow-2xl",
];

const allowedGeneratedOutputFiles = new Set([
  "src/app/tools/border-radius-generator/borderRadius.ts",
  "src/app/tools/css-transform-generator/transform.ts",
  "src/app/tools/fake-screen/presets.ts",
  "src/app/tools/glassmorphism-generator/glass.ts",
  "src/app/tools/password-generator/generator.ts",
]);

const allowedPreviewFiles = new Set([
  "src/app/tools/fake-screen/FakeScreenClient.tsx",
]);

const extensions = new Set([".ts", ".tsx", ".css"]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path, files);
    } else if ([...extensions].some((extension) => path.endsWith(extension))) {
      files.push(path);
    }
  }
  return files;
}

const violations = [];
const allowed = [];

for (const file of walk(SOURCE_DIR)) {
  const rel = relative(ROOT, file).replaceAll("\\\\", "/");
  const text = readFileSync(file, "utf8");
  for (const pattern of patterns) {
    if (!text.includes(pattern)) continue;
    const target = allowedGeneratedOutputFiles.has(rel) || allowedPreviewFiles.has(rel) ? allowed : violations;
    target.push({ file: rel, pattern });
  }
}

if (allowed.length) {
  console.log("Allowed legacy-like patterns inside generated output / intentional previews:");
  for (const item of allowed) {
    console.log(`  ${item.pattern} ${item.file}`);
  }
}

if (violations.length) {
  console.error("\nDesign-token audit failed. Replace these app-chrome classes with semantic tokens:");
  for (const item of violations) {
    console.error(`  ${item.pattern} ${item.file}`);
  }
  process.exit(1);
}

console.log("\nDesign-token audit passed for app chrome.");
