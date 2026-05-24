"use client";

import { useMemo, useState } from "react";
import { WarningPanel, type WarningMessage } from "@/features/tools/components";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import { createDefaultFlexState, createFlexItem, generateFlexCss, generateFlexHtml, generateFlexJsx, generateTailwindStarter, normalizeFlexState, validateFlexState } from "./flexbox";
import type { FlexGeneratorState, FlexItem, FlexPreset } from "./types";
import { FlexPreview } from "./components/FlexPreview";
import { FlexControls } from "./components/FlexControls";
import { FlexCodeOutput } from "./components/FlexCodeOutput";

export default function FlexboxGeneratorClient() {
  const [state, setState] = useState<FlexGeneratorState>(() => createDefaultFlexState());
  const [activePreset, setActivePreset] = useState("navbar");
  const normalized = useMemo(() => normalizeFlexState(state), [state]);
  const selectedItem = normalized.items.find((item) => item.id === normalized.selectedItemId) ?? normalized.items[0] ?? null;
  const css = useMemo(() => generateFlexCss(normalized), [normalized]);
  const html = useMemo(() => generateFlexHtml(normalized), [normalized]);
  const jsx = useMemo(() => generateFlexJsx(normalized), [normalized]);
  const tailwind = useMemo(() => generateTailwindStarter(normalized), [normalized]);
  const messages = useMemo<WarningMessage[]>(() => validateFlexState(normalized).map((message, index) => ({ id: `${message.type}-${index}`, severity: message.type === "error" ? "danger" : message.type === "warning" ? "warning" : "info", message: message.message })), [normalized]);
  function patchState(patch: Partial<FlexGeneratorState>) { setState((current) => normalizeFlexState({ ...current, ...patch })); }
  function updateSelectedItem(patch: Partial<FlexItem>) { if (!selectedItem) return; setState((current) => ({ ...current, items: current.items.map((item) => item.id === selectedItem.id ? { ...item, ...patch } : item) })); }
  function addItem() { const item = createFlexItem({ name: `Item ${normalized.items.length + 1}`, content: `Item ${normalized.items.length + 1}` }); patchState({ items: [...normalized.items, item], selectedItemId: item.id }); }
  function deleteItem() { if (!selectedItem || normalized.items.length <= 1) return; const items = normalized.items.filter((item) => item.id !== selectedItem.id); patchState({ items, selectedItemId: items[0]?.id ?? null }); }
  function loadPreset(preset: FlexPreset) { setState(normalizeFlexState(preset.state)); setActivePreset(preset.id); }

  return <ToolLayoutVisualGenerator previewSlot={<FlexPreview state={normalized} onPatch={patchState} onSelectItem={(id) => patchState({ selectedItemId: id })} />} controlsSlot={<FlexControls state={normalized} activePreset={activePreset} selectedItem={selectedItem} onPatch={patchState} onLoadPreset={loadPreset} onUpdateItem={updateSelectedItem} onAddItem={addItem} onDeleteItem={deleteItem} />} codeSlot={<FlexCodeOutput css={css} html={html} jsx={jsx} tailwind={tailwind} />} presetsSlot={<WarningPanel title="Flex checks" messages={messages.length ? messages : [{ id: "ok", severity: "success", message: "Flexbox settings look valid." }]} />} />;
}
