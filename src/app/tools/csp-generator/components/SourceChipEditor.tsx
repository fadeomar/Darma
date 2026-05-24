import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CspSourceValue } from "../types";

const riskClass: Record<CspSourceValue["risk"], string> = {
  safe: "border-emerald-500/30 bg-emerald-500/10",
  normal: "border-[var(--color-border)] bg-[var(--color-surface-strong)]",
  contextual: "border-amber-500/35 bg-amber-500/10",
  risky: "border-[var(--color-danger)]/35 bg-[var(--color-danger)]/10",
};

export function SourceChipEditor({ sources, onAdd, onRemove }: { sources: CspSourceValue[]; onAdd: (value: string) => void; onRemove: (id: string) => void }) {
  return <div className="space-y-3"><div className="flex flex-wrap gap-2">{sources.map((source) => <span key={source.id} className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold text-[var(--color-text)]", riskClass[source.risk])}><span>{source.value}</span><span className="text-[10px] uppercase text-[var(--color-text-soft)]">{source.risk}</span><button type="button" onClick={() => onRemove(source.id)} className="rounded-full px-1 text-[var(--color-text-soft)] hover:text-[var(--color-danger)]" aria-label={`Remove ${source.value}`}>×</button></span>)}</div><AddSource onAdd={onAdd} /></div>;
}

function AddSource({ onAdd }: { onAdd: (value: string) => void }) {
  return <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const input = form.elements.namedItem("source") as HTMLInputElement | null; const value = input?.value.trim(); if (value) { onAdd(value); form.reset(); } }}><Input name="source" size="sm" placeholder="'self', https://cdn.example.com" aria-label="Add CSP source" /><Button size="sm" variant="secondary" type="submit">Add</Button></form>;
}
