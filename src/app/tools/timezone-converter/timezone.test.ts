import { describe, expect, it } from "vitest";
import {
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
  formatMinuteDifference,
  formatOffsetMinutes,
  getZoneOffsetMinutes,
  isValidTimeZone,
  parseBatchSchedule,
  resolveZonedDateTime,
  zonedDateTimeToDate,
} from "./timezone";

describe("timezone helpers", () => {
  it("validates IANA zones", () => {
    expect(isValidTimeZone("Asia/Hebron")).toBe(true);
    expect(isValidTimeZone("Not/A_Zone")).toBe(false);
  });

  it("returns null for invalid input", () => {
    expect(formatInZone(new Date("invalid"), "UTC")).toBeNull();
    expect(zonedDateTimeToDate("bad", "12:00", "UTC")).toBeNull();
  });

  it("formats a fixed UTC moment in Tokyo", () => {
    const result = formatInZone(new Date("2026-06-21T00:30:00.000Z"), "Asia/Tokyo", "UTC");
    expect(result).not.toBeNull();
    expect(result!.time).toBe("09:30 AM");
    expect(result!.time24).toBe("09:30");
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

  it("rejects a nonexistent spring-forward wall time", () => {
    const result = resolveZonedDateTime("2026-03-29", "01:30", "Europe/London");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe("nonexistent");
  });

  it("flags an ambiguous fall-back wall time", () => {
    const result = resolveZonedDateTime("2026-10-25", "01:30", "Europe/London");
    expect(result.ok).toBe(true);
    if (result.ok && result.status === "valid") {
      expect(result.ambiguous).toBe(true);
      expect(result.alternatives).toHaveLength(2);
    }
  });

  it("calculates zone offsets and readable differences", () => {
    const date = new Date("2026-01-15T12:00:00.000Z");
    expect(getZoneOffsetMinutes(date, "Asia/Kolkata")).toBe(330);
    expect(formatOffsetMinutes(-480)).toBe("UTC−8");
    expect(formatMinuteDifference(330)).toBe("+5h 30m vs source");
    expect(formatMinuteDifference(0)).toBe("Same UTC offset");
  });

  it("builds meeting rows and working-hours status", () => {
    const rows = buildZoneComparisonRows({
      date: new Date("2026-07-15T13:00:00.000Z"),
      sourceZone: "America/New_York",
      targetZones: ["America/New_York", "Europe/London", "Asia/Tokyo"],
      durationMinutes: 30,
      workingStart: "08:00",
      workingEnd: "18:00",
    });
    expect(rows).toHaveLength(3);
    expect(rows[0].availability).toBe("inside");
    expect(rows.find((row) => row.zone === "Europe/London")?.availability).toBe("inside");
    expect(rows.find((row) => row.zone === "Asia/Tokyo")?.availability).toBe("outside");
  });

  it("marks a meeting that crosses the working-hours boundary as partial", () => {
    const rows = buildZoneComparisonRows({
      date: new Date("2026-01-15T16:30:00.000Z"),
      sourceZone: "UTC",
      targetZones: ["UTC"],
      durationMinutes: 90,
      workingStart: "09:00",
      workingEnd: "17:00",
    });
    expect(rows[0].availability).toBe("partial");
  });

  it("ranks nearby candidate slots by working-hours overlap", () => {
    const slots = buildCandidateSlots({
      date: new Date("2026-07-15T13:00:00.000Z"),
      sourceZone: "America/New_York",
      targetZones: ["America/New_York", "Europe/London", "Asia/Hebron"],
      durationMinutes: 30,
      workingStart: "08:00",
      workingEnd: "18:00",
      rangeHours: 2,
      limit: 4,
    });
    expect(slots).toHaveLength(4);
    expect(slots[0].score).toBeGreaterThanOrEqual(slots.at(-1)!.score);
    expect(slots[0].rows).toHaveLength(3);
  });

  it("parses a labeled batch schedule", () => {
    const rows = parseBatchSchedule(
      "Standup | 2026-01-15 09:30 America/New_York\nRelease | 2026-07-15 16:00 Asia/Hebron",
      ["UTC", "Europe/London"],
    );
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.ok)).toBe(true);
    expect(rows[0].conversions).toHaveLength(2);
    expect(rows[0].iso).toBe("2026-01-15T14:30:00.000Z");
  });

  it("preserves invalid batch rows", () => {
    const rows = parseBatchSchedule("bad row", ["UTC"]);
    expect(rows[0].ok).toBe(false);
    expect(rows[0].error).toContain("Label");
  });

  it("builds production checks for missing overlap and bad batch rows", () => {
    const resolution = resolveZonedDateTime("2026-01-15", "12:00", "UTC");
    const rows = resolution.ok && resolution.status === "valid" ? buildZoneComparisonRows({
      date: resolution.date,
      sourceZone: "UTC",
      targetZones: ["America/Los_Angeles", "Asia/Tokyo"],
      durationMinutes: 60,
      workingStart: "09:00",
      workingEnd: "17:00",
    }) : [];
    const checks = buildTimezoneChecks({
      resolution,
      rows,
      targetZones: ["America/Los_Angeles", "Asia/Tokyo"],
      durationMinutes: 60,
      workingStart: "09:00",
      workingEnd: "17:00",
      batchRows: parseBatchSchedule("bad", ["UTC"]),
    });
    expect(checks.some((check) => check.id === "overlap-none")).toBe(true);
    expect(checks.some((check) => check.id === "batch-invalid")).toBe(true);
  });

  it("exports comparison and batch CSV", () => {
    const date = new Date("2026-01-15T14:30:00.000Z");
    const rows = buildZoneComparisonRows({
      date,
      sourceZone: "America/New_York",
      targetZones: ["UTC", "Europe/London"],
      durationMinutes: 30,
      workingStart: "08:00",
      workingEnd: "18:00",
    });
    expect(buildComparisonCsv(rows)).toContain("difference_from_source_minutes");
    expect(buildBatchCsv(parseBatchSchedule("Call | 2026-01-15 09:30 America/New_York", ["UTC"]))).toContain("Call");
  });

  it("generates an RFC-style calendar event", () => {
    const date = new Date("2026-01-15T14:30:00.000Z");
    const rows = buildZoneComparisonRows({ date, sourceZone: "UTC", targetZones: ["UTC"], durationMinutes: 30, workingStart: "08:00", workingEnd: "18:00" });
    const ics = buildIcsEvent({ date, durationMinutes: 30, title: "Team call", rows });
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20260115T143000Z");
    expect(ics).toContain("SUMMARY:Team call");
  });

  it("generates and executes a valid JavaScript starter", () => {
    const code = buildJavaScriptStarter("2026-01-15T14:30:00.000Z", ["UTC", "Asia/Hebron"]);
    expect(code).toContain("Intl.DateTimeFormat");
    expect(code).toContain("Asia/Hebron");
    const run = new Function("console", code);
    expect(() => run({ table: () => undefined })).not.toThrow();
  });

  it("builds JSON and Markdown audit reports", () => {
    const resolution = resolveZonedDateTime("2026-01-15", "09:30", "America/New_York");
    expect(resolution.ok && resolution.status === "valid").toBe(true);
    if (!resolution.ok || resolution.status !== "valid") return;
    const rows = buildZoneComparisonRows({ date: resolution.date, sourceZone: "America/New_York", targetZones: ["UTC"], durationMinutes: 30, workingStart: "08:00", workingEnd: "18:00" });
    const slots = buildCandidateSlots({ date: resolution.date, sourceZone: "America/New_York", targetZones: ["UTC"], durationMinutes: 30, workingStart: "08:00", workingEnd: "18:00", limit: 2 });
    const checks = buildTimezoneChecks({ resolution, rows, targetZones: ["UTC"], durationMinutes: 30, workingStart: "08:00", workingEnd: "18:00", batchRows: [] });
    const report = buildTimezoneAuditReport({
      dateValue: "2026-01-15",
      timeValue: "09:30",
      sourceZone: "America/New_York",
      resolution,
      durationMinutes: 30,
      workingStart: "08:00",
      workingEnd: "18:00",
      targetZones: ["UTC"],
      rows,
      candidateSlots: slots,
      batchRows: [],
      checks,
    });
    expect(report.source.resolvedIso).toBe("2026-01-15T14:30:00.000Z");
    expect(buildMarkdownReport(report)).toContain("# Time Zone Conversion Report");
  });
});
