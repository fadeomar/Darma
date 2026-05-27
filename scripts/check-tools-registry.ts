import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { getToolRegistry } from "../src/features/tools/registry/index";
import type { ToolDefinition, ToolLayoutType, ToolPrivacy } from "../src/features/tools/domain/tool";

const KNOWN_NON_TOOL_FOLDERS = new Set(["_shared", "audience", "category", "privacy", "workflows"]);
const VALID_LAYOUTS: ToolLayoutType[] = ["text-workbench", "visual-generator", "fullscreen-studio", "single-utility", "directory"];
const VALID_PRIVACY: ToolPrivacy[] = ["client-only", "local-storage", "server-assisted", "external-api"];

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
      if (KNOWN_NON_TOOL_FOLDERS.has(entry)) return false;
      const absolutePath = join(toolsPath, entry);
      return statSync(absolutePath).isDirectory() && existsSync(join(absolutePath, "page.tsx"));
    })
    .sort();
}

function printIssue(title: string, items: string[]) {
  if (!items.length) return;

  console.error(`\n${title}`);
  for (const item of items) console.error(`- ${item}`);
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

const tools = getToolRegistry().list();
const routeFolders = readToolRouteFolders();
const routeFolderSet = new Set(routeFolders);
const registryIds = tools.map((tool) => tool.id);
const registryIdSet = new Set(registryIds);
const hrefs = tools.map((tool) => tool.href);
const publicTools = tools.filter((tool) => tool.visibility === "public");

const routeFoldersMissingRegistry = routeFolders.filter((folder) => !registryIdSet.has(folder));
const publicRegistryMissingRoutes = publicTools
  .filter((tool) => !routeFolderSet.has(tool.id))
  .map((tool) => tool.id);
const duplicateIds = uniqueDuplicates(registryIds);
const duplicateHrefs = uniqueDuplicates(hrefs);
const missingRequired = publicTools
  .filter((tool) => !hasText(tool.id) || !hasText(tool.title) || !hasText(tool.description) || !hasText(tool.href))
  .map((tool) => tool.id || "(missing id)");
const missingTags = publicTools.filter((tool) => !tool.tags?.length).map((tool) => tool.id);
const missingCategories = publicTools
  .filter((tool) => !tool.mainCategory?.length || !tool.secondaryCategory?.length)
  .map((tool) => tool.id);
const missingLayoutType = publicTools.filter((tool) => !tool.layoutType).map((tool) => tool.id);
const unknownLayoutType = publicTools
  .filter((tool) => tool.layoutType && !VALID_LAYOUTS.includes(tool.layoutType))
  .map((tool) => `${tool.id}: ${tool.layoutType}`);
const unknownPrivacy = publicTools
  .filter((tool) => tool.privacy && !VALID_PRIVACY.includes(tool.privacy))
  .map((tool) => `${tool.id}: ${tool.privacy}`);
const hrefMismatches = publicTools
  .filter((tool) => !tool.href.startsWith("/tools/"))
  .map((tool) => `${tool.id}: ${tool.href}`);
const invalidRelatedTools: string[] = [];
const selfRelatedTools: string[] = [];
const nonPublicRelatedTools: string[] = [];
const featuredWithoutSorting = publicTools
  .filter((tool) => tool.featured && typeof tool.pinned !== "number")
  .map((tool) => tool.id);

for (const tool of tools) {
  for (const relatedId of tool.relatedTools ?? []) {
    const related = registryIdSet.has(relatedId)
      ? tools.find((candidate) => candidate.id === relatedId)
      : null;

    if (!related) {
      invalidRelatedTools.push(`${tool.id} -> ${relatedId}`);
      continue;
    }

    if (relatedId === tool.id) selfRelatedTools.push(tool.id);
    if (related.visibility !== "public") nonPublicRelatedTools.push(`${tool.id} -> ${relatedId}`);
  }
}

const issues: Record<string, string[]> = {
  "Tool route folders missing registry entries": routeFoldersMissingRegistry,
  "Public registry entries missing route folders": publicRegistryMissingRoutes,
  "Duplicate registry ids": duplicateIds,
  "Duplicate registry hrefs": duplicateHrefs,
  "Public tools missing required id/title/description/href": missingRequired,
  "Public tools missing tags": missingTags,
  "Public tools missing categories": missingCategories,
  "Public tools missing layoutType": missingLayoutType,
  "Public tools with unknown layoutType": unknownLayoutType,
  "Public tools with unknown privacy value": unknownPrivacy,
  "Public tool hrefs that do not start with /tools/": hrefMismatches,
  "Invalid relatedTools references": invalidRelatedTools,
  "Self-referencing relatedTools": selfRelatedTools,
  "Related tools that are not public": nonPublicRelatedTools,
  "Featured tools without pinned sorting": featuredWithoutSorting,
};

for (const [title, items] of Object.entries(issues)) printIssue(`${title}:`, items);

if (Object.values(issues).some((items) => items.length > 0)) {
  process.exitCode = 1;
} else {
  console.log(`Tool registry check passed for ${tools.length} tools and ${publicTools.length} public routes.`);
}
