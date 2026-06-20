"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button, CopyButton, Input } from "@/components/ui";
import { ToolControlPanel, ControlSection, ControlGrid, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { computeSplit, formatMoney, TIP_PRESETS } from "./split";

export default function TipCalculatorClient() {
  const [rawBill, setRawBill] = useState("100");
  const [tipPercent, setTipPercent] = useState(18);
  const [people, setPeople] = useState(2);
  const [roundUp, setRoundUp] = useState(false);

  const bill = Number.parseFloat(rawBill);

  const result = useMemo(
    () => computeSplit({ bill, tipPercent, people, roundUp }),
    [bill, tipPercent, people, roundUp],
  );

  const summary = result
    ? [
        `Bill: ${formatMoney(bill)}`,
        `Tip: ${tipPercent}% (${formatMoney(result.tipAmount)})`,
        `Total: ${formatMoney(result.total)}`,
        `People: ${people}`,
        `Each pays: ${formatMoney(result.perPerson)}`,
      ].join("\n")
    : "";

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <ToolControlPanel title="Split the bill" description="Enter the bill, choose a tip, and how many people are sharing. Everything is calculated in your browser.">
          <ControlSection title="Bill amount">
            <Input
              type="text"
              inputMode="decimal"
              value={rawBill}
              onChange={(event) => setRawBill(event.target.value)}
              aria-label="Bill amount"
              aria-invalid={!(Number.isFinite(bill) && bill >= 0)}
              placeholder="0.00"
            />
          </ControlSection>

          <ControlSection title={`Tip: ${tipPercent}%`}>
            <div className="flex flex-wrap gap-2">
              {TIP_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  size="sm"
                  variant={preset === tipPercent ? "soft" : "secondary"}
                  aria-pressed={preset === tipPercent}
                  onClick={() => setTipPercent(preset)}
                >
                  {preset}%
                </Button>
              ))}
            </div>
            <div className="mt-3">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Custom tip %
                <Input
                  className="mt-1"
                  type="text"
                  inputMode="decimal"
                  value={String(tipPercent)}
                  onChange={(event) => setTipPercent(Number.parseFloat(event.target.value))}
                  aria-label="Custom tip percent"
                />
              </label>
            </div>
          </ControlSection>

          <ControlSection title="People">
            <ControlGrid columns={2}>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setPeople((value) => Math.max(1, value - 1))}
                  disabled={people <= 1}
                  aria-label="Remove a person"
                  leftIcon={<Minus className="h-4 w-4" aria-hidden />}
                />
                <span className="min-w-10 text-center font-mono text-lg font-black text-[var(--color-text-primary)]">{people}</span>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setPeople((value) => value + 1)}
                  aria-label="Add a person"
                  leftIcon={<Plus className="h-4 w-4" aria-hidden />}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)]">
                <input
                  type="checkbox"
                  checked={roundUp}
                  onChange={(event) => setRoundUp(event.target.checked)}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                Round up per person
              </label>
            </ControlGrid>
          </ControlSection>

          {!result ? (
            <p className="mt-2 text-xs font-semibold text-[var(--color-danger)]">Enter a valid bill, tip, and at least one person.</p>
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
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 text-center shadow-[inset_0_1px_0_var(--color-border-subtle)]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Each person pays</div>
                  <div className="mt-1 text-5xl font-black tracking-tight text-[var(--color-text-primary)]">{formatMoney(result.perPerson)}</div>
                  {result.rounded ? (
                    <div className="mt-2 text-xs font-semibold text-[var(--color-primary)]">Rounded up · collects {formatMoney(result.totalCollected)} total</div>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Tip amount", value: formatMoney(result.tipAmount) },
                    { label: "Total bill", value: formatMoney(result.total) },
                    { label: "Per-person tip", value: formatMoney(result.perPersonTip) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-center">
                      <div className="font-mono text-base font-black text-[var(--color-text-primary)]">{item.value}</div>
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{item.label}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-tertiary)]">
                Enter a bill to split it.
              </div>
            )}
          </div>
        </section>
      }
      statsSlot={
        <WarningPanel
          messages={[
            { id: "local", severity: "info", title: "Local calculation", message: "Amounts are calculated in your browser. The tip is applied to the bill before splitting." },
          ]}
        />
      }
    />
  );
}
