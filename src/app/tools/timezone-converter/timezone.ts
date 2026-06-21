export type TimezoneGroup = "Americas" | "Europe" | "Asia-Pacific" | "Africa / Other";
export type TimezoneOption = { zone: string; label: string; city: string; flag: string; group: TimezoneGroup };
export type ZoneDisplay = { date: string; time: string; offset: string; dayDiff: number };

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { zone: "America/New_York", label: "New York", city: "New York", flag: "🇺🇸", group: "Americas" },
  { zone: "America/Chicago", label: "Chicago", city: "Chicago", flag: "🇺🇸", group: "Americas" },
  { zone: "America/Denver", label: "Denver", city: "Denver", flag: "🇺🇸", group: "Americas" },
  { zone: "America/Los_Angeles", label: "Los Angeles", city: "Los Angeles", flag: "🇺🇸", group: "Americas" },
  { zone: "America/Toronto", label: "Toronto", city: "Toronto", flag: "🇨🇦", group: "Americas" },
  { zone: "America/Sao_Paulo", label: "São Paulo", city: "São Paulo", flag: "🇧🇷", group: "Americas" },
  { zone: "America/Mexico_City", label: "Mexico City", city: "Mexico City", flag: "🇲🇽", group: "Americas" },
  { zone: "Europe/London", label: "London", city: "London", flag: "🇬🇧", group: "Europe" },
  { zone: "Europe/Paris", label: "Paris", city: "Paris", flag: "🇫🇷", group: "Europe" },
  { zone: "Europe/Berlin", label: "Berlin", city: "Berlin", flag: "🇩🇪", group: "Europe" },
  { zone: "Europe/Amsterdam", label: "Amsterdam", city: "Amsterdam", flag: "🇳🇱", group: "Europe" },
  { zone: "Europe/Rome", label: "Rome", city: "Rome", flag: "🇮🇹", group: "Europe" },
  { zone: "Europe/Moscow", label: "Moscow", city: "Moscow", flag: "🇷🇺", group: "Europe" },
  { zone: "Asia/Dubai", label: "Dubai", city: "Dubai", flag: "🇦🇪", group: "Asia-Pacific" },
  { zone: "Asia/Kolkata", label: "Mumbai", city: "Mumbai", flag: "🇮🇳", group: "Asia-Pacific" },
  { zone: "Asia/Singapore", label: "Singapore", city: "Singapore", flag: "🇸🇬", group: "Asia-Pacific" },
  { zone: "Asia/Tokyo", label: "Tokyo", city: "Tokyo", flag: "🇯🇵", group: "Asia-Pacific" },
  { zone: "Australia/Sydney", label: "Sydney", city: "Sydney", flag: "🇦🇺", group: "Asia-Pacific" },
  { zone: "Asia/Seoul", label: "Seoul", city: "Seoul", flag: "🇰🇷", group: "Asia-Pacific" },
  { zone: "Asia/Shanghai", label: "Beijing", city: "Beijing", flag: "🇨🇳", group: "Asia-Pacific" },
  { zone: "Africa/Cairo", label: "Cairo", city: "Cairo", flag: "🇪🇬", group: "Africa / Other" },
  { zone: "Africa/Lagos", label: "Lagos", city: "Lagos", flag: "🇳🇬", group: "Africa / Other" },
  { zone: "Africa/Nairobi", label: "Nairobi", city: "Nairobi", flag: "🇰🇪", group: "Africa / Other" },
  { zone: "UTC", label: "UTC", city: "UTC", flag: "🌐", group: "Africa / Other" },
];

export const DEFAULT_TARGET_ZONES = ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Tokyo"];

function dateParts(date: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
}

function dayNumber(parts: { year: number; month: number; day: number }) {
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / 86400000);
}

export function zonedDateTimeToDate(dateValue: string, timeValue: string, sourceZone: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue)) return null;
  if (!TIMEZONE_OPTIONS.some((option) => option.zone === sourceZone)) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite) || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const calendarCheck = new Date(Date.UTC(year, month - 1, day));
  if (calendarCheck.getUTCFullYear() !== year || calendarCheck.getUTCMonth() !== month - 1 || calendarCheck.getUTCDate() !== day) return null;

  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
  let timestamp = desiredUtc;
  for (let pass = 0; pass < 3; pass += 1) {
    const actual = dateParts(new Date(timestamp), sourceZone);
    const actualUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute);
    timestamp += desiredUtc - actualUtc;
  }
  const result = new Date(timestamp);
  return Number.isNaN(result.getTime()) ? null : result;
}

export function formatInZone(date: Date, ianaZone: string, sourceZone = "UTC"): ZoneDisplay | null {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  if (!TIMEZONE_OPTIONS.some((option) => option.zone === ianaZone) || !TIMEZONE_OPTIONS.some((option) => option.zone === sourceZone)) return null;
  const dateText = new Intl.DateTimeFormat("en-US", { timeZone: ianaZone, weekday: "short", month: "short", day: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: ianaZone, hour: "2-digit", minute: "2-digit", hour12: true }).format(date);
  const offsetParts = new Intl.DateTimeFormat("en-US", { timeZone: ianaZone, timeZoneName: "shortOffset" }).formatToParts(date);
  const offset = (offsetParts.find((part) => part.type === "timeZoneName")?.value ?? "UTC").replace("GMT", "UTC");
  const targetParts = dateParts(date, ianaZone);
  const sourceParts = dateParts(date, sourceZone);
  return { date: dateText, time, offset, dayDiff: dayNumber(targetParts) - dayNumber(sourceParts) };
}
