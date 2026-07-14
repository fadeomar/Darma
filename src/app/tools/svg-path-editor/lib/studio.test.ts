import { describe, expect, it } from "vitest";
import { SvgPath } from "./svg";
import {
  analyzePath,
  buildCssMaskSnippet,
  buildJsonManifest,
  buildProductionChecks,
  buildReactComponent,
  buildSvgMarkup,
  calculatePathBounds,
  extractSvgPaths,
} from "./studio";

describe("extractSvgPaths", () => {
  it("accepts raw path data", () => {
    expect(extractSvgPaths("M 0 0 L 10 10")).toEqual(["M 0 0 L 10 10"]);
  });

  it("extracts multiple path elements from full SVG markup", () => {
    const input = `<svg><path fill="red" d="M0 0L10 10"/><path\n d='M 5 5 Z'></path></svg>`;
    expect(extractSvgPaths(input)).toEqual(["M0 0L10 10", "M 5 5 Z"]);
  });

  it("returns an empty list when markup has no path", () => {
    expect(extractSvgPaths("<svg><circle cx=\"5\" cy=\"5\" r=\"5\" /></svg>")).toEqual([]);
  });
});

describe("path analysis", () => {
  const svg = new SvgPath("M 0 0 L 20 0 L 20 10 Z");
  const output = svg.asString(2, true);

  it("calculates usable path metrics", () => {
    const analysis = analyzePath(svg, output);
    expect(analysis.commandCount).toBe(4);
    expect(analysis.subpathCount).toBe(1);
    expect(analysis.closedSubpathCount).toBe(1);
    expect(analysis.editablePointCount).toBeGreaterThanOrEqual(3);
    expect(analysis.outputBytes).toBeGreaterThan(0);
  });

  it("calculates finite padded and raw bounds", () => {
    expect(calculatePathBounds(svg, false)).toMatchObject({ x: 0, y: 0, width: 20, height: 10 });
    const padded = calculatePathBounds(svg, true);
    expect(padded?.width).toBeGreaterThan(20);
    expect(padded?.height).toBeGreaterThan(10);
  });

  it("warns when fill is enabled for an open subpath", () => {
    const open = new SvgPath("M 0 0 L 20 0 L 20 10");
    const checks = buildProductionChecks(analyzePath(open, open.asString()), {
      hasError: false,
      fillEnabled: true,
      minified: false,
    });
    expect(checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "open-fill", severity: "warning" }),
    ]));
  });
});

describe("generated production exports", () => {
  const svg = new SvgPath("M 0 0 L 20 0 L 20 10 Z");
  const path = svg.asString(2, true);
  const analysis = analyzePath(svg, path);
  const options = {
    path,
    viewBox: { x: 0, y: 0, width: 20, height: 10 },
    fill: "none",
    stroke: "#6366f1",
    strokeWidth: 2,
    componentName: "status icon",
  };

  it("generates standalone SVG markup", () => {
    const output = buildSvgMarkup(options);
    expect(output).toContain('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"');
    expect(output).toContain('aria-hidden="true" focusable="false"');
    expect(output).not.toContain('role="img"');
    expect(output).toContain(`d="${path}"`);
  });

  it("generates typed React component source", () => {
    const output = buildReactComponent(options);
    expect(output).toContain('import type { SVGProps } from "react";');
    expect(output).toContain("export function StatusIcon");
    expect(output).toContain('aria-hidden="true" focusable="false"');
    expect(output).not.toContain('role="img"');
    expect(output).toContain("strokeWidth={2}");
  });

  it("generates CSS mask and parseable JSON", () => {
    const css = buildCssMaskSnippet(options);
    expect(css).toContain("mask: url('data:image/svg+xml,");
    expect(css).toContain("%20");
    expect(() => JSON.parse(buildJsonManifest(options, analysis))).not.toThrow();
  });
});
