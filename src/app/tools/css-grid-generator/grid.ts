import type {
  GridGeneratorState,
  GridItem,
  GridNestedGrid,
  GridNestedItem,
  GridValidationMessage,
} from "./types";
import { expandFixedTrackTemplate } from "./tracks";
import {
  createLegacyMobileLayout,
  createLegacyTabletLayout,
  materializeBreakpointState,
  normalizeBreakpointLayout,
} from "./responsive";

const CSS_IDENTIFIER = /^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/;
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const uid = () => Math.random().toString(36).slice(2, 9);

export function createGridItem(partial: Partial<GridItem> = {}): GridItem {
  const id = partial.id ?? `item-${uid()}`;
  const name = partial.name ?? "Grid item";
  const fallbackAreaName =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "item";

  return {
    id,
    name,
    areaName: partial.areaName ?? fallbackAreaName,
    columnStart: partial.columnStart ?? 1,
    columnEnd: partial.columnEnd ?? 2,
    rowStart: partial.rowStart ?? 1,
    rowEnd: partial.rowEnd ?? 2,
    background: partial.background ?? "#2563eb",
    textColor: partial.textColor ?? "#ffffff",
    borderRadius: partial.borderRadius ?? 18,
    padding: partial.padding ?? "1rem",
    content: partial.content ?? name,
    justifySelf: partial.justifySelf ?? "auto",
    alignSelf: partial.alignSelf ?? "auto",
    nestedGrid: partial.nestedGrid ?? null,
  };
}

export function createNestedGridItem(
  partial: Partial<GridNestedItem> = {},
): GridNestedItem {
  const id = partial.id ?? `nested-${uid()}`;
  const name = partial.name ?? "Nested item";
  return {
    id,
    name,
    content: partial.content ?? name,
    columnStart: partial.columnStart ?? 1,
    columnEnd: partial.columnEnd ?? 2,
    rowStart: partial.rowStart ?? 1,
    rowEnd: partial.rowEnd ?? 2,
    background: partial.background ?? "#312e81",
    textColor: partial.textColor ?? "#ffffff",
  };
}

export function createNestedGrid(parent: GridItem): GridNestedGrid {
  const columns = Math.max(1, parent.columnEnd - parent.columnStart);
  const rows = Math.max(1, parent.rowEnd - parent.rowStart);
  const items = [
    createNestedGridItem({
      id: `${parent.id}-nested-1`,
      name: "Nested A",
      content: "Nested A",
      columnStart: 1,
      columnEnd: 2,
      rowStart: 1,
      rowEnd: 2,
    }),
    createNestedGridItem({
      id: `${parent.id}-nested-2`,
      name: "Nested B",
      content: "Nested B",
      columnStart: Math.min(2, columns),
      columnEnd: Math.min(2, columns) + 1,
      rowStart: 1,
      rowEnd: 2,
      background: "#0f766e",
    }),
  ];
  return {
    columnMode: "independent",
    rowMode: "independent",
    columns,
    rows,
    columnTemplate: `repeat(${columns}, minmax(0, 1fr))`,
    rowTemplate: `repeat(${rows}, minmax(64px, auto))`,
    gap: { row: 0.5, column: 0.5, unit: "rem" },
    items,
  };
}

function clampNestedItemToGrid(
  item: GridNestedItem,
  columns: number,
  rows: number,
): GridNestedItem {
  const columnStart = clamp(Math.round(item.columnStart), 1, columns);
  const rowStart = clamp(Math.round(item.rowStart), 1, rows);
  const columnEnd = clamp(
    Math.round(item.columnEnd),
    columnStart + 1,
    columns + 1,
  );
  const rowEnd = clamp(
    Math.round(item.rowEnd),
    rowStart + 1,
    rows + 1,
  );
  return { ...item, columnStart, columnEnd, rowStart, rowEnd };
}


export function moveNestedGridItemToCell(
  item: GridNestedItem,
  column: number,
  row: number,
  columns: number,
  rows: number,
): GridNestedItem {
  const columnSpan = Math.max(1, item.columnEnd - item.columnStart);
  const rowSpan = Math.max(1, item.rowEnd - item.rowStart);
  const columnStart = clamp(
    Math.round(column),
    1,
    Math.max(1, columns - columnSpan + 1),
  );
  const rowStart = clamp(
    Math.round(row),
    1,
    Math.max(1, rows - rowSpan + 1),
  );
  return {
    ...item,
    columnStart,
    columnEnd: columnStart + columnSpan,
    rowStart,
    rowEnd: rowStart + rowSpan,
  };
}

export function moveNestedGridItemByStep(
  item: GridNestedItem,
  columnDelta: number,
  rowDelta: number,
  columns: number,
  rows: number,
): GridNestedItem {
  return moveNestedGridItemToCell(
    item,
    item.columnStart + columnDelta,
    item.rowStart + rowDelta,
    columns,
    rows,
  );
}

export function normalizeNestedGrid(
  parent: GridItem,
  nestedGrid: GridNestedGrid,
): GridNestedGrid {
  const parentColumns = Math.max(1, parent.columnEnd - parent.columnStart);
  const parentRows = Math.max(1, parent.rowEnd - parent.rowStart);
  const columnMode = nestedGrid.columnMode === "subgrid" ? "subgrid" : "independent";
  const rowMode = nestedGrid.rowMode === "subgrid" ? "subgrid" : "independent";
  const columns =
    columnMode === "subgrid"
      ? parentColumns
      : clamp(Math.round(nestedGrid.columns || parentColumns), 1, 12);
  const rows =
    rowMode === "subgrid"
      ? parentRows
      : clamp(Math.round(nestedGrid.rows || parentRows), 1, 12);
  return {
    ...nestedGrid,
    columnMode,
    rowMode,
    columns,
    rows,
    columnTemplate:
      nestedGrid.columnTemplate?.trim() && nestedGrid.columnTemplate.trim() !== "subgrid"
        ? nestedGrid.columnTemplate.trim()
        : `repeat(${columns}, minmax(0, 1fr))`,
    rowTemplate:
      nestedGrid.rowTemplate?.trim() && nestedGrid.rowTemplate.trim() !== "subgrid"
        ? nestedGrid.rowTemplate.trim()
        : `repeat(${rows}, minmax(64px, auto))`,
    gap: {
      row: clamp(Number(nestedGrid.gap?.row) || 0, 0, nestedGrid.gap?.unit === "px" ? 96 : 6),
      column: clamp(Number(nestedGrid.gap?.column) || 0, 0, nestedGrid.gap?.unit === "px" ? 96 : 6),
      unit: nestedGrid.gap?.unit === "px" ? "px" : "rem",
    },
    items: (nestedGrid.items ?? [])
      .slice(0, 8)
      .map((item) => clampNestedItemToGrid(item, columns, rows)),
  };
}

export function normalizeNestedGridsForPlacement(
  state: GridGeneratorState,
): GridGeneratorState {
  return {
    ...state,
    items: state.items.map((item) =>
      item.nestedGrid
        ? { ...item, nestedGrid: normalizeNestedGrid(item, item.nestedGrid) }
        : item,
    ),
  };
}

export function createDefaultGridState(): GridGeneratorState {
  const items = [
    createGridItem({
      id: "hero",
      name: "Hero",
      areaName: "hero",
      columnStart: 1,
      columnEnd: 3,
      rowStart: 1,
      rowEnd: 3,
      background: "#4f46e5",
      content: "Hero card",
    }),
    createGridItem({
      id: "stats",
      name: "Stats",
      areaName: "stats",
      columnStart: 3,
      columnEnd: 5,
      rowStart: 1,
      rowEnd: 2,
      background: "#0f766e",
      content: "Stats strip",
    }),
    createGridItem({
      id: "feature-a",
      name: "Feature A",
      areaName: "featureA",
      columnStart: 3,
      columnEnd: 4,
      rowStart: 2,
      rowEnd: 3,
      background: "#9333ea",
      content: "Feature",
    }),
    createGridItem({
      id: "feature-b",
      name: "Feature B",
      areaName: "featureB",
      columnStart: 4,
      columnEnd: 5,
      rowStart: 2,
      rowEnd: 3,
      background: "#ea580c",
      content: "Feature",
    }),
    createGridItem({
      id: "footer-card",
      name: "Footer card",
      areaName: "footer",
      columnStart: 1,
      columnEnd: 5,
      rowStart: 3,
      rowEnd: 4,
      background: "#0f172a",
      content: "Full-width footer card",
    }),
  ];
  return {
    columns: 4,
    rows: 3,
    columnTemplate: "repeat(4, minmax(0, 1fr))",
    rowTemplate: "repeat(3, minmax(120px, auto))",
    gap: { row: 1, column: 1, unit: "rem" },
    containerClassName: "grid-layout",
    itemClassPrefix: "grid-item",
    useTemplateAreas: false,
    includeDemoStyles: true,
    showGridLines: true,
    showLineNumbers: true,
    showAreaNames: true,
    previewWidth: 960,
    justifyItems: "stretch",
    alignItems: "stretch",
    justifyContent: "stretch",
    alignContent: "stretch",
    autoFlow: "row",
    autoColumns: "auto",
    autoRows: "auto",
    responsive: {
      enabled: true,
      tabletBreakpoint: 768,
      mobileBreakpoint: 480,
      tabletColumns: 2,
      mobileBehavior: "stack",
    },
    items,
    selectedItemId: items[0]?.id ?? null,
  };
}

export function clampItemToGrid(
  item: GridItem,
  columns: number,
  rows: number,
): GridItem {
  const columnStart = clamp(Math.round(item.columnStart), 1, columns);
  const rowStart = clamp(Math.round(item.rowStart), 1, rows);
  const columnEnd = clamp(
    Math.round(item.columnEnd),
    columnStart + 1,
    columns + 1,
  );
  const rowEnd = clamp(Math.round(item.rowEnd), rowStart + 1, rows + 1);
  return { ...item, columnStart, columnEnd, rowStart, rowEnd };
}

export function normalizeGridState(
  state: GridGeneratorState,
): GridGeneratorState {
  const columns = clamp(Math.round(state.columns || 1), 1, 12);
  const rows = clamp(Math.round(state.rows || 1), 1, 24);
  const items = state.items
    .slice(0, 24)
    .map((item) => {
      const clamped = clampItemToGrid(item, columns, rows);
      return clamped.nestedGrid
        ? { ...clamped, nestedGrid: normalizeNestedGrid(clamped, clamped.nestedGrid) }
        : { ...clamped, nestedGrid: null };
    });
  const tabletBreakpoint = clamp(
    Number(state.responsive.tabletBreakpoint) || 768,
    480,
    1200,
  );
  const mobileBreakpoint = clamp(
    Number(state.responsive.mobileBreakpoint) || 480,
    280,
    Math.min(760, tabletBreakpoint - 1),
  );
  const responsiveBase = {
    ...state.responsive,
    tabletBreakpoint,
    mobileBreakpoint,
    tabletColumns: clamp(Number(state.responsive.tabletColumns) || 1, 1, columns),
  };
  const normalizedBase = {
    ...state,
    columns,
    rows,
    items,
    responsive: responsiveBase,
  };
  const responsive = {
    ...responsiveBase,
    tabletLayout: normalizeBreakpointLayout(
      responsiveBase.tabletLayout ?? createLegacyTabletLayout(normalizedBase),
      normalizedBase,
    ),
    mobileLayout: normalizeBreakpointLayout(
      responsiveBase.mobileLayout ?? createLegacyMobileLayout(normalizedBase),
      normalizedBase,
    ),
  };
  return {
    ...state,
    columns,
    rows,
    columnTemplate:
      state.columnTemplate.trim() || `repeat(${columns}, minmax(0, 1fr))`,
    rowTemplate:
      state.rowTemplate.trim() || `repeat(${rows}, minmax(96px, auto))`,
    autoFlow:
      state.autoFlow === "column" ||
      state.autoFlow === "row dense" ||
      state.autoFlow === "column dense"
        ? state.autoFlow
        : "row",
    autoColumns: state.autoColumns?.trim() || "auto",
    autoRows: state.autoRows?.trim() || "auto",
    containerClassName: normalizeCssClass(state.containerClassName, "grid-layout"),
    itemClassPrefix: normalizeCssClass(state.itemClassPrefix, "grid-item"),
    gap: {
      row: clamp(
        Number(state.gap.row) || 0,
        0,
        state.gap.unit === "rem" ? 6 : 96,
      ),
      column: clamp(
        Number(state.gap.column) || 0,
        0,
        state.gap.unit === "rem" ? 6 : 96,
      ),
      unit: state.gap.unit,
    },
    previewWidth: clamp(Number(state.previewWidth) || 960, 320, 1440),
    responsive,
    items,
    selectedItemId: items.some((item) => item.id === state.selectedItemId)
      ? state.selectedItemId
      : (items[0]?.id ?? null),
  };
}

const itemClass = (state: GridGeneratorState, item: GridItem, index: number) =>
  `${state.itemClassPrefix}-${index + 1}`;
const nestedItemClass = (
  state: GridGeneratorState,
  item: GridItem,
  index: number,
  nestedIndex: number,
) => `${itemClass(state, item, index)}__nested-${nestedIndex + 1}`;
const gapValue = (state: GridGeneratorState) =>
  `${state.gap.row}${state.gap.unit} ${state.gap.column}${state.gap.unit}`;

function normalizeCssClass(value: string, fallback: string) {
  const cleaned = value.trim().replace(/^\./, "");
  return CSS_IDENTIFIER.test(cleaned) ? cleaned : fallback;
}

function customProperties(state: GridGeneratorState) {
  return [
    ["--grid-columns", state.columnTemplate],
    ["--grid-rows", state.rowTemplate],
    ["--grid-row-gap", `${state.gap.row}${state.gap.unit}`],
    ["--grid-column-gap", `${state.gap.column}${state.gap.unit}`],
    ["--grid-gap", gapValue(state)],
  ] as const;
}

export function generateTemplateAreas(state: GridGeneratorState): {
  css: string;
  matrix: string[][];
  warnings: string[];
} {
  const normalized = normalizeGridState(state);
  const matrix = Array.from({ length: normalized.rows }, () =>
    Array.from({ length: normalized.columns }, () => "."),
  );
  const warnings: string[] = [];

  for (const item of normalized.items) {
    if (!CSS_IDENTIFIER.test(item.areaName))
      warnings.push(`${item.name} has an invalid CSS area name.`);
    for (let row = item.rowStart - 1; row < item.rowEnd - 1; row += 1) {
      for (
        let column = item.columnStart - 1;
        column < item.columnEnd - 1;
        column += 1
      ) {
        if (matrix[row]?.[column] && matrix[row][column] !== ".")
          warnings.push(
            `${item.name} overlaps another item, so clean template areas may be inaccurate.`,
          );
        if (matrix[row]) matrix[row][column] = item.areaName;
      }
    }
  }

  for (const item of normalized.items) {
    const cells: Array<[number, number]> = [];
    matrix.forEach((row, rowIndex) =>
      row.forEach(
        (area, columnIndex) =>
          area === item.areaName && cells.push([rowIndex, columnIndex]),
      ),
    );
    if (!cells.length) continue;
    const rows = cells.map(([row]) => row);
    const columns = cells.map(([, column]) => column);
    for (let row = Math.min(...rows); row <= Math.max(...rows); row += 1) {
      for (
        let column = Math.min(...columns);
        column <= Math.max(...columns);
        column += 1
      ) {
        if (matrix[row]?.[column] !== item.areaName)
          warnings.push(
            `${item.name} is not rectangular and cannot be represented cleanly as a named area.`,
          );
      }
    }
  }

  const rows = matrix.map((row) => `  "${row.join(" ")}"`).join("\n");
  return {
    css: `grid-template-areas:\n${rows};`,
    matrix,
    warnings: Array.from(new Set(warnings)),
  };
}

function canEmitTemplateAreas(
  state: GridGeneratorState,
  areas = generateTemplateAreas(state),
) {
  if (!state.useTemplateAreas || areas.warnings.length) return false;
  const names = new Set<string>();
  for (const item of state.items) {
    if (!CSS_IDENTIFIER.test(item.areaName) || names.has(item.areaName)) {
      return false;
    }
    names.add(item.areaName);
  }
  return true;
}

export function generateGridCss(state: GridGeneratorState): string {
  const normalized = normalizeGridState(state);
  const areas = generateTemplateAreas(normalized);
  const emitTemplateAreas = canEmitTemplateAreas(normalized, areas);
  const lines: string[] = [
    `.${normalized.containerClassName} {`,
    "  display: grid;",
    `  grid-template-columns: ${normalized.columnTemplate};`,
    `  grid-template-rows: ${normalized.rowTemplate};`,
    `  gap: ${gapValue(normalized)};`,
    `  justify-items: ${normalized.justifyItems};`,
    `  align-items: ${normalized.alignItems};`,
    `  justify-content: ${normalized.justifyContent};`,
    `  align-content: ${normalized.alignContent};`,
    `  grid-auto-flow: ${normalized.autoFlow};`,
    `  grid-auto-columns: ${normalized.autoColumns};`,
    `  grid-auto-rows: ${normalized.autoRows};`,
  ];
  if (emitTemplateAreas)
    lines.push(...areas.css.split("\n").map((line) => `  ${line}`));
  if (normalized.includeDemoStyles)
    lines.push(
      "  max-width: 1120px;",
      "  min-height: 420px;",
      "  padding: 1rem;",
      "  border-radius: 1.5rem;",
    );
  lines.push("}", "");
  if (normalized.includeDemoStyles) {
    lines.push(
      `.${normalized.containerClassName} > * {`,
      "  min-width: 0;",
      "}",
      "",
    );
  }
  normalized.items.forEach((item, index) => {
    lines.push(`.${itemClass(normalized, item, index)} {`);
    if (emitTemplateAreas)
      lines.push(`  grid-area: ${item.areaName};`);
    else
      lines.push(
        `  grid-column: ${item.columnStart} / ${item.columnEnd};`,
        `  grid-row: ${item.rowStart} / ${item.rowEnd};`,
      );
    if (item.justifySelf !== "auto")
      lines.push(`  justify-self: ${item.justifySelf};`);
    if (item.alignSelf !== "auto")
      lines.push(`  align-self: ${item.alignSelf};`);
    if (item.nestedGrid) {
      lines.push(
        "  display: grid;",
        `  grid-template-columns: ${item.nestedGrid.columnMode === "subgrid" ? "subgrid" : item.nestedGrid.columnTemplate};`,
        `  grid-template-rows: ${item.nestedGrid.rowMode === "subgrid" ? "subgrid" : item.nestedGrid.rowTemplate};`,
        `  gap: ${item.nestedGrid.gap.row}${item.nestedGrid.gap.unit} ${item.nestedGrid.gap.column}${item.nestedGrid.gap.unit};`,
      );
    }
    if (normalized.includeDemoStyles)
      lines.push(
        `  background: ${item.background};`,
        `  color: ${item.textColor};`,
        `  border-radius: ${item.borderRadius}px;`,
        `  padding: ${item.padding};`,
      );
    lines.push("}", "");
    if (item.nestedGrid) {
      item.nestedGrid.items.forEach((nestedItem, nestedIndex) => {
        lines.push(`.${nestedItemClass(normalized, item, index, nestedIndex)} {`);
        lines.push(
          `  grid-column: ${nestedItem.columnStart} / ${nestedItem.columnEnd};`,
          `  grid-row: ${nestedItem.rowStart} / ${nestedItem.rowEnd};`,
        );
        if (normalized.includeDemoStyles) {
          lines.push(
            `  background: ${nestedItem.background};`,
            `  color: ${nestedItem.textColor};`,
            "  border-radius: 0.75rem;",
            "  padding: 0.75rem;",
            "  min-width: 0;",
          );
        }
        lines.push("}", "");
      });
    }
  });
  if (normalized.responsive.enabled) {
    appendResponsiveLayoutCss(
      lines,
      normalized,
      normalizeNestedGridsForPlacement(
        materializeBreakpointState(normalized, "tablet"),
      ),
      normalized.responsive.tabletBreakpoint,
    );
    lines.push("");
    appendResponsiveLayoutCss(
      lines,
      normalized,
      normalizeNestedGridsForPlacement(
        materializeBreakpointState(normalized, "mobile"),
      ),
      normalized.responsive.mobileBreakpoint,
    );
  }
  return lines.join("\n").trim();
}

function appendResponsiveLayoutCss(
  lines: string[],
  desktop: GridGeneratorState,
  layout: GridGeneratorState,
  maxWidth: number,
) {
  const areas = generateTemplateAreas(layout);
  const emitTemplateAreas = canEmitTemplateAreas(layout, areas);
  lines.push(
    `@media (max-width: ${maxWidth}px) {`,
    `  .${desktop.containerClassName} {`,
    `    grid-template-columns: ${layout.columnTemplate};`,
    `    grid-template-rows: ${layout.rowTemplate};`,
    `    gap: ${gapValue(layout)};`,
    `    justify-items: ${layout.justifyItems};`,
    `    align-items: ${layout.alignItems};`,
    `    justify-content: ${layout.justifyContent};`,
    `    align-content: ${layout.alignContent};`,
    `    grid-auto-flow: ${layout.autoFlow};`,
    `    grid-auto-columns: ${layout.autoColumns};`,
    `    grid-auto-rows: ${layout.autoRows};`,
  );
  if (emitTemplateAreas) {
    lines.push(...areas.css.split("\n").map((line) => `    ${line}`));
  }
  lines.push("  }");

  layout.items.forEach((item, index) => {
    lines.push(`  .${itemClass(desktop, item, index)} {`);
    if (emitTemplateAreas) {
      lines.push(`    grid-area: ${item.areaName};`);
    } else {
      lines.push(
        `    grid-column: ${item.columnStart} / ${item.columnEnd};`,
        `    grid-row: ${item.rowStart} / ${item.rowEnd};`,
      );
    }
    lines.push("  }");
    if (item.nestedGrid) {
      item.nestedGrid.items.forEach((nestedItem, nestedIndex) => {
        lines.push(`  .${nestedItemClass(desktop, item, index, nestedIndex)} {`);
        lines.push(
          `    grid-column: ${nestedItem.columnStart} / ${nestedItem.columnEnd};`,
          `    grid-row: ${nestedItem.rowStart} / ${nestedItem.rowEnd};`,
          "  }",
        );
      });
    }
  });
  lines.push("}");
}

export function generateGridCssVariables(state: GridGeneratorState): string {
  const normalized = normalizeGridState(state);
  const areas = generateTemplateAreas(normalized);
  const emitTemplateAreas = canEmitTemplateAreas(normalized, areas);
  const lines: string[] = [`.${normalized.containerClassName} {`];
  customProperties(normalized).forEach(([name, value]) =>
    lines.push(`  ${name}: ${value};`),
  );
  lines.push(
    "  display: grid;",
    "  grid-template-columns: var(--grid-columns);",
    "  grid-template-rows: var(--grid-rows);",
    "  gap: var(--grid-gap);",
    `  justify-items: ${normalized.justifyItems};`,
    `  align-items: ${normalized.alignItems};`,
    `  justify-content: ${normalized.justifyContent};`,
    `  align-content: ${normalized.alignContent};`,
    `  grid-auto-flow: ${normalized.autoFlow};`,
    `  grid-auto-columns: ${normalized.autoColumns};`,
    `  grid-auto-rows: ${normalized.autoRows};`,
  );
  if (emitTemplateAreas)
    lines.push(...areas.css.split("\n").map((line) => `  ${line}`));
  lines.push("}");

  normalized.items.forEach((item, index) => {
    lines.push(`.${itemClass(normalized, item, index)} {`);
    if (emitTemplateAreas)
      lines.push(`  grid-area: ${item.areaName};`);
    else
      lines.push(
        `  grid-column: ${item.columnStart} / ${item.columnEnd};`,
        `  grid-row: ${item.rowStart} / ${item.rowEnd};`,
      );
    if (item.nestedGrid) {
      lines.push(
        "  display: grid;",
        `  grid-template-columns: ${item.nestedGrid.columnMode === "subgrid" ? "subgrid" : item.nestedGrid.columnTemplate};`,
        `  grid-template-rows: ${item.nestedGrid.rowMode === "subgrid" ? "subgrid" : item.nestedGrid.rowTemplate};`,
        `  gap: ${item.nestedGrid.gap.row}${item.nestedGrid.gap.unit} ${item.nestedGrid.gap.column}${item.nestedGrid.gap.unit};`,
      );
    }
    lines.push("}", "");
    if (item.nestedGrid) {
      item.nestedGrid.items.forEach((nestedItem, nestedIndex) => {
        lines.push(`.${nestedItemClass(normalized, item, index, nestedIndex)} {`);
        lines.push(
          `  grid-column: ${nestedItem.columnStart} / ${nestedItem.columnEnd};`,
          `  grid-row: ${nestedItem.rowStart} / ${nestedItem.rowEnd};`,
          "}",
          "",
        );
      });
    }
  });

  if (normalized.responsive.enabled) {
    appendResponsiveVariableCss(
      lines,
      normalized,
      normalizeNestedGridsForPlacement(
        materializeBreakpointState(normalized, "tablet"),
      ),
      normalized.responsive.tabletBreakpoint,
    );
    lines.push("");
    appendResponsiveVariableCss(
      lines,
      normalized,
      normalizeNestedGridsForPlacement(
        materializeBreakpointState(normalized, "mobile"),
      ),
      normalized.responsive.mobileBreakpoint,
    );
  }

  return lines.join("\n").trim();
}

function appendResponsiveVariableCss(
  lines: string[],
  desktop: GridGeneratorState,
  layout: GridGeneratorState,
  maxWidth: number,
) {
  const areas = generateTemplateAreas(layout);
  const emitTemplateAreas = canEmitTemplateAreas(layout, areas);
  lines.push(`@media (max-width: ${maxWidth}px) {`);
  lines.push(`  .${desktop.containerClassName} {`);
  customProperties(layout).forEach(([name, value]) =>
    lines.push(`    ${name}: ${value};`),
  );
  lines.push(
    `    justify-items: ${layout.justifyItems};`,
    `    align-items: ${layout.alignItems};`,
    `    justify-content: ${layout.justifyContent};`,
    `    align-content: ${layout.alignContent};`,
    `    grid-auto-flow: ${layout.autoFlow};`,
    `    grid-auto-columns: ${layout.autoColumns};`,
    `    grid-auto-rows: ${layout.autoRows};`,
  );
  if (emitTemplateAreas)
    lines.push(...areas.css.split("\n").map((line) => `    ${line}`));
  lines.push("  }");
  layout.items.forEach((item, index) => {
    lines.push(`  .${itemClass(desktop, item, index)} {`);
    if (emitTemplateAreas)
      lines.push(`    grid-area: ${item.areaName};`);
    else
      lines.push(
        `    grid-column: ${item.columnStart} / ${item.columnEnd};`,
        `    grid-row: ${item.rowStart} / ${item.rowEnd};`,
      );
    lines.push("  }");
    if (item.nestedGrid) {
      item.nestedGrid.items.forEach((nestedItem, nestedIndex) => {
        lines.push(`  .${nestedItemClass(desktop, item, index, nestedIndex)} {`);
        lines.push(
          `    grid-column: ${nestedItem.columnStart} / ${nestedItem.columnEnd};`,
          `    grid-row: ${nestedItem.rowStart} / ${nestedItem.rowEnd};`,
          "  }",
        );
      });
    }
  });
  lines.push("}");
}

export function generateGridHtml(state: GridGeneratorState): string {
  const normalized = normalizeGridState(state);
  const children = normalized.items
    .map((item, index) => {
      const className = `grid-item ${itemClass(normalized, item, index)}`;
      if (!item.nestedGrid) {
        return `  <article class="${className}">${escapeHtml(item.content)}</article>`;
      }
      const nestedChildren = item.nestedGrid.items
        .map(
          (nestedItem, nestedIndex) =>
            `    <div class="grid-nested-item ${nestedItemClass(normalized, item, index, nestedIndex)}">${escapeHtml(nestedItem.content)}</div>`,
        )
        .join("\n");
      return `  <article class="${className}">\n${nestedChildren}\n  </article>`;
    })
    .join("\n");
  return `<section class="${normalized.containerClassName}">\n${children}\n</section>`;
}

export function generateGridJsx(state: GridGeneratorState): string {
  const normalized = normalizeGridState(state);
  const children = normalized.items
    .map((item, index) => {
      const className = `grid-item ${itemClass(normalized, item, index)}`;
      if (!item.nestedGrid) {
        return `      <article className="${className}">${escapeHtml(item.content)}</article>`;
      }
      const nestedChildren = item.nestedGrid.items
        .map(
          (nestedItem, nestedIndex) =>
            `        <div className="grid-nested-item ${nestedItemClass(normalized, item, index, nestedIndex)}">${escapeHtml(nestedItem.content)}</div>`,
        )
        .join("\n");
      return `      <article className="${className}">\n${nestedChildren}\n      </article>`;
    })
    .join("\n");
  return `export function GridLayout() {\n  return (\n    <section className="${normalized.containerClassName}">\n${children}\n    </section>\n  );\n}`;
}

function tailwindArbitraryValue(value: string): string {
  return value
    .trim()
    .replace(/\s*,\s*/g, ",")
    .replace(/\s*\/\s*/g, "_/_")
    .replace(/\s+/g, "_");
}

function tailwindLayoutClasses(
  layout: GridGeneratorState,
  prefix = "",
): string[] {
  return [
    `${prefix}grid-cols-[${tailwindArbitraryValue(layout.columnTemplate)}]`,
    `${prefix}grid-rows-[${tailwindArbitraryValue(layout.rowTemplate)}]`,
    `${prefix}gap-y-[${layout.gap.row}${layout.gap.unit}]`,
    `${prefix}gap-x-[${layout.gap.column}${layout.gap.unit}]`,
    `${prefix}[grid-auto-flow:${tailwindArbitraryValue(layout.autoFlow)}]`,
    `${prefix}auto-cols-[${tailwindArbitraryValue(layout.autoColumns)}]`,
    `${prefix}auto-rows-[${tailwindArbitraryValue(layout.autoRows)}]`,
  ];
}


function tailwindNestedLayoutClasses(nested: GridNestedGrid): string[] {
  return [
    "grid",
    `[grid-template-columns:${tailwindArbitraryValue(nested.columnMode === "subgrid" ? "subgrid" : nested.columnTemplate)}]`,
    `[grid-template-rows:${tailwindArbitraryValue(nested.rowMode === "subgrid" ? "subgrid" : nested.rowTemplate)}]`,
    `gap-y-[${nested.gap.row}${nested.gap.unit}]`,
    `gap-x-[${nested.gap.column}${nested.gap.unit}]`,
  ];
}

function tailwindPlacementClasses(
  item: Pick<GridItem, "columnStart" | "columnEnd" | "rowStart" | "rowEnd">,
  prefix = "",
): string[] {
  return [
    `${prefix}[grid-column:${item.columnStart}_/_${item.columnEnd}]`,
    `${prefix}[grid-row:${item.rowStart}_/_${item.rowEnd}]`,
  ];
}

export function generateTailwindStarter(state: GridGeneratorState): string {
  const normalized = normalizeGridState(state);
  const tablet = normalizeNestedGridsForPlacement(
    materializeBreakpointState(normalized, "tablet"),
  );
  const mobile = normalizeNestedGridsForPlacement(
    materializeBreakpointState(normalized, "mobile"),
  );
  const tabletPrefix = `max-[${normalized.responsive.tabletBreakpoint}px]:`;
  const mobilePrefix = `max-[${normalized.responsive.mobileBreakpoint}px]:`;
  const containerClasses = [
    "grid",
    ...tailwindLayoutClasses(normalized),
    ...(normalized.responsive.enabled
      ? [
          ...tailwindLayoutClasses(tablet, tabletPrefix),
          ...tailwindLayoutClasses(mobile, mobilePrefix),
        ]
      : []),
  ];

  const children = normalized.items
    .map((item, index) => {
      const tabletItem = tablet.items[index] ?? item;
      const mobileItem = mobile.items[index] ?? item;
      const classes = [
        ...tailwindPlacementClasses(item),
        ...(normalized.responsive.enabled
          ? [
              ...tailwindPlacementClasses(tabletItem, tabletPrefix),
              ...tailwindPlacementClasses(mobileItem, mobilePrefix),
            ]
          : []),
        ...(item.nestedGrid ? tailwindNestedLayoutClasses(item.nestedGrid) : []),
        "rounded-2xl",
        "p-4",
      ].join(" ");

      if (!item.nestedGrid) {
        return `  <div className="${classes}">${escapeHtml(item.content)}</div>`;
      }

      const nestedChildren = item.nestedGrid.items
        .map((nestedItem, nestedIndex) => {
          const tabletNested = tabletItem.nestedGrid?.items[nestedIndex] ?? nestedItem;
          const mobileNested = mobileItem.nestedGrid?.items[nestedIndex] ?? nestedItem;
          const nestedClasses = [
            ...tailwindPlacementClasses(nestedItem),
            ...(normalized.responsive.enabled
              ? [
                  ...tailwindPlacementClasses(tabletNested, tabletPrefix),
                  ...tailwindPlacementClasses(mobileNested, mobilePrefix),
                ]
              : []),
            "rounded-xl",
            "p-3",
          ].join(" ");
          return `    <div className="${nestedClasses}">${escapeHtml(nestedItem.content)}</div>`;
        })
        .join("\n");

      return `  <div className="${classes}">\n${nestedChildren}\n  </div>`;
    })
    .join("\n");

  return `<div className="${containerClasses.join(" ")}">\n${children}\n</div>`;
}

export function generateGridTokenJson(state: GridGeneratorState): string {
  const normalized = normalizeGridState(state);
  const areas = generateTemplateAreas(normalized);
  const emitTemplateAreas = canEmitTemplateAreas(normalized, areas);
  return JSON.stringify(
    {
      name: normalized.containerClassName,
      columns: normalized.columns,
      rows: normalized.rows,
      templates: {
        columns: normalized.columnTemplate,
        rows: normalized.rowTemplate,
        areas: emitTemplateAreas ? areas.matrix.map((row) => row.join(" ")) : null,
      },
      gap: {
        row: `${normalized.gap.row}${normalized.gap.unit}`,
        column: `${normalized.gap.column}${normalized.gap.unit}`,
      },
      autoPlacement: {
        flow: normalized.autoFlow,
        columns: normalized.autoColumns,
        rows: normalized.autoRows,
      },
      responsive: normalized.responsive,
      items: normalized.items.map((item, index) => ({
        name: item.name,
        className: itemClass(normalized, item, index),
        areaName: item.areaName,
        placement: {
          column: `${item.columnStart} / ${item.columnEnd}`,
          row: `${item.rowStart} / ${item.rowEnd}`,
        },
        style: {
          background: item.background,
          color: item.textColor,
          borderRadius: `${item.borderRadius}px`,
          padding: item.padding,
        },
        nestedGrid: item.nestedGrid
          ? {
              columns: item.nestedGrid.columns,
              rows: item.nestedGrid.rows,
              columnMode: item.nestedGrid.columnMode,
              rowMode: item.nestedGrid.rowMode,
              columnTemplate: item.nestedGrid.columnTemplate,
              rowTemplate: item.nestedGrid.rowTemplate,
              gap: item.nestedGrid.gap,
              items: item.nestedGrid.items,
            }
          : null,
      })),
    },
    null,
    2,
  );
}

export function generateGridAreaMap(state: GridGeneratorState): string {
  const normalized = normalizeGridState(state);
  const areas = generateTemplateAreas(normalized);
  const rows = areas.matrix
    .map((row, index) => `row ${index + 1}: ${row.join("  ")}`)
    .join("\n");
  return `Grid area map\n${"=".repeat(13)}\n${rows}\n\nItems\n${"=".repeat(5)}\n${normalized.items
    .map((item) => `${item.name}: columns ${item.columnStart}-${item.columnEnd}, rows ${item.rowStart}-${item.rowEnd}, area ${item.areaName}`)
    .join("\n")}`;
}

export function detectOverlaps(
  items: Array<Pick<GridItem, "id" | "name" | "columnStart" | "columnEnd" | "rowStart" | "rowEnd">>,
): GridValidationMessage[] {
  const messages: GridValidationMessage[] = [];
  for (let first = 0; first < items.length; first += 1) {
    for (let second = first + 1; second < items.length; second += 1) {
      const a = items[first];
      const b = items[second];
      const overlaps =
        a.columnStart < b.columnEnd &&
        a.columnEnd > b.columnStart &&
        a.rowStart < b.rowEnd &&
        a.rowEnd > b.rowStart;
      if (overlaps)
        messages.push({
          type: "warning",
          message: `${a.name} overlaps ${b.name}.`,
          itemId: a.id,
        });
    }
  }
  return messages;
}

export function validateGridState(
  state: GridGeneratorState,
): GridValidationMessage[] {
  const normalized = normalizeGridState(state);
  const messages: GridValidationMessage[] = [];
  normalized.items.forEach((item) => {
    if (!CSS_IDENTIFIER.test(item.areaName))
      messages.push({
        type: "warning",
        message: `${item.name} area name should be a valid CSS identifier.`,
        itemId: item.id,
      });
    if (item.columnEnd <= item.columnStart || item.rowEnd <= item.rowStart)
      messages.push({
        type: "error",
        message: `${item.name} needs valid start and end lines.`,
        itemId: item.id,
      });
    if (item.nestedGrid) {
      if (!item.nestedGrid.items.length) {
        messages.push({
          type: "info",
          message: `${item.name} is a nested grid with no child items yet.`,
          itemId: item.id,
        });
      }
      if (item.nestedGrid.columnMode === "independent") {
        const nestedColumns = expandFixedTrackTemplate(
          item.nestedGrid.columnTemplate,
          item.nestedGrid.columns,
          "1fr",
        );
        if (!nestedColumns.editable && nestedColumns.reason?.includes("resolves to"))
          messages.push({
            type: "warning",
            message: `${item.name} nested column template mismatch: ${nestedColumns.reason}`,
            itemId: item.id,
          });
      }
      if (item.nestedGrid.rowMode === "independent") {
        const nestedRows = expandFixedTrackTemplate(
          item.nestedGrid.rowTemplate,
          item.nestedGrid.rows,
          "minmax(64px, auto)",
        );
        if (!nestedRows.editable && nestedRows.reason?.includes("resolves to"))
          messages.push({
            type: "warning",
            message: `${item.name} nested row template mismatch: ${nestedRows.reason}`,
            itemId: item.id,
          });
      }
      if (item.nestedGrid.columnMode === "subgrid" || item.nestedGrid.rowMode === "subgrid")
        messages.push({
          type: "info",
          message: `${item.name} uses subgrid on ${
            item.nestedGrid.columnMode === "subgrid" && item.nestedGrid.rowMode === "subgrid"
              ? "both axes"
              : item.nestedGrid.columnMode === "subgrid"
                ? "columns"
                : "rows"
          }, inheriting those parent tracks.`,
          itemId: item.id,
        });
      messages.push(...detectOverlaps(item.nestedGrid.items));
    }
  });
  if (normalized.items.length > normalized.columns * normalized.rows)
    messages.push({
      type: "warning",
      message: "There are more items than visible grid cells. Check overlap and mobile behavior.",
    });
  if (normalized.columns > 8 || normalized.rows > 8)
    messages.push({
      type: "info",
      message: "Large grids can be harder to read on small screens.",
    });
  const parsedColumns = expandFixedTrackTemplate(
    normalized.columnTemplate,
    normalized.columns,
    "1fr",
  );
  if (!parsedColumns.editable && parsedColumns.reason?.includes("resolves to"))
    messages.push({
      type: "warning",
      message: `Column template mismatch: ${parsedColumns.reason}`,
    });
  if (parsedColumns.editable) {
    const fixedPixels = parsedColumns.tracks.reduce((total, track) => {
      const match = track.match(/^(-?(?:\d+\.?\d*|\.\d+))px$/i);
      return total + (match ? Number(match[1]) : 0);
    }, 0);
    const gapPixels =
      normalized.gap.unit === "px"
        ? Math.max(0, normalized.columns - 1) * normalized.gap.column
        : 0;
    if (fixedPixels + gapPixels > normalized.previewWidth)
      messages.push({
        type: "warning",
        message: `Fixed column tracks need at least ${Math.round(fixedPixels + gapPixels)}px before flexible content, which exceeds the ${normalized.previewWidth}px preview.`,
      });
  }
  if (!normalized.columnTemplate.includes("minmax") && normalized.columnTemplate.includes("fr"))
    messages.push({
      type: "info",
      message: "Consider minmax(0, 1fr) tracks to reduce unexpected overflow.",
    });
  const areaNames = new Map<string, number>();
  normalized.items.forEach((item) =>
    areaNames.set(item.areaName, (areaNames.get(item.areaName) ?? 0) + 1),
  );
  if (normalized.useTemplateAreas) {
    for (const [areaName, count] of areaNames) {
      if (areaName && count > 1)
        messages.push({
          type: "error",
          message: `Area name ${areaName} is used by ${count} items. Named areas must be unique per item.`,
        });
    }
    const areas = generateTemplateAreas(normalized);
    if (!canEmitTemplateAreas(normalized, areas))
      messages.push({
        type: "warning",
        message:
          "Named-area export is not valid for the current layout, so generated CSS falls back to explicit grid-column/grid-row placement until the area issues are fixed.",
      });
  }
  if (normalized.autoFlow.includes("dense"))
    messages.push({
      type: "warning",
      message:
        "Dense auto-placement can change the visual order from the DOM order. Check keyboard and screen-reader reading order.",
    });
  if (normalized.autoColumns !== "auto" || normalized.autoRows !== "auto")
    messages.push({
      type: "info",
      message:
        "Implicit track sizing is active. Items placed outside the explicit grid can create additional tracks.",
    });
  return [
    ...messages,
    ...detectOverlaps(normalized.items),
    ...generateTemplateAreas(normalized).warnings.map((message) => ({
      type: "warning" as const,
      message,
    })),
  ];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
