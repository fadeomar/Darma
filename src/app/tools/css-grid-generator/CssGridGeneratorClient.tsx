"use client";

import { useMemo, useState } from "react";
import { WarningPanel, type WarningMessage } from "@/features/tools/components";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import { clampItemToGrid, createDefaultGridState, createGridItem, generateGridCss, generateGridHtml, generateGridJsx, generateTailwindStarter, normalizeGridState, validateGridState } from "./grid";
import type { GridGeneratorState, GridItem, GridPreset } from "./types";
import { GridPreview } from "./components/GridPreview";
import { GridControls } from "./components/GridControls";
import { GridCodeOutput } from "./components/GridCodeOutput";

export default function CssGridGeneratorClient() {
  const [state, setState] = useState<GridGeneratorState>(() => createDefaultGridState());
  const [activePreset, setActivePreset] = useState("bento-grid");
  const normalized = useMemo(() => normalizeGridState(state), [state]);
  const selectedItem = normalized.items.find((item) => item.id === normalized.selectedItemId) ?? normalized.items[0] ?? null;
  const css = useMemo(() => generateGridCss(normalized), [normalized]);
  const html = useMemo(() => generateGridHtml(normalized), [normalized]);
  const jsx = useMemo(() => generateGridJsx(normalized), [normalized]);
  const tailwind = useMemo(() => generateTailwindStarter(normalized), [normalized]);
  const messages = useMemo<WarningMessage[]>(() => validateGridState(normalized).map((message, index) => ({ id: `${message.type}-${index}`, severity: message.type === "error" ? "danger" : message.type === "warning" ? "warning" : "info", message: message.message })), [normalized]);

  function patchState(patch: Partial<GridGeneratorState>) {
    setState((current) => normalizeGridState({ ...current, ...patch }));
  }

  function updateSelectedItem(patch: Partial<GridItem>) {
    if (!selectedItem) return;
    setState((current) => ({
      ...current,
      items: current.items.map((item) => item.id === selectedItem.id ? clampItemToGrid({ ...item, ...patch }, current.columns, current.rows) : item),
    }));
  }

  function addItem() {
    const item = createGridItem({ name: `Item ${normalized.items.length + 1}`, areaName: `item${normalized.items.length + 1}`, content: `Item ${normalized.items.length + 1}` });
    patchState({ items: [...normalized.items, item], selectedItemId: item.id });
  }

  function duplicateSelectedItem() {
    if (!selectedItem || normalized.items.length >= 24) return;
    const item = createGridItem({ ...selectedItem, id: undefined, name: `${selectedItem.name} copy`, areaName: `${selectedItem.areaName}Copy`, content: `${selectedItem.content} copy` });
    patchState({ items: [...normalized.items, clampItemToGrid(item, normalized.columns, normalized.rows)], selectedItemId: item.id });
  }

  function deleteSelectedItem() {
    if (!selectedItem || normalized.items.length <= 1) return;
    const items = normalized.items.filter((item) => item.id !== selectedItem.id);
    patchState({ items, selectedItemId: items[0]?.id ?? null });
  }

  function loadPreset(preset: GridPreset) {
    setState(normalizeGridState(preset.state));
    setActivePreset(preset.id);
  }

  return (
    <ToolLayoutVisualGenerator
      previewSlot={<GridPreview state={normalized} onPatch={patchState} onSelectItem={(id) => patchState({ selectedItemId: id })} />}
      controlsSlot={<GridControls state={normalized} activePreset={activePreset} selectedItem={selectedItem} onPatch={patchState} onLoadPreset={loadPreset} onUpdateItem={updateSelectedItem} onAddItem={addItem} onDuplicateItem={duplicateSelectedItem} onDeleteItem={deleteSelectedItem} />}
      codeSlot={<GridCodeOutput css={css} html={html} jsx={jsx} tailwind={tailwind} />}
      presetsSlot={<WarningPanel title="Grid checks" messages={messages.length ? messages : [{ id: "ok", severity: "success", message: "The current grid settings look valid." }]} />}
    />
  );
}
