import { describe, expect, it } from "vitest";
import { createGridItem } from "./grid";
import {
  createItemFromSelection,
  findFirstAvailableCell,
  getSelectionPlacement,
  moveItemByStep,
  moveItemToCell,
  resizeItemByStep,
  resizeItemToCell,
} from "./editor";

describe("css grid editor interactions", () => {
  it("turns a drag selection into grid lines", () => {
    expect(
      getSelectionPlacement({
        anchor: { column: 4, row: 3 },
        current: { column: 2, row: 1 },
      }),
    ).toEqual({ columnStart: 2, columnEnd: 5, rowStart: 1, rowEnd: 4 });
  });

  it("creates an item from a selected cell rectangle", () => {
    const item = createItemFromSelection(
      {
        anchor: { column: 2, row: 1 },
        current: { column: 3, row: 2 },
      },
      5,
      4,
      3,
    );

    expect(item.name).toBe("Item 6");
    expect(item.areaName).toBe("item6");
    expect(item.columnStart).toBe(2);
    expect(item.columnEnd).toBe(4);
    expect(item.rowStart).toBe(1);
    expect(item.rowEnd).toBe(3);
  });

  it("moves an item while preserving its span and clamping to the grid", () => {
    const item = createGridItem({
      columnStart: 1,
      columnEnd: 3,
      rowStart: 1,
      rowEnd: 2,
    });

    expect(moveItemToCell(item, { column: 4, row: 3 }, 4, 3)).toMatchObject({
      columnStart: 3,
      columnEnd: 5,
      rowStart: 3,
      rowEnd: 4,
    });
  });


  it("moves a focused item one grid cell with keyboard-style steps", () => {
    const item = createGridItem({
      columnStart: 2,
      columnEnd: 4,
      rowStart: 2,
      rowEnd: 3,
    });

    expect(moveItemByStep(item, 1, 0, 5, 4)).toMatchObject({
      columnStart: 3,
      columnEnd: 5,
      rowStart: 2,
      rowEnd: 3,
    });
    expect(moveItemByStep(item, -4, -4, 5, 4)).toMatchObject({
      columnStart: 1,
      columnEnd: 3,
      rowStart: 1,
      rowEnd: 2,
    });
  });

  it("resizes an edge to the target grid cell", () => {
    const item = createGridItem({
      columnStart: 2,
      columnEnd: 4,
      rowStart: 2,
      rowEnd: 3,
    });

    expect(resizeItemToCell(item, "right", { column: 4, row: 2 }, 5, 4)).toMatchObject({
      columnStart: 2,
      columnEnd: 5,
    });
    expect(resizeItemToCell(item, "left", { column: 1, row: 2 }, 5, 4)).toMatchObject({
      columnStart: 1,
      columnEnd: 4,
    });
  });

  it("supports keyboard-sized one-line resize steps", () => {
    const item = createGridItem({
      columnStart: 2,
      columnEnd: 4,
      rowStart: 1,
      rowEnd: 3,
    });

    expect(resizeItemByStep(item, "right", 1, 5, 4).columnEnd).toBe(5);
    expect(resizeItemByStep(item, "left", 1, 5, 4).columnStart).toBe(3);
    expect(resizeItemByStep(item, "bottom", -1, 5, 4).rowEnd).toBe(2);
  });

  it("finds the first unoccupied cell for a new item", () => {
    const items = [
      createGridItem({ columnStart: 1, columnEnd: 3, rowStart: 1, rowEnd: 2 }),
      createGridItem({ columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 2 }),
    ];

    expect(findFirstAvailableCell(items, 3, 2)).toEqual({ column: 1, row: 2 });
  });
});
