import type { MetadataRoute } from "next";
import { getToolRegistry } from "@/features/tools";
import { absoluteUrl } from "@/features/tools/seo";

const STATIC_ROUTES = ["/", "/tools", "/explore", "/categories", "/about"];

export default function sitemap(): MetadataRoute.Sitemap {
  const toolRoutes = getToolRegistry()
    .list()
    .filter((tool) => tool.visibility === "public")
    .map((tool) => tool.href);

  return [...STATIC_ROUTES, ...toolRoutes].map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: route.startsWith("/tools/") ? "monthly" : "weekly",
    priority: route === "/" ? 1 : route.startsWith("/tools/") ? 0.8 : 0.7,
  }));
}
