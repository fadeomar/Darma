import { describe, expect, it } from "vitest";
import { formatInZone, zonedDateTimeToDate } from "./timezone";

describe("timezone helpers", () => {
  it("returns null for invalid input", () => {
    expect(formatInZone(new Date("invalid"), "UTC")).toBeNull();
    expect(zonedDateTimeToDate("bad", "12:00", "UTC")).toBeNull();
  });

  it("formats a fixed UTC moment in Tokyo", () => {
    const result = formatInZone(new Date("2026-06-21T00:30:00.000Z"), "Asia/Tokyo", "UTC");
    expect(result).not.toBeNull();
    expect(result!.time).toBe("09:30 AM");
    expect(result!.offset).toBe("UTC+9");
    expect(result!.dayDiff).toBe(0);
  });

  it("detects a previous calendar day", () => {
    const result = formatInZone(new Date("2026-06-21T02:00:00.000Z"), "America/Los_Angeles", "UTC");
    expect(result!.dayDiff).toBe(-1);
  });

  it("converts wall time in New York to a moment", () => {
    const result = zonedDateTimeToDate("2026-01-15", "09:30", "America/New_York");
    expect(result?.toISOString()).toBe("2026-01-15T14:30:00.000Z");
  });
});
