import { describe, expect, it } from "vitest";
import {
  calendarBreakdown,
  computeDifference,
  daysBetween,
  formatBreakdown,
  monthsBetween,
  parseDateInput,
  toDateInputValue,
  weekdayName,
} from "./dateMath";

describe("parseDateInput", () => {
  it("parses a valid ISO date", () => {
    const d = parseDateInput("2024-02-29");
    expect(d?.getFullYear()).toBe(2024);
    expect(d?.getMonth()).toBe(1);
    expect(d?.getDate()).toBe(29);
  });

  it("rejects invalid formats and overflow dates", () => {
    expect(parseDateInput("2023-02-31")).toBeNull();
    expect(parseDateInput("2023-13-01")).toBeNull();
    expect(parseDateInput("not-a-date")).toBeNull();
    expect(parseDateInput("2023-2-1")).toBeNull();
  });
});

describe("daysBetween", () => {
  it("counts days regardless of time of day", () => {
    expect(daysBetween(new Date(2024, 0, 1), new Date(2024, 0, 11))).toBe(10);
  });

  it("is negative when the second date is earlier", () => {
    expect(daysBetween(new Date(2024, 0, 11), new Date(2024, 0, 1))).toBe(-10);
  });

  it("handles leap years", () => {
    expect(daysBetween(new Date(2024, 1, 28), new Date(2024, 2, 1))).toBe(2);
    expect(daysBetween(new Date(2023, 1, 28), new Date(2023, 2, 1))).toBe(1);
  });
});

describe("calendarBreakdown", () => {
  it("computes years, months, and days", () => {
    expect(calendarBreakdown(new Date(2020, 0, 15), new Date(2022, 3, 20))).toEqual({
      years: 2,
      months: 3,
      days: 5,
    });
  });

  it("borrows correctly across month boundaries", () => {
    expect(calendarBreakdown(new Date(2023, 0, 31), new Date(2023, 2, 1))).toEqual({
      years: 0,
      months: 1,
      days: 1,
    });
  });

  it("is order-independent", () => {
    const a = new Date(2020, 0, 15);
    const b = new Date(2022, 3, 20);
    expect(calendarBreakdown(a, b)).toEqual(calendarBreakdown(b, a));
  });
});

describe("monthsBetween", () => {
  it("counts whole months only", () => {
    expect(monthsBetween(new Date(2024, 0, 15), new Date(2024, 3, 14))).toBe(2);
    expect(monthsBetween(new Date(2024, 0, 15), new Date(2024, 3, 15))).toBe(3);
  });
});

describe("computeDifference", () => {
  it("provides totals and a breakdown", () => {
    const diff = computeDifference(new Date(2024, 0, 1), new Date(2024, 0, 15));
    expect(diff.totalDays).toBe(14);
    expect(diff.totalWeeks).toBe(2);
    expect(diff.weeksRemainderDays).toBe(0);
    expect(diff.isNegative).toBe(false);
  });

  it("flags negative spans but keeps totals positive", () => {
    const diff = computeDifference(new Date(2024, 0, 15), new Date(2024, 0, 1));
    expect(diff.isNegative).toBe(true);
    expect(diff.totalDays).toBe(14);
  });
});

describe("weekdayName", () => {
  it("returns the weekday", () => {
    expect(weekdayName(new Date(2024, 0, 1))).toBe("Monday");
  });
});

describe("formatBreakdown", () => {
  it("uses singular and plural units", () => {
    expect(formatBreakdown({ years: 1, months: 0, days: 1 })).toBe("1 year, 1 day");
    expect(formatBreakdown({ years: 0, months: 2, days: 0 })).toBe("2 months");
    expect(formatBreakdown({ years: 0, months: 0, days: 0 })).toBe("0 days");
  });
});

describe("toDateInputValue", () => {
  it("round-trips with parseDateInput", () => {
    const value = "2025-06-20";
    expect(toDateInputValue(parseDateInput(value)!)).toBe(value);
  });
});
