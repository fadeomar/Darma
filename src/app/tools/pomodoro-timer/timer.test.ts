import { describe, expect, it } from "vitest";
import {
  buildJavaScriptTimerStarter,
  buildPomodoroChecks,
  buildPomodoroMarkdown,
  buildPomodoroReport,
  calculateProgress,
  calculateRemainingSeconds,
  clampConfig,
  formatTime,
  historyToCsv,
  nextPomodoroPhase,
  phaseSeconds,
  shouldAutoStart,
  summarizeHistory,
} from "./timer";
import type { PomodoroConfig, PomodoroSessionEntry } from "./types";

const config: PomodoroConfig = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  soundEnabled: true,
  volume: 0.5,
  notificationsEnabled: false,
};

describe("pomodoro timer logic", () => {
  it("formats short and long durations", () => {
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(3661)).toBe("1:01:01");
    expect(formatTime(-5)).toBe("00:00");
  });

  it("uses absolute deadlines to avoid interval drift", () => {
    expect(calculateRemainingSeconds(10_500, 10_000)).toBe(1);
    expect(calculateRemainingSeconds(9_000, 10_000)).toBe(0);
  });

  it("calculates bounded progress", () => {
    expect(calculateProgress(100, 75)).toBe(25);
    expect(calculateProgress(100, -5)).toBe(100);
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it("advances to short and long breaks", () => {
    expect(nextPomodoroPhase({ phase: "focus", completedFocus: 0, sessionsBeforeLongBreak: 4 })).toEqual({ phase: "shortBreak", completedFocus: 1 });
    expect(nextPomodoroPhase({ phase: "focus", completedFocus: 3, sessionsBeforeLongBreak: 4 })).toEqual({ phase: "longBreak", completedFocus: 4 });
    expect(nextPomodoroPhase({ phase: "shortBreak", completedFocus: 2, sessionsBeforeLongBreak: 4 })).toEqual({ phase: "focus", completedFocus: 2 });
  });

  it("clamps unsafe configuration values", () => {
    const safe = clampConfig({ ...config, focusMinutes: 0, volume: 8, sessionsBeforeLongBreak: 99 });
    expect(safe.focusMinutes).toBe(1);
    expect(safe.volume).toBe(1);
    expect(safe.sessionsBeforeLongBreak).toBe(12);
  });

  it("returns the duration for each phase", () => {
    expect(phaseSeconds(config, "focus")).toBe(1500);
    expect(phaseSeconds(config, "shortBreak")).toBe(300);
    expect(phaseSeconds(config, "longBreak")).toBe(900);
  });

  it("respects separate auto-start controls", () => {
    expect(shouldAutoStart("shortBreak", config)).toBe(true);
    expect(shouldAutoStart("focus", config)).toBe(false);
  });

  it("summarizes only entries completed today", () => {
    const entries: PomodoroSessionEntry[] = [
      { id: "1", phase: "focus", task: "Write", startedAt: "2026-07-13T09:00:00.000Z", endedAt: "2026-07-13T09:25:00.000Z", plannedSeconds: 1500, elapsedSeconds: 1500, status: "completed" },
      { id: "2", phase: "shortBreak", task: "Write", startedAt: "2026-07-13T09:25:00.000Z", endedAt: "2026-07-13T09:30:00.000Z", plannedSeconds: 300, elapsedSeconds: 300, status: "completed" },
      { id: "3", phase: "focus", task: "Write", startedAt: "2026-07-12T09:00:00.000Z", endedAt: "2026-07-12T09:25:00.000Z", plannedSeconds: 1500, elapsedSeconds: 1500, status: "completed" },
    ];
    const stats = summarizeHistory(entries, new Date("2026-07-13T12:00:00.000Z"));
    expect(stats.completedFocusSessions).toBe(1);
    expect(stats.completedBreaks).toBe(1);
    expect(stats.focusSeconds).toBe(1500);
  });


  it("counts skipped entries without adding focus time", () => {
    const entries: PomodoroSessionEntry[] = [
      { id: "skip", phase: "focus", task: "Write", startedAt: "2026-07-13T09:00:00.000Z", endedAt: "2026-07-13T09:05:00.000Z", plannedSeconds: 1500, elapsedSeconds: 300, status: "skipped" },
    ];
    const stats = summarizeHistory(entries, new Date("2026-07-13T12:00:00.000Z"));
    expect(stats.skippedSessions).toBe(1);
    expect(stats.completedFocusSessions).toBe(0);
    expect(stats.focusSeconds).toBe(0);
  });

  it("warns about long blocks and notification permission", () => {
    const checks = buildPomodoroChecks({
      config: { ...config, focusMinutes: 120, notificationsEnabled: true },
      task: "Deep work",
      targetSessions: 3,
      notificationSupported: true,
      notificationPermission: "default",
    });
    expect(checks.some((check) => check.id === "long-focus")).toBe(true);
    expect(checks.some((check) => check.id === "notification-permission")).toBe(true);
  });

  it("builds a readable Markdown summary", () => {
    const checks = buildPomodoroChecks({ config, task: "Write", targetSessions: 4, notificationSupported: true, notificationPermission: "granted" });
    const report = buildPomodoroReport({ task: "Write", targetSessions: 4, phase: "focus", status: "idle", remainingSeconds: 1500, config, history: [], checks, now: new Date("2026-07-13T12:00:00.000Z") });
    const markdown = buildPomodoroMarkdown(report);
    expect(markdown).toContain("# Pomodoro focus report");
    expect(markdown).toContain("Task: Write");
  });

  it("builds checks for silent alerts and missing task", () => {
    const checks = buildPomodoroChecks({
      config: { ...config, soundEnabled: false, notificationsEnabled: false },
      task: "",
      targetSessions: 4,
      notificationSupported: true,
      notificationPermission: "default",
    });
    expect(checks.some((check) => check.id === "task")).toBe(true);
    expect(checks.some((check) => check.id === "silent")).toBe(true);
  });

  it("exports quoted CSV values", () => {
    const csv = historyToCsv([{ id: "1", phase: "focus", task: "Write, test", startedAt: "2026-07-13T09:00:00.000Z", endedAt: "2026-07-13T09:25:00.000Z", plannedSeconds: 1500, elapsedSeconds: 1500, status: "completed" }]);
    expect(csv).toContain('"Write, test"');
  });

  it("builds an audit report and drift-resistant JavaScript starter", () => {
    const checks = buildPomodoroChecks({ config, task: "Write", targetSessions: 4, notificationSupported: true, notificationPermission: "granted" });
    const report = buildPomodoroReport({ task: "Write", targetSessions: 4, phase: "focus", status: "paused", remainingSeconds: 1200, config, history: [], checks, now: new Date("2026-07-13T12:00:00.000Z") });
    const starter = buildJavaScriptTimerStarter(config);
    expect(report.generatedAt).toBe("2026-07-13T12:00:00.000Z");
    expect(starter).toContain("const endAt = Date.now()");
    expect(() => new Function(starter)).not.toThrow();
  });
});
