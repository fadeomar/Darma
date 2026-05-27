import { loaderDetailLoaders } from "./data/generated/loader-detail-manifest";
import type { LoaderCategory, LoaderDefinition, LoaderPreviewItem } from "./types";

type JsonModule<T> = { default: T } | T;

type PreviewCategory = Exclude<LoaderCategory, "all">;

const categoryLoaders: Record<PreviewCategory, () => Promise<unknown>> = {
  popular: () => import("./data/generated/categories/popular.json"),
  dots: () => import("./data/generated/categories/dots.json"),
  spinners: () => import("./data/generated/categories/spinners.json"),
  bars: () => import("./data/generated/categories/bars.json"),
  pulse: () => import("./data/generated/categories/pulse.json"),
  skeleton: () => import("./data/generated/categories/skeleton.json"),
  button: () => import("./data/generated/categories/button.json"),
  progress: () => import("./data/generated/categories/progress.json"),
  minimal: () => import("./data/generated/categories/minimal.json"),
  fun: () => import("./data/generated/categories/fun.json"),
  tailwind: () => import("./data/generated/categories/tailwind.json"),
  creative: () => import("./data/generated/categories/creative.json"),
};

const categoryCache = new Map<string, Promise<LoaderPreviewItem[]>>();
const detailCache = new Map<string, Promise<LoaderDefinition>>();

function getDefaultExport<T>(module: JsonModule<T>): T {
  if (module && typeof module === "object" && "default" in module) {
    return (module as { default: T }).default;
  }

  return module as T;
}

export function canLoadPreviewCategory(category: string): category is PreviewCategory {
  return category in categoryLoaders;
}

export function loadLoaderPreviewCategory(category: PreviewCategory) {
  const existing = categoryCache.get(category);
  if (existing) return existing;

  const request = categoryLoaders[category]().then((module) => getDefaultExport(module as JsonModule<LoaderPreviewItem[]>));
  categoryCache.set(category, request);
  return request;
}

export async function loadLoaderPreviewCategories(categories: string[]) {
  const uniqueCategories = [...new Set(categories)].filter(canLoadPreviewCategory);
  const chunks = await Promise.all(uniqueCategories.map((category) => loadLoaderPreviewCategory(category)));
  return chunks.flat();
}

export function loadLoaderDetail(loaderId: string) {
  const existing = detailCache.get(loaderId);
  if (existing) return existing;

  const loadDetail = loaderDetailLoaders[loaderId];
  if (!loadDetail) {
    return Promise.reject(new Error(`Unknown loader detail file: ${loaderId}`));
  }

  const request = loadDetail().then((module) => getDefaultExport(module as JsonModule<LoaderDefinition>));
  detailCache.set(loaderId, request);
  return request;
}
