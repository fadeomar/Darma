// src/server/services/search.service.ts

import { getRepositories } from "@/server/repositories";
import { buildElementSearchSpec } from "@/features/projects/domain/search/elementSearch.spec";
import { toElementDTO } from "@/features/projects/dto/element.dto.mapper";
import type { ElementSort } from "@/features/projects/domain/element.repository";
import type {
  ElementDTO,
  PaginatedResultDTO,
} from "@/features/projects/dto/element.dto";

export type SearchServiceInput = {
  q?: string;
  exactMatch?: boolean;

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
  const { element: elementRepo } = getRepositories();

  const spec = buildElementSearchSpec({
    filters: {
      q: input.q,
      exactMatch: input.exactMatch,
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
