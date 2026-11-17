import { describe, expect, it } from "vitest";
import type { CoreEntity } from "../registry";
import { selectPopularDiscoveryEntities, selectRecentlyImprovedEntities } from "./homeDiscovery";

const item = (id: string, kind: CoreEntity["kind"], extra: Partial<CoreEntity> = {}): CoreEntity => ({
  id,
  slug: id,
  kind,
  title: id,
  description: id,
  href: `/${kind}/${id}`,
  status: "live",
  ...extra,
});

describe("homepage discovery selectors", () => {
  it("keeps popular discovery mixed when multiple kinds are available", () => {
    const entities = [
      ...Array.from({ length: 8 }, (_, index) => item(`tool-${index}`, "tool", { popular: true })),
      item("game", "game", { featured: true }),
      item("workflow", "workflow", { featured: true }),
      item("project", "project", { featured: true }),
    ];
    const result = selectPopularDiscoveryEntities(entities, 6);
    expect(new Set(result.map((entity) => entity.kind)).size).toBeGreaterThan(1);
  });

  it("sorts recently improved by updatedAt", () => {
    const result = selectRecentlyImprovedEntities([
      item("older", "tool", { updatedAt: "2026-01-01T00:00:00.000Z" }),
      item("newer", "workflow", { updatedAt: "2026-08-01T00:00:00.000Z" }),
    ]);
    expect(result[0]?.id).toBe("newer");
  });
});
