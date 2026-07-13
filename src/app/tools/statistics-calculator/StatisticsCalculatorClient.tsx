"use client";

import { useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  Import,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button, CopyButton, Select, Textarea } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import {
  buildCleanDataCsv,
  buildHistogram,
  buildMetricsCsv,
  buildStatsChecks,
  buildStatsReport,
  buildSummaryMarkdown,
  computeStats,
  formatStat,
  parseDataset,
  STATS_MAX_INPUT_CHARACTERS,
  STATS_MAX_VALUES,
} from "./stats";
import { DEFAULT_STATS_OPTIONS, STATS_PRESETS } from "./presets";
import type {
  DescriptiveStats,
  HistogramBin,
  HistogramBinSetting,
  StatsCheckLevel,
  StatsOptions,
  VarianceFocus,
  PercentileMethod,
} from "./types";

type AnalysisTab = "overview" | "percentiles" | "outliers" | "clean-data";

const CHECK_STYLES: Record<StatsCheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]"><div className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div><div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]" title={value}>{value}</div><div className="mt-0.5 truncate text-[11px] text-[var(--color-text-tertiary)]">{hint}</div></div>;
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3"><div className="truncate text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">{label}</div><div className="mt-1 truncate font-mono text-lg font-black text-[var(--color-text-primary)]" title={value}>{value}</div>{hint ? <div className="mt-0.5 truncate text-[10px] text-[var(--color-text-tertiary)]">{hint}</div> : null}</div>;
}

function HistogramChart({ bins, precision }: { bins: HistogramBin[]; precision: number }) {
  const maxCount = Math.max(1, ...bins.map((bin) => bin.count));
  return <div>
    <div className="flex h-44 items-end gap-1 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 pb-3 pt-5" role="img" aria-label={`Histogram with ${bins.length} bins`}>
      {bins.map((bin) => <div key={bin.index} className="group flex h-full min-w-0 flex-1 items-end" title={`${formatStat(bin.start, precision)} to ${formatStat(bin.end, precision)}: ${bin.count} values (${formatStat(bin.percentage, 1)}%)`}><div className="w-full min-h-1 rounded-t-sm bg-[var(--color-accent)] opacity-80 transition group-hover:opacity-100" style={{ height: bin.count === 0 ? "0%" : `${Math.max(3, (bin.count / maxCount) * 100)}%` }} /></div>)}
    </div>
    <div className="mt-1 flex justify-between font-mono text-[10px] text-[var(--color-text-tertiary)]"><span>{bins[0] ? formatStat(bins[0].start, precision) : "—"}</span><span>{bins.at(-1) ? formatStat(bins.at(-1)!.end, precision) : "—"}</span></div>
  </div>;
}

function BoxPlot({ stats, precision }: { stats: DescriptiveStats; precision: number }) {
  const span = stats.range || 1;
  const x = (value: number) => 5 + ((value - stats.min) / span) * 90;
  const outliers = [...new Set(stats.outliers)].slice(0, 30);
  return <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
    <svg viewBox="0 0 100 30" className="h-24 w-full" role="img" aria-label="Box plot showing quartiles, whiskers, median, and outliers">
      <line x1={x(stats.lowerWhisker)} y1="15" x2={x(stats.upperWhisker)} y2="15" stroke="var(--color-text-tertiary)" strokeWidth="1" />
      <line x1={x(stats.lowerWhisker)} y1="10" x2={x(stats.lowerWhisker)} y2="20" stroke="var(--color-text-tertiary)" strokeWidth="1" />
      <line x1={x(stats.upperWhisker)} y1="10" x2={x(stats.upperWhisker)} y2="20" stroke="var(--color-text-tertiary)" strokeWidth="1" />
      <rect x={x(stats.q1)} y="7" width={Math.max(0.8, x(stats.q3) - x(stats.q1))} height="16" rx="1" fill="var(--color-surface-base)" stroke="var(--color-accent)" strokeWidth="1.2" />
      <line x1={x(stats.median)} y1="7" x2={x(stats.median)} y2="23" stroke="var(--color-accent)" strokeWidth="1.5" />
      {outliers.map((value, index) => <circle key={`${value}-${index}`} cx={x(value)} cy={15 + ((index % 3) - 1) * 3} r="1.1" fill="var(--color-danger)" />)}
    </svg>
    <div className="grid grid-cols-5 gap-1 text-center font-mono text-[9px] text-[var(--color-text-tertiary)]"><span>{formatStat(stats.min, precision)}</span><span>Q1 {formatStat(stats.q1, precision)}</span><span>Med {formatStat(stats.median, precision)}</span><span>Q3 {formatStat(stats.q3, precision)}</span><span>{formatStat(stats.max, precision)}</span></div>
  </div>;
}

export default function StatisticsCalculatorClient() {
  const initialPreset = STATS_PRESETS[0]!;
  const [text, setText] = useState(initialPreset.value);
  const [options, setOptions] = useState<StatsOptions>(DEFAULT_STATS_OPTIONS);
  const [activeTab, setActiveTab] = useState<AnalysisTab>("overview");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseDataset(text), [text]);
  const stats = useMemo(() => computeStats(parsed.values, options.percentileMethod), [parsed.values, options.percentileMethod]);
  const histogram = useMemo(() => stats ? buildHistogram(stats, options.histogramBins) : [], [stats, options.histogramBins]);
  const checks = useMemo(() => buildStatsChecks(parsed, stats, text.length), [parsed, stats, text.length]);
  const report = useMemo(() => buildStatsReport(parsed, stats, options, checks), [parsed, stats, options, checks]);
  const reportJson = useMemo(() => `${JSON.stringify(report, null, 2)}\n`, [report]);
  const summaryMarkdown = useMemo(() => buildSummaryMarkdown(stats, options, checks), [stats, options, checks]);
  const metricsCsv = useMemo(() => buildMetricsCsv(stats), [stats]);
  const cleanDataCsv = useMemo(() => buildCleanDataCsv(parsed, stats), [parsed, stats]);
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  const f = (value: number) => formatStat(value, options.precision);
  const focusedStdDev = stats ? (options.varianceFocus === "sample" ? stats.stdDevSample : stats.stdDevPopulation) : Number.NaN;

  function updateOption<K extends keyof StatsOptions>(key: K, value: StatsOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }));
  }

  function applyPreset(id: string) {
    const preset = STATS_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setText(preset.value);
    setActiveTab("overview");
  }

  function importData(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setText(reader.result);
    };
    reader.readAsText(file);
  }

  async function downloadAnalysisPack() {
    if (!stats) return;
    const zip = new JSZip();
    zip.file("source-data.txt", text);
    zip.file("cleaned-data.csv", cleanDataCsv);
    zip.file("statistics.csv", metricsCsv);
    zip.file("statistics-report.json", reportJson);
    zip.file("summary.md", summaryMarkdown);
    zip.file("README.md", "# Darma statistics analysis pack\n\n- `source-data.txt`: original local input\n- `cleaned-data.csv`: parsed finite values with IQR outlier flags\n- `statistics.csv`: machine-readable descriptive metrics\n- `statistics-report.json`: parser diagnostics, options, metrics, and production checks\n- `summary.md`: shareable human-readable report\n\nReview invalid tokens and outliers before using results for decisions.\n");
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "statistics-analysis-pack.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const tabItems: Array<{ id: AnalysisTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "percentiles", label: "Percentiles" },
    { id: "outliers", label: `Outliers${stats?.outliers.length ? ` (${stats.outliers.length})` : ""}` },
    { id: "clean-data", label: "Clean data" },
  ];

  return <div className="space-y-4">
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Valid values" value={stats ? stats.count.toLocaleString() : "0"} hint={`${parsed.invalidCount.toLocaleString()} invalid · ${stats?.uniqueCount.toLocaleString() ?? 0} unique`} />
      <SummaryCard label="Mean" value={stats ? f(stats.mean) : "—"} hint={stats ? `Median ${f(stats.median)}` : "Add numeric data"} />
      <SummaryCard label="Spread" value={stats ? f(focusedStdDev) : "—"} hint={`${options.varianceFocus === "sample" ? "Sample" : "Population"} SD${stats ? ` · IQR ${f(stats.iqr)}` : ""}`} />
      <SummaryCard label="Production review" value={!stats ? "No data" : reviewCount ? `${reviewCount} flag${reviewCount === 1 ? "" : "s"}` : "Ready"} hint={`${checks.length} checks · ${stats?.outliers.length ?? 0} outliers`} />
    </div>

    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_350px]">
      <main className="min-w-0 space-y-4">
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <div><h2 className="text-sm font-bold text-[var(--color-text-primary)]">Data set</h2><p className="text-[11px] text-[var(--color-text-tertiary)]">Commas, semicolons, pipes, spaces, tabs, and line breaks are supported.</p></div>
            <div className="flex flex-wrap gap-2">
              <input ref={fileInputRef} type="file" accept=".txt,.csv,text/plain,text/csv" className="hidden" onChange={(event) => { importData(event.target.files?.[0]); event.currentTarget.value = ""; }} />
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}><Import className="h-4 w-4" />Import</Button>
              <Button size="sm" variant="ghost" onClick={() => setText("")} disabled={!text}>Clear</Button>
            </div>
          </div>
          <div className="p-4"><Textarea value={text} onChange={(event) => setText(event.target.value)} rows={11} className="font-mono" aria-label="Numeric data set" placeholder="12, 15, 18, 21…" /><div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-[var(--color-text-tertiary)]"><span>{parsed.tokenCount.toLocaleString()} tokens · {parsed.values.length.toLocaleString()} analyzed · limit {STATS_MAX_VALUES.toLocaleString()}</span><span className={text.length > STATS_MAX_INPUT_CHARACTERS ? "font-semibold text-[var(--color-warning-text)]" : ""}>{text.length.toLocaleString()} / {STATS_MAX_INPUT_CHARACTERS.toLocaleString()} characters</span></div></div>
          {parsed.invalidCount ? <div className="border-t border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3 text-xs text-[var(--color-warning-text)]"><div className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" />Invalid values are excluded, not hidden</div><p className="mt-1 break-words">{parsed.invalidTokens.map((item) => `#${item.position} “${item.token}”`).join(" · ")}{parsed.invalidCount > parsed.invalidTokens.length ? ` · +${parsed.invalidCount - parsed.invalidTokens.length} more` : ""}</p></div> : null}
        </section>

        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-3 py-2.5">
            <div className="flex flex-wrap gap-1">{tabItems.map((tab) => <Button key={tab.id} size="sm" variant={activeTab === tab.id ? "primary" : "ghost"} onClick={() => setActiveTab(tab.id)}>{tab.label}</Button>)}</div>
            <CopyButton text={summaryMarkdown} size="sm" variant="secondary" disabled={!stats}>Copy summary</CopyButton>
          </div>

          <div className="p-4">
            {!stats ? <div className="flex min-h-72 items-center justify-center text-sm text-[var(--color-text-tertiary)]">Enter at least one valid number to start the analysis.</div> : null}

            {stats && activeTab === "overview" ? <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MetricCard label="Count" value={stats.count.toLocaleString()} hint={`${stats.uniqueCount} unique`} />
                <MetricCard label="Sum" value={f(stats.sum)} />
                <MetricCard label="Mean" value={f(stats.mean)} />
                <MetricCard label="Median" value={f(stats.median)} />
                <MetricCard label="Mode" value={stats.modes.length ? stats.modes.map(f).join(", ") : "None"} hint={stats.modes.length ? `${stats.modeFrequency} occurrences` : "No repeated value"} />
                <MetricCard label="Range" value={f(stats.range)} hint={`${f(stats.min)} → ${f(stats.max)}`} />
                <MetricCard label="IQR" value={f(stats.iqr)} hint={`${f(stats.q1)} → ${f(stats.q3)}`} />
                <MetricCard label={`${options.varianceFocus === "sample" ? "Sample" : "Population"} SD`} value={f(focusedStdDev)} hint={`Variance ${f(options.varianceFocus === "sample" ? stats.varianceSample : stats.variancePopulation)}`} />
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <section><div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]"><BarChart3 className="h-4 w-4" />Distribution histogram</div><HistogramChart bins={histogram} precision={options.precision} /></section>
                <section><div className="mb-2 text-sm font-bold text-[var(--color-text-primary)]">Five-number summary</div><BoxPlot stats={stats} precision={options.precision} /></section>
              </div>
            </div> : null}

            {stats && activeTab === "percentiles" ? <div className="grid gap-4 lg:grid-cols-2">
              <section className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]"><div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-bold text-[var(--color-text-primary)]">Percentile table</div><dl>{[
                ["P10", stats.p10], ["Q1 / P25", stats.q1], ["Median / P50", stats.median], ["Q3 / P75", stats.q3], ["P90", stats.p90], ["P95", stats.p95],
              ].map(([label, value]) => <div key={String(label)} className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-3 py-2 text-sm last:border-0"><dt className="text-[var(--color-text-tertiary)]">{label}</dt><dd className="font-mono font-bold text-[var(--color-text-primary)]">{f(value as number)}</dd></div>)}</dl></section>
              <section className="space-y-2"><MetricCard label="Lower fence" value={f(stats.lowerFence)} hint="Q1 − 1.5 × IQR" /><MetricCard label="Upper fence" value={f(stats.upperFence)} hint="Q3 + 1.5 × IQR" /><MetricCard label="Coefficient of variation" value={stats.coefficientOfVariation === null ? "Undefined" : `${f(stats.coefficientOfVariation * 100)}%`} hint="Population SD ÷ |mean|" /><MetricCard label="Sample skewness" value={stats.skewness === null ? "Unavailable" : f(stats.skewness)} hint={stats.skewness === null ? "Needs 3+ non-constant values" : stats.skewness > 0 ? "Right-skewed" : stats.skewness < 0 ? "Left-skewed" : "Approximately symmetric"} /></section>
            </div> : null}

            {stats && activeTab === "outliers" ? <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-3"><MetricCard label="Outlier count" value={stats.outliers.length.toLocaleString()} hint={`${f((stats.outliers.length / stats.count) * 100)}% of values`} /><MetricCard label="Lower fence" value={f(stats.lowerFence)} /><MetricCard label="Upper fence" value={f(stats.upperFence)} /></div>
              {stats.outliers.length ? <div className="max-h-80 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]"><table className="w-full border-collapse text-sm"><thead className="sticky top-0 bg-[var(--color-surface-subtle)] text-left text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Value</th><th className="px-3 py-2">Direction</th><th className="px-3 py-2 text-right">Distance from fence</th></tr></thead><tbody>{stats.outliers.map((value, index) => { const low = value < stats.lowerFence; const distance = low ? stats.lowerFence - value : value - stats.upperFence; return <tr key={`${value}-${index}`} className="border-t border-[var(--color-border-subtle)]"><td className="px-3 py-2 text-[var(--color-text-tertiary)]">{index + 1}</td><td className="px-3 py-2 font-mono font-bold text-[var(--color-text-primary)]">{f(value)}</td><td className="px-3 py-2">{low ? "Below lower fence" : "Above upper fence"}</td><td className="px-3 py-2 text-right font-mono">{f(distance)}</td></tr>; })}</tbody></table></div> : <div className="rounded-[var(--radius-md)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-5 text-center text-sm text-[var(--color-success-text)]"><CheckCircle2 className="mx-auto mb-2 h-5 w-5" />No observations fall outside the 1.5×IQR fences.</div>}
              <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">An IQR flag is a review signal, not an instruction to delete data. Confirm measurement errors and domain context first.</p>
            </div> : null}

            {stats && activeTab === "clean-data" ? <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-[var(--color-text-tertiary)]">Sorted finite values used for every calculation.</p><CopyButton text={stats.sorted.join("\n")} size="sm" variant="secondary">Copy values</CopyButton></div>
              <Textarea value={stats.sorted.map((value) => String(value)).join("\n")} readOnly rows={16} className="font-mono" aria-label="Clean sorted numeric values" />
            </div> : null}
          </div>
        </section>
      </main>

      <aside className="min-w-0 space-y-4">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
          <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Sparkles className="h-4 w-4" />Practical presets</div>
          <div className="space-y-2">{STATS_PRESETS.map((preset) => <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-2.5 text-left transition hover:border-[var(--color-accent)]"><div className="text-sm font-bold text-[var(--color-text-primary)]">{preset.label}</div><div className="mt-0.5 text-[11px] leading-4 text-[var(--color-text-tertiary)]">{preset.description}</div></button>)}</div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
          <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><BarChart3 className="h-4 w-4" />Analysis options</div>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[var(--color-text-muted)]">Percentile method<Select size="sm" className="mt-1" value={options.percentileMethod} onChange={(event) => updateOption("percentileMethod", event.target.value as PercentileMethod)}><option value="linear">Linear interpolation</option><option value="nearest-rank">Nearest rank</option></Select></label>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)]">Primary variance<Select size="sm" className="mt-1" value={options.varianceFocus} onChange={(event) => updateOption("varianceFocus", event.target.value as VarianceFocus)}><option value="sample">Sample (n − 1)</option><option value="population">Population (n)</option></Select></label>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)]">Histogram bins<Select size="sm" className="mt-1" value={String(options.histogramBins)} onChange={(event) => updateOption("histogramBins", event.target.value === "auto" ? "auto" : Number(event.target.value) as HistogramBinSetting)}><option value="auto">Automatic</option><option value="5">5 bins</option><option value="10">10 bins</option><option value="20">20 bins</option></Select></label>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)]">Display precision<Select size="sm" className="mt-1" value={String(options.precision)} onChange={(event) => updateOption("precision", Number(event.target.value))}>{[2, 3, 4, 5, 6, 8].map((value) => <option key={value} value={value}>{value} decimals max</option>)}</Select></label>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
          <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><ShieldCheck className="h-4 w-4" />Production checks</div>
          <div className="space-y-2">{checks.map((check) => <div key={check.id} className={`rounded-[var(--radius-sm)] border p-2.5 text-xs ${CHECK_STYLES[check.level]}`}><div className="flex items-center gap-2 font-bold">{check.level === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}{check.title}</div><p className="mt-1 leading-4 opacity-90">{check.message}</p></div>)}</div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
          <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><PackageCheck className="h-4 w-4" />Production exports</div>
          <div className="space-y-2">
            <Button className="w-full" variant="secondary" disabled={!stats} onClick={() => downloadText("statistics-summary.md", summaryMarkdown, "text/markdown;charset=utf-8")}><Download className="h-4 w-4" />Markdown summary</Button>
            <Button className="w-full" variant="secondary" disabled={!stats} onClick={() => downloadText("statistics.csv", metricsCsv, "text/csv;charset=utf-8")}><FileSpreadsheet className="h-4 w-4" />Metrics CSV</Button>
            <Button className="w-full" variant="secondary" disabled={!stats} onClick={() => downloadText("statistics-report.json", reportJson, "application/json;charset=utf-8")}><FileJson className="h-4 w-4" />JSON audit report</Button>
            <Button className="w-full" disabled={!stats} onClick={downloadAnalysisPack}><Download className="h-4 w-4" />Download analysis pack</Button>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-xs leading-5 text-[var(--color-info-text)]"><div className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />Private browser analysis</div><p className="mt-1">Parsing, calculations, charts, reports, and ZIP creation happen locally. No data set is uploaded to Darma.</p></section>
      </aside>
    </div>
  </div>;
}
