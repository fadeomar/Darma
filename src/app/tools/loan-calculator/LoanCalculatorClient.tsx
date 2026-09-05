"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  Gauge,
  PackageCheck,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  WalletCards,
} from "lucide-react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import {
  buildAnnualScheduleCsv,
  buildLoanChecks,
  buildLoanReport,
  buildLoanSummaryMarkdown,
  buildMonthlyScheduleCsv,
  compareLoanScenarios,
  MAX_LOAN_MONTHS,
} from "./loan";
import { DEFAULT_LOAN_INPUT, DEFAULT_LOAN_OPTIONS, LOAN_PRESET_GROUPS, LOAN_PRESETS } from "./presets";
import type {
  CurrencyCode,
  LoanCheckLevel,
  LoanOptions,
  LoanScenarioInput,
  LoanTab,
} from "./types";

type LoanFormState = Record<Exclude<keyof LoanScenarioInput, "startDate">, string> & { startDate: string };

const CHECK_STYLES: Record<LoanCheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function toFormState(input: LoanScenarioInput): LoanFormState {
  return {
    amount: String(input.amount),
    downPayment: String(input.downPayment),
    financedFees: String(input.financedFees),
    annualRate: String(input.annualRate),
    termMonths: String(input.termMonths),
    extraMonthlyPayment: String(input.extraMonthlyPayment),
    oneTimeExtraPayment: String(input.oneTimeExtraPayment),
    oneTimeExtraMonth: String(input.oneTimeExtraMonth),
    startDate: input.startDate,
  };
}

function parseFormState(form: LoanFormState): LoanScenarioInput {
  return {
    amount: Number.parseFloat(form.amount),
    downPayment: Number.parseFloat(form.downPayment),
    financedFees: Number.parseFloat(form.financedFees),
    annualRate: Number.parseFloat(form.annualRate),
    termMonths: Number.parseFloat(form.termMonths),
    extraMonthlyPayment: Number.parseFloat(form.extraMonthlyPayment),
    oneTimeExtraPayment: Number.parseFloat(form.oneTimeExtraPayment),
    oneTimeExtraMonth: Number.parseFloat(form.oneTimeExtraMonth),
    startDate: form.startDate,
  };
}

function SummaryCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]"><div className="flex items-center justify-between gap-2"><span className="truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</span><span className="text-[var(--color-primary-text-strong)]">{icon}</span></div><div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]" title={value}>{value}</div><div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div></div>;
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3"><div className="truncate text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">{label}</div><div className="mt-1 truncate font-mono text-lg font-black text-[var(--color-text-primary)]" title={value}>{value}</div>{hint ? <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div> : null}</div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-[var(--color-text-secondary)]"><span>{label}</span>{hint ? <span className="font-normal text-[var(--color-text-tertiary)]">{hint}</span> : null}</span>{children}</label>;
}

function formatDuration(months: number) {
  if (!Number.isFinite(months) || months < 0) return "—";
  if (months === 0) return "0 mo";
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (!years) return `${remaining} mo`;
  if (!remaining) return `${years} yr`;
  return `${years} yr ${remaining} mo`;
}

function BalanceChart({ accelerated, baseline, startBalance, formatMoney }: { accelerated: Array<{ paymentNumber: number; closingBalance: number }>; baseline: Array<{ paymentNumber: number; closingBalance: number }>; startBalance: number; formatMoney: (value: number) => string }) {
  const maxMonths = Math.max(accelerated.length, baseline.length, 1);
  const maxBalance = Math.max(startBalance, 1);
  const points = (rows: Array<{ paymentNumber: number; closingBalance: number }>) => {
    const step = Math.max(1, Math.ceil(rows.length / 100));
    const sampled = rows.filter((_, index) => index % step === 0 || index === rows.length - 1);
    return [`4,${4 + (1 - 1) * 92}`, ...sampled.map((row) => `${4 + (row.paymentNumber / maxMonths) * 92},${4 + (1 - row.closingBalance / maxBalance) * 92}`)].join(" ");
  };
  return <div>
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
      <svg viewBox="0 0 100 100" className="h-48 w-full" role="img" aria-label="Remaining loan balance over time">
        {[20, 40, 60, 80].map((y) => <line key={y} x1="4" y1={y} x2="96" y2={y} stroke="var(--color-border-subtle)" strokeWidth="0.45" />)}
        <polyline points={points(baseline)} fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.4" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
        <polyline points={points(accelerated)} fill="none" stroke="var(--color-accent)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-tertiary)]"><span>{formatMoney(maxBalance)} starting balance</span><span>{maxMonths} months</span></div>
    </div>
    <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--color-text-secondary)]"><span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-[var(--color-accent)]" />Entered plan</span><span className="flex items-center gap-1.5"><span className="h-0.5 w-5 border-t border-dashed border-[var(--color-text-tertiary)]" />No-extra baseline</span></div>
  </div>;
}

export default function LoanCalculatorClient() {
  const [form, setForm] = useState<LoanFormState>(() => toFormState(DEFAULT_LOAN_INPUT));
  const [options, setOptions] = useState<LoanOptions>(DEFAULT_LOAN_OPTIONS);
  const [activeTab, setActiveTab] = useState<LoanTab>("overview");
  const [schedulePage, setSchedulePage] = useState(0);

  const input = useMemo(() => parseFormState(form), [form]);
  const comparison = useMemo(() => compareLoanScenarios(input), [input]);
  const checks = useMemo(() => buildLoanChecks(input, comparison), [input, comparison]);
  const result = comparison?.accelerated ?? null;
  const baseline = comparison?.baseline ?? null;
  const formatter = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency: options.currency, minimumFractionDigits: options.precision, maximumFractionDigits: options.precision }), [options.currency, options.precision]);
  const formatMoney = useCallback((value: number) => Number.isFinite(value) ? formatter.format(value) : "—", [formatter]);
  const summaryMarkdown = useMemo(() => buildLoanSummaryMarkdown(input, comparison, checks, formatMoney), [input, comparison, checks, formatMoney]);
  const monthlyCsv = useMemo(() => buildMonthlyScheduleCsv(result), [result]);
  const annualCsv = useMemo(() => buildAnnualScheduleCsv(result), [result]);
  const report = useMemo(() => comparison ? buildLoanReport(input, options, comparison, checks) : null, [input, options, comparison, checks]);
  const reportJson = useMemo(() => report ? `${JSON.stringify(report, null, 2)}\n` : "", [report]);
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  const rowsPerPage = 24;
  const pageCount = result ? Math.max(1, Math.ceil(result.monthlySchedule.length / rowsPerPage)) : 1;
  const visibleRows = result?.monthlySchedule.slice(schedulePage * rowsPerPage, (schedulePage + 1) * rowsPerPage) ?? [];

  useEffect(() => setSchedulePage(0), [form]);
  useEffect(() => { if (schedulePage >= pageCount) setSchedulePage(Math.max(0, pageCount - 1)); }, [schedulePage, pageCount]);

  function updateForm(key: keyof LoanFormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyPreset(id: string) {
    const preset = LOAN_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setForm(toFormState(preset.input));
    setOptions((current) => ({ ...current, ...preset.options }));
    setActiveTab("overview");
  }

  async function downloadPack() {
    if (!comparison || !report) return;
    const zip = new JSZip();
    zip.file("loan-summary.md", summaryMarkdown);
    zip.file("loan-report.json", reportJson);
    zip.file("monthly-amortization.csv", monthlyCsv);
    zip.file("annual-amortization.csv", annualCsv);
    zip.file("README.md", "# Darma loan analysis pack\n\n- `loan-summary.md`: human-readable scenario summary\n- `loan-report.json`: inputs, metrics, checks, and schedules\n- `monthly-amortization.csv`: payment-level schedule\n- `annual-amortization.csv`: yearly rollup\n\nThis is an estimate, not a lender disclosure. Confirm APR, fees, payment timing, and prepayment rules.\n");
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "loan-analysis-pack.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const tabs: Array<{ id: LoanTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "monthly", label: `Monthly${result ? ` (${result.payoffMonths})` : ""}` },
    { id: "annual", label: `Annual${result ? ` (${result.annualSchedule.length})` : ""}` },
    { id: "compare", label: "Compare" },
  ];

  return <div className="space-y-4">
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Scheduled payment" value={result ? formatMoney(result.scheduledMonthlyPayment) : "—"} hint={input.extraMonthlyPayment > 0 ? `+ ${formatMoney(input.extraMonthlyPayment)} recurring extra` : "Fixed monthly payment"} icon={<WalletCards className="h-4 w-4" />} />
      <SummaryCard label="Total interest" value={result ? formatMoney(result.totalInterest) : "—"} hint={result ? `${result.interestSharePercent}% of loan payments` : "Enter valid values"} icon={<ReceiptText className="h-4 w-4" />} />
      <SummaryCard label="Estimated payoff" value={result ? formatDuration(result.payoffMonths) : "—"} hint={comparison?.monthsSaved ? `${comparison.monthsSaved} months earlier` : `${input.termMonths || 0} month contract`} icon={<CalendarDays className="h-4 w-4" />} />
      <SummaryCard label="Production review" value={!result ? "Invalid" : reviewCount ? `${reviewCount} flag${reviewCount === 1 ? "" : "s"}` : "Ready"} hint={`${checks.length} checks · local estimate`} icon={<ShieldCheck className="h-4 w-4" />} />
    </div>

    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_370px]">
      <main className="min-w-0 space-y-4">
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-3 py-2.5">
            <div className="flex flex-wrap gap-1">{tabs.map((tab) => <Button key={tab.id} size="sm" variant={activeTab === tab.id ? "primary" : "ghost"} onClick={() => setActiveTab(tab.id)}>{tab.label}</Button>)}</div>
            <CopyButton text={summaryMarkdown} size="sm" variant="secondary" disabled={!result}>Copy summary</CopyButton>
          </div>

          {!result ? <div className="flex min-h-[430px] items-center justify-center p-6 text-center"><div><AlertTriangle className="mx-auto h-8 w-8 text-[var(--color-warning-text)]" /><h2 className="mt-3 font-bold text-[var(--color-text-primary)]">Enter a valid loan scenario</h2><p className="mt-1 max-w-md text-sm text-[var(--color-text-tertiary)]">Check the amount, upfront payment, rate, term, extra payments, and first-payment date.</p></div></div> : null}

          {result && baseline && comparison && activeTab === "overview" ? <div className="space-y-4 p-4">
            <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-5">
                <div className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-primary-text-strong)]">Scheduled monthly payment</div>
                <div className="mt-1 text-4xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-5xl">{formatMoney(result.scheduledMonthlyPayment)}</div>
                <div className="mt-2 text-xs text-[var(--color-text-secondary)]">Financed principal {formatMoney(result.financedPrincipal)} · {input.annualRate}% nominal annual rate</div>
                {input.extraMonthlyPayment > 0 ? <div className="mt-3 inline-flex rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-2.5 py-1 text-xs font-bold text-[var(--color-success-text)]">Planned monthly outflow: {formatMoney(result.scheduledMonthlyPayment + input.extraMonthlyPayment)}</div> : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Financed" value={formatMoney(result.financedPrincipal)} hint={`${formatMoney(input.downPayment)} upfront`} />
                <MetricCard label="Loan payments" value={formatMoney(result.totalPayment)} hint={`${result.payoffMonths} payments`} />
                <MetricCard label="Cash outlay" value={formatMoney(result.totalCashOutlay)} hint="Upfront + loan payments" />
                <MetricCard label="Extra applied" value={formatMoney(result.totalExtraPayment)} hint={comparison.monthsSaved ? `${comparison.monthsSaved} months saved` : "No acceleration"} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <section><div className="mb-2 flex items-center justify-between gap-2"><div><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Balance timeline</h3><p className="text-xs text-[var(--color-text-tertiary)]">Entered plan compared with the same loan without extra payments.</p></div><TrendingDown className="h-5 w-5 text-[var(--color-primary-text-strong)]" /></div><BalanceChart accelerated={result.monthlySchedule} baseline={baseline.monthlySchedule} startBalance={result.financedPrincipal} formatMoney={formatMoney} /></section>
              <section className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4"><div className="flex items-center gap-2"><PiggyBank className="h-5 w-5 text-[var(--color-success-text)]" /><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Cost breakdown</h3></div><div><div className="mb-1 flex justify-between text-xs"><span>Principal</span><span>{formatMoney(result.financedPrincipal)}</span></div><div className="flex h-3 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="bg-[var(--color-accent)]" style={{ width: `${100 - result.interestSharePercent}%` }} /><div className="bg-[var(--color-warning)]" style={{ width: `${result.interestSharePercent}%` }} /></div><div className="mt-1 flex justify-between text-xs text-[var(--color-text-tertiary)]"><span>{(100 - result.interestSharePercent).toFixed(1)}%</span><span>{result.interestSharePercent}% interest</span></div></div><div className="grid grid-cols-2 gap-2"><MetricCard label="Interest saved" value={formatMoney(comparison.interestSaved)} /><MetricCard label="Time saved" value={formatDuration(comparison.monthsSaved)} /></div><div className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2.5 text-xs leading-5 text-[var(--color-text-secondary)]">The rate entered is not necessarily the lender&apos;s APR. Financed fees and payment timing can change the disclosed APR and total cost.</div></section>
            </div>
          </div> : null}

          {result && activeTab === "monthly" ? <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] px-4 py-3"><div><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Monthly amortization</h3><p className="text-xs text-[var(--color-text-tertiary)]">Rows {schedulePage * rowsPerPage + 1}–{Math.min((schedulePage + 1) * rowsPerPage, result.payoffMonths)} of {result.payoffMonths}.</p></div><Button size="sm" variant="secondary" onClick={() => downloadText("monthly-amortization.csv", monthlyCsv, "text/csv;charset=utf-8")}><FileSpreadsheet className="h-4 w-4" />CSV</Button></div>
            <div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[72rem] border-collapse text-right text-xs"><thead className="sticky top-0 z-10 bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"><tr>{["#", "Date", "Opening", "Scheduled", "Extra", "Principal", "Interest", "Closing"].map((heading) => <th key={heading} className="px-3 py-2 font-semibold first:text-left">{heading}</th>)}</tr></thead><tbody>{visibleRows.map((row) => <tr key={row.paymentNumber} className="border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-control-hover)]"><td className="px-3 py-2 text-left font-bold text-[var(--color-text-primary)]">{row.paymentNumber}</td><td className="px-3 py-2 text-left font-mono">{row.date}</td><td className="px-3 py-2">{formatMoney(row.openingBalance)}</td><td className="px-3 py-2">{formatMoney(row.scheduledPayment)}</td><td className={row.extraPayment > 0 ? "px-3 py-2 font-bold text-[var(--color-success-text)]" : "px-3 py-2 text-[var(--color-text-tertiary)]"}>{formatMoney(row.extraPayment)}</td><td className="px-3 py-2">{formatMoney(row.principalPaid)}</td><td className="px-3 py-2">{formatMoney(row.interestPaid)}</td><td className="px-3 py-2 font-bold text-[var(--color-text-primary)]">{formatMoney(row.closingBalance)}</td></tr>)}</tbody></table></div>
            <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border-subtle)] px-4 py-3"><Button size="sm" variant="secondary" disabled={schedulePage === 0} onClick={() => setSchedulePage((page) => Math.max(0, page - 1))}>Previous</Button><span className="text-xs text-[var(--color-text-tertiary)]">Page {schedulePage + 1} of {pageCount}</span><Button size="sm" variant="secondary" disabled={schedulePage >= pageCount - 1} onClick={() => setSchedulePage((page) => Math.min(pageCount - 1, page + 1))}>Next</Button></div>
          </div> : null}

          {result && activeTab === "annual" ? <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] px-4 py-3"><div><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Annual rollup</h3><p className="text-xs text-[var(--color-text-tertiary)]">Payment totals grouped by loan year.</p></div><Button size="sm" variant="secondary" onClick={() => downloadText("annual-amortization.csv", annualCsv, "text/csv;charset=utf-8")}><FileSpreadsheet className="h-4 w-4" />CSV</Button></div><div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[54rem] border-collapse text-right text-xs"><thead className="sticky top-0 bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"><tr>{["Loan year", "Calendar", "Payments", "Principal", "Interest", "Extra", "Total paid", "Balance"].map((heading) => <th key={heading} className="px-3 py-2 font-semibold first:text-left">{heading}</th>)}</tr></thead><tbody>{result.annualSchedule.map((row) => <tr key={row.year} className="border-t border-[var(--color-border-subtle)]"><td className="px-3 py-2 text-left font-bold text-[var(--color-text-primary)]">Year {row.year}</td><td className="px-3 py-2">{row.calendarYear}</td><td className="px-3 py-2">{row.payments}</td><td className="px-3 py-2">{formatMoney(row.principalPaid)}</td><td className="px-3 py-2">{formatMoney(row.interestPaid)}</td><td className="px-3 py-2">{formatMoney(row.extraPaid)}</td><td className="px-3 py-2">{formatMoney(row.totalPaid)}</td><td className="px-3 py-2 font-bold text-[var(--color-text-primary)]">{formatMoney(row.closingBalance)}</td></tr>)}</tbody></table></div>
          </div> : null}

          {result && baseline && comparison && activeTab === "compare" ? <div className="space-y-4 p-4"><div className="grid gap-3 sm:grid-cols-3"><MetricCard label="Interest saved" value={formatMoney(comparison.interestSaved)} hint={`${formatMoney(baseline.totalInterest)} baseline`} /><MetricCard label="Months saved" value={String(comparison.monthsSaved)} hint={`${formatDuration(result.payoffMonths)} payoff`} /><MetricCard label="Recurring extra" value={formatMoney(input.extraMonthlyPayment)} hint={input.oneTimeExtraPayment > 0 ? `${formatMoney(input.oneTimeExtraPayment)} once in month ${input.oneTimeExtraMonth}` : "No one-time extra"} /></div><div className="overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]"><table className="w-full min-w-[38rem] text-right text-sm"><thead className="bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"><tr><th className="px-4 py-3 text-left">Metric</th><th className="px-4 py-3">No extras</th><th className="px-4 py-3">Entered plan</th><th className="px-4 py-3">Difference</th></tr></thead><tbody>{[
              ["Scheduled payment", baseline.scheduledMonthlyPayment, result.scheduledMonthlyPayment, 0, "money"],
              ["Payoff months", baseline.payoffMonths, result.payoffMonths, comparison.monthsSaved, "months"],
              ["Total interest", baseline.totalInterest, result.totalInterest, comparison.interestSaved, "money"],
              ["Total payments", baseline.totalPayment, result.totalPayment, baseline.totalPayment - result.totalPayment, "money"],
            ].map(([label, baseValue, activeValue, difference, kind]) => <tr key={String(label)} className="border-t border-[var(--color-border-subtle)]"><td className="px-4 py-3 text-left font-bold text-[var(--color-text-primary)]">{label}</td><td className="px-4 py-3">{kind === "money" ? formatMoney(Number(baseValue)) : String(baseValue)}</td><td className="px-4 py-3">{kind === "money" ? formatMoney(Number(activeValue)) : String(activeValue)}</td><td className="px-4 py-3 font-bold text-[var(--color-success-text)]">{kind === "money" ? formatMoney(Number(difference)) : `${difference} saved`}</td></tr>)}</tbody></table></div><div className="rounded-[var(--radius-md)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-xs leading-5 text-[var(--color-info-text)]">Extra payments are assumed to reduce principal immediately and without a prepayment penalty. Confirm how your lender applies overpayments.</div></div> : null}
        </section>
      </main>

      <aside className="min-w-0 space-y-4">
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" /><h2 className="text-sm font-bold text-[var(--color-text-primary)]">Loan scenario</h2></div><p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Fixed-rate monthly amortization with optional acceleration.</p></div>
          <div className="space-y-4 p-4">
            <Field label="Practical preset" hint={`${LOAN_PRESETS.length} real-world scenarios, grouped by borrowing goal.`}><Select value="" onChange={(event) => applyPreset(event.target.value)}><option value="" disabled>Choose a scenario…</option>{LOAN_PRESET_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.presetIds.map((id) => { const preset = LOAN_PRESETS.find((item) => item.id === id); return preset ? <option key={preset.id} value={preset.id}>{preset.name}</option> : null; })}
              </optgroup>
            ))}</Select></Field>
            <div className="grid grid-cols-4 gap-1.5">{[36, 60, 120, 360].map((months) => <Button key={months} size="sm" variant={Number(form.termMonths) === months ? "soft" : "secondary"} onClick={() => updateForm("termMonths", String(months))}>{months < 12 ? `${months}m` : `${months / 12}y`}</Button>)}</div>
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-2"><Field label="Amount / price"><Input type="text" inputMode="decimal" value={form.amount} onChange={(event) => updateForm("amount", event.target.value)} aria-label="Loan amount or purchase price" /></Field><Field label="Upfront payment"><Input type="text" inputMode="decimal" value={form.downPayment} onChange={(event) => updateForm("downPayment", event.target.value)} aria-label="Upfront payment" /></Field><Field label="Financed fees"><Input type="text" inputMode="decimal" value={form.financedFees} onChange={(event) => updateForm("financedFees", event.target.value)} aria-label="Financed fees" /></Field><Field label="Annual rate" hint="%"><Input type="text" inputMode="decimal" value={form.annualRate} onChange={(event) => updateForm("annualRate", event.target.value)} aria-label="Nominal annual interest rate percent" /></Field><Field label="Term" hint={`1–${MAX_LOAN_MONTHS} mo`}><Input type="text" inputMode="numeric" value={form.termMonths} onChange={(event) => updateForm("termMonths", event.target.value)} aria-label="Loan term in months" /></Field><Field label="First payment"><Input type="date" value={form.startDate} onChange={(event) => updateForm("startDate", event.target.value)} aria-label="First payment date" /></Field></div>
            <div className="border-t border-[var(--color-border-subtle)] pt-4"><div className="mb-2 flex items-center gap-2"><Gauge className="h-4 w-4 text-[var(--color-primary-text-strong)]" /><h3 className="text-xs font-bold text-[var(--color-text-primary)]">Payoff acceleration</h3></div><div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-2"><Field label="Extra each month"><Input type="text" inputMode="decimal" value={form.extraMonthlyPayment} onChange={(event) => updateForm("extraMonthlyPayment", event.target.value)} aria-label="Extra monthly payment" /></Field><Field label="One-time extra"><Input type="text" inputMode="decimal" value={form.oneTimeExtraPayment} onChange={(event) => updateForm("oneTimeExtraPayment", event.target.value)} aria-label="One-time extra payment" /></Field><Field label="Apply in month"><Input type="text" inputMode="numeric" value={form.oneTimeExtraMonth} onChange={(event) => updateForm("oneTimeExtraMonth", event.target.value)} aria-label="Month for one-time extra payment" /></Field><Field label="Currency"><Select value={options.currency} onChange={(event) => setOptions((current) => ({ ...current, currency: event.target.value as CurrencyCode }))}>{(["USD", "EUR", "GBP", "ILS"] as const).map((currency) => <option key={currency} value={currency}>{currency}</option>)}</Select></Field><Field label="Decimals"><Select value={String(options.precision)} onChange={(event) => setOptions((current) => ({ ...current, precision: Number(event.target.value) as 0 | 2 }))}><option value="2">2 decimals</option><option value="0">Whole units</option></Select></Field></div></div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]"><div className="flex items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3"><div className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-[var(--color-primary-text-strong)]" /><h2 className="text-sm font-bold text-[var(--color-text-primary)]">Production checks</h2></div><span className="text-xs font-bold text-[var(--color-text-tertiary)]">{checks.length}</span></div><div className="max-h-72 space-y-2 overflow-y-auto p-3">{checks.map((check) => <div key={check.id} className={`rounded-[var(--radius-sm)] border p-2.5 ${CHECK_STYLES[check.level]}`}><div className="flex items-start gap-2">{check.level === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : check.level === "warning" || check.level === "danger" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />}<div><div className="text-xs font-bold">{check.title}</div><p className="mt-0.5 text-xs leading-4 opacity-90">{check.message}</p></div></div></div>)}</div></section>

        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]"><div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3"><div className="flex items-center gap-2"><Download className="h-4 w-4 text-[var(--color-primary-text-strong)]" /><h2 className="text-sm font-bold text-[var(--color-text-primary)]">Exports</h2></div></div><div className="grid grid-cols-2 gap-2 p-3"><Button size="sm" variant="secondary" disabled={!result} onClick={() => downloadText("loan-summary.md", summaryMarkdown, "text/markdown;charset=utf-8")}><ReceiptText className="h-4 w-4" />Markdown</Button><Button size="sm" variant="secondary" disabled={!reportJson} onClick={() => downloadText("loan-report.json", reportJson, "application/json;charset=utf-8")}><FileJson className="h-4 w-4" />JSON</Button><Button size="sm" variant="secondary" disabled={!result} onClick={() => downloadText("monthly-amortization.csv", monthlyCsv, "text/csv;charset=utf-8")}><FileSpreadsheet className="h-4 w-4" />Monthly CSV</Button><Button size="sm" variant="secondary" disabled={!result} onClick={() => downloadText("annual-amortization.csv", annualCsv, "text/csv;charset=utf-8")}><FileSpreadsheet className="h-4 w-4" />Annual CSV</Button><Button className="col-span-2" size="sm" disabled={!result} onClick={downloadPack}><PackageCheck className="h-4 w-4" />Download analysis pack</Button></div></section>
      </aside>
    </div>
  </div>;
}
