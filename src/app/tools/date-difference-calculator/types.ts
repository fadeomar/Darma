export type DateCalculationMode = "calendar" | "datetime";
export type DateTab = "overview" | "business" | "milestones" | "exports";
export type WeekendPreset = "sat-sun" | "fri-sat" | "sun-only";
export type DateCheckLevel = "success" | "info" | "warning" | "danger";

export type DateBreakdown = {
  years: number;
  months: number;
  days: number;
};

export type DateDifference = {
  breakdown: DateBreakdown;
  isNegative: boolean;
  signedDays: number;
  totalDays: number;
  inclusiveDays: number;
  totalWeeks: number;
  totalMonths: number;
  weeksRemainderDays: number;
};

export type DateTimeDifference = {
  isNegative: boolean;
  signedMilliseconds: number;
  totalMilliseconds: number;
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
  wholeDays: number;
  hoursRemainder: number;
  minutesRemainder: number;
  secondsRemainder: number;
  fromUtcIso: string;
  toUtcIso: string;
};

export type HolidayParseResult = {
  dates: string[];
  invalid: string[];
  duplicates: string[];
};

export type BusinessDayResult = {
  businessDays: number;
  weekendDays: number;
  holidayDays: number;
  calendarDays: number;
  consideredStart: string;
  consideredEnd: string;
};

export type DateMilestone = {
  id: string;
  label: string;
  date: string;
  weekday: string;
  offsetDays: number;
  progress: number;
};

export type DateCheck = {
  id: string;
  level: DateCheckLevel;
  title: string;
  message: string;
};

export type DatePreset = {
  id: string;
  name: string;
  description: string;
  mode: DateCalculationMode;
  fromDate?: string;
  toDate?: string;
  fromDateTime?: string;
  toDateTime?: string;
  fromOffset?: number;
  toOffset?: number;
  inclusive?: boolean;
  weekendPreset?: WeekendPreset;
  holidays?: string;
};

export type DateAuditReport = {
  generatedAt: string;
  mode: DateCalculationMode;
  inputs: {
    from: string;
    to: string;
    inclusive: boolean;
    fromOffsetMinutes: number;
    toOffsetMinutes: number;
    weekendPreset: WeekendPreset;
    holidays: string[];
  };
  calendarResult: DateDifference | null;
  dateTimeResult: DateTimeDifference | null;
  businessDays: BusinessDayResult | null;
  milestones: DateMilestone[];
  checks: DateCheck[];
};
