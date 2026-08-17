import { describe, expect, it } from "vitest";
import { createDefaultGridState, generateGridCss, normalizeGridState } from "./grid";
import {
  createAutoLayout,
  extractBreakpointLayout,
  materializeBreakpointState,
  mergeBreakpointState,
  replaceBreakpointLayout,
} from "./responsive";

describe("responsive grid layouts", () => {
  it("migrates legacy responsive settings into editable tablet and mobile layouts", () => {
    const state = normalizeGridState(createDefaultGridState());
    const tablet = materializeBreakpointState(state, "tablet");
    const mobile = materializeBreakpointState(state, "mobile");

    expect(tablet.columns).toBe(2);
    expect(mobile.columns).toBe(1);
    expect(tablet.items.every((item) => item.columnEnd <= 3)).toBe(true);
    expect(mobile.items.every((item) => item.columnEnd <= 2)).toBe(true);
  });

  it("keeps desktop placement intact while committing a tablet-only move", () => {
    const state = normalizeGridState(createDefaultGridState());
    const desktopHero = state.items.find((item) => item.id === "hero")!;
    const tablet = materializeBreakpointState(state, "tablet");
    const nextTablet = {
      ...tablet,
      items: tablet.items.map((item) =>
        item.id === "hero"
          ? { ...item, columnStart: 2, columnEnd: 3, rowStart: 2, rowEnd: 3 }
          : item,
      ),
    };
    const merged = normalizeGridState(
      mergeBreakpointState(state, "tablet", nextTablet),
    );

    const desktopAfter = merged.items.find((item) => item.id === "hero")!;
    const tabletAfter = materializeBreakpointState(merged, "tablet").items.find(
      (item) => item.id === "hero",
    )!;

    expect(desktopAfter.columnStart).toBe(desktopHero.columnStart);
    expect(desktopAfter.columnEnd).toBe(desktopHero.columnEnd);
    expect(tabletAfter.columnStart).toBe(2);
    expect(tabletAfter.rowStart).toBe(2);
  });

  it("can copy desktop and auto-stack a mobile layout", () => {
    const state = normalizeGridState(createDefaultGridState());
    const copied = replaceBreakpointLayout(
      state,
      "tablet",
      extractBreakpointLayout(state),
    );
    const tablet = materializeBreakpointState(copied, "tablet");
    expect(tablet.columnTemplate).toBe(state.columnTemplate);

    const stacked = replaceBreakpointLayout(
      copied,
      "mobile",
      createAutoLayout(copied, 1),
    );
    const mobile = materializeBreakpointState(stacked, "mobile");
    expect(mobile.columns).toBe(1);
    expect(mobile.rows).toBe(stacked.items.length);
    expect(mobile.items.map((item) => item.rowStart)).toEqual(
      stacked.items.map((_, index) => index + 1),
    );
  });

  it("generates breakpoint-specific tracks and item placement rules", () => {
    const state = normalizeGridState(createDefaultGridState());
    const css = generateGridCss(state);

    expect(css).toContain("@media (max-width: 768px)");
    expect(css).toContain("@media (max-width: 480px)");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(css).toContain("grid-template-columns: repeat(1, minmax(0, 1fr));");
    expect(css).toContain("grid-column: 1 / 2;");
  });
});
