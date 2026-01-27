// src/features/projects/domain/search/elementSearch.spec.ts

import type { ElementSort } from "../element.repository";
import type {
  ElementSearchFilters,
  ElementSearchPagination,
  ElementSearchSpec,
} from "./elementSearch.types";

function normalizePage(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function normalizePageSize(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 12;
  return Math.min(100, Math.floor(n));
}

function normalizeSort(sort?: string): ElementSort {
  switch (sort) {
    case "oldest":
    case "titleAsc":
    case "titleDesc":
    case "newest":
      return sort;
    default:
      return "newest";
  }
}

export type ElementVisibilityInput =
  | { mode: "public" }
  | {
      mode: "admin";
      includeDeleted?: boolean;
      reviewed?: "true" | "false" | "all";
    };

function mapReviewed(reviewed?: "true" | "false" | "all"): boolean | undefined {
  if (reviewed === "true") return true;
  if (reviewed === "false") return false;
  return undefined;
}

export function buildElementSearchSpec(input: {
  filters?: ElementSearchFilters;
  pagination?: Partial<ElementSearchPagination>;
  sort?: ElementSort | string;

  // ✅ NEW (optional)
  visibility?: ElementVisibilityInput;
}): ElementSearchSpec {
  const filters = input.filters ?? {};
  const pagination = input.pagination ?? {};

  const visibility = input.visibility ?? { mode: "public" as const };

  const isPublic = visibility.mode === "public";

  return {
    filters: {
      q: filters.q?.trim() || undefined,
      exactMatch: !!filters.exactMatch,
      mainCategory: filters.mainCategory ?? [],
      secondaryCategory: filters.secondaryCategory ?? [],
    },
    pagination: {
      page: normalizePage(pagination.page ?? 1),
      pageSize: normalizePageSize(pagination.pageSize ?? 12),
    },
    sort: normalizeSort(input.sort),
    projection: "preview",

    // ✅ Existing behavior preserved:
    // Public search always true unless admin mode is requested.
    publicOnly: isPublic,

    // ✅ NEW admin filters (ignored in public mode)
    includeDeleted: isPublic ? false : !!visibility.includeDeleted,
    reviewed: isPublic ? undefined : mapReviewed(visibility.reviewed),
  };
}
