import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CATALOG_PATHS = [path.join(ROOT, "src/features/resources/resources.catalog.json"), path.join(ROOT, "src/features/resources/curated-resources.json")];
const MANIFEST_PATH = path.join(ROOT, "src/features/resources/resource-icons.json");
const OUTPUT_DIR = path.join(ROOT, "public/resources/logos");
const MAX_BYTES = 1_500_000;
const CONCURRENCY = 6;
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Number.POSITIVE_INFINITY;
const CONTENT_EXTENSIONS = {
  "image/svg+xml": "svg", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp",
  "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico",
};

function extensionFor(contentType, sourceUrl) {
  const cleanType = contentType?.split(";")[0]?.trim().toLowerCase();
  if (cleanType && CONTENT_EXTENSIONS[cleanType]) return CONTENT_EXTENSIONS[cleanType];
  const match = new URL(sourceUrl).pathname.toLowerCase().match(/\.(svg|png|jpe?g|webp|ico)$/);
  return match ? match[1].replace("jpeg", "jpg") : null;
}

async function downloadCandidate(resource, sourceUrl) {
  const response = await fetch(sourceUrl, {
    redirect: "follow",
    headers: {
      "user-agent": "DarmaResourceAudit/1.0 (+https://github.com/fadeomar/Darma)",
      accept: "image/avif,image/webp,image/svg+xml,image/png,image/*,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BYTES) throw new Error(`file exceeds ${MAX_BYTES} bytes`);
  const extension = extensionFor(response.headers.get("content-type"), response.url || sourceUrl);
  if (!extension) throw new Error(`unsupported content type ${response.headers.get("content-type") ?? "unknown"}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_BYTES) throw new Error(`file exceeds ${MAX_BYTES} bytes`);
  const filename = `${resource.id}.${extension}`;
  await fs.writeFile(path.join(OUTPUT_DIR, filename), buffer);
  return { path: `/resources/logos/${filename}`, sourceUrl, checkedAt: new Date().toISOString() };
}

async function syncResource(resource) {
  const candidates = [resource.icon?.logoUrl, resource.icon?.faviconUrl].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const local = await downloadCandidate(resource, candidate);
      console.log(`Downloaded ${resource.name} from ${candidate}`);
      return [resource.id, local];
    } catch (error) {
      console.warn(`Skipped ${resource.name} candidate ${candidate}: ${error.message}`);
    }
  }
  return null;
}

async function runPool(items, worker, concurrency) {
  const results = [];
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

await fs.mkdir(OUTPUT_DIR, { recursive: true });
const catalog = (await Promise.all(CATALOG_PATHS.map(async (catalogPath) => JSON.parse(await fs.readFile(catalogPath, "utf8"))))).flat().filter((resource,index,all)=>all.findIndex((candidate)=>candidate.id===resource.id)===index).slice(0,limit);
let manifest = {};
try { manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8")); } catch {}
const pending = catalog.filter((resource) => !manifest[resource.id]);
console.log(`Checking ${pending.length} icon records (${catalog.length - pending.length} already local).`);
const results = await runPool(pending, syncResource, CONCURRENCY);
for (const result of results) if (result) manifest[result[0]] = result[1];
await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Local icon manifest now contains ${Object.keys(manifest).length} records.`);
