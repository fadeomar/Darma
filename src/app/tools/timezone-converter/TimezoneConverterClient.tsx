"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import JSZip from "jszip";
import ReactSelect, {
  type FormatOptionLabelMeta,
  type GroupBase,
  type SingleValue,
  type StylesConfig,
} from "react-select";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Code2,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Globe2,
  ListChecks,
  PackageCheck,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { WarningPanel } from "@/features/tools/components/WarningPanel";
import { cn } from "@/lib/cn";
import { downloadText } from "../_shared/clientUtils";
import { TIMEZONE_PRESETS } from "./presets";
import {
  DEFAULT_TARGET_ZONES,
  TIMEZONE_OPTIONS,
  buildBatchCsv,
  buildCandidateSlots,
  buildComparisonCsv,
  buildIcsEvent,
  buildJavaScriptStarter,
  buildMarkdownReport,
  buildTimezoneAuditReport,
  buildTimezoneChecks,
  buildZoneComparisonRows,
  formatInZone,
  parseBatchSchedule,
  resolveZonedDateTime,
} from "./timezone";
import type {
  TimezoneCheckLevel,
  TimezoneGroup,
  TimezoneOption,
  TimezoneTab,
} from "./types";

type PickerType = "date" | "time";
type PickerInputElement = HTMLInputElement & { showPicker?: () => void };
type TimezoneSelectOption = TimezoneOption & { value: string; searchLabel: string };

const TIMEZONE_GROUPS: TimezoneGroup[] = ["Americas", "Europe", "Middle East / Africa", "Asia-Pacific", "UTC"];
const CHECK_VARIANT: Record<TimezoneCheckLevel, "success" | "info" | "warning" | "danger"> = {
  success: "success",
  info: "info",
  warning: "warning",
  danger: "danger",
};

const pickerInputClass =
  "relative cursor-pointer pr-11 font-semibold tabular-nums [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0";

const timezoneSelectStyles: StylesConfig<TimezoneSelectOption, false, GroupBase<TimezoneSelectOption>> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: 40,
    border: `1px solid ${state.isFocused ? "var(--color-primary)" : "var(--color-border-default)"}`,
    borderRadius: "var(--radius-sm)",
    background: "var(--color-control-bg)",
    boxShadow: state.isFocused ? "var(--focus-ring)" : "var(--shadow-xs)",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
  }),
  valueContainer: (provided) => ({ ...provided, padding: "1px 9px" }),
  input: (provided) => ({ ...provided, color: "var(--color-text-primary)" }),
  singleValue: (provided) => ({ ...provided, color: "var(--color-text-primary)", margin: 0 }),
  placeholder: (provided) => ({ ...provided, color: "var(--color-text-tertiary)" }),
  menu: (provided) => ({
    ...provided,
    zIndex: 80,
    overflow: "hidden",
    border: "1px solid var(--color-border-default)",
    borderRadius: "var(--radius-md)",
    background: "var(--color-surface-raised)",
    boxShadow: "var(--shadow-md)",
  }),
  menuList: (provided) => ({ ...provided, maxHeight: 300, padding: 8 }),
  group: (provided) => ({ ...provided, paddingBottom: 4, paddingTop: 4 }),
  groupHeading: (provided) => ({
    ...provided,
    marginBottom: 6,
    paddingInline: 8,
    color: "var(--color-text-tertiary)",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  }),
  option: (provided, state) => ({
    ...provided,
    borderRadius: "var(--radius-sm)",
    backgroundColor: state.isSelected
      ? "var(--color-primary-soft)"
      : state.isFocused
        ? "var(--color-control-hover)"
        : "transparent",
    color: state.isSelected ? "var(--color-primary)" : "var(--color-text-primary)",
    cursor: "pointer",
    padding: "8px 10px",
  }),
  indicatorSeparator: (provided) => ({ ...provided, backgroundColor: "var(--color-border-subtle)" }),
  dropdownIndicator: (provided) => ({ ...provided, color: "var(--color-text-tertiary)" }),
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

function toSelectOption(option: TimezoneOption): TimezoneSelectOption {
  return {
    ...option,
    value: option.zone,
    searchLabel: `${option.label} ${option.city} ${option.zone} ${option.group} ${option.flag}`.toLowerCase(),
  };
}

function groupZoneOptions(options: TimezoneSelectOption[]): GroupBase<TimezoneSelectOption>[] {
  return TIMEZONE_GROUPS.map((group) => ({
    label: group,
    options: options.filter((option) => option.group === group),
  })).filter((group) => group.options.length > 0);
}

function openNativePicker(input: HTMLInputElement | null) {
  if (!input) return;
  input.focus();
  try {
    (input as PickerInputElement).showPicker?.();
  } catch {
    // Some browsers only allow showPicker() during direct user activation.
  }
}

function PickerField({
  label,
  type,
  value,
  onChange,
  icon: Icon,
  ariaInvalid,
}: {
  label: string;
  type: PickerType;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  ariaInvalid?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Field label={label}>
      <span className="relative block">
        <Input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onClick={(event) => openNativePicker(event.currentTarget)}
          aria-invalid={ariaInvalid}
          className={pickerInputClass}
        />
        <button
          type="button"
          aria-label={`Open ${label.toLowerCase()} picker`}
          className={cn(
            "absolute right-1.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] transition",
            "hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]",
          )}
          onClick={() => openNativePicker(inputRef.current)}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </button>
      </span>
    </Field>
  );
}

function formatZoneOption(option: TimezoneSelectOption, meta: FormatOptionLabelMeta<TimezoneSelectOption>) {
  if (meta.context === "value") {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <span aria-hidden>{option.flag}</span>
        <span className="truncate font-semibold">{option.city}</span>
        <span className="truncate font-mono text-xs text-[var(--color-text-tertiary)]">{option.zone}</span>
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-base" aria-hidden>{option.flag}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{option.city}</span>
        <span className="block truncate font-mono text-xs text-[var(--color-text-tertiary)]">{option.zone}</span>
      </span>
    </span>
  );
}

function filterZoneOption(candidate: { data: TimezoneSelectOption }, inputValue: string) {
  const terms = inputValue.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return !terms.length || terms.every((term) => candidate.data.searchLabel.includes(term));
}

function TimezoneSelect({
  inputId,
  ariaLabel,
  options,
  value,
  onChange,
  placeholder = "Search city or IANA time zone...",
  isDisabled = false,
}: {
  inputId: string;
  ariaLabel: string;
  options: TimezoneSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
}) {
  const selectedOption = options.find((option) => option.value === value) ?? null;
  const groupedOptions = useMemo(() => groupZoneOptions(options), [options]);
  return (
    <ReactSelect<TimezoneSelectOption, false, GroupBase<TimezoneSelectOption>>
      inputId={inputId}
      instanceId={inputId}
      aria-label={ariaLabel}
      options={groupedOptions}
      value={selectedOption}
      onChange={(newValue: SingleValue<TimezoneSelectOption>) => newValue && onChange(newValue.value)}
      styles={timezoneSelectStyles}
      formatOptionLabel={formatZoneOption}
      filterOption={filterZoneOption}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isSearchable
      menuShouldScrollIntoView={false}
      maxMenuHeight={300}
      noOptionsMessage={() => "No matching time zone"}
      className="text-sm"
      classNamePrefix="darma-timezone-select"
    />
  );
}

function tabButton(active: boolean) {
  return cn(
    "rounded-[var(--radius-sm)] px-3 py-2 text-xs font-bold transition",
    active
      ? "bg-[var(--color-surface-base)] text-[var(--color-primary-text-strong)] shadow-[var(--shadow-xs)]"
      : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
  );
}

function dayShiftLabel(dayDiff: number) {
  if (dayDiff === 0) return "Same day";
  if (dayDiff === 1) return "+1 day";
  if (dayDiff === -1) return "−1 day";
  return `${dayDiff > 0 ? "+" : ""}${dayDiff} days`;
}

function availabilityVariant(status: string): "success" | "warning" | "outline" {
  if (status === "inside") return "success";
  if (status === "partial") return "warning";
  return "outline";
}

export default function TimezoneConverterClient() {
  const [browserZone, setBrowserZone] = useState("UTC");
  const browserOption = useMemo(() => TIMEZONE_OPTIONS.find((option) => option.zone === browserZone), [browserZone]);

  const [dateValue, setDateValue] = useState("2026-07-15");
  const [timeValue, setTimeValue] = useState("09:00");
  const [sourceZone, setSourceZone] = useState("Asia/Hebron");
  const [targetZones, setTargetZones] = useState<string[]>(DEFAULT_TARGET_ZONES);
  const [zoneToAdd, setZoneToAdd] = useState("Asia/Dubai");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [workingStart, setWorkingStart] = useState("08:00");
  const [workingEnd, setWorkingEnd] = useState("18:00");
  const [meetingTitle, setMeetingTitle] = useState("Cross-time-zone meeting");
  const [activeTab, setActiveTab] = useState<TimezoneTab>("comparison");
  const [batchInput, setBatchInput] = useState([
    "Standup | 2026-07-15 09:00 America/New_York",
    "Client review | 2026-07-16 16:00 Asia/Hebron",
    "Release | 2026-10-01 14:00 UTC",
  ].join("\n"));
  const [zipBusy, setZipBusy] = useState(false);

  useEffect(() => {
    const detectedZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const supportedZone = TIMEZONE_OPTIONS.some((option) => option.zone === detectedZone) ? detectedZone : "Asia/Hebron";
    const current = new Date();
    const display = formatInZone(current, supportedZone, supportedZone);
    setBrowserZone(detectedZone);
    setSourceZone(supportedZone);
    if (display) {
      setDateValue(display.dateKey);
      setTimeValue(display.time24);
    }
  }, []);

  const zoneSelectOptions = useMemo(() => TIMEZONE_OPTIONS.map(toSelectOption), []);
  const resolution = useMemo(() => resolveZonedDateTime(dateValue, timeValue, sourceZone), [dateValue, timeValue, sourceZone]);
  const moment = resolution.ok && resolution.status === "valid" ? resolution.date : null;
  const rows = useMemo(() => moment ? buildZoneComparisonRows({
    date: moment,
    sourceZone,
    targetZones,
    durationMinutes,
    workingStart,
    workingEnd,
  }) : [], [moment, sourceZone, targetZones, durationMinutes, workingStart, workingEnd]);
  const candidateSlots = useMemo(() => moment ? buildCandidateSlots({
    date: moment,
    sourceZone,
    targetZones,
    durationMinutes,
    workingStart,
    workingEnd,
  }) : [], [moment, sourceZone, targetZones, durationMinutes, workingStart, workingEnd]);
  const batchRows = useMemo(() => parseBatchSchedule(batchInput, targetZones), [batchInput, targetZones]);
  const checks = useMemo(() => buildTimezoneChecks({
    resolution,
    rows,
    targetZones,
    durationMinutes,
    workingStart,
    workingEnd,
    batchRows,
  }), [resolution, rows, targetZones, durationMinutes, workingStart, workingEnd, batchRows]);
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  const insideCount = rows.filter((row) => row.availability === "inside").length;
  const sourceDisplay = moment ? formatInZone(moment, sourceZone, sourceZone) : null;
  const sourceOption = TIMEZONE_OPTIONS.find((option) => option.zone === sourceZone);
  const availableOptions = useMemo(() => zoneSelectOptions.filter((option) => !targetZones.includes(option.zone)), [targetZones, zoneSelectOptions]);
  const selectedZoneToAdd = availableOptions.some((option) => option.value === zoneToAdd) ? zoneToAdd : availableOptions[0]?.value ?? "";

  const report = useMemo(() => buildTimezoneAuditReport({
    dateValue,
    timeValue,
    sourceZone,
    resolution,
    durationMinutes,
    workingStart,
    workingEnd,
    targetZones,
    rows,
    candidateSlots,
    batchRows,
    checks,
  }), [dateValue, timeValue, sourceZone, resolution, durationMinutes, workingStart, workingEnd, targetZones, rows, candidateSlots, batchRows, checks]);
  const reportJson = useMemo(() => JSON.stringify(report, null, 2), [report]);
  const markdown = useMemo(() => buildMarkdownReport(report), [report]);
  const comparisonCsv = useMemo(() => buildComparisonCsv(rows), [rows]);
  const batchCsv = useMemo(() => buildBatchCsv(batchRows), [batchRows]);
  const javascript = useMemo(() => buildJavaScriptStarter(report.source.resolvedIso, targetZones), [report.source.resolvedIso, targetZones]);
  const ics = useMemo(() => moment ? buildIcsEvent({ date: moment, durationMinutes, title: meetingTitle, rows }) : "", [moment, durationMinutes, meetingTitle, rows]);
  const copySummary = useMemo(() => rows.map((row) => `${row.city}: ${row.start.date} · ${row.start.time}–${row.end.time} · ${row.start.offset}`).join("\n"), [rows]);

  function applyPreset(id: string) {
    const preset = TIMEZONE_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setDateValue(preset.dateValue);
    setTimeValue(preset.timeValue);
    setSourceZone(preset.sourceZone);
    setTargetZones(preset.targetZones);
    setDurationMinutes(preset.durationMinutes);
    setWorkingStart(preset.workingStart);
    setWorkingEnd(preset.workingEnd);
    setActiveTab("comparison");
  }

  function useNow() {
    const current = new Date();
    const display = formatInZone(current, sourceZone, sourceZone);
    if (!display) return;
    setDateValue(display.dateKey);
    setTimeValue(display.time24);
  }

  function addTimezone() {
    if (!selectedZoneToAdd || targetZones.includes(selectedZoneToAdd)) return;
    setTargetZones((current) => [...current, selectedZoneToAdd]);
  }

  function applyCandidate(iso: string) {
    const candidate = new Date(iso);
    const display = formatInZone(candidate, sourceZone, sourceZone);
    if (!display) return;
    setDateValue(display.dateKey);
    setTimeValue(display.time24);
    setActiveTab("comparison");
  }

  async function downloadPack() {
    setZipBusy(true);
    try {
      const zip = new JSZip();
      zip.file("timezone-report.md", markdown);
      zip.file("timezone-audit.json", reportJson);
      zip.file("zone-comparison.csv", comparisonCsv);
      zip.file("batch-schedule.csv", batchCsv);
      zip.file("meeting.ics", ics);
      zip.file("timezone-helper.js", javascript);
      zip.file("README.txt", "Darma Timezone Converter Studio export pack. All values were generated locally in the browser. Review daylight-saving ambiguity warnings before publishing a schedule.");
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "darma-timezone-planning-pack.zip";
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Resolved instant" value={report.source.resolvedIso?.replace(".000Z", "Z") ?? "Awaiting input"} hint={sourceOption?.city ?? sourceZone} icon={<CalendarClock className="h-4 w-4" />} />
        <SummaryCard label="Compared zones" value={`${rows.length}`} hint={`${new Set(rows.map((row) => row.start.offset)).size} active UTC offsets`} icon={<Globe2 className="h-4 w-4" />} />
        <SummaryCard label="Work overlap" value={rows.length ? `${insideCount}/${rows.length}` : "—"} hint={`${durationMinutes}-minute meeting`} icon={<Users className="h-4 w-4" />} />
        <SummaryCard label="Production review" value={reviewCount ? `${reviewCount} to review` : "Ready"} hint={`${checks.length} checks completed`} icon={reviewCount ? <ListChecks className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />} />
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-3 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" /><h2 className="text-xs font-black text-[var(--color-text-primary)]">Practical presets</h2></div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
          {TIMEZONE_PRESETS.map((preset) => (
            <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2.5 text-left transition hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-soft)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]">
              <span className="text-base" aria-hidden>{preset.icon}</span>
              <span className="mt-1 block truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.label}</span>
              <span className="mt-0.5 block line-clamp-2 text-xs leading-4 text-[var(--color-text-tertiary)]">{preset.description}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[350px_minmax(0,1fr)] xl:items-start">
        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-2"><div><h2 className="text-sm font-black text-[var(--color-text-primary)]">Source moment</h2><p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">IANA zones with browser DST rules.</p></div><Button size="sm" variant="secondary" onClick={useNow} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>Now</Button></div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <PickerField label="Date" type="date" value={dateValue} onChange={setDateValue} ariaInvalid={!resolution.ok} icon={Calendar} />
              <PickerField label="Local time" type="time" value={timeValue} onChange={setTimeValue} ariaInvalid={!resolution.ok} icon={Clock} />
            </div>
            <div className="mt-3"><Field label="Source time zone" hint={browserOption ? `Browser: ${browserOption.city}` : browserZone}><TimezoneSelect inputId="timezone-source" ariaLabel="Source time zone" options={zoneSelectOptions} value={sourceZone} onChange={setSourceZone} /></Field></div>
            {sourceDisplay ? <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-xs"><div className="font-bold text-[var(--color-text-primary)]">{sourceDisplay.date} · {sourceDisplay.time}</div><div className="mt-1 font-mono text-xs text-[var(--color-text-tertiary)]">{sourceDisplay.offset} · {sourceDisplay.abbreviation}</div></div> : null}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
            <h2 className="text-sm font-black text-[var(--color-text-primary)]">Meeting planner</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Duration"><Select value={String(durationMinutes)} onChange={(event: ChangeEvent<HTMLSelectElement>) => setDurationMinutes(Number(event.target.value))}><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="75">75 minutes</option><option value="90">90 minutes</option><option value="120">2 hours</option><option value="240">4 hours</option></Select></Field>
              <Field label="Event title"><Input value={meetingTitle} onChange={(event) => setMeetingTitle(event.target.value)} /></Field>
              <PickerField label="Workday starts" type="time" value={workingStart} onChange={setWorkingStart} icon={Clock} />
              <PickerField label="Workday ends" type="time" value={workingEnd} onChange={setWorkingEnd} icon={Clock} />
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-black text-[var(--color-text-primary)]">Target zones</h2><Badge variant="outline">{targetZones.length}</Badge></div>
            <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
              {targetZones.map((zone) => {
                const option = TIMEZONE_OPTIONS.find((item) => item.zone === zone);
                return <div key={zone} className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-2.5 py-2"><span aria-hidden>{option?.flag ?? "🌐"}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{option?.city ?? zone}</span><span className="block truncate font-mono text-xs text-[var(--color-text-tertiary)]">{zone}</span></span><Button size="icon" variant="ghost" disabled={targetZones.length <= 1} onClick={() => setTargetZones((current) => current.filter((item) => item !== zone))} leftIcon={<X className="h-3.5 w-3.5" />}>Remove {option?.city ?? zone}</Button></div>;
              })}
            </div>
            <div className="mt-3 space-y-2"><TimezoneSelect inputId="timezone-add" ariaLabel="Time zone to add" options={availableOptions} value={selectedZoneToAdd} onChange={setZoneToAdd} isDisabled={!availableOptions.length} /><Button fullWidth size="sm" variant="secondary" disabled={!availableOptions.length} onClick={addTimezone} leftIcon={<Plus className="h-3.5 w-3.5" />}>Add timezone</Button></div>
          </section>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] px-4 py-3">
            <div><h2 className="text-sm font-black text-[var(--color-text-primary)]">Planning workspace</h2><p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Compare local times, find better overlap, process schedule rows, and export.</p></div>
            <CopyButton text={copySummary} size="sm" variant="secondary" disabled={!rows.length}>Copy comparison</CopyButton>
          </div>
          <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-1.5"><div className="grid grid-cols-4 gap-1"><button type="button" className={tabButton(activeTab === "comparison")} onClick={() => setActiveTab("comparison")}>Comparison</button><button type="button" className={tabButton(activeTab === "planner")} onClick={() => setActiveTab("planner")}>Best slots</button><button type="button" className={tabButton(activeTab === "batch")} onClick={() => setActiveTab("batch")}>Batch</button><button type="button" className={tabButton(activeTab === "exports")} onClick={() => setActiveTab("exports")}>Exports</button></div></div>

          {activeTab === "comparison" ? (
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {rows.map((row) => (
                <div key={row.zone} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(180px,auto)_minmax(160px,auto)] sm:items-center">
                  <div className="flex min-w-0 items-center gap-3"><span className="text-2xl" aria-hidden>{row.flag}</span><div className="min-w-0"><div className="truncate text-sm font-black text-[var(--color-text-primary)]">{row.city}</div><div className="truncate font-mono text-xs text-[var(--color-text-tertiary)]">{row.zone}</div><div className="mt-1 text-xs text-[var(--color-text-secondary)]">{row.offsetDifferenceLabel}</div></div></div>
                  <div><div className="text-lg font-black tabular-nums text-[var(--color-text-primary)]">{row.start.time}–{row.end.time}</div><div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{row.start.date}</div><div className="mt-1 flex flex-wrap gap-1"><Badge variant="outline">{row.start.offset}</Badge><Badge variant="outline">{dayShiftLabel(row.start.dayDiff)}</Badge></div></div>
                  <div className="sm:text-right"><Badge variant={availabilityVariant(row.availability)}>{row.availabilityLabel}</Badge><div className="mt-2 font-mono text-xs text-[var(--color-text-tertiary)]">{row.start.abbreviation}</div></div>
                </div>
              ))}
              {!rows.length ? <div className="px-4 py-14 text-center text-sm text-[var(--color-text-tertiary)]">Enter a valid source moment to build the comparison.</div> : null}
            </div>
          ) : null}

          {activeTab === "planner" ? (
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between gap-2"><div><h3 className="text-sm font-black text-[var(--color-text-primary)]">Best nearby meeting slots</h3><p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Ranks half-hour slots within ±5 hours using the configured working-hours window.</p></div><Badge variant="soft">Top {candidateSlots.length}</Badge></div>
              <div className="grid gap-3 md:grid-cols-2">
                {candidateSlots.map((slot, index) => (
                  <div key={slot.iso} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
                    <div className="flex items-start justify-between gap-2"><div><div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Option {index + 1}</div><div className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{slot.sourceLabel}</div></div><Badge variant={slot.insideCount === rows.length && rows.length ? "success" : "warning"}>{slot.insideCount}/{slot.rows.length} inside</Badge></div>
                    <div className="mt-3 flex flex-wrap gap-1.5">{slot.rows.map((row) => <span key={row.zone} className={cn("rounded-full border px-2 py-1 text-xs font-bold", row.availability === "inside" ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]" : row.availability === "partial" ? "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]" : "border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]")}>{row.city} {row.start.time}</span>)}</div>
                    <Button className="mt-3" size="sm" variant="secondary" onClick={() => applyCandidate(slot.iso)}>Use this slot</Button>
                  </div>
                ))}
              </div>
              {!candidateSlots.length ? <div className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">A valid source moment is required before candidate slots can be ranked.</div> : null}
            </div>
          ) : null}

          {activeTab === "batch" ? (
            <div className="space-y-4 p-4">
              <Field label="Batch schedule" hint="Label | YYYY-MM-DD HH:mm Area/City"><Textarea variant="editor" className="min-h-40 font-mono text-xs" value={batchInput} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setBatchInput(event.target.value)} /></Field>
              <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[var(--color-surface-subtle)] text-xs uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]"><tr><th className="px-3 py-2">Line</th><th className="px-3 py-2">Event</th><th className="px-3 py-2">Source</th><th className="px-3 py-2">UTC instant</th><th className="px-3 py-2">Targets</th></tr></thead><tbody className="divide-y divide-[var(--color-border-subtle)]">{batchRows.map((row) => <tr key={`${row.line}-${row.raw}`}><td className="px-3 py-2 font-mono">{row.line}</td><td className="px-3 py-2 font-bold text-[var(--color-text-primary)]">{row.label || "—"}</td><td className="px-3 py-2"><div>{row.dateValue} {row.timeValue}</div><div className="font-mono text-xs text-[var(--color-text-tertiary)]">{row.sourceZone}</div></td><td className="px-3 py-2 font-mono text-xs">{row.ok ? row.iso : <span className="text-[var(--color-danger-text)]">{row.error}</span>}</td><td className="px-3 py-2">{row.ok ? <div className="flex max-w-[380px] flex-wrap gap-1">{row.conversions.slice(0, 5).map((conversion) => <Badge key={conversion.zone} variant="outline">{conversion.city}: {conversion.time}</Badge>)}{row.conversions.length > 5 ? <Badge variant="soft">+{row.conversions.length - 5}</Badge> : null}</div> : "—"}</td></tr>)}</tbody></table></div>
            </div>
          ) : null}

          {activeTab === "exports" ? (
            <div className="grid gap-3 p-4 md:grid-cols-2">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3"><FileText className="h-4 w-4 text-[var(--color-primary-text-strong)]" /><h3 className="mt-2 text-sm font-black text-[var(--color-text-primary)]">Markdown report</h3><p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">Human-readable source, comparison, and production checks.</p><div className="mt-3 flex gap-2"><CopyButton text={markdown} size="sm" variant="secondary">Copy</CopyButton><Button size="sm" variant="secondary" onClick={() => downloadText("timezone-report.md", markdown, "text/markdown;charset=utf-8")} leftIcon={<Download className="h-3.5 w-3.5" />}>Download</Button></div></div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3"><FileJson className="h-4 w-4 text-[var(--color-primary-text-strong)]" /><h3 className="mt-2 text-sm font-black text-[var(--color-text-primary)]">JSON audit</h3><p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">Machine-readable configuration, zones, slots, batch, and checks.</p><div className="mt-3 flex gap-2"><CopyButton text={reportJson} size="sm" variant="secondary">Copy</CopyButton><Button size="sm" variant="secondary" onClick={() => downloadText("timezone-audit.json", reportJson, "application/json;charset=utf-8")} leftIcon={<Download className="h-3.5 w-3.5" />}>Download</Button></div></div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3"><FileSpreadsheet className="h-4 w-4 text-[var(--color-primary-text-strong)]" /><h3 className="mt-2 text-sm font-black text-[var(--color-text-primary)]">CSV exports</h3><p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">Comparison rows and flattened batch conversions.</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => downloadText("zone-comparison.csv", comparisonCsv, "text/csv;charset=utf-8")}>Comparison CSV</Button><Button size="sm" variant="secondary" onClick={() => downloadText("batch-schedule.csv", batchCsv, "text/csv;charset=utf-8")}>Batch CSV</Button></div></div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3"><CalendarClock className="h-4 w-4 text-[var(--color-primary-text-strong)]" /><h3 className="mt-2 text-sm font-black text-[var(--color-text-primary)]">Calendar event</h3><p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">UTC-based ICS event with the local zone comparison in its description.</p><Button className="mt-3" size="sm" variant="secondary" disabled={!ics} onClick={() => downloadText("meeting.ics", ics, "text/calendar;charset=utf-8")}>Download ICS</Button></div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3"><Code2 className="h-4 w-4 text-[var(--color-primary-text-strong)]" /><h3 className="mt-2 text-sm font-black text-[var(--color-text-primary)]">JavaScript Intl starter</h3><p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">A small dependency-free example for formatting the selected instant.</p><div className="mt-3 flex gap-2"><CopyButton text={javascript} size="sm" variant="secondary">Copy</CopyButton><Button size="sm" variant="secondary" onClick={() => downloadText("timezone-helper.js", javascript, "text/javascript;charset=utf-8")}>Download</Button></div></div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-3"><PackageCheck className="h-4 w-4 text-[var(--color-primary-text-strong)]" /><h3 className="mt-2 text-sm font-black text-[var(--color-text-primary)]">Production pack</h3><p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">Markdown, JSON, CSV, ICS, JavaScript, and README in one ZIP.</p><Button className="mt-3" size="sm" loading={zipBusy} onClick={downloadPack} leftIcon={<Download className="h-3.5 w-3.5" />}>Download ZIP</Button></div>
            </div>
          ) : null}
        </section>
      </div>

      <WarningPanel
        title="Production checks"
        messages={checks.map((check) => ({ id: check.id, severity: CHECK_VARIANT[check.level], title: check.title, message: check.message }))}
      />
      <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-3 py-2.5 text-xs leading-5 text-[var(--color-info-text)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>All calculations use the browser&apos;s current IANA time-zone database. Working hours are a planning preference, not a guarantee of participant availability.</span></div>
    </div>
  );
}
