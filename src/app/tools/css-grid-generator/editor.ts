import { clampItemToGrid, createGridItem } from "./grid";
import type { GridItem } from "./types";

export type GridCell = {
  column: number;
  row: number;
};

export type GridResizeEdge = "top" | "right" | "bottom" | "left";

export type GridSelection = {
  anchor: GridCell;
  current: GridCell;
};

export type GridPlacement = {
  columnStart: number;
  columnEnd: number;
  rowStart: number;
  rowEnd: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function getSelectionPlacement(selection: GridSelection): GridPlacement {
  const columnStart = Math.min(selection.anchor.column, selection.current.column);
  const columnEnd = Math.max(selection.anchor.column, selection.current.column) + 1;
  const rowStart = Math.min(selection.anchor.row, selection.current.row);
  const rowEnd = Math.max(selection.anchor.row, selection.current.row) + 1;

  return { columnStart, columnEnd, rowStart, rowEnd };
}

export function createItemFromSelection(
  selection: GridSelection,
  index: number,
  columns: number,
  rows: number,
): GridItem {
  const placement = getSelectionPlacement(selection);
  const name = `Item ${index + 1}`;

  return clampItemToGrid(
    createGridItem({
      ...placement,
      name,
      areaName: `item${index + 1}`,
      content: name,
    }),
    columns,
    rows,
  );
}

export function moveItemToCell(
  item: GridItem,
  target: GridCell,
  columns: number,
  rows: number,
): GridItem {
  const columnSpan = Math.max(1, item.columnEnd - item.columnStart);
  const rowSpan = Math.max(1, item.rowEnd - item.rowStart);
  const columnStart = clamp(target.column, 1, Math.max(1, columns - columnSpan + 1));
  const rowStart = clamp(target.row, 1, Math.max(1, rows - rowSpan + 1));

  return {
    ...item,
    columnStart,
    columnEnd: columnStart + columnSpan,
    rowStart,
    rowEnd: rowStart + rowSpan,
  };
}

export function moveItemByStep(
  item: GridItem,
  columnDelta: number,
  rowDelta: number,
  columns: number,
  rows: number,
): GridItem {
  return moveItemToCell(
    item,
    {
      column: item.columnStart + columnDelta,
      row: item.rowStart + rowDelta,
    },
    columns,
    rows,
  );
}


export function resizeItemToCell(
  item: GridItem,
  edge: GridResizeEdge,
  target: GridCell,
  columns: number,
  rows: number,
): GridItem {
  const next = { ...item };

  if (edge === "left") {
    next.columnStart = clamp(target.column, 1, item.columnEnd - 1);
  }
  if (edge === "right") {
    next.columnEnd = clamp(target.column + 1, item.columnStart + 1, columns + 1);
  }
  if (edge === "top") {
    next.rowStart = clamp(target.row, 1, item.rowEnd - 1);
  }
  if (edge === "bottom") {
    next.rowEnd = clamp(target.row + 1, item.rowStart + 1, rows + 1);
  }

  return clampItemToGrid(next, columns, rows);
}

export function resizeItemByStep(
  item: GridItem,
  edge: GridResizeEdge,
  delta: number,
  columns: number,
  rows: number,
): GridItem {
  const next = { ...item };

  if (edge === "left") next.columnStart += delta;
  if (edge === "right") next.columnEnd += delta;
  if (edge === "top") next.rowStart += delta;
  if (edge === "bottom") next.rowEnd += delta;

  if (edge === "left") {
    next.columnStart = clamp(next.columnStart, 1, item.columnEnd - 1);
  }
  if (edge === "right") {
    next.columnEnd = clamp(next.columnEnd, item.columnStart + 1, columns + 1);
  }
  if (edge === "top") {
    next.rowStart = clamp(next.rowStart, 1, item.rowEnd - 1);
  }
  if (edge === "bottom") {
    next.rowEnd = clamp(next.rowEnd, item.rowStart + 1, rows + 1);
  }

  return clampItemToGrid(next, columns, rows);
}

export function findFirstAvailableCell(
  items: GridItem[],
  columns: number,
  rows: number,
): GridCell {
  for (let row = 1; row <= rows; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      const occupied = items.some(
        (item) =>
          column >= item.columnStart &&
          column < item.columnEnd &&
          row >= item.rowStart &&
          row < item.rowEnd,
      );
      if (!occupied) return { column, row };
    }
  }

  return { column: 1, row: 1 };
}

export function isSameGridItem(first: GridItem, second: GridItem) {
  return (
    first.columnStart === second.columnStart &&
    first.columnEnd === second.columnEnd &&
    first.rowStart === second.rowStart &&
    first.rowEnd === second.rowEnd
  );
}
