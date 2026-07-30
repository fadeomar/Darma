import wayData from "./ways-of-working.json";
import { wayOfWorkingCatalogSchema, type WayKind, type WayOfWorking } from "./schema";

export const WAYS_OF_WORKING: WayOfWorking[] = wayOfWorkingCatalogSchema.parse(wayData);
export const WAY_KINDS: WayKind[] = [
  "principles",
  "framework",
  "method",
  "lifecycle",
  "design-process",
  "predictive-model",
  "hybrid",
];

export const getWaysOfWorking = () => WAYS_OF_WORKING;
export const getWayOfWorking = (slug: string) => WAYS_OF_WORKING.find((way) => way.slug === slug);
export const getFeaturedWaysOfWorking = (limit = WAYS_OF_WORKING.length) =>
  WAYS_OF_WORKING.filter((way) => way.featured).slice(0, limit);
export const getWaysBySlugs = (slugs: string[]) =>
  slugs.map((slug) => getWayOfWorking(slug)).filter((way): way is WayOfWorking => Boolean(way));

export function getWayLinksByResourceId() {
  const links: Record<string, Array<{ title: string; href: string }>> = {};
  for (const way of WAYS_OF_WORKING) {
    for (const id of way.resourceIds) {
      links[id] ??= [];
      links[id].push({ title: way.shortTitle, href: `/ways-of-working/${way.slug}` });
    }
  }
  return links;
}
