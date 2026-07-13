import type {
  PomodoroAuditReport,
  PomodoroCheck,
  PomodoroConfig,
  PomodoroSessionEntry,
  PomodoroStats,
  TimerPhase,
  TimerStatus,
} from "./types";

export const PHASE_LABEL: Record<TimerPhase, string> = {
  focus: "Focus",
  shortBreak: "Short break",
  longBreak: "Long break",
};

export const PHASE_SHORT_LABEL: Record<TimerPhase, string> = {
  focus: "Focus",
  shortBreak: "Short",
  longBreak: "Long",
};

export const DEFAULT_CONFIG: PomodoroConfig = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  volume: 0.55,
  notificationsEnabled: false,
};

export function clampConfig(config: PomodoroConfig): PomodoroConfig {
  return {
    focusMinutes: clampFinite(config.focusMinutes, 1, 180, DEFAULT_CONFIG.focusMinutes),
    shortBreakMinutes: clampFinite(config.shortBreakMinutes, 1, 60, DEFAULT_CONFIG.shortBreakMinutes),
    longBreakMinutes: clampFinite(config.longBreakMinutes, 1, 120, DEFAULT_CONFIG.longBreakMinutes),
    sessionsBeforeLongBreak: Math.round(clampFinite(config.sessionsBeforeLongBreak, 1, 12, DEFAULT_CONFIG.sessionsBeforeLongBreak)),
    autoStartBreaks: Boolean(config.autoStartBreaks),
    autoStartFocus: Boolean(config.autoStartFocus),
    soundEnabled: Boolean(config.soundEnabled),
    volume: clampFinite(config.volume, 0, 1, DEFAULT_CONFIG.volume),
    notificationsEnabled: Boolean(config.notificationsEnabled),
  };
}

function clampFinite(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function phaseSeconds(config: PomodoroConfig, phase: TimerPhase): number {
  const safe = clampConfig(config);
  const minutes = phase === "focus"
    ? safe.focusMinutes
    : phase === "shortBreak"
      ? safe.shortBreakMinutes
      : safe.longBreakMinutes;
  return Math.round(minutes * 60);
}

export function formatTime(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function calculateRemainingSeconds(endAtMs: number, nowMs: number): number {
  if (!Number.isFinite(endAtMs) || !Number.isFinite(nowMs)) return 0;
  return Math.max(0, Math.ceil((endAtMs - nowMs) / 1000));
}

export function calculateProgress(totalSeconds: number, remainingSeconds: number): number {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return 0;
  return Math.min(100, Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100));
}

export function nextPomodoroPhase({
  phase,
  completedFocus,
  sessionsBeforeLongBreak,
}: {
  phase: TimerPhase;
  completedFocus: number;
  sessionsBeforeLongBreak: number;
}): { phase: TimerPhase; completedFocus: number } {
  const interval = Math.max(1, Math.round(sessionsBeforeLongBreak));
  if (phase === "focus") {
    const nextCount = Math.max(0, completedFocus) + 1;
    return {
      phase: nextCount % interval === 0 ? "longBreak" : "shortBreak",
      completedFocus: nextCount,
    };
  }
  return { phase: "focus", completedFocus: Math.max(0, completedFocus) };
}

export function shouldAutoStart(nextPhase: TimerPhase, config: PomodoroConfig): boolean {
  return nextPhase === "focus" ? config.autoStartFocus : config.autoStartBreaks;
}

export function localDateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function summarizeHistory(entries: PomodoroSessionEntry[], now = new Date()): PomodoroStats {
  const today = localDateKey(now);
  return entries.reduce<PomodoroStats>((stats, entry) => {
    const ended = new Date(entry.endedAt);
    if (Number.isNaN(ended.getTime()) || localDateKey(ended) !== today) return stats;
    stats.totalEntries += 1;
    if (entry.status === "skipped") {
      stats.skippedSessions += 1;
      return stats;
    }
    if (entry.phase === "focus") {
      stats.completedFocusSessions += 1;
      stats.focusSeconds += Math.max(0, entry.elapsedSeconds);
    } else {
      stats.completedBreaks += 1;
      stats.breakSeconds += Math.max(0, entry.elapsedSeconds);
    }
    return stats;
  }, {
    completedFocusSessions: 0,
    completedBreaks: 0,
    skippedSessions: 0,
    focusSeconds: 0,
    breakSeconds: 0,
    totalEntries: 0,
  });
}

export function buildPomodoroChecks({
  config,
  task,
  targetSessions,
  notificationSupported,
  notificationPermission,
}: {
  config: PomodoroConfig;
  task: string;
  targetSessions: number;
  notificationSupported: boolean;
  notificationPermission: NotificationPermission | "unsupported";
}): PomodoroCheck[] {
  const safe = clampConfig(config);
  const checks: PomodoroCheck[] = [
    {
      id: "durations",
      level: "success",
      title: "Timer durations are valid",
      message: `Focus ${safe.focusMinutes}m, short break ${safe.shortBreakMinutes}m, long break ${safe.longBreakMinutes}m.`,
    },
  ];

  if (!task.trim()) {
    checks.push({ id: "task", level: "info", title: "Add a focus task", message: "Naming the current task makes the session history and exports easier to review." });
  }
  if (safe.focusMinutes > 90) {
    checks.push({ id: "long-focus", level: "warning", title: "Very long focus block", message: "Focus blocks longer than 90 minutes can increase fatigue; consider a deliberate checkpoint." });
  }
  if (safe.shortBreakMinutes >= safe.focusMinutes) {
    checks.push({ id: "break-ratio", level: "warning", title: "Short break is as long as focus", message: "Check that the short-break duration was not entered in the wrong field." });
  }
  if (targetSessions > 12) {
    checks.push({ id: "large-target", level: "warning", title: "Large daily target", message: "More than 12 focus sessions may be difficult to complete sustainably in one day." });
  }
  if (safe.autoStartBreaks && safe.autoStartFocus) {
    checks.push({ id: "continuous-cycle", level: "info", title: "Continuous cycle enabled", message: "Focus and break phases will start automatically until you pause or reset the timer." });
  }
  if (safe.notificationsEnabled && !notificationSupported) {
    checks.push({ id: "notification-support", level: "warning", title: "Notifications unavailable", message: "This browser does not expose the Notification API; sound and tab-title updates still work." });
  } else if (safe.notificationsEnabled && notificationPermission !== "granted") {
    checks.push({ id: "notification-permission", level: "warning", title: "Notification permission required", message: "Grant browser permission before relying on desktop completion alerts." });
  }
  if (!safe.soundEnabled && !safe.notificationsEnabled) {
    checks.push({ id: "silent", level: "info", title: "Completion alerts are silent", message: "Keep the tab visible because both sound and desktop notifications are disabled." });
  }
  if (checks.every((check) => check.level !== "warning" && check.level !== "danger")) {
    checks.push({ id: "ready", level: "success", title: "Focus cycle is ready", message: "The current configuration is suitable for a browser-local focus session." });
  }
  return checks;
}

export function historyToCsv(entries: PomodoroSessionEntry[]): string {
  const rows = [
    ["ended_at", "phase", "task", "status", "planned_seconds", "elapsed_seconds", "completion_percent"],
    ...entries.map((entry) => [
      entry.endedAt,
      entry.phase,
      entry.task,
      entry.status,
      String(entry.plannedSeconds),
      String(entry.elapsedSeconds),
      entry.plannedSeconds > 0 ? String(Math.round((entry.elapsedSeconds / entry.plannedSeconds) * 100)) : "0",
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function buildPomodoroMarkdown(report: PomodoroAuditReport): string {
  const lines = [
    "# Pomodoro focus report",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Task: ${report.task || "Not set"}`,
    `- Current phase: ${PHASE_LABEL[report.phase]}`,
    `- Timer status: ${report.status}`,
    `- Remaining: ${formatTime(report.remainingSeconds)}`,
    `- Daily target: ${report.targetSessions} focus sessions`,
    "",
    "## Today's progress",
    "",
    `- Completed focus sessions: ${report.today.completedFocusSessions}`,
    `- Focus time: ${formatTime(report.today.focusSeconds)}`,
    `- Completed breaks: ${report.today.completedBreaks}`,
    `- Skipped phases: ${report.today.skippedSessions}`,
    "",
    "## Configuration",
    "",
    `- Focus / short / long: ${report.config.focusMinutes} / ${report.config.shortBreakMinutes} / ${report.config.longBreakMinutes} minutes`,
    `- Long break every: ${report.config.sessionsBeforeLongBreak} focus sessions`,
    `- Auto-start breaks: ${report.config.autoStartBreaks ? "Yes" : "No"}`,
    `- Auto-start focus: ${report.config.autoStartFocus ? "Yes" : "No"}`,
    "",
    "## Production checks",
    "",
    ...report.checks.map((check) => `- **${check.level.toUpperCase()} — ${check.title}:** ${check.message}`),
    "",
    "> Timer statistics are stored locally in this browser and are not productivity or health guarantees.",
  ];
  return `${lines.join("\n")}\n`;
}

export function buildPomodoroReport({
  task,
  targetSessions,
  phase,
  status,
  remainingSeconds,
  config,
  history,
  checks,
  now = new Date(),
}: {
  task: string;
  targetSessions: number;
  phase: TimerPhase;
  status: TimerStatus;
  remainingSeconds: number;
  config: PomodoroConfig;
  history: PomodoroSessionEntry[];
  checks: PomodoroCheck[];
  now?: Date;
}): PomodoroAuditReport {
  return {
    generatedAt: now.toISOString(),
    task: task.trim(),
    targetSessions,
    phase,
    status,
    remainingSeconds,
    config: clampConfig(config),
    today: summarizeHistory(history, now),
    history,
    checks,
  };
}

export function buildJavaScriptTimerStarter(config: PomodoroConfig): string {
  const safe = clampConfig(config);
  return `const pomodoro = ${JSON.stringify({
    focusSeconds: safe.focusMinutes * 60,
    shortBreakSeconds: safe.shortBreakMinutes * 60,
    longBreakSeconds: safe.longBreakMinutes * 60,
    sessionsBeforeLongBreak: safe.sessionsBeforeLongBreak,
  }, null, 2)};

// Drift-resistant countdown: derive remaining time from an absolute deadline.
function startCountdown(totalSeconds, onTick, onComplete) {
  const endAt = Date.now() + totalSeconds * 1000;
  onTick(totalSeconds);

  const interval = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    onTick(remaining);
    if (remaining === 0) {
      clearInterval(interval);
      onComplete();
    }
  }, 250);

  return () => clearInterval(interval);
}

startCountdown(pomodoro.focusSeconds, console.log, () => console.log("Focus complete"));
`;
}
