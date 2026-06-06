import { BarChart3, Braces, Database, FileJson2, Layers3 } from "lucide-react";
import type { JsonStats } from "./utils";

const statIcons = [FileJson2, Braces, Layers3, Database, BarChart3];

function StatCard({ label, value, index }: { label: string; value: string | number; index: number }) {
  const Icon = statIcons[index % statIcons.length];
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
      <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em]">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

export default function JsonStatsPanel({ stats }: { stats?: JsonStats }) {
  if (!stats) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[calc(var(--radius-lg)-6px)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-6 text-center text-sm text-[var(--color-text-tertiary)]">
        Run Format, Minify, Validate, or Fix JSON to see payload statistics.
      </div>
    );
  }

  const cards = [
    ["Root", stats.rootType],
    ["Top level", stats.topLevelCount.toLocaleString()],
    ["Depth", stats.depth.toLocaleString()],
    ["Keys", stats.keyCount.toLocaleString()],
    ["Minified", stats.minifiedCharacterCount.toLocaleString()],
    ["Objects", stats.objectCount.toLocaleString()],
    ["Arrays", stats.arrayCount.toLocaleString()],
    ["Strings", stats.stringCount.toLocaleString()],
    ["Numbers", stats.numberCount.toLocaleString()],
    ["Booleans", stats.booleanCount.toLocaleString()],
    ["Nulls", stats.nullCount.toLocaleString()],
    ["Saving", `${stats.reductionPercent}%`],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value], index) => (
          <StatCard key={label} label={label} value={value} index={index} />
        ))}
      </div>
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-4 text-sm leading-6 text-[var(--color-text-secondary)]">
        Original input has {stats.characterCount.toLocaleString()} characters across {stats.lineCount.toLocaleString()} lines. A pretty 2-space version is {stats.formattedCharacterCount.toLocaleString()} characters, while the transport-safe minified version is {stats.minifiedCharacterCount.toLocaleString()} characters.
      </div>
    </div>
  );
}
