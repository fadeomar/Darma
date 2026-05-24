import { Button } from "@/components/ui";
import { ControlSection, PresetGallery, SegmentedControl, ToolControlPanel } from "@/features/tools/components";
import { CSP_PRESETS } from "../presets";
import type { CspDirective, CspGeneratorState, CspPolicyMode, CspPreset } from "../types";
import { CspDirectiveCard } from "./CspDirectiveCard";
import { CspIntegrationPanel } from "./CspIntegrationPanel";

const modes: CspPolicyMode[] = ["basic", "strict-nonce", "hash", "report-only", "custom"];

export function CspControls({ state, selectedDirective, onPatch, onLoadPreset, onUpdateDirective, onAddSource, onRemoveSource }: { state: CspGeneratorState; selectedDirective: CspDirective | null; onPatch: (patch: Partial<CspGeneratorState>) => void; onLoadPreset: (preset: CspPreset) => void; onUpdateDirective: (id: string, patch: Partial<CspDirective>) => void; onAddSource: (directiveId: string, value: string) => void; onRemoveSource: (directiveId: string, sourceId: string) => void }) {
  return <ToolControlPanel title="CSP settings" description="Build a suggested policy with visible risk warnings. Test before production.">
    <ControlSection title="Presets"><PresetGallery presets={[...CSP_PRESETS]} selectedId={state.presetId} onSelect={(_, preset) => onLoadPreset(preset)} getId={(preset) => preset.id} getLabel={(preset) => preset.name} getDescription={(preset) => preset.description} /></ControlSection>
    <ControlSection title="Policy mode"><SegmentedControl ariaLabel="CSP policy mode" value={state.policyMode} onChange={(policyMode) => onPatch({ policyMode })} options={modes.map((value) => ({ value, label: value }))} /><div className="mt-2"><Button size="sm" variant={state.reportOnly ? "primary" : "secondary"} onClick={() => onPatch({ reportOnly: !state.reportOnly, exportOptions: { ...state.exportOptions, headerName: state.reportOnly ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only" } })}>Report-Only: {state.reportOnly ? "On" : "Off"}</Button></div></ControlSection>
    <ControlSection title="Directives" description="Risky sources are labeled on each chip."><div className="space-y-3">{state.directives.map((directive) => <CspDirectiveCard key={directive.id} directive={directive} selected={directive.id === selectedDirective?.id} onSelect={() => onPatch({ selectedDirectiveId: directive.id })} onToggle={(enabled) => onUpdateDirective(directive.id, { enabled })} onAddSource={(value) => onAddSource(directive.id, value)} onRemoveSource={(sourceId) => onRemoveSource(directive.id, sourceId)} />)}</div></ControlSection>
    <CspIntegrationPanel />
  </ToolControlPanel>;
}
