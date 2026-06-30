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

export function CspCustomStep({
  sources,
  onAdd,
  onRemove,
}: {
  sources: CspCustomSource[];
  onAdd: (directive: string, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const [directive, setDirective] = useState("connect-src");
  const [value, setValue] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(directive, trimmed);
    setValue("");
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <Select value={directive} onChange={(event) => setDirective(event.target.value)} size="sm" className="sm:w-56">
          {DIRECTIVE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          size="sm"
          placeholder="https://api.yourdomain.com"
          aria-label="Custom domain or source"
          className="flex-1"
        />
        <Button type="submit" size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" />} disabled={!value.trim()}>
          Add
        </Button>
      </form>

      {sources.length ? (
        <ul className="flex flex-wrap gap-2">
          {sources.map((source) => (
            <li key={source.id}>
              <span className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-1 text-xs text-[var(--color-text-primary)]">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">{source.directive}</span>
                <span className="font-bold">{source.value}</span>
                <button
                  type="button"
                  onClick={() => onRemove(source.id)}
                  className="rounded-full text-[var(--color-text-tertiary)] transition hover:text-[var(--color-danger)]"
                  aria-label={`Remove ${source.value}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
          No custom domains yet. Add your own API, CDN, or socket endpoints — for example <code className="rounded bg-[var(--color-surface-subtle)] px-1 py-0.5 font-mono text-[11px]">https://api.yourdomain.com</code>.
        </p>
      )}
    </div>
  );
}
