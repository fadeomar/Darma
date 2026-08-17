import {
  DndContext,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
// Aliased: the bare `CSS` name would shadow the global CSS object, which
// findNestedGridCellAtPoint relies on for CSS.escape.
import { CSS as DndCSS } from "@dnd-kit/utilities";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Button } from "@/components/ui";
import {
  PreviewToolbar,
  SegmentedControl,
  type WarningMessage,
} from "@/features/tools/components";
import { cn } from "@/lib/cn";
import {
  getSelectionPlacement,
  isSameGridItem,
  moveItemByStep,
  resizeItemByStep,
  resizeItemToCell,
  type GridCell,
  type GridResizeEdge,
  type GridSelection,
} from "../editor";
import {
  moveNestedGridItemByStep,
  moveNestedGridItemToCell,
} from "../grid";
import { expandFixedTrackTemplate } from "../tracks";
import type {
  GridBreakpoint,
  GridEditorMode,
  GridGeneratorState,
  GridItem,
  GridNestedItem,
} from "../types";

type ActiveDraw = {
  pointerId: number;
  selection: GridSelection;
};

type ResizeDraft = {
  pointerId: number;
  edge: GridResizeEdge;
  baseItem: GridItem;
  item: GridItem;
};

type NestedMoveDraft = {
  pointerId: number;
  parentId: string;
  baseItem: GridNestedItem;
  item: GridNestedItem;
};

const gridCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length ? pointerCollisions : closestCenter(args);
};

export function GridPreview({
  state,
  messages,
  editorMode,
  activeBreakpoint,
  canUndo,
  canRedo,
  onEditorModeChange,
  onBreakpointChange,
  onPatch,
  onSelectItem,
  onMoveItem,
  onCreateItem,
  onCommitItem,
  onCommitNestedItem,
  onUndo,
  onRedo,
}: {
  state: GridGeneratorState;
  messages: WarningMessage[];
  editorMode: GridEditorMode;
  activeBreakpoint: GridBreakpoint;
  canUndo: boolean;
  canRedo: boolean;
  onEditorModeChange: (mode: GridEditorMode) => void;
  onBreakpointChange: (breakpoint: GridBreakpoint) => void;
  onPatch: (patch: Partial<GridGeneratorState>) => void;
  onSelectItem: (id: string) => void;
  onMoveItem: (id: string, target: GridCell) => void;
  onCreateItem: (selection: GridSelection) => void;
  onCommitItem: (item: GridItem) => void;
  onCommitNestedItem: (parentId: string, item: GridNestedItem) => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDraw, setActiveDraw] = useState<ActiveDraw | null>(null);
  const [resizeDraft, setResizeDraft] = useState<ResizeDraft | null>(null);
  const [nestedMoveDraft, setNestedMoveDraft] = useState<NestedMoveDraft | null>(null);
  const [interactionMessage, setInteractionMessage] = useState("");
  const activeDrawRef = useRef<ActiveDraw | null>(null);
  const resizeDraftRef = useRef<ResizeDraft | null>(null);
  const nestedMoveDraftRef = useRef<NestedMoveDraft | null>(null);
  const blockingIssues = messages.filter(
    (message) => message.severity === "danger",
  ).length;
  const warnings = messages.filter(
    (message) => message.severity === "warning",
  ).length;
  const breakpointLabel =
    activeBreakpoint === "desktop"
      ? "Desktop"
      : activeBreakpoint === "tablet"
        ? "Tablet"
        : "Mobile";
  const responsiveLabel = state.responsive.enabled ? "On" : "Off";
  const inspectedItem =
    state.items.find((item) => item.id === state.selectedItemId) ??
    state.items[0] ??
    null;
  const columnTracks = expandFixedTrackTemplate(
    state.columnTemplate,
    state.columns,
    "1fr",
  );
  const rowTracks = expandFixedTrackTemplate(
    state.rowTemplate,
    state.rows,
    "minmax(120px, auto)",
  );
  const canvasHasExactTracks = columnTracks.editable && rowTracks.editable;
  const showCellGuides =
    canvasHasExactTracks &&
    (state.showGridLines ||
      editorMode === "draw" ||
      editorMode === "inspect" ||
      activeDragId !== null ||
      resizeDraft !== null);

  // The pointer effects below read their live draft from a ref so the window
  // listeners stay attached for the whole gesture. They depend on the pointer
  // id alone, so keep it in a local to make that the only reactive input.
  const drawPointerId = activeDraw?.pointerId ?? null;
  const resizePointerId = resizeDraft?.pointerId ?? null;
  const nestedPointerId = nestedMoveDraft?.pointerId ?? null;

  useEffect(() => {
    activeDrawRef.current = activeDraw;
  }, [activeDraw]);

  useEffect(() => {
    resizeDraftRef.current = resizeDraft;
  }, [resizeDraft]);

  useEffect(() => {
    nestedMoveDraftRef.current = nestedMoveDraft;
  }, [nestedMoveDraft]);

  useEffect(() => {
    if (drawPointerId === null) return;

    const finishDraw = (event: PointerEvent) => {
      const draft = activeDrawRef.current;
      if (!draft || draft.pointerId !== event.pointerId) return;
      activeDrawRef.current = null;
      setActiveDraw(null);
      onCreateItem(draft.selection);
    };

    const cancelDraw = (event: PointerEvent) => {
      const draft = activeDrawRef.current;
      if (!draft || draft.pointerId !== event.pointerId) return;
      activeDrawRef.current = null;
      setActiveDraw(null);
    };

    window.addEventListener("pointerup", finishDraw);
    window.addEventListener("pointercancel", cancelDraw);
    return () => {
      window.removeEventListener("pointerup", finishDraw);
      window.removeEventListener("pointercancel", cancelDraw);
    };
  }, [drawPointerId, onCreateItem]);

  useEffect(() => {
    if (resizePointerId === null) return;

    const moveResize = (event: PointerEvent) => {
      const draft = resizeDraftRef.current;
      if (!draft || draft.pointerId !== event.pointerId) return;
      const cell = findGridCellAtPoint(event.clientX, event.clientY);
      if (!cell) return;

      const nextItem = resizeItemToCell(
        draft.baseItem,
        draft.edge,
        cell,
        state.columns,
        state.rows,
      );
      const nextDraft = { ...draft, item: nextItem };
      resizeDraftRef.current = nextDraft;
      setResizeDraft(nextDraft);
    };

    const finishResize = (event: PointerEvent) => {
      const draft = resizeDraftRef.current;
      if (!draft || draft.pointerId !== event.pointerId) return;
      resizeDraftRef.current = null;
      setResizeDraft(null);
      if (!isSameGridItem(draft.baseItem, draft.item)) {
        onCommitItem(draft.item);
      }
    };

    const cancelResize = (event: PointerEvent) => {
      const draft = resizeDraftRef.current;
      if (!draft || draft.pointerId !== event.pointerId) return;
      resizeDraftRef.current = null;
      setResizeDraft(null);
    };

    window.addEventListener("pointermove", moveResize);
    window.addEventListener("pointerup", finishResize);
    window.addEventListener("pointercancel", cancelResize);
    return () => {
      window.removeEventListener("pointermove", moveResize);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", cancelResize);
    };
  }, [onCommitItem, resizePointerId, state.columns, state.rows]);

  useEffect(() => {
    if (nestedPointerId === null) return;

    const moveNested = (event: PointerEvent) => {
      const draft = nestedMoveDraftRef.current;
      if (!draft || draft.pointerId !== event.pointerId) return;
      const parent = state.items.find((item) => item.id === draft.parentId);
      if (!parent?.nestedGrid) return;
      const cell = findNestedGridCellAtPoint(
        event.clientX,
        event.clientY,
        draft.parentId,
      );
      if (!cell) return;
      const nextItem = moveNestedGridItemToCell(
        draft.baseItem,
        cell.column,
        cell.row,
        parent.nestedGrid.columns,
        parent.nestedGrid.rows,
      );
      const nextDraft = { ...draft, item: nextItem };
      nestedMoveDraftRef.current = nextDraft;
      setNestedMoveDraft(nextDraft);
    };

    const finishNested = (event: PointerEvent) => {
      const draft = nestedMoveDraftRef.current;
      if (!draft || draft.pointerId !== event.pointerId) return;
      nestedMoveDraftRef.current = null;
      setNestedMoveDraft(null);
      if (!isSameNestedPlacement(draft.baseItem, draft.item)) {
        onCommitNestedItem(draft.parentId, draft.item);
        setInteractionMessage(
          `${draft.item.name} moved to column ${draft.item.columnStart}, row ${draft.item.rowStart}.`,
        );
      }
    };

    const cancelNested = (event: PointerEvent) => {
      const draft = nestedMoveDraftRef.current;
      if (!draft || draft.pointerId !== event.pointerId) return;
      nestedMoveDraftRef.current = null;
      setNestedMoveDraft(null);
    };

    window.addEventListener("pointermove", moveNested);
    window.addEventListener("pointerup", finishNested);
    window.addEventListener("pointercancel", cancelNested);
    return () => {
      window.removeEventListener("pointermove", moveNested);
      window.removeEventListener("pointerup", finishNested);
      window.removeEventListener("pointercancel", cancelNested);
    };
  }, [nestedPointerId, onCommitNestedItem, state.items]);

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const target = readGridCell(event.over?.data.current?.cell);
    if (!target) return;
    const item = state.items.find((candidate) => candidate.id === String(event.active.id));
    onMoveItem(String(event.active.id), target);
    if (item) {
      setInteractionMessage(
        `${item.name} moved to column ${target.column}, row ${target.row}.`,
      );
    }
  }

  function startDraw(cell: GridCell, event: ReactPointerEvent<HTMLDivElement>) {
    if (
      !canvasHasExactTracks ||
      editorMode !== "draw" ||
      event.button !== 0 ||
      state.items.length >= 24
    )
      return;
    event.preventDefault();
    const draft: ActiveDraw = {
      pointerId: event.pointerId,
      selection: { anchor: cell, current: cell },
    };
    activeDrawRef.current = draft;
    setActiveDraw(draft);
  }

  function continueDraw(cell: GridCell) {
    const draft = activeDrawRef.current;
    if (!draft || editorMode !== "draw") return;
    const next = {
      ...draft,
      selection: { ...draft.selection, current: cell },
    };
    activeDrawRef.current = next;
    setActiveDraw(next);
  }

  function startResize(
    item: GridItem,
    edge: GridResizeEdge,
    event: ReactPointerEvent<HTMLElement>,
  ) {
    if (editorMode !== "select" || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    onSelectItem(item.id);
    const draft: ResizeDraft = {
      pointerId: event.pointerId,
      edge,
      baseItem: item,
      item,
    };
    resizeDraftRef.current = draft;
    setResizeDraft(draft);
  }

  function resizeWithKeyboard(
    item: GridItem,
    edge: GridResizeEdge,
    event: ReactKeyboardEvent<HTMLElement>,
  ) {
    const key = event.key;
    let delta = 0;

    if (edge === "left" || edge === "right") {
      if (key === "ArrowLeft") delta = -1;
      if (key === "ArrowRight") delta = 1;
    } else {
      if (key === "ArrowUp") delta = -1;
      if (key === "ArrowDown") delta = 1;
    }

    if (!delta) return;
    event.preventDefault();
    event.stopPropagation();
    const nextItem = resizeItemByStep(
      item,
      edge,
      delta,
      state.columns,
      state.rows,
    );
    onCommitItem(nextItem);
    setInteractionMessage(
      `${item.name} resized to ${nextItem.columnEnd - nextItem.columnStart} columns by ${nextItem.rowEnd - nextItem.rowStart} rows.`,
    );
  }

  function moveWithKeyboard(
    item: GridItem,
    event: ReactKeyboardEvent<HTMLElement>,
  ) {
    if (editorMode !== "select" || event.altKey || event.ctrlKey || event.metaKey) return;
    let columnDelta = 0;
    let rowDelta = 0;
    if (event.key === "ArrowLeft") columnDelta = -1;
    if (event.key === "ArrowRight") columnDelta = 1;
    if (event.key === "ArrowUp") rowDelta = -1;
    if (event.key === "ArrowDown") rowDelta = 1;
    if (!columnDelta && !rowDelta) return;
    event.preventDefault();
    event.stopPropagation();
    const nextItem = moveItemByStep(
      item,
      columnDelta,
      rowDelta,
      state.columns,
      state.rows,
    );
    if (!isSameGridItem(item, nextItem)) onCommitItem(nextItem);
    setInteractionMessage(
      `${item.name} moved to column ${nextItem.columnStart}, row ${nextItem.rowStart}.`,
    );
  }

  function startNestedMove(
    parent: GridItem,
    item: GridNestedItem,
    event: ReactPointerEvent<HTMLElement>,
  ) {
    if (!parent.nestedGrid || editorMode !== "select" || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    onSelectItem(parent.id);
    const draft: NestedMoveDraft = {
      pointerId: event.pointerId,
      parentId: parent.id,
      baseItem: item,
      item,
    };
    nestedMoveDraftRef.current = draft;
    setNestedMoveDraft(draft);
  }

  function moveNestedWithKeyboard(
    parent: GridItem,
    item: GridNestedItem,
    event: ReactKeyboardEvent<HTMLElement>,
  ) {
    if (!parent.nestedGrid || editorMode !== "select") return;
    let columnDelta = 0;
    let rowDelta = 0;
    if (event.key === "ArrowLeft") columnDelta = -1;
    if (event.key === "ArrowRight") columnDelta = 1;
    if (event.key === "ArrowUp") rowDelta = -1;
    if (event.key === "ArrowDown") rowDelta = 1;
    if (!columnDelta && !rowDelta) return;
    event.preventDefault();
    event.stopPropagation();
    const nextItem = moveNestedGridItemByStep(
      item,
      columnDelta,
      rowDelta,
      parent.nestedGrid.columns,
      parent.nestedGrid.rows,
    );
    if (!isSameNestedPlacement(item, nextItem)) onCommitNestedItem(parent.id, nextItem);
    setInteractionMessage(
      `${item.name} moved inside ${parent.name} to column ${nextItem.columnStart}, row ${nextItem.rowStart}.`,
    );
  }

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {interactionMessage}
      </p>
      <PreviewToolbar
        title={`${breakpointLabel} grid canvas`}
        description="Each device tab owns real CSS Grid tracks and item placements. Move, resize, or draw directly on the active breakpoint."
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl/Cmd + Z)"
            >
              Undo
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl/Cmd + Shift + Z)"
            >
              Redo
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          <SegmentedControl
            ariaLabel="Grid editor mode"
            value={editorMode}
            onChange={onEditorModeChange}
            options={[
              { value: "select", label: "Select / move" },
              {
                value: "draw",
                label: "Draw item",
                disabled: state.items.length >= 24 || !canvasHasExactTracks,
              },
              { value: "inspect", label: "Inspect" },
            ]}
          />
          <SegmentedControl
            ariaLabel="Grid preview overlays"
            value={
              state.showGridLines
                ? "lines"
                : state.showAreaNames
                  ? "labels"
                  : "clean"
            }
            onChange={(value) =>
              onPatch({
                showGridLines: value === "lines",
                showAreaNames: value !== "clean",
                showLineNumbers: value === "lines",
              })
            }
            options={[
              { value: "lines", label: "Lines" },
              { value: "labels", label: "Labels" },
              { value: "clean", label: "Clean" },
            ]}
          />
          <SegmentedControl
            ariaLabel="Preview breakpoint"
            value={activeBreakpoint}
            onChange={onBreakpointChange}
            options={[
              { value: "desktop", label: "Desktop" },
              { value: "tablet", label: "Tablet" },
              { value: "mobile", label: "Mobile" },
            ]}
          />
          <div className="flex flex-wrap items-center gap-1">
            <span className="px-1 text-xs font-bold uppercase tracking-wide text-[var(--color-text-soft)]">
              Viewport
            </span>
            {[375, 768, 1024].map((width) => (
              <Button
                key={width}
                size="sm"
                variant={state.previewWidth === width ? "primary" : "secondary"}
                onClick={() => onPatch({ previewWidth: width })}
              >
                {width}px
              </Button>
            ))}
          </div>
        </div>
      </PreviewToolbar>
      <div className="grid gap-2 border-y border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3 sm:grid-cols-4">
        <PreviewStat
          label="Tracks"
          value={`${state.columns} × ${state.rows}`}
          helper={`${breakpointLabel} · ${state.items.length} items`}
        />
        <PreviewStat
          label="Gap"
          value={`${state.gap.row}${state.gap.unit} / ${state.gap.column}${state.gap.unit}`}
          helper="row / column"
        />
        <PreviewStat
          label="Editor"
          value={
            editorMode === "draw"
              ? "Draw item"
              : editorMode === "inspect"
                ? "Inspect"
                : "Select / move"
          }
          helper={
            editorMode === "draw"
              ? "drag across cells"
              : editorMode === "inspect"
                ? "read lines + generated CSS"
                : "drag items + resize handles"
          }
        />
        <PreviewStat
          label="Checks"
          value={
            blockingIssues
              ? `${blockingIssues} error`
              : warnings
                ? `${warnings} warning`
                : "Clean"
          }
          helper={
            state.useTemplateAreas ? `${breakpointLabel} · areas mode` : `Responsive output ${responsiveLabel}`
          }
          tone={
            blockingIssues ? "danger" : warnings ? "warning" : "success"
          }
        />
      </div>
      <div className="overflow-auto bg-[var(--color-bg-soft)] p-4">
        <div
          className="relative mx-auto transition-all"
          style={{ width: state.previewWidth }}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-soft)]">
            <span className="truncate">{state.columnTemplate}</span>
            <span className="shrink-0">{state.previewWidth}px canvas</span>
          </div>
          <div className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs leading-5 text-[var(--color-text-soft)]">
            {!canvasHasExactTracks
              ? "Direct line editing is paused because the current row or column template has a dynamic or mismatched track count. The CSS preview stays raw; convert the template to editable tracks before dragging, drawing, or resizing."
              : editorMode === "draw"
              ? state.items.length >= 24
                ? "The 24-item limit is reached. Remove an item before drawing another."
                : "Drag from one cell to another to create an item that spans the selected rectangle."
              : editorMode === "inspect"
                ? "Select any item to inspect the exact grid lines, spans, and CSS placement for this breakpoint. Canvas movement is locked while inspecting."
                : "Drag an item to move it, or focus it and use Arrow keys. Nested children can also be dragged or moved with Arrow keys. Focus resize handles to change spans from the keyboard."}
          </div>
          {editorMode === "inspect" && inspectedItem ? (
            <GridInspectSummary item={inspectedItem} breakpointLabel={breakpointLabel} />
          ) : null}
          <DndContext
            collisionDetection={gridCollisionDetection}
            onDragStart={(event) => {
              setActiveDragId(String(event.active.id));
              onSelectItem(String(event.active.id));
            }}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveDragId(null)}
          >
            <div
              className="relative grid min-h-[360px] overflow-visible rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] p-3"
              style={{
                gridTemplateColumns: state.columnTemplate,
                gridTemplateRows: state.rowTemplate,
                gap: `${state.gap.row}${state.gap.unit} ${state.gap.column}${state.gap.unit}`,
                justifyItems: state.justifyItems,
                alignItems: state.alignItems,
                justifyContent: state.justifyContent,
                alignContent: state.alignContent,
                gridAutoFlow: state.autoFlow,
                gridAutoColumns: state.autoColumns,
                gridAutoRows: state.autoRows,
              }}
            >
              {canvasHasExactTracks
                ? Array.from({ length: state.rows }, (_, rowIndex) =>
                    Array.from({ length: state.columns }, (_, columnIndex) => {
                      const cell = {
                        column: columnIndex + 1,
                        row: rowIndex + 1,
                      };
                      return (
                        <GridCanvasCell
                          key={`${cell.column}-${cell.row}`}
                          cell={cell}
                          editorMode={editorMode}
                          showGuide={showCellGuides}
                          selected={
                            activeDraw
                              ? isCellInSelection(cell, activeDraw.selection)
                              : false
                          }
                          showLineNumbers={state.showLineNumbers}
                          isFirstRow={cell.row === 1}
                          isFirstColumn={cell.column === 1}
                          isLastColumn={cell.column === state.columns}
                          isLastRow={cell.row === state.rows}
                          onDrawStart={startDraw}
                          onDrawEnter={continueDraw}
                        />
                      );
                    }),
                  )
                : null}

              {activeDraw ? (
                <DrawSelectionPreview selection={activeDraw.selection} />
              ) : null}

              {state.items.map((item) => {
                const displayItem =
                  resizeDraft?.item.id === item.id ? resizeDraft.item : item;
                return (
                  <GridPreviewItem
                    key={item.id}
                    item={displayItem}
                    selected={item.id === state.selectedItemId}
                    showAreaNames={state.showAreaNames}
                    editorMode={editorMode}
                    dragging={item.id === activeDragId}
                    resizing={resizeDraft?.item.id === item.id}
                    canvasEditable={canvasHasExactTracks}
                    nestedMoveItem={
                      nestedMoveDraft?.parentId === item.id
                        ? nestedMoveDraft.item
                        : null
                    }
                    onSelect={() => onSelectItem(item.id)}
                    onItemKeyDown={moveWithKeyboard}
                    onNestedMoveStart={startNestedMove}
                    onNestedMoveKeyDown={moveNestedWithKeyboard}
                    onResizeStart={startResize}
                    onResizeKeyDown={resizeWithKeyboard}
                  />
                );
              })}
            </div>
          </DndContext>
        </div>
      </div>
    </section>
  );
}

function GridInspectSummary({
  item,
  breakpointLabel,
}: {
  item: GridItem;
  breakpointLabel: string;
}) {
  const columnSpan = item.columnEnd - item.columnStart;
  const rowSpan = item.rowEnd - item.rowStart;
  return (
    <div className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black text-[var(--color-text)]">
            {item.name}
          </p>
          <p className="text-xs text-[var(--color-text-soft)]">
            {breakpointLabel} placement · area {item.areaName}
          </p>
        </div>
        <code className="rounded-[var(--radius-sm)] bg-[var(--color-bg-soft)] px-2 py-1 text-xs font-bold text-[var(--color-text)]">
          grid-column: {item.columnStart} / {item.columnEnd}; grid-row: {item.rowStart} / {item.rowEnd};
        </code>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <InspectStat label="Column lines" value={`${item.columnStart} → ${item.columnEnd}`} />
        <InspectStat label="Row lines" value={`${item.rowStart} → ${item.rowEnd}`} />
        <InspectStat label="Column span" value={String(columnSpan)} />
        <InspectStat label="Row span" value={String(rowSpan)} />
      </div>
      {item.nestedGrid ? (
        <div className="mt-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 py-2 text-xs leading-5 text-[var(--color-text-soft)]">
          <span className="font-black text-[var(--color-text)]">Nested grid:</span>{" "}
          columns {item.nestedGrid.columnMode === "subgrid" ? "subgrid" : item.nestedGrid.columns}, rows {item.nestedGrid.rowMode === "subgrid" ? "subgrid" : item.nestedGrid.rows}, {item.nestedGrid.items.length} child{item.nestedGrid.items.length === 1 ? "" : "ren"}.
        </div>
      ) : null}
    </div>
  );
}

function InspectStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-[var(--color-bg-soft)] px-2.5 py-2">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-soft)]">
        {label}
      </p>
      <p className="mt-1 font-mono text-xs font-black text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
}

function PreviewStat({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-soft)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-sm font-black text-[var(--color-text)]",
          tone === "success" && "text-[var(--color-success-text)]",
          tone === "warning" && "text-[var(--color-warning-text)]",
          tone === "danger" && "text-[var(--color-danger-text)]",
        )}
      >
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-[var(--color-text-soft)]">
        {helper}
      </p>
    </div>
  );
}

function GridCanvasCell({
  cell,
  editorMode,
  showGuide,
  selected,
  showLineNumbers,
  isFirstRow,
  isFirstColumn,
  isLastColumn,
  isLastRow,
  onDrawStart,
  onDrawEnter,
}: {
  cell: GridCell;
  editorMode: GridEditorMode;
  showGuide: boolean;
  selected: boolean;
  showLineNumbers: boolean;
  isFirstRow: boolean;
  isFirstColumn: boolean;
  isLastColumn: boolean;
  isLastRow: boolean;
  onDrawStart: (
    cell: GridCell,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  onDrawEnter: (cell: GridCell) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `grid-cell-${cell.column}-${cell.row}`,
    data: { cell },
  });

  return (
    <div
      ref={setNodeRef}
      data-grid-cell="true"
      data-grid-column={cell.column}
      data-grid-row={cell.row}
      onPointerDown={(event) => onDrawStart(cell, event)}
      onPointerEnter={() => onDrawEnter(cell)}
      className={cn(
        "relative z-0 min-h-0 min-w-0 rounded-[calc(var(--radius-md)-4px)] border transition-colors",
        showGuide
          ? "border-dashed border-[var(--color-preview-grid)]"
          : "border-transparent",
        editorMode === "draw" && "cursor-crosshair",
        selected &&
          "border-[var(--color-accent)] bg-[var(--color-primary-soft)]/35",
        isOver &&
          "border-solid border-[var(--color-accent)] bg-[var(--color-primary-soft)]/25",
      )}
      style={{
        gridColumn: `${cell.column} / ${cell.column + 1}`,
        gridRow: `${cell.row} / ${cell.row + 1}`,
        justifySelf: "stretch",
        alignSelf: "stretch",
      }}
      aria-hidden="true"
    >
      {showLineNumbers && isFirstRow ? (
        <span className="pointer-events-none absolute -left-1 -top-5 z-20 text-xs font-bold text-[var(--color-accent)]/70">
          {cell.column}
        </span>
      ) : null}
      {showLineNumbers && isFirstRow && isLastColumn ? (
        <span className="pointer-events-none absolute -right-1 -top-5 z-20 text-xs font-bold text-[var(--color-accent)]/70">
          {cell.column + 1}
        </span>
      ) : null}
      {showLineNumbers && isFirstColumn ? (
        <span className="pointer-events-none absolute -left-5 -top-1 z-20 text-xs font-bold text-[var(--color-accent)]/70">
          {cell.row}
        </span>
      ) : null}
      {showLineNumbers && isFirstColumn && isLastRow ? (
        <span className="pointer-events-none absolute -bottom-1 -left-5 z-20 text-xs font-bold text-[var(--color-accent)]/70">
          {cell.row + 1}
        </span>
      ) : null}
    </div>
  );
}

function DrawSelectionPreview({ selection }: { selection: GridSelection }) {
  const placement = getSelectionPlacement(selection);
  return (
    <div
      className="pointer-events-none relative z-20 rounded-[var(--radius-md)] border-2 border-[var(--color-accent)] bg-[var(--color-primary-soft)]/25 shadow-[var(--shadow-sm)]"
      style={{
        gridColumn: `${placement.columnStart} / ${placement.columnEnd}`,
        gridRow: `${placement.rowStart} / ${placement.rowEnd}`,
        justifySelf: "stretch",
        alignSelf: "stretch",
      }}
    >
      <span className="absolute left-2 top-2 rounded-[var(--radius-full)] bg-[var(--color-surface-raised)] px-2 py-1 text-xs font-bold text-[var(--color-text-primary)] shadow-[var(--shadow-xs)]">
        {placement.columnEnd - placement.columnStart} ×{" "}
        {placement.rowEnd - placement.rowStart}
      </span>
    </div>
  );
}

function GridPreviewItem({
  item,
  selected,
  showAreaNames,
  editorMode,
  dragging,
  resizing,
  canvasEditable,
  nestedMoveItem,
  onSelect,
  onItemKeyDown,
  onNestedMoveStart,
  onNestedMoveKeyDown,
  onResizeStart,
  onResizeKeyDown,
}: {
  item: GridItem;
  selected: boolean;
  showAreaNames: boolean;
  editorMode: GridEditorMode;
  dragging: boolean;
  resizing: boolean;
  canvasEditable: boolean;
  nestedMoveItem: GridNestedItem | null;
  onSelect: () => void;
  onItemKeyDown: (
    item: GridItem,
    event: ReactKeyboardEvent<HTMLElement>,
  ) => void;
  onNestedMoveStart: (
    parent: GridItem,
    item: GridNestedItem,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  onNestedMoveKeyDown: (
    parent: GridItem,
    item: GridNestedItem,
    event: ReactKeyboardEvent<HTMLElement>,
  ) => void;
  onResizeStart: (
    item: GridItem,
    edge: GridResizeEdge,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  onResizeKeyDown: (
    item: GridItem,
    edge: GridResizeEdge,
    event: ReactKeyboardEvent<HTMLElement>,
  ) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    disabled: !canvasEditable || editorMode !== "select" || resizing,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="group"
      tabIndex={editorMode === "select" ? 0 : -1}
      aria-label={
        canvasEditable
          ? `${item.name}. Drag to move, or use Arrow keys to move by one grid cell.`
          : `${item.name}. Direct grid-line editing is unavailable for the current track template.`
      }
      onClick={onSelect}
      onFocus={onSelect}
      onKeyDown={(event) => onItemKeyDown(item, event)}
      className={cn(
        "group relative z-10 min-h-20 min-w-0 border border-white/40 text-left shadow-sm transition-[box-shadow,opacity] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
        editorMode === "select" &&
          canvasEditable &&
          "cursor-grab active:cursor-grabbing",
        editorMode === "draw" && "pointer-events-none",
        selected && "ring-4 ring-[var(--color-accent)]/30",
        dragging && "z-30 opacity-80 shadow-[var(--shadow-lg)]",
      )}
      style={{
        gridColumn: `${item.columnStart} / ${item.columnEnd}`,
        gridRow: `${item.rowStart} / ${item.rowEnd}`,
        background: item.background,
        color: item.textColor,
        borderRadius: item.borderRadius,
        padding: item.padding,
        justifySelf: item.justifySelf === "auto" ? undefined : item.justifySelf,
        alignSelf: item.alignSelf === "auto" ? undefined : item.alignSelf,
        display: item.nestedGrid ? "grid" : undefined,
        gridTemplateColumns: item.nestedGrid
          ? item.nestedGrid.columnMode === "subgrid"
            ? "subgrid"
            : item.nestedGrid.columnTemplate
          : undefined,
        gridTemplateRows: item.nestedGrid
          ? item.nestedGrid.rowMode === "subgrid"
            ? "subgrid"
            : item.nestedGrid.rowTemplate
          : undefined,
        gap: item.nestedGrid
          ? `${item.nestedGrid.gap.row}${item.nestedGrid.gap.unit} ${item.nestedGrid.gap.column}${item.nestedGrid.gap.unit}`
          : undefined,
        transform: DndCSS.Translate.toString(transform),
        touchAction:
          canvasEditable && editorMode === "select" ? "none" : "auto",
      }}
    >
      {item.nestedGrid ? (
        <>
          <span className="pointer-events-none absolute left-2 top-2 z-30 rounded-full border border-white/30 bg-black/25 px-2 py-1 text-xs font-black uppercase tracking-wide text-white backdrop-blur-sm">
            {showAreaNames ? item.areaName : item.name} · nested
          </span>
          <span className="pointer-events-none absolute right-2 top-2 z-30 rounded-full border border-white/30 bg-black/25 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
            {item.nestedGrid.columnMode === "subgrid" ? "C:subgrid" : `C:${item.nestedGrid.columns}`} · {item.nestedGrid.rowMode === "subgrid" ? "R:subgrid" : `R:${item.nestedGrid.rows}`}
          </span>

          {selected || nestedMoveItem
            ? Array.from({ length: item.nestedGrid.rows }, (_, rowIndex) =>
                Array.from(
                  { length: item.nestedGrid!.columns },
                  (_, columnIndex) => (
                    <span
                      key={`guide-${columnIndex + 1}-${rowIndex + 1}`}
                      aria-hidden="true"
                      data-nested-grid-cell="true"
                      data-nested-parent={item.id}
                      data-nested-column={columnIndex + 1}
                      data-nested-row={rowIndex + 1}
                      className="pointer-events-auto relative z-0 min-h-8 min-w-0 rounded-md border border-dashed border-white/20 bg-white/[0.035]"
                      style={{
                        gridColumn: columnIndex + 1,
                        gridRow: rowIndex + 1,
                      }}
                    />
                  ),
                ),
              )
            : null}

          {item.nestedGrid.items.map((nestedItem) => {
            const displayNestedItem =
              nestedMoveItem?.id === nestedItem.id ? nestedMoveItem : nestedItem;
            const isMoving = nestedMoveItem?.id === nestedItem.id;
            return (
              <button
                key={nestedItem.id}
                type="button"
                tabIndex={editorMode === "select" ? 0 : -1}
                aria-label={`${nestedItem.name} inside ${item.name}. Drag or use Arrow keys to move by one nested grid cell.`}
                onPointerDown={(event) =>
                  onNestedMoveStart(item, nestedItem, event)
                }
                onKeyDown={(event) =>
                  onNestedMoveKeyDown(item, nestedItem, event)
                }
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect();
                }}
                className={cn(
                  "relative z-10 min-w-0 overflow-hidden rounded-xl border border-white/30 p-3 text-left text-xs font-bold shadow-sm outline-none transition-[box-shadow,opacity,transform] focus-visible:ring-2 focus-visible:ring-white/80",
                  editorMode === "select" && "cursor-grab active:cursor-grabbing",
                  isMoving && "z-30 opacity-80 shadow-lg",
                )}
                style={{
                  gridColumn: `${displayNestedItem.columnStart} / ${displayNestedItem.columnEnd}`,
                  gridRow: `${displayNestedItem.rowStart} / ${displayNestedItem.rowEnd}`,
                  background: displayNestedItem.background,
                  color: displayNestedItem.textColor,
                  touchAction: editorMode === "select" ? "none" : "auto",
                }}
              >
                <span className="block truncate">{displayNestedItem.name}</span>
                <span className="mt-1 block truncate text-xs opacity-75">
                  {displayNestedItem.columnStart}/{displayNestedItem.rowStart} → {displayNestedItem.columnEnd}/{displayNestedItem.rowEnd}
                </span>
                <span className="mt-2 block line-clamp-2 font-medium opacity-90">
                  {displayNestedItem.content}
                </span>
              </button>
            );
          })}
        </>
      ) : (
        <>
          <span className="block truncate text-sm font-black">
            {showAreaNames ? item.areaName : item.name}
          </span>
          <span className="mt-2 block truncate text-xs opacity-80">
            {item.columnStart}/{item.rowStart} → {item.columnEnd}/{item.rowEnd}
          </span>
          <span className="mt-4 block line-clamp-2 text-sm font-medium opacity-90">
            {item.content}
          </span>
        </>
      )}

      {selected && canvasEditable && editorMode === "select" && !dragging ? (
        <>
          <ResizeHandle
            item={item}
            edge="left"
            onPointerDown={onResizeStart}
            onKeyDown={onResizeKeyDown}
          />
          <ResizeHandle
            item={item}
            edge="right"
            onPointerDown={onResizeStart}
            onKeyDown={onResizeKeyDown}
          />
          <ResizeHandle
            item={item}
            edge="top"
            onPointerDown={onResizeStart}
            onKeyDown={onResizeKeyDown}
          />
          <ResizeHandle
            item={item}
            edge="bottom"
            onPointerDown={onResizeStart}
            onKeyDown={onResizeKeyDown}
          />
        </>
      ) : null}
    </div>
  );
}

function ResizeHandle({
  item,
  edge,
  onPointerDown,
  onKeyDown,
}: {
  item: GridItem;
  edge: GridResizeEdge;
  onPointerDown: (
    item: GridItem,
    edge: GridResizeEdge,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  onKeyDown: (
    item: GridItem,
    edge: GridResizeEdge,
    event: ReactKeyboardEvent<HTMLElement>,
  ) => void;
}) {
  const vertical = edge === "left" || edge === "right";
  return (
    <span
      role="separator"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      aria-label={`Resize ${item.name} from the ${edge} grid line`}
      tabIndex={0}
      onPointerDown={(event) => onPointerDown(item, edge, event)}
      onKeyDown={(event) => onKeyDown(item, edge, event)}
      className={cn(
        "absolute z-40 block border border-[var(--color-accent)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-sm)] outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]",
        edge === "left" &&
          "-left-1.5 top-1/2 h-7 w-3 -translate-y-1/2 cursor-ew-resize rounded-[var(--radius-full)]",
        edge === "right" &&
          "-right-1.5 top-1/2 h-7 w-3 -translate-y-1/2 cursor-ew-resize rounded-[var(--radius-full)]",
        edge === "top" &&
          "-top-1.5 left-1/2 h-3 w-7 -translate-x-1/2 cursor-ns-resize rounded-[var(--radius-full)]",
        edge === "bottom" &&
          "-bottom-1.5 left-1/2 h-3 w-7 -translate-x-1/2 cursor-ns-resize rounded-[var(--radius-full)]",
      )}
    />
  );
}

function readGridCell(value: unknown): GridCell | null {
  if (!value || typeof value !== "object") return null;
  const cell = value as Partial<GridCell>;
  return typeof cell.column === "number" && typeof cell.row === "number"
    ? { column: cell.column, row: cell.row }
    : null;
}

function findNestedGridCellAtPoint(
  clientX: number,
  clientY: number,
  parentId: string,
): GridCell | null {
  const elements = document.elementsFromPoint(clientX, clientY);
  for (const element of elements) {
    if (!(element instanceof HTMLElement)) continue;
    const cellElement = element.closest<HTMLElement>(
      `[data-nested-grid-cell='true'][data-nested-parent='${CSS.escape(parentId)}']`,
    );
    if (!cellElement) continue;
    const column = Number(cellElement.dataset.nestedColumn);
    const row = Number(cellElement.dataset.nestedRow);
    if (Number.isFinite(column) && Number.isFinite(row)) return { column, row };
  }
  return null;
}

function isSameNestedPlacement(
  first: GridNestedItem,
  second: GridNestedItem,
) {
  return (
    first.columnStart === second.columnStart &&
    first.columnEnd === second.columnEnd &&
    first.rowStart === second.rowStart &&
    first.rowEnd === second.rowEnd
  );
}

function findGridCellAtPoint(clientX: number, clientY: number): GridCell | null {
  const elements = document.elementsFromPoint(clientX, clientY);
  for (const element of elements) {
    if (!(element instanceof HTMLElement)) continue;
    const cellElement = element.closest<HTMLElement>("[data-grid-cell='true']");
    if (!cellElement) continue;
    const column = Number(cellElement.dataset.gridColumn);
    const row = Number(cellElement.dataset.gridRow);
    if (Number.isFinite(column) && Number.isFinite(row)) return { column, row };
  }
  return null;
}

function isCellInSelection(cell: GridCell, selection: GridSelection) {
  const placement = getSelectionPlacement(selection);
  return (
    cell.column >= placement.columnStart &&
    cell.column < placement.columnEnd &&
    cell.row >= placement.rowStart &&
    cell.row < placement.rowEnd
  );
}
