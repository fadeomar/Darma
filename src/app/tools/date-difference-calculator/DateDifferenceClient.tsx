"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton } from "@/components/ui";
import { ToolControlPanel, ControlSection, ControlGrid, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import {
  computeDifference,
  formatBreakdown,
  parseDateInput,
  toDateInputValue,
  weekdayName,
} from "./dateMath";

function todayValue(): string {
  return toDateInputValue(new Date());
}

export default function DateDifferenceClient() {
  const [fromValue, setFromValue] = useState("2000-01-01");
  const [toValue, setToValue] = useState(todayValue);

  const fromDate = useMemo(() => parseDateInput(fromValue), [fromValue]);
  const toDate = useMemo(() => parseDateInput(toValue), [toValue]);
  const valid = Boolean(fromDate && toDate);

  const result = useMemo(
    () => (fromDate && toDate ? computeDifference(fromDate, toDate) : null),
    [fromDate, toDate],
  );

  const summary = useMemo(() => {
    if (!result) return "";
    return [
      `From: ${fromValue}`,
      `To: ${toValue}`,
      `Difference: ${formatBreakdown(result.breakdown)}`,
      `Total days: ${result.totalDays.toLocaleString()}`,
      `Total weeks: ${result.totalWeeks.toLocaleString()} weeks, ${result.weeksRemainderDays} days`,
      `Total months: ${result.totalMonths.toLocaleString()}`,
    ].join("\n");
  }, [result, fromValue, toValue]);

  function setToToday() {
    setToValue(todayValue());
  }

  function swap() {
    setFromValue(toValue);
    setToValue(fromValue);
  }

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <ToolControlPanel title="Choose two dates" description="Pick a start and end date. Use 'Today' for an age or countup from a past date.">
          <ControlSection title="Dates">
            <ControlGrid columns={2}>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                From
                <input
                  type="date"
                  value={fromValue}
                  max="9999-12-31"
                  onChange={(event) => setFromValue(event.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                />
              </label>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                To
                <input
                  type="date"
                  value={toValue}
                  max="9999-12-31"
                  onChange={(event) => setToValue(event.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                />
              </label>
            </ControlGrid>
          </ControlSection>
          <ControlSection title="Shortcuts">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={setToToday}>Set &ldquo;To&rdquo; = today</Button>
              <Button size="sm" variant="secondary" onClick={swap} disabled={!valid}>Swap dates</Button>
            </div>
          </ControlSection>
          {!valid ? (
            <p className="mt-2 text-xs font-semibold text-[var(--color-danger)]">Enter two valid dates to see the difference.</p>
          ) : null}
        </ToolControlPanel>
      }
      outputSlot={
        <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">Result</h2>
            <CopyButton text={summary} size="sm" variant="secondary" disabled={!result}>Copy result</CopyButton>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {result ? (
              <>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 text-center shadow-[inset_0_1px_0_var(--color-border-subtle)]">
                  <div className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
                    {formatBreakdown(result.breakdown)}
                  </div>
                  {result.isNegative ? (
                    <div className="mt-1 text-xs font-semibold text-[var(--color-text-tertiary)]">The end date is before the start date.</div>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total days", value: result.totalDays.toLocaleString() },
                    { label: "Total weeks", value: result.totalWeeks.toLocaleString() },
                    { label: "Total months", value: result.totalMonths.toLocaleString() },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-center">
                      <div className="font-mono text-lg font-black text-[var(--color-text-primary)]">{item.value}</div>
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{item.label}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-tertiary)]">
                Pick two valid dates to see the difference.
              </div>
            )}
          </div>
        </section>
      }
      statsSlot={
        <div className="space-y-4">
          {result && fromDate && toDate ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Details</h3>
              <dl className="mt-3 space-y-2 text-sm">
                {[
                  { label: "Start weekday", value: weekdayName(fromDate) },
                  { label: "End weekday", value: weekdayName(toDate) },
                  { label: "Weeks + days", value: `${result.totalWeeks.toLocaleString()}w ${result.weeksRemainderDays}d` },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <dt className="text-[var(--color-text-tertiary)]">{row.label}</dt>
                    <dd className="font-mono font-semibold text-[var(--color-text-primary)]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
          <WarningPanel messages={[{ id: "local", severity: "info", title: "Local calculation", message: "Dates are calculated in your browser using the calendar date only (no time zone math)." }]} />
        </div>
      }
    />
  );
}
