"use client";

import { useMemo, useState } from "react";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import { calculateCspRiskLevel, createDefaultCspState, createSource, generateApacheHeader, generateCspExplanation, generateCspHeader, generateCspMetaTag, generateExpressMiddleware, generateNextJsHeadersConfig, generateNginxHeader, validateCspState } from "./csp";
import type { CspDirective, CspGeneratorState, CspPreset } from "./types";
import { CspControls } from "./components/CspControls";
import { CspCodeOutput } from "./components/CspCodeOutput";
import { CspRiskPanel } from "./components/CspRiskPanel";

export default function CspGeneratorClient() {
  const [state, setState] = useState<CspGeneratorState>(() => createDefaultCspState());
  const selectedDirective = state.directives.find((directive) => directive.id === state.selectedDirectiveId) ?? state.directives[0] ?? null;
  const messages = useMemo(() => validateCspState(state), [state]);
  const risk = useMemo(() => calculateCspRiskLevel(state), [state]);
  const header = useMemo(() => generateCspHeader(state), [state]);
  const meta = useMemo(() => generateCspMetaTag(state), [state]);
  const nextjs = useMemo(() => generateNextJsHeadersConfig(state), [state]);
  const nginx = useMemo(() => generateNginxHeader(state), [state]);
  const apache = useMemo(() => generateApacheHeader(state), [state]);
  const express = useMemo(() => generateExpressMiddleware(state), [state]);
  const explanation = useMemo(() => `Risk level: ${risk}\n\n${generateCspExplanation(state)}`, [state, risk]);
  function patchState(patch: Partial<CspGeneratorState>) { setState((current) => ({ ...current, ...patch })); }
  function updateDirective(id: string, patch: Partial<CspDirective>) { patchState({ directives: state.directives.map((directive) => directive.id === id ? { ...directive, ...patch } : directive) }); }
  function addSource(directiveId: string, value: string) { const directive = state.directives.find((item) => item.id === directiveId); if (!directive) return; updateDirective(directiveId, { sources: [...directive.sources, createSource(value, directive.name)] }); }
  function removeSource(directiveId: string, sourceId: string) { const directive = state.directives.find((item) => item.id === directiveId); if (!directive) return; updateDirective(directiveId, { sources: directive.sources.filter((source) => source.id !== sourceId) }); }
  function loadPreset(preset: CspPreset) { setState(preset.state); }
  return <ToolLayoutVisualGenerator previewSlot={<CspRiskPanel messages={messages.length ? messages : [{ type: "info", severity: "low", message: "No immediate warnings detected. Still test before production." }]} />} controlsSlot={<CspControls state={state} selectedDirective={selectedDirective} onPatch={patchState} onLoadPreset={loadPreset} onUpdateDirective={updateDirective} onAddSource={addSource} onRemoveSource={removeSource} />} codeSlot={<CspCodeOutput header={header} meta={meta} nextjs={nextjs} nginx={nginx} apache={apache} express={express} explanation={explanation} />} />;
}
