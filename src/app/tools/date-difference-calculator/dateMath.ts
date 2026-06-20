// ─── Date difference logic ────────────────────────────────────────────────────
// Pure, timezone-naive date math. All calculations are calendar-based on the
// local date (no time-of-day), so results are stable and intuitive.

export type DateBreakdown = {
  years: number;
  months: number;
  days: number;
};

export type DateDifference = {
  /** Calendar breakdown, e.g. "2 years, 3 months, 5 days". */
  breakdown: DateBreakdown;
  /** Whether `to` is before `from` (negative span). */
  isNegative: boolean;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  /** Whole weeks plus leftover days, for "X weeks, Y days" displays. */
  weeksRemainderDays: number;
};

const MS_PER_DAY = 86_400_000;

/** Parse a `YYYY-MM-DD` string into a local Date at midnight, or null. */
export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  // Reject overflow like 2023-02-31 (which JS would roll into March).
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/** Days between two dates, ignoring time of day. Positive if `to` is later. */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / MS_PER_DAY);
}

/** Add whole months, clamping the day to the target month's last day. */
export function addMonthsClamped(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

/** Largest whole-month count `m` where `start + m months <= end` (start <= end). */
function wholeMonthsBetween(start: Date, end: Date): number {
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (months > 0 && addMonthsClamped(start, months) > end) months -= 1;
  return months;
}

/**
 * Calendar years/months/days between two dates (order-independent).
 * Uses month addition with day clamping so edge cases like Jan 31 → Mar 1
 * resolve intuitively (1 month, 1 day) instead of producing negative days.
 */
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

export function computeDifference(from: Date, to: Date): DateDifference {
  const totalDays = daysBetween(from, to);
  const magnitude = Math.abs(totalDays);
  return {
    breakdown: calendarBreakdown(from, to),
    isNegative: totalDays < 0,
    totalDays: magnitude,
    totalWeeks: Math.floor(magnitude / 7),
    weeksRemainderDays: magnitude % 7,
    totalMonths: Math.abs(monthsBetween(from, to)),
  };
}

/** Whole months between two dates (signed). */
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

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

export function toDateInputValue(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
