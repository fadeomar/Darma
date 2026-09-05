import { Button, Input, Select } from "@/components/ui";
import { ControlGrid, ControlSection, NumberField, PresetGallery, SegmentedControl, ToolControlPanel } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import { CONTAINER_QUERY_PRESETS } from "../presets";
import type { ComponentPresetId, ContainerBreakpoint, ContainerConditionType, ContainerPreviewMode, ContainerQueryState, ContainerQuerySummary, ContainerStyleRule, ContainerType, ContainerUnit } from "../types";
import { formatContainerCondition } from "../containerQuery";

const containerTypes: ContainerType[] = ["inline-size", "size", "normal"];
const conditionTypes: ContainerConditionType[] = ["min-width", "max-width", "range"];
const units: ContainerUnit[] = ["px", "rem", "em"];
const previewModes: ContainerPreviewMode[] = ["card", "product", "dashboard", "article"];
const propertyPresets = ["display", "grid-template-columns", "grid-template-rows", "gap", "padding", "font-size", "aspect-ratio", "align-items", "justify-content", "opacity"];

export function ContainerControls({
  state,
  selectedBreakpoint,
  summary,
  onPatch,
  onLoadPreset,
  onUpdateBreakpoint,
  onUpdateRule,
  onAddRule,
  onRemoveRule,
  onAddBreakpoint,
  onRemoveBreakpoint,
  onDuplicateBreakpoint,
}: {
  state: ContainerQueryState;
  selectedBreakpoint: ContainerBreakpoint | null;
  summary: ContainerQuerySummary;
  onPatch: (patch: Partial<ContainerQueryState>) => void;
  onLoadPreset: (id: ComponentPresetId) => void;
  onUpdateBreakpoint: (patch: Partial<ContainerBreakpoint>) => void;
  onUpdateRule: (ruleId: string, patch: Partial<ContainerStyleRule>) => void;
  onAddRule: () => void;
  onRemoveRule: (ruleId: string) => void;
  onAddBreakpoint: () => void;
  onRemoveBreakpoint: (id: string) => void;
  onDuplicateBreakpoint: () => void;
}) {
  return (
    <ToolControlPanel title="Container query settings" description="Build component-level responsive rules without making the control panel too long.">
      <ControlSection title="Quick presets" description="Start from a real component pattern, then tune its breakpoints and rules.">
        <PresetGallery
          presets={CONTAINER_QUERY_PRESETS}
          selectedId={state.presetId}
          onSelect={(id) => onLoadPreset(id as ComponentPresetId)}
          getId={(preset) => preset.id}
          getLabel={(preset) => preset.name}
          getDescription={(preset) => preset.description}
          initialVisibleCount={6}
          showMoreLabel="Show all component patterns"
          showLessLabel="Show fewer component patterns"
        />
      </ControlSection>

      <ControlSection title="Project summary">
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <Metric label="Breakpoints" value={summary.breakpoints} />
          <Metric label="Rules" value={summary.rules} />
          <Metric label="Active" value={summary.active} />
          <Metric label="Max" value={`${summary.maxWidth}px`} />
        </div>
      </ControlSection>

      <ControlSection title="Container">
        <ControlGrid columns={2}>
          <NumberField label="Preview width" value={state.previewWidth} min={260} max={1200} unit="px" onChange={(previewWidth) => onPatch({ previewWidth })} />
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
            <span>Name</span>
            <Input size="sm" value={state.containerName} onChange={(e) => onPatch({ containerName: e.target.value })} />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
            <span>Selector</span>
            <Input size="sm" value={state.containerSelector} onChange={(e) => onPatch({ containerSelector: e.target.value })} />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
            <span>Component class</span>
            <Input size="sm" value={state.componentClassName} onChange={(e) => onPatch({ componentClassName: e.target.value })} />
          </label>
        </ControlGrid>
        <div className="mt-3 space-y-3">
          <SegmentedControl ariaLabel="Container type" value={state.containerType} onChange={(containerType) => onPatch({ containerType })} options={containerTypes.map((value) => ({ value, label: value }))} />
          <SegmentedControl ariaLabel="Preview mode" value={state.previewMode} onChange={(previewMode) => onPatch({ previewMode })} options={previewModes.map((value) => ({ value, label: value }))} />
        </div>
      </ControlSection>

      <ControlSection title="Preview options">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Toggle label="Outline" active={state.showContainerOutline} onClick={() => onPatch({ showContainerOutline: !state.showContainerOutline })} />
          <Toggle label="Markers" active={state.showBreakpointMarkers} onClick={() => onPatch({ showBreakpointMarkers: !state.showBreakpointMarkers })} />
          <Toggle label="Active rules" active={state.showActiveRules} onClick={() => onPatch({ showActiveRules: !state.showActiveRules })} />
          <Toggle label="Demo content" active={state.showDemoContent} onClick={() => onPatch({ showDemoContent: !state.showDemoContent })} />
        </div>
      </ControlSection>

      <ControlSection title="Breakpoints" action={<Button size="sm" variant="secondary" onClick={onAddBreakpoint} disabled={state.breakpoints.length >= 8}>Add</Button>}>
        <div className="space-y-2">
          {state.breakpoints.map((breakpoint) => {
            const selected = breakpoint.id === state.selectedBreakpointId;
            return (
              <button key={breakpoint.id} type="button" onClick={() => onPatch({ selectedBreakpointId: breakpoint.id })} className={cn("w-full rounded-[var(--radius-md)] border p-2 text-left text-xs transition", selected ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10" : "border-[var(--color-border)] bg-[var(--color-surface-strong)] hover:border-[var(--color-border-strong)]")}>
                <span className="flex min-w-0 items-center justify-between gap-2">
                  <strong className="truncate text-[var(--color-text)]">{breakpoint.name}</strong>
                  <span className="shrink-0 rounded-full bg-[var(--color-bg-soft)] px-2 py-0.5 text-xs font-bold text-[var(--color-text-soft)]">{breakpoint.styles.length} rules</span>
                </span>
                <span className="mt-1 block truncate font-mono text-xs text-[var(--color-text-soft)]">{formatContainerCondition(breakpoint)}</span>
              </button>
            );
          })}
        </div>
      </ControlSection>

      <ControlSection title="Selected breakpoint" action={<div className="flex gap-2"><Button size="sm" variant="secondary" onClick={onDuplicateBreakpoint} disabled={!selectedBreakpoint}>Duplicate</Button><Button size="sm" variant="secondary" onClick={onAddRule} disabled={!selectedBreakpoint}>Add rule</Button></div>}>
        {selectedBreakpoint ? (
          <div className="space-y-3">
            <ControlGrid columns={2}>
              <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
                <span>Label</span>
                <Input size="sm" value={selectedBreakpoint.name} onChange={(e) => onUpdateBreakpoint({ name: e.target.value })} aria-label="Breakpoint name" />
              </label>
              <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
                <span>Unit</span>
                <Select size="sm" value={selectedBreakpoint.unit} onChange={(e) => onUpdateBreakpoint({ unit: e.target.value as ContainerUnit })}>{units.map((unit) => <option key={unit}>{unit}</option>)}</Select>
              </label>
            </ControlGrid>
            <SegmentedControl ariaLabel="Condition type" value={selectedBreakpoint.conditionType} onChange={(conditionType) => onUpdateBreakpoint({ conditionType })} options={conditionTypes.map((value) => ({ value, label: value }))} />
            <ControlGrid columns={2}>
              <NumberField label="Min" value={selectedBreakpoint.minWidth ?? 0} min={0} max={1600} unit={selectedBreakpoint.unit} onChange={(minWidth) => onUpdateBreakpoint({ minWidth })} />
              <NumberField label="Max" value={selectedBreakpoint.maxWidth ?? 0} min={0} max={1600} unit={selectedBreakpoint.unit} onChange={(maxWidth) => onUpdateBreakpoint({ maxWidth })} />
            </ControlGrid>
            <div className="space-y-2">
              {selectedBreakpoint.styles.map((rule) => <StyleRuleRow key={rule.id} rule={rule} onUpdate={(patch) => onUpdateRule(rule.id, patch)} onRemove={() => onRemoveRule(rule.id)} />)}
            </div>
            <Button size="sm" variant="secondary" onClick={() => onRemoveBreakpoint(selectedBreakpoint.id)} disabled={state.breakpoints.length <= 1}>Remove breakpoint</Button>
          </div>
        ) : <p className="text-xs text-[var(--color-text-soft)]">Add a breakpoint to start creating container rules.</p>}
      </ControlSection>

      <ControlSection title="Export options">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Toggle label="Comments" active={state.exportOptions.includeComments} onClick={() => onPatch({ exportOptions: { ...state.exportOptions, includeComments: !state.exportOptions.includeComments } })} />
          <Toggle label="Demo CSS" active={state.exportOptions.includeDemoStyles} onClick={() => onPatch({ exportOptions: { ...state.exportOptions, includeDemoStyles: !state.exportOptions.includeDemoStyles } })} />
          <Toggle label="@supports" active={state.exportOptions.includeSupportsGuard} onClick={() => onPatch({ exportOptions: { ...state.exportOptions, includeSupportsGuard: !state.exportOptions.includeSupportsGuard } })} />
          <Toggle label="Fallback" active={state.exportOptions.includeFallbackLayer} onClick={() => onPatch({ exportOptions: { ...state.exportOptions, includeFallbackLayer: !state.exportOptions.includeFallbackLayer } })} />
          <Toggle label="cqi units" active={state.exportOptions.includeContainerUnits} onClick={() => onPatch({ exportOptions: { ...state.exportOptions, includeContainerUnits: !state.exportOptions.includeContainerUnits } })} />
          <Toggle label="Media compare" active={state.exportOptions.includeMediaQueryComparison} onClick={() => onPatch({ exportOptions: { ...state.exportOptions, includeMediaQueryComparison: !state.exportOptions.includeMediaQueryComparison } })} />
        </div>
      </ControlSection>
    </ToolControlPanel>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-2"><div className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-soft)]">{label}</div><div className="mt-1 truncate text-sm font-black text-[var(--color-text)]">{value}</div></div>;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("rounded-[var(--radius-sm)] border px-2 py-1.5 text-left font-bold transition", active ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent-text)]" : "border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-text-soft)]")}>{label}</button>;
}

function StyleRuleRow({ rule, onUpdate, onRemove }: { rule: ContainerStyleRule; onUpdate: (patch: Partial<ContainerStyleRule>) => void; onRemove: () => void }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input size="sm" value={rule.selector} onChange={(e) => onUpdate({ selector: e.target.value })} aria-label="Rule selector" />
        <Select size="sm" value={propertyPresets.includes(rule.property) ? rule.property : "custom"} onChange={(e) => e.target.value !== "custom" ? onUpdate({ property: e.target.value }) : null} aria-label="Rule property preset">
          {propertyPresets.map((property) => <option key={property}>{property}</option>)}
          <option value="custom">custom</option>
        </Select>
        <Button size="sm" variant="secondary" onClick={onRemove}>Remove</Button>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Input size="sm" value={rule.property} onChange={(e) => onUpdate({ property: e.target.value })} aria-label="Rule property" />
        <Input size="sm" value={rule.value} onChange={(e) => onUpdate({ value: e.target.value })} aria-label="Rule value" />
      </div>
    </div>
  );
}
