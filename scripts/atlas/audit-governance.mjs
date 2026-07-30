import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const errors = [];
const warnings = [];
const requiredFiles = [
  "CONTRIBUTING.md",
  "src/app/contribute/page.tsx",
  "src/features/search/lib/atlasSearchAdapter.ts",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "docs/atlas/CONTENT_GOVERNANCE.md",
  "docs/atlas/REVIEW_PLAYBOOK.md",
  "docs/atlas/MAINTAINER_RUNBOOK.md",
  "docs/atlas/REPOSITORY_SETUP.md",
  ".github/pull_request_template.md",
  ".github/CODEOWNERS",
  ".github/dependabot.yml",
  ".github/workflows/atlas-quality.yml",
  ".github/workflows/atlas-link-health.yml",
  ".github/ISSUE_TEMPLATE/resource-suggestion.yml",
  ".github/ISSUE_TEMPLATE/broken-resource.yml",
  ".github/ISSUE_TEMPLATE/learning-path-improvement.yml",
  ".github/ISSUE_TEMPLATE/atlas-content-correction.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
];

for (const file of requiredFiles) {
  const target = path.join(root, file);
  if (!fs.existsSync(target)) errors.push(`Missing governance file: ${file}`);
  else if (fs.statSync(target).size < 20) errors.push(`Governance file is unexpectedly empty: ${file}`);
}


const searchRegistry = fs.readFileSync(path.join(root, "src/features/search/lib/unifiedSearchRegistry.ts"), "utf8");
if (!searchRegistry.includes("getAtlasSearchEntities")) errors.push("Unified search is not connected to the Tech Atlas adapter.");
const sitemap = fs.readFileSync(path.join(root, "src/app/sitemap.ts"), "utf8");
if (!sitemap.includes('"/contribute"')) errors.push("The contribution page is missing from the sitemap.");

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const requiredScripts = ["atlas:audit", "atlas:governance", "atlas:quality", "atlas:links", "atlas:links:sample"];
for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) errors.push(`Missing package script: ${script}`);
}

const issueForms = requiredFiles.filter((file) => file.startsWith(".github/ISSUE_TEMPLATE/") && file.endsWith(".yml") && !file.endsWith("config.yml"));
for (const file of issueForms) {
  if (!fs.existsSync(path.join(root, file))) continue;
  const body = fs.readFileSync(path.join(root, file), "utf8");
  for (const token of ["name:", "description:", "body:", "validations:", "required: true"]) {
    if (!body.includes(token)) errors.push(`${file} is missing required issue-form structure: ${token}`);
  }
}

for (const workflow of [".github/workflows/atlas-quality.yml", ".github/workflows/atlas-link-health.yml"]) {
  if (!fs.existsSync(path.join(root, workflow))) continue;
  const body = fs.readFileSync(path.join(root, workflow), "utf8");
  if (!body.includes("permissions:")) errors.push(`${workflow} must declare explicit permissions.`);
  if (body.includes("contents: write") || body.includes("issues: write") || body.includes("pull-requests: write")) {
    warnings.push(`${workflow} has write permissions; confirm they are necessary.`);
  }
}

const catalogs = [
  "src/features/resources/resources.catalog.json",
  "src/features/resources/curated-resources.json",
].map((file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8")));
const resources = new Map();
for (const item of catalogs.flat()) resources.set(item.url, item);

let verified = 0;
let reviewNeeded = 0;
let archived = 0;
let staleFeatured = 0;
let suspiciousTracking = 0;
const now = Date.now();
const featuredMaxAge = 180 * 24 * 60 * 60 * 1000;

for (const resource of resources.values()) {
  if (resource.review?.status === "verified") verified += 1;
  else if (resource.review?.status === "archived") archived += 1;
  else reviewNeeded += 1;

  if (resource.featured && resource.review?.status === "verified") {
    const checked = resource.review.lastChecked ? Date.parse(resource.review.lastChecked) : Number.NaN;
    if (!Number.isFinite(checked) || now - checked > featuredMaxAge) staleFeatured += 1;
  }

  try {
    const url = new URL(resource.url);
    const keys = [...url.searchParams.keys()].map((key) => key.toLowerCase());
    if (keys.some((key) => ["aff", "affiliate", "referral", "utm_source", "utm_campaign"].includes(key))) suspiciousTracking += 1;
  } catch {
    errors.push(`Invalid canonical resource URL: ${resource.url}`);
  }
}

if (staleFeatured) warnings.push(`${staleFeatured} featured verified resources exceed the 180-day review target.`);
if (suspiciousTracking) warnings.push(`${suspiciousTracking} canonical URLs contain tracking-like parameters and should be reviewed.`);

const result = {
  generatedAt: new Date().toISOString(),
  status: errors.length ? "failed" : "passed",
  counts: {
    governanceFiles: requiredFiles.length,
    issueForms: issueForms.length,
    uniqueResources: resources.size,
    verified,
    reviewNeeded,
    archived,
    staleFeatured,
    suspiciousTracking,
    errors: errors.length,
    warnings: warnings.length,
  },
  errors,
  warnings,
};

const markdown = [
  "# Tech Atlas Governance Audit",
  "",
  `Generated: ${result.generatedAt}`,
  "",
  `**Status:** ${result.status.toUpperCase()}`,
  "",
  "## Counts",
  "",
  ...Object.entries(result.counts).map(([key, value]) => `- **${key}:** ${value}`),
  "",
  "## Errors",
  "",
  ...(errors.length ? errors.map((item) => `- ${item}`) : ["- None"]),
  "",
  "## Warnings",
  "",
  ...(warnings.length ? warnings.map((item) => `- ${item}`) : ["- None"]),
  "",
].join("\n");

fs.writeFileSync(path.join(root, "ATLAS_GOVERNANCE_AUDIT.json"), `${JSON.stringify(result, null, 2)}\n`);
fs.writeFileSync(path.join(root, "ATLAS_GOVERNANCE_AUDIT.md"), markdown);
console.log(`Governance audit ${result.status}: ${errors.length} error(s), ${warnings.length} warning(s).`);
if (errors.length) process.exitCode = 1;
