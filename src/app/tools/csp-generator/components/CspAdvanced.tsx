"use client";

import { useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CspDirective, CspGeneratorState } from "../types";

const RISK_CHIP: Record<CspDirective["sources"][number]["risk"], string> = {
  safe: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  normal: "border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-primary)]",
  contextual: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  risky: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function DirectiveRow({
  directive,
  onToggle,
  onAddSource,
  onRemoveSource,
}: {
  directive: CspDirective;
  onToggle: (enabled: boolean) => void;
  onAddSource: (value: string) => void;
  onRemoveSource: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAddSource(trimmed);
    setValue("");
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-mono text-sm font-bold text-[var(--color-text-primary)]">{directive.name}</h4>
          <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-tertiary)]">{directive.description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={directive.enabled}
          onClick={() => onToggle(!directive.enabled)}
          className={cn(
            "shrink-0 rounded-[var(--radius-full)] border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition",
            directive.enabled
              ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
              : "border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]",
          )}
        >
          {directive.enabled ? "Enabled" : "Disabled"}
        </button>
      </div>

      {directive.enabled ? (
        <div className="mt-3 space-y-2.5">
          {directive.sources.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {directive.sources.map((source) => (
                <li key={source.id}>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border px-2.5 py-1 font-mono text-[11px] font-bold", RISK_CHIP[source.risk])}>
                    {source.value}
                    <button type="button" onClick={() => onRemoveSource(source.value)} className="opacity-70 transition hover:opacity-100" aria-label={`Remove ${source.value} from ${directive.name}`}>
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-[var(--color-text-tertiary)]">No sources — this directive emits its bare keyword.</p>
          )}
          <form onSubmit={submit} className="flex gap-2">
            <Input value={value} onChange={(event) => setValue(event.target.value)} size="sm" placeholder="'self', https://cdn.example.com" aria-label={`Add source to ${directive.name}`} className="flex-1" />
            <Button type="submit" size="sm" variant="ghost" leftIcon={<Plus className="h-3.5 w-3.5" />} disabled={!value.trim()}>Add</Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function CspAdvanced({
  state,
  onToggleDirective,
  onAddSource,
  onRemoveSource,
}: {
  state: CspGeneratorState;
  onToggleDirective: (name: string, enabled: boolean) => void;
  onAddSource: (name: string, value: string) => void;
  onRemoveSource: (name: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left focus:outline-none focus-visible:shadow-[var(--focus-ring)]"
      >
        <span className="min-w-0">
          <span className="block text-sm font-black text-[var(--color-text-primary)]">Advanced directives</span>
          <span className="mt-0.5 block text-xs leading-5 text-[var(--color-text-tertiary)]">
            Fine-tune every directive: toggle it, edit sources, or harden defaults. Most users can skip this.
          </span>
        </span>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-[var(--color-text-tertiary)] transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open ? (
        <div className="space-y-2.5 border-t border-[var(--color-border-subtle)] p-4">
          {state.directives.map((directive) => (
            <DirectiveRow
              key={directive.id}
              directive={directive}
              onToggle={(enabled) => onToggleDirective(directive.name, enabled)}
              onAddSource={(value) => onAddSource(directive.name, value)}
              onRemoveSource={(value) => onRemoveSource(directive.name, value)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
