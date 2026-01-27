// src/features/projects/domain/search/elementSearch.types.ts

import type { ElementSort } from "../element.repository";

export type ElementSearchProjection = "preview";

export type ElementSearchFilters = {
  q?: string;
  exactMatch?: boolean;

  mainCategory?: string[];
  secondaryCategory?: string[];
};

export type ElementSearchPagination = {
  page: number; // 1-based
  pageSize: number; // 1..100
};

export type ElementSearchSpec = {
  filters: ElementSearchFilters;
  pagination: ElementSearchPagination;
  sort: ElementSort;
  projection: ElementSearchProjection;

  /**
   * Hard safety defaults at domain level.
   * - publicOnly => deleted=false always
   */
  publicOnly: boolean;
  includeDeleted?: boolean;
  reviewed?: boolean;
};
