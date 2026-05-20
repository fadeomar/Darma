import { describe, it, expect } from "vitest";
import {
  convertTimestampInput,
  formatRelativeTime,
  formatTimezoneOffset,
  formatTimestampDate,
  convertDateInputs,
  toDateTimeLocalValue,
} from "./timestamp";

// ─── convertTimestampInput ────────────────────────────────────────────────────

describe("convertTimestampInput – empty input", () => {
  it("returns status empty for blank string", () => {
    const result = convertTimestampInput("", "auto");
    expect(result.ok).toBe(true);
    expect(result.status).toBe("empty");
  });

  it("returns status empty for whitespace-only string", () => {
    const result = convertTimestampInput("   ", "auto");
    expect(result.ok).toBe(true);
    expect(result.status).toBe("empty");
  });
});

describe("convertTimestampInput – valid 10-digit (seconds)", () => {
  it("auto-detects seconds for a 10-digit timestamp", () => {
    const result = convertTimestampInput("1700000000", "auto");
    expect(result.ok).toBe(true);
    expect(result.status).toBe("valid");
    if (result.ok && result.status === "valid") {
      expect(result.unit).toBe("seconds");
      expect(result.date).toBeInstanceOf(Date);
    }
  });

  it("returns an ISO string in formats", () => {
    const result = convertTimestampInput("0", "auto");
    expect(result.ok).toBe(true);
    if (result.ok && result.status === "valid") {
      expect(result.formats.iso).toBe("1970-01-01T00:00:00.000Z");
    }
  });
});

describe("convertTimestampInput – valid 13-digit (milliseconds)", () => {
  it("auto-detects milliseconds for a 13-digit timestamp", () => {
    const result = convertTimestampInput("1700000000000", "auto");
    expect(result.ok).toBe(true);
    if (result.ok && result.status === "valid") {
      expect(result.unit).toBe("milliseconds");
    }
  });

  it("unix seconds in formats equals timestamp / 1000", () => {
    const result = convertTimestampInput("1700000000000", "auto");
    if (result.ok && result.status === "valid") {
      expect(result.formats.unixSeconds).toBe("1700000000");
    }
  });
});

describe("convertTimestampInput – manual mode", () => {
  it("respects explicit seconds mode", () => {
    const result = convertTimestampInput("1700000000", "seconds");
    expect(result.ok).toBe(true);
    if (result.ok && result.status === "valid") {
      expect(result.unit).toBe("seconds");
    }
  });

  it("respects explicit milliseconds mode", () => {
    const result = convertTimestampInput("1700000000000", "milliseconds");
    expect(result.ok).toBe(true);
    if (result.ok && result.status === "valid") {
      expect(result.unit).toBe("milliseconds");
    }
  });
});

describe("convertTimestampInput – invalid input", () => {
  it("rejects non-integer input", () => {
    const result = convertTimestampInput("not-a-number", "auto");
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("error.code", "invalid-format");
  });

  it("rejects floating point input", () => {
    const result = convertTimestampInput("1700000000.5", "auto");
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("error.code", "invalid-format");
  });

  it("rejects an unsafe integer (too many digits)", () => {
    const result = convertTimestampInput("99999999999999999999", "auto");
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("error.code", "out-of-range");
  });
});

// ─── formatRelativeTime ───────────────────────────────────────────────────────

describe("formatRelativeTime", () => {
  const now = new Date("2026-01-01T12:00:00Z");

  it("formats past days", () => {
    const date = new Date("2025-12-29T12:00:00Z"); // 3 days ago
    expect(formatRelativeTime(date, now)).toBe("3 days ago");
  });

  it("formats singular past day", () => {
    const date = new Date("2025-12-31T12:00:00Z");
    expect(formatRelativeTime(date, now)).toBe("1 day ago");
  });

  it("formats future days", () => {
    const date = new Date("2026-01-04T12:00:00Z");
    expect(formatRelativeTime(date, now)).toBe("in 3 days");
  });

  it("formats past hours", () => {
    const date = new Date("2026-01-01T10:00:00Z");
    expect(formatRelativeTime(date, now)).toBe("2 hours ago");
  });

  it("formats singular past hour", () => {
    const date = new Date("2026-01-01T11:00:00Z");
    expect(formatRelativeTime(date, now)).toBe("1 hour ago");
  });

  it("formats past minutes", () => {
    const date = new Date("2026-01-01T11:55:00Z");
    expect(formatRelativeTime(date, now)).toBe("5 minutes ago");
  });

  it("formats past seconds", () => {
    const date = new Date("2026-01-01T11:59:30Z");
    expect(formatRelativeTime(date, now)).toBe("30 seconds ago");
  });

  it("returns 'now' for very recent timestamps", () => {
    const date = new Date("2026-01-01T12:00:00.500Z");
    expect(formatRelativeTime(date, now)).toBe("now");
  });
});

// ─── formatTimezoneOffset ────────────────────────────────────────────────────

describe("formatTimezoneOffset", () => {
  it("returns a UTC+HH:MM string", () => {
    // The result depends on the test environment's timezone, so validate the pattern
    const result = formatTimezoneOffset(new Date());
    expect(result).toMatch(/^UTC[+-]\d{2}:\d{2}$/);
  });
});

// ─── formatTimestampDate ─────────────────────────────────────────────────────

describe("formatTimestampDate", () => {
  it("returns all expected format keys", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    const now = new Date("2026-01-01T00:00:00.000Z");
    const formats = formatTimestampDate(date, now);
    expect(formats).toHaveProperty("iso");
    expect(formats).toHaveProperty("utc");
    expect(formats).toHaveProperty("local");
    expect(formats).toHaveProperty("unixSeconds");
    expect(formats).toHaveProperty("unixMilliseconds");
    expect(formats).toHaveProperty("timezoneOffset");
    expect(formats).toHaveProperty("relative");
  });

  it("iso format is valid ISO 8601", () => {
    const date = new Date("2026-06-15T10:30:00.000Z");
    const formats = formatTimestampDate(date, date);
    expect(formats.iso).toBe("2026-06-15T10:30:00.000Z");
  });

  it("unixSeconds is string representation of Math.floor(ms/1000)", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    const formats = formatTimestampDate(date, date);
    expect(formats.unixSeconds).toBe(String(Math.floor(date.getTime() / 1000)));
  });
});

// ─── convertDateInputs ────────────────────────────────────────────────────────

describe("convertDateInputs – ISO input", () => {
  it("parses a valid ISO datetime with Z timezone", () => {
    const result = convertDateInputs("", "2026-01-01T00:00:00.000Z");
    expect(result.ok).toBe(true);
    if (result.ok && result.status === "valid") {
      expect(result.source).toBe("iso");
      expect(result.date.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    }
  });

  it("rejects ISO without timezone", () => {
    const result = convertDateInputs("", "2026-01-01T00:00:00");
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("error.code", "invalid-format");
  });

  it("returns empty when both inputs are empty", () => {
    const result = convertDateInputs("", "");
    expect(result.ok).toBe(true);
    expect(result.status).toBe("empty");
  });
});

describe("convertDateInputs – local datetime input", () => {
  it("parses a valid local datetime string", () => {
    const result = convertDateInputs("2026-03-15T14:30", "");
    expect(result.ok).toBe(true);
    if (result.ok && result.status === "valid") {
      expect(result.source).toBe("local");
    }
  });

  it("rejects malformed local datetime", () => {
    const result = convertDateInputs("not-a-date", "");
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("error.code", "invalid-format");
  });
});

// ─── toDateTimeLocalValue ────────────────────────────────────────────────────

describe("toDateTimeLocalValue", () => {
  it("formats a Date as YYYY-MM-DDTHH:mm:ss", () => {
    // Use a known local time by constructing with local date parts
    const date = new Date(2026, 0, 1, 14, 30, 45); // local Jan 1 2026 14:30:45
    const result = toDateTimeLocalValue(date);
    expect(result).toBe("2026-01-01T14:30:45");
  });
});
