import type { DatePreset } from "./types";

function localDateValue(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDateTimeValue(date: Date): string {
  const datePart = localDateValue(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${datePart}T${hours}:${minutes}`;
}

export function buildDatePresets(now = new Date()): DatePreset[] {
  const today = localDateValue(now);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const nextQuarter = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
  const sprintStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1);
  const sprintEnd = new Date(sprintStart);
  sprintEnd.setDate(sprintStart.getDate() + 13);

  const meetingFrom = new Date(now);
  meetingFrom.setHours(9, 0, 0, 0);
  const meetingTo = new Date(now);
  meetingTo.setHours(15, 30, 0, 0);

  return [
    {
      id: "exact-age",
      name: "Exact age",
      description: "Measure a birth date up to today using calendar years, months, and days.",
      mode: "calendar",
      fromDate: "2000-01-01",
      toDate: today,
      inclusive: false,
      weekendPreset: "sat-sun",
    },
    {
      id: "two-week-sprint",
      name: "Two-week sprint",
      description: "Count calendar and business days across a standard product sprint.",
      mode: "calendar",
      fromDate: localDateValue(sprintStart),
      toDate: localDateValue(sprintEnd),
      inclusive: true,
      weekendPreset: "sat-sun",
    },
    {
      id: "notice-period",
      name: "Notice period",
      description: "Review a one-month notice window including both boundary dates.",
      mode: "calendar",
      fromDate: today,
      toDate: localDateValue(nextMonth),
      inclusive: true,
      weekendPreset: "sat-sun",
    },
    {
      id: "quarter-countdown",
      name: "Quarter countdown",
      description: "Track calendar progress and milestones over the next three months.",
      mode: "calendar",
      fromDate: today,
      toDate: localDateValue(nextQuarter),
      inclusive: false,
      weekendPreset: "sat-sun",
    },
    {
      id: "middle-east-workweek",
      name: "Friday–Saturday weekend",
      description: "Calculate working days using a Friday–Saturday weekend pattern.",
      mode: "calendar",
      fromDate: today,
      toDate: localDateValue(nextMonth),
      inclusive: true,
      weekendPreset: "fri-sat",
      holidays: "",
    },
    {
      id: "cross-zone-meeting",
      name: "Cross-zone meeting",
      description: "Compare two wall-clock times with different UTC offsets.",
      mode: "datetime",
      fromDateTime: localDateTimeValue(meetingFrom),
      toDateTime: localDateTimeValue(meetingTo),
      fromOffset: 180,
      toOffset: -240,
      inclusive: false,
      weekendPreset: "sat-sun",
    },
  ];
}
