import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const pages = readJson("src/features/editorial/editorial-pages.json");
const legacy = readJson("src/features/resources/resources.catalog.json");
const curated = readJson("src/features/resources/curated-resources.json");
const learningPaths = readJson("src/features/learning-paths/learning-paths.json");
const careers = readJson("src/features/tech-careers/tech-careers.json");
const ways = readJson("src/features/ways-of-working/ways-of-working.json");

const errors = [];
const warnings = [];
const slugs = new Set();
const keywords = new Set();
const resourceIds = new Set([...legacy, ...curated].map((item) => item.id));
const pathSlugs = new Set(learningPaths.map((item) => item.slug));
const careerSlugs = new Set(careers.map((item) => item.slug));
const waySlugs = new Set(ways.map((item) => item.slug));
const wordCount = (value) => String(value || "").trim().split(/\s+/).filter(Boolean).length;

for (const page of pages) {
  if (slugs.has(page.slug)) errors.push(`Duplicate editorial slug: ${page.slug}`);
  slugs.add(page.slug);
  if (keywords.has(page.primaryKeyword.toLowerCase())) errors.push(`Duplicate primary keyword: ${page.primaryKeyword}`);
  keywords.add(page.primaryKeyword.toLowerCase());
  if (!["guide", "comparison"].includes(page.kind)) errors.push(`${page.slug}: invalid kind`);
  if (!Array.isArray(page.sections) || page.sections.length < 4) errors.push(`${page.slug}: fewer than four sections`);
  if (!Array.isArray(page.faqs) || page.faqs.length < 3) errors.push(`${page.slug}: fewer than three FAQs`);
  if (!Array.isArray(page.references) || page.references.length < 1) errors.push(`${page.slug}: missing references`);
  if (new Date(page.updatedAt) < new Date(page.publishedAt)) errors.push(`${page.slug}: updatedAt predates publishedAt`);
  if (new Date(page.updatedAt) > new Date()) errors.push(`${page.slug}: updatedAt is in the future`);
  if (page.kind === "comparison" && !page.comparisonTable) errors.push(`${page.slug}: comparison missing comparisonTable`);
  const fullText = [page.description, page.quickAnswer, ...page.keyTakeaways, ...page.sections.flatMap((section) => [section.title, ...section.paragraphs, ...(section.bullets || []), section.note || ""]), ...page.faqs.flatMap((item) => [item.question, item.answer])].join(" ");
  const words = wordCount(fullText);
  if (words < 650) warnings.push(`${page.slug}: editorial content is ${words} words; review whether the search intent is fully answered`);
  if (page.summary.length > 260) warnings.push(`${page.slug}: summary is long (${page.summary.length} characters)`);
  if (page.quickAnswer.length < 120) errors.push(`${page.slug}: quick answer is too short`);
  for (const id of page.resourceIds) if (!resourceIds.has(id)) errors.push(`${page.slug}: missing resource ${id}`);
  for (const slug of page.relatedPathSlugs) if (!pathSlugs.has(slug)) errors.push(`${page.slug}: missing learning path ${slug}`);
  for (const slug of page.relatedCareerSlugs) if (!careerSlugs.has(slug)) errors.push(`${page.slug}: missing career ${slug}`);
  for (const slug of page.relatedWaySlugs) if (!waySlugs.has(slug)) errors.push(`${page.slug}: missing way of working ${slug}`);
  for (const reference of page.references) {
    try { new URL(reference.url); } catch { errors.push(`${page.slug}: invalid reference URL ${reference.url}`); }
  }
}

const result = {
  generatedAt: new Date().toISOString(),
  pages: pages.length,
  guides: pages.filter((page) => page.kind === "guide").length,
  comparisons: pages.filter((page) => page.kind === "comparison").length,
  sections: pages.reduce((sum, page) => sum + page.sections.length, 0),
  faqs: pages.reduce((sum, page) => sum + page.faqs.length, 0),
  primaryReferences: pages.reduce((sum, page) => sum + page.references.length, 0),
  errors,
  warnings,
};

fs.writeFileSync(path.join(root, "EDITORIAL_CONTENT_AUDIT.json"), JSON.stringify(result, null, 2) + "\n");
fs.writeFileSync(path.join(root, "EDITORIAL_CONTENT_AUDIT.md"), [
  "# Editorial Content Audit",
  "",
  `Generated: ${result.generatedAt}`,
  "",
  `- Pages: **${result.pages}**`,
  `- Guides: **${result.guides}**`,
  `- Comparisons: **${result.comparisons}**`,
  `- Detailed sections: **${result.sections}**`,
  `- FAQs: **${result.faqs}**`,
  `- Primary references: **${result.primaryReferences}**`,
  `- Errors: **${errors.length}**`,
  `- Warnings: **${warnings.length}**`,
  "",
  "## Errors",
  ...(errors.length ? errors.map((item) => `- ${item}`) : ["- None"]),
  "",
  "## Warnings",
  ...(warnings.length ? warnings.map((item) => `- ${item}`) : ["- None"]),
  "",
].join("\n"));

console.log(`Editorial audit: ${pages.length} pages, ${errors.length} errors, ${warnings.length} warnings.`);
if (errors.length) process.exit(1);
