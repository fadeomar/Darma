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
  Activity,
  Crown,
  Gauge,
  Hand,
  History,
  Info,
  Keyboard,
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
  ChallengeStatTile,
  ChallengeTipList,
  loadChallengeHistoryWithFallback,
  saveChallengeHistory,
  type ChallengeModeOption,
} from "@/features/tools/challenges";
import { ToolLayoutInteractiveChallenge } from "@/features/tools/layouts";
import { cn } from "@/lib/cn";
import {
  calculateSpacebarStats,
  consistencyLabel,
  createEmptyStats,
  formatNumber,
  isSpacebarEvent,
  modeLabel,
  pointerSource,
  resultInsight,
  scoreLabel,
} from "./spacebarMetrics";
import type { SpacebarAttempt, SpacebarSample, SpacebarStats, SpacebarTestMode } from "./types";

const HISTORY_KEY = "darma:spacebar-counter:history:v1";
const TEST_MODES: ChallengeModeOption<SpacebarTestMode>[] = [
  { value: 5, label: "5s", hint: "Sprint" },
  { value: 10, label: "10s", hint: "Classic" },
  { value: 30, label: "30s", hint: "Focus" },
  { value: 60, label: "60s", hint: "Endurance" },
  { value: "manual", label: "Manual", hint: "Free run" },
];
const COUNTDOWN_STEPS = [3, 2, 1] as const;

type TestStatus = "idle" | "countdown" | "running" | "finished";

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

function metricText(stats: SpacebarStats, mode: SpacebarTestMode) {
  return [
    `Spacebar Counter — ${modeLabel(mode)}`,
    `Score: ${formatNumber(stats.pressesPerSecond, 2)} PPS`,
    `Total presses: ${stats.totalPresses}`,
    `Best burst: ${stats.bestBurst} presses/sec`,
    `Average gap: ${formatNumber(stats.averageGapMs)} ms`,
    `Fastest gap: ${formatNumber(stats.fastestGapMs)} ms`,
    `Consistency: ${stats.consistencyScore}%`,
    `Ignored repeats: ${stats.ignoredRepeats}`,
    `Input: ${stats.inputMethod}`,
  ].join("\n");
}

function normalizeAttempt(value: unknown): SpacebarAttempt | null {
  if (!value || typeof value !== "object") return null;
  const attempt = value as SpacebarAttempt;
  if (!attempt.id || !attempt.stats) return null;

  return {
    ...attempt,
    stats: {
      ...createEmptyStats(),
      ...attempt.stats,
      inputMethod: attempt.stats.inputMethod ?? "None",
      ignoredRepeats: attempt.stats.ignoredRepeats ?? 0,
    },
  };
}

function loadHistory() {
  return loadChallengeHistoryWithFallback<SpacebarAttempt>({
    key: HISTORY_KEY,
    normalize: normalizeAttempt,
    limit: 5,
  });
}

function saveHistory(history: SpacebarAttempt[]) {
  saveChallengeHistory(HISTORY_KEY, history, 5);
}

export default function SpacebarCounterClient() {
  const [status, setStatus] = useState<TestStatus>("idle");
  const [mode, setMode] = useState<SpacebarTestMode>(10);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [stats, setStats] = useState<SpacebarStats>(() => createEmptyStats());
  const [history, setHistory] = useState<SpacebarAttempt[]>([]);

  const prefersReducedMotion = usePrefersReducedMotion();
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const samplesRef = useRef<SpacebarSample[]>([]);
  const ignoredRepeatsRef = useRef(0);
  const startTimeRef = useRef(0);
  const statusRef = useRef<TestStatus>(status);
  const modeRef = useRef<SpacebarTestMode>(mode);
  const countdownTimerRef = useRef<number | null>(null);

  const clearCountdown = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
  }, []);

  const beginRun = useCallback(() => {
    clearCountdown();
    samplesRef.current = [];
    ignoredRepeatsRef.current = 0;
    startTimeRef.current = performance.now();
    statusRef.current = "running";
    setElapsedMs(0);
    setStats(createEmptyStats());
    setStatus("running");
    window.setTimeout(() => arenaRef.current?.focus(), 0);
  }, [clearCountdown]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    return () => clearCountdown();
  }, [clearCountdown]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const finishTest = useCallback((elapsedOverride?: number) => {
    if (statusRef.current !== "running") return;

    const elapsed = Math.max(elapsedOverride ?? performance.now() - startTimeRef.current, 1);
    const finalStats = calculateSpacebarStats(samplesRef.current, elapsed, ignoredRepeatsRef.current);
    const activeMode = modeRef.current;
    const attempt: SpacebarAttempt = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      mode: activeMode,
      stats: finalStats,
    };

    setElapsedMs(elapsed);
    setStats(finalStats);
    setStatus("finished");
    statusRef.current = "finished";
    setHistory((previous) => {
      const next = [attempt, ...previous].slice(0, 5);
      saveHistory(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (status !== "running") return;

    let frame = 0;
    const tick = () => {
      const elapsed = Math.max(performance.now() - startTimeRef.current, 1);

      if (typeof modeRef.current === "number" && elapsed >= modeRef.current * 1000) {
        finishTest(modeRef.current * 1000);
        return;
      }

      setElapsedMs(elapsed);
      setStats(calculateSpacebarStats(samplesRef.current, elapsed, ignoredRepeatsRef.current));
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [finishTest, status]);

  const startTest = useCallback(() => {
    if (statusRef.current === "running" || statusRef.current === "countdown") return;

    if (prefersReducedMotion) {
      beginRun();
      return;
    }

    samplesRef.current = [];
    ignoredRepeatsRef.current = 0;
    setElapsedMs(0);
    setStats(createEmptyStats());
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
  }, [beginRun, prefersReducedMotion]);

  const resetTest = useCallback(() => {
    clearCountdown();
    samplesRef.current = [];
    ignoredRepeatsRef.current = 0;
    statusRef.current = "idle";
    setElapsedMs(0);
    setStats(createEmptyStats());
    setStatus("idle");
  }, [clearCountdown]);

  const recordSample = useCallback((source: SpacebarSample["source"]) => {
    if (statusRef.current !== "running") return;

    const elapsed = Math.max(performance.now() - startTimeRef.current, 1);
    samplesRef.current.push({ time: elapsed, source });
    setElapsedMs(elapsed);
    setStats(calculateSpacebarStats(samplesRef.current, elapsed, ignoredRepeatsRef.current));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSpacebarEvent(event)) return;
      // Always block the browser's default scroll-on-space while this tool is mounted.
      event.preventDefault();

      if (statusRef.current !== "running") return;
      if (event.repeat) {
        ignoredRepeatsRef.current += 1;
        const elapsed = Math.max(performance.now() - startTimeRef.current, 1);
        setStats(calculateSpacebarStats(samplesRef.current, elapsed, ignoredRepeatsRef.current));
        return;
      }

      recordSample("keyboard");
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [recordSample]);

  const registerTap = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (statusRef.current !== "running") return;
    if (!event.isPrimary) return;

    event.preventDefault();
    recordSample(pointerSource(event.pointerType));
  }, [recordSample]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  const progress = useMemo(() => {
    if (status === "countdown") return 0;
    if (typeof mode !== "number") return Math.min(100, ((elapsedMs / 1000) % 10) * 10);
    return Math.min(100, (elapsedMs / (mode * 1000)) * 100);
  }, [elapsedMs, mode, status]);

  const timerLabel = useMemo(() => {
    if (status === "countdown") return countdown ? `${countdown}` : "Go";
    if (typeof mode === "number") {
      return Math.max(0, mode - elapsedMs / 1000).toFixed(1);
    }
    return (elapsedMs / 1000).toFixed(1);
  }, [countdown, elapsedMs, mode, status]);

  const resultText = useMemo(() => metricText(stats, mode), [mode, stats]);
  const activeScoreLabel = scoreLabel(stats.pressesPerSecond);
  const activeInsight = resultInsight(stats);
  const personalBest = useMemo(
    () => history.reduce<SpacebarAttempt | null>((best, attempt) => (!best || attempt.stats.pressesPerSecond > best.stats.pressesPerSecond ? attempt : best), null),
    [history],
  );
  const isRunning = status === "running";
  const isCountdown = status === "countdown";
  const canCopy = stats.totalPresses > 0 && status !== "countdown";

  return (
    <ToolLayoutInteractiveChallenge
      arenaSlot={
        <ChallengeArenaChrome>
          <div
            ref={arenaRef}
            tabIndex={0}
            role="application"
            aria-label="Spacebar counter arena"
            className={cn(
              "relative min-h-[430px] select-none overflow-hidden rounded-[1.45rem] border border-white/50 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.95),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(255,151,65,0.26),transparent_30%),radial-gradient(circle_at_48%_86%,rgba(115,95,255,0.18),transparent_28%),linear-gradient(135deg,rgba(255,248,237,0.97),rgba(246,225,199,0.84)_48%,rgba(232,238,255,0.76))] p-5 outline-none focus:shadow-[var(--focus-ring)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(255,151,65,0.16),transparent_30%),radial-gradient(circle_at_48%_86%,rgba(115,95,255,0.16),transparent_28%),linear-gradient(135deg,rgba(36,29,24,0.96),rgba(54,39,28,0.86)_48%,rgba(30,33,60,0.74))] sm:min-h-[500px] sm:p-7",
              (isRunning || isCountdown) && "touch-none",
            )}
          >
            <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(119,83,45,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(119,83,45,0.08)_1px,transparent_1px)] [background-size:34px_34px] dark:opacity-25" />
            <div
              className={cn(
                "pointer-events-none absolute -left-20 top-24 h-40 w-40 rounded-full bg-[var(--color-primary-soft)] blur-3xl",
                isRunning && "motion-safe:animate-pulse",
              )}
            />
            <div
              className={cn(
                "pointer-events-none absolute -right-16 bottom-20 h-48 w-48 rounded-full bg-[rgba(80,205,190,0.25)] blur-3xl",
                isRunning && "motion-safe:animate-pulse",
              )}
            />

            <div className="relative z-10 flex min-h-[390px] flex-col sm:min-h-[450px]">
              <ChallengeProgressRail
                value={progress}
                label="Spacebar test progress"
                active={isRunning}
                tone={isRunning ? "success" : status === "finished" ? "accent" : "primary"}
                floating={false}
                className="mb-5 h-2 rounded-[var(--radius-full)]"
              />

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <ChallengeStatusPill
                    label={isCountdown ? "Countdown" : isRunning ? "Live" : status === "finished" ? "Finished" : "Ready"}
                    tone={isRunning ? "success" : status === "finished" ? "accent" : isCountdown ? "primary" : "muted"}
                    pulse={isRunning || isCountdown}
                  />
                  <Badge variant="outline">{modeLabel(mode)}</Badge>
                  <Badge variant="outline">{stats.inputMethod}</Badge>
                  {stats.ignoredRepeats > 0 ? <Badge variant="warning">Repeats ignored</Badge> : null}
                </div>
                <div className="rounded-[var(--radius-full)] border border-white/55 bg-white/70 px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)] backdrop-blur dark:border-white/10 dark:bg-white/10">
                  {isCountdown ? "Starts in" : typeof mode === "number" ? "Time left" : "Elapsed"}: {timerLabel}s
                </div>
              </div>

              <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center text-center" aria-live="polite">
                <button
                  type="button"
                  onPointerDown={registerTap}
                  disabled={!isRunning}
                  className={cn(
                    "relative flex min-h-28 w-full max-w-xl items-center justify-center rounded-[2rem] border border-white/60 bg-white/75 px-8 py-8 shadow-[0_26px_80px_rgba(98,68,33,0.2)] outline-none transition focus:shadow-[var(--focus-ring)] disabled:cursor-default disabled:opacity-95 dark:border-white/10 dark:bg-white/10 sm:min-h-36",
                    isRunning && "cursor-pointer active:scale-[0.98] motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.98]",
                  )}
                >
                  <span className={cn("absolute inset-4 rounded-[1.5rem] border border-[var(--color-primary-border)]", isRunning && "motion-safe:animate-pulse")} />
                  <span className="relative flex items-center gap-4">
                    <Keyboard className={cn("h-12 w-12 text-[var(--color-primary)] sm:h-16 sm:w-16", isRunning && "motion-safe:animate-bounce")} aria-hidden />
                    <span className="text-left">
                      <span className="block font-mono text-xs font-black uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">Main key</span>
                      <span className="block text-4xl font-black tracking-[-0.06em] text-[var(--color-text-primary)] sm:text-6xl">SPACE</span>
                    </span>
                  </span>
                </button>

                <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
                  {isCountdown ? "Ready your keyboard" : isRunning ? "Press spacebar repeatedly" : status === "finished" ? "Sprint complete" : "Choose a mode, start, then press spacebar"}
                </p>
                <h2 className="mt-3 text-5xl font-black tracking-[-0.06em] text-[var(--color-text-primary)] sm:text-7xl">
                  {formatNumber(stats.pressesPerSecond, 2)}
                  <span className="ml-2 text-lg tracking-[-0.02em] text-[var(--color-text-tertiary)] sm:text-2xl">PPS</span>
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
                  {isCountdown
                    ? "The arena captures the spacebar when the countdown finishes. Hold events are ignored."
                    : isRunning
                      ? "Tap spacebar as separate presses. Holding the key will not inflate the score. Touch devices can tap the SPACE card as a fallback."
                      : status === "finished"
                        ? activeInsight
                        : "Phase 5 adds a keyboard-based challenge to the reusable Darma fun tools system."}
                </p>

                {status === "finished" ? (
                  <ChallengeResultHighlight
                    title={activeScoreLabel}
                    description={activeInsight}
                    metricLabel="PPS"
                    metricValue={formatNumber(stats.pressesPerSecond, 2)}
                    icon={<Trophy className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />}
                    badges={[
                      { label: "Presses", value: stats.totalPresses, tone: "primary", icon: <Keyboard className="h-3 w-3" aria-hidden /> },
                      { label: "Burst", value: `${stats.bestBurst}/s`, tone: "success", icon: <Zap className="h-3 w-3" aria-hidden /> },
                      { label: "Ignored", value: stats.ignoredRepeats, tone: stats.ignoredRepeats > 0 ? "warning" : "muted", icon: <ShieldCheck className="h-3 w-3" aria-hidden /> },
                    ]}
                    celebrate
                    tone="accent"
                  />
                ) : null}

                <div className="mt-7 flex flex-wrap justify-center gap-2">
                  {!isRunning ? (
                    <Button size="lg" onClick={startTest} disabled={isCountdown} leftIcon={<Play className="h-4 w-4" />}>
                      {isCountdown ? "Starting..." : status === "finished" ? "Run again" : "Start sprint"}
                    </Button>
                  ) : (
                    <Button size="lg" variant="danger" onClick={() => finishTest()} leftIcon={<Square className="h-4 w-4" />}>
                      Stop test
                    </Button>
                  )}
                  <Button size="lg" variant="secondary" onClick={resetTest} leftIcon={<RotateCcw className="h-4 w-4" />}>
                    Reset
                  </Button>
                  <CopyButton size="lg" variant="outline" text={resultText} disabled={!canCopy}>
                    Copy score
                  </CopyButton>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-5">
                <ChallengeSmallMetric label="Presses" value={stats.totalPresses} />
                <ChallengeSmallMetric label="Best burst" value={`${stats.bestBurst}/s`} />
                <ChallengeSmallMetric label="Avg gap" value={`${formatNumber(stats.averageGapMs)} ms`} />
                <ChallengeSmallMetric label="Ignored" value={stats.ignoredRepeats} />
                <ChallengeSmallMetric label="Input" value={stats.inputMethod} />
              </div>
            </div>
          </div>
        </ChallengeArenaChrome>
      }
      controlsSlot={
        <ChallengeCard
          eyebrow="Challenge setup"
          title="Pick your spacebar duration"
          description="Timed modes finish automatically. Manual mode keeps running until you stop it. The classic score counts clean spacebar taps and ignores hold-repeat events."
          badge={<Badge variant="accent">Phase 5 keyboard challenge</Badge>}
        >
          <ChallengeModeSelector options={TEST_MODES} value={mode} disabled={isRunning || isCountdown} onChange={(v) => setMode(v)} />
        </ChallengeCard>
      }
      statsSlot={
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ChallengeStatTile label="Press speed" value={`${formatNumber(stats.pressesPerSecond, 2)}`} hint="presses per second" icon={<Gauge className="h-5 w-5" />} />
          <ChallengeStatTile label="Best burst" value={`${stats.bestBurst}`} hint="best 1s window" icon={<Zap className="h-5 w-5" />} />
          <ChallengeStatTile label="Consistency" value={`${stats.consistencyScore}%`} hint={consistencyLabel(stats.consistencyScore)} icon={<Activity className="h-5 w-5" />} />
          <ChallengeStatTile label="Score mood" value={activeScoreLabel} hint="friendly label" icon={<Trophy className="h-5 w-5" />} />
        </div>
      }
      historySlot={
        <div className="space-y-4">
          <ChallengePersonalBestCard
            title="Best run"
            icon={<Crown className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />}
            badge={personalBest ? <Badge variant="success">{modeLabel(personalBest.mode)}</Badge> : undefined}
            empty={
              <ChallengeEmptyState
                icon={<Sparkles className="h-4 w-4" aria-hidden />}
                title="No spacebar record yet"
                description="Complete one clean keyboard sprint and your best PPS score will live here locally."
              />
            }
          >
            {personalBest ? (
              <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-4">
                <p className="text-3xl font-black tracking-[-0.04em] text-[var(--color-primary)]">{formatNumber(personalBest.stats.pressesPerSecond, 2)} PPS</p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                  {personalBest.stats.totalPresses} presses · {personalBest.stats.bestBurst}/s burst · {personalBest.stats.inputMethod}
                </p>
              </div>
            ) : null}
          </ChallengePersonalBestCard>

          <ChallengeHistoryPanel
            title="Last 5 runs"
            icon={<History className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />}
            items={history}
            onClear={clearHistory}
            empty={
              <ChallengeEmptyState
                icon={<History className="h-4 w-4" aria-hidden />}
                title="No keyboard attempts yet"
                description="After your first run, Darma will show your last five spacebar attempts here."
              />
            }
            renderItem={(attempt, index) => (
              <div key={attempt.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[var(--color-text-primary)]">#{index + 1} · {formatNumber(attempt.stats.pressesPerSecond, 2)} PPS</p>
                  <Badge variant="outline">{modeLabel(attempt.mode)}</Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
                  {attempt.stats.totalPresses} presses · {attempt.stats.bestBurst}/s burst · {attempt.stats.consistencyScore}% consistency · {attempt.stats.ignoredRepeats} ignored
                </p>
              </div>
            )}
          />
        </div>
      }
      infoSlot={
        <ChallengeTipList
          eyebrow="Keyboard challenge notes"
          tips={[
            {
              icon: <Medal className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "Spacebar Counter proves the reusable challenge UI can support keyboard-based fun tools too.",
            },
            {
              icon: <Timer className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "Use 5 seconds for a quick burst, 10 seconds for classic PPS, and longer modes for endurance.",
            },
            {
              icon: <Hand className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "Holding the spacebar creates repeat events in many browsers, so this tool ignores repeats for a fairer score.",
            },
            {
              icon: <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "The tool runs locally and saves only your last five attempts in this browser.",
            },
            {
              icon: <Info className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "Results are best for comparison because keyboard switches, browser timing, and OS settings can affect speed.",
            },
            {
              icon: <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "The system now supports Reaction Time Test too, and can expand to Keyboard Test, Double Click Test, and Aim Trainer.",
            },
          ]}
        />
      }
    />
  );
}
