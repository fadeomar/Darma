import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));

const paths = readJson("src/features/learning-paths/learning-paths.json");
const resources = [
  ...readJson("src/features/resources/resources.catalog.json"),
  ...readJson("src/features/resources/curated-resources.json"),
];

const errors = [];
const warnings = [];
const pathSlugs = new Set();
const resourceIds = new Set(resources.map((resource) => resource.id));
let stageCount = 0;
let resourceReferenceCount = 0;

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isHttpsUrl = (value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

for (const [pathIndex, learningPath] of paths.entries()) {
  const label = learningPath.title || `path ${pathIndex + 1}`;

  if (!isNonEmptyString(learningPath.slug)) errors.push(`${label}: missing slug`);
  if (pathSlugs.has(learningPath.slug)) errors.push(`${label}: duplicate slug ${learningPath.slug}`);
  pathSlugs.add(learningPath.slug);

  if (!isNonEmptyString(learningPath.summary) || learningPath.summary.length < 50) {
    errors.push(`${label}: summary must contain at least 50 characters`);
  }
  if (!isNonEmptyString(learningPath.description) || learningPath.description.length < 100) {
    errors.push(`${label}: description must contain at least 100 characters`);
  }
  if (!Array.isArray(learningPath.stages) || learningPath.stages.length < 4) {
    errors.push(`${label}: requires at least four stages`);
    continue;
  }

  const stageIds = new Set();
  for (const [stageIndex, stage] of learningPath.stages.entries()) {
    stageCount += 1;
    const stageLabel = `${label} / ${stage.title || `stage ${stageIndex + 1}`}`;

    if (!isNonEmptyString(stage.id)) errors.push(`${stageLabel}: missing stage id`);
    if (stageIds.has(stage.id)) errors.push(`${stageLabel}: duplicate stage id ${stage.id}`);
    stageIds.add(stage.id);

    if (!Array.isArray(stage.resourceIds) || stage.resourceIds.length === 0) {
      errors.push(`${stageLabel}: requires at least one resource`);
    } else {
      const uniqueStageResources = new Set();
      for (const resourceId of stage.resourceIds) {
        resourceReferenceCount += 1;
        if (uniqueStageResources.has(resourceId)) warnings.push(`${stageLabel}: repeats resource ${resourceId}`);
        uniqueStageResources.add(resourceId);
        if (!resourceIds.has(resourceId)) errors.push(`${stageLabel}: missing resource ${resourceId}`);
      }
    }

    if (!Array.isArray(stage.topics) || stage.topics.length < 2) errors.push(`${stageLabel}: requires at least two topics`);
    if (!isNonEmptyString(stage.checkpoint) || stage.checkpoint.length < 20) errors.push(`${stageLabel}: checkpoint is too short`);
    if (!stage.project || !isNonEmptyString(stage.project.title)) errors.push(`${stageLabel}: missing practical project`);
    if (!Array.isArray(stage.project?.deliverables) || stage.project.deliverables.length === 0) {
      errors.push(`${stageLabel}: project requires deliverables`);
    }
  }

  if (!Array.isArray(learningPath.outcomes) || learningPath.outcomes.length < 3) {
    errors.push(`${label}: requires at least three outcomes`);
  }
  if (!learningPath.finalProject || !Array.isArray(learningPath.finalProject.deliverables) || learningPath.finalProject.deliverables.length < 2) {
    errors.push(`${label}: final project requires at least two deliverables`);
  }
  if (!Array.isArray(learningPath.references) || learningPath.references.length === 0) {
    errors.push(`${label}: requires at least one documented reference`);
  } else {
    for (const reference of learningPath.references) {
      if (!isNonEmptyString(reference.name) || !isHttpsUrl(reference.url)) {
        errors.push(`${label}: invalid reference ${reference.name || reference.url || "unknown"}`);
      }
    }
  }
}

for (const learningPath of paths) {
  for (const nextSlug of learningPath.recommendedNext || []) {
    if (!pathSlugs.has(nextSlug)) errors.push(`${learningPath.title}: recommended path does not exist: ${nextSlug}`);
    if (nextSlug === learningPath.slug) errors.push(`${learningPath.title}: cannot recommend itself`);
  }
}

const usedResourceIds = new Set(paths.flatMap((learningPath) => learningPath.stages.flatMap((stage) => stage.resourceIds)));
const unusedCurated = readJson("src/features/resources/curated-resources.json")
  .map((resource) => resource.id)
  .filter((id) => !usedResourceIds.has(id));
for (const id of unusedCurated) warnings.push(`Curated resource is not connected to a learning stage: ${id}`);

const report = {
  generatedAt: new Date().toISOString(),
  learningPaths: paths.length,
  stages: stageCount,
  uniqueResourcesUsed: usedResourceIds.size,
  resourceReferences: resourceReferenceCount,
  errors,
  warnings,
};

fs.writeFileSync(path.join(ROOT, "LEARNING_PATHS_AUDIT.json"), `${JSON.stringify(report, null, 2)}\n`);
const markdown = `# Learning Paths Audit\n\n- Generated: ${report.generatedAt}\n- Learning paths: ${report.learningPaths}\n- Stages: ${report.stages}\n- Unique resources used: ${report.uniqueResourcesUsed}\n- Resource references across stages: ${report.resourceReferences}\n- Errors: ${errors.length}\n- Review warnings: ${warnings.length}\n\n## Errors\n\n${errors.length ? errors.map((item) => `- ${item}`).join("\n") : "No structural errors found."}\n\n## Review warnings\n\n${warnings.length ? warnings.map((item) => `- ${item}`).join("\n") : "No review warnings found."}\n`;
fs.writeFileSync(path.join(ROOT, "LEARNING_PATHS_AUDIT.md"), markdown);

console.log(`Learning paths: ${paths.length}`);
console.log(`Stages: ${stageCount}`);
console.log(`Unique resources used: ${usedResourceIds.size}`);
console.log(`Errors: ${errors.length}`);
console.log(`Review warnings: ${warnings.length}`);

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
}
if (process.argv.includes("--verbose")) {
  for (const warning of warnings) console.warn(`REVIEW: ${warning}`);
}
