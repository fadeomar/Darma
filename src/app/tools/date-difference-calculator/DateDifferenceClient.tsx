"use client";

import JSZip from "jszip";
import {
  ArrowLeftRight,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Code2,
  Download,
  FileJson,
  FileSpreadsheet,
  Flag,
  Gauge,
  Info,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { Button, CopyButton, Input, Select, Textarea } from "@/components/ui";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { downloadTextFile } from "@/features/tools/export/downloadText";
import {
  buildAuditReport,
  buildDateChecks,
  buildJavaScriptSnippet,
  buildMarkdownReport,
  buildMilestones,
  buildMilestonesCsv,
  computeBusinessDays,
  computeDateTimeDifference,
  computeDifference,
  formatBreakdown,
  formatDateTimeBreakdown,
  formatUtcOffset,
  parseDateInput,
  parseDateTimeInput,
  parseHolidayInput,
  toDateInputValue,
  weekdayName,
} from "./dateMath";
import { buildDatePresets } from "./presets";
import type {
  DateCalculationMode,
  DateCheck,
  DateCheckLevel,
  DateTab,
  WeekendPreset,
} from "./types";

const OFFSET_OPTIONS = Array.from({ length: 105 }, (_, index) => (index - 48) * 15).filter((minutes) => minutes >= -720 && minutes <= 840);

function currentDateTimeValue(date: Date): string {
  const datePart = toDateInputValue(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${datePart}T${hours}:${minutes}`;
}

function SummaryCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</span>
        <span className="text-[var(--color-primary-text-strong)]">{icon}</span>
      </div>
      <div className="mt-1 truncate text-lg font-black text-[var(--color-text-primary)]" title={value}>{value}</div>
      <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]" title={hint}>{hint}</div>
    </div>
  );
}

function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className="block min-w-0 text-xs font-bold text-[var(--color-text-secondary)]">
      <span className="flex items-center justify-between gap-2">
        <span>{children}</span>
        {hint ? <span className="font-normal text-[var(--color-text-tertiary)]">{hint}</span> : null}
      </span>
    </label>
  );
}

function CheckIcon({ level }: { level: DateCheckLevel }) {
  if (level === "success") return <CheckCircle2 className="h-4 w-4" />;
  if (level === "danger") return <ShieldAlert className="h-4 w-4" />;
  if (level === "warning") return <TriangleAlert className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

function checkTone(level: DateCheckLevel): string {
  if (level === "success") return "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]";
  if (level === "danger") return "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]";
  if (level === "warning") return "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]";
  return "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]";
}

function ChecksList({ checks }: { checks: DateCheck[] }) {
  return (
    <div className="space-y-2">
      {checks.map((check) => (
        <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${checkTone(check.level)}`}>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0"><CheckIcon level={check.level} /></span>
            <div className="min-w-0">
              <div className="text-xs font-black">{check.title}</div>
              <p className="mt-0.5 text-xs leading-5 opacity-90">{check.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

export default function DateDifferenceClient() {
  const initialNow = useMemo(() => new Date(), []);
  const presets = useMemo(() => buildDatePresets(initialNow), [initialNow]);
  const [mode, setMode] = useState<DateCalculationMode>("calendar");
  const [fromDate, setFromDate] = useState("2000-01-01");
  const [toDate, setToDate] = useState(toDateInputValue(initialNow));
  const [fromDateTime, setFromDateTime] = useState(currentDateTimeValue(initialNow));
  const [toDateTime, setToDateTime] = useState(currentDateTimeValue(new Date(initialNow.getTime() + 90 * 60_000)));
  const [fromOffsetMinutes, setFromOffsetMinutes] = useState(-initialNow.getTimezoneOffset());
  const [toOffsetMinutes, setToOffsetMinutes] = useState(-initialNow.getTimezoneOffset());
  const [inclusive, setInclusive] = useState(false);
  const [weekendPreset, setWeekendPreset] = useState<WeekendPreset>("sat-sun");
  const [holidayInput, setHolidayInput] = useState("");
  const [activeTab, setActiveTab] = useState<DateTab>("overview");
  const [showAllPresets, setShowAllPresets] = useState(false);

  const calendarFrom = useMemo(() => parseDateInput(mode === "calendar" ? fromDate : fromDateTime.slice(0, 10)), [mode, fromDate, fromDateTime]);
  const calendarTo = useMemo(() => parseDateInput(mode === "calendar" ? toDate : toDateTime.slice(0, 10)), [mode, toDate, toDateTime]);
  const instantFrom = useMemo(() => mode === "datetime" ? parseDateTimeInput(fromDateTime, fromOffsetMinutes) : null, [mode, fromDateTime, fromOffsetMinutes]);
  const instantTo = useMemo(() => mode === "datetime" ? parseDateTimeInput(toDateTime, toOffsetMinutes) : null, [mode, toDateTime, toOffsetMinutes]);
  const calendarResult = useMemo(() => mode === "calendar" && calendarFrom && calendarTo ? computeDifference(calendarFrom, calendarTo) : null, [mode, calendarFrom, calendarTo]);
  const dateTimeResult = useMemo(() => mode === "datetime" && instantFrom && instantTo ? computeDateTimeDifference(instantFrom, instantTo) : null, [mode, instantFrom, instantTo]);
  const holidayParse = useMemo(() => parseHolidayInput(holidayInput), [holidayInput]);
  const business = useMemo(() => calendarFrom && calendarTo ? computeBusinessDays(calendarFrom, calendarTo, { inclusive, weekendPreset, holidays: holidayParse.dates }) : null, [calendarFrom, calendarTo, inclusive, weekendPreset, holidayParse.dates]);
  const milestones = useMemo(() => calendarFrom && calendarTo ? buildMilestones(calendarFrom, calendarTo) : [], [calendarFrom, calendarTo]);
  const checks = useMemo(() => buildDateChecks({
    mode,
    fromValid: mode === "calendar" ? Boolean(calendarFrom) : Boolean(instantFrom),
    toValid: mode === "calendar" ? Boolean(calendarTo) : Boolean(instantTo),
    calendarResult,
    dateTimeResult,
    inclusive,
    business,
    holidayParse,
    fromOffsetMinutes,
    toOffsetMinutes,
  }), [mode, calendarFrom, calendarTo, instantFrom, instantTo, calendarResult, dateTimeResult, inclusive, business, holidayParse, fromOffsetMinutes, toOffsetMinutes]);

  const fromValue = mode === "calendar" ? fromDate : `${fromDateTime} ${formatUtcOffset(fromOffsetMinutes)}`;
  const toValue = mode === "calendar" ? toDate : `${toDateTime} ${formatUtcOffset(toOffsetMinutes)}`;
  const report = useMemo(() => buildAuditReport({
    mode,
    inputs: {
      from: fromValue,
      to: toValue,
      inclusive,
      fromOffsetMinutes,
      toOffsetMinutes,
      weekendPreset,
      holidays: holidayParse.dates,
    },
    calendarResult,
    dateTimeResult,
    businessDays: business,
    milestones,
    checks,
  }), [mode, fromValue, toValue, inclusive, fromOffsetMinutes, toOffsetMinutes, weekendPreset, holidayParse.dates, calendarResult, dateTimeResult, business, milestones, checks]);

  const resultLabel = calendarResult
    ? formatBreakdown(calendarResult.breakdown)
    : dateTimeResult
      ? formatDateTimeBreakdown(dateTimeResult)
      : "Invalid input";
  const elapsedLabel = calendarResult
    ? `${formatNumber(inclusive ? calendarResult.inclusiveDays : calendarResult.totalDays, 0)} days`
    : dateTimeResult
      ? `${formatNumber(dateTimeResult.totalHours)} hours`
      : "—";
  const businessLabel = business ? `${business.businessDays} workdays` : "—";
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  const summaryText = calendarResult
    ? `${fromDate} → ${toDate}: ${formatBreakdown(calendarResult.breakdown)} (${inclusive ? calendarResult.inclusiveDays : calendarResult.totalDays} ${inclusive ? "inclusive" : "elapsed"} days)`
    : dateTimeResult
      ? `${fromValue} → ${toValue}: ${formatDateTimeBreakdown(dateTimeResult)} (${formatNumber(dateTimeResult.totalHours)} hours)`
      : "Enter valid dates to calculate a difference.";

  function applyPreset(id: string) {
    const preset = presets.find((candidate) => candidate.id === id);
    if (!preset) return;
    setMode(preset.mode);
    if (preset.fromDate) setFromDate(preset.fromDate);
    if (preset.toDate) setToDate(preset.toDate);
    if (preset.fromDateTime) setFromDateTime(preset.fromDateTime);
    if (preset.toDateTime) setToDateTime(preset.toDateTime);
    if (preset.fromOffset != null) setFromOffsetMinutes(preset.fromOffset);
    if (preset.toOffset != null) setToOffsetMinutes(preset.toOffset);
    if (preset.inclusive != null) setInclusive(preset.inclusive);
    if (preset.weekendPreset) setWeekendPreset(preset.weekendPreset);
    setHolidayInput(preset.holidays ?? "");
    setActiveTab("overview");
  }

  function swapBoundaries() {
    if (mode === "calendar") {
      setFromDate(toDate);
      setToDate(fromDate);
    } else {
      setFromDateTime(toDateTime);
      setToDateTime(fromDateTime);
      setFromOffsetMinutes(toOffsetMinutes);
      setToOffsetMinutes(fromOffsetMinutes);
    }
  }

  function setToToday() {
    const now = new Date();
    if (mode === "calendar") setToDate(toDateInputValue(now));
    else {
      setToDateTime(currentDateTimeValue(now));
      setToOffsetMinutes(-now.getTimezoneOffset());
    }
  }

  function downloadJson() {
    downloadTextFile({ filename: "date-difference-audit.json", content: `${JSON.stringify(report, null, 2)}\n`, mimeType: "application/json;charset=utf-8" });
  }

  async function downloadPack() {
    const zip = new JSZip();
    zip.file("date-difference-report.md", buildMarkdownReport(report));
    zip.file("date-difference-audit.json", `${JSON.stringify(report, null, 2)}\n`);
    zip.file("date-milestones.csv", buildMilestonesCsv(milestones));
    zip.file("date-difference.js", buildJavaScriptSnippet());
    zip.file("README.txt", "Date Difference Studio export pack\n\nAll calculations were generated locally in the browser. Fixed UTC offsets do not infer daylight-saving transitions.\n");
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlobFile({ filename: "date-difference-production-pack.zip", blob });
  }

  const tabs: { id: DateTab; label: string; icon: ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Gauge className="h-4 w-4" /> },
    { id: "business", label: "Workdays", icon: <BriefcaseBusiness className="h-4 w-4" /> },
    { id: "milestones", label: "Milestones", icon: <Flag className="h-4 w-4" /> },
    { id: "exports", label: "Exports", icon: <Download className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <SummaryCard label="Calendar span" value={resultLabel} hint={calendarResult?.isNegative || dateTimeResult?.isNegative ? "End precedes start" : "Start to end"} icon={<CalendarClock className="h-4 w-4" />} />
        <SummaryCard label="Elapsed total" value={elapsedLabel} hint={mode === "calendar" && inclusive ? "Inclusive boundaries" : mode === "datetime" ? "Absolute elapsed time" : "Exclusive end boundary"} icon={<Clock3 className="h-4 w-4" />} />
        <SummaryCard label="Working time" value={businessLabel} hint={weekendPreset === "fri-sat" ? "Friday–Saturday weekend" : weekendPreset === "sun-only" ? "Sunday-only weekend" : "Saturday–Sunday weekend"} icon={<BriefcaseBusiness className="h-4 w-4" />} />
        <SummaryCard label="Production review" value={reviewCount ? `${reviewCount} to review` : "Ready"} hint={`${checks.length} checks completed`} icon={reviewCount ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><Sparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Practical presets</h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Load a realistic date workflow, then adjust it.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(showAllPresets ? presets : presets.slice(0, 6)).map((preset) => (
                <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2.5 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-control-hover)]">
                  <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.name}</span>
                  <span className="mt-1 block line-clamp-2 text-xs leading-4 text-[var(--color-text-tertiary)]">{preset.description}</span>
                </button>
              ))}
            </div>
            {presets.length > 6 ? (
              <Button type="button" size="sm" variant="ghost" className="mt-3 w-full" onClick={() => setShowAllPresets((value) => !value)}>
                {showAllPresets ? "Show fewer workflows" : `Show all ${presets.length} workflows`}
              </Button>
            ) : null}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <h2 className="text-sm font-black text-[var(--color-text-primary)]">Date boundaries</h2>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant={mode === "calendar" ? "primary" : "secondary"} onClick={() => setMode("calendar")} leftIcon={<CalendarDays className="h-4 w-4" />}>Calendar</Button>
              <Button size="sm" variant={mode === "datetime" ? "primary" : "secondary"} onClick={() => setMode("datetime")} leftIcon={<Clock3 className="h-4 w-4" />}>Date & time</Button>
            </div>

            <div className="mt-3 space-y-3">
              {mode === "calendar" ? (
                <>
                  <div>
                    <FieldLabel hint={calendarFrom ? weekdayName(calendarFrom) : "Invalid"}>From date</FieldLabel>
                    <Input className="mt-1" type="date" value={fromDate} max="9999-12-31" onChange={(event: ChangeEvent<HTMLInputElement>) => setFromDate(event.target.value)} aria-label="From date" />
                  </div>
                  <div>
                    <FieldLabel hint={calendarTo ? weekdayName(calendarTo) : "Invalid"}>To date</FieldLabel>
                    <Input className="mt-1" type="date" value={toDate} max="9999-12-31" onChange={(event: ChangeEvent<HTMLInputElement>) => setToDate(event.target.value)} aria-label="To date" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <FieldLabel hint={formatUtcOffset(fromOffsetMinutes)}>From wall-clock time</FieldLabel>
                    <Input className="mt-1" type="datetime-local" value={fromDateTime} onChange={(event: ChangeEvent<HTMLInputElement>) => setFromDateTime(event.target.value)} aria-label="From date and time" />
                    <Select className="mt-1" value={String(fromOffsetMinutes)} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFromOffsetMinutes(Number(event.target.value))} aria-label="From UTC offset">
                      {OFFSET_OPTIONS.map((offset) => <option key={offset} value={offset}>{formatUtcOffset(offset)}</option>)}
                    </Select>
                  </div>
                  <div>
                    <FieldLabel hint={formatUtcOffset(toOffsetMinutes)}>To wall-clock time</FieldLabel>
                    <Input className="mt-1" type="datetime-local" value={toDateTime} onChange={(event: ChangeEvent<HTMLInputElement>) => setToDateTime(event.target.value)} aria-label="To date and time" />
                    <Select className="mt-1" value={String(toOffsetMinutes)} onChange={(event: ChangeEvent<HTMLSelectElement>) => setToOffsetMinutes(Number(event.target.value))} aria-label="To UTC offset">
                      {OFFSET_OPTIONS.map((offset) => <option key={offset} value={offset}>{formatUtcOffset(offset)}</option>)}
                    </Select>
                  </div>
                </>
              )}

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={swapBoundaries} leftIcon={<ArrowLeftRight className="h-4 w-4" />}>Swap</Button>
                <Button size="sm" variant="secondary" onClick={setToToday}>Set end to now</Button>
              </div>
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <h2 className="text-sm font-black text-[var(--color-text-primary)]">Workday rules</h2>
            <div className="mt-3 space-y-3">
              <label className="flex items-start gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                <input type="checkbox" checked={inclusive} onChange={(event: ChangeEvent<HTMLInputElement>) => setInclusive(event.target.checked)} className="mt-0.5" />
                <span>Count both start and end dates <span className="block font-normal text-[var(--color-text-tertiary)]">Applies to inclusive and workday totals.</span></span>
              </label>
              <div>
                <FieldLabel>Weekend pattern</FieldLabel>
                <Select className="mt-1" value={weekendPreset} onChange={(event: ChangeEvent<HTMLSelectElement>) => setWeekendPreset(event.target.value as WeekendPreset)} aria-label="Weekend pattern">
                  <option value="sat-sun">Saturday–Sunday</option>
                  <option value="fri-sat">Friday–Saturday</option>
                  <option value="sun-only">Sunday only</option>
                </Select>
              </div>
              <div>
                <FieldLabel hint="Optional">Holidays</FieldLabel>
                <Textarea className="mt-1 min-h-20 font-mono text-xs" value={holidayInput} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setHolidayInput(event.target.value)} placeholder={"2026-07-15\n2026-08-01"} aria-label="Holiday dates" />
                <p className="mt-1 text-xs leading-4 text-[var(--color-text-tertiary)]">One YYYY-MM-DD value per line, comma, or semicolon.</p>
              </div>
            </div>
          </section>
        </aside>

        <main className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--color-border-subtle)] p-3">
            <div className="flex flex-wrap gap-1.5">
              {tabs.map((tab) => <Button key={tab.id} size="sm" variant={activeTab === tab.id ? "primary" : "secondary"} onClick={() => setActiveTab(tab.id)} leftIcon={tab.icon}>{tab.label}</Button>)}
            </div>
          </div>

          <div className="p-4">
            {activeTab === "overview" ? (
              <div className="space-y-4">
                <section className={`rounded-[var(--radius-lg)] border p-5 ${calendarResult || dateTimeResult ? "border-[var(--color-primary)]/30 bg-[var(--color-primary-subtle)]" : "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-text-tertiary)]">Calculated difference</div>
                      <div className="mt-1 break-words text-3xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-4xl">{resultLabel}</div>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">{summaryText}</p>
                    </div>
                    <CopyButton text={summaryText} size="sm" variant="secondary" disabled={!calendarResult && !dateTimeResult}>Copy result</CopyButton>
                  </div>
                </section>

                {calendarResult ? (
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {[
                      ["Elapsed days", formatNumber(calendarResult.totalDays, 0)],
                      ["Inclusive days", formatNumber(calendarResult.inclusiveDays, 0)],
                      ["Weeks + days", `${calendarResult.totalWeeks}w ${calendarResult.weeksRemainderDays}d`],
                      ["Whole months", formatNumber(calendarResult.totalMonths, 0)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
                        <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
                        <div className="mt-1 font-mono text-lg font-black text-[var(--color-text-primary)]">{value}</div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {dateTimeResult ? (
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {[
                      ["Total days", formatNumber(dateTimeResult.totalDays, 4)],
                      ["Total hours", formatNumber(dateTimeResult.totalHours, 2)],
                      ["Total minutes", formatNumber(dateTimeResult.totalMinutes, 0)],
                      ["Total seconds", formatNumber(dateTimeResult.totalSeconds, 0)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
                        <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
                        <div className="mt-1 font-mono text-lg font-black text-[var(--color-text-primary)]">{value}</div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {dateTimeResult ? (
                  <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-code-bg)] p-4 text-[var(--color-code-text)]">
                    <h3 className="flex items-center gap-2 text-sm font-black"><MapPin className="h-4 w-4 text-[var(--color-primary-text-strong)]" />UTC normalization</h3>
                    <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                      <div><dt className="text-[var(--color-text-tertiary)]">From UTC</dt><dd className="mt-1 break-all font-mono">{dateTimeResult.fromUtcIso}</dd></div>
                      <div><dt className="text-[var(--color-text-tertiary)]">To UTC</dt><dd className="mt-1 break-all font-mono">{dateTimeResult.toUtcIso}</dd></div>
                    </dl>
                  </section>
                ) : null}

                <section>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-[var(--color-text-primary)]">Production checks</h3>
                    <span className="text-xs text-[var(--color-text-tertiary)]">{checks.length} completed</span>
                  </div>
                  <ChecksList checks={checks} />
                </section>
              </div>
            ) : null}

            {activeTab === "business" ? (
              <div className="space-y-4">
                <section className="rounded-[var(--radius-lg)] border border-[var(--color-primary)]/30 bg-[var(--color-primary-subtle)] p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-text-tertiary)]">Working-day result</div>
                  <div className="mt-1 text-4xl font-black text-[var(--color-text-primary)]">{business?.businessDays ?? "—"} <span className="text-2xl text-[var(--color-text-tertiary)]">days</span></div>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Using a {weekendPreset === "fri-sat" ? "Friday–Saturday" : weekendPreset === "sun-only" ? "Sunday-only" : "Saturday–Sunday"} weekend and {holidayParse.dates.length} valid holiday date(s).</p>
                </section>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ["Calendar dates", business?.calendarDays ?? 0],
                    ["Weekend dates", business?.weekendDays ?? 0],
                    ["Holiday dates", business?.holidayDays ?? 0],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3 text-center">
                      <div className="font-mono text-2xl font-black text-[var(--color-text-primary)]">{value}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
                    </div>
                  ))}
                </div>
                <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                  <h3 className="text-sm font-black text-[var(--color-text-primary)]">Holiday input review</h3>
                  <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                    <div><dt className="text-[var(--color-text-tertiary)]">Valid unique</dt><dd className="mt-1 font-mono font-black text-[var(--color-text-primary)]">{holidayParse.dates.length}</dd></div>
                    <div><dt className="text-[var(--color-text-tertiary)]">Invalid</dt><dd className="mt-1 font-mono font-black text-[var(--color-text-primary)]">{holidayParse.invalid.length}</dd></div>
                    <div><dt className="text-[var(--color-text-tertiary)]">Duplicates</dt><dd className="mt-1 font-mono font-black text-[var(--color-text-primary)]">{holidayParse.duplicates.length}</dd></div>
                  </dl>
                  {holidayParse.dates.length ? <div className="mt-3 flex flex-wrap gap-1.5">{holidayParse.dates.map((date) => <span key={date} className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-2 py-1 font-mono text-xs text-[var(--color-text-secondary)]">{date}</span>)}</div> : null}
                </section>
              </div>
            ) : null}

            {activeTab === "milestones" ? (
              <div className="space-y-4">
                <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                  <h3 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><Flag className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Range timeline</h3>
                  <div className="relative mt-8 h-2 rounded-full bg-[var(--color-border-strong)]">
                    <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/30" />
                    {milestones.map((milestone) => (
                      <div key={milestone.id} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${milestone.progress * 100}%` }} title={`${milestone.label}: ${milestone.date}`}>
                        <div className="h-4 w-4 rounded-full border-2 border-[var(--color-surface-base)] bg-[var(--color-primary)] shadow" />
                      </div>
                    ))}
                  </div>
                </section>
                <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
                  <table className="w-full min-w-[620px] text-left text-xs">
                    <thead className="bg-[var(--color-surface-subtle)] text-xs uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]"><tr><th className="px-3 py-2">Milestone</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Weekday</th><th className="px-3 py-2">Offset</th><th className="px-3 py-2">Progress</th></tr></thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)]">
                      {milestones.map((milestone) => <tr key={milestone.id}><td className="px-3 py-2 font-bold text-[var(--color-text-primary)]">{milestone.label}</td><td className="px-3 py-2 font-mono text-[var(--color-text-secondary)]">{milestone.date}</td><td className="px-3 py-2 text-[var(--color-text-secondary)]">{milestone.weekday}</td><td className="px-3 py-2 font-mono text-[var(--color-text-secondary)]">{milestone.offsetDays >= 0 ? "+" : ""}{milestone.offsetDays}d</td><td className="px-3 py-2 font-mono text-[var(--color-text-secondary)]">{Math.round(milestone.progress * 100)}%</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {activeTab === "exports" ? (
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Button variant="secondary" onClick={() => downloadTextFile({ filename: "date-difference-report.md", content: buildMarkdownReport(report), mimeType: "text/markdown;charset=utf-8" })} leftIcon={<ClipboardList className="h-4 w-4" />}>Markdown report</Button>
                  <Button variant="secondary" onClick={downloadJson} leftIcon={<FileJson className="h-4 w-4" />}>JSON audit</Button>
                  <Button variant="secondary" onClick={() => downloadTextFile({ filename: "date-milestones.csv", content: buildMilestonesCsv(milestones), mimeType: "text/csv;charset=utf-8" })} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>Milestones CSV</Button>
                  <Button variant="secondary" onClick={() => downloadTextFile({ filename: "date-difference.js", content: buildJavaScriptSnippet(), mimeType: "text/javascript;charset=utf-8" })} leftIcon={<Code2 className="h-4 w-4" />}>JavaScript helper</Button>
                  <Button variant="primary" onClick={() => void downloadPack()} leftIcon={<Download className="h-4 w-4" />}>ZIP production pack</Button>
                </div>
                <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-code-bg)] p-4 text-[var(--color-code-text)]">
                  <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-black">Report preview</h3><CopyButton text={buildMarkdownReport(report)} size="sm" variant="secondary">Copy Markdown</CopyButton></div>
                  <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-6">{buildMarkdownReport(report)}</pre>
                </section>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
