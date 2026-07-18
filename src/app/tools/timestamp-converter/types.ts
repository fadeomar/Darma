export type EpochUnit = "seconds" | "milliseconds" | "microseconds" | "nanoseconds";
export type TimestampUnitMode = "auto" | EpochUnit;
export type TimestampInputMode = "epoch" | "date" | "batch";
export type DateInputMode = "local" | "iso";
export type TimestampTab = "overview" | "zones" | "batch" | "exports";
export type TimestampCheckLevel = "success" | "info" | "warning" | "danger";

export type TimestampFormats = {
  local: string;
  utc: string;
  iso: string;
  rfc2822: string;
  unixSeconds: string;
  unixMilliseconds: string;
  unixMicroseconds: string;
  unixNanoseconds: string;
  timezoneOffset: string;
  relative: string;
};

export type UnitCandidate = {
  unit: EpochUnit;
  label: string;
  valid: boolean;
  score: number;
  iso: string | null;
  note: string;
};

export type TimestampErrorCode =
  | "invalid-format"
  | "out-of-range"
  | "invalid-date"
  | "invalid-timezone";

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
      unit: EpochUnit;
      detectedLabel: string;
      note: string;
      inputLength: number;
      digitLength: number;
      date: Date;
      epochMilliseconds: number;
      precisionLoss: boolean;
      candidates: UnitCandidate[];
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
  | { ok: true; status: "empty" }
  | {
      ok: true;
      status: "valid";
      source: DateInputSource;
      sourceLabel: string;
      date: Date;
      epochMilliseconds: number;
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

export type TimeZoneOption = {
  id: string;
  label: string;
  zone: string;
};

export type TimeZoneRow = {
  id: string;
  label: string;
  zone: string;
  formatted: string;
  date: string;
  time: string;
  offset: string;
  valid: boolean;
  error?: string;
};

export type BatchTimestampRow = {
  line: number;
  raw: string;
  value: string;
  requestedUnit: TimestampUnitMode;
  ok: boolean;
  detectedUnit?: EpochUnit;
  iso?: string;
  local?: string;
  unixSeconds?: string;
  error?: string;
  precisionLoss?: boolean;
};

export type TimestampCheck = {
  id: string;
  level: TimestampCheckLevel;
  title: string;
  message: string;
};

export type TimestampPreset = {
  id: string;
  label: string;
  description: string;
  icon: string;
  inputMode: TimestampInputMode;
  timestamp?: string;
  unitMode?: TimestampUnitMode;
  dateMode?: DateInputMode;
  dateInput?: string;
  batchInput?: string;
};

export type TimestampAuditReport = {
  generatedAt: string;
  inputMode: TimestampInputMode;
  source: {
    value: string;
    requestedUnit?: TimestampUnitMode;
    dateMode?: DateInputMode;
  };
  result: {
    valid: boolean;
    detectedUnit?: EpochUnit;
    iso?: string;
    unixSeconds?: string;
    unixMilliseconds?: string;
    unixMicroseconds?: string;
    unixNanoseconds?: string;
    relative?: string;
    precisionLoss?: boolean;
  };
  zones: TimeZoneRow[];
  batch: BatchTimestampRow[];
  checks: TimestampCheck[];
};
