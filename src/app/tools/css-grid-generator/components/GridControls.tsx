import { Button, Input, Select } from "@/components/ui";
import { ColorField, ControlGrid, ControlSection, NumberField, PresetGallery, SegmentedControl, SliderNumberField, ToolControlPanel } from "@/features/tools/components";
import { GRID_PRESETS } from "../presets";
import type { GridAlignment, GridGeneratorState, GridItem, GridPreset, GridSelfAlignment, ResponsiveSettings } from "../types";

const selfAlign: GridSelfAlignment[] = ["auto", "stretch", "start", "center", "end"];
const align: GridAlignment[] = ["stretch", "start", "center", "end", "space-between", "space-around", "space-evenly"];
const mobileBehaviors: ResponsiveSettings["mobileBehavior"][] = ["stack", "two-column", "preserve"];

export function GridControls({
  state,
  activePreset,
  selectedItem,
  onPatch,
  onLoadPreset,
  onUpdateItem,
  onAddItem,
  onDuplicateItem,
  onDeleteItem,
}: {
  state: GridGeneratorState;
  activePreset: string;
  selectedItem: GridItem | null;
  onPatch: (patch: Partial<GridGeneratorState>) => void;
  onLoadPreset: (preset: GridPreset) => void;
  onUpdateItem: (patch: Partial<GridItem>) => void;
  onAddItem: () => void;
  onDuplicateItem: () => void;
  onDeleteItem: () => void;
}) {
  return (
    <ToolControlPanel title="Grid settings" description="Build a production-ready grid with compact controls, named areas, responsive output, and exports.">
      <ControlSection title="Presets" description="Start from common production layout patterns.">
        <PresetGallery
          presets={GRID_PRESETS}
          selectedId={activePreset}
          onSelect={(_, preset) => onLoadPreset(preset)}
          getId={(preset) => preset.id}
          getLabel={(preset) => preset.name}
          getDescription={(preset) => preset.description}
        />
      </ControlSection>

      <ControlSection title="Layout" description="Define tracks, spacing, output mode, and generated class names.">
        <ControlGrid columns={2}>
          <NumberField label="Columns" value={state.columns} min={1} max={12} onChange={(columns) => onPatch({ columns, columnTemplate: `repeat(${columns}, minmax(0, 1fr))` })} />
          <NumberField label="Rows" value={state.rows} min={1} max={12} onChange={(rows) => onPatch({ rows, rowTemplate: `repeat(${rows}, minmax(120px, auto))` })} />
          <SliderNumberField label="Row gap" value={state.gap.row} min={0} max={state.gap.unit === "rem" ? 6 : 96} step={state.gap.unit === "rem" ? 0.25 : 1} unit={state.gap.unit} onChange={(row) => onPatch({ gap: { ...state.gap, row } })} />
          <SliderNumberField label="Column gap" value={state.gap.column} min={0} max={state.gap.unit === "rem" ? 6 : 96} step={state.gap.unit === "rem" ? 0.25 : 1} unit={state.gap.unit} onChange={(column) => onPatch({ gap: { ...state.gap, column } })} />
        </ControlGrid>
        <div className="flex flex-wrap gap-2">
          <SegmentedControl ariaLabel="Gap unit" value={state.gap.unit} onChange={(unit) => onPatch({ gap: { ...state.gap, unit } })} options={[{ value: "rem", label: "rem" }, { value: "px", label: "px" }]} />
          <SegmentedControl ariaLabel="Placement mode" value={state.useTemplateAreas ? "areas" : "lines"} onChange={(mode) => onPatch({ useTemplateAreas: mode === "areas" })} options={[{ value: "lines", label: "Lines" }, { value: "areas", label: "Areas" }]} />
        </div>
        <ControlGrid columns={2}>
          <LabeledInput label="Container class" value={state.containerClassName} onChange={(containerClassName) => onPatch({ containerClassName })} />
          <LabeledInput label="Item prefix" value={state.itemClassPrefix} onChange={(itemClassPrefix) => onPatch({ itemClassPrefix })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Track templates" description="Edit the exact grid-template values when presets are not enough.">
        <LabeledInput label="Columns template" value={state.columnTemplate} onChange={(columnTemplate) => onPatch({ columnTemplate })} />
        <LabeledInput label="Rows template" value={state.rowTemplate} onChange={(rowTemplate) => onPatch({ rowTemplate })} />
      </ControlSection>

      <ControlSection title="Selected item" description={selectedItem ? selectedItem.name : "Select an item from the preview."} action={<Button size="sm" variant="secondary" onClick={onAddItem} disabled={state.items.length >= 24}>Add</Button>}>
        {selectedItem ? (
          <div className="space-y-3">
            <ControlGrid columns={2}>
              <LabeledInput label="Name" value={selectedItem.name} onChange={(name) => onUpdateItem({ name })} />
              <LabeledInput label="Area name" value={selectedItem.areaName} onChange={(areaName) => onUpdateItem({ areaName })} />
              <NumberField label="Column start" value={selectedItem.columnStart} min={1} max={state.columns} onChange={(columnStart) => onUpdateItem({ columnStart })} />
              <NumberField label="Column end" value={selectedItem.columnEnd} min={2} max={state.columns + 1} onChange={(columnEnd) => onUpdateItem({ columnEnd })} />
              <NumberField label="Row start" value={selectedItem.rowStart} min={1} max={state.rows} onChange={(rowStart) => onUpdateItem({ rowStart })} />
              <NumberField label="Row end" value={selectedItem.rowEnd} min={2} max={state.rows + 1} onChange={(rowEnd) => onUpdateItem({ rowEnd })} />
              <ColorField label="Background" value={selectedItem.background} onChange={(background) => onUpdateItem({ background })} />
              <ColorField label="Text" value={selectedItem.textColor} onChange={(textColor) => onUpdateItem({ textColor })} />
              <SliderNumberField label="Radius" value={selectedItem.borderRadius} min={0} max={48} step={1} unit="px" onChange={(borderRadius) => onUpdateItem({ borderRadius })} />
              <LabeledInput label="Padding" value={selectedItem.padding} onChange={(padding) => onUpdateItem({ padding })} />
              <CompactSelect label="Justify self" value={selectedItem.justifySelf} values={selfAlign} onChange={(justifySelf) => onUpdateItem({ justifySelf })} />
              <CompactSelect label="Align self" value={selectedItem.alignSelf} values={selfAlign} onChange={(alignSelf) => onUpdateItem({ alignSelf })} />
            </ControlGrid>
            <LabeledInput label="Content" value={selectedItem.content} onChange={(content) => onUpdateItem({ content })} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={onDuplicateItem} disabled={state.items.length >= 24}>Duplicate</Button>
              <Button size="sm" variant="danger" onClick={onDeleteItem} disabled={state.items.length <= 1}>Remove</Button>
            </div>
          </div>
        ) : null}
      </ControlSection>

      <ControlSection title="Alignment">
        <ControlGrid columns={2}>
          <CompactSelect label="Justify items" value={state.justifyItems} values={selfAlign} onChange={(justifyItems) => onPatch({ justifyItems })} />
          <CompactSelect label="Align items" value={state.alignItems} values={selfAlign} onChange={(alignItems) => onPatch({ alignItems })} />
          <CompactSelect label="Justify content" value={state.justifyContent} values={align} onChange={(justifyContent) => onPatch({ justifyContent })} />
          <CompactSelect label="Align content" value={state.alignContent} values={align} onChange={(alignContent) => onPatch({ alignContent })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Responsive" description="Control the generated media queries and mobile placement behavior.">
        <SegmentedControl ariaLabel="Responsive output" value={state.responsive.enabled ? "on" : "off"} onChange={(enabled) => onPatch({ responsive: { ...state.responsive, enabled: enabled === "on" } })} options={[{ value: "on", label: "On" }, { value: "off", label: "Off" }]} />
        <ControlGrid columns={2}>
          <NumberField label="Tablet" value={state.responsive.tabletBreakpoint} min={480} max={1200} unit="px" onChange={(tabletBreakpoint) => onPatch({ responsive: { ...state.responsive, tabletBreakpoint } })} />
          <NumberField label="Mobile" value={state.responsive.mobileBreakpoint} min={280} max={760} unit="px" onChange={(mobileBreakpoint) => onPatch({ responsive: { ...state.responsive, mobileBreakpoint } })} />
          <NumberField label="Tablet cols" value={state.responsive.tabletColumns} min={1} max={state.columns} onChange={(tabletColumns) => onPatch({ responsive: { ...state.responsive, tabletColumns } })} />
          <CompactSelect label="Mobile" value={state.responsive.mobileBehavior} values={mobileBehaviors} onChange={(mobileBehavior) => onPatch({ responsive: { ...state.responsive, mobileBehavior } })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Output options">
        <div className="flex flex-wrap gap-2">
          <SegmentedControl ariaLabel="Demo styles" value={state.includeDemoStyles ? "demo" : "layout"} onChange={(value) => onPatch({ includeDemoStyles: value === "demo" })} options={[{ value: "demo", label: "Demo CSS" }, { value: "layout", label: "Layout only" }]} />
          <SegmentedControl ariaLabel="Preview labels" value={state.showAreaNames ? "labels" : "names"} onChange={(value) => onPatch({ showAreaNames: value === "labels" })} options={[{ value: "labels", label: "Areas" }, { value: "names", label: "Names" }]} />
        </div>
      </ControlSection>
    </ToolControlPanel>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
      <span>{label}</span>
      <Input size="sm" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function CompactSelect<T extends string>({ label, value, values, onChange }: { label: string; value: T; values: T[]; onChange: (value: T) => void }) {
  return (
    <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
      <span>{label}</span>
      <Select size="sm" value={value} onChange={(event) => onChange(event.target.value as T)}>
        {values.map((item) => <option key={item} value={item}>{item}</option>)}
      </Select>
    </label>
  );
}
