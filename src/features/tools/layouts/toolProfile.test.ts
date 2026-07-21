import { describe, expect, it } from "vitest";
import type { ToolDefinition } from "@/features/tools/domain/tool";
import { audienceLabel, formatCategory, resolveToolProfile } from "./toolProfile";

function makeTool(overrides: Partial<ToolDefinition> = {}): ToolDefinition {
  return {
    id: "sample-tool",
    title: "Sample Tool",
    description: "A sample tool.",
    href: "/tools/sample-tool",
    icon: "wrench",
    status: "ready",
    completion: 100,
    tags: [],
    mainCategory: ["tools"],
    secondaryCategory: [],
    audiences: [],
    featured: false,
    visibility: "public",
    ...overrides,
  } as ToolDefinition;
}

describe("resolveToolProfile", () => {
  it("reports no meaningful content when there is no tool at all", () => {
    const profile = resolveToolProfile(undefined);

    expect(profile.hasMeaningfulContent).toBe(false);
    expect(profile.audiences).toEqual([]);
    expect(profile.categories).toEqual([]);
    expect(profile.tags).toEqual([]);
  });

  it("reports no meaningful content for a tool with empty profile metadata", () => {
    const profile = resolveToolProfile(makeTool());

    expect(profile.hasMeaningfulContent).toBe(false);
  });

  it("treats blank-string metadata as absent rather than truthy", () => {
    const profile = resolveToolProfile(
      // Cast: the registry types forbid blank audiences, but the aside must not
      // depend on the registry being well-formed to avoid rendering empty.
      makeTool({
        audiences: ["   "] as unknown as ToolDefinition["audiences"],
        secondaryCategory: [""],
        tags: ["  "],
      }),
    );

    expect(profile.hasMeaningfulContent).toBe(false);
    expect(profile.audiences).toEqual([]);
  });

  it("reports meaningful content for a single small metadata value", () => {
    const profile = resolveToolProfile(makeTool({ audiences: ["developer"] }));

    expect(profile.hasMeaningfulContent).toBe(true);
    expect(profile.audiences).toEqual(["developer"]);
    expect(profile.categories).toEqual([]);
  });

  it("reports meaningful content when only tags are present", () => {
    const profile = resolveToolProfile(makeTool({ tags: ["css"] }));

    expect(profile.hasMeaningfulContent).toBe(true);
    expect(profile.tags).toEqual(["css"]);
  });

  it("keeps several meaningful profile values and caps the long lists", () => {
    const profile = resolveToolProfile(
      makeTool({
        audiences: ["developer", "designer"],
        secondaryCategory: ["css", "visual", "layout", "extra-one", "extra-two"],
        tags: ["a", "b", "c", "d", "e", "f", "g"],
      }),
    );

    expect(profile.hasMeaningfulContent).toBe(true);
    expect(profile.audiences).toEqual(["developer", "designer"]);
    expect(profile.categories).toEqual(["css", "visual", "layout"]);
    expect(profile.tags).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("does not mutate the source tool definition", () => {
    const tool = makeTool({ tags: ["a", "b", "c", "d", "e", "f", "g"] });
    resolveToolProfile(tool);

    expect(tool.tags).toHaveLength(7);
  });
});

describe("formatCategory", () => {
  it("converts kebab-case to title case", () => {
    expect(formatCategory("css")).toBe("Css");
    expect(formatCategory("developer-tools")).toBe("Developer Tools");
  });
});

describe("audienceLabel", () => {
  it("maps known audiences to display labels", () => {
    expect(audienceLabel("developer")).toBe("Developer");
    expect(audienceLabel("business")).toBe("Business");
  });

  it("falls back to the raw value for unknown audiences", () => {
    expect(audienceLabel("archivist")).toBe("archivist");
  });
});
