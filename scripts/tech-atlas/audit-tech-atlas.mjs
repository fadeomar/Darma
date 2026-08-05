import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const readJson = async (path) => JSON.parse(await readFile(join(ROOT, path), "utf8"));
const verbose = process.argv.includes("--verbose");
const errors = [];
const warnings = [];
const checkUnique = (items, key, label) => {
  const seen = new Set();
  for (const item of items) {
    if (!item[key]) errors.push(`${label} contains an item without ${key}.`);
    else if (seen.has(item[key])) errors.push(`${label} contains duplicate ${key}: ${item[key]}.`);
    seen.add(item[key]);
  }
  return seen;
};
const checkRefs = (owner, values, valid, label) => {
  for (const value of values ?? []) if (!valid.has(value)) errors.push(`${owner} references missing ${label}: ${value}.`);
};
const checkUrl = (owner, value) => {
  try { new URL(value); } catch { errors.push(`${owner} contains an invalid URL: ${value}.`); }
};
const requireArray = (owner, value, minimum, label) => {
  if (!Array.isArray(value) || value.length < minimum) errors.push(`${owner} needs at least ${minimum} ${label}.`);
};

const [careers, ways, terms, teamModels, deliveryFlow, paths, legacyResources, curatedResources] = await Promise.all([
  readJson("src/features/tech-careers/tech-careers.json"),
  readJson("src/features/ways-of-working/ways-of-working.json"),
  readJson("src/features/tech-glossary/tech-glossary.json"),
  readJson("src/features/tech-teams/team-models.json"),
  readJson("src/features/tech-teams/delivery-flow.json"),
  readJson("src/features/learning-paths/learning-paths.json"),
  readJson("src/features/resources/resources.catalog.json"),
  readJson("src/features/resources/curated-resources.json"),
]);
const resources = [...legacyResources, ...curatedResources];
const careerSlugs = checkUnique(careers, "slug", "Tech careers");
const waySlugs = checkUnique(ways, "slug", "Ways of working");
const termSlugs = checkUnique(terms, "slug", "Glossary");
const teamSlugs = checkUnique(teamModels, "slug", "Team models");
const stageIds = checkUnique(deliveryFlow, "id", "Delivery flow");
const pathSlugs = checkUnique(paths, "slug", "Learning paths");
const resourceIds = checkUnique(resources, "id", "Combined resource catalog");

for (const career of careers) {
  const owner = `Career ${career.slug}`;
  if ((career.summary ?? "").length < 60) errors.push(`${owner} summary is too short.`);
  if ((career.whatTheyDo ?? "").length < 120) errors.push(`${owner} role explanation is too short.`);
  requireArray(owner, career.typicalDay, 4, "typical-day activities");
  requireArray(owner, career.responsibilities, 4, "responsibilities");
  requireArray(owner, career.deliverables, 3, "deliverables");
  requireArray(owner, career.howToStart, 3, "starting steps");
  checkRefs(owner, career.collaboratesWith, careerSlugs, "career");
  checkRefs(owner, career.learningPathSlugs, pathSlugs, "learning path");
  checkRefs(owner, career.resourceIds, resourceIds, "resource");
  for (const reference of career.references ?? []) checkUrl(owner, reference.url);
}

for (const way of ways) {
  const owner = `Way ${way.slug}`;
  if ((way.description ?? "").length < 140) errors.push(`${owner} description is too short.`);
  requireArray(owner, way.bestFor, 3, "best-fit conditions");
  requireArray(owner, way.coreIdeas, 4, "core ideas");
  requireArray(owner, way.flow, 3, "flow stages");
  requireArray(owner, way.strengths, 3, "strengths");
  requireArray(owner, way.risks, 3, "risks");
  requireArray(owner, way.healthySignals, 3, "healthy signals");
  checkRefs(owner, way.relatedRoleSlugs, careerSlugs, "career");
  checkRefs(owner, way.relatedTerms, termSlugs, "glossary term");
  checkRefs(owner, way.compareWith, waySlugs, "comparison method");
  checkRefs(owner, way.resourceIds, resourceIds, "resource");
  for (const reference of way.references ?? []) checkUrl(owner, reference.url);
}

for (const term of terms) {
  const owner = `Term ${term.slug}`;
  if ((term.definition ?? "").length < 50) errors.push(`${owner} definition is too short.`);
  if ((term.practicalMeaning ?? "").length < 60) errors.push(`${owner} practical explanation is too short.`);
  if ((term.example ?? "").length < 30) errors.push(`${owner} example is too short.`);
  checkRefs(owner, term.relatedTerms, termSlugs, "related term");
  checkRefs(owner, term.relatedRoleSlugs, careerSlugs, "career");
  checkRefs(owner, term.relatedMethodSlugs, waySlugs, "way of working");
}

for (const model of teamModels) {
  const owner = `Team model ${model.slug}`;
  requireArray(owner, model.usefulWhen, 3, "useful conditions");
  requireArray(owner, model.watchOutFor, 3, "risks");
  checkRefs(owner, model.typicalRoleSlugs, careerSlugs, "career");
}
for (const stage of deliveryFlow) {
  const owner = `Delivery stage ${stage.id}`;
  checkRefs(owner, stage.roleSlugs, careerSlugs, "career");
  checkRefs(owner, stage.glossaryTerms, termSlugs, "glossary term");
}

for (const career of careers) if (!career.learningPathSlugs.length) warnings.push(`Career ${career.slug} does not yet have a dedicated learning path.`);
for (const term of terms) if (!(term.relatedRoleSlugs.length || term.relatedMethodSlugs.length)) warnings.push(`Glossary term ${term.slug} has no role or method link.`);

const report = {
  generatedAt: new Date().toISOString(),
  status: errors.length ? "failed" : "passed",
  counts: { careers: careers.length, waysOfWorking: ways.length, glossaryTerms: terms.length, teamModels: teamModels.length, deliveryStages: deliveryFlow.length, learningPaths: paths.length, resources: resources.length },
  errors,
  warnings,
};
await writeFile(join(ROOT, "TECH_ATLAS_AUDIT.json"), JSON.stringify(report, null, 2) + "\n");
const markdown = `# Darma Tech Atlas Audit\n\n- Status: **${report.status.toUpperCase()}**\n- Generated: ${report.generatedAt}\n\n## Counts\n\n| Content | Count |\n|---|---:|\n| Tech careers | ${careers.length} |\n| Ways of working | ${ways.length} |\n| Glossary terms | ${terms.length} |\n| Team models | ${teamModels.length} |\n| Delivery stages | ${deliveryFlow.length} |\n| Learning paths | ${paths.length} |\n| Combined resources | ${resources.length} |\n\n## Errors (${errors.length})\n\n${errors.length ? errors.map((item) => `- ${item}`).join("\n") : "No errors found."}\n\n## Review notes (${warnings.length})\n\n${warnings.length ? warnings.map((item) => `- ${item}`).join("\n") : "No review notes."}\n`;
await writeFile(join(ROOT, "TECH_ATLAS_AUDIT.md"), markdown);
console.log(`Tech Atlas audit ${report.status}: ${careers.length} careers, ${ways.length} ways, ${terms.length} terms, ${teamModels.length} team models, ${deliveryFlow.length} delivery stages.`);
if (verbose || errors.length) {
  for (const item of errors) console.error(`ERROR: ${item}`);
  for (const item of warnings) console.warn(`WARN: ${item}`);
}
if (errors.length) process.exit(1);
