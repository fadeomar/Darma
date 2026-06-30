import { Lock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { ControlSection, SegmentedControl } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import type { SelectedItem, Support, SupportType, UnitLabels } from "../lib/beamTypes";
import { isSameSelection } from "../lib/beamTypes";
import { formatNumber } from "../lib/beamFormatting";
import { PositionField } from "./PositionField";

type BeamSupportEditorProps = {
  supports: Support[];
  length: number;
  units: UnitLabels;
  errors: Map<string, string>;
  editable: boolean;
  selected: SelectedItem | null;
  onSelect: (item: SelectedItem | null) => void;
  onUpdate: (id: string, patch: Partial<Support>) => void;
  onRemove: (id: string) => void;
  onAdd: (type: SupportType) => void;
};

const SUPPORT_OPTIONS = [
  { value: "pin" as const, label: "Pin" },
  { value: "roller" as const, label: "Roller" },
  { value: "fixed" as const, label: "Fixed" },
];

export function BeamSupportEditor({ supports, length, units, errors, editable, selected, onSelect, onUpdate, onRemove, onAdd }: BeamSupportEditorProps) {
  // Guided modes: read-only summary so users can't accidentally break the config.
  if (!editable) {
    return (
      <ControlSection title="Supports" description="Set automatically from the beam type.">
        <div className="space-y-2">
          {supports.map((support) => (
            <div key={support.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/60 px-3 py-2">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Support {support.id} · <span className="capitalize">{support.type}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-tertiary)]">
                x = {formatNumber(support.x)} {units.length}
                <Lock className="h-3 w-3" aria-hidden />
              </span>
            </div>
          ))}
        </div>
      </ControlSection>
    );
  }

  return (
    <ControlSection
      title="Supports"
      description="Advanced: place supports manually. Use one fixed, or two pin/roller supports."
      action={
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => onAdd("pin")} aria-label="Add pin support">
            Pin
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => onAdd("roller")} aria-label="Add roller support">
            Roller
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => onAdd("fixed")} aria-label="Add fixed support">
            Fixed
          </Button>
        </div>
      }
    >
      {supports.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] px-3 py-4 text-center text-xs text-[var(--color-text-tertiary)]">
          No supports yet. Add a fixed support for a cantilever, or two pin/roller supports for a simply supported beam.
        </p>
      ) : null}

      <div className="space-y-3">
        {supports.map((support) => {
          const error = errors.get(support.id);
          const isSel = isSameSelection(selected, { kind: "support", id: support.id });
          return (
            <div
              key={support.id}
              onFocusCapture={() => onSelect({ kind: "support", id: support.id })}
              onClick={() => onSelect({ kind: "support", id: support.id })}
              className={cn(
                "rounded-[var(--radius-md)] border bg-[var(--color-surface-base)] p-3 transition",
                isSel ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary-soft)]" : "border-[var(--color-border-subtle)]",
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">Support {support.id}</span>
                <Button size="icon" variant="ghost" onClick={() => onRemove(support.id)} aria-label={`Remove support ${support.id}`} className="h-7 w-7">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-3">
                <SegmentedControl ariaLabel={`Support ${support.id} type`} options={SUPPORT_OPTIONS} value={support.type} onChange={(type) => onUpdate(support.id, { type })} fullWidth />
                <PositionField label="Position x" ariaLabel={`Support ${support.id} position`} unit={units.length} value={support.x} length={length} error={error} onChange={(x) => onUpdate(support.id, { x })} />
              </div>
            </div>
          );
        })}
      </div>
    </ControlSection>
  );
}
