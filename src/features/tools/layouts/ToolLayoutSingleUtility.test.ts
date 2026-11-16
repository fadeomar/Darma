import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import postcss from "postcss";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

let ToolLayoutSingleUtility: typeof import("./ToolLayoutSingleUtility").ToolLayoutSingleUtility;

beforeAll(async () => {
  vi.stubGlobal("React", React);
  ({ ToolLayoutSingleUtility } = await import("./ToolLayoutSingleUtility"));
});
afterAll(() => vi.unstubAllGlobals());

const css = postcss.parse(readFileSync("src/styles/tool-workspace.css", "utf8"));
const legacyRules: string[] = [];
css.walkRules((rule) => {
  if (rule.selector.includes(":has(> aside)") && rule.nodes.some((node) => node.type === "decl" && ["grid-template-columns", "overflow-y"].includes(node.prop))) {
    legacyRules.push(rule.selector);
  }
});

function render(layout?: "stacked" | "columns") {
  return load(`<main data-tool-workspace>${renderToStaticMarkup(React.createElement(ToolLayoutSingleUtility, {
    layout,
    controlsSlot: React.createElement("input", { "aria-label": "Content" }),
    resultSlot: "Preview",
  }))}</main>`);
}

describe("single utility layout with the application CSS", () => {
  it("excludes stacked controls from legacy column and internal-scroll rules", () => {
    const $ = render("stacked");
    expect($('[data-tool-flow="stacked"] > .grid').hasClass("grid-cols-1")).toBe(true);
    expect(legacyRules.length).toBeGreaterThan(0);
    for (const selector of legacyRules) expect($(selector)).toHaveLength(0);
  });

  it("preserves column and scroll normalization for the default layout", () => {
    const $ = render();
    expect($('[data-tool-flow="columns"]')).toHaveLength(1);
    expect(legacyRules.some((selector) => $(selector).length > 0)).toBe(true);
    expect($('aside').first().hasClass("lg:overflow-y-auto")).toBe(true);
  });
});
