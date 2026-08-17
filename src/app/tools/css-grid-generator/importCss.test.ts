import { describe, expect, it } from "vitest";
import { createDefaultGridState } from "./grid";
import { importGridCss } from "./importCss";

describe("importGridCss", () => {
  it("imports container tracks, placements, auto flow, and responsive media queries", () => {
    const result = importGridCss(`
      .layout {
        display: grid;
        grid-template-columns: 240px 1fr 2fr;
        grid-template-rows: auto 1fr;
        gap: 16px 24px;
        grid-auto-flow: row dense;
      }
      .card-a { grid-column: 1 / 2; grid-row: 1 / 3; }
      .card-b { grid-column: 2 / 4; grid-row: 1 / 2; }
      @media (max-width: 760px) {
        .layout { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, auto); gap: 12px; }
        .card-a { grid-column: 1 / 2; grid-row: 1 / 2; }
        .card-b { grid-column: 2 / 3; grid-row: 1 / 2; }
      }
      @media (max-width: 440px) {
        .layout { grid-template-columns: 1fr; grid-template-rows: repeat(2, auto); }
        .card-a { grid-column: 1 / 2; grid-row: 1 / 2; }
        .card-b { grid-column: 1 / 2; grid-row: 2 / 3; }
      }
    `, createDefaultGridState());

    expect(result.state.containerClassName).toBe("layout");
    expect(result.state.columns).toBe(3);
    expect(result.state.rows).toBe(2);
    expect(result.state.autoFlow).toBe("row dense");
    expect(result.state.items[0].columnEnd).toBe(2);
    expect(result.state.responsive.tabletBreakpoint).toBe(760);
    expect(result.state.responsive.mobileBreakpoint).toBe(440);
    expect(result.state.responsive.tabletLayout?.columns).toBe(2);
    expect(result.state.responsive.mobileLayout?.columns).toBe(1);
  });

  it("matches generated item classes by selector instead of responsive rule order", () => {
    const result = importGridCss(`
      .grid-layout {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(3, auto);
      }
      .grid-item-1 { grid-column: 1 / 3; grid-row: 1 / 3; }
      .grid-item-2 { grid-column: 3 / 5; grid-row: 1 / 2; }
      .grid-item-3 { grid-column: 3 / 4; grid-row: 2 / 3; }
      @media (max-width: 760px) {
        .grid-layout {
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(3, auto);
        }
        .grid-item-3 { grid-column: 2 / 3; grid-row: 3 / 4; }
      }
    `, createDefaultGridState());

    const featureA = result.state.items.find((item) => item.id === "feature-a")!;
    expect(featureA.name).toBe("Feature A");

    const tabletPlacement = result.state.responsive.tabletLayout?.placements["feature-a"];
    expect(tabletPlacement).toEqual({
      columnStart: 2,
      columnEnd: 3,
      rowStart: 3,
      rowEnd: 4,
    });
  });

  it("ignores unrelated max-width media queries when choosing Grid breakpoints", () => {
    const result = importGridCss(`
      .layout {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: auto;
      }
      @media (max-width: 1200px) {
        .marketing-banner { display: none; }
      }
      @media (max-width: 760px) {
        .layout { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 440px) {
        .layout { grid-template-columns: 1fr; }
      }
    `, createDefaultGridState());

    expect(result.state.responsive.tabletBreakpoint).toBe(760);
    expect(result.state.responsive.mobileBreakpoint).toBe(440);
  });
});
