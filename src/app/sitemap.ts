import type { MetadataRoute } from "next";
import { getPublicTools } from "@/features/tools";
import { absoluteUrl } from "@/features/tools/seo";
import { getGames } from "@/features/games";
import { getLearningPaths } from "@/features/learning-paths";
import { getTechCareers } from "@/features/tech-careers";
import { getWaysOfWorking } from "@/features/ways-of-working";
import { getEditorialPages, getResourceHubs } from "@/features/editorial";
import { CSS_LOADERS_PATH, getLoaderHubPath, LOADER_HUB_SLUGS } from "@/app/tools/css-loaders/loader-hubs";

const ORIGINAL_CONTENT_DATE = new Date("2026-07-22T00:00:00.000Z");
const ATLAS_DATE = new Date("2026-07-29T00:00:00.000Z");

const STATIC_ROUTES: Array<{ route: string; modified: Date; priority: number; frequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { route: "/", modified: ATLAS_DATE, priority: 1, frequency: "weekly" },
  { route: "/tools", modified: ORIGINAL_CONTENT_DATE, priority: 0.9, frequency: "weekly" },
  { route: "/games", modified: ORIGINAL_CONTENT_DATE, priority: 0.8, frequency: "monthly" },
  { route: "/collections", modified: ORIGINAL_CONTENT_DATE, priority: 0.7, frequency: "monthly" },
  { route: "/explore", modified: ORIGINAL_CONTENT_DATE, priority: 0.8, frequency: "weekly" },
  { route: "/categories", modified: ORIGINAL_CONTENT_DATE, priority: 0.7, frequency: "monthly" },
  { route: "/tech-atlas", modified: ATLAS_DATE, priority: 0.95, frequency: "weekly" },
  { route: "/resources", modified: ATLAS_DATE, priority: 0.9, frequency: "weekly" },
  { route: "/learning-paths", modified: ATLAS_DATE, priority: 0.9, frequency: "monthly" },
  { route: "/tech-careers", modified: ATLAS_DATE, priority: 0.85, frequency: "monthly" },
  { route: "/career-pathfinder", modified: ATLAS_DATE, priority: 0.85, frequency: "monthly" },
  { route: "/ways-of-working", modified: ATLAS_DATE, priority: 0.85, frequency: "monthly" },
  { route: "/tech-teams", modified: ATLAS_DATE, priority: 0.75, frequency: "monthly" },
  { route: "/tech-glossary", modified: ATLAS_DATE, priority: 0.8, frequency: "monthly" },
  { route: "/guides", modified: ATLAS_DATE, priority: 0.95, frequency: "weekly" },
  { route: "/comparisons", modified: ATLAS_DATE, priority: 0.9, frequency: "weekly" },
  { route: "/editorial-policy", modified: ATLAS_DATE, priority: 0.6, frequency: "yearly" },
  { route: "/contribute", modified: ATLAS_DATE, priority: 0.6, frequency: "monthly" },
  { route: "/about", modified: ATLAS_DATE, priority: 0.8, frequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((item) => ({ url: absoluteUrl(item.route), lastModified: item.modified, changeFrequency: item.frequency, priority: item.priority }));
  const toolEntries: MetadataRoute.Sitemap = getPublicTools().map((tool) => ({ url: absoluteUrl(tool.href), lastModified: tool.updatedAt ?? tool.createdAt ?? ORIGINAL_CONTENT_DATE, changeFrequency: "monthly", priority: tool.featured ? 0.8 : 0.7 }));
  const gameEntries: MetadataRoute.Sitemap = getGames().map((game) => ({ url: absoluteUrl(game.href), lastModified: ORIGINAL_CONTENT_DATE, changeFrequency: "monthly", priority: 0.7 }));
  const pathEntries: MetadataRoute.Sitemap = getLearningPaths().map((path) => ({ url: absoluteUrl(`/learning-paths/${path.slug}`), lastModified: ATLAS_DATE, changeFrequency: "monthly", priority: path.featured ? 0.85 : 0.75 }));
  const careerEntries: MetadataRoute.Sitemap = getTechCareers().map((career) => ({ url: absoluteUrl(`/tech-careers/${career.slug}`), lastModified: ATLAS_DATE, changeFrequency: "monthly", priority: career.featured ? 0.8 : 0.7 }));
  const wayEntries: MetadataRoute.Sitemap = getWaysOfWorking().map((way) => ({ url: absoluteUrl(`/ways-of-working/${way.slug}`), lastModified: ATLAS_DATE, changeFrequency: "monthly", priority: way.featured ? 0.8 : 0.7 }));
  const editorialEntries: MetadataRoute.Sitemap = getEditorialPages().map((page) => ({ url: absoluteUrl(`/${page.kind === "guide" ? "guides" : "comparisons"}/${page.slug}`), lastModified: new Date(page.updatedAt), changeFrequency: "monthly", priority: page.featured ? 0.9 : 0.8 }));
  const resourceHubEntries: MetadataRoute.Sitemap = getResourceHubs().map((hub) => ({ url: absoluteUrl(`/resources/${hub.slug}`), lastModified: new Date(hub.updatedAt), changeFrequency: "monthly", priority: 0.85 }));
  /*
   * The loader gallery is a flagship entry point and its category hubs are real
   * routes, so they are listed here rather than left to be discovered through
   * the client-side gallery. The main page also arrives via the tool registry;
   * the URL map below keeps the higher-priority entry and drops the duplicate.
   */
  const loaderEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl(CSS_LOADERS_PATH), lastModified: ORIGINAL_CONTENT_DATE, changeFrequency: "weekly", priority: 0.9 },
    ...LOADER_HUB_SLUGS.map((slug) => ({ url: absoluteUrl(getLoaderHubPath(slug)), lastModified: ORIGINAL_CONTENT_DATE, changeFrequency: "monthly" as const, priority: 0.75 })),
  ];

  const byUrl = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const entry of [...staticEntries, ...toolEntries, ...gameEntries, ...pathEntries, ...careerEntries, ...wayEntries, ...editorialEntries, ...resourceHubEntries, ...loaderEntries]) byUrl.set(entry.url, entry);
  return [...byUrl.values()];
}
