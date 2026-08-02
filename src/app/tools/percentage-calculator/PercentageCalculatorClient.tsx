"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import {
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  Code2,
  Download,
  FileJson,
  FileSpreadsheet,
  Gauge,
  PackageCheck,
  Percent,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import { ToolMobileActions } from "@/features/tools/components";
import { downloadText } from "../_shared/clientUtils";
import {
  buildJavaScriptSnippet,
  buildPercentChecks,
  buildPercentReport,
  buildPercentScenarios,
  buildPercentSummaryMarkdown,
  buildScenarioCsv,
  computePercent,
  formatPercentNumber,
  MODE_META,
  MODE_ORDER,
} from "./percent";
import { DEFAULT_PERCENT_PRESET_ID, PERCENT_PRESETS } from "./presets";
import type {
  PercentCheckLevel,
  PercentMode,
  PercentTab,
  PercentUnit,
} from "./types";

const CHECK_STYLES: Record<PercentCheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function SummaryCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</span>
        <span className="text-[var(--color-primary)]">{icon}</span>
      </div>
      <div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]" title={value}>{value}</div>
      <div className="mt-0.5 truncate text-[11px] text-[var(--color-text-tertiary)]">{hint}</div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="truncate text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 truncate font-mono text-lg font-black text-[var(--color-text-primary)]" title={value}>{value}</div>
      {hint ? <div className="mt-0.5 truncate text-[10px] text-[var(--color-text-tertiary)]">{hint}</div> : null}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold text-[var(--color-text-secondary)]">
        <span>{label}</span>
        {hint ? <span className="font-normal text-[var(--color-text-tertiary)]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function parseNumericInput(value: string): number {
  return value.trim() ? Number(value) : Number.NaN;
}

function formatValue(value: number | null, unit: PercentUnit = "number", precision = 4) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${formatPercentNumber(value, precision)}${unit === "percent" ? "%" : ""}`;
}

function directionIcon(direction: string) {
  if (direction === "increase") return <ArrowUpRight className="h-4 w-4" />;
  if (direction === "decrease") return <ArrowDownRight className="h-4 w-4" />;
  return <ArrowRightLeft className="h-4 w-4" />;
}

export default function PercentageCalculatorClient() {
  const initialPreset = PERCENT_PRESETS.find((preset) => preset.id === DEFAULT_PERCENT_PRESET_ID) ?? PERCENT_PRESETS[0];
  const [mode, setMode] = useState<PercentMode>(initialPreset.mode);
  const [rawA, setRawA] = useState(String(initialPreset.a));
  const [rawB, setRawB] = useState(String(initialPreset.b));
  const [precision, setPrecision] = useState(4);
  const [activeTab, setActiveTab] = useState<PercentTab>("overview");

  const inputs = useMemo(() => ({ a: parseNumericInput(rawA), b: parseNumericInput(rawB) }), [rawA, rawB]);
  const outcome = useMemo(() => computePercent(mode, inputs), [mode, inputs]);
  const scenarios = useMemo(() => buildPercentScenarios(mode, inputs), [mode, inputs]);
  const checks = useMemo(() => buildPercentChecks(mode, inputs, outcome), [mode, inputs, outcome]);
  const report = useMemo(() => buildPercentReport(mode, inputs, outcome, scenarios, checks), [mode, inputs, outcome, scenarios, checks]);
  const markdown = useMemo(() => buildPercentSummaryMarkdown(mode, inputs, outcome, checks), [mode, inputs, outcome, checks]);
  const scenarioCsv = useMemo(() => buildScenarioCsv(scenarios), [scenarios]);
  const reportJson = useMemo(() => `${JSON.stringify(report, null, 2)}\n`, [report]);
  const jsSnippet = useMemo(() => buildJavaScriptSnippet(mode), [mode]);
  const meta = MODE_META[mode];
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;

  function applyPreset(id: string) {
    const preset = PERCENT_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setMode(preset.mode);
    setRawA(String(preset.a));
    setRawB(String(preset.b));
    setActiveTab("overview");
  }

  function reset() {
    applyPreset(DEFAULT_PERCENT_PRESET_ID);
    setPrecision(4);
  }

  async function downloadPack() {
    const zip = new JSZip();
    zip.file("percentage-summary.md", markdown);
    zip.file("percentage-report.json", reportJson);
    zip.file("scenario-comparison.csv", scenarioCsv);
    zip.file("percentage-formula.js", jsSnippet);
    zip.file("README.md", "# Darma percentage analysis pack\n\n- `percentage-summary.md`: readable calculation and checks\n- `percentage-report.json`: structured inputs, result, scenarios, and checks\n- `scenario-comparison.csv`: result sensitivity while varying input B\n- `percentage-formula.js`: implementation starter for the selected mode\n\nReview units and rounding rules before using a percentage result in financial, medical, or contractual decisions.\n");
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "percentage-analysis-pack.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const tabs: Array<{ id: PercentTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "breakdown", label: "Formula & breakdown" },
    { id: "scenarios", label: "What-if table" },
    { id: "exports", label: "Checks & exports" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(320px,var(--tool-controls-width))_minmax(0,1fr)]">
        <aside data-tool-region="controls" className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-bg)] p-3 shadow-[var(--shadow-tool-controls)] lg:sticky lg:top-[6.75rem] lg:max-h-[calc(100vh-7.75rem)] lg:overflow-y-auto lg:overscroll-contain">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-bg)] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><Sparkles className="h-4 w-4 text-[var(--color-primary)]" />Practical presets</h2>
                <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">Load a realistic calculation and edit any value.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={reset} leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>Reset</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PERCENT_PRESETS.map((preset) => (
                <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2.5 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-control-hover)]">
                  <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.name}</span>
                  <span className="mt-1 block line-clamp-2 text-[10px] leading-4 text-[var(--color-text-tertiary)]">{preset.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-bg)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[var(--color-primary)]" />
              <div>
                <h2 className="text-sm font-black text-[var(--color-text-primary)]">Calculation mode</h2>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">Choose the exact percentage question.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MODE_ORDER.map((item) => (
                <button key={item} type="button" onClick={() => setMode(item)} aria-pressed={mode === item} className={`min-w-0 rounded-[var(--radius-md)] border px-2.5 py-2 text-left text-xs font-bold transition ${mode === item ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]" : "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-default)]"}`}>
                  <span className="block truncate">{MODE_META[item].shortLabel}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] px-3 py-2 text-[11px] leading-5 text-[var(--color-text-secondary)]">{meta.description}</p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-bg)] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-black text-[var(--color-text-primary)]">Inputs</h2>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">Signed values and decimals are supported where meaningful.</p>
              </div>
              <label className="w-24 text-[10px] font-bold text-[var(--color-text-tertiary)]">Precision<Select size="sm" className="mt-1" value={String(precision)} onChange={(event) => setPrecision(Number(event.target.value))} aria-label="Result precision"><option value="0">0 decimals</option><option value="2">2 decimals</option><option value="4">4 decimals</option><option value="6">6 decimals</option><option value="8">8 decimals</option></Select></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={meta.aLabel} hint={meta.aHint}><Input type="text" inputMode="decimal" value={rawA} onChange={(event) => setRawA(event.target.value)} aria-label={meta.aLabel} aria-invalid={!Number.isFinite(inputs.a)} /></Field>
              <Field label={meta.bLabel} hint={meta.bHint}><Input type="text" inputMode="decimal" value={rawB} onChange={(event) => setRawB(event.target.value)} aria-label={meta.bLabel} aria-invalid={!Number.isFinite(inputs.b)} /></Field>
            </div>
            {!outcome.valid ? <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-3 py-2 text-xs font-semibold text-[var(--color-danger-text)]">{outcome.error}</div> : null}
          </section>
        </aside>

        <main id="percentage-result" data-tool-region="result" className="min-w-0 scroll-mt-28 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-tool-result-border)] bg-[var(--color-tool-result-bg)] shadow-[var(--shadow-tool-result)]">
          <div className="border-b border-[var(--color-tool-result-border)] bg-[var(--color-tool-result-header)] p-3.5">
            <div className="mb-3"><div className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Live result</div><h2 className="mt-1 text-lg font-black text-[var(--color-text-primary)]">Percentage analysis</h2><p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">Change the mode or inputs on the left. The result and formula update immediately.</p></div>
            <div className="flex max-w-full flex-nowrap gap-1.5 overflow-x-auto">
              {tabs.map((tab) => <Button key={tab.id} size="sm" variant={activeTab === tab.id ? "primary" : "secondary"} onClick={() => setActiveTab(tab.id)}>{tab.label}</Button>)}
            </div>
          </div>

          <div className="p-4">
            {activeTab === "overview" ? (
              <div className="space-y-4">
                <section className={`rounded-[var(--radius-lg)] border p-5 shadow-[var(--shadow-sm)] ${outcome.valid ? "border-[var(--color-tool-result-border)] bg-[var(--color-surface-raised)]" : "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--color-text-tertiary)]">{meta.answerLabel}</div>
                      <div className="mt-1 break-words font-mono text-4xl font-black tracking-tight text-[var(--color-text-primary)]">{formatValue(outcome.valid ? outcome.value : null, outcome.unit, precision)}</div>
                    </div>
                    <CopyButton text={outcome.sentence} size="sm" variant="secondary" disabled={!outcome.valid}>Copy result</CopyButton>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{outcome.valid ? outcome.sentence : outcome.error}</p>
                </section>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {outcome.metrics.map((item) => <MetricCard key={item.label} label={item.label} value={formatValue(item.value, item.unit, precision)} hint={item.hint} />)}
                </div>

                <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><ReceiptText className="h-4 w-4 text-[var(--color-primary)]" />Formula preview</div>
                  <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-code-bg)] px-3 py-2 font-mono text-xs leading-6 text-[var(--color-code-text)]">{outcome.valid ? outcome.substitutedFormula : meta.formula}</div>
                </section>
              </div>
            ) : null}

            {activeTab === "breakdown" ? (
              <div className="space-y-4">
                <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                  <h3 className="text-sm font-black text-[var(--color-text-primary)]">Formula</h3>
                  <p className="mt-2 font-mono text-sm text-[var(--color-primary)]">{meta.formula}</p>
                  {outcome.substitutedFormula ? <p className="mt-2 break-words rounded-[var(--radius-md)] bg-[var(--color-code-bg)] px-3 py-2 font-mono text-xs leading-6 text-[var(--color-code-text)]">{outcome.substitutedFormula}</p> : null}
                </section>
                <section>
                  <h3 className="text-sm font-black text-[var(--color-text-primary)]">Step-by-step calculation</h3>
                  <div className="mt-2 grid gap-2">
                    {outcome.steps.length ? outcome.steps.map((step, index) => <div key={step} className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-xs font-black text-[var(--color-primary)]">{index + 1}</span><p className="text-sm leading-6 text-[var(--color-text-secondary)]">{step}</p></div>) : <p className="text-sm text-[var(--color-text-tertiary)]">Enter valid values to see calculation steps.</p>}
                  </div>
                </section>
                <section>
                  <h3 className="text-sm font-black text-[var(--color-text-primary)]">Result metrics</h3>
                  <div className="mt-2 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
                    <table className="w-full min-w-[520px] text-left text-xs"><thead className="bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"><tr><th className="px-3 py-2">Metric</th><th className="px-3 py-2">Value</th><th className="px-3 py-2">Meaning</th></tr></thead><tbody>{outcome.metrics.map((item) => <tr key={item.label} className="border-t border-[var(--color-border-subtle)]"><td className="px-3 py-2 font-bold text-[var(--color-text-primary)]">{item.label}</td><td className="px-3 py-2 font-mono">{formatValue(item.value, item.unit, precision)}</td><td className="px-3 py-2 text-[var(--color-text-tertiary)]">{item.hint ?? "Derived from the selected formula"}</td></tr>)}</tbody></table>
                  </div>
                </section>
              </div>
            ) : null}

            {activeTab === "scenarios" ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-black text-[var(--color-text-primary)]">What if {meta.bLabel.toLowerCase()} changes?</h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">The table varies input B by ±10% and ±20% while keeping input A fixed. It is a sensitivity check, not a forecast.</p>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {scenarios.map((scenario) => {
                    const width = outcome.valid && scenario.outcome.valid && Math.abs(outcome.value) > 0 ? Math.min(100, Math.abs(scenario.outcome.value / outcome.value) * 50) : 0;
                    return <div key={scenario.label} className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-2"><div className="truncate text-[10px] font-bold text-[var(--color-text-tertiary)]">{scenario.label}</div><div className="mt-1 truncate font-mono text-sm font-black text-[var(--color-text-primary)]">{formatValue(scenario.outcome.valid ? scenario.outcome.value : null, scenario.outcome.unit, precision)}</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${width}%` }} /></div></div>;
                  })}
                </div>
                <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
                  <table className="w-full min-w-[650px] text-left text-xs"><thead className="bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"><tr><th className="px-3 py-2">Scenario</th><th className="px-3 py-2">{meta.aLabel}</th><th className="px-3 py-2">{meta.bLabel}</th><th className="px-3 py-2">Result</th><th className="px-3 py-2">Status</th></tr></thead><tbody>{scenarios.map((scenario) => <tr key={scenario.label} className="border-t border-[var(--color-border-subtle)]"><td className="px-3 py-2 font-bold text-[var(--color-text-primary)]">{scenario.label}</td><td className="px-3 py-2 font-mono">{formatPercentNumber(scenario.inputA, precision)}</td><td className="px-3 py-2 font-mono">{formatPercentNumber(scenario.inputB, precision)}</td><td className="px-3 py-2 font-mono font-bold">{formatValue(scenario.outcome.valid ? scenario.outcome.value : null, scenario.outcome.unit, precision)}</td><td className="px-3 py-2 text-[var(--color-text-tertiary)]">{scenario.outcome.valid ? "Valid" : scenario.outcome.error}</td></tr>)}</tbody></table>
                </div>
              </div>
            ) : null}

            {activeTab === "exports" ? (
              <div className="space-y-5">
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" />Production checks</h3>
                  <div className="mt-2 grid gap-2">
                    {checks.map((check) => <div key={check.id} className={`rounded-[var(--radius-md)] border px-3 py-2 ${CHECK_STYLES[check.level]}`}><div className="text-xs font-black">{check.title}</div><div className="mt-0.5 text-[11px] leading-5 opacity-90">{check.message}</div></div>)}
                  </div>
                </section>
                <section>
                  <h3 className="text-sm font-black text-[var(--color-text-primary)]">Export production assets</h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <Button variant="secondary" onClick={() => downloadText("percentage-summary.md", markdown, "text/markdown;charset=utf-8")} leftIcon={<ReceiptText className="h-4 w-4" />}>Markdown summary</Button>
                    <Button variant="secondary" onClick={() => downloadText("percentage-report.json", reportJson, "application/json;charset=utf-8")} leftIcon={<FileJson className="h-4 w-4" />}>JSON report</Button>
                    <Button variant="secondary" onClick={() => downloadText("scenario-comparison.csv", scenarioCsv, "text/csv;charset=utf-8")} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>Scenario CSV</Button>
                    <Button variant="secondary" onClick={() => downloadText("percentage-formula.js", jsSnippet, "text/javascript;charset=utf-8")} leftIcon={<Code2 className="h-4 w-4" />}>JavaScript formula</Button>
                    <Button variant="secondary" onClick={downloadPack} leftIcon={<PackageCheck className="h-4 w-4" />}>ZIP analysis pack</Button>
                    <CopyButton text={outcome.sentence} variant="secondary" disabled={!outcome.valid}>Copy answer</CopyButton>
                  </div>
                </section>
                <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-code-bg)] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-black text-[var(--color-code-text)]">JavaScript starter</span><CopyButton text={jsSnippet} size="sm" variant="secondary">Copy code</CopyButton></div>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-[var(--color-code-text)]">{jsSnippet}</pre>
                </section>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      <ToolMobileActions>
        <a href="#percentage-result" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-bold text-[var(--color-primary-text)]">View result</a>
        <CopyButton text={outcome.sentence} disabled={!outcome.valid}>Copy result</CopyButton>
      </ToolMobileActions>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <SummaryCard label="Primary result" value={formatValue(outcome.valid ? outcome.value : null, outcome.unit, precision)} hint={meta.answerLabel} icon={<Percent className="h-4 w-4" />} />
        <SummaryCard label="Absolute delta" value={formatValue(outcome.absoluteDelta, "number", precision)} hint={outcome.direction === "none" ? "comparison amount" : outcome.direction} icon={directionIcon(outcome.direction)} />
        <SummaryCard label="Factor" value={formatValue(outcome.factor, "number", Math.min(precision + 2, 8))} hint="decimal multiplier or ratio" icon={<Gauge className="h-4 w-4" />} />
        <SummaryCard label="Production review" value={outcome.valid ? (reviewCount ? `${reviewCount} review` : "Ready") : "Blocked"} hint={`${checks.length} checks completed`} icon={outcome.valid && !reviewCount ? <ShieldCheck className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2 text-[11px] text-[var(--color-text-tertiary)]">
        <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />All calculations stay in your browser.</span>
        <Button size="sm" variant="ghost" onClick={downloadPack} leftIcon={<Download className="h-3.5 w-3.5" />}>Download pack</Button>
      </div>
    </div>
  );
}
