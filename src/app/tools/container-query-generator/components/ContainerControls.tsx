import { Button, Input, Select } from "@/components/ui";
import { ControlGrid, ControlSection, NumberField, PresetGallery, SegmentedControl, ToolControlPanel } from "@/features/tools/components";
import { CONTAINER_QUERY_PRESETS } from "../presets";
import type { ComponentPresetId, ContainerBreakpoint, ContainerConditionType, ContainerQueryState, ContainerStyleRule, ContainerType } from "../types";

const containerTypes: ContainerType[] = ["inline-size", "size", "normal"];
const conditionTypes: ContainerConditionType[] = ["min-width", "max-width", "range"];

export function ContainerControls({ state, selectedBreakpoint, onPatch, onLoadPreset, onUpdateBreakpoint, onUpdateRule, onAddRule }: { state: ContainerQueryState; selectedBreakpoint: ContainerBreakpoint | null; onPatch: (patch: Partial<ContainerQueryState>) => void; onLoadPreset: (id: ComponentPresetId) => void; onUpdateBreakpoint: (patch: Partial<ContainerBreakpoint>) => void; onUpdateRule: (ruleId: string, patch: Partial<ContainerStyleRule>) => void; onAddRule: () => void }) {
  return <ToolControlPanel title="Container query settings" description="Tune parent container behavior and active style rules.">
    <ControlSection title="Presets"><PresetGallery presets={CONTAINER_QUERY_PRESETS} selectedId={state.presetId} onSelect={(id) => onLoadPreset(id as ComponentPresetId)} getId={(preset) => preset.id} getLabel={(preset) => preset.name} getDescription={(preset) => preset.description} /></ControlSection>
    <ControlSection title="Container"><ControlGrid columns={2}><NumberField label="Preview width" value={state.previewWidth} min={280} max={1200} unit="px" onChange={(previewWidth) => onPatch({ previewWidth })} /><label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]"><span>Name</span><Input size="sm" value={state.containerName} onChange={(e) => onPatch({ containerName: e.target.value })} /></label></ControlGrid><div className="mt-3"><SegmentedControl ariaLabel="Container type" value={state.containerType} onChange={(containerType) => onPatch({ containerType })} options={containerTypes.map((value) => ({ value, label: value }))} /></div></ControlSection>
    <ControlSection title="Selected breakpoint" action={<Button size="sm" variant="secondary" onClick={onAddRule} disabled={!selectedBreakpoint}>Add rule</Button>}>
      {selectedBreakpoint ? <div className="space-y-3"><Input size="sm" value={selectedBreakpoint.name} onChange={(e) => onUpdateBreakpoint({ name: e.target.value })} aria-label="Breakpoint name" /><SegmentedControl ariaLabel="Condition type" value={selectedBreakpoint.conditionType} onChange={(conditionType) => onUpdateBreakpoint({ conditionType })} options={conditionTypes.map((value) => ({ value, label: value }))} /><ControlGrid columns={2}><NumberField label="Min" value={selectedBreakpoint.minWidth ?? 0} min={0} max={1600} unit={selectedBreakpoint.unit} onChange={(minWidth) => onUpdateBreakpoint({ minWidth })} /><NumberField label="Max" value={selectedBreakpoint.maxWidth ?? 0} min={0} max={1600} unit={selectedBreakpoint.unit} onChange={(maxWidth) => onUpdateBreakpoint({ maxWidth })} /></ControlGrid>{selectedBreakpoint.styles.map((rule) => <StyleRuleRow key={rule.id} rule={rule} onUpdate={(patch) => onUpdateRule(rule.id, patch)} />)}</div> : null}
    </ControlSection>
  </ToolControlPanel>;
}

function StyleRuleRow({ rule, onUpdate }: { rule: ContainerStyleRule; onUpdate: (patch: Partial<ContainerStyleRule>) => void }) {
  return <div className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-2 sm:grid-cols-3"><Input size="sm" value={rule.selector} onChange={(e) => onUpdate({ selector: e.target.value })} aria-label="Rule selector" /><Input size="sm" value={rule.property} onChange={(e) => onUpdate({ property: e.target.value })} aria-label="Rule property" /><Input size="sm" value={rule.value} onChange={(e) => onUpdate({ value: e.target.value })} aria-label="Rule value" /></div>;
}
