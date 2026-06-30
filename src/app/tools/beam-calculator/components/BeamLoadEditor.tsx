import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { ControlSection, NumberField, SegmentedControl } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import type { BeamLoad, LoadDirection, MomentRotation, SelectedItem, UnitLabels } from "../lib/beamTypes";
import { selectionMatchesLoad } from "../lib/beamTypes";
import { clamp, roundTo } from "../lib/beamFormatting";
import { PositionField, NUMERIC_INPUT_CLASS } from "./PositionField";

type LoadKind = "point" | "udl" | "moment";

type BeamLoadEditorProps = {
  loads: BeamLoad[];
  length: number;
  units: UnitLabels;
  errors: Map<string, string>;
  selected: SelectedItem | null;
  onSelect: (item: SelectedItem | null) => void;
  onUpdate: (id: string, patch: Partial<BeamLoad>) => void;
  onRemove: (id: string) => void;
  onAdd: (kind: LoadKind) => void;
};

const DIRECTION_OPTIONS = [
  { value: "down" as const, label: "Down" },
  { value: "up" as const, label: "Up" },
];

const ROTATION_OPTIONS = [
  { value: "ccw" as const, label: "CCW" },
  { value: "cw" as const, label: "CW" },
];

const UDL_GAP = 0.1;

export function BeamLoadEditor({ loads, length, units, errors, selected, onSelect, onUpdate, onRemove, onAdd }: BeamLoadEditorProps) {
  const udlRanges = (label: string, start: number, end: number) => ({ label, start, end });
  const udlQuickRanges = [
    udlRanges("Full span", 0, length),
    udlRanges("Left half", 0, length / 2),
    udlRanges("Center half", length / 4, (3 * length) / 4),
    udlRanges("Right half", length / 2, length),
  ];

  return (
    <ControlSection
      title="Loads"
      description="Downward loads are negative; sagging moment is positive. Drag items on the preview to place them."
      action={
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => onAdd("point")} aria-label="Add point load">
            Point
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => onAdd("udl")} aria-label="Add distributed load">
            UDL
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => onAdd("moment")} aria-label="Add applied moment">
            Moment
          </Button>
        </div>
      }
    >
      {loads.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] px-3 py-4 text-center text-xs text-[var(--color-text-tertiary)]">
          No loads yet. Add a point load, uniformly distributed load (UDL), or an applied moment.
        </p>
      ) : null}

      <div className="space-y-3">
        {loads.map((load) => {
          const error = errors.get(load.id);
          const label = load.kind === "point" ? "Point load" : load.kind === "udl" ? "Distributed load" : "Applied moment";
          const isSel = selectionMatchesLoad(selected, load.id);
          const selectKind: SelectedItem = load.kind === "udl" ? { kind: "udl-body", id: load.id } : { kind: load.kind, id: load.id };
          return (
            <div
              key={load.id}
              onClick={() => onSelect(selectKind)}
              onFocusCapture={() => onSelect(selectKind)}
              className={cn(
                "rounded-[var(--radius-md)] border bg-[var(--color-surface-base)] p-3 transition",
                isSel ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary-soft)]" : "border-[var(--color-border-subtle)]",
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">
                  {label} {load.id}
                </span>
                <Button size="icon" variant="ghost" onClick={() => onRemove(load.id)} aria-label={`Remove ${label.toLowerCase()} ${load.id}`} className="h-7 w-7">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {load.kind === "point" ? (
                <div className="space-y-3">
                  <SegmentedControl ariaLabel={`Load ${load.id} direction`} options={DIRECTION_OPTIONS} value={load.direction} onChange={(direction: LoadDirection) => onUpdate(load.id, { direction })} fullWidth />
                  <NumberField label="Magnitude" unit={units.force} value={load.magnitude} min={0} step={0.5} error={error} inputClassName={NUMERIC_INPUT_CLASS} onChange={(magnitude) => onUpdate(load.id, { magnitude })} />
                  <PositionField label="Position x" ariaLabel={`Load ${load.id} position`} unit={units.length} value={load.x} length={length} onChange={(x) => onUpdate(load.id, { x })} />
                </div>
              ) : null}

              {load.kind === "udl" ? (
                <div className="space-y-3">
                  <SegmentedControl ariaLabel={`Load ${load.id} direction`} options={DIRECTION_OPTIONS} value={load.direction} onChange={(direction: LoadDirection) => onUpdate(load.id, { direction })} fullWidth />
                  <NumberField label="Intensity" unit={units.distributed} value={load.magnitude} min={0} step={0.5} error={error} inputClassName={NUMERIC_INPUT_CLASS} onChange={(magnitude) => onUpdate(load.id, { magnitude })} />
                  <div className="flex flex-wrap gap-1" role="group" aria-label={`UDL ${load.id} span presets`}>
                    {udlQuickRanges.map((preset) => {
                      const active = Math.abs(preset.start - load.start) < 1e-6 && Math.abs(preset.end - load.end) < 1e-6;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => onUpdate(load.id, { start: roundTo(preset.start, 2), end: roundTo(preset.end, 2) })}
                          aria-pressed={active}
                          className={cn(
                            "rounded-[var(--radius-sm)] border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.04em] transition",
                            active
                              ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                              : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]",
                          )}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  <div onFocusCapture={(e) => { e.stopPropagation(); onSelect({ kind: "udl-start", id: load.id }); }}>
                    <PositionField label="Start x" ariaLabel={`UDL ${load.id} start`} unit={units.length} value={load.start} length={length} error={error} onChange={(x) => onUpdate(load.id, { start: roundTo(clamp(x, 0, load.end - UDL_GAP), 2) })} />
                  </div>
                  <div onFocusCapture={(e) => { e.stopPropagation(); onSelect({ kind: "udl-end", id: load.id }); }}>
                    <PositionField label="End x" ariaLabel={`UDL ${load.id} end`} unit={units.length} value={load.end} length={length} onChange={(x) => onUpdate(load.id, { end: roundTo(clamp(x, load.start + UDL_GAP, length), 2) })} />
                  </div>
                </div>
              ) : null}

              {load.kind === "moment" ? (
                <div className="space-y-3">
                  <SegmentedControl ariaLabel={`Moment ${load.id} rotation`} options={ROTATION_OPTIONS} value={load.rotation} onChange={(rotation: MomentRotation) => onUpdate(load.id, { rotation })} fullWidth />
                  <NumberField label="Magnitude" unit={units.moment} value={load.magnitude} min={0} step={0.5} error={error} inputClassName={NUMERIC_INPUT_CLASS} onChange={(magnitude) => onUpdate(load.id, { magnitude })} />
                  <PositionField label="Position x" ariaLabel={`Moment ${load.id} position`} unit={units.length} value={load.x} length={length} onChange={(x) => onUpdate(load.id, { x })} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </ControlSection>
  );
}
