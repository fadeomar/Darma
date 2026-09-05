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
    {
      id: "project-deadline",
      name: "Project deadline",
      description: "Count the remaining calendar and working days over a six-week delivery window.",
      mode: "calendar",
      fromDate: today,
      toDate: localDateValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 42)),
      inclusive: true,
      weekendPreset: "sat-sun",
    },
    {
      id: "trial-period",
      name: "30-day trial",
      description: "Check the exact inclusive length of a 30-day product trial.",
      mode: "calendar",
      fromDate: today,
      toDate: localDateValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 29)),
      inclusive: true,
      weekendPreset: "sat-sun",
    },
    {
      id: "invoice-due",
      name: "Invoice due date",
      description: "Measure a standard 14-day payment window and its working-day impact.",
      mode: "calendar",
      fromDate: today,
      toDate: localDateValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14)),
      inclusive: false,
      weekendPreset: "sat-sun",
    },
    {
      id: "probation-period",
      name: "Probation period",
      description: "Review a three-month employment period in calendar units and business days.",
      mode: "calendar",
      fromDate: today,
      toDate: localDateValue(nextQuarter),
      inclusive: true,
      weekendPreset: "sat-sun",
    },
    {
      id: "conference-countdown",
      name: "Conference countdown",
      description: "Track a 90-day event countdown without including the starting day.",
      mode: "calendar",
      fromDate: today,
      toDate: localDateValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 90)),
      inclusive: false,
      weekendPreset: "sat-sun",
    },
    {
      id: "release-cycle",
      name: "Six-week release cycle",
      description: "Compare calendar duration and working days for a product release cycle.",
      mode: "calendar",
      fromDate: today,
      toDate: localDateValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 41)),
      inclusive: true,
      weekendPreset: "sat-sun",
    },
    {
      id: "friday-weekend-project",
      name: "Friday–Saturday project",
      description: "Plan a six-week delivery using a Friday–Saturday weekend.",
      mode: "calendar",
      fromDate: today,
      toDate: localDateValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 42)),
      inclusive: true,
      weekendPreset: "fri-sat",
      holidays: "",
    },
    {
      id: "single-day-weekend",
      name: "Sunday-only weekend",
      description: "Count working days for schedules that only exclude Sunday.",
      mode: "calendar",
      fromDate: today,
      toDate: localDateValue(nextMonth),
      inclusive: true,
      weekendPreset: "sun-only",
    },
    {
      id: "holiday-window",
      name: "Holiday-aware window",
      description: "Start with a month-long business-day calculation ready for holiday entries.",
      mode: "calendar",
      fromDate: today,
      toDate: localDateValue(nextMonth),
      inclusive: true,
      weekendPreset: "sat-sun",
      holidays: `${localDateValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7))}
${localDateValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21))}`,
    },
    {
      id: "same-day-shift",
      name: "Same-day shift",
      description: "Measure a 09:00–17:30 workday precisely in hours and minutes.",
      mode: "datetime",
      fromDateTime: `${today}T09:00`,
      toDateTime: `${today}T17:30`,
      fromOffset: 0,
      toOffset: 0,
      inclusive: false,
      weekendPreset: "sat-sun",
    },
    {
      id: "overnight-maintenance",
      name: "Overnight maintenance",
      description: "Measure a deployment window that crosses midnight.",
      mode: "datetime",
      fromDateTime: `${today}T22:30`,
      toDateTime: `${localDateValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))}T02:15`,
      fromOffset: 0,
      toOffset: 0,
      inclusive: false,
      weekendPreset: "sat-sun",
    },
    {
      id: "global-handoff",
      name: "Global handoff",
      description: "Compare a handoff from UTC+10 to UTC−7 using explicit wall-clock offsets.",
      mode: "datetime",
      fromDateTime: `${today}T17:00`,
      toDateTime: `${today}T09:30`,
      fromOffset: 600,
      toOffset: -420,
      inclusive: false,
      weekendPreset: "sat-sun",
    },
  ];
}
