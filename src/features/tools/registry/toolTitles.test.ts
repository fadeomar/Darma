import { describe, expect, it } from "vitest";
import { getPublicTools } from "./index";
import { findToolTitleIssues, hasForbiddenToolTitleWord } from "./validate";

describe("public tool titles", () => {
  it("never contain the standalone word Production", () => {
    expect(findToolTitleIssues(getPublicTools())).toEqual([]);
  });

  it("flags the word case-insensitively without catching related vocabulary", () => {
    expect(hasForbiddenToolTitleWord("Meta Tag Production Studio")).toBe(true);
    expect(hasForbiddenToolTitleWord("meta tag production studio")).toBe(true);
    expect(hasForbiddenToolTitleWord("Meta Tag Generator")).toBe(false);
    expect(hasForbiddenToolTitleWord("Productivity Timer")).toBe(false);
  });

  it("keeps the task-first names for the renamed studios", () => {
    const titleById = new Map(getPublicTools().map((tool) => [tool.id, tool.title]));
    expect(titleById.get("json-formatter")).toBe("JSON Formatter");
    expect(titleById.get("meta-tag-generator")).toBe("Meta Tag Generator");
    expect(titleById.get("animated-background-generator")).toBe("Animated Background Generator");
    expect(titleById.get("beam-calculator")).toBe("Beam Calculator");
  });

  it("leaves route ids and hrefs untouched", () => {
    for (const tool of getPublicTools()) {
      expect(tool.href).toBe(`/tools/${tool.id}`);
    }
  });
});
