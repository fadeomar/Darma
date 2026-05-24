import type {
  GridGeneratorState,
  GridItem,
  GridValidationMessage,
} from "./types";

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
  const rows = clamp(Math.round(state.rows || 1), 1, 12);
  const items = state.items
    .slice(0, 24)
    .map((item) => clampItemToGrid(item, columns, rows));
  return {
    ...state,
    columns,
    rows,
    columnTemplate:
      state.columnTemplate.trim() || `repeat(${columns}, minmax(0, 1fr))`,
    rowTemplate:
      state.rowTemplate.trim() || `repeat(${rows}, minmax(96px, auto))`,
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
    items,
    selectedItemId: items.some((item) => item.id === state.selectedItemId)
      ? state.selectedItemId
      : (items[0]?.id ?? null),
  };
}

const itemClass = (state: GridGeneratorState, item: GridItem, index: number) =>
  `${state.itemClassPrefix}-${index + 1}`;
const gapValue = (state: GridGeneratorState) =>
  `${state.gap.row}${state.gap.unit} ${state.gap.column}${state.gap.unit}`;

export function generateTemplateAreas(state: GridGeneratorState): {
  css: string;
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
    warnings: Array.from(new Set(warnings)),
  };
}

export function generateGridCss(state: GridGeneratorState): string {
  const normalized = normalizeGridState(state);
  const areas = generateTemplateAreas(normalized);
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
  ];
  if (normalized.useTemplateAreas)
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
    if (normalized.useTemplateAreas && CSS_IDENTIFIER.test(item.areaName))
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
    if (normalized.includeDemoStyles)
      lines.push(
        `  background: ${item.background};`,
        `  color: ${item.textColor};`,
        `  border-radius: ${item.borderRadius}px;`,
        `  padding: ${item.padding};`,
      );
    lines.push("}", "");
  });
  if (normalized.responsive.enabled) {
    lines.push(
      `@media (max-width: ${normalized.responsive.tabletBreakpoint}px) {`,
      `  .${normalized.containerClassName} {`,
      `    grid-template-columns: repeat(${normalized.responsive.tabletColumns}, minmax(0, 1fr));`,
      "  }",
      "}",
      "",
    );
    lines.push(
      `@media (max-width: ${normalized.responsive.mobileBreakpoint}px) {`,
      `  .${normalized.containerClassName} {`,
    );
    lines.push(
      normalized.responsive.mobileBehavior === "two-column"
        ? "    grid-template-columns: repeat(2, minmax(0, 1fr));"
        : "    grid-template-columns: 1fr;",
    );
    lines.push("  }");
    if (normalized.responsive.mobileBehavior === "stack")
      lines.push(
        `  .${normalized.containerClassName} > * {`,
        "    grid-column: auto;",
        "    grid-row: auto;",
        "  }",
      );
    lines.push("}");
  }
  return lines.join("\n").trim();
}

export function generateGridHtml(state: GridGeneratorState): string {
  const normalized = normalizeGridState(state);
  const children = normalized.items
    .map(
      (item, index) =>
        `  <article class="grid-item ${itemClass(normalized, item, index)}">${escapeHtml(item.content)}</article>`,
    )
    .join("\n");
  return `<section class="${normalized.containerClassName}">\n${children}\n</section>`;
}

export function generateGridJsx(state: GridGeneratorState): string {
  const normalized = normalizeGridState(state);
  const children = normalized.items
    .map(
      (item, index) =>
        `      <article className="grid-item ${itemClass(normalized, item, index)}">${escapeHtml(item.content)}</article>`,
    )
    .join("\n");
  return `export function GridLayout() {\n  return (\n    <section className="${normalized.containerClassName}">\n${children}\n    </section>\n  );\n}`;
}

export function generateTailwindStarter(state: GridGeneratorState): string {
  const normalized = normalizeGridState(state);
  const gap =
    normalized.gap.unit === "rem"
      ? Math.round(normalized.gap.column * 4)
      : Math.round(normalized.gap.column / 4);
  return `<div className="grid grid-cols-${normalized.columns} gap-${clamp(gap, 0, 24)}">\n${normalized.items
    .map((item) => {
      const colSpan = item.columnEnd - item.columnStart;
      const rowSpan = item.rowEnd - item.rowStart;
      const classes = [
        colSpan > 1 ? `col-span-${colSpan}` : "",
        rowSpan > 1 ? `row-span-${rowSpan}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `  <div${classes ? ` className="${classes}"` : ""}>${escapeHtml(item.content)}</div>`;
    })
    .join("\n")}\n</div>`;
}

export function detectOverlaps(items: GridItem[]): GridValidationMessage[] {
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
  });
  if (normalized.columns > 8 || normalized.rows > 8)
    messages.push({
      type: "info",
      message: "Large grids can be harder to read on small screens.",
    });
  if (
    normalized.responsive.enabled &&
    normalized.responsive.mobileBehavior === "stack"
  )
    messages.push({
      type: "info",
      message:
        "Mobile stack output resets item placement at the mobile breakpoint.",
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
