// src/features/projects/domain/element.repository.ts

import type { Element } from "./element";
import type { ElementSearchSpec } from "./search/elementSearch.types";

export type ElementSort = "newest" | "oldest" | "titleAsc" | "titleDesc";

export type ElementSearchInput = {
  q?: string;
  exactMatch?: boolean;

  mainCategory?: string[];
  secondaryCategory?: string[];

  page: number;
  pageSize: number;
  sort: ElementSort;

  projection?: ElementProjection; // NEW (default: "preview")
};

export type ElementSearchResult = {
  items: Element[];
  total: number;
  page: number;
  pageSize: number;
};

export interface ElementRepository {
  search(spec: ElementSearchSpec): Promise<ElementSearchResult>;

  // New: public read (used by preview page)
  getById(id: string): Promise<Element | null>;
}

export type ElementProjection = "preview" | "summary";
