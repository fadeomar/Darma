"use client";

import { useMemo, useState } from "react";
import { CopyButton, Input } from "@/components/ui";
import { ToolControlPanel, ControlSection, ControlGrid, SegmentedControl, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { computePercent, MODE_META, type PercentMode } from "./percent";

const MODES: PercentMode[] = ["of", "isWhatPercent", "change", "applyChange"];

const DEFAULTS: Record<PercentMode, [string, string]> = {
  of: ["20", "150"],
  isWhatPercent: ["30", "150"],
  change: ["100", "125"],
  applyChange: ["80", "25"],
};

export default function PercentageCalculatorClient() {
  const [mode, setMode] = useState<PercentMode>("of");
  const [rawA, setRawA] = useState(DEFAULTS.of[0]);
  const [rawB, setRawB] = useState(DEFAULTS.of[1]);

  const meta = MODE_META[mode];
  const a = Number.parseFloat(rawA);
  const b = Number.parseFloat(rawB);

  const outcome = useMemo(() => computePercent(mode, { a, b }), [mode, a, b]);
  const valid = outcome.sentence !== "";

  function changeMode(next: PercentMode) {
    setMode(next);
    const [da, db] = DEFAULTS[next];
    setRawA(da);
    setRawB(db);
  }

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <ToolControlPanel title="Percentage calculator" description="Pick a question, fill in the two values, and read the answer. Everything is calculated in your browser.">
          <ControlSection title="What do you want to work out?">
            <SegmentedControl
              ariaLabel="Calculation type"
              value={mode}
              onChange={changeMode}
              fullWidth
              options={MODES.map((m) => ({ value: m, label: MODE_META[m].label }))}
            />
          </ControlSection>

          <ControlSection title="Values">
            <ControlGrid columns={2}>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                {meta.aLabel}
                <Input
                  className="mt-1"
                  type="text"
                  inputMode="decimal"
                  value={rawA}
                  onChange={(event) => setRawA(event.target.value)}
                  aria-label={meta.aLabel}
                  aria-invalid={!Number.isFinite(a)}
                />
              </label>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                {meta.bLabel}
                <Input
                  className="mt-1"
                  type="text"
                  inputMode="decimal"
                  value={rawB}
                  onChange={(event) => setRawB(event.target.value)}
                  aria-label={meta.bLabel}
                  aria-invalid={!Number.isFinite(b)}
                />
              </label>
            </ControlGrid>
          </ControlSection>

          {!valid ? (
            <p className="mt-2 text-xs font-semibold text-[var(--color-danger)]">Enter two valid numbers (the total cannot be zero).</p>
          ) : null}
        </ToolControlPanel>
      }
      outputSlot={
        <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">Result</h2>
            <CopyButton text={outcome.sentence} size="sm" variant="secondary" disabled={!valid}>Copy result</CopyButton>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {valid ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 text-center shadow-[inset_0_1px_0_var(--color-border-subtle)]">
                <div className="text-4xl font-black tracking-tight text-[var(--color-text-primary)]">
                  {outcome.value.toLocaleString("en-US", { maximumFractionDigits: 5 })}
                  {mode === "isWhatPercent" || mode === "change" ? <span className="text-2xl text-[var(--color-text-tertiary)]">%</span> : null}
                </div>
                <div className="mt-3 text-sm text-[var(--color-text-secondary)]">{outcome.sentence}</div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-tertiary)]">
                Enter two values to see the answer.
              </div>
            )}
          </div>
        </section>
      }
      statsSlot={
        <WarningPanel
          messages={[
            { id: "local", severity: "info", title: "Local calculation", message: "Percentages are calculated in your browser — nothing is uploaded." },
          ]}
        />
      }
    />
  );
}
