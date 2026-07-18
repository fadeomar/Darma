import { describe, expect, it } from "vitest";
import { createDefaultResponsiveImageState } from "./responsiveImage";
import {
  RESPONSIVE_IMAGE_PROJECT_TOOL,
  buildResponsiveImageAudit,
  buildResponsiveImageMetrics,
  buildResponsiveImageMetricsCsv,
  buildResponsiveImageSummary,
  createResponsiveImageProject,
  normalizeResponsiveImageProjectState,
  parseResponsiveImageProject,
} from "./studio";

describe("responsive image production studio", () => {
  it("round-trips a versioned project", () => {
    const state = createDefaultResponsiveImageState();
    state.attributes.alt = "Round-trip image";
    const parsed = parseResponsiveImageProject(JSON.stringify(createResponsiveImageProject(state)));
    expect(parsed.tool).toBe(RESPONSIVE_IMAGE_PROJECT_TOOL);
    expect(parsed.state.attributes.alt).toBe("Round-trip image");
    expect(parsed.state.previewDpr).toBe(2);
  });

  it("rejects empty, malformed, foreign, and unsupported projects", () => {
    expect(() => parseResponsiveImageProject(" ")).toThrow(/empty/i);
    expect(() => parseResponsiveImageProject("{" )).toThrow(/valid JSON/i);
    expect(() => parseResponsiveImageProject(JSON.stringify({ tool: "other", schemaVersion: 1, state: {} }))).toThrow(/not created/i);
    expect(() => parseResponsiveImageProject(JSON.stringify({ tool: RESPONSIVE_IMAGE_PROJECT_TOOL, schemaVersion: 9, state: {} }))).toThrow(/Unsupported/i);
  });

  it("rejects duplicate candidate and source ids", () => {
    const state = createDefaultResponsiveImageState();
    state.candidates[1].id = state.candidates[0].id;
    expect(() => parseResponsiveImageProject(JSON.stringify({ tool: RESPONSIVE_IMAGE_PROJECT_TOOL, schemaVersion: 1, state }))).toThrow(/duplicate id/i);

    const sourceState = createDefaultResponsiveImageState();
    sourceState.pictureSources[1].id = sourceState.pictureSources[0].id;
    expect(() => parseResponsiveImageProject(JSON.stringify({ tool: RESPONSIVE_IMAGE_PROJECT_TOOL, schemaVersion: 1, state: sourceState }))).toThrow(/duplicate id/i);
  });

  it("clamps imported numeric values and removes null characters", () => {
    const state = createDefaultResponsiveImageState() as unknown as Record<string, unknown>;
    const attributes = { ...(state.attributes as Record<string, unknown>), width: 99_999, height: -10, alt: "hello\0world" };
    const normalized = normalizeResponsiveImageProjectState({ ...state, previewViewportWidth: 50, previewDpr: 8, attributes });
    expect(normalized.attributes.width).toBe(10_000);
    expect(normalized.attributes.height).toBe(1);
    expect(normalized.attributes.alt).toBe("helloworld");
    expect(normalized.previewViewportWidth).toBe(320);
    expect(normalized.previewDpr).toBe(2);
  });

  it("blocks duplicate width descriptors", () => {
    const state = createDefaultResponsiveImageState();
    state.candidates[1].width = state.candidates[0].width;
    expect(buildResponsiveImageAudit(state)).toContainEqual(expect.objectContaining({ id: "duplicate-widths", severity: "error" }));
  });

  it("blocks unsafe image URL schemes", () => {
    const state = createDefaultResponsiveImageState();
    state.attributes.src = "javascript:alert(1)";
    expect(buildResponsiveImageAudit(state)).toContainEqual(expect.objectContaining({ id: "unsafe-url-scheme", severity: "error" }));
  });

  it("requires picture sources in picture mode", () => {
    const state = createDefaultResponsiveImageState();
    state.mode = "picture";
    state.pictureSources = [];
    expect(buildResponsiveImageAudit(state)).toContainEqual(expect.objectContaining({ id: "picture-sources-missing", severity: "error" }));
  });

  it("warns when the current DPR exceeds candidate coverage", () => {
    const state = createDefaultResponsiveImageState();
    state.previewViewportWidth = 1280;
    state.previewDpr = 3;
    state.defaultSlotSize = "100vw";
    state.sizes = [];
    expect(buildResponsiveImageAudit(state)).toContainEqual(expect.objectContaining({ id: "coverage-insufficient", severity: "warning" }));
  });

  it("returns four production summary cards", () => {
    const state = createDefaultResponsiveImageState();
    const checks = buildResponsiveImageAudit(state);
    expect(buildResponsiveImageSummary(state, checks)).toHaveLength(4);
    expect(buildResponsiveImageMetrics(state, checks).candidateCount).toBe(4);
  });

  it("generates a two-row metrics CSV", () => {
    const state = createDefaultResponsiveImageState();
    const csv = buildResponsiveImageMetricsCsv(state, buildResponsiveImageAudit(state));
    expect(csv.trim().split("\n")).toHaveLength(2);
    expect(csv).toContain("candidateCount");
  });
});
