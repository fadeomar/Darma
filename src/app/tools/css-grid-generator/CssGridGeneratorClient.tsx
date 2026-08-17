"use client";

import { useEffect, useMemo, useState } from "react";
import { WarningPanel, type WarningMessage } from "@/features/tools/components";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import {
  clampItemToGrid,
  createDefaultGridState,
  createGridItem,
  createNestedGridItem,
  generateGridAreaMap,
  generateGridCss,
  generateGridCssVariables,
  generateGridHtml,
  generateGridJsx,
  generateGridTokenJson,
  generateTailwindStarter,
  normalizeGridState,
  normalizeNestedGrid,
  normalizeNestedGridsForPlacement,
  validateGridState,
} from "./grid";
import {
  createItemFromSelection,
  findFirstAvailableCell,
  moveItemToCell,
  type GridCell,
  type GridSelection,
} from "./editor";
import {
  createAutoLayout,
  extractBreakpointLayout,
  getSuggestedPreviewWidth,
  materializeBreakpointState,
  mergeBreakpointState,
  replaceBreakpointLayout,
} from "./responsive";
import type {
  GridBreakpoint,
  GridEditorMode,
  GridGeneratorState,
  GridItem,
  GridNestedItem,
  GridPreset,
  ResponsiveSettings,
} from "./types";
import { GRID_PRESETS } from "./presets";
import { GridPreview } from "./components/GridPreview";
import { GridControls } from "./components/GridControls";
import { GridCodeOutput } from "./components/GridCodeOutput";
import { useGridHistory } from "./useGridHistory";
import { importGridCss } from "./importCss";
import {
  createGridShareUrl,
  GRID_SHARE_PARAM,
  GRID_WORKSPACE_STORAGE_KEY,
  parseGridWorkspace,
  serializeGridWorkspace,
} from "./workspace";

type GridStateUpdater = (current: GridGeneratorState) => GridGeneratorState;
type ResponsiveStrategy = "copy-desktop" | "copy-tablet" | "auto";

export default function CssGridGeneratorClient() {
  const {
    state,
    commit,
    updateView,
    replace,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useGridHistory(createDefaultGridState);
  const [activePreset, setActivePreset] = useState("bento-grid");
  const [editorMode, setEditorMode] = useState<GridEditorMode>("select");
  const [activeBreakpoint, setActiveBreakpoint] =
    useState<GridBreakpoint>("desktop");
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const normalized = useMemo(() => normalizeGridState(state), [state]);
  const activeState = useMemo(
    () =>
      normalizeNestedGridsForPlacement(
        materializeBreakpointState(normalized, activeBreakpoint),
      ),
    [activeBreakpoint, normalized],
  );
  const selectedItem =
    activeState.items.find((item) => item.id === activeState.selectedItemId) ??
    activeState.items[0] ??
    null;
  const css = useMemo(() => generateGridCss(normalized), [normalized]);
  const cssVariables = useMemo(
    () => generateGridCssVariables(normalized),
    [normalized],
  );
  const html = useMemo(() => generateGridHtml(normalized), [normalized]);
  const jsx = useMemo(() => generateGridJsx(normalized), [normalized]);
  const tailwind = useMemo(
    () => generateTailwindStarter(normalized),
    [normalized],
  );
  const tokens = useMemo(
    () => generateGridTokenJson(normalized),
    [normalized],
  );
  const areaMap = useMemo(
    () => generateGridAreaMap(activeState),
    [activeState],
  );
  const messages = useMemo<WarningMessage[]>(
    () =>
      validateGridState(activeState).map((message, index) => ({
        id: `${activeBreakpoint}-${message.type}-${index}`,
        severity:
          message.type === "error"
            ? "danger"
            : message.type === "warning"
              ? "warning"
              : "info",
        message: message.message,
      })),
    [activeBreakpoint, activeState],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedWorkspace = params.get(GRID_SHARE_PARAM);
    const presetId = params.get("preset");
    const preset = GRID_PRESETS.find((item) => item.id === presetId);

    const restoreLocalWorkspace = () => {
      const saved = window.localStorage.getItem(GRID_WORKSPACE_STORAGE_KEY);
      if (!saved) return false;
      const restored = normalizeGridState(parseGridWorkspace(saved));
      replace(restored);
      setActivePreset("");
      return true;
    };

    try {
      if (sharedWorkspace) {
        const shared = normalizeGridState(parseGridWorkspace(sharedWorkspace));
        replace({
          ...shared,
          previewWidth: getSuggestedPreviewWidth(shared, "desktop"),
        });
        setActivePreset("");
      } else if (preset) {
        replace({
          ...preset.state,
          previewWidth: getSuggestedPreviewWidth(preset.state, "desktop"),
        });
        setActivePreset(preset.id);
      } else {
        restoreLocalWorkspace();
      }
    } catch {
      // Invalid shared URLs should fall back to a valid local workspace.
      try {
        if (sharedWorkspace && restoreLocalWorkspace()) {
          // Keep the local workspace intact when the shared payload is invalid.
        } else if (!preset) {
          window.localStorage.removeItem(GRID_WORKSPACE_STORAGE_KEY);
        }
      } catch {
        window.localStorage.removeItem(GRID_WORKSPACE_STORAGE_KEY);
      }
    } finally {
      setActiveBreakpoint("desktop");
      setWorkspaceReady(true);
    }
  }, [replace]);

  useEffect(() => {
    if (!workspaceReady) return;
    try {
      window.localStorage.setItem(
        GRID_WORKSPACE_STORAGE_KEY,
        serializeGridWorkspace(normalized),
      );
    } catch {
      // Storage can be disabled or full; the editor must remain usable.
    }
  }, [normalized, workspaceReady]);

  useEffect(() => {
    const handleKeyboardHistory = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT"
      ) {
        return;
      }

      const modifier = event.metaKey || event.ctrlKey;
      if (!modifier) return;

      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        setActivePreset("");
        if (event.shiftKey) redo();
        else undo();
      } else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        setActivePreset("");
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyboardHistory);
    return () => window.removeEventListener("keydown", handleKeyboardHistory);
  }, [redo, undo]);

  function markCustom() {
    setActivePreset("");
  }

  function commitActive(updater: GridStateUpdater) {
    commit((current) => {
      const currentActive = materializeBreakpointState(
        current,
        activeBreakpoint,
      );
      return mergeBreakpointState(
        current,
        activeBreakpoint,
        updater(currentActive),
      );
    });
  }

  function patchState(patch: Partial<GridGeneratorState>) {
    markCustom();
    commitActive((current) => {
      const next = { ...current, ...patch };
      if (patch.columns === undefined && patch.rows === undefined) return next;

      const columns = patch.columns ?? current.columns;
      const rows = patch.rows ?? current.rows;
      return {
        ...next,
        items: current.items.map((item) =>
          clampItemToGrid(item, columns, rows),
        ),
      };
    });
  }

  function patchResponsive(patch: Partial<ResponsiveSettings>) {
    markCustom();
    commit((current) => ({
      ...current,
      responsive: { ...current.responsive, ...patch },
    }));
  }

  function patchPreview(patch: Partial<GridGeneratorState>) {
    updateView((current) => ({ ...current, ...patch }));
  }

  function switchBreakpoint(nextBreakpoint: GridBreakpoint) {
    setEditorMode("select");
    setActiveBreakpoint(nextBreakpoint);
    updateView((current) => ({
      ...current,
      previewWidth: getSuggestedPreviewWidth(current, nextBreakpoint),
    }));
  }

  function configureBreakpoint(
    breakpoint: Exclude<GridBreakpoint, "desktop">,
    strategy: ResponsiveStrategy,
  ) {
    markCustom();
    commit((current) => {
      let source;
      if (strategy === "copy-desktop") {
        source = extractBreakpointLayout(current);
      } else if (strategy === "copy-tablet") {
        source = extractBreakpointLayout(
          materializeBreakpointState(current, "tablet"),
        );
      } else {
        source = createAutoLayout(
          current,
          breakpoint === "tablet" ? Math.min(2, current.columns) : 1,
        );
      }
      const next = replaceBreakpointLayout(current, breakpoint, source);
      return {
        ...next,
        previewWidth: getSuggestedPreviewWidth(next, breakpoint),
      };
    });
    setEditorMode("select");
    setActiveBreakpoint(breakpoint);
  }

  function selectItem(id: string) {
    updateView((current) => ({ ...current, selectedItemId: id }));
  }

  function updateSelectedItem(patch: Partial<GridItem>) {
    if (!selectedItem) return;
    markCustom();

    if (Object.prototype.hasOwnProperty.call(patch, "nestedGrid")) {
      commit((current) => ({
        ...current,
        items: current.items.map((item) => {
          if (item.id !== selectedItem.id) return item;
          const baseItem = clampItemToGrid(
            { ...item, nestedGrid: patch.nestedGrid ?? null },
            current.columns,
            current.rows,
          );
          return {
            ...baseItem,
            nestedGrid: patch.nestedGrid
              ? normalizeNestedGrid(baseItem, patch.nestedGrid)
              : null,
          };
        }),
        selectedItemId: selectedItem.id,
      }));
      return;
    }

    commitActive((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === selectedItem.id
          ? clampItemToGrid(
              { ...item, ...patch },
              current.columns,
              current.rows,
            )
          : item,
      ),
      selectedItemId: selectedItem.id,
    }));
  }

  function addItem() {
    if (activeState.items.length >= 24) return;
    const target = findFirstAvailableCell(
      activeState.items,
      activeState.columns,
      activeState.rows,
    );
    const item = createGridItem({
      name: `Item ${activeState.items.length + 1}`,
      areaName: `item${activeState.items.length + 1}`,
      content: `Item ${activeState.items.length + 1}`,
      columnStart: target.column,
      columnEnd: target.column + 1,
      rowStart: target.row,
      rowEnd: target.row + 1,
    });
    markCustom();
    commitActive((current) => ({
      ...current,
      items: [...current.items, item],
      selectedItemId: item.id,
    }));
  }

  function createItem(selection: GridSelection) {
    if (activeState.items.length >= 24) return;
    markCustom();
    commitActive((current) => {
      const item = createItemFromSelection(
        selection,
        current.items.length,
        current.columns,
        current.rows,
      );
      return {
        ...current,
        items: [...current.items, item],
        selectedItemId: item.id,
      };
    });
    setEditorMode("select");
  }

  function moveItem(id: string, target: GridCell) {
    markCustom();
    commitActive((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id
          ? moveItemToCell(item, target, current.columns, current.rows)
          : item,
      ),
      selectedItemId: id,
    }));
  }

  function commitItem(nextItem: GridItem) {
    markCustom();
    commitActive((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === nextItem.id
          ? clampItemToGrid(nextItem, current.columns, current.rows)
          : item,
      ),
      selectedItemId: nextItem.id,
    }));
  }

  function commitNestedItem(parentId: string, nextItem: GridNestedItem) {
    markCustom();
    commit((current) => ({
      ...current,
      items: current.items.map((parent) => {
        if (parent.id !== parentId || !parent.nestedGrid) return parent;
        return {
          ...parent,
          nestedGrid: normalizeNestedGrid(parent, {
            ...parent.nestedGrid,
            items: parent.nestedGrid.items.map((item) =>
              item.id === nextItem.id ? nextItem : item,
            ),
          }),
        };
      }),
      selectedItemId: parentId,
    }));
  }

  function duplicateSelectedItem() {
    if (!selectedItem || activeState.items.length >= 24) return;
    const target = findFirstAvailableCell(
      activeState.items,
      activeState.columns,
      activeState.rows,
    );
    const item = createGridItem({
      ...selectedItem,
      id: undefined,
      name: `${selectedItem.name} copy`,
      areaName: `${selectedItem.areaName}Copy`,
      content: `${selectedItem.content} copy`,
      nestedGrid: selectedItem.nestedGrid
        ? {
            ...selectedItem.nestedGrid,
            items: selectedItem.nestedGrid.items.map((nestedItem) =>
              createNestedGridItem({ ...nestedItem, id: undefined }),
            ),
          }
        : null,
      columnStart: target.column,
      columnEnd: target.column + 1,
      rowStart: target.row,
      rowEnd: target.row + 1,
    });
    markCustom();
    commitActive((current) => ({
      ...current,
      items: [
        ...current.items,
        clampItemToGrid(item, current.columns, current.rows),
      ],
      selectedItemId: item.id,
    }));
  }

  function deleteSelectedItem() {
    if (!selectedItem || activeState.items.length <= 1) return;
    markCustom();
    commitActive((current) => {
      const items = current.items.filter((item) => item.id !== selectedItem.id);
      return {
        ...current,
        items,
        selectedItemId: items[0]?.id ?? null,
      };
    });
  }

  function importCssWorkspace(cssText: string) {
    try {
      const result = importGridCss(cssText, normalized);
      commit(result.state);
      setActivePreset("");
      setActiveBreakpoint("desktop");
      setEditorMode("select");
      const warningText = result.warnings.length
        ? ` ${result.warnings.join(" ")}`
        : "";
      return {
        ok: true,
        message: `Imported Grid CSS${result.importedRules ? ` with ${result.importedRules} item rule${result.importedRules === 1 ? "" : "s"}` : ""}.${warningText}`,
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Could not import this CSS.",
      };
    }
  }

  async function copyShareLink() {
    try {
      const url = createGridShareUrl(window.location.href, normalized);
      if (url.length > 8_000) {
        return {
          ok: false,
          message:
            "This workspace is too large for a reliable URL share link. Reduce the item count/content or use the generated code/tokens instead.",
        };
      }
      await navigator.clipboard.writeText(url);
      return { ok: true, message: "Share link copied." };
    } catch {
      return {
        ok: false,
        message:
          "Could not copy the share link. Your workspace is still saved locally in this browser.",
      };
    }
  }

  function resetWorkspace() {
    const next = createDefaultGridState();
    commit(next);
    setActivePreset("bento-grid");
    setActiveBreakpoint("desktop");
    setEditorMode("select");
  }

  function loadPreset(preset: GridPreset) {
    commit({
      ...preset.state,
      previewWidth: getSuggestedPreviewWidth(preset.state, "desktop"),
    });
    setActivePreset(preset.id);
    setActiveBreakpoint("desktop");
    setEditorMode("select");
  }

  function undoGridChange() {
    setActivePreset("");
    undo();
  }

  function redoGridChange() {
    setActivePreset("");
    redo();
  }

  return (
    <ToolLayoutVisualGenerator
      actionsPlacement="under-preview"
      previewSlot={
        <GridPreview
          state={activeState}
          messages={messages}
          editorMode={editorMode}
          activeBreakpoint={activeBreakpoint}
          canUndo={canUndo}
          canRedo={canRedo}
          onEditorModeChange={setEditorMode}
          onBreakpointChange={switchBreakpoint}
          onPatch={patchPreview}
          onSelectItem={selectItem}
          onMoveItem={moveItem}
          onCreateItem={createItem}
          onCommitItem={commitItem}
          onCommitNestedItem={commitNestedItem}
          onUndo={undoGridChange}
          onRedo={redoGridChange}
        />
      }
      controlsSlot={
        <GridControls
          state={activeState}
          activeBreakpoint={activeBreakpoint}
          activePreset={activePreset}
          selectedItem={selectedItem}
          onPatch={patchState}
          onResponsivePatch={patchResponsive}
          onBreakpointChange={switchBreakpoint}
          onConfigureBreakpoint={configureBreakpoint}
          onLoadPreset={loadPreset}
          onUpdateItem={updateSelectedItem}
          onAddItem={addItem}
          onDuplicateItem={duplicateSelectedItem}
          onDeleteItem={deleteSelectedItem}
          onImportCss={importCssWorkspace}
          onCopyShareLink={copyShareLink}
          onResetWorkspace={resetWorkspace}
        />
      }
      codeSlot={
        <GridCodeOutput
          css={css}
          cssVariables={cssVariables}
          html={html}
          jsx={jsx}
          tailwind={tailwind}
          tokens={tokens}
          areaMap={areaMap}
        />
      }
      presetsSlot={
        <WarningPanel
          title={`${activeBreakpoint[0].toUpperCase()}${activeBreakpoint.slice(1)} grid checks`}
          messages={
            messages.length
              ? messages
              : [
                  {
                    id: "ok",
                    severity: "success",
                    message: "The current breakpoint layout looks production-safe.",
                  },
                ]
          }
        />
      }
    />
  );
}
