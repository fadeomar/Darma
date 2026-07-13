export type TimerPhase = "focus" | "shortBreak" | "longBreak";
export type TimerStatus = "idle" | "running" | "paused";
export type TimerTab = "overview" | "history" | "settings" | "exports";
export type SessionStatus = "completed" | "skipped";
export type PomodoroCheckLevel = "success" | "info" | "warning" | "danger";

export type PomodoroConfig = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  volume: number;
  notificationsEnabled: boolean;
};

export type PomodoroPreset = {
  id: string;
  name: string;
  description: string;
  task: string;
  targetSessions: number;
  config: PomodoroConfig;
};

export type PomodoroSessionEntry = {
  id: string;
  phase: TimerPhase;
  task: string;
  startedAt: string;
  endedAt: string;
  plannedSeconds: number;
  elapsedSeconds: number;
  status: SessionStatus;
};

export type PomodoroStats = {
  completedFocusSessions: number;
  completedBreaks: number;
  skippedSessions: number;
  focusSeconds: number;
  breakSeconds: number;
  totalEntries: number;
};

export type PomodoroCheck = {
  id: string;
  level: PomodoroCheckLevel;
  title: string;
  message: string;
};

export type PomodoroAuditReport = {
  generatedAt: string;
  task: string;
  targetSessions: number;
  phase: TimerPhase;
  status: TimerStatus;
  remainingSeconds: number;
  config: PomodoroConfig;
  today: PomodoroStats;
  history: PomodoroSessionEntry[];
  checks: PomodoroCheck[];
};
