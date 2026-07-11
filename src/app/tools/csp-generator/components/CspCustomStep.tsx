"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import type { CspCustomSource } from "../builder";

const DIRECTIVE_OPTIONS = [
  { value: "connect-src", label: "connect-src (APIs, sockets)" },
  { value: "script-src", label: "script-src (scripts)" },
  { value: "style-src", label: "style-src (stylesheets)" },
  { value: "img-src", label: "img-src (images)" },
  { value: "font-src", label: "font-src (fonts)" },
  { value: "frame-src", label: "frame-src (embeds)" },
  { value: "media-src", label: "media-src (audio/video)" },
  { value: "default-src", label: "default-src (fallback)" },
];

const QUICK_EXAMPLES = [
  { directive: "connect-src", value: "https://api.example.com" },
  { directive: "img-src", value: "https://cdn.example.com" },
  { directive: "connect-src", value: "wss://socket.example.com" },
];

export function CspCustomStep({
  sources,
  onAdd,
  onRemove,
  getError,
}: {
  sources: CspCustomSource[];
  onAdd: (directive: string, value: string) => void;
  onRemove: (id: string) => void;
  getError: (directive: string, value: string) => string | null;
}) {
  const [directive, setDirective] = useState("connect-src");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    const validationError = getError(directive, trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    onAdd(directive, trimmed);
    setValue("");
    setError(null);
  }

  function addExample(nextDirective: string, nextValue: string) {
    const validationError = getError(nextDirective, nextValue);
    if (validationError) {
      setDirective(nextDirective);
      setValue(nextValue);
      setError(validationError);
      return;
    }
    onAdd(nextDirective, nextValue);
    setError(null);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="grid gap-2 lg:grid-cols-[minmax(180px,240px)_minmax(0,1fr)_auto]">
        <Select value={directive} onChange={(event) => setDirective(event.target.value)} size="sm">
          {DIRECTIVE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
        <Input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          size="sm"
          placeholder="https://api.yourdomain.com"
          aria-label="Custom domain or source"
          aria-invalid={error ? true : undefined}
        />
        <Button type="submit" size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" />} disabled={!value.trim()}>
          Add
        </Button>
      </form>

      {error ? (
        <p role="alert" className="text-xs font-medium text-[var(--color-danger-text)]">{error}</p>
      ) : null}

      {!sources.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Examples</span>
          {QUICK_EXAMPLES.map((example) => (
            <button
              key={`${example.directive}-${example.value}`}
              type="button"
              onClick={() => addExample(example.directive, example.value)}
              className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-2.5 py-1 font-mono text-[11px] font-bold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
            >
              {example.value}
            </button>
          ))}
        </div>
      ) : null}

      {sources.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {sources.map((source) => (
            <div key={source.id} className="flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-2 text-xs text-[var(--color-text-primary)]">
              <span className="shrink-0 rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">{source.directive}</span>
              <span className="min-w-0 flex-1 truncate font-mono font-bold" title={source.value}>{source.value}</span>
              <button
                type="button"
                onClick={() => onRemove(source.id)}
                className="shrink-0 rounded-full text-[var(--color-text-tertiary)] transition hover:text-[var(--color-danger)]"
                aria-label={`Remove ${source.value}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
          Add exact API, CDN, or socket endpoints when possible. Exact domains keep the policy safer than broad <code className="rounded bg-[var(--color-surface-subtle)] px-1 py-0.5 font-mono text-[11px]">https:</code> wildcards.
        </p>
      )}
    </div>
  );
}
