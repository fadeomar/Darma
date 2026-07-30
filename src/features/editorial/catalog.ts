import editorialData from "./editorial-pages.json";
import { editorialCatalogSchema, type EditorialKind, type EditorialPage } from "./schema";

export const EDITORIAL_PAGES: EditorialPage[] = editorialCatalogSchema.parse(editorialData);
export const getEditorialPages = () => EDITORIAL_PAGES;
export const getEditorialPage = (slug: string) => EDITORIAL_PAGES.find((page) => page.slug === slug);
export const getEditorialPagesByKind = (kind: EditorialKind) => EDITORIAL_PAGES.filter((page) => page.kind === kind);
export const getFeaturedEditorialPages = (limit = EDITORIAL_PAGES.length) => EDITORIAL_PAGES.filter((page) => page.featured).slice(0, limit);
