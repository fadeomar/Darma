import { describe, expect, it } from "vitest";
import type { CoreEntity } from "../registry";
import { getRecentCoreEntities, isCoreFavorite, type CoreActivityState } from "./activityStore";

const tool: CoreEntity = { id: "json", slug: "json", kind: "tool", title: "JSON", description: "JSON tool", href: "/tools/json" };
const project: CoreEntity = { id: "p1", slug: "p1", kind: "project", title: "Project", description: "Project", href: "/element/p1" };

const state: CoreActivityState = {
  version: 2,
  favorites: ["tool:json"],
  entities: {
    "tool:json": { id: tool.id, kind: tool.kind, title: tool.title, href: tool.href },
    "project:p1": { id: project.id, kind: project.kind, title: project.title, href: project.href },
  },
  events: [
    { entityId: "p1", entityKind: "project", type: "view", at: 20 },
    { entityId: "json", entityKind: "tool", type: "open", at: 10 },
    { entityId: "p1", entityKind: "project", type: "open", at: 5 },
  ],
};

describe("core activity helpers", () => {
  it("deduplicates recents by entity and preserves recency", () => {
    expect(getRecentCoreEntities(state).map((item) => item.id)).toEqual(["p1", "json"]);
  });

  it("filters recents by kind", () => {
    expect(getRecentCoreEntities(state, 12, ["tool"]).map((item) => item.id)).toEqual(["json"]);
  });

  it("resolves favorites by kind + id key", () => {
    expect(isCoreFavorite(state, tool)).toBe(true);
    expect(isCoreFavorite(state, project)).toBe(false);
  });
});
