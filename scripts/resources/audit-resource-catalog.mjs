import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const catalogPaths = [path.join(ROOT, "src/features/resources/resources.catalog.json"), path.join(ROOT, "src/features/resources/curated-resources.json")];
const catalog = catalogPaths.flatMap((catalogPath) => JSON.parse(fs.readFileSync(catalogPath, "utf8")));
const errors = [];
const warnings = [];
const ids = new Set();
const urls = new Set();

for (const [index, resource] of catalog.entries()) {
  const label = resource.name || `record ${index + 1}`;
  if (!resource.id || ids.has(resource.id)) errors.push(`${label}: duplicate or missing id ${resource.id}`);
  ids.add(resource.id);
  if (!resource.url || urls.has(resource.url)) errors.push(`${label}: duplicate or missing canonical URL ${resource.url}`);
  urls.add(resource.url);
  if (!resource.url.startsWith("https://")) errors.push(`${label}: non-HTTPS URL ${resource.url}`);
  if (!resource.summary || resource.summary.length < 20) errors.push(`${label}: summary is too short`);
  if (!Array.isArray(resource.categories) || resource.categories.length === 0) errors.push(`${label}: no categories`);
  if (!resource.icon?.logoUrl && !resource.icon?.faviconUrl && !resource.icon?.localPath) warnings.push(`${label}: no icon candidate`);
  if (resource.pricing === "unknown") warnings.push(`${label}: pricing needs review`);
  if (resource.publisherType === "unknown") warnings.push(`${label}: publisher type needs review`);
}

console.log(`Resource catalog: ${catalog.length} records`);
console.log(`Errors: ${errors.length}`);
console.log(`Review warnings: ${warnings.length}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
}
if (process.argv.includes("--verbose")) for (const warning of warnings) console.warn(`REVIEW: ${warning}`);
