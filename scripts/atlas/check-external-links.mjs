import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [rawKey, ...rest] = arg.replace(/^--/, "").split("=");
  return [rawKey, rest.length ? rest.join("=") : true];
}));
const limit = args.limit ? Math.max(1, Number(args.limit)) : undefined;
const reportPath = String(args.report || "ATLAS_LINK_HEALTH.md");
const jsonPath = String(args.json || "ATLAS_LINK_HEALTH.json");
const timeoutMs = args.timeout ? Math.max(1000, Number(args.timeout)) : 12000;
const concurrency = args.concurrency ? Math.min(20, Math.max(1, Number(args.concurrency))) : 8;

const catalogs = [
  "src/features/resources/resources.catalog.json",
  "src/features/resources/curated-resources.json",
].map((file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8")));
const unique = new Map();
for (const resource of catalogs.flat()) unique.set(resource.url, resource);
let resources = [...unique.values()].sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
if (limit) resources = resources.slice(0, limit);

const headers = {
  "user-agent": "Darma-Tech-Atlas-Link-Health/1.0 (+https://github.com/fadeomar/Darma)",
  accept: "text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.5",
};

async function request(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { method, redirect: "follow", headers, signal: controller.signal });
    return { status: response.status, finalUrl: response.url || url };
  } finally {
    clearTimeout(timer);
  }
}

function classify(status) {
  if (status >= 200 && status < 400) return "ok";
  if ([401, 403, 405, 406, 409, 418, 425, 429, 451].includes(status)) return "blocked";
  if ([404, 410].includes(status)) return "broken";
  if (status >= 400 && status < 500) return "needs-review";
  if (status >= 500) return "unavailable";
  return "unavailable";
}

async function check(resource) {
  const started = Date.now();
  try {
    let response = await request(resource.url, "HEAD");
    if ([400, 405, 501].includes(response.status)) response = await request(resource.url, "GET");
    return {
      id: resource.id,
      name: resource.name,
      url: resource.url,
      statusCode: response.status,
      finalUrl: response.finalUrl,
      classification: classify(response.status),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      id: resource.id,
      name: resource.name,
      url: resource.url,
      statusCode: null,
      finalUrl: resource.url,
      classification: "unavailable",
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const results = new Array(resources.length);
let cursor = 0;
async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= resources.length) return;
    results[index] = await check(resources[index]);
    const result = results[index];
    console.log(`[${index + 1}/${resources.length}] ${result.classification.padEnd(12)} ${result.name} (${result.statusCode ?? "network"})`);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, resources.length) }, () => worker()));

const counts = results.reduce((acc, item) => {
  acc[item.classification] = (acc[item.classification] || 0) + 1;
  return acc;
}, {});
const generatedAt = new Date().toISOString();
const needsAttention = results.filter((item) => item.classification !== "ok");
const payload = { generatedAt, checked: results.length, counts, results };

const markdown = [
  "# Tech Atlas External Link Health",
  "",
  `Generated: ${generatedAt}`,
  "",
  `Checked **${results.length}** unique resource URLs. Automated blocking and temporary failures require manual confirmation before a source is archived.`,
  "",
  "## Summary",
  "",
  ...["ok", "blocked", "needs-review", "broken", "unavailable"].map((key) => `- **${key}:** ${counts[key] || 0}`),
  "",
  "## Needs attention",
  "",
  ...(needsAttention.length ? needsAttention.map((item) => `- **${item.classification}** — ${item.name} — ${item.statusCode ?? item.error ?? "network error"} — ${item.url}`) : ["- None"]),
  "",
].join("\n");

fs.writeFileSync(path.join(root, reportPath), markdown);
fs.writeFileSync(path.join(root, jsonPath), `${JSON.stringify(payload, null, 2)}\n`);
if (args["github-summary"] && process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);

console.log(`Link health complete: ${JSON.stringify(counts)}.`);
if ((counts.broken || 0) > 0) process.exitCode = 2;
