import type { LoaderCategory, LoaderFormat, LoaderIndexItem } from "./types";
import { getLoaderSearchText, sortLoaders } from "./loader-utils";

export type LoaderSortKey = "popular" | "name" | "category";

export type LoaderFilterState = {
  query: string;
  category: LoaderCategory;
  format: "all" | LoaderFormat;
  sort: LoaderSortKey;
  savedOnly: boolean;
};

export function matchesLoaderFilters(loader: LoaderIndexItem, filters: LoaderFilterState) {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery = !query || getLoaderSearchText(loader).includes(query);
  const matchesCategory =
    filters.category === "all" ||
    (filters.category === "popular" ? Boolean(loader.flags.popular) : loader.category === filters.category);
  const matchesFormat = filters.format === "all" || loader.formats.includes(filters.format);

  return matchesQuery && matchesCategory && matchesFormat;
}

export function filterLoaders(loaders: LoaderIndexItem[], filters: LoaderFilterState) {
  return sortLoaders(loaders.filter((loader) => matchesLoaderFilters(loader, filters)), filters.sort);
}

export function hasActiveLoaderFilters(filters: LoaderFilterState) {
  return Boolean(filters.query.trim()) || filters.category !== "all" || filters.format !== "all" || filters.sort !== "popular" || filters.savedOnly;
}
