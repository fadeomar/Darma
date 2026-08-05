"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  Crown,
  History,
  Info,
  Medal,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge, Button, CopyButton } from "@/components/ui";
import {
  ChallengeArenaChrome,
  ChallengeCard,
  ChallengeProgressRail,
  ChallengeResultHighlight,
  ChallengeEmptyState,
  ChallengeStatusPill,
  ChallengeHistoryPanel,
  ChallengeModeSelector,
  ChallengePersonalBestCard,
  ChallengeSmallMetric,
  ChallengeTipList,
  loadChallengeHistoryWithFallback,
  saveChallengeHistory,
  type ChallengeModeOption,
} from "@/features/tools/challenges";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { downloadTextFile } from "@/features/tools/export/downloadText";
import { ToolLayoutInteractiveChallenge } from "@/features/tools/layouts/ToolLayoutInteractiveChallenge";
import { cn } from "@/lib/cn";
import {
  REACTION_DELAY_PROFILES,
  calculateReactionStats,
  createEmptyStats,
  formatNumber,
  isReactionKey,
  modeLabel,
  pointerSource,
  randomWaitMs,
  resultInsight,
  scoreLabel,
} from "./reactionMetrics";
import {
  ReactionProductionPanel,
  ReactionSummaryGrid,
} from "./components/ReactionProductionPanel";
import {
  REACTION_HISTORY_LIMIT,
  REACTION_IMPORT_MAX_BYTES,
  buildReactionAudit,
  buildReactionSummaryCards,
  createReactionAttempt,
  createReactionBackup,
  createReactionProductionPack,
  normalizeReactionAttempt,
  parseReactionBackup,
  reactionAttemptCsv,
  reactionAttemptMarkdown,
  reactionBackupJson,
} from "./studio";
import type {
  ReactionAttempt,
  ReactionDelayProfile,
  ReactionSample,
  ReactionStats,
  ReactionTestMode,
} from "./types";

const HISTORY_KEY = "darma:reaction-time-test:history:v1";
const TEST_MODES: ChallengeModeOption<ReactionTestMode>[] = [
  { value: 1, label: "1", hint: "Quick" },
  { value: 3, label: "3", hint: "Short" },
  { value: 5, label: "5", hint: "Classic" },
  { value: 10, label: "10", hint: "Focus" },
];
const COUNTDOWN_STEPS = [3, 2, 1] as const;

type TestStatus =
  | "idle"
  | "countdown"
  | "waiting"
  | "ready"
  | "between"
  | "false-start"
  | "finished";

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(media.matches);

    const handleChange = () => setPrefersReducedMotion(media.matches);
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

function metricText(stats: ReactionStats, mode: ReactionTestMode) {
  return [
    `Reaction Time Test — ${modeLabel(mode)}`,
    `Average: ${formatNumber(stats.averageReactionMs)} ms`,
    `Median: ${formatNumber(stats.medianReactionMs)} ms`,
    `Best: ${formatNumber(stats.bestReactionMs)} ms`,
    `Spread: ${formatNumber(stats.spreadReactionMs)} ms`,
    `Slowest: ${formatNumber(stats.slowestReactionMs)} ms`,
    `Rounds: ${stats.roundsCompleted}/${stats.totalRounds}`,
    `Consistency: ${stats.consistencyScore}%`,
    `False starts: ${stats.falseStarts}`,
    `Input: ${stats.inputMethod}`,
  ].join("\n");
}

function loadHistory() {
  return loadChallengeHistoryWithFallback<ReactionAttempt>({
    key: HISTORY_KEY,
    normalize: normalizeReactionAttempt,
    limit: REACTION_HISTORY_LIMIT,
  });
}

function saveHistory(history: ReactionAttempt[]) {
  saveChallengeHistory(HISTORY_KEY, history, REACTION_HISTORY_LIMIT);
}

export default function ReactionTimeTestClient() {
  const [status, setStatus] = useState<TestStatus>("idle");
  const [mode, setMode] = useState<ReactionTestMode>(5);
  const [delayProfile, setDelayProfile] =
    useState<ReactionDelayProfile>("standard");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [stats, setStats] = useState<ReactionStats>(() => createEmptyStats(5));
  const [history, setHistory] = useState<ReactionAttempt[]>([]);
  const [latestAttempt, setLatestAttempt] = useState<ReactionAttempt | null>(
    null,
  );
  const [currentRound, setCurrentRound] = useState(1);
  const [lastReactionMs, setLastReactionMs] = useState(0);
  const [importStatus, setImportStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [isPacking, setIsPacking] = useState(false);

  const prefersReducedMotion = usePrefersReducedMotion();
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const samplesRef = useRef<ReactionSample[]>([]);
  const falseStartsRef = useRef(0);
  const signalTimeRef = useRef(0);
  const currentWaitRef = useRef(0);
  const statusRef = useRef<TestStatus>(status);
  const modeRef = useRef<ReactionTestMode>(mode);
  const delayProfileRef = useRef<ReactionDelayProfile>(delayProfile);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const signalTimerRef = useRef<number | null>(null);
  const betweenTimerRef = useRef<number | null>(null);

  const refreshStats = useCallback(() => {
    setStats(
      calculateReactionStats(
        samplesRef.current,
        modeRef.current,
        falseStartsRef.current,
      ),
    );
  }, []);

  const clearCountdown = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
  }, []);

  const clearSignalTimer = useCallback(() => {
    if (signalTimerRef.current !== null) {
      window.clearTimeout(signalTimerRef.current);
      signalTimerRef.current = null;
    }
  }, []);

  const clearBetweenTimer = useCallback(() => {
    if (betweenTimerRef.current !== null) {
      window.clearTimeout(betweenTimerRef.current);
      betweenTimerRef.current = null;
    }
  }, []);

  const finishTest = useCallback(() => {
    const finalStats = calculateReactionStats(
      samplesRef.current,
      modeRef.current,
      falseStartsRef.current,
    );
    const activeMode = modeRef.current;
    const attempt = createReactionAttempt({
      id: `reaction-${Date.now()}`,
      createdAt: new Date().toISOString(),
      mode: activeMode,
      delayProfile: delayProfileRef.current,
      samples: samplesRef.current,
      falseStarts: falseStartsRef.current,
    });

    clearSignalTimer();
    clearBetweenTimer();
    setStats(finalStats);
    setLatestAttempt(attempt);
    setStatus("finished");
    statusRef.current = "finished";
    setHistory((previous) => {
      const next = [
        attempt,
        ...previous.filter((item) => item.id !== attempt.id),
      ].slice(0, REACTION_HISTORY_LIMIT);
      saveHistory(next);
      return next;
    });
  }, [clearBetweenTimer, clearSignalTimer]);

  const scheduleSignal = useCallback(() => {
    clearSignalTimer();
    clearBetweenTimer();
    const nextRound = samplesRef.current.length + 1;
    const delay = randomWaitMs(delayProfileRef.current);

    currentWaitRef.current = delay;
    signalTimeRef.current = 0;
    statusRef.current = "waiting";
    setStatus("waiting");
    setLastReactionMs(0);
    setCurrentRound(nextRound);
    refreshStats();
    window.setTimeout(() => arenaRef.current?.focus(), 0);

    signalTimerRef.current = window.setTimeout(() => {
      signalTimerRef.current = null;
      signalTimeRef.current = performance.now();
      statusRef.current = "ready";
      setStatus("ready");
    }, delay);
  }, [clearBetweenTimer, clearSignalTimer, refreshStats]);

  const beginRun = useCallback(() => {
    clearCountdown();
    samplesRef.current = [];
    falseStartsRef.current = 0;
    setStats(createEmptyStats(modeRef.current));
    setCurrentRound(1);
    setLastReactionMs(0);
    scheduleSignal();
  }, [clearCountdown, scheduleSignal]);

  useEffect(() => {
    const saved = loadHistory();
    setHistory(saved);
    setLatestAttempt(saved[0] ?? null);
  }, []);

  useEffect(() => {
    return () => {
      clearCountdown();
      clearSignalTimer();
      clearBetweenTimer();
    };
  }, [clearBetweenTimer, clearCountdown, clearSignalTimer]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    modeRef.current = mode;
    if (statusRef.current === "idle") setStats(createEmptyStats(mode));
  }, [mode]);

  useEffect(() => {
    delayProfileRef.current = delayProfile;
  }, [delayProfile]);

  const startTest = useCallback(() => {
    if (
      ["countdown", "waiting", "ready", "between"].includes(statusRef.current)
    )
      return;

    clearSignalTimer();
    clearBetweenTimer();

    if (prefersReducedMotion) {
      beginRun();
      return;
    }

    samplesRef.current = [];
    falseStartsRef.current = 0;
    setStats(createEmptyStats(modeRef.current));
    setCurrentRound(1);
    setLastReactionMs(0);
    setCountdown(COUNTDOWN_STEPS[0]);
    setStatus("countdown");
    statusRef.current = "countdown";
    window.setTimeout(() => arenaRef.current?.focus(), 0);

    let index = 0;
    countdownTimerRef.current = window.setInterval(() => {
      index += 1;
      const next = COUNTDOWN_STEPS[index];
      if (!next) {
        beginRun();
        return;
      }
      setCountdown(next);
    }, 650);
  }, [beginRun, clearBetweenTimer, clearSignalTimer, prefersReducedMotion]);

  const resetTest = useCallback(() => {
    clearCountdown();
    clearSignalTimer();
    clearBetweenTimer();
    samplesRef.current = [];
    falseStartsRef.current = 0;
    signalTimeRef.current = 0;
    currentWaitRef.current = 0;
    statusRef.current = "idle";
    setCountdown(null);
    setCurrentRound(1);
    setLastReactionMs(0);
    setStats(createEmptyStats(modeRef.current));
    setStatus("idle");
  }, [clearBetweenTimer, clearCountdown, clearSignalTimer]);

  const recordReaction = useCallback(
    (source: ReactionSample["source"]) => {
      if (statusRef.current === "waiting") {
        clearSignalTimer();
        falseStartsRef.current += 1;
        statusRef.current = "false-start";
        setStatus("false-start");
        refreshStats();
        return;
      }

      if (statusRef.current !== "ready") return;

      const reactionMs = Math.max(performance.now() - signalTimeRef.current, 1);
      const round = samplesRef.current.length + 1;
      samplesRef.current.push({
        round,
        reactionMs,
        source,
        waitMs: currentWaitRef.current,
      });
      setLastReactionMs(reactionMs);
      const nextStats = calculateReactionStats(
        samplesRef.current,
        modeRef.current,
        falseStartsRef.current,
      );
      setStats(nextStats);

      if (samplesRef.current.length >= modeRef.current) {
        finishTest();
        return;
      }

      statusRef.current = "between";
      setStatus("between");
      clearBetweenTimer();
      betweenTimerRef.current = window.setTimeout(() => scheduleSignal(), 900);
    },
    [
      clearBetweenTimer,
      clearSignalTimer,
      finishTest,
      refreshStats,
      scheduleSignal,
    ],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const shouldCapture =
        ["countdown", "waiting", "ready", "between", "false-start"].includes(
          statusRef.current,
        ) && isReactionKey(event);
      if (!shouldCapture) return;

      event.preventDefault();
      if (event.repeat) return;
      recordReaction("keyboard");
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [recordReaction]);

  const registerPointer = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!["waiting", "ready"].includes(statusRef.current)) return;
      if (!event.isPrimary) return;

      event.preventDefault();
      recordReaction(pointerSource(event.pointerType));
    },
    [recordReaction],
  );

  const continueAfterFalseStart = useCallback(() => {
    if (statusRef.current !== "false-start") return;
    scheduleSignal();
  }, [scheduleSignal]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setLatestAttempt(null);
    saveHistory([]);
  }, []);

  const waitProgress = useMemo(() => {
    const completed = stats.roundsCompleted;
    if (status === "finished") return 100;
    if (status === "ready")
      return Math.min(99, ((completed + 0.75) / mode) * 100);
    if (status === "waiting")
      return Math.min(96, ((completed + 0.25) / mode) * 100);
    if (status === "between")
      return Math.min(99, ((completed + 0.9) / mode) * 100);
    return Math.min(100, (completed / mode) * 100);
  }, [mode, stats.roundsCompleted, status]);

  const resultText = useMemo(() => metricText(stats, mode), [mode, stats]);
  const activeScoreLabel = scoreLabel(stats.averageReactionMs);
  const activeInsight = resultInsight(stats);
  const personalBest = useMemo(
    () =>
      history.reduce<ReactionAttempt | null>((best, attempt) => {
        if (!attempt.stats.averageReactionMs) return best;
        return !best ||
          attempt.stats.averageReactionMs < best.stats.averageReactionMs
          ? attempt
          : best;
      }, null),
    [history],
  );
  const summaryCards = useMemo(
    () => buildReactionSummaryCards(latestAttempt),
    [latestAttempt],
  );
  const auditChecks = useMemo(
    () => buildReactionAudit(latestAttempt),
    [latestAttempt],
  );
  const canCopy = stats.roundsCompleted > 0 && status !== "countdown";
  const isLive = status === "waiting" || status === "ready";

  const handleModeChange = useCallback(
    (nextMode: ReactionTestMode) => {
      if (
        ["countdown", "waiting", "ready", "between"].includes(statusRef.current)
      )
        return;
      resetTest();
      modeRef.current = nextMode;
      setMode(nextMode);
      setStats(createEmptyStats(nextMode));
    },
    [resetTest],
  );

  const handleDelayProfileChange = useCallback(
    (nextProfile: ReactionDelayProfile) => {
      if (
        ["countdown", "waiting", "ready", "between"].includes(statusRef.current)
      )
        return;
      delayProfileRef.current = nextProfile;
      setDelayProfile(nextProfile);
    },
    [],
  );

  const backup = useCallback(
    () => createReactionBackup({ mode, delayProfile }, history),
    [delayProfile, history, mode],
  );

  const downloadBackup = useCallback(() => {
    if (!history.length) return;
    downloadTextFile({
      content: reactionBackupJson(backup()),
      filename: "darma-reaction-time-session.json",
      mimeType: "application/json;charset=utf-8",
    });
  }, [backup, history.length]);

  const downloadMarkdown = useCallback(() => {
    if (!latestAttempt) return;
    downloadTextFile({
      content: reactionAttemptMarkdown(latestAttempt),
      filename: "darma-reaction-time-report.md",
      mimeType: "text/markdown;charset=utf-8",
    });
  }, [latestAttempt]);

  const downloadCsv = useCallback(() => {
    if (!latestAttempt) return;
    downloadTextFile({
      content: reactionAttemptCsv(latestAttempt),
      filename: "darma-reaction-time-rounds.csv",
      mimeType: "text/csv;charset=utf-8",
    });
  }, [latestAttempt]);

  const downloadPack = useCallback(async () => {
    if (!latestAttempt || isPacking) return;
    setIsPacking(true);
    try {
      const archive = await createReactionProductionPack(
        backup(),
        latestAttempt,
      );
      downloadBlobFile({
        blob: new Blob([Uint8Array.from(archive)], { type: "application/zip" }),
        filename: "darma-reaction-time-production-pack.zip",
      });
    } finally {
      setIsPacking(false);
    }
  }, [backup, isPacking, latestAttempt]);

  const importBackup = useCallback(
    async (file: File) => {
      if (file.size > REACTION_IMPORT_MAX_BYTES) {
        setImportStatus({
          tone: "error",
          message: "The selected backup is larger than the 1 MB import limit.",
        });
        return;
      }
      try {
        const parsed = parseReactionBackup(await file.text());
        resetTest();
        modeRef.current = parsed.settings.mode;
        delayProfileRef.current = parsed.settings.delayProfile;
        setMode(parsed.settings.mode);
        setDelayProfile(parsed.settings.delayProfile);
        setStats(createEmptyStats(parsed.settings.mode));
        setHistory(parsed.attempts);
        setLatestAttempt(parsed.attempts[0] ?? null);
        saveHistory(parsed.attempts);
        setImportStatus({
          tone: "success",
          message: `Restored ${parsed.attempts.length} saved run${parsed.attempts.length === 1 ? "" : "s"} and the challenge settings.`,
        });
      } catch (error) {
        setImportStatus({
          tone: "error",
          message:
            error instanceof Error
              ? error.message
              : "The backup could not be imported.",
        });
      }
    },
    [resetTest],
  );

  const statusBadge = useMemo(() => {
    if (status === "countdown") return "Countdown";
    if (status === "waiting") return "Wait";
    if (status === "ready") return "React now";
    if (status === "between") return "Next round";
    if (status === "false-start") return "Too soon";
    if (status === "finished") return "Finished";
    return "Ready";
  }, [status]);

  return (
    <>
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importBackup(file);
          event.currentTarget.value = "";
        }}
      />
      <ToolLayoutInteractiveChallenge
        arenaSlot={
          <ChallengeArenaChrome>
            <div
              ref={arenaRef}
              tabIndex={0}
              role="application"
              aria-label="Reaction time test arena"
              onPointerDown={registerPointer}
              className={cn(
                "relative min-h-[430px] select-none overflow-hidden rounded-[1.45rem] border border-white/50 p-5 outline-none focus:shadow-[var(--focus-ring)] sm:min-h-[500px] sm:p-7",
                "bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.95),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(255,151,65,0.22),transparent_30%),radial-gradient(circle_at_48%_84%,rgba(80,205,190,0.18),transparent_28%),linear-gradient(135deg,rgba(255,248,237,0.97),rgba(246,225,199,0.84)_48%,rgba(232,238,255,0.76))]",
                "dark:border-white/10 dark:bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(255,151,65,0.14),transparent_30%),radial-gradient(circle_at_48%_84%,rgba(80,205,190,0.14),transparent_28%),linear-gradient(135deg,rgba(36,29,24,0.96),rgba(54,39,28,0.86)_48%,rgba(30,33,60,0.74))]",
                status === "waiting" && "cursor-not-allowed touch-none",
                status === "ready" &&
                  "cursor-pointer touch-none bg-[radial-gradient(circle_at_50%_42%,rgba(80,205,190,0.34),transparent_32%),radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.95),transparent_28%),linear-gradient(135deg,rgba(236,255,249,0.98),rgba(202,246,230,0.88)_48%,rgba(255,248,237,0.76))] dark:bg-[radial-gradient(circle_at_50%_42%,rgba(80,205,190,0.25),transparent_32%),linear-gradient(135deg,rgba(22,48,44,0.94),rgba(24,67,58,0.82)_48%,rgba(44,34,24,0.78))]",
                status === "false-start" &&
                  "bg-[radial-gradient(circle_at_50%_42%,rgba(255,95,80,0.28),transparent_32%),linear-gradient(135deg,rgba(255,247,242,0.98),rgba(255,221,210,0.86)_48%,rgba(250,235,221,0.78))] dark:bg-[radial-gradient(circle_at_50%_42%,rgba(255,95,80,0.22),transparent_32%),linear-gradient(135deg,rgba(55,28,22,0.94),rgba(74,36,30,0.82)_48%,rgba(44,34,24,0.78))]",
              )}
            >
              <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(119,83,45,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(119,83,45,0.08)_1px,transparent_1px)] [background-size:36px_36px] dark:opacity-25" />
              <ChallengeProgressRail
                value={waitProgress}
                label="Reaction test round progress"
                active={status === "waiting" || status === "ready"}
                tone={
                  status === "ready"
                    ? "success"
                    : status === "false-start"
                      ? "warning"
                      : status === "finished"
                        ? "accent"
                        : "primary"
                }
                floating={false}
                className="mb-5 h-2 rounded-[var(--radius-full)]"
              />

              {status === "countdown" ? (
                <div
                  className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(255,248,237,0.72)] backdrop-blur-sm dark:bg-[rgba(20,17,14,0.72)]"
                  aria-live="assertive"
                >
                  <div className="text-center">
                    <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[var(--color-text-tertiary)]">
                      Get ready
                    </p>
                    <div className="mt-4 text-8xl font-black tracking-[-0.08em] text-[var(--color-primary-text-strong)] motion-safe:animate-ping sm:text-9xl">
                      {countdown}
                    </div>
                    <p className="mt-4 text-sm font-bold text-[var(--color-text-secondary)]">
                      Do not tap until the arena turns green.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="relative z-10 flex min-h-[390px] flex-col sm:min-h-[450px]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <ChallengeStatusPill
                      label={statusBadge}
                      tone={
                        status === "ready"
                          ? "success"
                          : status === "false-start"
                            ? "warning"
                            : status === "finished"
                              ? "accent"
                              : status === "countdown" || status === "waiting"
                                ? "primary"
                                : "muted"
                      }
                      pulse={
                        status === "ready" ||
                        status === "waiting" ||
                        status === "countdown"
                      }
                    />
                    <Badge variant="outline">{modeLabel(mode)}</Badge>
                    <Badge variant="outline">
                      Round {Math.min(currentRound, mode)}/{mode}
                    </Badge>
                    <Badge variant="outline">{stats.inputMethod}</Badge>
                    {stats.falseStarts > 0 ? (
                      <Badge variant="warning">
                        {stats.falseStarts} false start
                        {stats.falseStarts === 1 ? "" : "s"}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="rounded-[var(--radius-full)] border border-white/55 bg-white/70 px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)] backdrop-blur dark:border-white/10 dark:bg-white/10">
                    {status === "waiting"
                      ? "Waiting"
                      : status === "ready"
                        ? "Signal"
                        : status === "between"
                          ? "Next"
                          : status === "false-start"
                            ? "Penalty"
                            : "Average"}
                    :{" "}
                    {stats.averageReactionMs
                      ? `${formatNumber(stats.averageReactionMs)} ms`
                      : "—"}
                  </div>
                </div>

                <div
                  className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center text-center"
                  aria-live="polite"
                >
                  <div
                    className={cn(
                      "relative flex h-40 w-40 items-center justify-center rounded-[2.3rem] border border-white/60 bg-white/75 shadow-[0_26px_80px_rgba(98,68,33,0.2)] transition dark:border-white/10 dark:bg-white/10 sm:h-52 sm:w-52",
                      status === "ready" &&
                        "scale-105 border-[rgba(80,205,190,0.75)] bg-[rgba(224,255,246,0.88)] shadow-[0_28px_90px_rgba(34,197,94,0.24)] motion-safe:animate-pulse dark:bg-[rgba(80,205,190,0.16)]",
                      status === "waiting" && "opacity-90",
                      status === "false-start" &&
                        "border-[rgba(255,95,80,0.55)] bg-[rgba(255,235,228,0.88)] dark:bg-[rgba(255,95,80,0.12)]",
                    )}
                  >
                    <span className="absolute inset-4 rounded-[1.65rem] border border-[var(--color-primary-border)]" />
                    <Zap
                      className={cn(
                        "h-16 w-16 text-[var(--color-primary-text-strong)] sm:h-20 sm:w-20",
                        status === "ready" && "text-[rgb(24,150,108)]",
                        status === "false-start" && "text-[rgb(220,80,65)]",
                      )}
                      aria-hidden
                    />
                  </div>

                  <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
                    {status === "waiting"
                      ? "Wait for green"
                      : status === "ready"
                        ? "Tap now"
                        : status === "between"
                          ? "Nice reaction"
                          : status === "false-start"
                            ? "Too early"
                            : status === "finished"
                              ? "Reaction run complete"
                              : "Start, wait, then react"}
                  </p>
                  <h2 className="mt-3 text-5xl font-black tracking-[-0.06em] text-[var(--color-text-primary)] sm:text-7xl">
                    {lastReactionMs
                      ? formatNumber(lastReactionMs)
                      : stats.averageReactionMs
                        ? formatNumber(stats.averageReactionMs)
                        : "—"}
                    <span className="ml-2 text-lg tracking-[-0.02em] text-[var(--color-text-tertiary)] sm:text-2xl">
                      ms
                    </span>
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
                    {status === "countdown"
                      ? "The test starts after the countdown, then the signal appears after a random delay."
                      : status === "waiting"
                        ? "Do not tap yet. Early taps are counted as false starts."
                        : status === "ready"
                          ? "Tap the arena, press Space, or press Enter as quickly as you can."
                          : status === "between"
                            ? `${formatNumber(lastReactionMs)} ms recorded. Next round starts automatically.`
                            : status === "false-start"
                              ? "You tapped before the green signal. Continue to retry this round."
                              : status === "finished"
                                ? activeInsight
                                : "Choose a round count and unpredictable delay profile, then react only after the signal."}
                  </p>

                  {status === "finished" ? (
                    <ChallengeResultHighlight
                      title={activeScoreLabel}
                      description={activeInsight}
                      metricLabel="Average"
                      metricValue={
                        stats.averageReactionMs
                          ? `${formatNumber(stats.averageReactionMs)} ms`
                          : "—"
                      }
                      icon={
                        <Trophy
                          className="h-4 w-4 text-[var(--color-primary-text-strong)]"
                          aria-hidden
                        />
                      }
                      badges={[
                        {
                          label: "Best",
                          value: stats.bestReactionMs
                            ? `${formatNumber(stats.bestReactionMs)} ms`
                            : "—",
                          tone: "success",
                          icon: <Zap className="h-3 w-3" aria-hidden />,
                        },
                        {
                          label: "Rounds",
                          value: `${stats.roundsCompleted}/${stats.totalRounds}`,
                          tone: "primary",
                          icon: <Timer className="h-3 w-3" aria-hidden />,
                        },
                        {
                          label: "False starts",
                          value: stats.falseStarts,
                          tone: stats.falseStarts > 0 ? "warning" : "muted",
                          icon: <ShieldCheck className="h-3 w-3" aria-hidden />,
                        },
                      ]}
                      celebrate
                      tone="accent"
                    />
                  ) : null}

                  <div className="mt-7 flex flex-wrap justify-center gap-2">
                    {status === "waiting" ||
                    status === "ready" ||
                    status === "between" ? (
                      <Button
                        size="lg"
                        variant="danger"
                        onClick={resetTest}
                        leftIcon={<Square className="h-4 w-4" />}
                      >
                        Stop test
                      </Button>
                    ) : status === "false-start" ? (
                      <Button
                        size="lg"
                        onClick={continueAfterFalseStart}
                        leftIcon={<Play className="h-4 w-4" />}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={startTest}
                        disabled={status === "countdown"}
                        leftIcon={<Play className="h-4 w-4" />}
                      >
                        {status === "countdown"
                          ? "Starting..."
                          : status === "finished"
                            ? "Run again"
                            : "Start reaction test"}
                      </Button>
                    )}
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={resetTest}
                      leftIcon={<RotateCcw className="h-4 w-4" />}
                    >
                      Reset
                    </Button>
                    <CopyButton
                      size="lg"
                      variant="outline"
                      text={resultText}
                      disabled={!canCopy}
                    >
                      Copy score
                    </CopyButton>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-5">
                  <ChallengeSmallMetric
                    label="Average"
                    value={
                      stats.averageReactionMs
                        ? `${formatNumber(stats.averageReactionMs)} ms`
                        : "—"
                    }
                  />
                  <ChallengeSmallMetric
                    label="Best"
                    value={
                      stats.bestReactionMs
                        ? `${formatNumber(stats.bestReactionMs)} ms`
                        : "—"
                    }
                  />
                  <ChallengeSmallMetric
                    label="Rounds"
                    value={`${stats.roundsCompleted}/${mode}`}
                  />
                  <ChallengeSmallMetric
                    label="False starts"
                    value={stats.falseStarts}
                  />
                  <ChallengeSmallMetric
                    label="Input"
                    value={stats.inputMethod}
                  />
                </div>
              </div>
            </div>
          </ChallengeArenaChrome>
        }
        controlsSlot={
          <div className="space-y-5">
            <ChallengeCard
              eyebrow="Challenge setup"
              title="Pick rounds and signal timing"
              description="Each round uses an unpredictable delay. The progress rail shows round completion, not the hidden signal countdown, so it cannot be used as an anticipation cue."
              badge={<Badge variant="accent">Reaction studio</Badge>}
            >
              <div className="space-y-5">
                <ChallengeModeSelector
                  options={TEST_MODES}
                  value={mode}
                  disabled={
                    isLive || status === "countdown" || status === "between"
                  }
                  onChange={handleModeChange}
                />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
                    Signal delay profile
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    {(
                      Object.entries(REACTION_DELAY_PROFILES) as [
                        ReactionDelayProfile,
                        (typeof REACTION_DELAY_PROFILES)[ReactionDelayProfile],
                      ][]
                    ).map(([value, profile]) => (
                      <button
                        key={value}
                        type="button"
                        disabled={
                          isLive ||
                          status === "countdown" ||
                          status === "between"
                        }
                        onClick={() => handleDelayProfileChange(value)}
                        className={cn(
                          "rounded-[var(--radius-md)] border p-3 text-left transition focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-55",
                          delayProfile === value
                            ? "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)]"
                            : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] hover:bg-[var(--color-surface-subtle)]",
                        )}
                      >
                        <span className="block text-sm font-black text-[var(--color-text-primary)]">
                          {profile.label}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">
                          {profile.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ChallengeCard>
            <ReactionProductionPanel
              checks={auditChecks}
              hasAttempt={Boolean(latestAttempt)}
              hasHistory={history.length > 0}
              isPacking={isPacking}
              importStatus={importStatus}
              onImport={() => importInputRef.current?.click()}
              onDownloadBackup={downloadBackup}
              onDownloadMarkdown={downloadMarkdown}
              onDownloadCsv={downloadCsv}
              onDownloadPack={downloadPack}
            />
          </div>
        }
        statsSlot={<ReactionSummaryGrid cards={summaryCards} />}
        historySlot={
          <div className="space-y-4">
            <ChallengePersonalBestCard
              title="Best average"
              icon={
                <Crown
                  className="h-4 w-4 text-[var(--color-primary-text-strong)]"
                  aria-hidden
                />
              }
              badge={
                personalBest ? (
                  <Badge variant="success">
                    {modeLabel(personalBest.mode)}
                  </Badge>
                ) : undefined
              }
              empty={
                <ChallengeEmptyState
                  icon={<Sparkles className="h-4 w-4" aria-hidden />}
                  title="No reaction average yet"
                  description="Complete a full reaction run and your fastest average will be saved in this browser."
                />
              }
            >
              {personalBest ? (
                <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-4">
                  <p className="text-3xl font-black tracking-[-0.04em] text-[var(--color-primary-text-strong)]">
                    {formatNumber(personalBest.stats.averageReactionMs)} ms
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                    Best {formatNumber(personalBest.stats.bestReactionMs)} ms ·{" "}
                    {personalBest.stats.roundsCompleted}/
                    {personalBest.stats.totalRounds} rounds ·{" "}
                    {personalBest.stats.inputMethod}
                  </p>
                </div>
              ) : null}
            </ChallengePersonalBestCard>

            <ChallengeHistoryPanel
              title="Last 10 runs"
              icon={
                <History
                  className="h-4 w-4 text-[var(--color-primary-text-strong)]"
                  aria-hidden
                />
              }
              items={history}
              onClear={clearHistory}
              empty={
                <ChallengeEmptyState
                  icon={<History className="h-4 w-4" aria-hidden />}
                  title="No reaction runs yet"
                  description="Your latest reaction averages, round evidence, and quality checks will appear here after a completed test."
                />
              }
              renderItem={(attempt, index) => (
                <div
                  key={attempt.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-[var(--color-text-primary)]">
                      #{index + 1} ·{" "}
                      {formatNumber(attempt.stats.averageReactionMs)} ms
                    </p>
                    <Badge variant="outline">{modeLabel(attempt.mode)}</Badge>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
                    Median {formatNumber(attempt.stats.medianReactionMs)} ms ·{" "}
                    {attempt.stats.consistencyScore}% consistency ·{" "}
                    {attempt.stats.falseStarts} false starts
                  </p>
                </div>
              )}
            />
          </div>
        }
        infoSlot={
          <ChallengeTipList
            eyebrow="Reaction challenge notes"
            tips={[
              {
                icon: (
                  <Medal
                    className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary-text-strong)]"
                    aria-hidden
                  />
                ),
                text: "The saved report keeps every valid round, its hidden wait duration, and the input source used for that reaction.",
              },
              {
                icon: (
                  <Timer
                    className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary-text-strong)]"
                    aria-hidden
                  />
                ),
                text: "The signal appears after a random delay, so users need attention instead of memorizing a fixed rhythm.",
              },
              {
                icon: (
                  <Zap
                    className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary-text-strong)]"
                    aria-hidden
                  />
                ),
                text: "Lower milliseconds are better. Best score compares valid reaction rounds only.",
              },
              {
                icon: (
                  <ShieldCheck
                    className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary-text-strong)]"
                    aria-hidden
                  />
                ),
                text: "Early taps are treated as false starts and do not create fake fast results.",
              },
              {
                icon: (
                  <Info
                    className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary-text-strong)]"
                    aria-hidden
                  />
                ),
                text: "Display latency, keyboard latency, mouse polling, browser timing, and focus can all affect reaction scores.",
              },
              {
                icon: (
                  <Sparkles
                    className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary-text-strong)]"
                    aria-hidden
                  />
                ),
                text: "Use JSON backup before clearing browser data; local history is not synchronized to an account or server.",
              },
            ]}
          />
        }
      />
    </>
  );
}
