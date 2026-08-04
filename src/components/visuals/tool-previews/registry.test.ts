import { describe, expect, it } from "vitest";
import { getToolRegistry } from "@/features/tools/registry";
import { TOOL_PREVIEWS, resolveToolPreview } from "./registry";
import { TOOL_PREVIEW_FAMILIES, type ToolPreviewConfig } from "./types";

const tools = getToolRegistry().list();

/** Stable shape signature: two tools must not render the same composition. */
function signature(config: ToolPreviewConfig) {
  return JSON.stringify(config);
}

describe("tool preview registry", () => {
  it("maps every tool in the catalog", () => {
    const unmapped = tools.filter((tool) => !TOOL_PREVIEWS[tool.id]).map((tool) => tool.id);
    expect(unmapped).toEqual([]);
  });

  it("does not map ids that left the catalog", () => {
    const ids = new Set(tools.map((tool) => tool.id));
    expect(Object.keys(TOOL_PREVIEWS).filter((id) => !ids.has(id))).toEqual([]);
  });

  it("uses every declared family", () => {
    const used = new Set(Object.values(TOOL_PREVIEWS).map((config) => config.family));
    expect([...TOOL_PREVIEW_FAMILIES].filter((family) => !used.has(family))).toEqual([]);
  });

  it("gives each tool its own composition, not a shared family shell", () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    for (const [id, config] of Object.entries(TOOL_PREVIEWS)) {
      const key = signature(config);
      const existing = seen.get(key);
      if (existing) duplicates.push(`${existing} = ${id}`);
      else seen.set(key, id);
    }
    expect(duplicates).toEqual([]);
  });

  it("resolves a preview for an unmapped tool", () => {
    const resolved = resolveToolPreview({ id: "not-a-tool", secondaryCategory: ["css"] });
    expect(resolved.family).toBe("code");
    expect(resolveToolPreview({ id: "not-a-tool" }).family).toBe("text");
  });

  it("keeps every priority tool on a bespoke configuration", () => {
    const priority = [
      "json-formatter",
      "jwt-decoder",
      "regex-tester",
      "timestamp-converter",
      "timezone-converter",
      "color-converter",
      "password-generator",
      "image-compressor-resizer",
      "responsive-image-srcset-generator",
      "svg-path-editor",
      "css-gradient-generator",
      "og-image-generator",
      "app-screenshot-mockup-generator",
      "qr-code",
      "markdown-previewer",
      "gpa-calculator",
      "meta-tag-generator",
      "box-shadows-generator",
      "favicon-app-icon-generator",
    ];
    for (const id of priority) {
      expect(TOOL_PREVIEWS[id], `${id} is missing a preview`).toBeTruthy();
    }
  });
});
