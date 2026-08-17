import { clampItemToGrid, createGridItem, normalizeGridState } from "./grid";
import { splitGridTrackList } from "./tracks";
import type {
  GridAlignment,
  GridAutoFlow,
  GridBreakpointLayout,
  GridGeneratorState,
  GridItem,
  GridSelfAlignment,
} from "./types";

type CssBlock = { prelude: string; body: string };
type Declarations = Record<string, string>;

export type GridCssImportResult = {
  state: GridGeneratorState;
  warnings: string[];
  importedRules: number;
};

const SELF_ALIGNMENTS = new Set<GridSelfAlignment>([
  "auto",
  "stretch",
  "start",
  "center",
  "end",
]);
const CONTENT_ALIGNMENTS = new Set<GridAlignment>([
  "stretch",
  "start",
  "center",
  "end",
  "space-between",
  "space-around",
  "space-evenly",
]);
const AUTO_FLOWS = new Set<GridAutoFlow>([
  "row",
  "column",
  "row dense",
  "column dense",
]);

function stripComments(css: string) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function readBlocks(css: string): CssBlock[] {
  const blocks: CssBlock[] = [];
  let start = 0;
  let quote: "\"" | "'" | null = null;

  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    if (quote) {
      if (char === quote && css[index - 1] !== "\\") quote = null;
      continue;
    }
    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }
    if (char !== "{") continue;

    const prelude = css.slice(start, index).trim();
    let depth = 1;
    let innerQuote: "\"" | "'" | null = null;
    let cursor = index + 1;
    for (; cursor < css.length; cursor += 1) {
      const inner = css[cursor];
      if (innerQuote) {
        if (inner === innerQuote && css[cursor - 1] !== "\\") innerQuote = null;
        continue;
      }
      if (inner === "\"" || inner === "'") {
        innerQuote = inner;
        continue;
      }
      if (inner === "{") depth += 1;
      if (inner === "}") depth -= 1;
      if (depth === 0) break;
    }
    if (depth !== 0) break;
    blocks.push({ prelude, body: css.slice(index + 1, cursor) });
    start = cursor + 1;
    index = cursor;
  }
  return blocks;
}

function splitDeclarations(body: string): string[] {
  const result: string[] = [];
  let current = "";
  let parentheses = 0;
  let quote: "\"" | "'" | null = null;

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if (quote) {
      current += char;
      if (char === quote && body[index - 1] !== "\\") quote = null;
      continue;
    }
    if (char === "\"" || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "(") parentheses += 1;
    if (char === ")") parentheses = Math.max(0, parentheses - 1);
    if (char === ";" && parentheses === 0) {
      if (current.trim()) result.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function parseDeclarations(body: string): Declarations {
  const declarations: Declarations = {};
  for (const declaration of splitDeclarations(body)) {
    const colon = declaration.indexOf(":");
    if (colon <= 0) continue;
    const property = declaration.slice(0, colon).trim().toLowerCase();
    const value = declaration.slice(colon + 1).trim().replace(/\s*!important\s*$/i, "");
    if (property && value) declarations[property] = value;
  }
  return declarations;
}

function inferTrackCount(template: string, fallback: number): number {
  const tokens = splitGridTrackList(template);
  let count = 0;
  for (const token of tokens) {
    const repeat = token.match(/^repeat\(\s*(\d+)\s*,([\s\S]+)\)$/i);
    if (repeat) {
      const inner = splitGridTrackList(repeat[2]);
      count += Number.parseInt(repeat[1], 10) * Math.max(1, inner.length);
      continue;
    }
    if (/^repeat\(\s*(auto-fit|auto-fill)\s*,/i.test(token)) return fallback;
    if (token.startsWith("[") && token.endsWith("]")) continue;
    count += 1;
  }
  return count || fallback;
}

function parseGap(value: string | undefined, fallback: GridGeneratorState["gap"]) {
  if (!value) return { ...fallback };
  const parts = splitGridTrackList(value);
  const read = (token: string | undefined) => {
    const match = token?.match(/^(-?(?:\d+\.?\d*|\.\d+))(px|rem)$/i);
    return match ? { value: Number(match[1]), unit: match[2].toLowerCase() as "px" | "rem" } : null;
  };
  const first = read(parts[0]);
  const second = read(parts[1] ?? parts[0]);
  if (!first || !second || first.unit !== second.unit) return { ...fallback };
  return { row: first.value, column: second.value, unit: first.unit };
}

function parseLineRange(value: string | undefined): [number, number] | null {
  if (!value) return null;
  const parts = value.split("/").map((part) => part.trim());
  if (parts.length !== 2) return null;
  const start = Number.parseInt(parts[0], 10);
  const end = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return [start, end];
}

function classNameFromSelector(selector: string): string | null {
  const match = selector.trim().match(/^\.([_a-zA-Z]+[_a-zA-Z0-9-]*)$/);
  return match?.[1] ?? null;
}

function pickContainerRule(blocks: CssBlock[]) {
  return blocks.find((block) => {
    if (block.prelude.startsWith("@")) return false;
    const declarations = parseDeclarations(block.body);
    return (
      declarations.display === "grid" ||
      Boolean(declarations["grid-template-columns"]) ||
      Boolean(declarations["grid-template-rows"])
    );
  });
}

function readAlignment<T extends string>(
  value: string | undefined,
  allowed: Set<T>,
  fallback: T,
): T {
  return value && allowed.has(value as T) ? (value as T) : fallback;
}

function readAutoFlow(value: string | undefined, fallback: GridAutoFlow): GridAutoFlow {
  const normalized = value?.trim().replace(/\s+/g, " ") as GridAutoFlow | undefined;
  return normalized && AUTO_FLOWS.has(normalized) ? normalized : fallback;
}

function areaPlacements(templateAreas: string | undefined) {
  const placements = new Map<string, { columnStart: number; columnEnd: number; rowStart: number; rowEnd: number }>();
  if (!templateAreas) return placements;
  const rows = [...templateAreas.matchAll(/["']([^"']+)["']/g)].map((match) =>
    match[1].trim().split(/\s+/),
  );
  rows.forEach((row, rowIndex) => {
    row.forEach((name, columnIndex) => {
      if (!name || name === ".") return;
      const current = placements.get(name) ?? {
        columnStart: columnIndex + 1,
        columnEnd: columnIndex + 2,
        rowStart: rowIndex + 1,
        rowEnd: rowIndex + 2,
      };
      current.columnStart = Math.min(current.columnStart, columnIndex + 1);
      current.columnEnd = Math.max(current.columnEnd, columnIndex + 2);
      current.rowStart = Math.min(current.rowStart, rowIndex + 1);
      current.rowEnd = Math.max(current.rowEnd, rowIndex + 2);
      placements.set(name, current);
    });
  });
  return placements;
}

function applyContainerDeclarations(
  state: GridGeneratorState,
  declarations: Declarations,
): GridGeneratorState {
  const columnTemplate = declarations["grid-template-columns"] ?? state.columnTemplate;
  const rowTemplate = declarations["grid-template-rows"] ?? state.rowTemplate;
  const gap = parseGap(
    declarations.gap,
    parseGap(
      `${declarations["row-gap"] ?? `${state.gap.row}${state.gap.unit}`} ${declarations["column-gap"] ?? `${state.gap.column}${state.gap.unit}`}`,
      state.gap,
    ),
  );
  return {
    ...state,
    columns: inferTrackCount(columnTemplate, state.columns),
    rows: inferTrackCount(rowTemplate, state.rows),
    columnTemplate,
    rowTemplate,
    gap,
    useTemplateAreas: Boolean(declarations["grid-template-areas"]),
    justifyItems: readAlignment(declarations["justify-items"], SELF_ALIGNMENTS, state.justifyItems),
    alignItems: readAlignment(declarations["align-items"], SELF_ALIGNMENTS, state.alignItems),
    justifyContent: readAlignment(declarations["justify-content"], CONTENT_ALIGNMENTS, state.justifyContent),
    alignContent: readAlignment(declarations["align-content"], CONTENT_ALIGNMENTS, state.alignContent),
    autoFlow: readAutoFlow(declarations["grid-auto-flow"], state.autoFlow),
    autoColumns: declarations["grid-auto-columns"] ?? state.autoColumns,
    autoRows: declarations["grid-auto-rows"] ?? state.autoRows,
  };
}

function importItems(
  blocks: CssBlock[],
  base: GridGeneratorState,
  containerDeclarations: Declarations,
): { items: GridItem[]; importedRules: number } {
  const areas = areaPlacements(containerDeclarations["grid-template-areas"]);
  const existingByGeneratedClass = new Map(
    base.items.map((item, index) => [
      `${base.itemClassPrefix}-${index + 1}`,
      item,
    ]),
  );
  const existingByAreaName = new Map(
    base.items.map((item) => [item.areaName, item]),
  );
  const candidates = blocks
    .filter((block) => !block.prelude.startsWith("@"))
    .map((block) => ({ block, declarations: parseDeclarations(block.body) }))
    .filter(({ declarations }) =>
      Boolean(declarations["grid-column"] || declarations["grid-row"] || declarations["grid-area"]),
    );
  if (!candidates.length) return { items: base.items, importedRules: 0 };

  const items = candidates.slice(0, 24).map(({ block, declarations }, index) => {
    const selectorClass = classNameFromSelector(block.prelude);
    const declaredArea = declarations["grid-area"];
    const existing =
      (selectorClass ? existingByGeneratedClass.get(selectorClass) : undefined) ??
      (declaredArea ? existingByAreaName.get(declaredArea) : undefined);
    const areaName =
      declaredArea ?? selectorClass ?? existing?.areaName ?? `item${index + 1}`;
    const areaPlacement = areas.get(areaName);
    const columns = parseLineRange(declarations["grid-column"]);
    const rows = parseLineRange(declarations["grid-row"]);
    const name = existing?.name ?? selectorClass ?? `Item ${index + 1}`;
    return createGridItem({
      ...(existing ?? {}),
      id: existing?.id ?? `imported-${index + 1}`,
      name,
      areaName,
      columnStart: columns?.[0] ?? areaPlacement?.columnStart ?? existing?.columnStart ?? 1,
      columnEnd: columns?.[1] ?? areaPlacement?.columnEnd ?? existing?.columnEnd ?? 2,
      rowStart: rows?.[0] ?? areaPlacement?.rowStart ?? existing?.rowStart ?? 1,
      rowEnd: rows?.[1] ?? areaPlacement?.rowEnd ?? existing?.rowEnd ?? 2,
      content: existing?.content ?? name,
    });
  });
  return {
    items: items.map((item) => clampItemToGrid(item, base.columns, base.rows)),
    importedRules: items.length,
  };
}

function buildBreakpointLayout(
  desktop: GridGeneratorState,
  body: string,
): GridBreakpointLayout | null {
  const blocks = readBlocks(body);
  const container = pickContainerRule(blocks);
  if (!container) return null;
  const declarations = parseDeclarations(container.body);
  const breakpointState = applyContainerDeclarations(desktop, declarations);
  const importedItems = importItems(blocks, breakpointState, declarations);
  const items = importedItems.items.length ? importedItems.items : breakpointState.items;
  return {
    columns: breakpointState.columns,
    rows: breakpointState.rows,
    columnTemplate: breakpointState.columnTemplate,
    rowTemplate: breakpointState.rowTemplate,
    gap: breakpointState.gap,
    useTemplateAreas: breakpointState.useTemplateAreas,
    justifyItems: breakpointState.justifyItems,
    alignItems: breakpointState.alignItems,
    justifyContent: breakpointState.justifyContent,
    alignContent: breakpointState.alignContent,
    autoFlow: breakpointState.autoFlow,
    autoColumns: breakpointState.autoColumns,
    autoRows: breakpointState.autoRows,
    placements: Object.fromEntries(
      items.map((item) => [item.id, {
        columnStart: item.columnStart,
        columnEnd: item.columnEnd,
        rowStart: item.rowStart,
        rowEnd: item.rowEnd,
      }]),
    ),
  };
}

export function importGridCss(css: string, current: GridGeneratorState): GridCssImportResult {
  const source = stripComments(css).trim();
  if (!source) throw new Error("Paste CSS containing a grid container first.");
  if (source.length > 100_000) throw new Error("CSS import is limited to 100 KB.");

  const blocks = readBlocks(source);
  const container = pickContainerRule(blocks);
  if (!container) {
    throw new Error("No CSS rule with display: grid or a grid-template declaration was found.");
  }

  const warnings: string[] = [];
  const containerDeclarations = parseDeclarations(container.body);
  let desktop = applyContainerDeclarations(normalizeGridState(current), containerDeclarations);
  const containerClassName = classNameFromSelector(container.prelude);
  if (containerClassName) desktop = { ...desktop, containerClassName };
  else warnings.push("The grid container selector is not a single class, so the existing container class was kept.");

  const imported = importItems(blocks, desktop, containerDeclarations);
  desktop = normalizeGridState({
    ...desktop,
    items: imported.items.map((item) => clampItemToGrid(item, desktop.columns, desktop.rows)),
    selectedItemId: imported.items[0]?.id ?? desktop.selectedItemId,
  });

  const media = blocks
    .filter((block) => /^@media\b/i.test(block.prelude))
    .map((block) => {
      const maxWidth = block.prelude.match(/max-width\s*:\s*(\d+(?:\.\d+)?)px/i);
      if (!maxWidth) return null;
      const layout = buildBreakpointLayout(desktop, block.body);
      return layout
        ? { maxWidth: Number(maxWidth[1]), layout }
        : null;
    })
    .filter(
      (entry): entry is { maxWidth: number; layout: GridBreakpointLayout } =>
        Boolean(entry),
    )
    .sort((a, b) => b.maxWidth - a.maxWidth);

  if (media.length) {
    const tablet = media[0];
    const mobile = media.find((entry) => entry.maxWidth < tablet.maxWidth);
    desktop = normalizeGridState({
      ...desktop,
      responsive: {
        ...desktop.responsive,
        enabled: true,
        tabletBreakpoint: tablet.maxWidth,
        mobileBreakpoint: mobile?.maxWidth ?? desktop.responsive.mobileBreakpoint,
        tabletLayout: tablet.layout,
        mobileLayout: mobile?.layout ?? desktop.responsive.mobileLayout,
      },
    });
    if (media.length > 2) warnings.push("Only the two largest distinct max-width Grid breakpoints were imported.");
  }

  if (!imported.importedRules) {
    warnings.push("Container settings were imported, but no simple item grid-column/grid-row/grid-area rules were found.");
  }
  if (/repeat\(\s*(auto-fit|auto-fill)\s*,/i.test(desktop.columnTemplate)) {
    warnings.push("Dynamic auto-fit/auto-fill was preserved as raw CSS; the canvas keeps its current explicit column count.");
  }

  return { state: desktop, warnings, importedRules: imported.importedRules };
}
