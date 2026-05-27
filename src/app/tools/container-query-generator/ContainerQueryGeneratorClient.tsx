"use client";

import { useMemo, useState } from "react";
import { WarningPanel, type WarningMessage } from "@/features/tools/components";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import { createDefaultContainerQueryState, createStyleRule, generateContainerQueryCss, generateContainerQueryExplanation, generateContainerQueryHtml, generateContainerQueryJsx, getActiveBreakpoints, normalizeContainerQueryState, validateContainerQueryState, withPresetId } from "./containerQuery";
import type { ComponentPresetId, ContainerBreakpoint, ContainerQueryState, ContainerStyleRule } from "./types";
import { ContainerPreview } from "./components/ContainerPreview";
import { ContainerControls } from "./components/ContainerControls";
import { ContainerCodeOutput } from "./components/ContainerCodeOutput";

export default function ContainerQueryGeneratorClient() {
  const [state, setState] = useState<ContainerQueryState>(() => createDefaultContainerQueryState());
  const normalized = useMemo(() => normalizeContainerQueryState(state), [state]);
  const activeBreakpoints = useMemo(() => getActiveBreakpoints(normalized, normalized.previewWidth), [normalized]);
  const selectedBreakpoint = normalized.breakpoints.find((item) => item.id === normalized.selectedBreakpointId) ?? normalized.breakpoints[0] ?? null;
  const css = useMemo(() => generateContainerQueryCss(normalized), [normalized]);
  const html = useMemo(() => generateContainerQueryHtml(normalized), [normalized]);
  const jsx = useMemo(() => generateContainerQueryJsx(normalized), [normalized]);
  const explanation = useMemo(() => generateContainerQueryExplanation(normalized), [normalized]);
  const messages = useMemo<WarningMessage[]>(() => validateContainerQueryState(normalized).map((message, index) => ({ id: `${message.type}-${index}`, severity: message.type === "error" ? "danger" : message.type === "warning" ? "warning" : "info", message: message.message })), [normalized]);
  function patchState(patch: Partial<ContainerQueryState>) { setState((current) => normalizeContainerQueryState({ ...current, ...patch })); }
  function loadPreset(id: ComponentPresetId) { setState(normalizeContainerQueryState(withPresetId(normalized, id))); }
  function updateBreakpoint(patch: Partial<ContainerBreakpoint>) { if (!selectedBreakpoint) return; patchState({ breakpoints: normalized.breakpoints.map((item) => item.id === selectedBreakpoint.id ? { ...item, ...patch } : item) }); }
  function updateRule(ruleId: string, patch: Partial<ContainerStyleRule>) { if (!selectedBreakpoint) return; updateBreakpoint({ styles: selectedBreakpoint.styles.map((rule) => rule.id === ruleId ? { ...rule, ...patch } : rule) }); }
  function addRule() { if (!selectedBreakpoint) return; updateBreakpoint({ styles: [...selectedBreakpoint.styles, createStyleRule({ selector: `.${normalized.componentClassName}` })] }); }

  return <ToolLayoutVisualGenerator previewSlot={<ContainerPreview state={normalized} activeBreakpoints={activeBreakpoints} onPatch={patchState} />} controlsSlot={<ContainerControls state={normalized} selectedBreakpoint={selectedBreakpoint} onPatch={patchState} onLoadPreset={loadPreset} onUpdateBreakpoint={updateBreakpoint} onUpdateRule={updateRule} onAddRule={addRule} />} codeSlot={<ContainerCodeOutput css={css} html={html} jsx={jsx} explanation={explanation} />} presetsSlot={<WarningPanel title="Container query checks" messages={messages.length ? messages : [{ id: "ok", severity: "success", message: "Container query settings look valid." }]} />} />;
}
