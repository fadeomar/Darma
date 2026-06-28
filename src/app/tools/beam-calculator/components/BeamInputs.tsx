import { ControlSection, NumberField, ToolControlPanel } from "@/features/tools/components";
import type { BeamLoad, BeamModel, SelectedItem, Support, SupportType, UnitLabels } from "../lib/beamTypes";
import { isGuidedMode, type BeamMode } from "../lib/beamMode";
import { NUMERIC_INPUT_CLASS } from "./PositionField";
import { BeamTypeSelector } from "./BeamTypeSelector";
import { BeamSupportEditor } from "./BeamSupportEditor";
import { BeamLoadEditor } from "./BeamLoadEditor";

type LoadKind = "point" | "udl" | "moment";

type BeamInputsProps = {
  model: BeamModel;
  units: UnitLabels;
  mode: BeamMode;
  fieldErrors: Map<string, string>;
  beamLengthError?: string;
  selected: SelectedItem | null;
  onSelect: (item: SelectedItem | null) => void;
  onModeChange: (mode: BeamMode) => void;
  onLengthChange: (length: number) => void;
  onSupportUpdate: (id: string, patch: Partial<Support>) => void;
  onSupportRemove: (id: string) => void;
  onSupportAdd: (type: SupportType) => void;
  onLoadUpdate: (id: string, patch: Partial<BeamLoad>) => void;
  onLoadRemove: (id: string) => void;
  onLoadAdd: (kind: LoadKind) => void;
};

export function BeamInputs({
  model,
  units,
  mode,
  fieldErrors,
  beamLengthError,
  selected,
  onSelect,
  onModeChange,
  onLengthChange,
  onSupportUpdate,
  onSupportRemove,
  onSupportAdd,
  onLoadUpdate,
  onLoadRemove,
  onLoadAdd,
}: BeamInputsProps) {
  return (
    <ToolControlPanel
      title="Beam setup"
      description="Pick a beam type, set the span, then add loads. Results update automatically."
      badge={
        <span className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">
          Metric
        </span>
      }
    >
      <ControlSection title="Beam type">
        <BeamTypeSelector mode={mode} onChange={onModeChange} />
      </ControlSection>

      <ControlSection title="Beam">
        <NumberField label="Length" unit={units.length} value={model.length} min={0.1} step={0.5} error={beamLengthError} inputClassName={NUMERIC_INPUT_CLASS} onChange={onLengthChange} />
      </ControlSection>

      <BeamSupportEditor
        supports={model.supports}
        length={model.length}
        units={units}
        errors={fieldErrors}
        editable={!isGuidedMode(mode)}
        selected={selected}
        onSelect={onSelect}
        onUpdate={onSupportUpdate}
        onRemove={onSupportRemove}
        onAdd={onSupportAdd}
      />

      <BeamLoadEditor
        loads={model.loads}
        length={model.length}
        units={units}
        errors={fieldErrors}
        selected={selected}
        onSelect={onSelect}
        onUpdate={onLoadUpdate}
        onRemove={onLoadRemove}
        onAdd={onLoadAdd}
      />
    </ToolControlPanel>
  );
}
