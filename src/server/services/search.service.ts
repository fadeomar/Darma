// src/server/services/search.service.ts

import { getRepositories } from "@/server/repositories";
import { buildElementSearchSpec } from "@/features/elements/domain/search/elementSearch.spec";
import { toElementDTO } from "@/features/elements/dto/element.dto.mapper";
import type { ElementSort } from "@/features/elements/domain/element.repository";
import type {
  ElementDTO,
  PaginatedResultDTO,
} from "@/features/elements/dto/element.dto";

export type SearchServiceInput = {
  q?: string;
  exactMatch?: boolean;
  includeShortDescription?: boolean;

  mainCategory?: string[];
  secondaryCategory?: string[];

  page?: number;
  pageSize?: number;

  sort?: "newest" | "oldest" | "titleAsc" | "titleDesc";

  // ✅ Visibility
  visibility?: "public" | "admin";
  includeDeleted?: boolean;
  reviewed?: "true" | "false" | "all";
};

function mapSort(sort?: SearchServiceInput["sort"]): ElementSort {
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

export async function searchElementsDTO(
  input: SearchServiceInput,
): Promise<PaginatedResultDTO<ElementDTO>> {
  const repositories = getRepositories();
  const elementRepo =
    input.visibility === "admin"
      ? repositories.adminElement
      : repositories.element;

  const spec = buildElementSearchSpec({
    filters: {
      q: input.q,
      exactMatch: input.exactMatch,
      includeShortDescription: input.includeShortDescription,
      mainCategory: input.mainCategory,
      secondaryCategory: input.secondaryCategory,
    },
    pagination: {
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 12,
    },
    sort: mapSort(input.sort),

    // ✅ Visibility handled by spec itself (no .and())
    visibility:
      input.visibility === "admin"
        ? {
            mode: "admin",
            includeDeleted: !!input.includeDeleted,
            reviewed: input.reviewed ?? "all",
          }
        : { mode: "public" },
  });

  const result = await elementRepo.search(spec);

  return {
    items: result.items.map(toElementDTO),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}

export async function getPublicSecondaryCategories(
  mainCategory: string,
): Promise<string[]> {
  return getRepositories().element.getPublicSecondaryCategories(mainCategory);
}
