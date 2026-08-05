"use client";

import { useEffect, useMemo, useState } from "react";
import { WarningPanel, type WarningMessage } from "@/features/tools/components";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import {
  createBreakpoint,
  createDefaultContainerQueryState,
  createStyleRule,
  duplicateBreakpoint,
  generateContainerQueryAudit,
  generateContainerQueryCss,
  generateContainerQueryExplanation,
  generateContainerQueryFallbackCss,
  generateContainerQueryHtml,
  generateContainerQueryJsx,
  generateContainerQueryTailwind,
  generateContainerQueryTokenJson,
  generateContainerQueryVariables,
  getActiveBreakpoints,
  getContainerQuerySummary,
  normalizeContainerQueryState,
  validateContainerQueryState,
} from "./containerQuery";
import { CONTAINER_QUERY_PRESETS } from "./presets";
import type { ComponentPresetId, ContainerBreakpoint, ContainerQueryState, ContainerStyleRule } from "./types";
import { ContainerPreview } from "./components/ContainerPreview";
import { ContainerControls } from "./components/ContainerControls";
import { ContainerCodeOutput } from "./components/ContainerCodeOutput";

export default function ContainerQueryGeneratorClient() {
  const [state, setState] = useState<ContainerQueryState>(() => createDefaultContainerQueryState());
  const normalized = useMemo(() => normalizeContainerQueryState(state), [state]);
  const activeBreakpoints = useMemo(() => getActiveBreakpoints(normalized, normalized.previewWidth), [normalized]);
  const selectedBreakpoint = normalized.breakpoints.find((item) => item.id === normalized.selectedBreakpointId) ?? normalized.breakpoints[0] ?? null;
  const summary = useMemo(() => getContainerQuerySummary(normalized), [normalized]);
  const css = useMemo(() => generateContainerQueryCss(normalized), [normalized]);
  const variables = useMemo(() => generateContainerQueryVariables(normalized), [normalized]);
  const fallback = useMemo(() => generateContainerQueryFallbackCss(normalized), [normalized]);
  const html = useMemo(() => generateContainerQueryHtml(normalized), [normalized]);
  const jsx = useMemo(() => generateContainerQueryJsx(normalized), [normalized]);
  const tailwind = useMemo(() => generateContainerQueryTailwind(normalized), [normalized]);
  const tokens = useMemo(() => generateContainerQueryTokenJson(normalized), [normalized]);
  const explanation = useMemo(() => generateContainerQueryExplanation(normalized), [normalized]);
  const audit = useMemo(() => generateContainerQueryAudit(normalized), [normalized]);
  const messages = useMemo<WarningMessage[]>(() => validateContainerQueryState(normalized).map((message, index) => ({
    id: `${message.type}-${index}`,
    severity: message.type === "error" ? "danger" : message.type === "warning" ? "warning" : message.type === "success" ? "success" : "info",
    message: message.message,
  })), [normalized]);

  useEffect(() => {
    const presetId = new URLSearchParams(window.location.search).get("preset");
    const preset = CONTAINER_QUERY_PRESETS.find((item) => item.id === presetId);
    if (preset) setState(normalizeContainerQueryState(preset.state));
  }, []);

  function patchState(patch: Partial<ContainerQueryState>) {
    setState((current) => normalizeContainerQueryState({ ...current, ...patch }));
  }

  function loadPreset(id: ComponentPresetId) {
    const preset = CONTAINER_QUERY_PRESETS.find((item) => item.id === id);
    if (preset) setState(normalizeContainerQueryState(preset.state));
  }

  function updateBreakpoint(patch: Partial<ContainerBreakpoint>) {
    if (!selectedBreakpoint) return;
    patchState({ breakpoints: normalized.breakpoints.map((item) => item.id === selectedBreakpoint.id ? { ...item, ...patch } : item) });
  }

  function updateRule(ruleId: string, patch: Partial<ContainerStyleRule>) {
    if (!selectedBreakpoint) return;
    updateBreakpoint({ styles: selectedBreakpoint.styles.map((rule) => rule.id === ruleId ? { ...rule, ...patch } : rule) });
  }

  function addRule() {
    if (!selectedBreakpoint) return;
    updateBreakpoint({ styles: [...selectedBreakpoint.styles, createStyleRule({ selector: `.${normalized.componentClassName}` })] });
  }

  function removeRule(ruleId: string) {
    if (!selectedBreakpoint) return;
    updateBreakpoint({ styles: selectedBreakpoint.styles.filter((rule) => rule.id !== ruleId) });
  }

  function addBreakpoint() {
    const breakpoint = createBreakpoint({
      name: `Breakpoint ${normalized.breakpoints.length + 1}`,
      minWidth: Math.min(1100, normalized.previewWidth + 120),
      styles: [createStyleRule({ selector: `.${normalized.componentClassName}`, property: "gap", value: "1.25rem" })],
    });
    patchState({ breakpoints: [...normalized.breakpoints, breakpoint], selectedBreakpointId: breakpoint.id });
  }

  function removeBreakpoint(id: string) {
    const next = normalized.breakpoints.filter((item) => item.id !== id);
    patchState({ breakpoints: next, selectedBreakpointId: next[0]?.id ?? null });
  }

  function duplicateSelectedBreakpoint() {
    if (!selectedBreakpoint) return;
    const copy = duplicateBreakpoint(selectedBreakpoint);
    patchState({ breakpoints: [...normalized.breakpoints, copy], selectedBreakpointId: copy.id });
  }

  return (
    <ToolLayoutVisualGenerator
      previewSlot={<ContainerPreview state={normalized} summary={summary} activeBreakpoints={activeBreakpoints} onPatch={patchState} />}
      controlsSlot={<ContainerControls state={normalized} selectedBreakpoint={selectedBreakpoint} summary={summary} onPatch={patchState} onLoadPreset={loadPreset} onUpdateBreakpoint={updateBreakpoint} onUpdateRule={updateRule} onAddRule={addRule} onRemoveRule={removeRule} onAddBreakpoint={addBreakpoint} onRemoveBreakpoint={removeBreakpoint} onDuplicateBreakpoint={duplicateSelectedBreakpoint} />}
      codeSlot={<ContainerCodeOutput css={css} variables={variables} fallback={fallback} html={html} jsx={jsx} tailwind={tailwind} tokens={tokens} explanation={explanation} audit={audit} />}
      presetsSlot={<WarningPanel title="Production checks" messages={messages.length ? messages : [{ id: "ok", severity: "success", message: "Container query settings look valid." }]} />}
    />
  );
}
