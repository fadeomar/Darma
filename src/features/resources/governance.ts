import { RESOURCE_CATALOG } from "./catalog";
import type { Resource } from "./schema";

/**
 * Single source of truth for resource governance counts.
 *
 * Counts are derived from the catalog's own `review.status` field
 * (`verified | review-needed | archived`) so user-facing copy can never claim
 * more editorial coverage than the data actually records. Do not infer review
 * state from unrelated gaps such as `pricing: "unknown"`.
 */
export type ResourceGovernanceSummary = {
  total: number;
  verified: number;
  needsReview: number;
  archived: number;
};

export function getResourceGovernanceSummary(
  resources: readonly Resource[] = RESOURCE_CATALOG,
): ResourceGovernanceSummary {
  let verified = 0;
  let needsReview = 0;
  let archived = 0;

  for (const resource of resources) {
    switch (resource.review.status) {
      case "verified":
        verified += 1;
        break;
      case "review-needed":
        needsReview += 1;
        break;
      case "archived":
        archived += 1;
        break;
    }
  }

  return { total: resources.length, verified, needsReview, archived };
}

/**
 * Secondary line for the resource total, e.g. "39 verified · 361 awaiting review".
 * Returns null when there is nothing meaningful to break down.
 */
export function formatResourceGovernanceBreakdown(summary: ResourceGovernanceSummary): string | null {
  const parts: string[] = [];

  if (summary.verified > 0) parts.push(`${summary.verified} verified`);
  if (summary.needsReview > 0) parts.push(`${summary.needsReview} awaiting review`);
  if (summary.archived > 0) parts.push(`${summary.archived} archived`);

  return parts.length > 0 ? parts.join(" · ") : null;
}
