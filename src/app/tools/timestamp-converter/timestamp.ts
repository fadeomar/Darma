export type TimestampUnitMode = "auto" | "seconds" | "milliseconds";
export type TimestampUnit = "seconds" | "milliseconds";

export type TimestampErrorCode =
  | "invalid-format"
  | "out-of-range"
  | "invalid-date";

export type TimestampFormats = {
  local: string;
  utc: string;
  iso: string;
  unixSeconds: string;
  unixMilliseconds: string;
  timezoneOffset: string;
  relative: string;
};

export type TimestampResult =
  | {
      ok: true;
      status: "empty";
      inputLength: number;
      digitLength: number;
    }
  | {
      ok: true;
      status: "valid";
      unit: TimestampUnit;
      detectedLabel: string;
      note: string;
      inputLength: number;
      digitLength: number;
      date: Date;
      formats: TimestampFormats;
    }
  | {
      ok: false;
      status: "invalid";
      inputLength: number;
      digitLength: number;
      error: {
        code: TimestampErrorCode;
        message: string;
      };
    };

export type DateInputSource = "local" | "iso";

export type DateInputResult =
  | {
      ok: true;
      status: "empty";
    }
  | {
      ok: true;
      status: "valid";
      source: DateInputSource;
      sourceLabel: string;
      date: Date;
      formats: TimestampFormats;
    }
  | {
      ok: false;
      status: "invalid";
      error: {
        code: TimestampErrorCode;
        message: string;
      };
    };

const MAX_DATE_MS = 8_640_000_000_000_000;
const INTEGER_TIMESTAMP_REGEX = /^[+-]?\d+$/;
const LOCAL_DATE_TIME_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const ISO_WITH_ZONE_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})$/i;

function countDigits(value: string): number {
  return value.replace(/^[+-]/, "").length;
}

function isDateInRange(ms: number): boolean {
  return ms >= -MAX_DATE_MS && ms <= MAX_DATE_MS;
}

function makeDate(ms: number): Date | null {
  if (!Number.isSafeInteger(ms) || !isDateInRange(ms)) return null;
  const date = new Date(ms);
  return Number.isFinite(date.getTime()) ? date : null;
}

function timestampToMilliseconds(value: number, unit: TimestampUnit): number {
  return unit === "seconds" ? value * 1000 : value;
}

function chooseAutoUnit(value: number, digitLength: number): {
  unit: TimestampUnit;
  note: string;
} {
  if (digitLength <= 10) {
    return {
      unit: "seconds",
      note: "Auto detected seconds because this looks like a 10-digit-or-shorter Unix timestamp.",
    };
  }

  if (digitLength >= 13) {
    return {
      unit: "milliseconds",
      note: "Auto detected milliseconds because this looks like a 13-digit JavaScript timestamp.",
    };
  }

  const now = Date.now();
  const secondsMs = timestampToMilliseconds(value, "seconds");
  const millisecondsMs = timestampToMilliseconds(value, "milliseconds");
  const secondsValid = isDateInRange(secondsMs);
  const millisecondsValid = isDateInRange(millisecondsMs);

  if (secondsValid && !millisecondsValid) {
    return {
      unit: "seconds",
      note: "Auto detected seconds because the millisecond interpretation is outside the valid Date range.",
    };
  }

  if (!secondsValid && millisecondsValid) {
    return {
      unit: "milliseconds",
      note: "Auto detected milliseconds because the seconds interpretation is outside the valid Date range.",
    };
  }

  if (secondsValid && millisecondsValid) {
    const secondsDistance = Math.abs(secondsMs - now);
    const millisecondsDistance = Math.abs(millisecondsMs - now);

    if (secondsDistance < millisecondsDistance) {
      return {
        unit: "seconds",
        note: "Auto detected seconds because that interpretation is closer to the current date.",
      };
    }

    return {
      unit: "milliseconds",
      note: "Auto detected milliseconds because 11-12 digit values are usually millisecond timestamps.",
    };
  }

  return {
    unit: digitLength >= 11 ? "milliseconds" : "seconds",
    note: "Auto selected the closest common timestamp unit.",
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatTimezoneOffset(date: Date): string {
  const offsetMinutes = date.getTimezoneOffset();
  const sign = offsetMinutes <= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;
  return `UTC${sign}${pad(hours)}:${pad(minutes)}`;
}

export function formatRelativeTime(date: Date, now = new Date()): string {
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const past = diffMs < 0;

  const units = [
    { label: "day", ms: 86_400_000 },
    { label: "hour", ms: 3_600_000 },
    { label: "minute", ms: 60_000 },
    { label: "second", ms: 1_000 },
  ];

  for (const unit of units) {
    const amount = Math.floor(absMs / unit.ms);
    if (amount >= 1) {
      const label = amount === 1 ? unit.label : `${unit.label}s`;
      return past ? `${amount} ${label} ago` : `in ${amount} ${label}`;
    }
  }

  return "now";
}

export function formatTimestampDate(date: Date, now = new Date()): TimestampFormats {
  const ms = date.getTime();
  return {
    local: date.toLocaleString(),
    utc: date.toUTCString(),
    iso: date.toISOString(),
    unixSeconds: String(Math.floor(ms / 1000)),
    unixMilliseconds: String(ms),
    timezoneOffset: formatTimezoneOffset(date),
    relative: formatRelativeTime(date, now),
  };
}

export function convertTimestampInput(
  input: string,
  mode: TimestampUnitMode,
): TimestampResult {
  const trimmed = input.trim();
  const digitLength = countDigits(trimmed);

  if (!trimmed) {
    return { ok: true, status: "empty", inputLength: 0, digitLength: 0 };
  }

  if (!INTEGER_TIMESTAMP_REGEX.test(trimmed)) {
    return {
      ok: false,
      status: "invalid",
      inputLength: trimmed.length,
      digitLength,
      error: {
        code: "invalid-format",
        message: "Enter a whole-number Unix timestamp. Digits and an optional leading minus sign are supported.",
      },
    };
  }

  const value = Number(trimmed);
  if (!Number.isSafeInteger(value)) {
    return {
      ok: false,
      status: "invalid",
      inputLength: trimmed.length,
      digitLength,
      error: {
        code: "out-of-range",
        message: "That timestamp is too large to convert safely.",
      },
    };
  }
  const detection =
    mode === "auto"
      ? chooseAutoUnit(value, digitLength)
      : {
          unit: mode,
          note: `Manual mode: interpreting this value as ${mode}.`,
        };
  const ms = timestampToMilliseconds(value, detection.unit);
  const date = makeDate(ms);

  if (!date) {
    return {
      ok: false,
      status: "invalid",
      inputLength: trimmed.length,
      digitLength,
      error: {
        code: "out-of-range",
        message: "That timestamp is outside the valid JavaScript Date range.",
      },
    };
  }

  return {
    ok: true,
    status: "valid",
    unit: detection.unit,
    detectedLabel: detection.unit === "seconds" ? "Seconds" : "Milliseconds",
    note: detection.note,
    inputLength: trimmed.length,
    digitLength,
    date,
    formats: formatTimestampDate(date),
  };
}

function parseLocalDateTime(input: string): DateInputResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: true, status: "empty" };

  const match = trimmed.match(LOCAL_DATE_TIME_REGEX);
  if (!match) {
    return {
      ok: false,
      status: "invalid",
      error: {
        code: "invalid-format",
        message: "Use the browser local date picker format: YYYY-MM-DDTHH:mm.",
      },
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] ? Number(match[6]) : 0;

  const date = new Date(year, month - 1, day, hour, minute, second, 0);
  if (
    !Number.isFinite(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    return {
      ok: false,
      status: "invalid",
      error: {
        code: "invalid-date",
        message: "That local date/time is not valid.",
      },
    };
  }

  return {
    ok: true,
    status: "valid",
    source: "local",
    sourceLabel: "Browser local time",
    date,
    formats: formatTimestampDate(date),
  };
}

function parseIsoDateTime(input: string): DateInputResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: true, status: "empty" };

  if (!ISO_WITH_ZONE_REGEX.test(trimmed)) {
    return {
      ok: false,
      status: "invalid",
      error: {
        code: "invalid-format",
        message: "Use an ISO date with a timezone, for example 2030-01-01T00:00:00.000Z.",
      },
    };
  }

  const ms = Date.parse(trimmed);
  const date = Number.isFinite(ms) ? new Date(ms) : null;
  if (!date || !Number.isFinite(date.getTime())) {
    return {
      ok: false,
      status: "invalid",
      error: {
        code: "invalid-date",
        message: "That ISO date could not be parsed as a valid instant.",
      },
    };
  }

  return {
    ok: true,
    status: "valid",
    source: "iso",
    sourceLabel: "ISO date with timezone",
    date,
    formats: formatTimestampDate(date),
  };
}

export function convertDateInputs(
  localDateTime: string,
  isoDateTime: string,
): DateInputResult {
  return isoDateTime.trim()
    ? parseIsoDateTime(isoDateTime)
    : parseLocalDateTime(localDateTime);
}

export function toDateTimeLocalValue(date: Date): string {
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
    ":",
    pad(date.getSeconds()),
  ].join("");
}

export function getBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Browser local time";
}
