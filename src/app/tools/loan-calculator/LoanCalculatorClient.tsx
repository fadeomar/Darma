"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Input } from "@/components/ui";
import { ControlGrid, ControlSection, ToolControlPanel, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { computeLoan } from "./loan";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function LoanCalculatorClient() {
  const [rawPrincipal, setRawPrincipal] = useState("20000");
  const [rawRate, setRawRate] = useState("5");
  const [rawTerm, setRawTerm] = useState("5");
  const [termUnit, setTermUnit] = useState<"years" | "months">("years");
  const values = useMemo(() => {
    const principal = Number.parseFloat(rawPrincipal);
    const annualRate = Number.parseFloat(rawRate);
    const term = Number.parseFloat(rawTerm);
    return { principal, annualRate, term, termMonths: termUnit === "years" ? term * 12 : term };
  }, [rawPrincipal, rawRate, rawTerm, termUnit]);
  const result = useMemo(() => computeLoan({ principal: values.principal, annualRate: values.annualRate, termMonths: values.termMonths }), [values]);
  const summary = useMemo(() => result ? [
    `Monthly payment: ${money.format(result.monthlyPayment)}`,
    `Total payment: ${money.format(result.totalPayment)}`,
    `Total interest: ${money.format(result.totalInterest)}`,
    `Term: ${result.termMonths} months`,
  ].join("\n") : "", [result]);
  const stats = useMemo(() => result ? [
    { label: "Total payment", value: money.format(result.totalPayment) },
    { label: "Total interest", value: money.format(result.totalInterest) },
    { label: "Term", value: `${result.termMonths} mo` },
  ] : [], [result]);

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <ToolControlPanel title="Loan details" description="Enter a principal, fixed annual rate, and repayment term.">
          <ControlSection title="Loan amount">
            <Input type="text" inputMode="decimal" value={rawPrincipal} onChange={(event) => setRawPrincipal(event.target.value)} aria-label="Loan amount" aria-invalid={!(Number.isFinite(values.principal) && values.principal > 0)} placeholder="20000" />
          </ControlSection>
          <ControlSection title="Annual interest rate %">
            <Input type="text" inputMode="decimal" value={rawRate} onChange={(event) => setRawRate(event.target.value)} aria-label="Annual interest rate percent" aria-invalid={!(Number.isFinite(values.annualRate) && values.annualRate >= 0)} placeholder="5" />
          </ControlSection>
          <ControlSection title="Loan term">
            <div className="flex gap-2" role="group" aria-label="Loan term unit">
              {(["years", "months"] as const).map((unit) => <Button key={unit} size="sm" variant={termUnit === unit ? "soft" : "secondary"} aria-pressed={termUnit === unit} onClick={() => setTermUnit(unit)}>{unit === "years" ? "Years" : "Months"}</Button>)}
            </div>
            <Input type="text" inputMode="decimal" value={rawTerm} onChange={(event) => setRawTerm(event.target.value)} aria-label={`Loan term in ${termUnit}`} aria-invalid={!(Number.isFinite(values.termMonths) && values.termMonths >= 1)} placeholder={termUnit === "years" ? "5" : "60"} />
          </ControlSection>
        </ToolControlPanel>
      }
      outputSlot={
        <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]" aria-live="polite">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Loan result</h2>
            <CopyButton text={summary} size="sm" variant="secondary" disabled={!result}>Copy</CopyButton>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {result ? <>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 text-center shadow-[inset_0_1px_0_var(--color-border-subtle)]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Monthly payment</div>
                <div className="mt-1 text-5xl font-black tracking-tight text-[var(--color-text-primary)]">{money.format(result.monthlyPayment)}</div>
              </div>
              <ControlGrid columns={3} className="grid-cols-3 sm:grid-cols-3">
                {stats.map((item) => <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-center"><div className="font-mono text-base font-black text-[var(--color-text-primary)]">{item.value}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{item.label}</div></div>)}
              </ControlGrid>
              <section className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
                <div className="border-b border-[var(--color-border-subtle)] px-3 py-2"><h3 className="text-xs font-bold text-[var(--color-text-primary)]">Amortization schedule</h3>{result.schedule.length > 30 ? <p className="text-[10px] text-[var(--color-text-tertiary)]">Showing the first 30 years.</p> : null}</div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full min-w-[32rem] border-collapse text-right text-xs">
                    <thead className="sticky top-0 bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"><tr>{["Year", "Principal paid", "Interest paid", "Balance"].map((heading) => <th key={heading} className="px-3 py-2 font-semibold first:text-left">{heading}</th>)}</tr></thead>
                    <tbody>{result.schedule.slice(0, 30).map((row) => <tr key={row.year} className="border-t border-[var(--color-border-subtle)]"><td className="px-3 py-2 text-left font-bold text-[var(--color-text-primary)]">{row.year}</td><td className="px-3 py-2">{money.format(row.principalPaid)}</td><td className="px-3 py-2">{money.format(row.interestPaid)}</td><td className="px-3 py-2">{money.format(row.remainingBalance)}</td></tr>)}</tbody>
                  </table>
                </div>
              </section>
            </> : <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-tertiary)]">Enter valid loan values to see the result.</div>}
          </div>
        </section>
      }
      statsSlot={<WarningPanel messages={[{ id: "local", severity: "info", title: "Fixed-rate estimate", message: "Calculated in your browser. Assumes fixed-rate monthly payments. Does not include taxes, insurance, or fees." }]} />}
    />
  );
}
