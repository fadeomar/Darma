import type {
  RobotsBuildResult,
  RobotsCheck,
  RobotsConfig,
  RobotsDirective,
  RobotsGroup,
  RobotsParseResult,
  RobotsRouteTest,
  RobotsRule,
} from "./types";

const MAX_RECOMMENDED_BYTES = 500 * 1024;

export function normalizeRobotsPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (trimmed === "*") return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function normalizeUserAgent(userAgent: string): string {
  return userAgent.trim() || "*";
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

function getUrlHost(value: string): string | null {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function generateGroup(group: RobotsGroup): string {
  const agents = uniqueStrings(group.userAgents).length > 0 ? uniqueStrings(group.userAgents) : ["*"];
  const lines = agents.map((agent) => `User-agent: ${normalizeUserAgent(agent)}`);

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
  const groups = config.groups.length > 0
    ? config.groups
    : [{ id: "default", userAgents: ["*"], rules: [{ id: "allow-all", directive: "Disallow" as RobotsDirective, path: "" }] }];
  const sections = groups.map(generateGroup);
  const sitemaps = uniqueStrings(config.sitemapUrls);

  if (sitemaps.length > 0) {
    sections.push(sitemaps.map((sitemap) => `Sitemap: ${sitemap}`).join("\n"));
  }

  return `${sections.join("\n\n")}\n`;
}

function createCheck(
  id: string,
  level: RobotsCheck["level"],
  title: string,
  message: string,
  extra: Pick<RobotsCheck, "groupId" | "ruleId"> = {},
): RobotsCheck {
  return { id, level, title, message, ...extra };
}

function countDuplicateRules(config: RobotsConfig): number {
  let duplicates = 0;
  config.groups.forEach((group) => {
    const seen = new Set<string>();
    group.rules.forEach((rule) => {
      const key = `${rule.directive}:${normalizeRobotsPath(rule.path)}`.toLowerCase();
      if (seen.has(key)) duplicates += 1;
      seen.add(key);
    });
  });
  return duplicates;
}

export function validateRobotsConfig(config: RobotsConfig, output = generateRobotsTxt(config)): RobotsCheck[] {
  const checks: RobotsCheck[] = [];
  const siteUrl = config.siteUrl.trim();
  const siteHost = isAbsoluteHttpUrl(siteUrl) ? getUrlHost(siteUrl) : null;

  if (!siteUrl) {
    checks.push(createCheck("site-url-empty", "warning", "Site URL is missing", "Add the production origin so root-location and sitemap checks can be evaluated."));
  } else if (!isAbsoluteHttpUrl(siteUrl)) {
    checks.push(createCheck("site-url-invalid", "danger", "Invalid site URL", "Use an absolute http(s) origin such as https://example.com."));
  } else {
    checks.push(createCheck("site-url-valid", "success", "Root location is clear", `Publish the file at ${siteUrl.replace(/\/$/, "")}/robots.txt.`));
  }

  const sitemapUrls = config.sitemapUrls.map((value) => value.trim()).filter(Boolean);
  const uniqueSitemaps = uniqueStrings(sitemapUrls);
  if (sitemapUrls.length === 0) {
    checks.push(createCheck("no-sitemap", "info", "No sitemap reference", "A Sitemap directive is optional, but it can help crawlers discover your XML sitemap."));
  }
  if (uniqueSitemaps.length !== sitemapUrls.length) {
    checks.push(createCheck("duplicate-sitemap", "warning", "Duplicate sitemap URLs", "Remove duplicate Sitemap directives to keep the file easier to review."));
  }
  uniqueSitemaps.forEach((sitemap, index) => {
    if (!isAbsoluteHttpUrl(sitemap)) {
      checks.push(createCheck(`sitemap-invalid-${index}`, "danger", "Invalid sitemap URL", `“${sitemap}” must be an absolute http(s) URL.`));
      return;
    }
    const sitemapHost = getUrlHost(sitemap);
    if (siteHost && sitemapHost && sitemapHost !== siteHost) {
      checks.push(createCheck(`sitemap-host-${index}`, "info", "Cross-host sitemap", `The sitemap uses ${sitemapHost}, while the robots host is ${siteHost}. Confirm that this is intentional and verified.`));
    }
  });

  if (config.groups.length === 0) {
    checks.push(createCheck("no-groups", "danger", "No crawler groups", "Add at least one User-agent group. The generated fallback allows crawling."));
  }

  const agentLocations = new Map<string, string[]>();
  config.groups.forEach((group, groupIndex) => {
    const agents = uniqueStrings(group.userAgents).length > 0 ? uniqueStrings(group.userAgents) : ["*"];
    if (group.userAgents.every((agent) => !agent.trim())) {
      checks.push(createCheck(`empty-agent-${group.id}`, "warning", "Empty user-agent", `Group ${groupIndex + 1} will be generated as User-agent: *.` , { groupId: group.id }));
    }
    agents.forEach((agent) => {
      const key = agent.toLowerCase();
      agentLocations.set(key, [...(agentLocations.get(key) ?? []), group.id]);
      if (/\s/.test(agent)) {
        checks.push(createCheck(`agent-space-${group.id}-${key}`, "warning", "User-agent contains spaces", `“${agent}” should normally be a crawler product token without spaces.`, { groupId: group.id }));
      }
    });

    if (group.rules.length === 0) {
      checks.push(createCheck(`empty-rules-${group.id}`, "info", "Group allows all paths", `Group ${groupIndex + 1} has no rules and will be emitted as an empty Disallow directive.`, { groupId: group.id }));
    }

    const seenRules = new Map<string, RobotsDirective>();
    group.rules.forEach((rule) => {
      const rawPath = rule.path.trim();
      const normalized = normalizeRobotsPath(rule.path);
      const sameRuleKey = `${rule.directive}:${normalized}`.toLowerCase();
      const conflictKey = normalized.toLowerCase();

      if (rawPath && rawPath !== "*" && !rawPath.startsWith("/")) {
        checks.push(createCheck(`path-leading-slash-${rule.id}`, "info", "Path will be normalized", `${rule.directive} path “${rawPath}” will be generated as “${normalized}”.`, { groupId: group.id, ruleId: rule.id }));
      }
      if (/^https?:\/\//i.test(rawPath)) {
        checks.push(createCheck(`absolute-rule-${rule.id}`, "danger", "Rule contains a full URL", "Allow and Disallow values should be URL paths, not absolute URLs.", { groupId: group.id, ruleId: rule.id }));
      }
      if (rule.directive === "Disallow" && normalized === "/") {
        checks.push(createCheck(`block-all-${rule.id}`, "danger", "Entire site is blocked", `This group contains Disallow: / for ${agents.join(", ")}.`, { groupId: group.id, ruleId: rule.id }));
      }
      if (rule.directive === "Allow" && normalized === "") {
        checks.push(createCheck(`empty-allow-${rule.id}`, "warning", "Empty Allow rule", "An empty Allow directive has no useful matching path. Remove it or enter a path.", { groupId: group.id, ruleId: rule.id }));
      }
      if (seenRules.has(sameRuleKey)) {
        checks.push(createCheck(`duplicate-rule-${rule.id}`, "warning", "Duplicate rule", `${rule.directive}: ${normalized} appears more than once in this group.`, { groupId: group.id, ruleId: rule.id }));
      }
      const previousDirective = seenRules.get(conflictKey);
      if (previousDirective && previousDirective !== rule.directive) {
        checks.push(createCheck(`conflict-rule-${rule.id}`, "warning", "Equal-length rule conflict", `${previousDirective} and ${rule.directive} both target “${normalized}”. Allow wins an equal-specificity tie in common implementations, but the policy is harder to audit.`, { groupId: group.id, ruleId: rule.id }));
      }
      seenRules.set(sameRuleKey, rule.directive);
      seenRules.set(conflictKey, rule.directive);
    });
  });

  agentLocations.forEach((groupIds, agent) => {
    if (groupIds.length > 1) {
      checks.push(createCheck(`repeated-agent-${agent}`, "info", "Repeated user-agent groups", `User-agent “${agent}” appears in ${groupIds.length} groups. Matching groups may be combined by crawlers; merge them for clearer maintenance.`));
    }
  });

  const bytes = new TextEncoder().encode(output).length;
  if (bytes > MAX_RECOMMENDED_BYTES) {
    checks.push(createCheck("file-too-large", "danger", "File exceeds 500 KiB", `The generated file is ${(bytes / 1024).toFixed(1)} KiB. Content beyond crawler processing limits may be ignored.`));
  } else if (bytes > MAX_RECOMMENDED_BYTES * 0.8) {
    checks.push(createCheck("file-near-limit", "warning", "File is approaching 500 KiB", `The generated file is ${(bytes / 1024).toFixed(1)} KiB. Consolidate broad rules where possible.`));
  } else {
    checks.push(createCheck("file-size", "success", "File size is healthy", `${bytes.toLocaleString()} UTF-8 bytes, well below the 500 KiB review threshold.`));
  }

  checks.push(createCheck("not-security", "warning", "Not an access-control layer", "Robots.txt is a crawler instruction file. Protect private content with authentication and server-side authorization."));
  return checks;
}

export function buildRobotsConfig(config: RobotsConfig): RobotsBuildResult {
  const output = generateRobotsTxt(config);
  const checks = validateRobotsConfig(config, output);
  const allAgents = config.groups.flatMap((group) => uniqueStrings(group.userAgents));
  const allRules = config.groups.flatMap((group) => group.rules);
  const stats = {
    groups: config.groups.length,
    userAgents: allAgents.length,
    rules: allRules.length,
    allowRules: allRules.filter((rule) => rule.directive === "Allow").length,
    disallowRules: allRules.filter((rule) => rule.directive === "Disallow").length,
    blockAllGroups: config.groups.filter((group) => group.rules.some((rule) => rule.directive === "Disallow" && normalizeRobotsPath(rule.path) === "/")).length,
    sitemaps: uniqueStrings(config.sitemapUrls).length,
    bytes: new TextEncoder().encode(output).length,
    duplicateRules: countDuplicateRules(config),
  };
  return { output, checks, stats };
}

function patternToRegExp(pattern: string): RegExp | null {
  const normalized = normalizeRobotsPath(pattern);
  if (!normalized) return null;
  const anchoredAtEnd = normalized.endsWith("$");
  const withoutAnchor = anchoredAtEnd ? normalized.slice(0, -1) : normalized;
  const escaped = withoutAnchor.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  try {
    return new RegExp(`^${escaped}${anchoredAtEnd ? "$" : ""}`);
  } catch {
    return null;
  }
}

function normalizeTestPath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "/";
  try {
    const url = new URL(trimmed);
    return `${url.pathname || "/"}${url.search}`;
  } catch {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }
}

function findMatchingGroups(groups: RobotsGroup[], crawler: string): { groups: RobotsGroup[]; agents: string[] } {
  const token = normalizeUserAgent(crawler).toLowerCase();
  const candidates: Array<{ group: RobotsGroup; agent: string; specificity: number }> = [];

  groups.forEach((group) => {
    const agents = uniqueStrings(group.userAgents).length > 0 ? uniqueStrings(group.userAgents) : ["*"];
    agents.forEach((agent) => {
      const normalized = normalizeUserAgent(agent).toLowerCase();
      if (normalized === "*") {
        candidates.push({ group, agent, specificity: 0 });
      } else if (token.includes(normalized)) {
        candidates.push({ group, agent, specificity: normalized.length });
      }
    });
  });

  if (candidates.length === 0) return { groups: [], agents: [] };
  const maxSpecificity = Math.max(...candidates.map((item) => item.specificity));
  const selected = candidates.filter((item) => item.specificity === maxSpecificity);
  return {
    groups: [...new Map(selected.map((item) => [item.group.id, item.group])).values()],
    agents: uniqueStrings(selected.map((item) => item.agent)),
  };
}

export function testRobotsRoute(config: RobotsConfig, crawler: string, input: string): RobotsRouteTest {
  const normalizedPath = normalizeTestPath(input);
  const selected = findMatchingGroups(config.groups, crawler);
  if (selected.groups.length === 0) {
    return {
      crawler,
      input,
      normalizedPath,
      allowed: true,
      matchedAgents: [],
      reason: "No matching user-agent group was found, so the route is allowed by default.",
    };
  }

  const matches = selected.groups.flatMap((group) => group.rules.map((rule) => {
    const pattern = normalizeRobotsPath(rule.path);
    const regex = patternToRegExp(pattern);
    const matched = Boolean(regex?.test(normalizedPath));
    const specificity = pattern.replace(/\*/g, "").replace(/\$$/, "").length;
    return { rule, matched, specificity };
  })).filter((item) => item.matched);

  if (matches.length === 0) {
    return {
      crawler,
      input,
      normalizedPath,
      allowed: true,
      matchedAgents: selected.agents,
      reason: `Matched ${selected.agents.join(", ")}, but no Allow or Disallow path matched this route.`,
    };
  }

  matches.sort((a, b) => {
    const specificityDifference = b.specificity - a.specificity;
    if (specificityDifference !== 0) return specificityDifference;
    if (a.rule.directive === b.rule.directive) return 0;
    return a.rule.directive === "Allow" ? -1 : 1;
  });
  const winner = matches[0];
  const allowed = winner.rule.directive === "Allow";
  return {
    crawler,
    input,
    normalizedPath,
    allowed,
    matchedAgents: selected.agents,
    matchedRule: winner.rule,
    reason: `${winner.rule.directive}: ${normalizeRobotsPath(winner.rule.path)} is the most specific matching rule.`,
  };
}

export function createRule(id: string, directive: RobotsDirective = "Disallow", path = "/admin/"): RobotsRule {
  return { id, directive, path };
}

export function createGroup(id: string, userAgent = "*", rules: RobotsRule[] = [createRule(`${id}-rule`)]) : RobotsGroup {
  return { id, userAgents: [userAgent], rules };
}

export function parseRobotsTxt(text: string, fallbackSiteUrl = "https://example.com"): RobotsParseResult {
  const groups: RobotsGroup[] = [];
  const sitemapUrls: string[] = [];
  const notices: string[] = [];
  let currentGroup: RobotsGroup | null = null;
  let currentHasRules = false;

  const ensureGroup = (): RobotsGroup => {
    if (!currentGroup) {
      currentGroup = createGroup(`group-${groups.length + 1}`, "*", []);
      groups.push(currentGroup);
      notices.push("A rule appeared before User-agent, so it was placed in a wildcard group.");
    }
    return currentGroup;
  };

  text.split(/\r?\n/).forEach((rawLine, lineIndex) => {
    const line = rawLine.replace(/\s+#.*$/, "").trim();
    if (!line || line.startsWith("#")) return;
    const separator = line.indexOf(":");
    if (separator < 0) {
      notices.push(`Line ${lineIndex + 1} was ignored because it has no directive separator.`);
      return;
    }
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "user-agent") {
      if (!currentGroup || currentHasRules) {
        currentGroup = createGroup(`group-${groups.length + 1}`, value || "*", []);
        groups.push(currentGroup);
        currentHasRules = false;
      } else {
        currentGroup.userAgents.push(value || "*");
      }
      return;
    }

    if (field === "allow" || field === "disallow") {
      const group = ensureGroup();
      group.rules.push({
        id: `rule-${groups.length}-${group.rules.length + 1}`,
        directive: field === "allow" ? "Allow" : "Disallow",
        path: value,
      });
      currentHasRules = true;
      return;
    }

    if (field === "sitemap") {
      if (value) sitemapUrls.push(value);
      return;
    }

    notices.push(`Line ${lineIndex + 1}: unsupported directive “${line.slice(0, separator).trim()}” was not imported.`);
  });

  const inferredSiteUrl = sitemapUrls.find(isAbsoluteHttpUrl)
    ? new URL(sitemapUrls.find(isAbsoluteHttpUrl) as string).origin
    : fallbackSiteUrl;

  return {
    config: {
      siteUrl: inferredSiteUrl,
      sitemapUrls: uniqueStrings(sitemapUrls),
      groups: groups.length > 0 ? groups : [createGroup("group-default", "*", [])],
    },
    notices: uniqueStrings(notices),
  };
}

export function buildRobotsReport(result: RobotsBuildResult, config: RobotsConfig): string {
  return JSON.stringify({
    generatedAt: new Date().toISOString(),
    siteUrl: config.siteUrl,
    sitemaps: uniqueStrings(config.sitemapUrls),
    stats: result.stats,
    checks: result.checks,
    groups: config.groups.map((group) => ({
      userAgents: uniqueStrings(group.userAgents),
      rules: group.rules.map(({ directive, path }) => ({ directive, path: normalizeRobotsPath(path) })),
    })),
  }, null, 2);
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function serializeStringOrArray(values: string[], indent: string): string {
  const unique = uniqueStrings(values);
  if (unique.length === 1) return quote(unique[0]);
  return `[\n${unique.map((value) => `${indent}  ${quote(value)},`).join("\n")}\n${indent}]`;
}

export function buildNextJsRobots(config: RobotsConfig): string {
  const rules = config.groups.map((group) => {
    const agents = uniqueStrings(group.userAgents).length > 0 ? uniqueStrings(group.userAgents) : ["*"];
    const allow = group.rules.filter((rule) => rule.directive === "Allow").map((rule) => normalizeRobotsPath(rule.path)).filter(Boolean);
    const disallow = group.rules.filter((rule) => rule.directive === "Disallow").map((rule) => normalizeRobotsPath(rule.path));
    const lines = [`      userAgent: ${serializeStringOrArray(agents, "      ")},`];
    if (allow.length > 0) lines.push(`      allow: ${serializeStringOrArray(allow, "      ")},`);
    if (disallow.length > 0) lines.push(`      disallow: ${serializeStringOrArray(disallow, "      ")},`);
    return `    {\n${lines.join("\n")}\n    }`;
  });
  const sitemaps = uniqueStrings(config.sitemapUrls);
  const sitemapLine = sitemaps.length > 0 ? `\n    sitemap: ${serializeStringOrArray(sitemaps, "    ")},` : "";

  return `import type { MetadataRoute } from "next";\n\nexport default function robots(): MetadataRoute.Robots {\n  return {\n    rules: [\n${rules.join(",\n")}\n    ],${sitemapLine}\n  };\n}\n`;
}
