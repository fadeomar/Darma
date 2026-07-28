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
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 12;

  if (input.visibility === "admin") {
    const status =
      input.reviewed === "true"
        ? "approved"
        : input.reviewed === "false"
          ? "pending"
          : input.includeDeleted
            ? "all"
            : "active";
    const result = await repositories.adminElement.list({
      query: input.q,
      status,
      page,
      pageSize,
    });
    return {
      items: result.items.map(toElementDTO),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  const spec = buildElementSearchSpec({
    filters: {
      q: input.q,
      exactMatch: input.exactMatch,
      includeShortDescription: input.includeShortDescription,
      mainCategory: input.mainCategory,
      secondaryCategory: input.secondaryCategory,
    },
    pagination: { page, pageSize },
    sort: mapSort(input.sort),
    visibility: { mode: "public" },
  });

  const result = await repositories.element.search(spec);
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
