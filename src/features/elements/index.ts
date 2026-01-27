// src/features/projects/index.ts

// Domain
export type { Element, ElementId } from "./domain/element";
export type {
  ElementRepository,
  ElementSearchResult,
  ElementSort,
} from "./domain/element.repository";

// Search Spec
export type { ElementSearchSpec } from "./domain/search/elementSearch.types";
export { buildElementSearchSpec } from "./domain/search/elementSearch.spec";

// Infra exports are intentionally NOT re-exported here (keep boundary clean)
