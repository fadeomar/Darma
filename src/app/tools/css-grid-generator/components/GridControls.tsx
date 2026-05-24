import { Button, Input, Select } from "@/components/ui";
import { ColorField, ControlGrid, ControlSection, NumberField, PresetGallery, SegmentedControl, SliderNumberField, ToolControlPanel } from "@/features/tools/components";
import { GRID_PRESETS } from "../presets";
import type { GridAlignment, GridGeneratorState, GridItem, GridPreset, GridSelfAlignment } from "../types";

const selfAlign: GridSelfAlignment[] = ["auto", "stretch", "start", "center", "end"];
const align: GridAlignment[] = ["stretch", "start", "center", "end", "space-between", "space-around", "space-evenly"];

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
    <ToolControlPanel title="Grid settings" description="Build the layout with compact controls and visual presets.">
      <ControlSection title="Presets" description="Start from common layout patterns.">
        <PresetGallery
          presets={GRID_PRESETS}
          selectedId={activePreset}
          onSelect={(_, preset) => onLoadPreset(preset)}
          getId={(preset) => preset.id}
          getLabel={(preset) => preset.name}
          getDescription={(preset) => preset.description}
        />
      </ControlSection>

      <ControlSection title="Layout" description="Define tracks, spacing, and preview width.">
        <ControlGrid columns={2}>
          <NumberField label="Columns" value={state.columns} min={1} max={12} onChange={(columns) => onPatch({ columns, columnTemplate: `repeat(${columns}, minmax(0, 1fr))` })} />
          <NumberField label="Rows" value={state.rows} min={1} max={12} onChange={(rows) => onPatch({ rows, rowTemplate: `repeat(${rows}, minmax(120px, auto))` })} />
          <SliderNumberField label="Row gap" value={state.gap.row} min={0} max={state.gap.unit === "rem" ? 6 : 96} step={state.gap.unit === "rem" ? 0.25 : 1} unit={state.gap.unit} onChange={(row) => onPatch({ gap: { ...state.gap, row } })} />
          <SliderNumberField label="Column gap" value={state.gap.column} min={0} max={state.gap.unit === "rem" ? 6 : 96} step={state.gap.unit === "rem" ? 0.25 : 1} unit={state.gap.unit} onChange={(column) => onPatch({ gap: { ...state.gap, column } })} />
        </ControlGrid>
        <div className="mt-3">
          <SegmentedControl ariaLabel="Gap unit" value={state.gap.unit} onChange={(unit) => onPatch({ gap: { ...state.gap, unit } })} options={[{ value: "rem", label: "rem" }, { value: "px", label: "px" }]} />
        </div>
      </ControlSection>

      <ControlSection title="Selected item" description={selectedItem ? selectedItem.name : "Select an item from the preview."} action={<Button size="sm" variant="secondary" onClick={onAddItem}>Add</Button>}>
        {selectedItem ? (
          <div className="space-y-3">
            <ControlGrid columns={2}>
              <NumberField label="Column start" value={selectedItem.columnStart} min={1} max={state.columns} onChange={(columnStart) => onUpdateItem({ columnStart })} />
              <NumberField label="Column end" value={selectedItem.columnEnd} min={2} max={state.columns + 1} onChange={(columnEnd) => onUpdateItem({ columnEnd })} />
              <NumberField label="Row start" value={selectedItem.rowStart} min={1} max={state.rows} onChange={(rowStart) => onUpdateItem({ rowStart })} />
              <NumberField label="Row end" value={selectedItem.rowEnd} min={2} max={state.rows + 1} onChange={(rowEnd) => onUpdateItem({ rowEnd })} />
              <ColorField label="Background" value={selectedItem.background} onChange={(background) => onUpdateItem({ background })} />
              <ColorField label="Text" value={selectedItem.textColor} onChange={(textColor) => onUpdateItem({ textColor })} />
            </ControlGrid>
            <Input size="sm" value={selectedItem.content} aria-label="Selected item content" onChange={(event) => onUpdateItem({ content: event.target.value })} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={onDuplicateItem}>Duplicate</Button>
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

      <ControlSection title="Responsive">
        <ControlGrid columns={2}>
          <NumberField label="Tablet" value={state.responsive.tabletBreakpoint} min={480} max={1200} unit="px" onChange={(tabletBreakpoint) => onPatch({ responsive: { ...state.responsive, tabletBreakpoint } })} />
          <NumberField label="Mobile" value={state.responsive.mobileBreakpoint} min={280} max={760} unit="px" onChange={(mobileBreakpoint) => onPatch({ responsive: { ...state.responsive, mobileBreakpoint } })} />
          <NumberField label="Tablet cols" value={state.responsive.tabletColumns} min={1} max={state.columns} onChange={(tabletColumns) => onPatch({ responsive: { ...state.responsive, tabletColumns } })} />
        </ControlGrid>
      </ControlSection>
    </ToolControlPanel>
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
