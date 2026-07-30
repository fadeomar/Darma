import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const errors = [];
const warnings = [];
const requireText = (file, text, label = text) => { const value = read(file); if (!value.includes(text)) errors.push(`${file}: missing ${label}`); };

for (const file of [
  "src/app/guides/page.tsx",
  "src/app/guides/[slug]/page.tsx",
  "src/app/comparisons/page.tsx",
  "src/app/comparisons/[slug]/page.tsx",
  "src/app/resources/[category]/page.tsx",
  "src/app/editorial-policy/page.tsx",
  "src/app/opengraph-image.tsx",
]) if (!exists(file)) errors.push(`Missing SEO surface: ${file}`);

requireText("src/app/layout.tsx", "metadataBase", "metadataBase");
requireText("src/app/layout.tsx", '"@type": "Organization"', "Organization structured data");
requireText("src/app/layout.tsx", '"@type": "WebSite"', "WebSite structured data");
requireText("src/app/layout.tsx", "GOOGLE_SITE_VERIFICATION", "Google verification support");
requireText("src/app/about/page.tsx", '"@type": "AboutPage"', "AboutPage structured data");
requireText("src/app/about/page.tsx", "How Darma researches content", "editorial trust section");
requireText("src/app/about/page.tsx", 'id="maintainers"', "maintainer section");
requireText("src/app/resources/page.tsx", "hasFilters", "faceted noindex metadata");
requireText("src/app/search/page.tsx", "index: false", "site-search noindex");
requireText("src/app/login/layout.tsx", "index: false", "login noindex metadata");
requireText("src/app/admin/layout.tsx", "index: false", "admin noindex metadata");
requireText("src/app/tooltip/layout.tsx", "index: false", "legacy tooltip noindex metadata");
requireText("src/app/articles/learn-grid-css/layout.tsx", "index: false", "unreviewed legacy article noindex metadata");
requireText("src/app/explore/page.tsx", "hasFilters", "explore faceted noindex metadata");
requireText("src/app/tools/page.tsx", 'canonical: "/tools"', "tools canonical metadata");
requireText("src/app/sitemap.ts", "getEditorialPages", "editorial sitemap entries");
requireText("src/app/sitemap.ts", "getResourceHubs", "resource hub sitemap entries");

const sitemap = read("src/app/sitemap.ts");
if (/route:\s*["\']\/search["\']/.test(sitemap)) errors.push("sitemap.ts: noindex search route must not appear in the sitemap");
if (/lastModified:\s*new Date\(\s*\)/.test(sitemap)) errors.push("sitemap.ts: lastModified still uses the current build time");
const config = read("next.config.ts");
if (/source:\s*["']\/search/.test(config)) errors.push("next.config.ts: /search is still rewritten away from the real search page");
const layout = read("src/app/layout.tsx");
if (/alternates:\s*\{\s*canonical:\s*["\']\/["\']/.test(layout)) errors.push("layout.tsx: root layout must not define a site-wide homepage canonical");
if (/Front-end showcase and online tools/.test(layout)) errors.push("layout.tsx: legacy site identity remains in root metadata");
const editorial = JSON.parse(read("src/features/editorial/editorial-pages.json"));
if (editorial.length < 12) warnings.push(`Only ${editorial.length} editorial pages exist; review topical coverage before expanding quantity.`);
const hubsSource = read("src/features/editorial/resource-hubs.ts");
const hubs = (hubsSource.match(/slug:\s*"/g) || []).length;
if (hubs < 5) errors.push(`Only ${hubs} resource hubs detected`);

const result = { generatedAt: new Date().toISOString(), editorialPages: editorial.length, resourceHubs: hubs, errors, warnings };
fs.writeFileSync(path.join(root, "SEO_AUTHORITY_AUDIT.json"), JSON.stringify(result, null, 2) + "\n");
fs.writeFileSync(path.join(root, "SEO_AUTHORITY_AUDIT.md"), ["# SEO Authority Audit", "", `Generated: ${result.generatedAt}`, "", `- Editorial pages: **${result.editorialPages}**`, `- Resource hubs: **${result.resourceHubs}**`, `- Errors: **${errors.length}**`, `- Warnings: **${warnings.length}**`, "", "## Errors", ...(errors.length ? errors.map((item) => `- ${item}`) : ["- None"]), "", "## Warnings", ...(warnings.length ? warnings.map((item) => `- ${item}`) : ["- None"]), ""].join("\n"));
console.log(`SEO authority audit: ${errors.length} errors, ${warnings.length} warnings.`);
if (errors.length) process.exit(1);
