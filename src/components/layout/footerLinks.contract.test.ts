import { describe, expect, it } from "vitest";
import {
  CONTRIBUTION_LINKS,
  COMPACT_FOOTER_GROUPS,
  FULL_FOOTER_GROUPS,
  FULL_FOOTER_ROUTES,
  GITHUB_URL,
  LEGAL_LINKS,
  footerVariantForPath,
  groupsForVariant,
  hrefsForVariant,
} from "./footerLinks";

/**
 * F-14 contracts. The old footer repeated five of its own hrefs; the duplicate
 * check below is the guard that stops that from coming back as links are added.
 */

describe("footer link data", () => {
  for (const variant of ["full", "compact"] as const) {
    it(`${variant} footer renders no href twice`, () => {
      const hrefs = hrefsForVariant(variant);
      const seen = new Map<string, number>();
      for (const href of hrefs) seen.set(href, (seen.get(href) ?? 0) + 1);
      const duplicates = [...seen.entries()].filter(([, n]) => n > 1).map(([href, n]) => `${href} x${n}`);
      expect(duplicates).toEqual([]);
    });
  }

  it("keeps the compact footer to three navigation groups", () => {
    expect(COMPACT_FOOTER_GROUPS).toHaveLength(3);
    expect(FULL_FOOTER_GROUPS.length).toBeLessThanOrEqual(3);
  });

  it("keeps the compact footer smaller than the full one", () => {
    expect(hrefsForVariant("compact").length).toBeLessThan(hrefsForVariant("full").length);
  });

  it("keeps required legal and contribution links present", () => {
    // Editorial policy is reachable from every route, via the legal row.
    for (const variant of ["full", "compact"] as const) {
      expect(hrefsForVariant(variant)).toContain("/editorial-policy");
    }
    // Contribution and the repository live on the storytelling routes.
    expect(hrefsForVariant("full")).toContain("/contribute");
    expect(hrefsForVariant("full")).toContain(GITHUB_URL);
    expect(CONTRIBUTION_LINKS.some((l) => l.external && l.href === GITHUB_URL)).toBe(true);
  });

  it("marks external links so they open safely", () => {
    const all = [...FULL_FOOTER_GROUPS, ...COMPACT_FOOTER_GROUPS].flatMap((g) => g.links).concat(CONTRIBUTION_LINKS, LEGAL_LINKS);
    for (const link of all) {
      if (link.href.startsWith("http")) expect(link.external).toBe(true);
      else expect(link.external ?? false).toBe(false);
    }
  });

  it("keeps every essential route reachable from the compact footer", () => {
    const hrefs = hrefsForVariant("compact");
    for (const essential of ["/tools", "/games", "/search", "/tech-atlas", "/resources", "/learning-paths", "/about"]) {
      expect(hrefs).toContain(essential);
    }
  });
});

describe("footer variant routing", () => {
  it("uses the full footer only on the storytelling routes", () => {
    for (const route of FULL_FOOTER_ROUTES) expect(footerVariantForPath(route)).toBe("full");
  });

  it("uses the compact footer on product and detail routes", () => {
    const productRoutes = [
      "/tools", "/tools/json-formatter", "/games", "/games/2048", "/resources",
      "/learning-paths", "/tech-careers", "/tech-careers/frontend-developer",
      "/tech-glossary", "/guides", "/comparisons", "/search", "/collections",
      "/ways-of-working", "/tech-teams",
    ];
    for (const route of productRoutes) expect(footerVariantForPath(route)).toBe("compact");
  });

  it("hides the footer on admin and login", () => {
    for (const route of ["/admin", "/admin/review", "/login"]) {
      expect(footerVariantForPath(route)).toBe("hidden");
    }
    // A route that merely starts with the same letters is not admin.
    expect(footerVariantForPath("/administrators")).toBe("compact");
  });

  it("resolves groups for each visible variant", () => {
    expect(groupsForVariant("full")).toBe(FULL_FOOTER_GROUPS);
    expect(groupsForVariant("compact")).toBe(COMPACT_FOOTER_GROUPS);
  });
});
