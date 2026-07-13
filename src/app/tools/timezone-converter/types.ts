export type TimezoneGroup = "Americas" | "Europe" | "Middle East / Africa" | "Asia-Pacific" | "UTC";

export type TimezoneOption = {
  zone: string;
  label: string;
  city: string;
  flag: string;
  group: TimezoneGroup;
};

export type ZoneDisplay = {
  date: string;
  dateKey: string;
  time: string;
  time24: string;
  offset: string;
  offsetMinutes: number;
  abbreviation: string;
  dayDiff: number;
};

export type ZonedDateTimeResolution =
  | { ok: true; status: "empty" }
  | {
      ok: true;
      status: "valid";
      date: Date;
      ambiguous: boolean;
      alternatives: string[];
      sourceOffset: string;
    }
  | {
      ok: false;
      status: "invalid" | "nonexistent";
      message: string;
    };

export type AvailabilityStatus = "inside" | "partial" | "outside" | "unavailable";

export type ZoneComparisonRow = {
  zone: string;
  label: string;
  city: string;
  flag: string;
  start: ZoneDisplay;
  end: ZoneDisplay;
  offsetDifferenceMinutes: number;
  offsetDifferenceLabel: string;
  availability: AvailabilityStatus;
  availabilityLabel: string;
};

export type CandidateSlot = {
  date: Date;
  iso: string;
  sourceLabel: string;
  insideCount: number;
  partialCount: number;
  outsideCount: number;
  score: number;
  distanceMinutes: number;
  rows: ZoneComparisonRow[];
};

export type BatchConversion = {
  zone: string;
  city: string;
  date: string;
  time: string;
  offset: string;
  dayDiff: number;
};

export type BatchTimezoneRow = {
  line: number;
  raw: string;
  label: string;
  dateValue: string;
  timeValue: string;
  sourceZone: string;
  ok: boolean;
  iso?: string;
  ambiguous?: boolean;
  conversions: BatchConversion[];
  error?: string;
};

export type TimezoneCheckLevel = "success" | "info" | "warning" | "danger";

export type TimezoneCheck = {
  id: string;
  level: TimezoneCheckLevel;
  title: string;
  message: string;
};

export type TimezoneTab = "comparison" | "planner" | "batch" | "exports";

export type TimezonePreset = {
  id: string;
  label: string;
  description: string;
  icon: string;
  dateValue: string;
  timeValue: string;
  sourceZone: string;
  targetZones: string[];
  durationMinutes: number;
  workingStart: string;
  workingEnd: string;
};

export type TimezoneAuditReport = {
  generatedAt: string;
  source: {
    date: string;
    time: string;
    zone: string;
    resolvedIso: string | null;
    ambiguous: boolean;
  };
  planning: {
    durationMinutes: number;
    workingStart: string;
    workingEnd: string;
    targetZones: string[];
  };
  comparison: ZoneComparisonRow[];
  candidateSlots: Array<Omit<CandidateSlot, "rows" | "date">>;
  batch: BatchTimezoneRow[];
  checks: TimezoneCheck[];
};
