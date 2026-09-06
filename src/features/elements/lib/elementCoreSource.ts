import { readFileSync } from "node:fs";
import path from "node:path";

import { EXPLORER_CATALOG_PATH, parseExplorerCatalog } from "../infra/json/elementJson.content";
import { toElementCoreEntities } from "./elementCoreAdapter";

// Runtime read, matching `elementJson.loader`. `next.config.ts` already traces
// `content/explorer/catalog.json` into the server output for every route.
// Deliberately not a `new URL(..., import.meta.url)` asset reference: that makes
// Turbopack copy the whole catalog into `.next/static`, publishing the
// unreviewed and deleted records with it.
const CATALOG_PATH = path.resolve(process.cwd(), EXPLORER_CATALOG_PATH);

/**
 * Project metadata for unified search.
 *
 * Visibility matches the public Explorer repositories (`elementJson.repository`
 * and `elementPrisma.repository`): a project is public when it is reviewed and
 * not deleted. Surfacing unreviewed projects here would put results in search
 * whose detail pages 404.
 */
function loadPublicProjects() {
  try {
    const elements = parseExplorerCatalog(readFileSync(CATALOG_PATH, "utf8"));
    return elements.filter((element) => element.reviewed && !element.deleted);
  } catch (error) {
    // Search must never take down the pages that render it.
    console.warn(`[search] Skipping Explorer projects: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

let cachedEntities: ReturnType<typeof toElementCoreEntities> | null = null;

export function getElementCoreEntities() {
  cachedEntities ??= toElementCoreEntities(loadPublicProjects());
  return cachedEntities;
}
