"use client";

import JSZip from "jszip";
import {
  ArrowLeftRight,
  Braces,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Download,
  FileJson,
  FileSpreadsheet,
  Gauge,
  Info,
  Layers3,
  Ruler,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TableProperties,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { Button, CopyButton, Input, Select, Textarea } from "@/components/ui";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { downloadTextFile } from "@/features/tools/export/downloadText";
import {
  CATEGORIES,
  DEFAULT_FORMAT,
  buildAllConversions,
  buildBatchCsv,
  buildChecks,
  buildConversionsCsv,
  buildJavaScriptSnippet,
  buildMarkdownReport,
  buildReport,
  computeConversion,
  formatResult,
  getCategory,
  getUnit,
  parseBatchInput,
  systemLabel,
} from "./convert";
import { UNIT_PRESETS } from "./presets";
import type {
  ConversionCheck,
  ConversionFormat,
  UnitCheckLevel,
  UnitFormatMode,
  UnitTab,
} from "./types";

const DEFAULT_UNITS: Record<string, [string, string]> = {
  length: ["m", "ft"],
  mass: ["kg", "lb"],
  temperature: ["c", "f"],
  volume: ["l", "gal"],
  area: ["m2", "ft2"],
  speed: ["kmh", "mph"],
  digital: ["MB", "MiB"],
  time: ["h", "min"],
};

const FORMAT_LABELS: Record<UnitFormatMode, string> = {
  auto: "Auto",
  fixed: "Fixed decimals",
  significant: "Significant digits",
  scientific: "Scientific",
};

function parseInput(value: string): number {
  if (!value.trim()) return Number.NaN;
  return Number(value.replaceAll(",", ""));
}

function SummaryCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</span>
        <span className="text-[var(--color-primary)]">{icon}</span>
      </div>
      <div className="mt-1 truncate text-lg font-black text-[var(--color-text-primary)]" title={value}>{value}</div>
      <div className="mt-0.5 truncate text-[10px] text-[var(--color-text-tertiary)]" title={hint}>{hint}</div>
    </div>
  );
}

function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className="block min-w-0 text-[11px] font-bold text-[var(--color-text-secondary)]">
      <span className="flex items-center justify-between gap-2">
        <span>{children}</span>
        {hint ? <span className="font-normal text-[var(--color-text-tertiary)]">{hint}</span> : null}
      </span>
    </label>
  );
}

function CheckIcon({ level }: { level: UnitCheckLevel }) {
  if (level === "success") return <CheckCircle2 className="h-4 w-4" />;
  if (level === "danger") return <ShieldAlert className="h-4 w-4" />;
  if (level === "warning") return <TriangleAlert className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

function checkTone(level: UnitCheckLevel): string {
  if (level === "success") return "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]";
  if (level === "danger") return "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]";
  if (level === "warning") return "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]";
  return "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]";
}

function ChecksList({ checks }: { checks: ConversionCheck[] }) {
  return (
    <div className="space-y-2">
      {checks.map((check) => (
        <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${checkTone(check.level)}`}>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0"><CheckIcon level={check.level} /></span>
            <div className="min-w-0">
              <div className="text-xs font-black">{check.title}</div>
              <p className="mt-0.5 text-[11px] leading-5 opacity-90">{check.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UnitConverterClient() {
  const [categoryId, setCategoryId] = useState("length");
  const [fromId, setFromId] = useState("m");
  const [toId, setToId] = useState("ft");
  const [rawValue, setRawValue] = useState("1");
  const [format, setFormat] = useState<ConversionFormat>(DEFAULT_FORMAT);
  const [batchInput, setBatchInput] = useState("1\n2.5\n10");
  const [activeTab, setActiveTab] = useState<UnitTab>("overview");

  const category = getCategory(categoryId) ?? CATEGORIES[0];
  const value = parseInput(rawValue);
  const request = useMemo(() => ({ categoryId, value, fromId, toId }), [categoryId, value, fromId, toId]);
  const outcome = useMemo(() => computeConversion(request), [request]);
  const allConversions = useMemo(() => buildAllConversions(request), [request]);
  const batchRows = useMemo(() => parseBatchInput(batchInput, categoryId, fromId, toId), [batchInput, categoryId, fromId, toId]);
  const checks = useMemo(() => buildChecks(outcome, batchRows), [outcome, batchRows]);
  const report = useMemo(() => buildReport(request, format, outcome, checks, batchRows), [request, format, outcome, checks, batchRows]);

  const fromUnit = outcome.fromUnit ?? getUnit(category, fromId);
  const toUnit = outcome.toUnit ?? getUnit(category, toId);
  const resultText = outcome.valid ? formatResult(outcome.outputValue, format) : "—";
  const inputText = Number.isFinite(value) ? formatResult(value, format) : "—";
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  const validBatchRows = batchRows.filter((row) => !row.error).length;
  const summary = outcome.valid && fromUnit && toUnit
    ? `${inputText} ${fromUnit.symbol} = ${resultText} ${toUnit.symbol}`
    : outcome.error ?? "Invalid conversion";

  function patchFormat(patch: Partial<ConversionFormat>) {
    setFormat((current) => ({ ...current, ...patch }));
  }

  function changeCategory(nextId: string) {
    const next = getCategory(nextId);
    if (!next) return;
    const [nextFrom, nextTo] = DEFAULT_UNITS[nextId] ?? [next.units[0].id, next.units[1]?.id ?? next.units[0].id];
    setCategoryId(nextId);
    setFromId(nextFrom);
    setToId(nextTo);
  }

  function swapUnits() {
    setFromId(toId);
    setToId(fromId);
  }

  function applyPreset(id: string) {
    const preset = UNIT_PRESETS.find((candidate) => candidate.id === id);
    if (!preset) return;
    setCategoryId(preset.categoryId);
    setFromId(preset.fromId);
    setToId(preset.toId);
    setRawValue(String(preset.value));
    setBatchInput(preset.batchInput ?? String(preset.value));
    setActiveTab("overview");
  }

  function reset() {
    setCategoryId("length");
    setFromId("m");
    setToId("ft");
    setRawValue("1");
    setFormat(DEFAULT_FORMAT);
    setBatchInput("1\n2.5\n10");
    setActiveTab("overview");
  }

  function downloadText(filename: string, content: string, mimeType = "text/plain;charset=utf-8") {
    downloadTextFile({ filename, content, mimeType });
  }

  async function downloadPack() {
    const zip = new JSZip();
    zip.file("conversion-report.md", buildMarkdownReport(report));
    zip.file("conversion-report.json", JSON.stringify(report, null, 2));
    zip.file("all-units.csv", buildConversionsCsv(request, format));
    zip.file("batch-conversions.csv", buildBatchCsv(batchRows, format));
    zip.file("convert.js", buildJavaScriptSnippet(request));
    zip.file("README.txt", "Generated locally by Darma Unit Converter Studio. Confirm the required measurement standard before regulated or contractual use.\n");
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlobFile({ blob, filename: "unit-conversion-pack.zip" });
  }

  const tabs: Array<{ id: UnitTab; label: string; icon: ReactNode }> = [
    { id: "overview", label: "Overview", icon: <Gauge className="h-3.5 w-3.5" /> },
    { id: "table", label: "All units", icon: <TableProperties className="h-3.5 w-3.5" /> },
    { id: "batch", label: "Batch", icon: <ClipboardList className="h-3.5 w-3.5" /> },
    { id: "exports", label: "Checks & exports", icon: <Download className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <SummaryCard label="Converted value" value={resultText} hint={toUnit ? `${toUnit.name} (${toUnit.symbol})` : "destination unit"} icon={<Calculator className="h-4 w-4" />} />
        <SummaryCard label="Category" value={category.label} hint={`${category.units.length} supported units`} icon={<Layers3 className="h-4 w-4" />} />
        <SummaryCard label="Conversion system" value={fromUnit && toUnit ? `${systemLabel(fromUnit.system)} → ${systemLabel(toUnit.system)}` : "—"} hint="measurement standards" icon={<Ruler className="h-4 w-4" />} />
        <SummaryCard label="Production review" value={outcome.valid ? (reviewCount ? `${reviewCount} review` : "Ready") : "Blocked"} hint={`${checks.length} checks completed`} icon={outcome.valid && !reviewCount ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><Sparkles className="h-4 w-4 text-[var(--color-primary)]" />Practical presets</h2>
                <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">Load a realistic conversion and edit it.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={reset}>Reset</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {UNIT_PRESETS.map((preset) => (
                <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2.5 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-control-hover)]">
                  <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.name}</span>
                  <span className="mt-1 block line-clamp-2 text-[10px] leading-4 text-[var(--color-text-tertiary)]">{preset.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-3">
              <h2 className="text-sm font-black text-[var(--color-text-primary)]">Conversion controls</h2>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">Choose a quantity, value, and exact unit standards.</p>
            </div>
            <div className="space-y-3">
              <div>
                <FieldLabel>Category</FieldLabel>
                <Select className="mt-1" value={categoryId} onChange={(event: ChangeEvent<HTMLSelectElement>) => changeCategory(event.target.value)} aria-label="Conversion category">
                  {CATEGORIES.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
                </Select>
                <p className="mt-1 text-[10px] leading-4 text-[var(--color-text-tertiary)]">{category.description}</p>
              </div>

              <div>
                <FieldLabel hint={fromUnit?.symbol}>Value</FieldLabel>
                <Input className="mt-1" type="text" inputMode="decimal" value={rawValue} onChange={(event: ChangeEvent<HTMLInputElement>) => setRawValue(event.target.value)} aria-label="Value to convert" aria-invalid={!Number.isFinite(value)} placeholder="Enter a finite number" />
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <div className="min-w-0">
                  <FieldLabel hint={fromUnit ? systemLabel(fromUnit.system) : undefined}>From</FieldLabel>
                  <Select className="mt-1" value={fromId} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFromId(event.target.value)} aria-label="Source unit">
                    {category.units.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} ({candidate.symbol})</option>)}
                  </Select>
                </div>
                <Button size="sm" variant="secondary" onClick={swapUnits} aria-label="Swap source and destination units"><ArrowLeftRight className="h-4 w-4" /></Button>
                <div className="min-w-0">
                  <FieldLabel hint={toUnit ? systemLabel(toUnit.system) : undefined}>To</FieldLabel>
                  <Select className="mt-1" value={toId} onChange={(event: ChangeEvent<HTMLSelectElement>) => setToId(event.target.value)} aria-label="Destination unit">
                    {category.units.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} ({candidate.symbol})</option>)}
                  </Select>
                </div>
              </div>

              {!outcome.valid ? <div className="rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-3 py-2 text-xs font-semibold text-[var(--color-danger-text)]">{outcome.error}</div> : null}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <h2 className="text-sm font-black text-[var(--color-text-primary)]">Display precision</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Format</FieldLabel>
                <Select className="mt-1" value={format.mode} onChange={(event: ChangeEvent<HTMLSelectElement>) => patchFormat({ mode: event.target.value as UnitFormatMode })} aria-label="Number format">
                  {Object.entries(FORMAT_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </Select>
              </div>
              <div>
                <FieldLabel>{format.mode === "fixed" ? "Decimals" : "Precision"}</FieldLabel>
                <Select className="mt-1" value={String(format.precision)} onChange={(event: ChangeEvent<HTMLSelectElement>) => patchFormat({ precision: Number(event.target.value) })} aria-label="Number precision">
                  {[0, 2, 4, 6, 8, 10, 12].map((precision) => <option key={precision} value={precision}>{precision}</option>)}
                </Select>
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
              <input type="checkbox" checked={format.useGrouping} onChange={(event: ChangeEvent<HTMLInputElement>) => patchFormat({ useGrouping: event.target.checked })} />
              Use thousands separators
            </label>
          </section>
        </aside>

        <main className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--color-border-subtle)] p-3">
            <div className="flex flex-wrap gap-1.5">
              {tabs.map((tab) => (
                <Button key={tab.id} size="sm" variant={activeTab === tab.id ? "primary" : "secondary"} onClick={() => setActiveTab(tab.id)} leftIcon={tab.icon}>{tab.label}</Button>
              ))}
            </div>
          </div>

          <div className="p-4">
            {activeTab === "overview" ? (
              <div className="space-y-4">
                <section className={`rounded-[var(--radius-lg)] border p-5 ${outcome.valid ? "border-[var(--color-primary)]/30 bg-[var(--color-primary-subtle)]" : "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--color-text-tertiary)]">Converted value</div>
                      <div className="mt-1 break-words font-mono text-4xl font-black tracking-tight text-[var(--color-text-primary)]">{resultText} <span className="text-2xl text-[var(--color-text-tertiary)]">{toUnit?.symbol}</span></div>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-text-secondary)]">{summary}</p>
                    </div>
                    <CopyButton text={summary} size="sm" variant="secondary" disabled={!outcome.valid}>Copy result</CopyButton>
                  </div>
                </section>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Input</div>
                    <div className="mt-1 font-mono text-lg font-black text-[var(--color-text-primary)]">{inputText} {fromUnit?.symbol}</div>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Multiplier</div>
                    <div className="mt-1 font-mono text-lg font-black text-[var(--color-text-primary)]">{outcome.factor == null ? "Offset formula" : formatResult(outcome.factor, { mode: "significant", precision: 8, useGrouping: false })}</div>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Standard</div>
                    <div className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{fromUnit && toUnit ? `${systemLabel(fromUnit.system)} → ${systemLabel(toUnit.system)}` : "—"}</div>
                  </div>
                </div>

                <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                  <h3 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><Braces className="h-4 w-4 text-[var(--color-primary)]" />Formula and method</h3>
                  <div className="mt-3 break-words rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-code-bg)] px-3 py-2 font-mono text-xs leading-6 text-[var(--color-code-text)]">{outcome.substitutedFormula || outcome.formula || "Enter a valid value."}</div>
                  {outcome.steps.length ? <ol className="mt-3 list-inside list-decimal space-y-1 text-xs leading-5 text-[var(--color-text-secondary)]">{outcome.steps.map((step) => <li key={step}>{step}</li>)}</ol> : null}
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-[var(--color-text-primary)]">Production checks</h3>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">{checks.length} completed</span>
                  </div>
                  <ChecksList checks={checks.slice(0, 4)} />
                </section>
              </div>
            ) : null}

            {activeTab === "table" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black text-[var(--color-text-primary)]">All {category.label.toLowerCase()} units</h2>
                    <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">Use a row as the destination or export the full comparison.</p>
                  </div>
                  <Button size="sm" variant="secondary" leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />} onClick={() => downloadText("unit-conversions.csv", buildConversionsCsv(request, format), "text/csv;charset=utf-8")}>Download CSV</Button>
                </div>
                <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
                  <table className="w-full min-w-[620px] text-left text-xs">
                    <thead className="bg-[var(--color-surface-subtle)] text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                      <tr><th className="px-3 py-2">Unit</th><th className="px-3 py-2">System</th><th className="px-3 py-2 text-right">Converted value</th><th className="px-3 py-2 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)]">
                      {allConversions.map(({ unit, value: converted }) => (
                        <tr key={unit.id} className={unit.id === toId ? "bg-[var(--color-primary-subtle)]" : "bg-[var(--color-surface-base)]"}>
                          <td className="px-3 py-2"><div className="font-bold text-[var(--color-text-primary)]">{unit.name}</div><div className="text-[10px] text-[var(--color-text-tertiary)]">{unit.symbol}</div></td>
                          <td className="px-3 py-2 text-[var(--color-text-secondary)]">{systemLabel(unit.system)}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-[var(--color-text-primary)]">{formatResult(converted, format)} {unit.symbol}</td>
                          <td className="px-3 py-2 text-right"><Button size="sm" variant={unit.id === toId ? "primary" : "ghost"} onClick={() => setToId(unit.id)} disabled={unit.id === toId}>{unit.id === toId ? "Selected" : "Use target"}</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {activeTab === "batch" ? (
              <div className="space-y-4">
                <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-black text-[var(--color-text-primary)]">Batch conversion</h2>
                      <p className="mt-0.5 text-[11px] leading-5 text-[var(--color-text-tertiary)]">One value per line. Add an optional unit such as <code>5 km</code>; rows without a unit use {fromUnit?.symbol}.</p>
                    </div>
                    <Button size="sm" variant="secondary" leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />} onClick={() => downloadText("batch-conversions.csv", buildBatchCsv(batchRows, format), "text/csv;charset=utf-8")} disabled={!batchRows.length}>Download CSV</Button>
                  </div>
                  <Textarea className="mt-3 min-h-36 font-mono text-xs" value={batchInput} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setBatchInput(event.target.value)} aria-label="Batch values" placeholder={`1\n2.5\n10 ${fromUnit?.symbol ?? ""}`} />
                  <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-[var(--color-text-tertiary)]"><span>{batchRows.length} parsed rows</span><span>{validBatchRows} valid</span><span>{batchRows.length - validBatchRows} invalid</span></div>
                </section>

                <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead className="bg-[var(--color-surface-subtle)] text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]"><tr><th className="px-3 py-2">Line</th><th className="px-3 py-2">Input</th><th className="px-3 py-2">Source</th><th className="px-3 py-2 text-right">Result</th><th className="px-3 py-2">Status</th></tr></thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)]">
                      {batchRows.length ? batchRows.map((row) => (
                        <tr key={`${row.lineNumber}-${row.raw}`} className="bg-[var(--color-surface-base)]">
                          <td className="px-3 py-2 font-mono text-[var(--color-text-tertiary)]">{row.lineNumber}</td>
                          <td className="max-w-52 truncate px-3 py-2 font-mono text-[var(--color-text-primary)]" title={row.raw}>{row.raw}</td>
                          <td className="px-3 py-2 text-[var(--color-text-secondary)]">{row.fromSymbol ?? "—"}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-[var(--color-text-primary)]">{row.outputValue == null ? "—" : `${formatResult(row.outputValue, format)} ${toUnit?.symbol ?? row.toUnitId}`}</td>
                          <td className={`px-3 py-2 ${row.error ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}>{row.error ?? "Ready"}</td>
                        </tr>
                      )) : <tr><td colSpan={5} className="px-3 py-8 text-center text-[var(--color-text-tertiary)]">Enter batch values to preview converted rows.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {activeTab === "exports" ? (
              <div className="space-y-4">
                <section>
                  <h2 className="mb-2 text-sm font-black text-[var(--color-text-primary)]">Production checks</h2>
                  <ChecksList checks={checks} />
                </section>

                <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                  <h2 className="text-sm font-black text-[var(--color-text-primary)]">Export pack</h2>
                  <p className="mt-1 text-[11px] leading-5 text-[var(--color-text-tertiary)]">Download a human-readable report, machine-readable audit, comparison tables, or a reusable JavaScript helper.</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <Button size="sm" variant="secondary" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={() => downloadText("unit-conversion-report.md", buildMarkdownReport(report), "text/markdown;charset=utf-8")}>Markdown report</Button>
                    <Button size="sm" variant="secondary" leftIcon={<FileJson className="h-3.5 w-3.5" />} onClick={() => downloadText("unit-conversion-report.json", JSON.stringify(report, null, 2), "application/json;charset=utf-8")}>JSON audit</Button>
                    <Button size="sm" variant="secondary" leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />} onClick={() => downloadText("all-unit-conversions.csv", buildConversionsCsv(request, format), "text/csv;charset=utf-8")}>All units CSV</Button>
                    <Button size="sm" variant="secondary" leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />} onClick={() => downloadText("batch-conversions.csv", buildBatchCsv(batchRows, format), "text/csv;charset=utf-8")}>Batch CSV</Button>
                    <Button size="sm" variant="secondary" leftIcon={<Braces className="h-3.5 w-3.5" />} onClick={() => downloadText("convert.js", buildJavaScriptSnippet(request), "text/javascript;charset=utf-8")}>JavaScript helper</Button>
                    <Button size="sm" variant="primary" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={() => void downloadPack()}>ZIP production pack</Button>
                  </div>
                </section>

                <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-code-bg)] p-4">
                  <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-sm font-black text-[var(--color-code-text)]">JavaScript preview</h3><CopyButton text={buildJavaScriptSnippet(request)} size="sm" variant="secondary">Copy code</CopyButton></div>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-[var(--color-code-text)]">{buildJavaScriptSnippet(request)}</pre>
                </section>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
