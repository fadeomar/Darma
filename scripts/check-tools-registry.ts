import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { getToolRegistry } from "../src/features/tools/registry/index";

function uniqueDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  return Array.from(duplicates).sort();
}

function readToolRouteFolders() {
  const toolsPath = join(process.cwd(), "src", "app", "tools");

  return readdirSync(toolsPath)
    .filter((entry) => {
      const absolutePath = join(toolsPath, entry);
      return statSync(absolutePath).isDirectory();
    })
    .sort();
}

function printIssue(title: string, items: string[]) {
  if (!items.length) return;

  console.error(`\n${title}`);
  for (const item of items) console.error(`- ${item}`);
}

const tools = getToolRegistry().list();
const routeFolders = readToolRouteFolders();
const routeFolderSet = new Set(routeFolders);
const registryIds = tools.map((tool) => tool.id);
const registryIdSet = new Set(registryIds);
const publicTools = tools.filter((tool) => tool.visibility === "public");

const foldersMissingRegistry = routeFolders.filter((folder) => !registryIdSet.has(folder));
const publicRegistryMissingRoutes = publicTools
  .filter((tool) => !routeFolderSet.has(tool.id))
  .map((tool) => tool.id);
const duplicateIds = uniqueDuplicates(registryIds);
const missingPrivacy = tools.filter((tool) => !tool.privacy).map((tool) => tool.id);
const missingKeywords = tools.filter((tool) => !tool.keywords?.length).map((tool) => tool.id);
const tooFewKeywords = tools.filter((tool) => (tool.keywords?.length ?? 0) > 0 && (tool.keywords?.length ?? 0) < 5).map((tool) => tool.id);
const missingRelatedTools = tools.filter((tool) => !tool.relatedTools?.length).map((tool) => tool.id);
const tooFewRelatedTools = tools.filter((tool) => (tool.relatedTools?.length ?? 0) > 0 && (tool.relatedTools?.length ?? 0) < 3).map((tool) => tool.id);
const hrefMismatches = publicTools
  .filter((tool) => tool.href !== `/tools/${tool.id}`)
  .map((tool) => `${tool.id}: ${tool.href}`);
const invalidRelatedTools: string[] = [];
const selfRelatedTools: string[] = [];

for (const tool of tools) {
  for (const relatedId of tool.relatedTools ?? []) {
    if (!registryIdSet.has(relatedId)) {
      invalidRelatedTools.push(`${tool.id} -> ${relatedId}`);
    }

    if (relatedId === tool.id) {
      selfRelatedTools.push(tool.id);
    }
  }
}

const issues = [
  foldersMissingRegistry,
  publicRegistryMissingRoutes,
  duplicateIds,
  missingPrivacy,
  missingKeywords,
  tooFewKeywords,
  missingRelatedTools,
  tooFewRelatedTools,
  hrefMismatches,
  invalidRelatedTools,
  selfRelatedTools,
];

printIssue("Tool folders missing registry entries:", foldersMissingRegistry);
printIssue("Public registry entries missing route folders:", publicRegistryMissingRoutes);
printIssue("Duplicate registry ids:", duplicateIds);
printIssue("Tools missing privacy metadata:", missingPrivacy);
printIssue("Tools missing keywords:", missingKeywords);
printIssue("Tools with fewer than 5 keywords:", tooFewKeywords);
printIssue("Tools missing relatedTools:", missingRelatedTools);
printIssue("Tools with fewer than 3 relatedTools:", tooFewRelatedTools);
printIssue("Public tool href/id mismatches:", hrefMismatches);
printIssue("Invalid relatedTools references:", invalidRelatedTools);
printIssue("Self-referencing relatedTools:", selfRelatedTools);

if (issues.some((items) => items.length > 0)) {
  process.exitCode = 1;
} else {
  console.log("Tool registry check passed.");
}
