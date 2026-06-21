"use client";

import { useMemo, useRef, useState } from "react";
import ReactSelect, {
  type FormatOptionLabelMeta,
  type GroupBase,
  type SingleValue,
  type StylesConfig,
} from "react-select";
import { Calendar, Clock, Plus, X, type LucideIcon } from "lucide-react";
import { Button, CopyButton, Input } from "@/components/ui";
import { ControlGrid, ControlSection, ToolControlPanel, WarningPanel } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import { DEFAULT_TARGET_ZONES, formatInZone, TIMEZONE_OPTIONS, zonedDateTimeToDate, type TimezoneGroup, type TimezoneOption } from "./timezone";

// ─── Types & constants ────────────────────────────────────────────────────────

type PickerType = "date" | "time";
type PickerInputElement = HTMLInputElement & { showPicker?: () => void };
type TimezoneSelectOption = TimezoneOption & { value: string; searchLabel: string };

const TIMEZONE_GROUPS: TimezoneGroup[] = ["Americas", "Europe", "Asia-Pacific", "Africa / Other"];

const pickerInputClass =
  "relative cursor-pointer pr-11 font-semibold tabular-nums [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0";

const timezoneSelectStyles: StylesConfig<TimezoneSelectOption, false, GroupBase<TimezoneSelectOption>> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: 42,
    border: `1px solid ${state.isFocused ? "var(--color-primary)" : "var(--color-border-default)"}`,
    borderRadius: "var(--radius-sm)",
    background: "var(--color-control-bg)",
    boxShadow: state.isFocused ? "var(--focus-ring)" : "var(--shadow-xs)",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    transition: "border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard)",
    ":hover": {
      borderColor: state.isFocused ? "var(--color-primary)" : "var(--color-border-strong)",
      background: "var(--color-surface-base)",
    },
  }),
  valueContainer: (provided) => ({ ...provided, padding: "2px 10px" }),
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
    letterSpacing: "0.12em",
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
    padding: "9px 10px",
    ":active": { backgroundColor: "var(--color-control-active)" },
  }),
  indicatorSeparator: (provided) => ({ ...provided, backgroundColor: "var(--color-border-subtle)" }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
    ":hover": { color: "var(--color-text-primary)" },
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: "var(--color-text-tertiary)",
    ":hover": { color: "var(--color-text-primary)" },
  }),
  noOptionsMessage: (provided) => ({ ...provided, color: "var(--color-text-tertiary)", fontSize: 13 }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  const ariaLabel = `Source ${type}`;

  return (
    <label className="space-y-1 text-xs font-semibold text-[var(--color-text-secondary)]">
      <span>{label}</span>
      <span className="relative block">
        <Input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onClick={(event) => openNativePicker(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openNativePicker(event.currentTarget);
            }
          }}
          aria-label={ariaLabel}
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
    </label>
  );
}

function formatZoneOption(option: TimezoneSelectOption, meta: FormatOptionLabelMeta<TimezoneSelectOption>) {
  if (meta.context === "value") {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <span aria-hidden>{option.flag}</span>
        <span className="truncate font-semibold">{option.city}</span>
        <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--color-text-tertiary)]">{option.zone}</span>
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-base" aria-hidden>{option.flag}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold leading-5">{option.city}</span>
        <span className="block truncate font-mono text-[10px] font-semibold text-[var(--color-text-tertiary)]">{option.zone}</span>
      </span>
    </span>
  );
}

function filterZoneOption(candidate: { data: TimezoneSelectOption }, inputValue: string) {
  const terms = inputValue.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  return terms.every((term) => candidate.data.searchLabel.includes(term));
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
      onChange={(newValue: SingleValue<TimezoneSelectOption>) => {
        if (newValue) onChange(newValue.value);
      }}
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function TimezoneConverterClient() {
  const [dateValue, setDateValue] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeValue, setTimeValue] = useState(() => new Date().toISOString().slice(11, 16));
  const [sourceZone, setSourceZone] = useState("UTC");
  const [targetZones, setTargetZones] = useState<string[]>(DEFAULT_TARGET_ZONES);
  const [zoneToAdd, setZoneToAdd] = useState("Asia/Dubai");

  const zoneSelectOptions = useMemo(() => TIMEZONE_OPTIONS.map(toSelectOption), []);

  const moment = useMemo(() => zonedDateTimeToDate(dateValue, timeValue, sourceZone), [dateValue, timeValue, sourceZone]);
  const rows = useMemo(() => moment ? targetZones.map((zone) => ({
    option: TIMEZONE_OPTIONS.find((option) => option.zone === zone)!,
    display: formatInZone(moment, zone, sourceZone)!,
  })).filter((row) => row.option && row.display) : [], [moment, sourceZone, targetZones]);
  const sourceDisplay = useMemo(() => moment ? formatInZone(moment, sourceZone, sourceZone) : null, [moment, sourceZone]);
  const sourceLabel = useMemo(() => TIMEZONE_OPTIONS.find((option) => option.zone === sourceZone)?.label ?? sourceZone, [sourceZone]);
  const availableZones = useMemo(() => TIMEZONE_OPTIONS.filter((option) => !targetZones.includes(option.zone)), [targetZones]);
  const availableSelectOptions = useMemo(() => zoneSelectOptions.filter((option) => !targetZones.includes(option.zone)), [targetZones, zoneSelectOptions]);
  const selectedZoneToAdd = availableSelectOptions.some((option) => option.value === zoneToAdd) ? zoneToAdd : availableSelectOptions[0]?.value ?? "";
  const summary = useMemo(() => rows.map((row) => `${row.option.city}: ${row.display.time} · ${row.display.date} · ${row.display.offset}${row.display.dayDiff ? ` · ${row.display.dayDiff > 0 ? "+1 day" : "-1 day"}` : ""}`).join("\n"), [rows]);

  function addTimezone() {
    if (!zoneToAdd || targetZones.includes(zoneToAdd)) return;
    setTargetZones((current) => [...current, zoneToAdd]);
    const next = availableZones.find((option) => option.zone !== zoneToAdd);
    if (next) setZoneToAdd(next.zone);
  }

  return (
    <div className="space-y-5">
      <ToolControlPanel sticky={false} title="Source moment" description="Choose the local date, time, and time zone you want to convert.">
        <ControlSection title="Date, time, and source zone">
          <ControlGrid columns={2} className="items-end">
            <PickerField label="Date" type="date" value={dateValue} onChange={setDateValue} ariaInvalid={!moment} icon={Calendar} />
            <PickerField label="Time" type="time" value={timeValue} onChange={setTimeValue} ariaInvalid={!moment} icon={Clock} />
            <div className="space-y-1 text-xs font-semibold text-[var(--color-text-secondary)] sm:col-span-2">
              <label htmlFor="timezone-source-zone">Source time zone</label>
              <TimezoneSelect
                inputId="timezone-source-zone"
                ariaLabel="Source time zone"
                options={zoneSelectOptions}
                value={sourceZone}
                onChange={setSourceZone}
              />
            </div>
          </ControlGrid>
        </ControlSection>
      </ToolControlPanel>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Time zone comparison</h2>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{sourceDisplay ? `${sourceDisplay.date} · ${timeValue} ${sourceDisplay.offset} in ${sourceLabel}` : "Enter a valid source moment."}</p>
          </div>
          <CopyButton text={summary} size="sm" variant="secondary" disabled={!rows.length}>Copy all</CopyButton>
        </div>
        <div className="divide-y divide-[var(--color-border-subtle)]">
          {rows.map((row) => (
            <div key={row.option.zone} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3"><span className="text-xl" aria-hidden>{row.option.flag}</span><div className="min-w-0"><div className="truncate text-sm font-bold text-[var(--color-text-primary)]">{row.option.city}</div><div className="truncate text-[10px] text-[var(--color-text-tertiary)]">{row.option.zone}</div></div></div>
              <div className="text-right"><div className="text-xl font-black text-[var(--color-text-primary)]">{row.display.time}</div><div className="text-xs text-[var(--color-text-secondary)]">{row.display.date}{row.display.dayDiff ? ` · ${row.display.dayDiff > 0 ? "+1 day" : "-1 day"}` : ""}</div><span className="mt-1 inline-flex rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--color-text-tertiary)]">{row.display.offset}</span></div>
              <Button size="icon" variant="ghost" aria-label={`Remove ${row.option.city}`} disabled={targetZones.length <= 1} onClick={() => setTargetZones((current) => current.filter((zone) => zone !== row.option.zone))} leftIcon={<X className="h-4 w-4" aria-hidden />} />
            </div>
          ))}
          {!rows.length ? <div className="px-4 py-10 text-center text-sm text-[var(--color-text-tertiary)]">Enter a valid source moment to compare time zones.</div> : null}
        </div>
        <div className="flex flex-col gap-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/55 p-4 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <TimezoneSelect
              inputId="timezone-add-zone"
              ariaLabel="Time zone to add"
              options={availableSelectOptions}
              value={selectedZoneToAdd}
              onChange={setZoneToAdd}
              isDisabled={!availableSelectOptions.length}
              placeholder="Search a time zone to add..."
            />
          </div>
          <Button variant="secondary" disabled={!availableZones.length} onClick={addTimezone} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>Add timezone</Button>
        </div>
      </section>

      <WarningPanel messages={[{ id: "local", severity: "info", title: "Daylight-saving aware", message: "Calculated in your browser with the built-in Intl API. Offsets automatically follow the selected date and each region's daylight-saving rules." }]} />
    </div>
  );
}
