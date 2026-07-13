import type {
  BusinessDayResult,
  DateAuditReport,
  DateBreakdown,
  DateCheck,
  DateDifference,
  DateMilestone,
  DateTimeDifference,
  HolidayParseResult,
  WeekendPreset,
} from "./types";

const MS_PER_SECOND = 1_000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  return year >= 1 && year <= 9999 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month - 1);
}

export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidDateParts(year, month, day)) return null;
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function parseDateTimeInput(value: string, offsetMinutes: number): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match || !Number.isFinite(offsetMinutes) || offsetMinutes < -720 || offsetMinutes > 840) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");
  if (!isValidDateParts(year, month, day) || hour > 23 || minute > 59 || second > 59) return null;
  const utc = Date.UTC(year, month - 1, day, hour, minute, second) - offsetMinutes * MS_PER_MINUTE;
  const date = new Date(utc);
  return Number.isNaN(date.getTime()) ? null : date;
}

function utcDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY);
}

export function daysBetween(from: Date, to: Date): number {
  return utcDayNumber(to) - utcDayNumber(from);
}

export function addMonthsClamped(date: Date, months: number): Date {
  const target = new Date(0);
  target.setFullYear(date.getFullYear(), date.getMonth() + months, 1);
  target.setHours(0, 0, 0, 0);
  target.setDate(Math.min(date.getDate(), daysInMonth(target.getFullYear(), target.getMonth())));
  return target;
}

function wholeMonthsBetween(start: Date, end: Date): number {
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (months > 0 && addMonthsClamped(start, months) > end) months -= 1;
  return months;
}

export function calendarBreakdown(from: Date, to: Date): DateBreakdown {
  let start = from;
  let end = to;
  if (start > end) [start, end] = [end, start];
  const totalMonths = wholeMonthsBetween(start, end);
  const anchor = addMonthsClamped(start, totalMonths);
  const days = daysBetween(anchor, end);
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    days,
  };
}

export function monthsBetween(from: Date, to: Date): number {
  let start = from;
  let end = to;
  let sign = 1;
  if (start > end) {
    [start, end] = [end, start];
    sign = -1;
  }
  return wholeMonthsBetween(start, end) * sign;
}

export function computeDifference(from: Date, to: Date): DateDifference {
  const signedDays = daysBetween(from, to);
  const magnitude = Math.abs(signedDays);
  return {
    breakdown: calendarBreakdown(from, to),
    isNegative: signedDays < 0,
    signedDays,
    totalDays: magnitude,
    inclusiveDays: magnitude + 1,
    totalWeeks: Math.floor(magnitude / 7),
    weeksRemainderDays: magnitude % 7,
    totalMonths: Math.abs(monthsBetween(from, to)),
  };
}

export function computeDateTimeDifference(from: Date, to: Date): DateTimeDifference {
  const signedMilliseconds = to.getTime() - from.getTime();
  const totalMilliseconds = Math.abs(signedMilliseconds);
  const totalSeconds = Math.floor(totalMilliseconds / MS_PER_SECOND);
  const totalMinutes = totalMilliseconds / MS_PER_MINUTE;
  const totalHours = totalMilliseconds / MS_PER_HOUR;
  const totalDays = totalMilliseconds / MS_PER_DAY;
  const wholeDays = Math.floor(totalDays);
  const hoursRemainder = Math.floor((totalMilliseconds % MS_PER_DAY) / MS_PER_HOUR);
  const minutesRemainder = Math.floor((totalMilliseconds % MS_PER_HOUR) / MS_PER_MINUTE);
  const secondsRemainder = Math.floor((totalMilliseconds % MS_PER_MINUTE) / MS_PER_SECOND);
  return {
    isNegative: signedMilliseconds < 0,
    signedMilliseconds,
    totalMilliseconds,
    totalSeconds,
    totalMinutes,
    totalHours,
    totalDays,
    wholeDays,
    hoursRemainder,
    minutesRemainder,
    secondsRemainder,
    fromUtcIso: from.toISOString(),
    toUtcIso: to.toISOString(),
  };
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function weekdayName(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

export function formatBreakdown(breakdown: DateBreakdown): string {
  const parts: string[] = [];
  if (breakdown.years) parts.push(`${breakdown.years} ${breakdown.years === 1 ? "year" : "years"}`);
  if (breakdown.months) parts.push(`${breakdown.months} ${breakdown.months === 1 ? "month" : "months"}`);
  if (breakdown.days || parts.length === 0) parts.push(`${breakdown.days} ${breakdown.days === 1 ? "day" : "days"}`);
  return parts.join(", ");
}

export function formatDateTimeBreakdown(result: DateTimeDifference): string {
  const parts: string[] = [];
  if (result.wholeDays) parts.push(`${result.wholeDays}d`);
  if (result.hoursRemainder || parts.length) parts.push(`${result.hoursRemainder}h`);
  if (result.minutesRemainder || parts.length) parts.push(`${result.minutesRemainder}m`);
  parts.push(`${result.secondsRemainder}s`);
  return parts.join(" ");
}

export function toDateInputValue(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseHolidayInput(value: string): HolidayParseResult {
  const dates: string[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();
  for (const raw of value.split(/[\n,;]+/)) {
    const token = raw.trim();
    if (!token) continue;
    if (!parseDateInput(token)) {
      invalid.push(token);
      continue;
    }
    if (seen.has(token)) {
      duplicates.push(token);
      continue;
    }
    seen.add(token);
    dates.push(token);
  }
  dates.sort();
  return { dates, invalid, duplicates };
}

export function weekendDaysForPreset(preset: WeekendPreset): Set<number> {
  if (preset === "fri-sat") return new Set([5, 6]);
  if (preset === "sun-only") return new Set([0]);
  return new Set([0, 6]);
}

function dateFromDayNumber(dayNumber: number): Date {
  const utc = new Date(dayNumber * MS_PER_DAY);
  const result = new Date(0);
  result.setFullYear(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
  result.setHours(0, 0, 0, 0);
  return result;
}

export function computeBusinessDays(
  from: Date,
  to: Date,
  options: { inclusive: boolean; weekendPreset: WeekendPreset; holidays: string[] },
): BusinessDayResult {
  const startDay = Math.min(utcDayNumber(from), utcDayNumber(to));
  const endDay = Math.max(utcDayNumber(from), utcDayNumber(to));
  const lastDay = options.inclusive ? endDay : endDay - 1;
  const holidaySet = new Set(options.holidays);
  const weekendSet = weekendDaysForPreset(options.weekendPreset);
  let businessDays = 0;
  let weekendDays = 0;
  let holidayDays = 0;
  let calendarDays = 0;

  if (lastDay >= startDay) {
    for (let dayNumber = startDay; dayNumber <= lastDay; dayNumber += 1) {
      const date = dateFromDayNumber(dayNumber);
      const key = toDateInputValue(date);
      calendarDays += 1;
      if (weekendSet.has(date.getDay())) {
        weekendDays += 1;
      } else if (holidaySet.has(key)) {
        holidayDays += 1;
      } else {
        businessDays += 1;
      }
    }
  }

  return {
    businessDays,
    weekendDays,
    holidayDays,
    calendarDays,
    consideredStart: toDateInputValue(dateFromDayNumber(startDay)),
    consideredEnd: toDateInputValue(dateFromDayNumber(Math.max(startDay, lastDay))),
  };
}

export function buildMilestones(from: Date, to: Date): DateMilestone[] {
  const signed = daysBetween(from, to);
  const total = Math.abs(signed);
  const direction = signed < 0 ? -1 : 1;
  const candidates = [
    { id: "start", label: "Start", progress: 0 },
    { id: "quarter", label: "25%", progress: 0.25 },
    { id: "midpoint", label: "Midpoint", progress: 0.5 },
    { id: "three-quarter", label: "75%", progress: 0.75 },
    { id: "end", label: "End", progress: 1 },
  ];
  const seen = new Set<string>();
  const milestones: DateMilestone[] = [];
  for (const candidate of candidates) {
    const offsetDays = Math.round(total * candidate.progress) * direction;
    const date = addDays(from, offsetDays);
    const key = toDateInputValue(date);
    if (seen.has(key)) continue;
    seen.add(key);
    milestones.push({
      id: candidate.id,
      label: candidate.label,
      date: key,
      weekday: weekdayName(date),
      offsetDays,
      progress: candidate.progress,
    });
  }
  return milestones;
}

export function formatUtcOffset(minutes: number): string {
  if (minutes === 0) return "UTC±00:00";
  const sign = minutes > 0 ? "+" : "−";
  const absolute = Math.abs(minutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const mins = String(absolute % 60).padStart(2, "0");
  return `UTC${sign}${hours}:${mins}`;
}

export function buildDateChecks(input: {
  mode: "calendar" | "datetime";
  fromValid: boolean;
  toValid: boolean;
  calendarResult: DateDifference | null;
  dateTimeResult: DateTimeDifference | null;
  inclusive: boolean;
  business: BusinessDayResult | null;
  holidayParse: HolidayParseResult;
  fromOffsetMinutes: number;
  toOffsetMinutes: number;
}): DateCheck[] {
  const checks: DateCheck[] = [];
  if (!input.fromValid || !input.toValid) {
    checks.push({ id: "invalid-input", level: "danger", title: "Invalid date input", message: "Enter complete, valid dates before using the result in a schedule or report." });
    return checks;
  }
  const spanDays = input.calendarResult?.totalDays ?? input.dateTimeResult?.totalDays ?? 0;
  if (spanDays === 0) checks.push({ id: "same-instant", level: "info", title: "Same boundary", message: input.inclusive && input.mode === "calendar" ? "Inclusive calendar counting treats this as one calendar day." : "The selected boundaries represent no elapsed duration." });
  if ((input.calendarResult?.isNegative ?? input.dateTimeResult?.isNegative) === true) checks.push({ id: "reversed", level: "warning", title: "End precedes start", message: "Totals are shown as positive magnitudes, while the report preserves the reversed direction." });
  if (spanDays > 36_525) checks.push({ id: "large-range", level: "warning", title: "Very large date range", message: "This span exceeds 100 years. Confirm that the year fields were entered intentionally." });
  if (input.inclusive && input.mode === "calendar") checks.push({ id: "inclusive", level: "info", title: "Inclusive boundaries enabled", message: "Both the start and end calendar dates are counted in inclusive and business-day totals." });
  if (input.holidayParse.invalid.length) checks.push({ id: "invalid-holidays", level: "danger", title: "Invalid holiday dates", message: `${input.holidayParse.invalid.length} holiday value(s) are not valid YYYY-MM-DD dates and are excluded.` });
  if (input.holidayParse.duplicates.length) checks.push({ id: "duplicate-holidays", level: "warning", title: "Duplicate holidays", message: `${input.holidayParse.duplicates.length} duplicate holiday value(s) were removed.` });
  if (input.business && input.business.calendarDays > 0 && input.business.businessDays === 0) checks.push({ id: "no-business-days", level: "warning", title: "No working days", message: "Every considered date is a configured weekend or holiday." });
  if (input.mode === "datetime" && input.fromOffsetMinutes !== input.toOffsetMinutes) checks.push({ id: "offsets", level: "info", title: "Different UTC offsets", message: "The elapsed duration is calculated after converting both wall-clock inputs to UTC." });
  if (input.mode === "datetime") checks.push({ id: "dst", level: "info", title: "Fixed-offset calculation", message: "UTC offsets are fixed values. Named-zone daylight-saving transitions are intentionally not inferred." });
  if (!checks.some((check) => check.level === "danger" || check.level === "warning")) checks.unshift({ id: "ready", level: "success", title: "Calculation ready", message: "Inputs are valid and no blocking date-range issues were detected." });
  return checks;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildMilestonesCsv(milestones: DateMilestone[]): string {
  return [
    "label,date,weekday,offset_days,progress_percent",
    ...milestones.map((item) => [item.label, item.date, item.weekday, item.offsetDays, item.progress * 100].map(csvCell).join(",")),
  ].join("\n");
}

export function buildMarkdownReport(report: DateAuditReport): string {
  const result = report.mode === "calendar" ? report.calendarResult : report.dateTimeResult;
  const lines = [
    "# Date Difference Audit",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `From: ${report.inputs.from}`,
    `To: ${report.inputs.to}`,
    "",
    "## Result",
  ];
  if (report.mode === "calendar" && report.calendarResult) {
    lines.push(`- Calendar breakdown: ${formatBreakdown(report.calendarResult.breakdown)}`);
    lines.push(`- Elapsed days: ${report.calendarResult.totalDays}`);
    lines.push(`- Inclusive days: ${report.calendarResult.inclusiveDays}`);
    lines.push(`- Whole months: ${report.calendarResult.totalMonths}`);
  } else if (report.dateTimeResult) {
    lines.push(`- Duration: ${formatDateTimeBreakdown(report.dateTimeResult)}`);
    lines.push(`- Total hours: ${report.dateTimeResult.totalHours}`);
    lines.push(`- From UTC: ${report.dateTimeResult.fromUtcIso}`);
    lines.push(`- To UTC: ${report.dateTimeResult.toUtcIso}`);
  } else {
    lines.push("- No valid result");
  }
  if (result && report.businessDays) {
    lines.push("", "## Business days");
    lines.push(`- Working days: ${report.businessDays.businessDays}`);
    lines.push(`- Weekend days: ${report.businessDays.weekendDays}`);
    lines.push(`- Holiday days: ${report.businessDays.holidayDays}`);
  }
  lines.push("", "## Production checks");
  for (const check of report.checks) lines.push(`- **${check.level.toUpperCase()} — ${check.title}:** ${check.message}`);
  return `${lines.join("\n")}\n`;
}

export function buildJavaScriptSnippet(): string {
  return `const MS_PER_DAY = 86_400_000;

export function calendarDaysBetween(fromYmd, toYmd) {
  const parse = (value) => {
    const [year, month, day] = value.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((parse(toYmd) - parse(fromYmd)) / MS_PER_DAY);
}

export function durationBetweenOffsets(fromLocal, fromOffsetMinutes, toLocal, toOffsetMinutes) {
  const toUtc = (value, offset) => {
    const [date, time] = value.split("T");
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    return Date.UTC(year, month - 1, day, hour, minute) - offset * 60_000;
  };
  return toUtc(toLocal, toOffsetMinutes) - toUtc(fromLocal, fromOffsetMinutes);
}
`;
}

export function buildAuditReport(input: Omit<DateAuditReport, "generatedAt">): DateAuditReport {
  return { generatedAt: new Date().toISOString(), ...input };
}
