import type { Element } from "../../domain/element";
import type {
  ElementRepository,
  ElementSearchResult,
  ElementSort,
} from "../../domain/element.repository";
import type { ElementSearchSpec } from "../../domain/search/elementSearch.types";
import { loadExplorerElements } from "./elementJson.loader";

export type ElementJsonLoader = () => Promise<readonly Element[]>;

function intersects(elementValues: string[], requestedValues: string[]): boolean {
  return requestedValues.some((value) => elementValues.includes(value));
}

function compareStrings(left: string, right: string): number {
  if (left === right) return 0;
  return left.localeCompare(right);
}

function compareIds(left: Element, right: Element): number {
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

function compareElements(sort: ElementSort, left: Element, right: Element): number {
  let primary = 0;

  switch (sort) {
    case "oldest":
      primary = left.createdAt.getTime() - right.createdAt.getTime();
      break;
    case "titleAsc":
      primary = compareStrings(left.title, right.title);
      break;
    case "titleDesc":
      primary = compareStrings(right.title, left.title);
      break;
    case "newest":
    default:
      primary = right.createdAt.getTime() - left.createdAt.getTime();
      break;
  }

  return primary || compareIds(left, right);
}

function matchesQuery(element: Element, spec: ElementSearchSpec): boolean {
  const { q, exactMatch, includeShortDescription } = spec.filters;
  if (!q || q.length === 0) return true;

  const normalizedQuery = q.toLowerCase();
  if (exactMatch) {
    return element.title.toLowerCase() === normalizedQuery;
  }

  return (
    element.title.toLowerCase().includes(normalizedQuery) ||
    element.description?.toLowerCase().includes(normalizedQuery) === true ||
    (includeShortDescription === true &&
      element.shortDescription?.toLowerCase().includes(normalizedQuery) ===
        true) ||
    element.tags.includes(q)
  );
}

export class ElementJsonRepository implements ElementRepository {
  constructor(private readonly loadElements: ElementJsonLoader = loadExplorerElements) {}

  async search(spec: ElementSearchSpec): Promise<ElementSearchResult> {
    const elements = await this.loadElements();
    const { filters, pagination, sort } = spec;

    const filtered = elements.filter((element) => {
      if (spec.publicOnly) {
        if (element.deleted || !element.reviewed) return false;
      } else {
        if (!spec.includeDeleted && element.deleted) return false;
        if (spec.reviewed !== undefined && element.reviewed !== spec.reviewed) {
          return false;
        }
      }

      if (
        filters.mainCategory &&
        filters.mainCategory.length > 0 &&
        !intersects(element.mainCategory, filters.mainCategory)
      ) {
        return false;
      }

      if (
        filters.secondaryCategory &&
        filters.secondaryCategory.length > 0 &&
        !intersects(element.secondaryCategory, filters.secondaryCategory)
      ) {
        return false;
      }

      return matchesQuery(element, spec);
    });

    const sorted = [...filtered].sort((left, right) =>
      compareElements(sort, left, right),
    );

    const page = pagination.page;
    const pageSize = pagination.pageSize;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    return {
      items: sorted.slice(skip, skip + take),
      total: sorted.length,
      page,
      pageSize,
    };
  }

  async getById(id: string): Promise<Element | null> {
    const elements = await this.loadElements();
    return (
      elements.find(
        (element) =>
          element.id === id && element.reviewed === true && element.deleted === false,
      ) ?? null
    );
  }

  async getBySlug(slug: string): Promise<Element | null> {
    const elements = await this.loadElements();
    return (
      elements.find(
        (element) =>
          element.slug === slug &&
          element.reviewed === true &&
          element.deleted === false,
      ) ?? null
    );
  }

  async getPublicSecondaryCategories(mainCategory: string): Promise<string[]> {
    const elements = await this.loadElements();
    const categories = elements
      .filter(
        (element) =>
          element.reviewed === true &&
          element.deleted === false &&
          element.mainCategory.includes(mainCategory),
      )
      .flatMap((element) => element.secondaryCategory);

    return Array.from(new Set(categories)).sort();
  }
}
