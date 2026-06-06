import { ChevronRight } from "lucide-react";
import type { JsonValue } from "./utils";

type JsonTreeViewProps = {
  value?: JsonValue;
};

function valueType(value: JsonValue): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function PreviewValue({ value }: { value: JsonValue }) {
  if (typeof value === "string") {
    return <span className="text-emerald-300">&quot;{value}&quot;</span>;
  }
  if (typeof value === "number") {
    return <span className="text-sky-300">{value}</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-violet-300">{String(value)}</span>;
  }
  if (value === null) {
    return <span className="text-slate-400">null</span>;
  }
  return null;
}

function JsonNode({ label, value, depth = 0 }: { label?: string; value: JsonValue; depth?: number }) {
  const type = valueType(value);
  const isObjectLike = value !== null && typeof value === "object";
  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : isObjectLike
      ? Object.entries(value)
      : [];
  const summary = Array.isArray(value)
    ? `${entries.length} items`
    : isObjectLike
      ? `${entries.length} keys`
      : type;

  if (!isObjectLike) {
    return (
      <div className="flex min-w-0 items-start gap-2 py-1 font-mono text-xs leading-5" style={{ paddingLeft: depth * 14 }}>
        {label ? <span className="shrink-0 text-amber-200">{label}:</span> : null}
        <PreviewValue value={value} />
      </div>
    );
  }

  return (
    <details className="group" open={depth < 2}>
      <summary
        className="flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)] py-1 font-mono text-xs leading-5 text-slate-100 hover:bg-white/[0.06]"
        style={{ paddingLeft: depth * 14 }}
      >
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-open:rotate-90" aria-hidden />
        {label ? <span className="text-amber-200">{label}:</span> : null}
        <span className="text-slate-100">{Array.isArray(value) ? "[ ]" : "{ }"}</span>
        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-slate-400">{summary}</span>
      </summary>
      <div className="pb-1">
        {entries.map(([key, child]) => (
          <JsonNode key={`${depth}-${key}`} label={key} value={child} depth={depth + 1} />
        ))}
      </div>
    </details>
  );
}

export default function JsonTreeView({ value }: JsonTreeViewProps) {
  if (value === undefined) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[calc(var(--radius-lg)-6px)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-6 text-center text-sm text-[var(--color-text-tertiary)]">
        Format or validate JSON to browse it as a collapsible tree.
      </div>
    );
  }

  return (
    <div className="max-h-[520px] overflow-auto rounded-[calc(var(--radius-lg)-6px)] border border-slate-700 bg-slate-950 p-3 shadow-inner">
      <JsonNode value={value} />
    </div>
  );
}
