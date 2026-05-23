import type { RobotsConfig, RobotsDirective, RobotsGroup, RobotsRule, RobotsWarning } from "./types";

export function normalizeRobotsPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (trimmed === "*") return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function normalizeUserAgent(userAgent: string): string {
  const trimmed = userAgent.trim();
  return trimmed || "*";
}

function isAbsoluteHttpUrl(value: string): boolean {
  if (!value.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function generateGroup(group: RobotsGroup): string {
  const lines = [`User-agent: ${normalizeUserAgent(group.userAgent)}`];

  if (group.rules.length === 0) {
    lines.push("Disallow:");
  } else {
    group.rules.forEach((rule) => {
      lines.push(`${rule.directive}: ${normalizeRobotsPath(rule.path)}`);
    });
  }

  return lines.join("\n");
}

export function generateRobotsTxt(config: RobotsConfig): string {
  const groups = config.groups.length > 0 ? config.groups : [{ id: "default", userAgent: "*", rules: [{ id: "allow-all", directive: "Disallow" as RobotsDirective, path: "" }] }];
  const sections = groups.map(generateGroup);
  const sitemap = config.sitemapUrl.trim();

  if (sitemap) {
    sections.push(`Sitemap: ${sitemap}`);
  }

  return `${sections.join("\n\n")}\n`;
}

export function validateRobotsConfig(config: RobotsConfig): RobotsWarning[] {
  const warnings: RobotsWarning[] = [];

  if (config.siteUrl.trim() && !isAbsoluteHttpUrl(config.siteUrl)) {
    warnings.push({ id: "site-url-invalid", level: "warning", message: "Site URL should be an absolute http(s) URL, for example https://example.com." });
  }

  if (config.sitemapUrl.trim() && !isAbsoluteHttpUrl(config.sitemapUrl)) {
    warnings.push({ id: "sitemap-invalid", level: "warning", message: "Sitemap URL should be absolute, for example https://example.com/sitemap.xml." });
  }

  if (config.groups.length === 0) {
    warnings.push({ id: "no-groups", level: "warning", message: "Add at least one user-agent group. A robots.txt file usually starts with User-agent: *." });
  }

  config.groups.forEach((group, groupIndex) => {
    const groupLabel = normalizeUserAgent(group.userAgent);

    if (!group.userAgent.trim()) {
      warnings.push({ id: `empty-agent-${group.id}`, level: "info", message: `Crawler group ${groupIndex + 1} has an empty user-agent, so it will be generated as *.` });
    }

    if (group.rules.length === 0) {
      warnings.push({ id: `empty-rules-${group.id}`, level: "info", message: `User-agent ${groupLabel} has no rules. It will be generated as Disallow: which means allow all.` });
    }

    group.rules.forEach((rule) => {
      const rawPath = rule.path.trim();
      const normalized = normalizeRobotsPath(rule.path);

      if (rawPath && rawPath !== "*" && !rawPath.startsWith("/")) {
        warnings.push({ id: `path-leading-slash-${rule.id}`, level: "info", message: `${rule.directive} path "${rawPath}" will be normalized to "${normalized}".` });
      }

      if (rule.directive === "Disallow" && normalized === "/") {
        warnings.push({ id: `block-all-${rule.id}`, level: "danger", message: `User-agent ${groupLabel} has Disallow: /, which blocks all crawlable paths for matching crawlers.` });
      }

      if (rule.directive === "Allow" && normalized === "/") {
        warnings.push({ id: `allow-all-${rule.id}`, level: "info", message: `User-agent ${groupLabel} has Allow: /, which explicitly allows the whole site for matching crawlers unless another matching rule is more specific.` });
      }
    });
  });

  warnings.push({ id: "root-location", level: "info", message: "Upload this file as /robots.txt at the root of the exact protocol, host, and port you want it to control." });
  warnings.push({ id: "not-security", level: "warning", message: "Robots.txt is a crawler instruction file, not a security control. Do not use it to protect private URLs." });

  return warnings;
}

export function createRule(id: string, directive: RobotsDirective = "Disallow", path = "/admin/"): RobotsRule {
  return { id, directive, path };
}
