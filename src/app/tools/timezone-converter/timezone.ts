import type {
  BatchTimezoneRow,
  CandidateSlot,
  TimezoneAuditReport,
  TimezoneCheck,
  TimezoneOption,
  ZoneComparisonRow,
  ZoneDisplay,
  ZonedDateTimeResolution,
} from "./types";

export type { TimezoneGroup, TimezoneOption, ZoneDisplay } from "./types";

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { zone: "America/New_York", label: "New York", city: "New York", flag: "🇺🇸", group: "Americas" },
  { zone: "America/Chicago", label: "Chicago", city: "Chicago", flag: "🇺🇸", group: "Americas" },
  { zone: "America/Denver", label: "Denver", city: "Denver", flag: "🇺🇸", group: "Americas" },
  { zone: "America/Los_Angeles", label: "Los Angeles", city: "Los Angeles", flag: "🇺🇸", group: "Americas" },
  { zone: "America/Vancouver", label: "Vancouver", city: "Vancouver", flag: "🇨🇦", group: "Americas" },
  { zone: "America/Toronto", label: "Toronto", city: "Toronto", flag: "🇨🇦", group: "Americas" },
  { zone: "America/Sao_Paulo", label: "São Paulo", city: "São Paulo", flag: "🇧🇷", group: "Americas" },
  { zone: "America/Mexico_City", label: "Mexico City", city: "Mexico City", flag: "🇲🇽", group: "Americas" },
  { zone: "Europe/London", label: "London", city: "London", flag: "🇬🇧", group: "Europe" },
  { zone: "Europe/Paris", label: "Paris", city: "Paris", flag: "🇫🇷", group: "Europe" },
  { zone: "Europe/Berlin", label: "Berlin", city: "Berlin", flag: "🇩🇪", group: "Europe" },
  { zone: "Europe/Amsterdam", label: "Amsterdam", city: "Amsterdam", flag: "🇳🇱", group: "Europe" },
  { zone: "Europe/Rome", label: "Rome", city: "Rome", flag: "🇮🇹", group: "Europe" },
  { zone: "Europe/Istanbul", label: "Istanbul", city: "Istanbul", flag: "🇹🇷", group: "Europe" },
  { zone: "Europe/Moscow", label: "Moscow", city: "Moscow", flag: "🇷🇺", group: "Europe" },
  { zone: "Asia/Hebron", label: "Hebron", city: "Hebron", flag: "🇵🇸", group: "Middle East / Africa" },
  { zone: "Asia/Jerusalem", label: "Jerusalem", city: "Jerusalem", flag: "🌍", group: "Middle East / Africa" },
  { zone: "Asia/Amman", label: "Amman", city: "Amman", flag: "🇯🇴", group: "Middle East / Africa" },
  { zone: "Asia/Riyadh", label: "Riyadh", city: "Riyadh", flag: "🇸🇦", group: "Middle East / Africa" },
  { zone: "Asia/Dubai", label: "Dubai", city: "Dubai", flag: "🇦🇪", group: "Middle East / Africa" },
  { zone: "Africa/Cairo", label: "Cairo", city: "Cairo", flag: "🇪🇬", group: "Middle East / Africa" },
  { zone: "Africa/Lagos", label: "Lagos", city: "Lagos", flag: "🇳🇬", group: "Middle East / Africa" },
  { zone: "Africa/Nairobi", label: "Nairobi", city: "Nairobi", flag: "🇰🇪", group: "Middle East / Africa" },
  { zone: "Asia/Kolkata", label: "Mumbai / Delhi", city: "Mumbai / Delhi", flag: "🇮🇳", group: "Asia-Pacific" },
  { zone: "Asia/Singapore", label: "Singapore", city: "Singapore", flag: "🇸🇬", group: "Asia-Pacific" },
  { zone: "Asia/Tokyo", label: "Tokyo", city: "Tokyo", flag: "🇯🇵", group: "Asia-Pacific" },
  { zone: "Australia/Sydney", label: "Sydney", city: "Sydney", flag: "🇦🇺", group: "Asia-Pacific" },
  { zone: "Asia/Seoul", label: "Seoul", city: "Seoul", flag: "🇰🇷", group: "Asia-Pacific" },
  { zone: "Asia/Shanghai", label: "Beijing / Shanghai", city: "Beijing / Shanghai", flag: "🇨🇳", group: "Asia-Pacific" },
  { zone: "Pacific/Auckland", label: "Auckland", city: "Auckland", flag: "🇳🇿", group: "Asia-Pacific" },
  { zone: "UTC", label: "UTC", city: "UTC", flag: "🌐", group: "UTC" },
];

export const DEFAULT_TARGET_ZONES = ["Asia/Hebron", "UTC", "Europe/London", "America/New_York", "Asia/Tokyo"];

export function isValidTimeZone(zone: string): boolean {
  if (!zone.trim()) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

function dateParts(date: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function dateKey(parts: { year: number; month: number; day: number }) {
  return `${parts.year.toString().padStart(4, "0")}-${parts.month.toString().padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

function dayNumber(parts: { year: number; month: number; day: number }) {
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / DAY_MS);
}

function sameWallMinute(
  parts: ReturnType<typeof dateParts>,
  expected: { year: number; month: number; day: number; hour: number; minute: number },
) {
  return parts.year === expected.year
    && parts.month === expected.month
    && parts.day === expected.day
    && parts.hour === expected.hour
    && parts.minute === expected.minute;
}

function parseWallInput(dateValue: string, timeValue: string) {
  if (!dateValue.trim() && !timeValue.trim()) return { empty: true as const };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue)) {
    return { empty: false as const, error: "Use a valid date and 24-hour time." };
  }
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite) || hour > 23 || minute > 59) {
    return { empty: false as const, error: "The date or time is outside its valid range." };
  }
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return { empty: false as const, error: "The calendar date does not exist." };
  }
  return { empty: false as const, value: { year, month, day, hour, minute } };
}

export function getZoneOffsetMinutes(date: Date, zone: string): number {
  if (!(date instanceof Date) || Number.isNaN(date.getTime()) || !isValidTimeZone(zone)) return NaN;
  const parts = dateParts(date, zone);
  const representedUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((representedUtc - date.getTime()) / MINUTE_MS);
}

export function formatOffsetMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes === 0) return "UTC";
  const sign = minutes > 0 ? "+" : "−";
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const mins = absolute % 60;
  return `UTC${sign}${hours}${mins ? `:${mins.toString().padStart(2, "0")}` : ""}`;
}

export function formatMinuteDifference(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes === 0) return "Same UTC offset";
  const sign = minutes > 0 ? "+" : "−";
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const mins = absolute % 60;
  return `${sign}${hours ? `${hours}h` : ""}${mins ? ` ${mins}m` : ""} vs source`.replace(`${sign} `, sign);
}

export function resolveZonedDateTime(dateValue: string, timeValue: string, sourceZone: string): ZonedDateTimeResolution {
  const parsed = parseWallInput(dateValue, timeValue);
  if (parsed.empty) return { ok: true, status: "empty" };
  if ("error" in parsed) return { ok: false, status: "invalid", message: parsed.error ?? "The source wall time is invalid." };
  if (!isValidTimeZone(sourceZone)) return { ok: false, status: "invalid", message: "Choose a supported IANA time zone." };

  const expected = parsed.value;
  const desiredUtc = Date.UTC(expected.year, expected.month - 1, expected.day, expected.hour, expected.minute);
  let timestamp = desiredUtc;
  for (let pass = 0; pass < 5; pass += 1) {
    const actual = dateParts(new Date(timestamp), sourceZone);
    const actualUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute);
    timestamp += desiredUtc - actualUtc;
  }

  const candidate = new Date(timestamp);
  if (Number.isNaN(candidate.getTime()) || !sameWallMinute(dateParts(candidate, sourceZone), expected)) {
    return {
      ok: false,
      status: "nonexistent",
      message: "This local time does not exist in the selected zone, usually because the clock moves forward for daylight saving time.",
    };
  }

  const matches = new Set<number>();
  for (let deltaMinutes = -180; deltaMinutes <= 180; deltaMinutes += 15) {
    const value = candidate.getTime() + deltaMinutes * MINUTE_MS;
    if (sameWallMinute(dateParts(new Date(value), sourceZone), expected)) matches.add(value);
  }
  const ordered = [...matches].sort((a, b) => a - b);
  const chosenTimestamp = ordered.includes(candidate.getTime()) ? candidate.getTime() : ordered[0] ?? candidate.getTime();
  const chosen = new Date(chosenTimestamp);

  return {
    ok: true,
    status: "valid",
    date: chosen,
    ambiguous: ordered.length > 1,
    alternatives: ordered.map((value) => new Date(value).toISOString()),
    sourceOffset: formatOffsetMinutes(getZoneOffsetMinutes(chosen, sourceZone)),
  };
}

export function zonedDateTimeToDate(dateValue: string, timeValue: string, sourceZone: string): Date | null {
  const result = resolveZonedDateTime(dateValue, timeValue, sourceZone);
  return result.ok && result.status === "valid" ? result.date : null;
}

export function formatInZone(date: Date, ianaZone: string, sourceZone = "UTC"): ZoneDisplay | null {
  if (!(date instanceof Date) || Number.isNaN(date.getTime()) || !isValidTimeZone(ianaZone) || !isValidTimeZone(sourceZone)) return null;
  const dateText = new Intl.DateTimeFormat("en-US", {
    timeZone: ianaZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: ianaZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  const time24 = new Intl.DateTimeFormat("en-GB", {
    timeZone: ianaZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  const abbreviationParts = new Intl.DateTimeFormat("en-US", {
    timeZone: ianaZone,
    timeZoneName: "short",
  }).formatToParts(date);
  const abbreviation = abbreviationParts.find((part) => part.type === "timeZoneName")?.value ?? ianaZone;
  const targetParts = dateParts(date, ianaZone);
  const sourceParts = dateParts(date, sourceZone);
  const offsetMinutes = getZoneOffsetMinutes(date, ianaZone);
  return {
    date: dateText,
    dateKey: dateKey(targetParts),
    time,
    time24,
    offset: formatOffsetMinutes(offsetMinutes),
    offsetMinutes,
    abbreviation,
    dayDiff: dayNumber(targetParts) - dayNumber(sourceParts),
  };
}

function timeToMinutes(value: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function availabilityLabel(status: ZoneComparisonRow["availability"]) {
  if (status === "inside") return "Inside working hours";
  if (status === "partial") return "Partly outside working hours";
  if (status === "outside") return "Outside working hours";
  return "Check working hours";
}

export function buildZoneComparisonRows({
  date,
  sourceZone,
  targetZones,
  durationMinutes,
  workingStart,
  workingEnd,
}: {
  date: Date;
  sourceZone: string;
  targetZones: string[];
  durationMinutes: number;
  workingStart: string;
  workingEnd: string;
}): ZoneComparisonRow[] {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return [];
  const sourceOffset = getZoneOffsetMinutes(date, sourceZone);
  const startWork = timeToMinutes(workingStart);
  const endWork = timeToMinutes(workingEnd);
  const validWorkWindow = startWork !== null && endWork !== null && startWork < endWork;
  const duration = Number.isFinite(durationMinutes) ? Math.max(1, Math.round(durationMinutes)) : 60;
  const endDate = new Date(date.getTime() + duration * MINUTE_MS);

  return [...new Set(targetZones)].map((zone) => {
    const option = TIMEZONE_OPTIONS.find((item) => item.zone === zone) ?? {
      zone,
      label: zone,
      city: zone.split("/").at(-1)?.replaceAll("_", " ") ?? zone,
      flag: "🌐",
      group: "UTC" as const,
    };
    const start = formatInZone(date, zone, sourceZone);
    const end = formatInZone(endDate, zone, sourceZone);
    if (!start || !end) return null;

    let availability: ZoneComparisonRow["availability"] = "unavailable";
    if (validWorkWindow && startWork !== null && endWork !== null) {
      const startMinutes = timeToMinutes(start.time24) ?? -1;
      const endMinutes = timeToMinutes(end.time24) ?? -1;
      const sameLocalDate = start.dateKey === end.dateKey;
      if (sameLocalDate && startMinutes >= startWork && endMinutes <= endWork) availability = "inside";
      else if (sameLocalDate && startMinutes < endWork && endMinutes > startWork) availability = "partial";
      else availability = "outside";
    }

    const difference = start.offsetMinutes - sourceOffset;
    return {
      zone,
      label: option.label,
      city: option.city,
      flag: option.flag,
      start,
      end,
      offsetDifferenceMinutes: difference,
      offsetDifferenceLabel: formatMinuteDifference(difference),
      availability,
      availabilityLabel: availabilityLabel(availability),
    };
  }).filter((row): row is ZoneComparisonRow => Boolean(row));
}

export function buildCandidateSlots({
  date,
  sourceZone,
  targetZones,
  durationMinutes,
  workingStart,
  workingEnd,
  rangeHours = 5,
  stepMinutes = 30,
  limit = 8,
}: {
  date: Date;
  sourceZone: string;
  targetZones: string[];
  durationMinutes: number;
  workingStart: string;
  workingEnd: string;
  rangeHours?: number;
  stepMinutes?: number;
  limit?: number;
}): CandidateSlot[] {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return [];
  const slots: CandidateSlot[] = [];
  const rangeMinutes = Math.max(0, rangeHours) * 60;
  const step = Math.max(15, Math.round(stepMinutes));
  for (let delta = -rangeMinutes; delta <= rangeMinutes; delta += step) {
    const candidate = new Date(date.getTime() + delta * MINUTE_MS);
    const rows = buildZoneComparisonRows({ date: candidate, sourceZone, targetZones, durationMinutes, workingStart, workingEnd });
    const insideCount = rows.filter((row) => row.availability === "inside").length;
    const partialCount = rows.filter((row) => row.availability === "partial").length;
    const outsideCount = rows.filter((row) => row.availability === "outside").length;
    const sourceDisplay = formatInZone(candidate, sourceZone, sourceZone);
    if (!sourceDisplay) continue;
    slots.push({
      date: candidate,
      iso: candidate.toISOString(),
      sourceLabel: `${sourceDisplay.date} · ${sourceDisplay.time}`,
      insideCount,
      partialCount,
      outsideCount,
      score: insideCount * 3 + partialCount,
      distanceMinutes: Math.abs(delta),
      rows,
    });
  }
  return slots
    .sort((a, b) => b.score - a.score || a.distanceMinutes - b.distanceMinutes || a.date.getTime() - b.date.getTime())
    .slice(0, Math.max(1, limit));
}

export function parseBatchSchedule(input: string, targetZones: string[]): BatchTimezoneRow[] {
  return input.split(/\r?\n/).map((raw, index) => ({ raw, line: index + 1 })).filter((item) => item.raw.trim()).map(({ raw, line }) => {
    const match = raw.trim().match(/^(?:(.*?)\s*\|\s*)?(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+([A-Za-z0-9_+\-/]+)$/);
    if (!match) {
      return {
        line,
        raw,
        label: "",
        dateValue: "",
        timeValue: "",
        sourceZone: "",
        ok: false,
        conversions: [],
        error: "Use: Label | YYYY-MM-DD HH:mm Area/City",
      };
    }
    const [, label = `Row ${line}`, dateValue, timeValue, sourceZone] = match;
    const resolution = resolveZonedDateTime(dateValue, timeValue, sourceZone);
    if (!resolution.ok || resolution.status !== "valid") {
      return {
        line,
        raw,
        label: label.trim() || `Row ${line}`,
        dateValue,
        timeValue,
        sourceZone,
        ok: false,
        conversions: [],
        error: "message" in resolution ? resolution.message : "The source moment is incomplete.",
      };
    }
    const conversions = [...new Set(targetZones)].map((zone) => {
      const option = TIMEZONE_OPTIONS.find((item) => item.zone === zone);
      const display = formatInZone(resolution.date, zone, sourceZone);
      if (!display) return null;
      return {
        zone,
        city: option?.city ?? zone,
        date: display.date,
        time: display.time,
        offset: display.offset,
        dayDiff: display.dayDiff,
      };
    }).filter((value): value is NonNullable<typeof value> => Boolean(value));
    return {
      line,
      raw,
      label: label.trim() || `Row ${line}`,
      dateValue,
      timeValue,
      sourceZone,
      ok: true,
      iso: resolution.date.toISOString(),
      ambiguous: resolution.ambiguous,
      conversions,
    };
  });
}

export function buildTimezoneChecks({
  resolution,
  rows,
  targetZones,
  durationMinutes,
  workingStart,
  workingEnd,
  batchRows,
}: {
  resolution: ZonedDateTimeResolution;
  rows: ZoneComparisonRow[];
  targetZones: string[];
  durationMinutes: number;
  workingStart: string;
  workingEnd: string;
  batchRows: BatchTimezoneRow[];
}): TimezoneCheck[] {
  const checks: TimezoneCheck[] = [];
  if (!resolution.ok) {
    checks.push({ id: "source-invalid", level: "danger", title: "Source moment needs attention", message: "message" in resolution ? resolution.message : "The source moment is invalid." });
  } else if (resolution.status === "empty") {
    checks.push({ id: "source-empty", level: "info", title: "Add a source moment", message: "Choose a date, local time, and source zone to create a comparison." });
  } else if (resolution.ambiguous) {
    checks.push({ id: "source-ambiguous", level: "warning", title: "Ambiguous daylight-saving time", message: `This local wall time maps to ${resolution.alternatives.length} possible UTC instants. The earlier instant is used in the report.` });
  } else {
    checks.push({ id: "source-valid", level: "success", title: "Source moment resolved", message: `The local wall time resolves to ${resolution.date.toISOString()} using current browser time-zone data.` });
  }

  const uniqueZones = new Set(targetZones);
  if (!targetZones.length) checks.push({ id: "zones-empty", level: "danger", title: "No target zones", message: "Add at least one target time zone." });
  if (uniqueZones.size !== targetZones.length) checks.push({ id: "zones-duplicate", level: "warning", title: "Duplicate zones", message: "Duplicate target zones are removed from comparison and exports." });
  if (targetZones.length > 10) checks.push({ id: "zones-many", level: "info", title: "Large comparison", message: "More than ten zones can make invitations and screenshots harder to scan." });

  const workStartMinutes = timeToMinutes(workingStart);
  const workEndMinutes = timeToMinutes(workingEnd);
  if (workStartMinutes === null || workEndMinutes === null || workStartMinutes >= workEndMinutes) {
    checks.push({ id: "work-window", level: "danger", title: "Invalid working-hours window", message: "Working-hours start must be earlier than the end on the same local day." });
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) checks.push({ id: "duration-invalid", level: "danger", title: "Invalid duration", message: "Meeting duration must be at least one minute." });
  else if (durationMinutes > 240) checks.push({ id: "duration-long", level: "warning", title: "Long meeting", message: "Meetings longer than four hours rarely fit normal working-hour windows across regions." });

  if (rows.length) {
    const inside = rows.filter((row) => row.availability === "inside").length;
    const outside = rows.filter((row) => row.availability === "outside").length;
    const dayDiffs = rows.map((row) => row.start.dayDiff);
    const daySpan = Math.max(...dayDiffs) - Math.min(...dayDiffs);
    if (inside === rows.length) checks.push({ id: "overlap-good", level: "success", title: "All zones are inside working hours", message: "The selected meeting fits the configured local working-hours window for every compared zone." });
    else if (inside === 0) checks.push({ id: "overlap-none", level: "warning", title: "No full working-hours overlap", message: "Try one of the suggested planner slots or broaden the working-hours window." });
    else checks.push({ id: "overlap-partial", level: "info", title: "Partial working-hours overlap", message: `${inside} of ${rows.length} zones are fully inside the configured working-hours window; ${outside} are fully outside.` });
    if (daySpan > 1) checks.push({ id: "calendar-span", level: "warning", title: "Wide calendar-day spread", message: "The compared moment spans more than two local calendar dates." });
    else if (rows.some((row) => row.start.dayDiff !== 0)) checks.push({ id: "calendar-boundary", level: "info", title: "Calendar boundary crossed", message: "At least one location is on the previous or next local date." });
    if (rows.some((row) => Math.abs(row.offsetDifferenceMinutes) >= 720)) checks.push({ id: "offset-wide", level: "info", title: "Large UTC-offset spread", message: "Some participants are twelve or more hours apart, so one side may be outside normal hours." });
  }

  const invalidBatch = batchRows.filter((row) => !row.ok).length;
  if (invalidBatch) checks.push({ id: "batch-invalid", level: "warning", title: "Batch rows need review", message: `${invalidBatch} batch row${invalidBatch === 1 ? "" : "s"} could not be converted and remain visible in the export.` });
  return checks;
}

function csvCell(value: string | number | boolean) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildComparisonCsv(rows: ZoneComparisonRow[]): string {
  const header = ["zone", "city", "local_date", "start_time", "end_time", "utc_offset", "difference_from_source_minutes", "day_difference", "availability"];
  const body = rows.map((row) => [
    row.zone,
    row.city,
    row.start.dateKey,
    row.start.time24,
    row.end.time24,
    row.start.offset,
    row.offsetDifferenceMinutes,
    row.start.dayDiff,
    row.availability,
  ]);
  return [header, ...body].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function buildBatchCsv(rows: BatchTimezoneRow[]): string {
  const header = ["line", "label", "source_date", "source_time", "source_zone", "status", "utc_iso", "target_zone", "target_city", "target_date", "target_time", "target_offset", "error"];
  const body: Array<Array<string | number | boolean>> = [];
  for (const row of rows) {
    if (!row.ok || !row.conversions.length) {
      body.push([row.line, row.label, row.dateValue, row.timeValue, row.sourceZone, "invalid", row.iso ?? "", "", "", "", "", "", row.error ?? ""]);
      continue;
    }
    for (const conversion of row.conversions) {
      body.push([row.line, row.label, row.dateValue, row.timeValue, row.sourceZone, row.ambiguous ? "ambiguous" : "valid", row.iso ?? "", conversion.zone, conversion.city, conversion.date, conversion.time, conversion.offset, ""]);
    }
  }
  return [header, ...body].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function buildIcsEvent({
  date,
  durationMinutes,
  title,
  rows,
}: {
  date: Date;
  durationMinutes: number;
  title: string;
  rows: ZoneComparisonRow[];
}): string {
  const stamp = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const end = new Date(date.getTime() + Math.max(1, durationMinutes) * MINUTE_MS);
  const escape = (value: string) => value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
  const description = rows.map((row) => `${row.city}: ${row.start.date} ${row.start.time} (${row.start.offset})`).join("\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Darma//Timezone Converter//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${date.getTime()}-timezone@darma.tools`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(date)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(title || "Cross-time-zone meeting")}`,
    `DESCRIPTION:${escape(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function buildJavaScriptStarter(iso: string | null, zones: string[]): string {
  return `// Generated by Darma Timezone Converter Studio\nconst instant = new Date(${JSON.stringify(iso ?? new Date(0).toISOString())});\nconst zones = ${JSON.stringify([...new Set(zones)], null, 2)};\n\nconst rows = zones.map((timeZone) => ({\n  timeZone,\n  value: new Intl.DateTimeFormat(\"en-US\", {\n    timeZone,\n    weekday: \"long\",\n    year: \"numeric\",\n    month: \"long\",\n    day: \"numeric\",\n    hour: \"2-digit\",\n    minute: \"2-digit\",\n    timeZoneName: \"short\",\n  }).format(instant),\n}));\n\nconsole.table(rows);\n`;
}

export function buildTimezoneAuditReport({
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
}: {
  dateValue: string;
  timeValue: string;
  sourceZone: string;
  resolution: ZonedDateTimeResolution;
  durationMinutes: number;
  workingStart: string;
  workingEnd: string;
  targetZones: string[];
  rows: ZoneComparisonRow[];
  candidateSlots: CandidateSlot[];
  batchRows: BatchTimezoneRow[];
  checks: TimezoneCheck[];
}): TimezoneAuditReport {
  return {
    generatedAt: new Date().toISOString(),
    source: {
      date: dateValue,
      time: timeValue,
      zone: sourceZone,
      resolvedIso: resolution.ok && resolution.status === "valid" ? resolution.date.toISOString() : null,
      ambiguous: resolution.ok && resolution.status === "valid" ? resolution.ambiguous : false,
    },
    planning: { durationMinutes, workingStart, workingEnd, targetZones: [...new Set(targetZones)] },
    comparison: rows,
    candidateSlots: candidateSlots.map((slot) => ({
      iso: slot.iso,
      sourceLabel: slot.sourceLabel,
      insideCount: slot.insideCount,
      partialCount: slot.partialCount,
      outsideCount: slot.outsideCount,
      score: slot.score,
      distanceMinutes: slot.distanceMinutes,
    })),
    batch: batchRows,
    checks,
  };
}

export function buildMarkdownReport(report: TimezoneAuditReport): string {
  const lines = [
    "# Time Zone Conversion Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Source",
    `- Local wall time: ${report.source.date} ${report.source.time}`,
    `- Source zone: ${report.source.zone}`,
    `- Resolved instant: ${report.source.resolvedIso ?? "Invalid or incomplete"}`,
    `- DST ambiguity: ${report.source.ambiguous ? "Yes" : "No"}`,
    "",
    "## Meeting plan",
    `- Duration: ${report.planning.durationMinutes} minutes`,
    `- Working hours: ${report.planning.workingStart}–${report.planning.workingEnd}`,
    "",
    "## Zone comparison",
    "| Zone | Local date | Start | End | Offset | Availability |",
    "|---|---|---:|---:|---:|---|",
    ...report.comparison.map((row) => `| ${row.city} | ${row.start.dateKey} | ${row.start.time} | ${row.end.time} | ${row.start.offset} | ${row.availabilityLabel} |`),
    "",
    "## Production checks",
    ...report.checks.map((check) => `- **${check.level.toUpperCase()} — ${check.title}:** ${check.message}`),
  ];
  if (report.batch.length) {
    lines.push("", "## Batch summary", `- Rows: ${report.batch.length}`, `- Valid: ${report.batch.filter((row) => row.ok).length}`, `- Invalid: ${report.batch.filter((row) => !row.ok).length}`);
  }
  return lines.join("\n");
}
