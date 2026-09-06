import { describe, expect, it } from "vitest";

import type { CoreEntity } from "../registry";
import { resolveCoreRelations } from "./relations";

const entity = (value: Partial<CoreEntity> & Pick<CoreEntity, "id" | "kind" | "title">): CoreEntity => ({
  slug: value.id,
  description: `${value.title} description`,
  href: `/${value.kind}/${value.id}`,
  status: "live",
  ...value,
});

describe("resolveCoreRelations", () => {
  it("ranks a workflow containing the current tool above generic topic overlap", () => {
    const source = entity({ id: "json-formatter", kind: "tool", title: "JSON Formatter", categories: ["developer"], tags: ["json"] });
    const workflow = entity({ id: "workflow:developer-debugging", kind: "workflow", title: "Developer Debugging", tags: ["json-formatter", "jwt-decoder"] });
    const project = entity({ id: "project:json-card", kind: "project", title: "JSON Card", categories: ["developer"], tags: ["json"] });

    const result = resolveCoreRelations(source, [source, project, workflow], { kinds: ["workflow", "project"] });

    expect(result[0]?.entity.id).toBe(workflow.id);
    expect(result[0]?.reasons).toContain("workflow-member");
  });

  it("excludes the source and non-live planned/deprecated candidates", () => {
    const source = entity({ id: "gradient", kind: "tool", title: "Gradient", tags: ["css"] });
    const planned = entity({ id: "project:planned", kind: "project", title: "Planned", tags: ["css"], status: "planned" });
    const deprecated = entity({ id: "project:deprecated", kind: "project", title: "Deprecated", tags: ["css"], status: "deprecated" });

    expect(resolveCoreRelations(source, [source, planned, deprecated])).toEqual([]);
  });

  it("respects allowed kinds", () => {
    const source = entity({ id: "gradient", kind: "tool", title: "Gradient", tags: ["css"] });
    const project = entity({ id: "project:one", kind: "project", title: "Project", tags: ["css"] });
    const workflow = entity({ id: "workflow:one", kind: "workflow", title: "Workflow", tags: ["gradient"] });

    const result = resolveCoreRelations(source, [source, project, workflow], { kinds: ["project"] });

    expect(result.map((item) => item.entity.kind)).toEqual(["project"]);
  });
});
