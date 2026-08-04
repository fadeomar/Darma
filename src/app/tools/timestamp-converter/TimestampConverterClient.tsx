"use client";

import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import JSZip from "jszip";
import {
  AlertTriangle,
  Braces,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Code2,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Globe2,
  History,
  ListChecks,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { Button, CopyButton, Input, Select, Textarea } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import {
  COMMON_TIME_ZONES,
  buildBatchCsv,
  buildJavaScriptStarter,
  buildMarkdownReport,
  buildTimeZoneRows,
  buildTimestampChecks,
  buildTimestampReport,
  convertDateInput,
  convertTimestampInput,
  getBrowserTimeZone,
  parseBatchTimestamps,
  toDateTimeLocalValue,
} from "./timestamp";
import { TIMESTAMP_PRESETS } from "./presets";
import type {
  DateInputMode,
  TimeZoneOption,
  TimestampCheckLevel,
  TimestampInputMode,
  TimestampTab,
  TimestampUnitMode,
} from "./types";

const CHECK_STYLES: Record<TimestampCheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function SummaryCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</span>
        <span className="text-[var(--color-primary-text-strong)]">{icon}</span>
      </div>
      <div className="mt-1 truncate text-lg font-black tracking-tight text-[var(--color-text-primary)]" title={value}>{value}</div>
      <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
        <span>{label}</span>
        {hint ? <span className="font-normal text-[var(--color-text-tertiary)]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[var(--radius-sm)] px-2.5 py-2 text-xs font-bold transition ${active ? "bg-[var(--color-surface-base)] text-[var(--color-primary-text-strong)] shadow-[var(--shadow-xs)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"}`}
    >
      {children}
    </button>
  );
}

function makeBrowserZone(): TimeZoneOption {
  const zone = getBrowserTimeZone();
  return { id: "browser", label: "Browser local", zone };
}

function nowSeconds() {
  return String(Math.floor(Date.now() / 1000));
}

export default function TimestampConverterClient() {
  const initialNow = useMemo(() => new Date(), []);
  const [inputMode, setInputMode] = useState<TimestampInputMode>("epoch");
  const [timestamp, setTimestamp] = useState(String(Math.floor(initialNow.getTime() / 1000)));
  const [unitMode, setUnitMode] = useState<TimestampUnitMode>("auto");
  const [dateMode, setDateMode] = useState<DateInputMode>("iso");
  const [dateInput, setDateInput] = useState(initialNow.toISOString());
  const [batchInput, setBatchInput] = useState("1700000000 seconds\n1700000000000 ms\n1700000000123456 us");
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>(["browser", "utc", "hebron", "new-york"]);
  const [activeTab, setActiveTab] = useState<TimestampTab>("overview");
  const [zipBusy, setZipBusy] = useState(false);

  const zoneOptions = useMemo(() => [makeBrowserZone(), ...COMMON_TIME_ZONES], []);
  const timestampResult = useMemo(() => convertTimestampInput(timestamp, unitMode), [timestamp, unitMode]);
  const dateResult = useMemo(() => convertDateInput(dateInput, dateMode), [dateInput, dateMode]);
  const batchRows = useMemo(() => parseBatchTimestamps(batchInput, unitMode), [batchInput, unitMode]);

  const activeResult = inputMode === "epoch" ? timestampResult : inputMode === "date" ? dateResult : undefined;
  const activeDate = activeResult?.ok && activeResult.status === "valid" ? activeResult.date : null;
  const formats = activeResult?.ok && activeResult.status === "valid" ? activeResult.formats : null;
  const selectedZones = useMemo(
    () => zoneOptions.filter((zone) => selectedZoneIds.includes(zone.id)),
    [selectedZoneIds, zoneOptions],
  );
  const zoneRows = useMemo(() => activeDate ? buildTimeZoneRows(activeDate, selectedZones) : [], [activeDate, selectedZones]);
  const checks = useMemo(() => buildTimestampChecks({
    inputMode,
    timestampResult,
    dateResult,
    batchRows: inputMode === "batch" ? batchRows : [],
    zoneRows,
  }), [inputMode, timestampResult, dateResult, batchRows, zoneRows]);
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  const sourceValue = inputMode === "epoch" ? timestamp : inputMode === "date" ? dateInput : batchInput;
  const report = useMemo(() => buildTimestampReport({
    inputMode,
    sourceValue,
    requestedUnit: inputMode !== "date" ? unitMode : undefined,
    dateMode: inputMode === "date" ? dateMode : undefined,
    result: activeResult,
    zoneRows,
    batchRows: inputMode === "batch" ? batchRows : [],
    checks,
  }), [inputMode, sourceValue, unitMode, dateMode, activeResult, zoneRows, batchRows, checks]);
  const reportJson = useMemo(() => JSON.stringify(report, null, 2), [report]);
  const markdown = useMemo(() => buildMarkdownReport(report), [report]);
  const batchCsv = useMemo(() => buildBatchCsv(batchRows), [batchRows]);
  const javascript = useMemo(() => buildJavaScriptStarter(unitMode), [unitMode]);

  const validBatchCount = batchRows.filter((row) => row.ok).length;
  const summaryInstant = inputMode === "batch"
    ? `${validBatchCount}/${batchRows.length || 0} valid`
    : formats?.iso.replace(".000Z", "Z") ?? "Awaiting input";
  const summaryUnit = inputMode === "epoch" && timestampResult.ok && timestampResult.status === "valid"
    ? timestampResult.detectedLabel
    : inputMode === "date"
      ? dateMode === "iso" ? "ISO 8601" : "Browser local"
      : unitMode === "auto" ? "Mixed / auto" : unitMode;
  const summaryRelative = formats?.relative ?? (inputMode === "batch" ? `${batchRows.length} rows` : "—");

  function applyPreset(presetId: string) {
    const preset = TIMESTAMP_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setInputMode(preset.inputMode);
    if (preset.timestamp !== undefined) setTimestamp(preset.timestamp);
    if (preset.unitMode !== undefined) setUnitMode(preset.unitMode);
    if (preset.dateMode !== undefined) setDateMode(preset.dateMode);
    if (preset.dateInput !== undefined) setDateInput(preset.dateInput);
    if (preset.batchInput !== undefined) setBatchInput(preset.batchInput);
    setActiveTab(preset.inputMode === "batch" ? "batch" : "overview");
  }

  function useCurrentTime() {
    const now = new Date();
    setTimestamp(String(Math.floor(now.getTime() / 1000)));
    setUnitMode("seconds");
    setDateInput(dateMode === "iso" ? now.toISOString() : toDateTimeLocalValue(now));
  }

  function toggleZone(id: string) {
    setSelectedZoneIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function downloadPack() {
    setZipBusy(true);
    try {
      const zip = new JSZip();
      zip.file("timestamp-report.md", markdown);
      zip.file("timestamp-report.json", reportJson);
      zip.file("batch-conversions.csv", batchCsv);
      zip.file("timestamp-helper.js", javascript);
      if (formats) {
        zip.file("formats.txt", [
          `ISO: ${formats.iso}`,
          `UTC: ${formats.utc}`,
          `Local: ${formats.local}`,
          `Unix seconds: ${formats.unixSeconds}`,
          `Unix milliseconds: ${formats.unixMilliseconds}`,
          `Unix microseconds: ${formats.unixMicroseconds}`,
          `Unix nanoseconds: ${formats.unixNanoseconds}`,
        ].join("\n"));
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "darma-timestamp-conversion-pack.zip";
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipBusy(false);
    }
  }

  const formatRows = formats ? [
    ["ISO 8601", formats.iso],
    ["UTC", formats.utc],
    ["Browser local", formats.local],
    ["Unix seconds", formats.unixSeconds],
    ["Unix milliseconds", formats.unixMilliseconds],
    ["Unix microseconds", formats.unixMicroseconds],
    ["Unix nanoseconds", formats.unixNanoseconds],
    ["Timezone offset", formats.timezoneOffset],
  ] : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Instant" value={summaryInstant} hint={inputMode === "batch" ? "Successful batch rows" : "Normalized ISO output"} icon={<CalendarClock className="h-4 w-4" />} />
        <SummaryCard label="Source" value={summaryUnit} hint={inputMode === "epoch" ? "Detected or selected epoch unit" : "Input interpretation"} icon={<TimerReset className="h-4 w-4" />} />
        <SummaryCard label="Relative" value={summaryRelative} hint={inputMode === "batch" ? "One timestamp per line" : "Compared with the current instant"} icon={<History className="h-4 w-4" />} />
        <SummaryCard label="Review" value={reviewCount ? `${reviewCount} item${reviewCount === 1 ? "" : "s"}` : "Ready"} hint="Unit, range, precision, and batch checks" icon={reviewCount ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.45fr)] xl:items-start">
        <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)]">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
              <h2 className="text-sm font-black text-[var(--color-text-primary)]">Practical presets</h2>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {TIMESTAMP_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 text-left transition hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-soft)] focus:outline-none focus:shadow-[var(--focus-ring)]"
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]"><span aria-hidden>{preset.icon}</span>{preset.label}</span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-4 text-[var(--color-text-tertiary)]">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--color-border-subtle)] pt-4">
            <div className="grid grid-cols-3 gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-1">
              <ModeButton active={inputMode === "epoch"} onClick={() => setInputMode("epoch")}>Epoch</ModeButton>
              <ModeButton active={inputMode === "date"} onClick={() => setInputMode("date")}>Date</ModeButton>
              <ModeButton active={inputMode === "batch"} onClick={() => setInputMode("batch")}>Batch</ModeButton>
            </div>
          </div>

          {inputMode === "epoch" ? (
            <div className="space-y-3">
              <Field label="Epoch value" hint="Decimals supported">
                <Input className="w-full font-mono" value={timestamp} onChange={(event: ChangeEvent<HTMLInputElement>) => setTimestamp(event.target.value)} placeholder="1700000000" />
              </Field>
              <Field label="Epoch unit">
                <Select className="w-full" value={unitMode} onChange={(event: ChangeEvent<HTMLSelectElement>) => setUnitMode(event.target.value as TimestampUnitMode)}>
                  <option value="auto">Auto-detect</option>
                  <option value="seconds">Seconds</option>
                  <option value="milliseconds">Milliseconds</option>
                  <option value="microseconds">Microseconds</option>
                  <option value="nanoseconds">Nanoseconds</option>
                </Select>
              </Field>
              <Button size="sm" variant="secondary" onClick={() => { setTimestamp(nowSeconds()); setUnitMode("seconds"); }}><RefreshCw className="h-3.5 w-3.5" />Use current epoch</Button>
            </div>
          ) : inputMode === "date" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-1">
                <ModeButton active={dateMode === "iso"} onClick={() => { setDateMode("iso"); setDateInput(new Date().toISOString()); }}>ISO + zone</ModeButton>
                <ModeButton active={dateMode === "local"} onClick={() => { setDateMode("local"); setDateInput(toDateTimeLocalValue(new Date())); }}>Browser local</ModeButton>
              </div>
              <Field label={dateMode === "iso" ? "ISO 8601 instant" : "Local date and time"} hint={dateMode === "iso" ? "Z or UTC offset required" : getBrowserTimeZone()}>
                {dateMode === "local" ? (
                  <Input type="datetime-local" step="1" className="w-full" value={dateInput} onChange={(event: ChangeEvent<HTMLInputElement>) => setDateInput(event.target.value)} />
                ) : (
                  <Input className="w-full font-mono" value={dateInput} onChange={(event: ChangeEvent<HTMLInputElement>) => setDateInput(event.target.value)} placeholder="2030-01-01T00:00:00Z" />
                )}
              </Field>
              <Button size="sm" variant="secondary" onClick={useCurrentTime}><Clock3 className="h-3.5 w-3.5" />Use current date</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Field label="Batch timestamps" hint="value or value + unit">
                <Textarea variant="editor" className="min-h-40 font-mono text-xs" value={batchInput} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setBatchInput(event.target.value)} placeholder={"1700000000 seconds\n1700000000000 ms"} />
              </Field>
              <Field label="Default unit for rows without a suffix">
                <Select className="w-full" value={unitMode} onChange={(event: ChangeEvent<HTMLSelectElement>) => setUnitMode(event.target.value as TimestampUnitMode)}>
                  <option value="auto">Auto-detect</option>
                  <option value="seconds">Seconds</option>
                  <option value="milliseconds">Milliseconds</option>
                  <option value="microseconds">Microseconds</option>
                  <option value="nanoseconds">Nanoseconds</option>
                </Select>
              </Field>
            </div>
          )}

          <div className="border-t border-[var(--color-border-subtle)] pt-4">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
              <h3 className="text-xs font-black text-[var(--color-text-primary)]">Time-zone comparison</h3>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {zoneOptions.map((zone) => (
                <label key={zone.id} className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-2.5 py-2 text-xs text-[var(--color-text-secondary)]">
                  <input type="checkbox" checked={selectedZoneIds.includes(zone.id)} onChange={() => toggleZone(zone.id)} className="h-3.5 w-3.5 accent-[var(--color-primary)]" />
                  <span className="truncate">{zone.label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] px-4 py-3">
            <div>
              <h2 className="text-sm font-black text-[var(--color-text-primary)]">Conversion workspace</h2>
              <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Compare interpretations, zones, batch rows, and export formats.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={useCurrentTime}><RefreshCw className="h-3.5 w-3.5" />Now</Button>
              <Button size="sm" onClick={downloadPack} disabled={zipBusy}><PackageCheck className="h-3.5 w-3.5" />{zipBusy ? "Packing…" : "Export pack"}</Button>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-1.5">
            {([
              ["overview", "Overview"],
              ["zones", "Time zones"],
              ["batch", `Batch${batchRows.length ? ` (${batchRows.length})` : ""}`],
              ["exports", "Exports"],
            ] as [TimestampTab, string][]).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)} className={`whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-2 text-xs font-bold transition ${activeTab === id ? "bg-[var(--color-surface-base)] text-[var(--color-primary-text-strong)] shadow-[var(--shadow-xs)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"}`}>{label}</button>
            ))}
          </div>

          <div className="min-h-[430px] p-4">
            {activeTab === "overview" ? (
              <div className="space-y-4">
                {formats ? (
                  <div className="grid gap-2">
                    {formatRows.map(([label, value]) => (
                      <div key={label} className="grid min-w-0 gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 sm:grid-cols-[145px_minmax(0,1fr)_auto] sm:items-center">
                        <div className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">{label}</div>
                        <code className="min-w-0 break-all font-mono text-xs text-[var(--color-text-primary)]">{value}</code>
                        <CopyButton text={value} size="sm" variant="secondary" aria-label={`Copy ${label}`}><Copy className="h-3.5 w-3.5" /></CopyButton>
                      </div>
                    ))}
                  </div>
                ) : inputMode === "batch" ? (
                  <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-6 text-center">
                    <ListChecks className="mx-auto h-8 w-8 text-[var(--color-primary-text-strong)]" />
                    <p className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">Batch mode is active</p>
                    <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Open the Batch tab to inspect each row.</p>
                  </div>
                ) : (
                  <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-6 text-center text-sm text-[var(--color-text-tertiary)]">Enter a valid timestamp or date to see normalized formats.</div>
                )}

                {inputMode === "epoch" && timestampResult.ok && timestampResult.status === "valid" ? (
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3 className="text-xs font-black text-[var(--color-text-primary)]">Auto-detection candidates</h3>
                      <span className="text-xs text-[var(--color-text-tertiary)]">Lower score is more plausible</span>
                    </div>
                    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
                      <table className="w-full min-w-[560px] text-left text-xs">
                        <thead className="bg-[var(--color-surface-subtle)] text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">
                          <tr><th className="px-3 py-2">Unit</th><th className="px-3 py-2">Calendar result</th><th className="px-3 py-2">Score</th><th className="px-3 py-2">Status</th></tr>
                        </thead>
                        <tbody>
                          {timestampResult.candidates.map((candidate) => (
                            <tr key={candidate.unit} className={`border-t border-[var(--color-border-subtle)] ${candidate.unit === timestampResult.unit ? "bg-[var(--color-primary-soft)]" : ""}`}>
                              <td className="px-3 py-2 font-bold text-[var(--color-text-primary)]">{candidate.label}</td>
                              <td className="px-3 py-2 font-mono text-xs text-[var(--color-text-secondary)]">{candidate.iso ?? "Outside Date range"}</td>
                              <td className="px-3 py-2 font-mono text-[var(--color-text-secondary)]">{candidate.valid ? candidate.score : "—"}</td>
                              <td className="px-3 py-2 text-xs font-bold">{candidate.unit === timestampResult.unit ? "Selected" : candidate.valid ? "Alternative" : "Invalid"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">{timestampResult.note}</p>
                  </div>
                ) : null}
              </div>
            ) : activeTab === "zones" ? (
              <div className="space-y-3">
                {zoneRows.length ? zoneRows.map((zone) => (
                  <div key={zone.id} className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 sm:grid-cols-[120px_minmax(0,1fr)_110px] sm:items-center">
                    <div>
                      <div className="text-xs font-black text-[var(--color-text-primary)]">{zone.label}</div>
                      <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]" title={zone.zone}>{zone.zone}</div>
                    </div>
                    <div className="font-mono text-xs text-[var(--color-text-secondary)]">{zone.formatted}</div>
                    <div className="font-mono text-xs font-bold text-[var(--color-primary-text-strong)]">{zone.offset}</div>
                  </div>
                )) : <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] p-6 text-center text-sm text-[var(--color-text-tertiary)]">Select at least one time zone and provide a valid instant.</div>}
              </div>
            ) : activeTab === "batch" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-[var(--color-text-secondary)]"><strong>{validBatchCount}</strong> valid · <strong>{batchRows.length - validBatchCount}</strong> invalid</p>
                  <Button size="sm" variant="secondary" onClick={() => downloadText("timestamp-batch.csv", batchCsv, "text/csv;charset=utf-8")} disabled={!batchRows.length}><FileSpreadsheet className="h-3.5 w-3.5" />Download CSV</Button>
                </div>
                <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <thead className="bg-[var(--color-surface-subtle)] text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">
                      <tr><th className="px-3 py-2">Line</th><th className="px-3 py-2">Input</th><th className="px-3 py-2">Unit</th><th className="px-3 py-2">ISO result</th><th className="px-3 py-2">Status</th></tr>
                    </thead>
                    <tbody>
                      {batchRows.map((row) => (
                        <tr key={`${row.line}-${row.raw}`} className="border-t border-[var(--color-border-subtle)]">
                          <td className="px-3 py-2 font-mono text-[var(--color-text-tertiary)]">{row.line}</td>
                          <td className="max-w-56 truncate px-3 py-2 font-mono text-[var(--color-text-primary)]" title={row.raw}>{row.raw}</td>
                          <td className="px-3 py-2 text-[var(--color-text-secondary)]">{row.detectedUnit ?? row.requestedUnit}</td>
                          <td className="px-3 py-2 font-mono text-xs text-[var(--color-text-secondary)]">{row.iso ?? row.error}</td>
                          <td className="px-3 py-2">{row.ok ? <span className="font-bold text-[var(--color-success-text)]">Valid</span> : <span className="font-bold text-[var(--color-danger-text)]">Review</span>}</td>
                        </tr>
                      ))}
                      {!batchRows.length ? <tr><td colSpan={5} className="px-3 py-8 text-center text-[var(--color-text-tertiary)]">Add one timestamp per line.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Markdown report", hint: "Human-readable conversion summary", icon: <FileText className="h-4 w-4" />, action: () => downloadText("timestamp-report.md", markdown, "text/markdown;charset=utf-8") },
                  { label: "JSON audit", hint: "Machine-readable inputs, outputs, zones, and checks", icon: <FileJson className="h-4 w-4" />, action: () => downloadText("timestamp-report.json", reportJson, "application/json;charset=utf-8") },
                  { label: "Batch CSV", hint: "One row per timestamp with validation status", icon: <FileSpreadsheet className="h-4 w-4" />, action: () => downloadText("timestamp-batch.csv", batchCsv, "text/csv;charset=utf-8") },
                  { label: "JavaScript starter", hint: "Reusable seconds/ms/us/ns conversion helper", icon: <Code2 className="h-4 w-4" />, action: () => downloadText("timestamp-helper.js", javascript, "text/javascript;charset=utf-8") },
                ].map((item) => (
                  <button key={item.label} type="button" onClick={item.action} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 text-left transition hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-soft)]">
                    <span className="flex items-center gap-2 text-xs font-black text-[var(--color-text-primary)]"><span className="text-[var(--color-primary-text-strong)]">{item.icon}</span>{item.label}</span>
                    <span className="mt-1 block text-xs leading-4 text-[var(--color-text-tertiary)]">{item.hint}</span>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary-text-strong)]"><Download className="h-3 w-3" />Download</span>
                  </button>
                ))}
                <button type="button" onClick={downloadPack} disabled={zipBusy} className="rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-4 text-left transition hover:bg-[var(--color-primary-soft-hover)] sm:col-span-2">
                  <span className="flex items-center gap-2 text-xs font-black text-[var(--color-text-primary)]"><PackageCheck className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Production ZIP pack</span>
                  <span className="mt-1 block text-xs leading-4 text-[var(--color-text-tertiary)]">Formats, report, CSV, Markdown, and JavaScript helper in one archive.</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
          <h2 className="text-sm font-black text-[var(--color-text-primary)]">Production checks</h2>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {checks.map((check) => (
            <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}>
              <div className="flex items-start gap-2">
                {check.level === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : check.level === "danger" || check.level === "warning" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Braces className="mt-0.5 h-4 w-4 shrink-0" />}
                <div className="min-w-0">
                  <div className="text-xs font-black">{check.title}</div>
                  <p className="mt-1 text-xs leading-4 opacity-90">{check.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
