import { describe, expect, it } from "vitest";
import {
  buildBatchCsv,
  buildJavaScriptStarter,
  buildMarkdownReport,
  buildTimeZoneRows,
  buildTimestampChecks,
  buildTimestampReport,
  convertDateInput,
  convertTimestampInput,
  formatRelativeTime,
  formatTimestampDate,
  parseBatchTimestamps,
  toDateTimeLocalValue,
} from "./timestamp";
import type { TimestampResult } from "./types";

const NOW = new Date("2026-01-01T00:00:00.000Z");

describe("convertTimestampInput", () => {
  it("auto-detects Unix seconds", () => {
    const result = convertTimestampInput("1700000000", "auto", NOW);
    expect(result.ok && result.status === "valid" && result.unit).toBe("seconds");
    expect(result.ok && result.status === "valid" && result.formats.iso).toBe("2023-11-14T22:13:20.000Z");
  });

  it("auto-detects JavaScript milliseconds", () => {
    const result = convertTimestampInput("1700000000000", "auto", NOW);
    expect(result.ok && result.status === "valid" && result.unit).toBe("milliseconds");
  });

  it("auto-detects microseconds", () => {
    const result = convertTimestampInput("1700000000123456", "auto", NOW);
    expect(result.ok && result.status === "valid" && result.unit).toBe("microseconds");
    expect(result.ok && result.status === "valid" && result.formats.iso).toBe("2023-11-14T22:13:20.123Z");
  });

  it("auto-detects nanoseconds without requiring BigInt", () => {
    const result = convertTimestampInput("1700000000123456789", "auto", NOW);
    expect(result.ok && result.status === "valid" && result.unit).toBe("nanoseconds");
    expect(result.ok && result.status === "valid" && result.formats.iso).toBe("2023-11-14T22:13:20.123Z");
  });

  it("supports fractional seconds", () => {
    const result = convertTimestampInput("1700000000.5", "seconds", NOW);
    expect(result.ok && result.status === "valid" && result.formats.iso).toBe("2023-11-14T22:13:20.500Z");
  });

  it("reports precision loss below one millisecond", () => {
    const result = convertTimestampInput("1700000000123456", "microseconds", NOW);
    expect(result.ok && result.status === "valid" && result.precisionLoss).toBe(true);
  });

  it("rejects malformed input", () => {
    const result = convertTimestampInput("1e9", "seconds", NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect((result as Extract<TimestampResult, { ok: false }>).error.code).toBe("invalid-format");
  });

  it("rejects manual values outside the Date range", () => {
    const result = convertTimestampInput("999999999999999999", "seconds", NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect((result as Extract<TimestampResult, { ok: false }>).error.code).toBe("out-of-range");
  });

  it("supports negative pre-epoch values", () => {
    const result = convertTimestampInput("-1", "seconds", NOW);
    expect(result.ok && result.status === "valid" && result.formats.iso).toBe("1969-12-31T23:59:59.000Z");
  });
});

describe("date input conversion", () => {
  it("parses ISO input with an explicit offset", () => {
    const result = convertDateInput("2026-01-01T02:00:00+02:00", "iso", NOW);
    expect(result.ok && result.status === "valid" && result.formats.iso).toBe("2026-01-01T00:00:00.000Z");
  });

  it("rejects ISO input without an explicit timezone", () => {
    const result = convertDateInput("2026-01-01T02:00:00", "iso", NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects impossible local dates", () => {
    const result = convertDateInput("2026-02-30T12:00:00", "local", NOW);
    expect(result.ok).toBe(false);
  });

  it("formats datetime-local values with seconds", () => {
    const date = new Date(2026, 0, 2, 3, 4, 5);
    expect(toDateTimeLocalValue(date)).toBe("2026-01-02T03:04:05");
  });
});

describe("formatting and time zones", () => {
  it("creates all epoch formats", () => {
    const formats = formatTimestampDate(new Date("2023-11-14T22:13:20.123Z"), NOW);
    expect(formats.unixSeconds).toBe("1700000000.123");
    expect(formats.unixMilliseconds).toBe("1700000000123");
    expect(formats.unixMicroseconds).toBe("1700000000123000");
    expect(formats.unixNanoseconds).toBe("1700000000123000000");
  });

  it("formats relative future time", () => {
    expect(formatRelativeTime(new Date("2026-01-03T00:00:00Z"), NOW)).toBe("in 2 days");
  });

  it("formats UTC as a valid time-zone row", () => {
    const rows = buildTimeZoneRows(new Date("2026-01-01T12:00:00Z"), [{ id: "utc", label: "UTC", zone: "UTC" }]);
    expect(rows[0]).toMatchObject({ valid: true, time: "12:00:00", offset: "UTC+00:00" });
  });
});

describe("batch conversion", () => {
  it("converts mixed explicit units", () => {
    const rows = parseBatchTimestamps("1700000000 s\n1700000000000 ms\n1700000000123456 us\n1700000000123456789 ns", "auto", NOW);
    expect(rows).toHaveLength(4);
    expect(rows.every((row) => row.ok)).toBe(true);
    expect(rows.map((row) => row.detectedUnit)).toEqual(["seconds", "milliseconds", "microseconds", "nanoseconds"]);
  });

  it("keeps invalid rows visible", () => {
    const rows = parseBatchTimestamps("1700000000\ninvalid\n1700000000 parsecs", "auto", NOW);
    expect(rows).toHaveLength(3);
    expect(rows.filter((row) => !row.ok)).toHaveLength(2);
  });

  it("builds a CSV with valid and invalid rows", () => {
    const rows = parseBatchTimestamps("1700000000 seconds\ninvalid", "auto", NOW);
    const csv = buildBatchCsv(rows);
    expect(csv).toContain("requested_unit");
    expect(csv).toContain("2023-11-14T22:13:20.000Z");
    expect(csv).toContain("Enter a numeric epoch value");
  });
});

describe("checks and exports", () => {
  it("warns when sub-millisecond precision is truncated", () => {
    const result = convertTimestampInput("1700000000123456", "microseconds", NOW);
    const checks = buildTimestampChecks({ inputMode: "epoch", timestampResult: result, batchRows: [], zoneRows: [] });
    expect(checks.some((check) => check.id === "precision-loss")).toBe(true);
  });

  it("builds a redaction-free audit report and markdown", () => {
    const result = convertTimestampInput("1700000000", "seconds", NOW);
    const checks = buildTimestampChecks({ inputMode: "epoch", timestampResult: result, batchRows: [], zoneRows: [] });
    const report = buildTimestampReport({
      inputMode: "epoch",
      sourceValue: "1700000000",
      requestedUnit: "seconds",
      result,
      zoneRows: [],
      batchRows: [],
      checks,
    });
    expect(report.result.iso).toBe("2023-11-14T22:13:20.000Z");
    expect(buildMarkdownReport(report)).toContain("Timestamp conversion report");
  });

  it("generates a JavaScript starter", () => {
    const output = buildJavaScriptStarter("microseconds");
    expect(output).toContain("timestampToIso");
    expect(output).toContain('const DEFAULT_UNIT = "microseconds"');
  });
});
