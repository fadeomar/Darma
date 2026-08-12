import { ChevronDown, ChevronUp, Eye, EyeOff, Lock, MousePointer2, Unlock } from "lucide-react";
import type { CanvasObjectSummary } from "../types";

export default function ObjectsPanel({ objects, onSelect, onToggleSelection, onSelectAll, onRename, onToggleVisibility, onToggleLock, onMove }: {
  objects: CanvasObjectSummary[];
  onSelect: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onRename: (id: string, name: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">Objects</div>
        {objects.length > 0 && (
          <button type="button" onClick={onSelectAll} className="rounded px-2 py-1 text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">Select all</button>
        )}
      </div>
      <p className="mb-3 text-xs leading-5 text-[var(--color-text-tertiary)]">Top items render in front. Use the checkbox to build a multi-selection on touch or desktop.</p>
      {objects.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-subtle)] p-3 text-xs text-[var(--color-text-tertiary)]">Objects appear here as you draw or import images.</div>
      ) : (
        <div className="max-h-72 space-y-1 overflow-auto pr-1">
          {objects.map((object) => (
            <div key={`${object.id}:${object.name}`} className={`rounded-[var(--radius-md)] border p-2 ${object.selected ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]" : "border-[var(--color-border-subtle)]"}`}>
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  aria-label={object.selected ? `Remove ${object.name} from selection` : `Add ${object.name} to selection`}
                  checked={object.selected}
                  disabled={!object.visible || object.locked}
                  onChange={() => onToggleSelection(object.id)}
                  className="h-4 w-4 shrink-0 accent-[var(--color-primary)] disabled:opacity-40"
                />
                <button type="button" aria-label={`Select only ${object.name}`} onClick={() => onSelect(object.id)} disabled={!object.visible || object.locked} className="rounded p-1 hover:bg-[var(--color-surface-subtle)] disabled:opacity-40"><MousePointer2 className="h-3.5 w-3.5" /></button>
                <input
                  aria-label={`Rename ${object.name}`}
                  defaultValue={object.name}
                  onBlur={(event) => onRename(object.id, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                    if (event.key === "Escape") {
                      event.currentTarget.value = object.name;
                      event.currentTarget.blur();
                    }
                  }}
                  className="min-w-0 flex-1 rounded px-1 text-sm font-semibold outline-none focus:bg-[var(--color-surface-subtle)] focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <button type="button" aria-label={object.visible ? `Hide ${object.name}` : `Show ${object.name}`} onClick={() => onToggleVisibility(object.id)} className="rounded p-1 hover:bg-[var(--color-surface-subtle)]">{object.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</button>
                <button type="button" aria-label={object.locked ? `Unlock ${object.name}` : `Lock ${object.name}`} onClick={() => onToggleLock(object.id)} className="rounded p-1 hover:bg-[var(--color-surface-subtle)]">{object.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}</button>
              </div>
              <div className="mt-1 flex items-center justify-between pl-9 text-xs text-[var(--color-text-tertiary)]">
                <span>{object.type}</span>
                <span className="flex gap-1">
                  <button type="button" aria-label={`Move ${object.name} forward`} onClick={() => onMove(object.id, "up")} className="rounded p-1 hover:bg-[var(--color-surface-subtle)]"><ChevronUp className="h-3 w-3" /></button>
                  <button type="button" aria-label={`Move ${object.name} backward`} onClick={() => onMove(object.id, "down")} className="rounded p-1 hover:bg-[var(--color-surface-subtle)]"><ChevronDown className="h-3 w-3" /></button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
