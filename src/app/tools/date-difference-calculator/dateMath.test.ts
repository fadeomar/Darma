import { describe, expect, it } from "vitest";
import {
  buildAuditReport,
  buildDateChecks,
  buildJavaScriptSnippet,
  buildMilestones,
  buildMilestonesCsv,
  buildMarkdownReport,
  calendarBreakdown,
  computeBusinessDays,
  computeDateTimeDifference,
  computeDifference,
  daysBetween,
  formatBreakdown,
  formatDateTimeBreakdown,
  formatUtcOffset,
  monthsBetween,
  parseDateInput,
  parseDateTimeInput,
  parseHolidayInput,
  toDateInputValue,
  weekdayName,
} from "./dateMath";

describe("calendar parsing and math", () => {
  it("parses leap dates and rejects overflow dates", () => {
    expect(parseDateInput("2024-02-29")?.getDate()).toBe(29);
    expect(parseDateInput("2023-02-29")).toBeNull();
    expect(parseDateInput("2023-13-01")).toBeNull();
    expect(parseDateInput("2023-2-1")).toBeNull();
  });

  it("counts signed days without DST drift", () => {
    expect(daysBetween(new Date(2024, 0, 1), new Date(2024, 0, 11))).toBe(10);
    expect(daysBetween(new Date(2024, 0, 11), new Date(2024, 0, 1))).toBe(-10);
  });

  it("handles leap years", () => {
    expect(daysBetween(new Date(2024, 1, 28), new Date(2024, 2, 1))).toBe(2);
    expect(daysBetween(new Date(2023, 1, 28), new Date(2023, 2, 1))).toBe(1);
  });

  it("computes clamped calendar breakdowns", () => {
    expect(calendarBreakdown(new Date(2023, 0, 31), new Date(2023, 2, 1))).toEqual({ years: 0, months: 1, days: 1 });
    expect(calendarBreakdown(new Date(2020, 0, 15), new Date(2022, 3, 20))).toEqual({ years: 2, months: 3, days: 5 });
  });

  it("counts whole months only", () => {
    expect(monthsBetween(new Date(2024, 0, 15), new Date(2024, 3, 14))).toBe(2);
    expect(monthsBetween(new Date(2024, 0, 15), new Date(2024, 3, 15))).toBe(3);
  });

  it("returns inclusive and elapsed totals", () => {
    const diff = computeDifference(new Date(2024, 0, 1), new Date(2024, 0, 15));
    expect(diff.totalDays).toBe(14);
    expect(diff.inclusiveDays).toBe(15);
    expect(diff.totalWeeks).toBe(2);
    expect(diff.isNegative).toBe(false);
  });

  it("preserves reversed direction while keeping magnitudes positive", () => {
    const diff = computeDifference(new Date(2024, 0, 15), new Date(2024, 0, 1));
    expect(diff.isNegative).toBe(true);
    expect(diff.signedDays).toBe(-14);
    expect(diff.totalDays).toBe(14);
  });
});

describe("date-time offsets", () => {
  it("parses wall-clock values using fixed UTC offsets", () => {
    const value = parseDateTimeInput("2026-07-13T09:00", 180);
    expect(value?.toISOString()).toBe("2026-07-13T06:00:00.000Z");
  });

  it("rejects invalid datetime values and offsets", () => {
    expect(parseDateTimeInput("2026-02-30T09:00", 0)).toBeNull();
    expect(parseDateTimeInput("2026-07-13T25:00", 0)).toBeNull();
    expect(parseDateTimeInput("2026-07-13T09:00", 900)).toBeNull();
  });

  it("calculates elapsed time across different offsets", () => {
    const from = parseDateTimeInput("2026-07-13T09:00", 180)!;
    const to = parseDateTimeInput("2026-07-13T09:00", -240)!;
    const result = computeDateTimeDifference(from, to);
    expect(result.totalHours).toBe(7);
    expect(formatDateTimeBreakdown(result)).toBe("7h 0m 0s");
  });
});

describe("business days and holidays", () => {
  it("counts Monday through Friday with a Saturday-Sunday weekend", () => {
    const result = computeBusinessDays(parseDateInput("2026-07-13")!, parseDateInput("2026-07-20")!, {
      inclusive: false,
      weekendPreset: "sat-sun",
      holidays: [],
    });
    expect(result.calendarDays).toBe(7);
    expect(result.businessDays).toBe(5);
    expect(result.weekendDays).toBe(2);
  });

  it("supports Friday-Saturday weekends and inclusive boundaries", () => {
    const result = computeBusinessDays(parseDateInput("2026-07-12")!, parseDateInput("2026-07-18")!, {
      inclusive: true,
      weekendPreset: "fri-sat",
      holidays: [],
    });
    expect(result.calendarDays).toBe(7);
    expect(result.businessDays).toBe(5);
  });

  it("excludes holidays only when they fall on working days", () => {
    const result = computeBusinessDays(parseDateInput("2026-07-13")!, parseDateInput("2026-07-17")!, {
      inclusive: true,
      weekendPreset: "sat-sun",
      holidays: ["2026-07-15"],
    });
    expect(result.businessDays).toBe(4);
    expect(result.holidayDays).toBe(1);
  });

  it("parses and deduplicates holiday input", () => {
    expect(parseHolidayInput("2026-07-15\n2026-07-15,invalid;2026-07-16")).toEqual({
      dates: ["2026-07-15", "2026-07-16"],
      invalid: ["invalid"],
      duplicates: ["2026-07-15"],
    });
  });
});

describe("milestones, checks, and exports", () => {
  it("builds unique quarter milestones", () => {
    const milestones = buildMilestones(parseDateInput("2026-07-01")!, parseDateInput("2026-07-09")!);
    expect(milestones.map((item) => item.date)).toEqual(["2026-07-01", "2026-07-03", "2026-07-05", "2026-07-07", "2026-07-09"]);
  });

  it("deduplicates milestones for very short ranges", () => {
    const milestones = buildMilestones(parseDateInput("2026-07-01")!, parseDateInput("2026-07-02")!);
    expect(new Set(milestones.map((item) => item.date)).size).toBe(milestones.length);
  });

  it("creates production checks for reversed datetime offsets", () => {
    const from = parseDateTimeInput("2026-07-13T12:00", 180)!;
    const to = parseDateTimeInput("2026-07-13T08:00", 180)!;
    const dateTimeResult = computeDateTimeDifference(from, to);
    const checks = buildDateChecks({
      mode: "datetime",
      fromValid: true,
      toValid: true,
      calendarResult: null,
      dateTimeResult,
      inclusive: false,
      business: null,
      holidayParse: { dates: [], invalid: [], duplicates: [] },
      fromOffsetMinutes: 180,
      toOffsetMinutes: -240,
    });
    expect(checks.some((check) => check.id === "reversed")).toBe(true);
    expect(checks.some((check) => check.id === "offsets")).toBe(true);
    expect(checks.some((check) => check.id === "dst")).toBe(true);
  });

  it("formats labels and offsets", () => {
    expect(weekdayName(new Date(2024, 0, 1))).toBe("Monday");
    expect(formatBreakdown({ years: 1, months: 0, days: 1 })).toBe("1 year, 1 day");
    expect(formatUtcOffset(210)).toBe("UTC+03:30");
    expect(formatUtcOffset(-240)).toBe("UTC−04:00");
  });

  it("round-trips date input values", () => {
    const value = "2025-06-20";
    expect(toDateInputValue(parseDateInput(value)!)).toBe(value);
  });

  it("generates CSV, Markdown, JSON-ready reports, and JavaScript", () => {
    const from = parseDateInput("2026-07-01")!;
    const to = parseDateInput("2026-07-09")!;
    const calendarResult = computeDifference(from, to);
    const milestones = buildMilestones(from, to);
    const businessDays = computeBusinessDays(from, to, { inclusive: false, weekendPreset: "sat-sun", holidays: [] });
    const checks = buildDateChecks({
      mode: "calendar",
      fromValid: true,
      toValid: true,
      calendarResult,
      dateTimeResult: null,
      inclusive: false,
      business: businessDays,
      holidayParse: { dates: [], invalid: [], duplicates: [] },
      fromOffsetMinutes: 0,
      toOffsetMinutes: 0,
    });
    const report = buildAuditReport({
      mode: "calendar",
      inputs: { from: "2026-07-01", to: "2026-07-09", inclusive: false, fromOffsetMinutes: 0, toOffsetMinutes: 0, weekendPreset: "sat-sun", holidays: [] },
      calendarResult,
      dateTimeResult: null,
      businessDays,
      milestones,
      checks,
    });
    expect(buildMilestonesCsv(milestones)).toContain("Midpoint");
    expect(buildMarkdownReport(report)).toContain("Date Difference Audit");
    expect(JSON.stringify(report)).toContain("calendarResult");
    expect(buildJavaScriptSnippet()).toContain("calendarDaysBetween");
  });
});
