import type { MetadataRoute } from "next";
import { getToolRegistry } from "@/features/tools";
import { absoluteUrl } from "@/features/tools/seo";
import { getGames } from "@/features/games";

const STATIC_ROUTES = ["/", "/tools", "/games", "/collections", "/search", "/explore", "/categories", "/about"];

export default function sitemap(): MetadataRoute.Sitemap {
  const toolRoutes = getToolRegistry()
    .list()
    .filter((tool) => tool.visibility === "public")
    .map((tool) => tool.href);

  const gameRoutes = getGames().map((game) => game.href);

  return [...STATIC_ROUTES, ...toolRoutes, ...gameRoutes].map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: route.startsWith("/tools/") || route.startsWith("/games/") ? "monthly" : "weekly",
    priority: route === "/" ? 1 : route.startsWith("/tools/") || route.startsWith("/games/") ? 0.8 : 0.7,
  }));
}
