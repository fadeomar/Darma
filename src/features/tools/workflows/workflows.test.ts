import { describe, expect, it } from "vitest";
import {
  appendWorkflowContext,
  getToolWorkflow,
  getWorkflowToolIds,
  toolWorkflows,
} from "./index";

describe("connected tool workflows", () => {
  it("keeps workflow and step identifiers unique", () => {
    expect(new Set(toolWorkflows.map((workflow) => workflow.id)).size).toBe(toolWorkflows.length);

    for (const workflow of toolWorkflows) {
      expect(workflow.steps.length).toBeGreaterThan(1);
      expect(new Set(workflow.steps.map((step) => step.id)).size).toBe(workflow.steps.length);
      expect(workflow.outcome.trim()).not.toBe("");
    }
  });

  it("resolves legacy workflow URLs to the new connected journeys", () => {
    expect(getToolWorkflow("color-and-branding-toolkit")?.id).toBe("color-system-studio");
    expect(getToolWorkflow("image-optimization")?.id).toBe("web-image-production");
    expect(getToolWorkflow("frontend-css-toolkit")?.id).toBe("responsive-layout-builder");
  });

  it("derives tool ids only from tool-backed steps", () => {
    const explorer = getToolWorkflow("explorer-code-preview");
    expect(explorer).not.toBeNull();
    expect(getWorkflowToolIds(explorer!)).toEqual(["code-preview-tool"]);
  });

  it("preserves query parameters without duplicating workflow context", () => {
    expect(appendWorkflowContext("/tools/css-grid-generator?preset=bento-grid", "responsive-layout-builder"))
      .toBe("/tools/css-grid-generator?preset=bento-grid&workflow=responsive-layout-builder");
    expect(appendWorkflowContext("/explore?workflow=old#catalog", "explorer-code-preview"))
      .toBe("/explore?workflow=explorer-code-preview#catalog");
  });
});
