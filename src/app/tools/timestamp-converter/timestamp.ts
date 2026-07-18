import type {
  BatchTimestampRow,
  DateInputMode,
  DateInputResult,
  EpochUnit,
  TimeZoneOption,
  TimeZoneRow,
  TimestampAuditReport,
  TimestampCheck,
  TimestampFormats,
  TimestampInputMode,
  TimestampResult,
  TimestampUnitMode,
  UnitCandidate,
} from "./types";

export type {
  BatchTimestampRow,
  DateInputMode,
  DateInputResult,
  EpochUnit,
  TimeZoneOption,
  TimeZoneRow,
  TimestampAuditReport,
  TimestampCheck,
  TimestampFormats,
  TimestampInputMode,
  TimestampResult,
  TimestampUnitMode,
  UnitCandidate,
} from "./types";

const MAX_DATE_MS = 8_640_000_000_000_000;
const NUMERIC_TIMESTAMP_REGEX = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
const LOCAL_DATE_TIME_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;
const ISO_WITH_ZONE_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})$/i;

const UNIT_LABELS: Record<EpochUnit, string> = {
  seconds: "Seconds",
  milliseconds: "Milliseconds",
  microseconds: "Microseconds",
  nanoseconds: "Nanoseconds",
};

const UNIT_ALIASES: Record<string, EpochUnit> = {
  s: "seconds",
  sec: "seconds",
  secs: "seconds",
  second: "seconds",
  seconds: "seconds",
  ms: "milliseconds",
  msec: "milliseconds",
  millisecond: "milliseconds",
  milliseconds: "milliseconds",
  us: "microseconds",
  "µs": "microseconds",
  microsecond: "microseconds",
  microseconds: "microseconds",
  ns: "nanoseconds",
  nanosecond: "nanoseconds",
  nanoseconds: "nanoseconds",
};

export const COMMON_TIME_ZONES: TimeZoneOption[] = [
  { id: "utc", label: "UTC", zone: "UTC" },
  { id: "hebron", label: "Hebron", zone: "Asia/Hebron" },
  { id: "london", label: "London", zone: "Europe/London" },
  { id: "new-york", label: "New York", zone: "America/New_York" },
  { id: "dubai", label: "Dubai", zone: "Asia/Dubai" },
  { id: "tokyo", label: "Tokyo", zone: "Asia/Tokyo" },
  { id: "sydney", label: "Sydney", zone: "Australia/Sydney" },
];

function pad(value: number, size = 2): string {
  return String(value).padStart(size, "0");
}

function countDigits(value: string): number {
  return value.replace(/^[+-]/, "").replace(/\..*$/, "").replace(/^0+(?=\d)/, "").length;
}

function isDateInRange(ms: number): boolean {
  return Number.isFinite(ms) && ms >= -MAX_DATE_MS && ms <= MAX_DATE_MS;
}

function normalizeDecimal(value: string): { sign: string; integer: string; fraction: string } {
  const trimmed = value.trim();
  const sign = trimmed.startsWith("-") ? "-" : "";
  const unsigned = trimmed.replace(/^[+-]/, "");
  const [rawInteger = "0", rawFraction = ""] = unsigned.split(".");
  const integer = (rawInteger || "0").replace(/^0+(?=\d)/, "") || "0";
  return { sign, integer, fraction: rawFraction };
}

function shiftDecimal(value: string, places: number): string {
  const { sign, integer, fraction } = normalizeDecimal(value);
  const digits = `${integer}${fraction}` || "0";
  const currentPoint = integer.length;
  const targetPoint = currentPoint + places;
  let output: string;

  if (targetPoint <= 0) {
    output = `0.${"0".repeat(Math.abs(targetPoint))}${digits}`;
  } else if (targetPoint >= digits.length) {
    output = `${digits}${"0".repeat(targetPoint - digits.length)}`;
  } else {
    output = `${digits.slice(0, targetPoint)}.${digits.slice(targetPoint)}`;
  }

  const [outputInteger = "0", outputFraction = ""] = output.split(".");
  const cleanInteger = outputInteger.replace(/^0+(?=\d)/, "") || "0";
  const cleanFraction = outputFraction.replace(/0+$/, "");
  const normalized = cleanFraction ? `${cleanInteger}.${cleanFraction}` : cleanInteger;
  return sign && normalized !== "0" ? `-${normalized}` : normalized;
}

function millisecondsShift(unit: EpochUnit): number {
  if (unit === "seconds") return 3;
  if (unit === "milliseconds") return 0;
  if (unit === "microseconds") return -3;
  return -6;
}

function parseMilliseconds(value: string, unit: EpochUnit): {
  rawMilliseconds: number;
  epochMilliseconds: number;
  precisionLoss: boolean;
} | null {
  const shifted = shiftDecimal(value, millisecondsShift(unit));
  const rawMilliseconds = Number(shifted);
  if (!isDateInRange(rawMilliseconds)) return null;
  const epochMilliseconds = Math.trunc(rawMilliseconds);
  if (!Number.isSafeInteger(epochMilliseconds)) return null;
  return {
    rawMilliseconds,
    epochMilliseconds,
    precisionLoss: rawMilliseconds !== epochMilliseconds,
  };
}

function unitExpectedDigits(unit: EpochUnit): number {
  if (unit === "seconds") return 10;
  if (unit === "milliseconds") return 13;
  if (unit === "microseconds") return 16;
  return 19;
}

function scoreCandidate(unit: EpochUnit, date: Date, digitLength: number, nowMs: number): number {
  const year = date.getUTCFullYear();
  const digitPenalty = Math.abs(digitLength - unitExpectedDigits(unit)) * 8;
  let rangePenalty = 0;
  if (year >= 2000 && year <= 2100) rangePenalty = -22;
  else if (year >= 1970 && year <= 2200) rangePenalty = -12;
  else if (year >= 1900 && year <= 2500) rangePenalty = 0;
  else rangePenalty = 24;

  const yearsAway = Math.abs(date.getTime() - nowMs) / 31_556_952_000;
  const distancePenalty = Math.min(20, Math.log10(yearsAway + 1) * 6);
  return Math.round((digitPenalty + rangePenalty + distancePenalty) * 100) / 100;
}

function buildCandidates(value: string, digitLength: number, nowMs = Date.now()): UnitCandidate[] {
  return (["seconds", "milliseconds", "microseconds", "nanoseconds"] as EpochUnit[])
    .map((unit) => {
      const parsed = parseMilliseconds(value, unit);
      if (!parsed) {
        return {
          unit,
          label: UNIT_LABELS[unit],
          valid: false,
          score: 999,
          iso: null,
          note: "Outside the JavaScript Date range.",
        };
      }
      const date = new Date(parsed.epochMilliseconds);
      const score = scoreCandidate(unit, date, digitLength, nowMs);
      return {
        unit,
        label: UNIT_LABELS[unit],
        valid: true,
        score,
        iso: date.toISOString(),
        note: `${digitLength} integer digits; interpreted as ${UNIT_LABELS[unit].toLowerCase()}.`,
      };
    })
    .sort((a, b) => a.score - b.score);
}

function formatEpochFromMilliseconds(ms: number, unit: EpochUnit): string {
  const sign = ms < 0 ? "-" : "";
  const absolute = Math.abs(ms);
  const whole = Math.trunc(absolute);

  if (unit === "milliseconds") return `${sign}${whole}`;
  if (unit === "microseconds") return `${sign}${whole}000`;
  if (unit === "nanoseconds") return `${sign}${whole}000000`;

  const seconds = Math.floor(whole / 1000);
  const remainder = whole % 1000;
  if (!remainder) return `${sign}${seconds}`;
  return `${sign}${seconds}.${pad(remainder, 3).replace(/0+$/, "")}`;
}

export function formatTimezoneOffset(date: Date): string {
  const offsetMinutes = date.getTimezoneOffset();
  const sign = offsetMinutes <= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  return `UTC${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}

export function formatRelativeTime(date: Date, now = new Date()): string {
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const past = diffMs < 0;
  const units = [
    { label: "year", ms: 31_556_952_000 },
    { label: "month", ms: 2_629_746_000 },
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
    rfc2822: date.toUTCString(),
    unixSeconds: formatEpochFromMilliseconds(ms, "seconds"),
    unixMilliseconds: formatEpochFromMilliseconds(ms, "milliseconds"),
    unixMicroseconds: formatEpochFromMilliseconds(ms, "microseconds"),
    unixNanoseconds: formatEpochFromMilliseconds(ms, "nanoseconds"),
    timezoneOffset: formatTimezoneOffset(date),
    relative: formatRelativeTime(date, now),
  };
}

export function convertTimestampInput(
  input: string,
  mode: TimestampUnitMode,
  now = new Date(),
): TimestampResult {
  const trimmed = input.trim();
  const digitLength = countDigits(trimmed);
  if (!trimmed) return { ok: true, status: "empty", inputLength: 0, digitLength: 0 };

  if (!NUMERIC_TIMESTAMP_REGEX.test(trimmed)) {
    return {
      ok: false,
      status: "invalid",
      inputLength: trimmed.length,
      digitLength,
      error: {
        code: "invalid-format",
        message: "Enter a numeric epoch value. A leading sign and decimal fraction are supported.",
      },
    };
  }

  const candidates = buildCandidates(trimmed, digitLength, now.getTime());
  const selectedUnit = mode === "auto" ? candidates.find((candidate) => candidate.valid)?.unit : mode;
  if (!selectedUnit) {
    return {
      ok: false,
      status: "invalid",
      inputLength: trimmed.length,
      digitLength,
      error: { code: "out-of-range", message: "No supported epoch unit produces a valid JavaScript Date." },
    };
  }

  const parsed = parseMilliseconds(trimmed, selectedUnit);
  if (!parsed) {
    return {
      ok: false,
      status: "invalid",
      inputLength: trimmed.length,
      digitLength,
      error: { code: "out-of-range", message: `That ${UNIT_LABELS[selectedUnit].toLowerCase()} value is outside the JavaScript Date range.` },
    };
  }

  const date = new Date(parsed.epochMilliseconds);
  const best = candidates.find((candidate) => candidate.unit === selectedUnit);
  const runnerUp = candidates.filter((candidate) => candidate.valid && candidate.unit !== selectedUnit)[0];
  const ambiguity = mode === "auto" && best && runnerUp && Math.abs(best.score - runnerUp.score) < 5;
  const note = mode === "auto"
    ? ambiguity
      ? `Auto selected ${UNIT_LABELS[selectedUnit].toLowerCase()}, but another interpretation is similarly plausible. Review the candidates.`
      : `Auto selected ${UNIT_LABELS[selectedUnit].toLowerCase()} using digit length and a plausible calendar range.`
    : `Manual mode: interpreting the value as ${UNIT_LABELS[selectedUnit].toLowerCase()}.`;

  return {
    ok: true,
    status: "valid",
    unit: selectedUnit,
    detectedLabel: UNIT_LABELS[selectedUnit],
    note,
    inputLength: trimmed.length,
    digitLength,
    date,
    epochMilliseconds: parsed.epochMilliseconds,
    precisionLoss: parsed.precisionLoss,
    candidates,
    formats: formatTimestampDate(date, now),
  };
}

function parseLocalDateTime(input: string, now = new Date()): DateInputResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: true, status: "empty" };
  const match = trimmed.match(LOCAL_DATE_TIME_REGEX);
  if (!match) {
    return { ok: false, status: "invalid", error: { code: "invalid-format", message: "Use YYYY-MM-DDTHH:mm, optionally with seconds and milliseconds." } };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? 0);
  const millisecond = Number((match[7] ?? "0").padEnd(3, "0"));
  const date = new Date(year, month - 1, day, hour, minute, second, millisecond);

  if (
    !Number.isFinite(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    return { ok: false, status: "invalid", error: { code: "invalid-date", message: "That browser-local date and time is not valid." } };
  }

  return {
    ok: true,
    status: "valid",
    source: "local",
    sourceLabel: "Browser local time",
    date,
    epochMilliseconds: date.getTime(),
    formats: formatTimestampDate(date, now),
  };
}

function parseIsoDateTime(input: string, now = new Date()): DateInputResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: true, status: "empty" };
  if (!ISO_WITH_ZONE_REGEX.test(trimmed)) {
    return { ok: false, status: "invalid", error: { code: "invalid-format", message: "Use ISO 8601 with Z or an explicit offset, for example 2030-01-01T00:00:00Z." } };
  }
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms) || !isDateInRange(ms)) {
    return { ok: false, status: "invalid", error: { code: "invalid-date", message: "That ISO value could not be parsed as a valid instant." } };
  }
  const date = new Date(ms);
  return {
    ok: true,
    status: "valid",
    source: "iso",
    sourceLabel: "ISO 8601 with timezone",
    date,
    epochMilliseconds: ms,
    formats: formatTimestampDate(date, now),
  };
}

export function convertDateInput(input: string, mode: DateInputMode, now = new Date()): DateInputResult {
  return mode === "iso" ? parseIsoDateTime(input, now) : parseLocalDateTime(input, now);
}

export function convertDateInputs(localDateTime: string, isoDateTime: string): DateInputResult {
  return isoDateTime.trim() ? parseIsoDateTime(isoDateTime) : parseLocalDateTime(localDateTime);
}

export function toDateTimeLocalValue(date: Date): string {
  return [
    date.getFullYear(), "-", pad(date.getMonth() + 1), "-", pad(date.getDate()),
    "T", pad(date.getHours()), ":", pad(date.getMinutes()), ":", pad(date.getSeconds()),
  ].join("");
}

export function getBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Browser local time";
}

function zoneParts(date: Date, zone: string): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

function zoneOffset(date: Date, zone: string): string {
  const parts = zoneParts(date, zone);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const rounded = Math.floor(date.getTime() / 1000) * 1000;
  const offsetMinutes = Math.round((asUtc - rounded) / 60_000);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  return `UTC${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}

export function formatInTimeZone(date: Date, option: TimeZoneOption): TimeZoneRow {
  try {
    const parts = zoneParts(date, option.zone);
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: option.zone,
      dateStyle: "medium",
      timeStyle: "medium",
      hour12: false,
    }).format(date);
    return {
      ...option,
      formatted,
      date: `${parts.year}-${parts.month}-${parts.day}`,
      time: `${parts.hour}:${parts.minute}:${parts.second}`,
      offset: zoneOffset(date, option.zone),
      valid: true,
    };
  } catch (error) {
    return {
      ...option,
      formatted: "Unavailable",
      date: "—",
      time: "—",
      offset: "—",
      valid: false,
      error: error instanceof Error ? error.message : "Invalid time zone",
    };
  }
}

export function buildTimeZoneRows(date: Date, options: TimeZoneOption[]): TimeZoneRow[] {
  return options.map((option) => formatInTimeZone(date, option));
}

function parseBatchUnit(token: string | undefined): TimestampUnitMode | null {
  if (!token) return null;
  const normalized = token.toLowerCase();
  if (normalized === "auto") return "auto";
  return UNIT_ALIASES[normalized] ?? null;
}

export function parseBatchTimestamps(input: string, defaultMode: TimestampUnitMode, now = new Date()): BatchTimestampRow[] {
  return input
    .split(/\r?\n/)
    .map((raw, index) => ({ raw, line: index + 1 }))
    .filter((entry) => entry.raw.trim().length > 0)
    .map(({ raw, line }) => {
      const trimmed = raw.trim();
      const match = trimmed.match(/^([^\s,]+)(?:[\s,]+([^\s,]+))?$/);
      if (!match) {
        return { line, raw, value: trimmed, requestedUnit: defaultMode, ok: false, error: "Use: value or value unit." };
      }
      const value = match[1];
      const explicitUnit = parseBatchUnit(match[2]);
      if (match[2] && !explicitUnit) {
        return { line, raw, value, requestedUnit: defaultMode, ok: false, error: `Unknown unit: ${match[2]}.` };
      }
      const requestedUnit = explicitUnit ?? defaultMode;
      const result = convertTimestampInput(value, requestedUnit, now);
      if (!result.ok || result.status !== "valid") {
        return {
          line,
          raw,
          value,
          requestedUnit,
          ok: false,
          error: "error" in result ? result.error.message : "Empty timestamp.",
        };
      }
      return {
        line,
        raw,
        value,
        requestedUnit,
        ok: true,
        detectedUnit: result.unit,
        iso: result.formats.iso,
        local: result.formats.local,
        unixSeconds: result.formats.unixSeconds,
        precisionLoss: result.precisionLoss,
      };
    });
}

export function buildTimestampChecks(params: {
  inputMode: TimestampInputMode;
  timestampResult?: TimestampResult;
  dateResult?: DateInputResult;
  batchRows: BatchTimestampRow[];
  zoneRows: TimeZoneRow[];
}): TimestampCheck[] {
  const { inputMode, timestampResult, dateResult, batchRows, zoneRows } = params;
  const checks: TimestampCheck[] = [];
  const activeDate = inputMode === "epoch"
    ? timestampResult?.ok && timestampResult.status === "valid" ? timestampResult.date : null
    : inputMode === "date"
      ? dateResult?.ok && dateResult.status === "valid" ? dateResult.date : null
      : null;

  if (inputMode === "epoch" && timestampResult && "error" in timestampResult) {
    checks.push({ id: "invalid-epoch", level: "danger", title: "Invalid epoch value", message: timestampResult.error.message });
  }
  if (inputMode === "date" && dateResult && "error" in dateResult) {
    checks.push({ id: "invalid-date", level: "danger", title: "Invalid date input", message: dateResult.error.message });
  }
  if (timestampResult?.ok && timestampResult.status === "valid") {
    const validCandidates = timestampResult.candidates.filter((candidate) => candidate.valid);
    if (validCandidates.length > 1 && Math.abs(validCandidates[0].score - validCandidates[1].score) < 5) {
      checks.push({ id: "ambiguous-unit", level: "warning", title: "Unit interpretation is ambiguous", message: "Two epoch units produce similarly plausible dates. Confirm the source system unit before shipping the value." });
    }
    if (timestampResult.precisionLoss) {
      checks.push({ id: "precision-loss", level: "warning", title: "Sub-millisecond precision is truncated", message: "JavaScript Date stores milliseconds, so finer microsecond or nanosecond data is not preserved in the date preview." });
    }
  }
  if (activeDate) {
    const year = activeDate.getUTCFullYear();
    if (year < 1970) checks.push({ id: "pre-epoch", level: "info", title: "Pre-epoch instant", message: "Negative Unix timestamps are valid, but some older systems and databases do not support dates before 1970." });
    if (year > 2100) checks.push({ id: "far-future", level: "warning", title: "Far-future timestamp", message: "Confirm the source unit. A seconds/milliseconds mismatch commonly creates dates centuries away." });
  }
  const invalidBatch = batchRows.filter((row) => !row.ok).length;
  if (invalidBatch) checks.push({ id: "batch-errors", level: "warning", title: `${invalidBatch} batch row${invalidBatch === 1 ? "" : "s"} need review`, message: "Invalid rows remain visible and are excluded from successful export fields." });
  if (batchRows.length > 500) checks.push({ id: "large-batch", level: "warning", title: "Large browser batch", message: "For production pipelines, process very large timestamp datasets server-side or stream them in chunks." });
  if (zoneRows.some((row) => !row.valid)) checks.push({ id: "zone-error", level: "warning", title: "Unavailable time zone", message: "One or more IANA zones are not supported by this browser runtime." });
  if (!checks.some((check) => check.level === "danger" || check.level === "warning")) {
    checks.push({ id: "ready", level: "success", title: "Conversion checks passed", message: "The active value is valid and no high-risk unit, range, or batch issue was detected." });
  }
  checks.push({ id: "timezone-model", level: "info", title: "Epoch values represent instants", message: "Time zones only change display. Local date inputs, unlike ISO values with offsets, depend on the browser time zone." });
  return checks;
}

function csvCell(value: string | number | boolean | undefined): string {
  const text = value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildBatchCsv(rows: BatchTimestampRow[]): string {
  const header = ["line", "input", "requested_unit", "valid", "detected_unit", "iso", "local", "unix_seconds", "precision_loss", "error"];
  return [header.join(","), ...rows.map((row) => [
    row.line, row.value, row.requestedUnit, row.ok, row.detectedUnit, row.iso, row.local, row.unixSeconds, row.precisionLoss, row.error,
  ].map(csvCell).join(","))].join("\n");
}

export function buildTimestampReport(params: {
  inputMode: TimestampInputMode;
  sourceValue: string;
  requestedUnit?: TimestampUnitMode;
  dateMode?: DateInputMode;
  result?: TimestampResult | DateInputResult;
  zoneRows: TimeZoneRow[];
  batchRows: BatchTimestampRow[];
  checks: TimestampCheck[];
}): TimestampAuditReport {
  const { inputMode, sourceValue, requestedUnit, dateMode, result, zoneRows, batchRows, checks } = params;
  const valid = inputMode === "batch"
    ? batchRows.length > 0 && batchRows.every((row) => row.ok)
    : Boolean(result?.ok && result.status === "valid");
  const formats = valid && result && "formats" in result ? result.formats : undefined;
  return {
    generatedAt: new Date().toISOString(),
    inputMode,
    source: { value: sourceValue, requestedUnit, dateMode },
    result: {
      valid,
      detectedUnit: valid && result && "unit" in result ? result.unit : undefined,
      iso: formats?.iso,
      unixSeconds: formats?.unixSeconds,
      unixMilliseconds: formats?.unixMilliseconds,
      unixMicroseconds: formats?.unixMicroseconds,
      unixNanoseconds: formats?.unixNanoseconds,
      relative: formats?.relative,
      precisionLoss: valid && result && "precisionLoss" in result ? result.precisionLoss : undefined,
    },
    zones: zoneRows,
    batch: batchRows,
    checks,
  };
}

export function buildMarkdownReport(report: TimestampAuditReport): string {
  const result = report.result;
  const lines = [
    "# Timestamp conversion report",
    "",
    `Generated: ${report.generatedAt}`,
    `Input mode: ${report.inputMode}`,
    `Source: \`${report.source.value || "(empty)"}\``,
    "",
    "## Result",
    "",
    `- Valid: ${result.valid ? "Yes" : "No"}`,
    `- Detected unit: ${result.detectedUnit ?? "—"}`,
    `- ISO: ${result.iso ?? "—"}`,
    `- Unix seconds: ${result.unixSeconds ?? "—"}`,
    `- Unix milliseconds: ${result.unixMilliseconds ?? "—"}`,
    `- Relative: ${result.relative ?? "—"}`,
    "",
    "## Production checks",
    "",
    ...report.checks.map((check) => `- **${check.level.toUpperCase()} — ${check.title}:** ${check.message}`),
  ];
  if (report.zones.length) {
    lines.push("", "## Time zones", "", ...report.zones.map((zone) => `- ${zone.label}: ${zone.formatted} (${zone.offset})`));
  }
  if (report.batch.length) {
    lines.push("", "## Batch", "", `- Rows: ${report.batch.length}`, `- Valid: ${report.batch.filter((row) => row.ok).length}`, `- Invalid: ${report.batch.filter((row) => !row.ok).length}`);
  }
  return `${lines.join("\n")}\n`;
}

export function buildJavaScriptStarter(unit: TimestampUnitMode): string {
  return `// Timestamp conversion starter — string-safe for large microsecond/nanosecond values
const DEFAULT_UNIT = ${JSON.stringify(unit)};

function shiftDecimal(input, places) {
  const value = String(input).trim();
  if (!/^[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)$/.test(value)) {
    throw new TypeError("Timestamp must be numeric");
  }
  const negative = value.startsWith("-");
  const unsigned = value.replace(/^[+-]/, "");
  const [rawInteger = "0", fraction = ""] = unsigned.split(".");
  const integer = (rawInteger || "0").replace(/^0+(?=\\d)/, "") || "0";
  const digits = integer + fraction;
  const point = integer.length + places;
  let shifted;
  if (point <= 0) shifted = "0." + "0".repeat(-point) + digits;
  else if (point >= digits.length) shifted = digits + "0".repeat(point - digits.length);
  else shifted = digits.slice(0, point) + "." + digits.slice(point);
  const [whole = "0", decimal = ""] = shifted.split(".");
  const normalized = (whole.replace(/^0+(?=\\d)/, "") || "0") + (decimal.replace(/0+$/, "") ? "." + decimal.replace(/0+$/, "") : "");
  return negative && normalized !== "0" ? "-" + normalized : normalized;
}

function detectUnit(value) {
  const digits = String(value).replace(/^[+-]/, "").replace(/\\..*$/, "").replace(/^0+(?=\\d)/, "").length;
  if (digits <= 10) return "seconds";
  if (digits <= 13) return "milliseconds";
  if (digits <= 16) return "microseconds";
  return "nanoseconds";
}

function toMilliseconds(value, unit = DEFAULT_UNIT) {
  const resolved = unit === "auto" ? detectUnit(value) : unit;
  const places = resolved === "seconds" ? 3 : resolved === "milliseconds" ? 0 : resolved === "microseconds" ? -3 : -6;
  const milliseconds = Number(shiftDecimal(value, places));
  if (!Number.isFinite(milliseconds)) throw new RangeError("Timestamp is outside the Date range");
  return Math.trunc(milliseconds);
}

export function timestampToIso(value, unit) {
  const date = new Date(toMilliseconds(value, unit));
  if (Number.isNaN(date.getTime())) throw new RangeError("Timestamp is outside the Date range");
  return date.toISOString();
}

export function dateToUnixSeconds(value) {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) throw new TypeError("Date must be valid ISO 8601");
  return Math.floor(ms / 1_000);
}
`;
}
