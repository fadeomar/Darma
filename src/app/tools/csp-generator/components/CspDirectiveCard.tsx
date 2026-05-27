import { Button } from "@/components/ui";
import { SourceChipEditor } from "./SourceChipEditor";
import type { CspDirective } from "../types";

export function CspDirectiveCard({ directive, selected, onSelect, onToggle, onAddSource, onRemoveSource }: { directive: CspDirective; selected: boolean; onSelect: () => void; onToggle: (enabled: boolean) => void; onAddSource: (value: string) => void; onRemoveSource: (sourceId: string) => void }) {
  return <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3"><div className="flex flex-wrap items-start justify-between gap-2"><button type="button" onClick={onSelect} className="text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"><h3 className="text-sm font-black text-[var(--color-text)]">{directive.name}</h3><p className="mt-1 text-xs leading-5 text-[var(--color-text-soft)]">{directive.description}</p></button><Button size="sm" variant={directive.enabled ? "secondary" : "ghost"} onClick={() => onToggle(!directive.enabled)}>{directive.enabled ? "Enabled" : "Disabled"}</Button></div>{selected || directive.enabled ? <div className="mt-3"><SourceChipEditor sources={directive.sources} onAdd={onAddSource} onRemove={onRemoveSource} /></div> : null}</article>;
}
