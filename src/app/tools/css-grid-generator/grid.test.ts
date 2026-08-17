import { describe, expect, it } from "vitest";
import {
  createDefaultGridState,
  createNestedGrid,
  generateGridCss,
  moveNestedGridItemByStep,
  moveNestedGridItemToCell,
  normalizeGridState,
  normalizeNestedGridsForPlacement,
  validateGridState,
} from "./grid";
import { materializeBreakpointState } from "./responsive";

describe("grid production output", () => {
  it("falls back to explicit line placement when named areas are invalid", () => {
    const state = normalizeGridState({
      ...createDefaultGridState(),
      useTemplateAreas: true,
      items: createDefaultGridState().items.map((item, index) =>
        index < 2 ? { ...item, areaName: "shared" } : item,
      ),
    });

    const css = generateGridCss(state);
    expect(css).not.toContain("grid-template-areas:");
    expect(css).not.toContain("grid-area: shared;");
    expect(css).toContain("grid-column:");
    expect(
      validateGridState(state).some((message) =>
        message.message.includes("falls back to explicit grid-column/grid-row"),
      ),
    ).toBe(true);
  });

  it("keeps named-area output when area names are unique and rectangular", () => {
    const base = createDefaultGridState();
    const state = normalizeGridState({ ...base, useTemplateAreas: true });
    const css = generateGridCss(state);

    expect(css).toContain("grid-template-areas:");
    expect(css).toContain("grid-area: hero;");
  });
  it("emits real nested-grid and subgrid CSS", () => {
    const state = createDefaultGridState();
    const parent = state.items[0];
    parent.nestedGrid = createNestedGrid(parent);
    parent.nestedGrid.columnMode = "subgrid";
    parent.nestedGrid.rowMode = "subgrid";

    const normalized = normalizeGridState(state);
    const css = generateGridCss(normalized);

    expect(css).toContain("grid-template-columns: subgrid;");
    expect(css).toContain("grid-template-rows: subgrid;");
    expect(css).toContain(".grid-item-1__nested-1");
    expect(normalized.items[0].nestedGrid?.columns).toBe(2);
    expect(normalized.items[0].nestedGrid?.rows).toBe(2);
  });


  it("moves nested children by cell while preserving span and bounds", () => {
    const state = createDefaultGridState();
    const parent = state.items[0];
    const nested = createNestedGrid(parent);
    const child = {
      ...nested.items[0],
      columnStart: 1,
      columnEnd: 2,
      rowStart: 1,
      rowEnd: 2,
    };

    expect(moveNestedGridItemToCell(child, 2, 2, 2, 2)).toMatchObject({
      columnStart: 2,
      columnEnd: 3,
      rowStart: 2,
      rowEnd: 3,
    });
    expect(moveNestedGridItemByStep(child, -3, -3, 2, 2)).toMatchObject({
      columnStart: 1,
      columnEnd: 2,
      rowStart: 1,
      rowEnd: 2,
    });
  });


  it("clamps subgrid children to the parent span at an active breakpoint", () => {
    const state = createDefaultGridState();
    const parent = state.items[0];
    parent.nestedGrid = createNestedGrid(parent);
    parent.nestedGrid.columnMode = "subgrid";
    parent.nestedGrid.items[1] = {
      ...parent.nestedGrid.items[1],
      columnStart: 2,
      columnEnd: 3,
    };
    state.responsive.tabletLayout = {
      columns: 2,
      rows: 3,
      columnTemplate: "repeat(2, minmax(0, 1fr))",
      rowTemplate: state.rowTemplate,
      gap: state.gap,
      useTemplateAreas: false,
      justifyItems: state.justifyItems,
      alignItems: state.alignItems,
      justifyContent: state.justifyContent,
      alignContent: state.alignContent,
      autoFlow: state.autoFlow,
      autoColumns: state.autoColumns,
      autoRows: state.autoRows,
      placements: {
        ...Object.fromEntries(
          state.items.map((item) => [
            item.id,
            {
              columnStart: item.columnStart,
              columnEnd: item.columnEnd,
              rowStart: item.rowStart,
              rowEnd: item.rowEnd,
            },
          ]),
        ),
        [parent.id]: {
          columnStart: 1,
          columnEnd: 2,
          rowStart: 1,
          rowEnd: 3,
        },
      },
    };

    const normalized = normalizeGridState(state);
    const tablet = normalizeNestedGridsForPlacement(
      materializeBreakpointState(normalized, "tablet"),
    );
    const nested = tablet.items[0].nestedGrid!;

    expect(nested.columns).toBe(1);
    expect(nested.items[1].columnStart).toBe(1);
    expect(nested.items[1].columnEnd).toBe(2);
  });

  it("clamps subgrid children when the parent span changes", () => {
    const state = createDefaultGridState();
    const parent = state.items[0];
    parent.nestedGrid = createNestedGrid(parent);
    parent.nestedGrid.columnMode = "subgrid";
    parent.nestedGrid.items[1] = {
      ...parent.nestedGrid.items[1],
      columnStart: 2,
      columnEnd: 3,
    };
    parent.columnEnd = 2;

    const normalized = normalizeGridState(state);
    const nested = normalized.items[0].nestedGrid!;

    expect(nested.columns).toBe(1);
    expect(nested.items[1].columnStart).toBe(1);
    expect(nested.items[1].columnEnd).toBe(2);
  });

});
