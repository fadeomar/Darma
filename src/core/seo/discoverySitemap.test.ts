import { describe, expect, it } from "vitest";
import type { CoreEntity } from "../registry";
import { coreDiscoverySitemapEntries } from "./discoverySitemap";

const entity = (id: string, kind: CoreEntity["kind"], status: CoreEntity["status"] = "live"): CoreEntity => ({ id, slug: id, kind, status, title: id, description: id, href: `/${kind}/${id}` });

describe("coreDiscoverySitemapEntries", () => {
  it("includes requested live discovery kinds only", () => {
    const result = coreDiscoverySitemapEntries([
      entity("project", "project"),
      entity("workflow", "workflow"),
      entity("tool", "tool"),
      entity("planned", "project", "planned"),
    ], ["project", "workflow"], new Date("2026-01-01"));
    expect(result.map((item) => item.url)).toEqual(["/project/project", "/workflow/workflow"]);
  });
});
