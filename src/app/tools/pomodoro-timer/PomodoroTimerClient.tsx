"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import {
  Bell,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CirclePause,
  Clock3,
  Code2,
  Download,
  FileJson,
  FileSpreadsheet,
  Focus,
  History,
  ListChecks,
  PackageCheck,
  Pause,
  Play,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Target,
  TimerReset,
  Trash2,
  Volume2,
} from "lucide-react";
import { Button, CopyButton, Input } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import { DEFAULT_POMODORO_PRESET_ID, POMODORO_PRESETS } from "./presets";
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
  PHASE_LABEL,
  PHASE_SHORT_LABEL,
  phaseSeconds,
  shouldAutoStart,
  summarizeHistory,
} from "./timer";
import type {
  PomodoroCheckLevel,
  PomodoroConfig,
  PomodoroSessionEntry,
  TimerPhase,
  TimerStatus,
  TimerTab,
} from "./types";

const HISTORY_KEY = "darma:pomodoro:v2:history";
const SETTINGS_KEY = "darma:pomodoro:v2:settings";
const MAX_HISTORY = 200;

const CHECK_STYLES: Record<PomodoroCheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function readHistory(): PomodoroSessionEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]") as PomodoroSessionEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: PomodoroSessionEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {
    // Storage can be unavailable in strict privacy modes. The in-memory timer still works.
  }
}

function readSavedSettings(): { config: PomodoroConfig; task: string; targetSessions: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "null") as {
      config?: PomodoroConfig;
      task?: string;
      targetSessions?: number;
    } | null;
    if (!parsed?.config) return null;
    return {
      config: clampConfig(parsed.config),
      task: typeof parsed.task === "string" ? parsed.task : "",
      targetSessions: Number.isFinite(parsed.targetSessions) ? Math.min(24, Math.max(1, Math.round(parsed.targetSessions ?? 4))) : 4,
    };
  } catch {
    return null;
  }
}

function playCompletionBeep(volume: number) {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const gain = context.createGain();
    const first = context.createOscillator();
    const second = context.createOscillator();
    gain.connect(context.destination);
    first.connect(gain);
    second.connect(gain);
    first.type = "sine";
    second.type = "sine";
    first.frequency.value = 740;
    second.frequency.value = 988;
    const safeVolume = Math.min(1, Math.max(0, volume));
    if (safeVolume <= 0) {
      void context.close();
      return;
    }
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.01, safeVolume * 0.18), context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.85);
    first.start();
    first.stop(context.currentTime + 0.38);
    second.start(context.currentTime + 0.4);
    second.stop(context.currentTime + 0.82);
    second.onended = () => void context.close();
  } catch {
    // Visual feedback and the document title remain available.
  }
}

function SummaryCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</span>
        <span className="text-[var(--color-primary-text-strong)]">{icon}</span>
      </div>
      <div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]" title={value}>{value}</div>
      <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
        <span>{label}</span>
        {hint ? <span className="font-normal text-[var(--color-text-tertiary)]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label, description, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; label: string; description: string; disabled?: boolean }) {
  return (
    <label className={`flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3 ${disabled ? "opacity-55" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-xs font-bold text-[var(--color-text-primary)]">{label}</span>
        <span className="mt-0.5 block text-xs leading-4 text-[var(--color-text-tertiary)]">{description}</span>
      </span>
    </label>
  );
}

function parseMinutes(value: string, fallback: number): number {
  if (value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatClock(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
}

export default function PomodoroTimerClient() {
  const defaultPreset = POMODORO_PRESETS.find((preset) => preset.id === DEFAULT_POMODORO_PRESET_ID) ?? POMODORO_PRESETS[0];
  const [config, setConfig] = useState<PomodoroConfig>(defaultPreset.config);
  const [task, setTask] = useState(defaultPreset.task);
  const [targetSessions, setTargetSessions] = useState(defaultPreset.targetSessions);
  const [phase, setPhase] = useState<TimerPhase>("focus");
  const [durationSeconds, setDurationSeconds] = useState(() => phaseSeconds(defaultPreset.config, "focus"));
  const [secondsLeft, setSecondsLeft] = useState(() => phaseSeconds(defaultPreset.config, "focus"));
  const [running, setRunning] = useState(false);
  const [endAtMs, setEndAtMs] = useState<number | null>(null);
  const [sessionStartedAtMs, setSessionStartedAtMs] = useState<number | null>(null);
  const [completedFocus, setCompletedFocus] = useState(0);
  const [history, setHistory] = useState<PomodoroSessionEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TimerTab>("overview");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const completionLock = useRef(false);
  const originalTitleRef = useRef("");

  const notificationSupported = typeof window !== "undefined" && "Notification" in window;

  useEffect(() => {
    const storedHistory = readHistory();
    setHistory(storedHistory);
    setCompletedFocus(summarizeHistory(storedHistory).completedFocusSessions);
    const saved = readSavedSettings();
    if (saved) {
      setConfig(saved.config);
      setTask(saved.task);
      setTargetSessions(saved.targetSessions);
      const focusSeconds = phaseSeconds(saved.config, "focus");
      setDurationSeconds(focusSeconds);
      setSecondsLeft(focusSeconds);
    }
    setNotificationPermission(notificationSupported ? Notification.permission : "unsupported");
  }, [notificationSupported]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ config, task, targetSessions }));
    } catch {
      // The timer remains usable without persistence.
    }
  }, [config, task, targetSessions]);

  const todayStats = useMemo(() => summarizeHistory(history), [history]);
  const status: TimerStatus = running ? "running" : sessionStartedAtMs ? "paused" : "idle";
  const progress = calculateProgress(durationSeconds, secondsLeft);
  const targetProgress = targetSessions > 0 ? Math.min(100, (todayStats.completedFocusSessions / targetSessions) * 100) : 0;
  const cyclePosition = completedFocus % config.sessionsBeforeLongBreak;

  const checks = useMemo(() => buildPomodoroChecks({
    config,
    task,
    targetSessions,
    notificationSupported,
    notificationPermission,
  }), [config, notificationPermission, notificationSupported, targetSessions, task]);
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;

  const report = useMemo(() => buildPomodoroReport({
    task,
    targetSessions,
    phase,
    status,
    remainingSeconds: secondsLeft,
    config,
    history,
    checks,
  }), [checks, config, history, phase, secondsLeft, status, targetSessions, task]);
  const markdown = useMemo(() => buildPomodoroMarkdown(report), [report]);
  const reportJson = useMemo(() => `${JSON.stringify(report, null, 2)}\n`, [report]);
  const historyCsv = useMemo(() => historyToCsv(history), [history]);
  const jsStarter = useMemo(() => buildJavaScriptTimerStarter(config), [config]);

  const addHistoryEntry = useCallback((entry: PomodoroSessionEntry) => {
    setHistory((current) => {
      const next = [entry, ...current].slice(0, MAX_HISTORY);
      writeHistory(next);
      return next;
    });
  }, []);

  const sendCompletionAlert = useCallback((completedPhase: TimerPhase, nextPhase: TimerPhase) => {
    if (config.soundEnabled) playCompletionBeep(config.volume);
    if (config.notificationsEnabled && notificationSupported && Notification.permission === "granted") {
      try {
        new Notification(`${PHASE_LABEL[completedPhase]} complete`, {
          body: `${PHASE_LABEL[nextPhase]} is ready${task.trim() ? ` · ${task.trim()}` : ""}.`,
          tag: "darma-pomodoro-complete",
        });
      } catch {
        // Notification failures should not interrupt the phase transition.
      }
    }
  }, [config.notificationsEnabled, config.soundEnabled, config.volume, notificationSupported, task]);

  const finishPhase = useCallback((result: "completed" | "skipped") => {
    const now = Date.now();
    const currentRemaining = running && endAtMs !== null ? calculateRemainingSeconds(endAtMs, now) : secondsLeft;
    const elapsed = Math.min(durationSeconds, Math.max(0, durationSeconds - currentRemaining));
    const startedAt = sessionStartedAtMs ?? now;

    addHistoryEntry({
      id: `${now}-${phase}-${Math.random().toString(36).slice(2, 8)}`,
      phase,
      task: task.trim(),
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(now).toISOString(),
      plannedSeconds: durationSeconds,
      elapsedSeconds: result === "completed" ? durationSeconds : elapsed,
      status: result,
    });

    const next = result === "completed"
      ? nextPomodoroPhase({ phase, completedFocus, sessionsBeforeLongBreak: config.sessionsBeforeLongBreak })
      : { phase: phase === "focus" ? "shortBreak" as const : "focus" as const, completedFocus };
    const nextDuration = phaseSeconds(config, next.phase);
    const autoStart = result === "completed" && shouldAutoStart(next.phase, config);

    if (result === "completed") sendCompletionAlert(phase, next.phase);
    setPhase(next.phase);
    setCompletedFocus(next.completedFocus);
    setDurationSeconds(nextDuration);
    setSecondsLeft(nextDuration);
    setSessionStartedAtMs(autoStart ? now : null);
    setEndAtMs(autoStart ? now + nextDuration * 1000 : null);
    setRunning(autoStart);
  }, [addHistoryEntry, completedFocus, config, durationSeconds, endAtMs, phase, running, secondsLeft, sendCompletionAlert, sessionStartedAtMs, task]);

  useEffect(() => {
    if (!running || endAtMs === null) return;
    const update = () => {
      const remaining = calculateRemainingSeconds(endAtMs, Date.now());
      setSecondsLeft(remaining);
      if (remaining === 0 && !completionLock.current) {
        completionLock.current = true;
        finishPhase("completed");
        window.setTimeout(() => {
          completionLock.current = false;
        }, 300);
      }
    };
    update();
    const interval = window.setInterval(update, 250);
    const handleVisibility = () => update();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [endAtMs, finishPhase, running]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    originalTitleRef.current = document.title;
    return () => {
      if (originalTitleRef.current) document.title = originalTitleRef.current;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || !originalTitleRef.current) return;
    document.title = running
      ? `${formatTime(secondsLeft)} · ${PHASE_LABEL[phase]} — Darma`
      : originalTitleRef.current;
  }, [phase, running, secondsLeft]);

  const start = useCallback(() => {
    if (secondsLeft <= 0) return;
    const now = Date.now();
    setSessionStartedAtMs((value) => value ?? now);
    setEndAtMs(now + secondsLeft * 1000);
    setRunning(true);
  }, [secondsLeft]);

  const pause = useCallback(() => {
    if (endAtMs !== null) setSecondsLeft(calculateRemainingSeconds(endAtMs, Date.now()));
    setEndAtMs(null);
    setRunning(false);
  }, [endAtMs]);

  const toggleTimer = useCallback(() => {
    if (running) pause();
    else start();
  }, [pause, running, start]);

  const resetCurrent = useCallback(() => {
    const nextDuration = phaseSeconds(config, phase);
    setRunning(false);
    setEndAtMs(null);
    setSessionStartedAtMs(null);
    setDurationSeconds(nextDuration);
    setSecondsLeft(nextDuration);
  }, [config, phase]);

  const selectPhase = useCallback((nextPhase: TimerPhase) => {
    const nextDuration = phaseSeconds(config, nextPhase);
    setPhase(nextPhase);
    setRunning(false);
    setEndAtMs(null);
    setSessionStartedAtMs(null);
    setDurationSeconds(nextDuration);
    setSecondsLeft(nextDuration);
  }, [config]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)) return;
      if (event.code === "Space") {
        event.preventDefault();
        toggleTimer();
      } else if (event.key.toLowerCase() === "r") {
        resetCurrent();
      } else if (event.key.toLowerCase() === "s") {
        finishPhase("skipped");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [finishPhase, resetCurrent, toggleTimer]);

  function applyPreset(id: string) {
    const preset = POMODORO_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    const nextConfig = clampConfig(preset.config);
    setConfig(nextConfig);
    setTask(preset.task);
    setTargetSessions(preset.targetSessions);
    setPhase("focus");
    setCompletedFocus(todayStats.completedFocusSessions);
    setRunning(false);
    setEndAtMs(null);
    setSessionStartedAtMs(null);
    const focusSeconds = phaseSeconds(nextConfig, "focus");
    setDurationSeconds(focusSeconds);
    setSecondsLeft(focusSeconds);
    setActiveTab("overview");
  }

  function updateConfig(patch: Partial<PomodoroConfig>, resetTimer = false) {
    const next = clampConfig({ ...config, ...patch });
    setConfig(next);
    if (!resetTimer) return;
    const nextDuration = phaseSeconds(next, phase);
    setRunning(false);
    setEndAtMs(null);
    setSessionStartedAtMs(null);
    setDurationSeconds(nextDuration);
    setSecondsLeft(nextDuration);
  }

  async function requestNotifications() {
    if (!notificationSupported) return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") updateConfig({ notificationsEnabled: true });
    } catch {
      setNotificationPermission(Notification.permission);
    }
  }

  function clearHistory() {
    setHistory([]);
    setCompletedFocus(0);
    writeHistory([]);
  }

  async function downloadPack() {
    const zip = new JSZip();
    zip.file("pomodoro-summary.md", markdown);
    zip.file("pomodoro-report.json", reportJson);
    zip.file("pomodoro-history.csv", historyCsv);
    zip.file("drift-resistant-timer.js", jsStarter);
    zip.file("README.md", "# Darma Pomodoro focus pack\n\n- `pomodoro-summary.md`: readable session summary and checks\n- `pomodoro-report.json`: structured configuration, current state, history, and daily statistics\n- `pomodoro-history.csv`: completed and skipped phase history\n- `drift-resistant-timer.js`: implementation starter based on an absolute deadline\n\nAll session data is generated locally in the browser.\n");
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pomodoro-focus-pack.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const tabs: Array<{ id: TimerTab; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: "Overview", icon: <ListChecks className="h-3.5 w-3.5" /> },
    { id: "history", label: "Session log", icon: <History className="h-3.5 w-3.5" /> },
    { id: "settings", label: "Cycle settings", icon: <Settings2 className="h-3.5 w-3.5" /> },
    { id: "exports", label: "Checks & exports", icon: <PackageCheck className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <SummaryCard label="Current phase" value={PHASE_LABEL[phase]} hint={`${formatTime(secondsLeft)} remaining`} icon={<Focus className="h-4 w-4" />} />
        <SummaryCard label="Today's focus" value={formatTime(todayStats.focusSeconds)} hint={`${todayStats.completedFocusSessions} completed sessions`} icon={<Clock3 className="h-4 w-4" />} />
        <SummaryCard label="Daily target" value={`${todayStats.completedFocusSessions} / ${targetSessions}`} hint={`${Math.round(targetProgress)}% complete`} icon={<Target className="h-4 w-4" />} />
        <SummaryCard label="Production review" value={reviewCount ? `${reviewCount} review` : "Ready"} hint={`${checks.length} checks completed`} icon={reviewCount ? <CirclePause className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[410px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><Sparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Focus presets</h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Load a complete cycle, task, and daily target.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => applyPreset(DEFAULT_POMODORO_PRESET_ID)} leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>Reset</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {POMODORO_PRESETS.map((preset) => (
                <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2.5 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-control-hover)]">
                  <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.name}</span>
                  <span className="mt-1 block line-clamp-2 text-xs leading-4 text-[var(--color-text-tertiary)]">{preset.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
              <div>
                <h2 className="text-sm font-black text-[var(--color-text-primary)]">Session plan</h2>
                <p className="text-xs text-[var(--color-text-tertiary)]">Name the work and set a realistic focus target.</p>
              </div>
            </div>
            <div className="space-y-3">
              <Field label="Current task">
                <Input value={task} onChange={(event) => setTask(event.target.value)} placeholder="What will you focus on?" />
              </Field>
              <Field label="Daily focus target" hint="1–24 sessions">
                <Input type="number" min={1} max={24} value={targetSessions} onChange={(event) => setTargetSessions(Math.min(24, Math.max(1, Number(event.target.value) || 1)))} />
              </Field>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-[var(--color-text-secondary)]">
                  <span>Daily progress</span>
                  <span>{todayStats.completedFocusSessions} of {targetSessions}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                  <div className="h-full rounded-full bg-[var(--color-primary)] transition-[width]" style={{ width: `${targetProgress}%` }} />
                </div>
              </div>
            </div>
          </section>
        </aside>

        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-md)]">
          <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {(["focus", "shortBreak", "longBreak"] as TimerPhase[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectPhase(item)}
                    aria-pressed={phase === item}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${phase === item ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" : "border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]"}`}
                  >
                    {PHASE_SHORT_LABEL[item]} · {phaseSeconds(config, item) / 60}m
                  </button>
                ))}
              </div>
              <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{status}</span>
            </div>
          </div>

          <div className="px-5 py-8 text-center sm:px-8 sm:py-10">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary-text-strong)]">{PHASE_LABEL[phase]}</div>
            <div className="mt-2 font-mono text-7xl font-black tabular-nums tracking-[-0.06em] text-[var(--color-text-primary)] sm:text-8xl">{formatTime(secondsLeft)}</div>
            <p className="mx-auto mt-3 max-w-xl truncate text-sm font-semibold text-[var(--color-text-secondary)]" title={task || "No task selected"}>{task || "No task selected"}</p>

            <div className="mx-auto mt-5 h-2.5 w-full max-w-xl overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
              <div className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="mx-auto mt-2 flex max-w-xl items-center justify-between font-mono text-xs text-[var(--color-text-tertiary)]">
              <span>{Math.round(progress)}%</span>
              <span>{formatTime(durationSeconds)}</span>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" variant="primary" onClick={toggleTimer} leftIcon={running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}>
                {running ? "Pause" : sessionStartedAtMs ? "Resume" : "Start"}
              </Button>
              <Button size="lg" variant="secondary" onClick={resetCurrent} leftIcon={<TimerReset className="h-5 w-5" />}>Reset</Button>
              <Button size="lg" variant="ghost" onClick={() => finishPhase("skipped")} leftIcon={<SkipForward className="h-5 w-5" />}>Skip</Button>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-2" aria-label={`Cycle progress: ${cyclePosition} of ${config.sessionsBeforeLongBreak} focus sessions`}>
              {Array.from({ length: config.sessionsBeforeLongBreak }).map((_, index) => (
                <span key={index} className={`h-2.5 w-8 rounded-full ${index < cyclePosition ? "bg-[var(--color-primary)]" : "bg-[var(--color-border-strong)]"}`} />
              ))}
              <span className="ml-1 text-xs font-semibold text-[var(--color-text-tertiary)]">Long break after {config.sessionsBeforeLongBreak}</span>
            </div>

            <div className="mt-5 text-xs text-[var(--color-text-tertiary)]">Keyboard: Space start/pause · R reset · S skip</div>
          </div>
        </section>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-sm)]">
        <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border-subtle)] p-2">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-xs font-bold transition ${activeTab === tab.id ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          {activeTab === "overview" ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <SummaryCard label="Focus sessions" value={String(todayStats.completedFocusSessions)} hint="completed today" icon={<CheckCircle2 className="h-4 w-4" />} />
                  <SummaryCard label="Breaks" value={String(todayStats.completedBreaks)} hint={formatTime(todayStats.breakSeconds)} icon={<CalendarClock className="h-4 w-4" />} />
                  <SummaryCard label="Skipped" value={String(todayStats.skippedSessions)} hint="phases today" icon={<SkipForward className="h-4 w-4" />} />
                  <SummaryCard label="History" value={String(history.length)} hint="saved locally" icon={<Save className="h-4 w-4" />} />
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                  <h3 className="text-sm font-black text-[var(--color-text-primary)]">Current cycle</h3>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    {(["focus", "shortBreak", "longBreak"] as TimerPhase[]).map((item) => (
                      <div key={item} className={`rounded-[var(--radius-md)] border p-3 ${phase === item ? "border-[var(--color-primary)] bg-[var(--color-control-hover)]" : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]"}`}>
                        <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{PHASE_LABEL[item]}</div>
                        <div className="mt-1 text-lg font-black text-[var(--color-text-primary)]">{phaseSeconds(config, item) / 60} min</div>
                        <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">{item === "focus" ? `${config.sessionsBeforeLongBreak} before long break` : item === "shortBreak" ? "between focus blocks" : "cycle recovery"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-black text-[var(--color-text-primary)]">Production checks</h3>
                <div className="space-y-2">
                  {checks.map((check) => (
                    <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}>
                      <div className="text-xs font-black">{check.title}</div>
                      <p className="mt-1 text-xs leading-4 opacity-90">{check.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "history" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-[var(--color-text-primary)]">Local session history</h3>
                  <p className="text-xs text-[var(--color-text-tertiary)]">Up to {MAX_HISTORY} completed or skipped phases are stored in this browser.</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={!history.length} onClick={() => downloadText("pomodoro-history.csv", historyCsv, "text/csv;charset=utf-8")} leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />}>CSV</Button>
                  <Button size="sm" variant="ghost" disabled={!history.length} onClick={clearHistory} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>Clear</Button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-[var(--color-surface-subtle)] text-xs uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
                    <tr><th className="px-3 py-2">Ended</th><th className="px-3 py-2">Phase</th><th className="px-3 py-2">Task</th><th className="px-3 py-2">Elapsed</th><th className="px-3 py-2">Status</th></tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 40).map((entry) => (
                      <tr key={entry.id} className="border-t border-[var(--color-border-subtle)]">
                        <td className="whitespace-nowrap px-3 py-2 text-[var(--color-text-secondary)]">{formatClock(entry.endedAt)}</td>
                        <td className="px-3 py-2 font-bold text-[var(--color-text-primary)]">{PHASE_LABEL[entry.phase]}</td>
                        <td className="max-w-[280px] truncate px-3 py-2 text-[var(--color-text-secondary)]" title={entry.task}>{entry.task || "—"}</td>
                        <td className="px-3 py-2 font-mono text-[var(--color-text-secondary)]">{formatTime(entry.elapsedSeconds)}</td>
                        <td className="px-3 py-2"><span className={`rounded-full px-2 py-1 text-xs font-bold ${entry.status === "completed" ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]" : "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"}`}>{entry.status}</span></td>
                      </tr>
                    ))}
                    {!history.length ? <tr><td colSpan={5} className="px-3 py-8 text-center text-[var(--color-text-tertiary)]">Complete or skip a phase to build your local session log.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeTab === "settings" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 text-sm font-black text-[var(--color-text-primary)]">Cycle durations</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Focus minutes" hint="1–180"><Input type="number" min={1} max={180} value={config.focusMinutes} onChange={(event) => updateConfig({ focusMinutes: parseMinutes(event.target.value, config.focusMinutes) }, true)} /></Field>
                    <Field label="Short break" hint="1–60"><Input type="number" min={1} max={60} value={config.shortBreakMinutes} onChange={(event) => updateConfig({ shortBreakMinutes: parseMinutes(event.target.value, config.shortBreakMinutes) }, true)} /></Field>
                    <Field label="Long break" hint="1–120"><Input type="number" min={1} max={120} value={config.longBreakMinutes} onChange={(event) => updateConfig({ longBreakMinutes: parseMinutes(event.target.value, config.longBreakMinutes) }, true)} /></Field>
                    <Field label="Long-break interval" hint="focus sessions"><Input type="number" min={1} max={12} value={config.sessionsBeforeLongBreak} onChange={(event) => updateConfig({ sessionsBeforeLongBreak: parseMinutes(event.target.value, config.sessionsBeforeLongBreak) }, true)} /></Field>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-black text-[var(--color-text-primary)]">Automation</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Toggle checked={config.autoStartBreaks} onChange={(checked) => updateConfig({ autoStartBreaks: checked })} label="Auto-start breaks" description="Begin short or long breaks as soon as focus ends." />
                    <Toggle checked={config.autoStartFocus} onChange={(checked) => updateConfig({ autoStartFocus: checked })} label="Auto-start focus" description="Begin the next focus block as soon as a break ends." />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 text-sm font-black text-[var(--color-text-primary)]">Completion alerts</h3>
                  <div className="space-y-2">
                    <Toggle checked={config.soundEnabled} onChange={(checked) => updateConfig({ soundEnabled: checked })} label="Completion sound" description="Play a two-tone browser-local beep at the end of a phase." />
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
                      <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--color-text-primary)]"><span className="flex items-center gap-2"><Volume2 className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Sound volume</span><span>{Math.round(config.volume * 100)}%</span></div>
                      <input className="mt-3 w-full accent-[var(--color-primary)]" type="range" min={0} max={1} step={0.05} value={config.volume} onChange={(event) => updateConfig({ volume: Number(event.target.value) })} disabled={!config.soundEnabled} />
                    </div>
                    <Toggle checked={config.notificationsEnabled} onChange={(checked) => updateConfig({ notificationsEnabled: checked })} label="Desktop notifications" description={`Permission: ${notificationPermission}`} disabled={!notificationSupported} />
                    {notificationSupported && notificationPermission !== "granted" ? <Button size="sm" variant="secondary" onClick={requestNotifications} leftIcon={<BellRing className="h-3.5 w-3.5" />}>Request notification permission</Button> : null}
                    {config.soundEnabled ? <Button size="sm" variant="ghost" onClick={() => playCompletionBeep(config.volume)} leftIcon={<Volume2 className="h-3.5 w-3.5" />}>Test sound</Button> : null}
                  </div>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-[var(--color-info-text)]">
                  <div className="flex items-center gap-2 text-xs font-black"><Bell className="h-4 w-4" />Browser behavior</div>
                  <p className="mt-1 text-xs leading-4">The timer uses an absolute deadline, so it corrects interval drift when the tab is throttled. Browsers may still suspend audio or notifications under power-saving policies.</p>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "exports" ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-black text-[var(--color-text-primary)]">Report preview</h3><CopyButton text={markdown} size="sm" variant="secondary">Copy Markdown</CopyButton></div>
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4 font-mono text-xs leading-5 text-[var(--color-text-secondary)]">{markdown}</pre>
              </div>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="secondary" onClick={() => downloadText("pomodoro-summary.md", markdown, "text/markdown;charset=utf-8")} leftIcon={<Download className="h-4 w-4" />}>Download Markdown</Button>
                <Button className="w-full justify-start" variant="secondary" onClick={() => downloadText("pomodoro-report.json", reportJson, "application/json;charset=utf-8")} leftIcon={<FileJson className="h-4 w-4" />}>Download JSON audit</Button>
                <Button className="w-full justify-start" variant="secondary" onClick={() => downloadText("pomodoro-history.csv", historyCsv, "text/csv;charset=utf-8")} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>Download history CSV</Button>
                <Button className="w-full justify-start" variant="secondary" onClick={() => downloadText("drift-resistant-timer.js", jsStarter, "text/javascript;charset=utf-8")} leftIcon={<Code2 className="h-4 w-4" />}>Download JavaScript starter</Button>
                <Button className="w-full justify-start" variant="primary" onClick={downloadPack} leftIcon={<PackageCheck className="h-4 w-4" />}>Download production pack</Button>
                <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3 text-xs leading-4 text-[var(--color-text-tertiary)]">Exports include local session history but never include browser notification permissions or any external account data.</div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
