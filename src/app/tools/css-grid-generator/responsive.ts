import type {
  GridBreakpoint,
  GridBreakpointLayout,
  GridGeneratorState,
  GridItem,
  GridItemPlacement,
} from "./types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const MAX_COLUMNS = 12;
const MAX_ROWS = 24;

function placementOf(item: GridItem): GridItemPlacement {
  return {
    columnStart: item.columnStart,
    columnEnd: item.columnEnd,
    rowStart: item.rowStart,
    rowEnd: item.rowEnd,
  };
}

function clampPlacement(
  placement: GridItemPlacement,
  columns: number,
  rows: number,
): GridItemPlacement {
  const columnStart = clamp(Math.round(placement.columnStart || 1), 1, columns);
  const rowStart = clamp(Math.round(placement.rowStart || 1), 1, rows);
  return {
    columnStart,
    columnEnd: clamp(
      Math.round(placement.columnEnd || columnStart + 1),
      columnStart + 1,
      columns + 1,
    ),
    rowStart,
    rowEnd: clamp(
      Math.round(placement.rowEnd || rowStart + 1),
      rowStart + 1,
      rows + 1,
    ),
  };
}

export function extractBreakpointLayout(
  state: GridGeneratorState,
): GridBreakpointLayout {
  return {
    columns: state.columns,
    rows: state.rows,
    columnTemplate: state.columnTemplate,
    rowTemplate: state.rowTemplate,
    gap: { ...state.gap },
    useTemplateAreas: state.useTemplateAreas,
    justifyItems: state.justifyItems,
    alignItems: state.alignItems,
    justifyContent: state.justifyContent,
    alignContent: state.alignContent,
    autoFlow: state.autoFlow,
    autoColumns: state.autoColumns,
    autoRows: state.autoRows,
    placements: Object.fromEntries(
      state.items.map((item) => [item.id, placementOf(item)]),
    ),
  };
}

export function normalizeBreakpointLayout(
  layout: GridBreakpointLayout,
  state: GridGeneratorState,
): GridBreakpointLayout {
  const columns = clamp(Math.round(layout.columns || 1), 1, MAX_COLUMNS);
  const rows = clamp(Math.round(layout.rows || 1), 1, MAX_ROWS);
  const itemIds = new Set(state.items.map((item) => item.id));
  const placements = Object.fromEntries(
    state.items.map((item) => {
      const placement = layout.placements[item.id] ?? placementOf(item);
      return [item.id, clampPlacement(placement, columns, rows)];
    }),
  );

  Object.keys(placements).forEach((id) => {
    if (!itemIds.has(id)) delete placements[id];
  });

  return {
    ...layout,
    columns,
    rows,
    columnTemplate:
      layout.columnTemplate.trim() || `repeat(${columns}, minmax(0, 1fr))`,
    rowTemplate:
      layout.rowTemplate.trim() || `repeat(${rows}, minmax(96px, auto))`,
    autoFlow: layout.autoFlow ?? state.autoFlow ?? "row",
    autoColumns: layout.autoColumns?.trim() || state.autoColumns?.trim() || "auto",
    autoRows: layout.autoRows?.trim() || state.autoRows?.trim() || "auto",
    gap: {
      row: clamp(
        Number(layout.gap.row) || 0,
        0,
        layout.gap.unit === "px" ? 96 : 6,
      ),
      column: clamp(
        Number(layout.gap.column) || 0,
        0,
        layout.gap.unit === "px" ? 96 : 6,
      ),
      unit: layout.gap.unit === "px" ? "px" : "rem",
    },
    placements,
  };
}

export function createAutoLayout(
  state: GridGeneratorState,
  columns: number,
): GridBreakpointLayout {
  const safeColumns = clamp(Math.round(columns || 1), 1, MAX_COLUMNS);
  const rows = clamp(
    Math.max(1, Math.ceil(state.items.length / safeColumns)),
    1,
    MAX_ROWS,
  );
  const placements: Record<string, GridItemPlacement> = {};

  state.items.forEach((item, index) => {
    const columnStart = (index % safeColumns) + 1;
    const rowStart = Math.floor(index / safeColumns) + 1;
    placements[item.id] = {
      columnStart,
      columnEnd: columnStart + 1,
      rowStart,
      rowEnd: rowStart + 1,
    };
  });

  return {
    columns: safeColumns,
    rows,
    columnTemplate: `repeat(${safeColumns}, minmax(0, 1fr))`,
    rowTemplate: `repeat(${rows}, minmax(120px, auto))`,
    gap: { ...state.gap },
    useTemplateAreas: false,
    justifyItems: state.justifyItems,
    alignItems: state.alignItems,
    justifyContent: state.justifyContent,
    alignContent: state.alignContent,
    autoFlow: state.autoFlow,
    autoColumns: state.autoColumns,
    autoRows: state.autoRows,
    placements,
  };
}

export function createLegacyTabletLayout(
  state: GridGeneratorState,
): GridBreakpointLayout {
  return createAutoLayout(
    state,
    Math.min(state.columns, Math.max(1, state.responsive.tabletColumns || 2)),
  );
}

export function createLegacyMobileLayout(
  state: GridGeneratorState,
): GridBreakpointLayout {
  if (state.responsive.mobileBehavior === "preserve") {
    return extractBreakpointLayout(state);
  }
  return createAutoLayout(
    state,
    state.responsive.mobileBehavior === "two-column" ? 2 : 1,
  );
}

export function materializeBreakpointState(
  state: GridGeneratorState,
  breakpoint: GridBreakpoint,
): GridGeneratorState {
  if (breakpoint === "desktop") return state;
  const layout =
    breakpoint === "tablet"
      ? state.responsive.tabletLayout
      : state.responsive.mobileLayout;
  if (!layout) return state;

  const normalizedLayout = normalizeBreakpointLayout(layout, state);
  return {
    ...state,
    columns: normalizedLayout.columns,
    rows: normalizedLayout.rows,
    columnTemplate: normalizedLayout.columnTemplate,
    rowTemplate: normalizedLayout.rowTemplate,
    gap: { ...normalizedLayout.gap },
    useTemplateAreas: normalizedLayout.useTemplateAreas,
    justifyItems: normalizedLayout.justifyItems,
    alignItems: normalizedLayout.alignItems,
    justifyContent: normalizedLayout.justifyContent,
    alignContent: normalizedLayout.alignContent,
    autoFlow: normalizedLayout.autoFlow,
    autoColumns: normalizedLayout.autoColumns,
    autoRows: normalizedLayout.autoRows,
    items: state.items.map((item) => ({
      ...item,
      ...(normalizedLayout.placements[item.id] ?? placementOf(item)),
    })),
  };
}

const METADATA_KEYS = [
  "name",
  "areaName",
  "background",
  "textColor",
  "borderRadius",
  "padding",
  "content",
  "justifySelf",
  "alignSelf",
] as const;

function mergeItemMetadata(
  desktopItem: GridItem | undefined,
  activeItem: GridItem,
): GridItem {
  if (!desktopItem) return activeItem;
  const next = { ...desktopItem };
  for (const key of METADATA_KEYS) {
    (next[key] as GridItem[typeof key]) = activeItem[key] as GridItem[typeof key];
  }
  return next;
}

export function mergeBreakpointState(
  base: GridGeneratorState,
  breakpoint: GridBreakpoint,
  active: GridGeneratorState,
): GridGeneratorState {
  if (breakpoint === "desktop") return active;

  const desktopById = new Map(base.items.map((item) => [item.id, item]));
  const items = active.items.map((item) => {
    const merged = mergeItemMetadata(desktopById.get(item.id), item);
    if (desktopById.has(item.id)) return merged;
    return clampDesktopPlacement(merged, base.columns, base.rows);
  });

  const activeLayout = normalizeBreakpointLayout(
    extractBreakpointLayout(active),
    { ...base, items },
  );
  const responsive = {
    ...base.responsive,
    tabletLayout:
      breakpoint === "tablet" ? activeLayout : base.responsive.tabletLayout,
    mobileLayout:
      breakpoint === "mobile" ? activeLayout : base.responsive.mobileLayout,
  };

  return {
    ...base,
    containerClassName: active.containerClassName,
    itemClassPrefix: active.itemClassPrefix,
    includeDemoStyles: active.includeDemoStyles,
    showGridLines: active.showGridLines,
    showLineNumbers: active.showLineNumbers,
    showAreaNames: active.showAreaNames,
    previewWidth: active.previewWidth,
    selectedItemId: active.selectedItemId,
    responsive,
    items,
  };
}

function clampDesktopPlacement(
  item: GridItem,
  columns: number,
  rows: number,
): GridItem {
  return { ...item, ...clampPlacement(placementOf(item), columns, rows) };
}

export function replaceBreakpointLayout(
  state: GridGeneratorState,
  breakpoint: Exclude<GridBreakpoint, "desktop">,
  source: GridBreakpointLayout,
): GridGeneratorState {
  const layout = normalizeBreakpointLayout(source, state);
  return {
    ...state,
    responsive: {
      ...state.responsive,
      tabletLayout:
        breakpoint === "tablet" ? layout : state.responsive.tabletLayout,
      mobileLayout:
        breakpoint === "mobile" ? layout : state.responsive.mobileLayout,
    },
  };
}

export function getSuggestedPreviewWidth(
  state: GridGeneratorState,
  breakpoint: GridBreakpoint,
): number {
  if (breakpoint === "mobile") {
    return Math.max(320, Math.min(420, state.responsive.mobileBreakpoint));
  }
  if (breakpoint === "tablet") {
    return Math.max(
      state.responsive.mobileBreakpoint + 1,
      Math.min(820, state.responsive.tabletBreakpoint),
    );
  }
  return Math.max(960, Math.min(1200, state.responsive.tabletBreakpoint + 240));
}

export function getBreakpointLabel(breakpoint: GridBreakpoint): string {
  if (breakpoint === "mobile") return "Mobile";
  if (breakpoint === "tablet") return "Tablet";
  return "Desktop";
}
