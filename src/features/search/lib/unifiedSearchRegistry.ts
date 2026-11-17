import { createCoreRegistryIndex, type CoreEntity, type CoreRegistry } from "@/core";
import { getCollectionCoreEntities } from "@/features/collections";
import { getElementCoreEntities } from "@/features/elements/lib/elementCoreSource";
import { getGames } from "@/features/games";
import { toGameCoreEntities } from "@/features/games/lib/gameCoreAdapter";
import { getToolRegistry } from "@/features/tools";
import { toToolCoreEntities } from "@/features/tools/lib/toolCoreAdapter";
import { toolWorkflows } from "@/features/tools/workflows";
import { toWorkflowCoreEntities } from "@/features/tools/workflows/workflowCoreAdapter";
import { getAtlasSearchEntities } from "./atlasSearchAdapter";

export function getUnifiedSearchEntities(): CoreEntity[] {
  const toolEntities = toToolCoreEntities(getToolRegistry().list().filter((tool) => tool.visibility === "public"));
  const gameEntities = toGameCoreEntities(getGames().filter((game) => (game.visibility ?? "public") === "public"));
  const projectEntities = getElementCoreEntities();
  const workflowEntities = toWorkflowCoreEntities(toolWorkflows);
  const collectionEntities = getCollectionCoreEntities();
  const atlasEntities = getAtlasSearchEntities();

  return [...toolEntities, ...gameEntities, ...projectEntities, ...workflowEntities, ...collectionEntities, ...atlasEntities];
}

export function createUnifiedSearchRegistry(): CoreRegistry<CoreEntity> {
  return {
    id: "unified-search",
    title: "Darma Unified Search",
    description: "Search-ready registry combining Tools, Games, Explore projects, Workflows, Collections, Resources, and the Tech Atlas.",
    items: getUnifiedSearchEntities(),
  };
}

export function createUnifiedSearchIndex() {
  return createCoreRegistryIndex([createUnifiedSearchRegistry()]);
}
