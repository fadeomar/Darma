import { describe, expect, it } from "vitest";
import {
  buildNextJsRobots,
  buildRobotsConfig,
  generateRobotsTxt,
  parseRobotsTxt,
  testRobotsRoute,
} from "./robotsTxt";
import { DEFAULT_ROBOTS_CONFIG } from "./presets";
import type { RobotsConfig } from "./types";

const POLICY: RobotsConfig = {
  siteUrl: "https://example.com",
  sitemapUrls: ["https://example.com/sitemap.xml"],
  groups: [
    {
      id: "general",
      userAgents: ["*"],
      rules: [
        { id: "private", directive: "Disallow", path: "/private/" },
        { id: "public", directive: "Allow", path: "/private/public/" },
      ],
    },
    {
      id: "images",
      userAgents: ["Googlebot-Image", "ExampleImageBot"],
      rules: [{ id: "drafts", directive: "Disallow", path: "/images/drafts/" }],
    },
  ],
};

describe("robots.txt policy", () => {
  it("generates multiple user agents and sitemap directives", () => {
    const output = generateRobotsTxt(POLICY);
    expect(output).toContain("User-agent: Googlebot-Image");
    expect(output).toContain("User-agent: ExampleImageBot");
    expect(output).toContain("Sitemap: https://example.com/sitemap.xml");
  });

  it("imports consecutive user-agent lines into one group", () => {
    const parsed = parseRobotsTxt("User-agent: Googlebot\nUser-agent: Bingbot\nDisallow: /private/\n\nSitemap: https://example.com/sitemap.xml");
    expect(parsed.config.groups).toHaveLength(1);
    expect(parsed.config.groups[0]?.userAgents).toEqual(["Googlebot", "Bingbot"]);
    expect(parsed.config.groups[0]?.rules[0]).toMatchObject({ directive: "Disallow", path: "/private/" });
  });

  it("uses the most specific matching path and lets Allow win", () => {
    expect(testRobotsRoute(POLICY, "Googlebot", "/private/account").allowed).toBe(false);
    const publicRoute = testRobotsRoute(POLICY, "Googlebot", "/private/public/guide");
    expect(publicRoute.allowed).toBe(true);
    expect(publicRoute.matchedRule?.id).toBe("public");
  });

  it("selects the more specific crawler group over wildcard", () => {
    const imageRoute = testRobotsRoute(POLICY, "Googlebot-Image", "/images/drafts/hero.png");
    expect(imageRoute.allowed).toBe(false);
    expect(imageRoute.matchedAgents).toContain("Googlebot-Image");
  });

  it("reports a production block-all policy", () => {
    const result = buildRobotsConfig({
      ...DEFAULT_ROBOTS_CONFIG,
      groups: [{ id: "blocked", userAgents: ["*"], rules: [{ id: "all", directive: "Disallow", path: "/" }] }],
    });
    expect(result.stats.blockAllGroups).toBe(1);
    expect(result.checks.some((check) => check.id === "block-all-all" && check.level === "danger")).toBe(true);
  });

  it("generates a Next.js MetadataRoute starter", () => {
    const code = buildNextJsRobots(POLICY);
    expect(code).toContain('import type { MetadataRoute } from "next"');
    expect(code).toContain("Googlebot-Image");
    expect(code).toContain("sitemap:");
  });
});
