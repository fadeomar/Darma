"use client";

import { useMemo, useState } from "react";
import { CopyButton, Textarea } from "@/components/ui";
import { ToolControlPanel, ControlSection, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { computeStats, formatStat, parseNumbers } from "./stats";

const SAMPLE = "2, 4, 4, 4, 5, 5, 7, 9";

export default function StatisticsCalculatorClient() {
  const [text, setText] = useState(SAMPLE);

  const values = useMemo(() => parseNumbers(text), [text]);
  const stats = useMemo(() => computeStats(values), [values]);

  const summary = useMemo(() => {
    if (!stats) return "";
    return [
      `Count: ${stats.count}`,
      `Sum: ${formatStat(stats.sum)}`,
      `Mean: ${formatStat(stats.mean)}`,
      `Median: ${formatStat(stats.median)}`,
      `Mode: ${stats.modes.length ? stats.modes.map(formatStat).join(", ") : "none"}`,
      `Min: ${formatStat(stats.min)}  Max: ${formatStat(stats.max)}  Range: ${formatStat(stats.range)}`,
      `Std dev (sample): ${formatStat(stats.stdDevSample)}`,
      `Std dev (population): ${formatStat(stats.stdDevPopulation)}`,
    ].join("\n");
  }, [stats]);

  const primary = stats
    ? [
        { label: "Mean", value: formatStat(stats.mean) },
        { label: "Median", value: formatStat(stats.median) },
        { label: "Mode", value: stats.modes.length ? stats.modes.map(formatStat).join(", ") : "—" },
        { label: "Count", value: formatStat(stats.count) },
      ]
    : [];

  const detail = stats
    ? [
        { label: "Sum", value: formatStat(stats.sum) },
        { label: "Min", value: formatStat(stats.min) },
        { label: "Max", value: formatStat(stats.max) },
        { label: "Range", value: formatStat(stats.range) },
        { label: "Std dev (sample)", value: formatStat(stats.stdDevSample) },
        { label: "Std dev (population)", value: formatStat(stats.stdDevPopulation) },
        { label: "Variance (sample)", value: formatStat(stats.varianceSample) },
        { label: "Variance (population)", value: formatStat(stats.variancePopulation) },
      ]
    : [];

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <ToolControlPanel title="Your numbers" description="Paste or type numbers separated by commas, spaces, or new lines. Statistics update as you type.">
          <ControlSection title="Data set">
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={10}
              aria-label="Numbers"
              placeholder="e.g. 12, 7, 9, 15, 7"
              className="font-mono"
            />
            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
              {values.length} valid number{values.length === 1 ? "" : "s"} detected.
            </p>
          </ControlSection>
        </ToolControlPanel>
      }
      outputSlot={
        <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">Statistics</h2>
            <CopyButton text={summary} size="sm" variant="secondary" disabled={!stats}>Copy results</CopyButton>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {stats ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {primary.map((item) => (
                    <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-center shadow-[inset_0_1px_0_var(--color-border-subtle)]">
                      <div className="truncate font-mono text-xl font-black text-[var(--color-text-primary)]" title={item.value}>{item.value}</div>
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{item.label}</div>
                    </div>
                  ))}
                </div>
                <dl className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                  {detail.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] py-1.5 text-sm last:border-0">
                      <dt className="text-[var(--color-text-tertiary)]">{row.label}</dt>
                      <dd className="font-mono font-semibold text-[var(--color-text-primary)]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-tertiary)]">
                Enter some numbers to see the statistics.
              </div>
            )}
          </div>
        </section>
      }
      statsSlot={
        <WarningPanel
          messages={[
            { id: "sd", severity: "info", title: "Sample vs population", message: "Use the sample standard deviation when your numbers are a sample of a larger group, and the population value when they are the whole group." },
            { id: "local", severity: "info", title: "Local calculation", message: "Your numbers are processed in your browser — nothing is uploaded." },
          ]}
        />
      }
    />
  );
}
