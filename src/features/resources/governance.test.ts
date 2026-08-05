import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { RESOURCE_CATALOG } from "./catalog";
import { formatResourceGovernanceBreakdown, getResourceGovernanceSummary } from "./governance";
import type { Resource } from "./schema";

const resourceWithStatus = (id: string, status: Resource["review"]["status"]) =>
  ({ id, review: { status, lastChecked: null } }) as Resource;

describe("getResourceGovernanceSummary", () => {
  it("derives the total from the number of resource records", () => {
    const summary = getResourceGovernanceSummary(RESOURCE_CATALOG);

    expect(summary.total).toBe(RESOURCE_CATALOG.length);
  });

  it("keeps status counts mutually consistent with the total", () => {
    const summary = getResourceGovernanceSummary(RESOURCE_CATALOG);

    expect(summary.verified + summary.needsReview + summary.archived).toBe(summary.total);
  });

  it("counts verified only from records whose review status is verified", () => {
    const summary = getResourceGovernanceSummary(RESOURCE_CATALOG);
    const verifiedRecords = RESOURCE_CATALOG.filter((resource) => resource.review.status === "verified");

    expect(summary.verified).toBe(verifiedRecords.length);
    expect(summary.verified).toBeLessThan(summary.total);
  });

  it("does not infer review state from pricing or publisher gaps", () => {
    const summary = getResourceGovernanceSummary(RESOURCE_CATALOG);
    const unknownPricing = RESOURCE_CATALOG.filter((resource) => resource.pricing === "unknown").length;

    // Guards against regressing to the Phase 0 behaviour, where "reviewed" was
    // implied by metadata completeness rather than the review field.
    expect(summary.needsReview).not.toBe(unknownPricing);
  });

  it("tallies each review status independently", () => {
    const summary = getResourceGovernanceSummary([
      resourceWithStatus("a", "verified"),
      resourceWithStatus("b", "verified"),
      resourceWithStatus("c", "review-needed"),
      resourceWithStatus("d", "archived"),
    ]);

    expect(summary).toEqual({ total: 4, verified: 2, needsReview: 1, archived: 1 });
  });

  it("returns zeroed counts for an empty catalog", () => {
    expect(getResourceGovernanceSummary([])).toEqual({ total: 0, verified: 0, needsReview: 0, archived: 0 });
  });
});

describe("formatResourceGovernanceBreakdown", () => {
  it("lists only the non-zero states", () => {
    expect(formatResourceGovernanceBreakdown({ total: 400, verified: 39, needsReview: 361, archived: 0 })).toBe(
      "39 verified · 361 awaiting review",
    );
  });

  it("includes archived records when present", () => {
    expect(formatResourceGovernanceBreakdown({ total: 3, verified: 1, needsReview: 1, archived: 1 })).toBe(
      "1 verified · 1 awaiting review · 1 archived",
    );
  });

  it("returns null when there is nothing to break down", () => {
    expect(formatResourceGovernanceBreakdown({ total: 0, verified: 0, needsReview: 0, archived: 0 })).toBeNull();
  });
});

describe("resource trust claims", () => {
  it("does not claim the whole catalog is reviewed", () => {
    const summary = getResourceGovernanceSummary(RESOURCE_CATALOG);

    // If this ever becomes true, "reviewed"/"verified" wording for the total
    // would be legitimate and the copy can be revisited deliberately.
    expect(summary.verified).not.toBe(summary.total);
    expect(summary.needsReview).toBeGreaterThan(0);
  });

  /**
   * Source-level guard: these surfaces displayed the full catalog total with a
   * "reviewed"/"trusted" label before Phase 1. The wording must stay derived
   * from review state, not from the record count.
   */
  const TRUST_CLAIM_SURFACES = [
    "src/app/tech-atlas/page.tsx",
    "src/app/resources/page.tsx",
    "src/app/resources/[category]/page.tsx",
    "src/app/learning-paths/page.tsx",
    "src/app/tech-careers/[slug]/page.tsx",
    "src/app/layout.tsx",
    "src/app/about/page.tsx",
    "src/app/guides/page.tsx",
    "src/components/layout/SiteFooter.tsx",
    "src/components/navigation/SiteHeader.tsx",
    "src/components/landing/LandingIntentNavigator.tsx",
    "src/components/landing/LandingWorkbenchDemo.tsx",
    "src/features/editorial/resource-hubs.ts",
    "src/features/learning-paths/components/LearningPathTimeline.tsx",
    "src/features/visuals/og/createAtlasOgImage.tsx",
  ];

  // "references" is covered by the singular alternative matching as a prefix.
  // `trusted` is banned outright on these surfaces: the earlier narrow pattern
  // missed phrasings like "Trusted JavaScript ... references".
  const FORBIDDEN = [/reviewed references?/i, /reviewed resource/i, /\btrusted\b/i];

  it.each(TRUST_CLAIM_SURFACES)("does not label totals as reviewed or trusted in %s", (relativePath) => {
    const contents = readFileSync(resolve(process.cwd(), relativePath), "utf8");

    for (const pattern of FORBIDDEN) {
      expect(contents, `${relativePath} still contains ${pattern}`).not.toMatch(pattern);
    }
  });

  it("labels the Atlas resource metric by catalog size, not review state", () => {
    const atlas = readFileSync(resolve(process.cwd(), "src/app/tech-atlas/page.tsx"), "utf8");

    expect(atlas).toContain('label: "cataloged references"');
    expect(atlas).toContain("resourceGovernance.total");
  });
});
