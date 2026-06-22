"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
  type WheelEvent,
} from "react";
import {
  Activity,
  Crown,
  Gauge,
  History,
  Info,
  Medal,
  Mouse,
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
  calculateScrollStats,
  createEmptyStats,
  formatNumber,
  modeLabel,
  normalizeWheelDelta,
  resultInsight,
  scoreLabel,
  smoothnessLabel,
} from "./scrollMetrics";
import type { ScrollAttempt, ScrollSample, ScrollStats, ScrollTestMode } from "./types";

const HISTORY_KEY = "darma:mouse-scroll-test:history:v2";
const LEGACY_HISTORY_KEY = "darma:mouse-scroll-test:history:v1";
const TEST_MODES: ChallengeModeOption<ScrollTestMode>[] = [
  { value: 5, label: "5s", hint: "Quick" },
  { value: 10, label: "10s", hint: "Quick" },
  { value: 30, label: "30s", hint: "Balanced" },
  { value: 60, label: "60s", hint: "Endurance" },
  { value: "manual", label: "Manual", hint: "Free run" },
];
const COUNTDOWN_STEPS = [3, 2, 1] as const;

type TestStatus = "idle" | "countdown" | "running" | "finished";

type TouchPoint = {
  x: number;
  y: number;
};

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

function metricText(stats: ScrollStats, mode: ScrollTestMode) {
  return [
    `Mouse Scroll Test — ${modeLabel(mode)}`,
    `Score: ${formatNumber(stats.totalDistance)} px`,
    `Average speed: ${formatNumber(stats.pixelsPerSecond)} px/s`,
    `Best burst: ${formatNumber(stats.bestBurst)} px/s`,
    `Events: ${stats.eventsCount}`,
    `Events/sec: ${stats.eventsPerSecond}`,
    `Input: ${stats.inputMethod}`,
    `Direction: ${stats.direction}`,
    `Smoothness: ${stats.smoothnessScore}%`,
  ].join("\n");
}

function normalizeAttempt(value: unknown): ScrollAttempt | null {
  if (!value || typeof value !== "object") return null;
  const attempt = value as ScrollAttempt;
  if (!attempt.id || !attempt.stats) return null;

  return {
    ...attempt,
    stats: {
      ...createEmptyStats(),
      ...attempt.stats,
      inputMethod: attempt.stats.inputMethod ?? "Wheel",
    },
  };
}

function loadHistory() {
  return loadChallengeHistoryWithFallback<ScrollAttempt>({
    key: HISTORY_KEY,
    fallbackKeys: [LEGACY_HISTORY_KEY],
    normalize: normalizeAttempt,
    limit: 5,
  });
}

function saveHistory(history: ScrollAttempt[]) {
  saveChallengeHistory(HISTORY_KEY, history, 5);
}

export default function MouseScrollTestClient() {
  const [status, setStatus] = useState<TestStatus>("idle");
  const [mode, setMode] = useState<ScrollTestMode>(10);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [stats, setStats] = useState<ScrollStats>(() => createEmptyStats());
  const [history, setHistory] = useState<ScrollAttempt[]>([]);

  const prefersReducedMotion = usePrefersReducedMotion();
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const samplesRef = useRef<ScrollSample[]>([]);
  const startTimeRef = useRef(0);
  const statusRef = useRef<TestStatus>(status);
  const modeRef = useRef<ScrollTestMode>(mode);
  const countdownTimerRef = useRef<number | null>(null);
  const touchPointRef = useRef<TouchPoint | null>(null);

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
    touchPointRef.current = null;
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
    const finalStats = calculateScrollStats(samplesRef.current, elapsed);
    const activeMode = modeRef.current;
    const attempt: ScrollAttempt = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      mode: activeMode,
      stats: finalStats,
    };

    touchPointRef.current = null;
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
      setStats(calculateScrollStats(samplesRef.current, elapsed));
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
    touchPointRef.current = null;
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
    touchPointRef.current = null;
    statusRef.current = "idle";
    setElapsedMs(0);
    setStats(createEmptyStats());
    setStatus("idle");
  }, [clearCountdown]);

  const pushSample = useCallback((sample: ScrollSample) => {
    samplesRef.current.push(sample);
    setElapsedMs(sample.time);
    setStats(calculateScrollStats(samplesRef.current, sample.time));
  }, []);

  useEffect(() => {
    // Non-passive window listener so we can call preventDefault during an active test.
    // This blocks the browser's default page-scroll while the sprint is running.
    const blockScroll = (event: Event) => {
      if (statusRef.current === "running" || statusRef.current === "countdown" || statusRef.current === "finished") {
        event.preventDefault();
      }
    };
    window.addEventListener("wheel", blockScroll, { passive: false });
    return () => window.removeEventListener("wheel", blockScroll as EventListener);
  }, []);

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (statusRef.current !== "running") return;

      event.preventDefault();
      const delta = normalizeWheelDelta(event.nativeEvent);
      if (Math.abs(delta.dx) < 0.5 && Math.abs(delta.dy) < 0.5) return;

      const elapsed = Math.max(performance.now() - startTimeRef.current, 1);
      pushSample({ time: elapsed, dx: delta.dx, dy: delta.dy, source: "wheel" });
    },
    [pushSample],
  );

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (statusRef.current !== "running") return;
    const touch = event.touches[0];
    if (!touch) return;
    touchPointRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (statusRef.current !== "running" || !touchPointRef.current) return;
      const touch = event.touches[0];
      if (!touch) return;
      if (event.nativeEvent.cancelable) event.preventDefault();

      const previous = touchPointRef.current;
      const dx = previous.x - touch.clientX;
      const dy = previous.y - touch.clientY;
      touchPointRef.current = { x: touch.clientX, y: touch.clientY };
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

      const elapsed = Math.max(performance.now() - startTimeRef.current, 1);
      pushSample({ time: elapsed, dx, dy, source: "touch" });
    },
    [pushSample],
  );

  const handleTouchEnd = useCallback(() => {
    touchPointRef.current = null;
  }, []);

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
  const activeScoreLabel = scoreLabel(stats.pixelsPerSecond);
  const activeInsight = resultInsight(stats);
  const personalBest = useMemo(
    () => history.reduce<ScrollAttempt | null>((best, attempt) => (!best || attempt.stats.pixelsPerSecond > best.stats.pixelsPerSecond ? attempt : best), null),
    [history],
  );
  const isRunning = status === "running";
  const isCountdown = status === "countdown";
  const canCopy = stats.eventsCount > 0 && status !== "countdown";

  return (
    <ToolLayoutInteractiveChallenge
      arenaSlot={
        <ChallengeArenaChrome>
          <div
            ref={arenaRef}
            role="application"
            aria-label="Mouse scroll test arena"
            tabIndex={0}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={cn(
              "relative min-h-[430px] select-none overflow-hidden rounded-[1.45rem] border border-white/50 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.95),transparent_26%),radial-gradient(circle_at_88%_15%,rgba(255,181,77,0.28),transparent_28%),linear-gradient(135deg,rgba(255,248,237,0.96),rgba(246,225,199,0.82)_48%,rgba(220,239,235,0.72))] p-5 outline-none transition focus:shadow-[var(--focus-ring)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_88%_15%,rgba(255,181,77,0.16),transparent_28%),linear-gradient(135deg,rgba(36,29,24,0.96),rgba(54,39,28,0.86)_48%,rgba(22,52,50,0.65))] sm:min-h-[500px] sm:p-7",
              (isRunning || isCountdown) && "cursor-ns-resize touch-none",
            )}
          >
            <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(119,83,45,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(119,83,45,0.08)_1px,transparent_1px)] [background-size:38px_38px]" />
            <ChallengeProgressRail
              value={progress}
              label="Scroll test progress"
              active={isRunning}
              tone={isRunning ? "success" : status === "finished" ? "accent" : "primary"}
            />
            {isRunning ? (
              <div className="pointer-events-none absolute inset-x-10 top-10 h-40 rounded-full bg-[radial-gradient(circle,rgba(255,151,65,0.24),transparent_70%)] blur-2xl motion-safe:animate-pulse" />
            ) : null}

            {isCountdown ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(255,248,237,0.72)] backdrop-blur-sm dark:bg-[rgba(20,17,14,0.72)]" aria-live="assertive">
                <div className="text-center">
                  <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-text-tertiary)]">Get ready</p>
                  <div className="mt-4 text-8xl font-black tracking-[-0.08em] text-[var(--color-primary)] motion-safe:animate-ping sm:text-9xl">
                    {countdown}
                  </div>
                  <p className="mt-4 text-sm font-bold text-[var(--color-text-secondary)]">Put your pointer inside the arena.</p>
                </div>
              </div>
            ) : null}

            <div className="relative z-10 flex min-h-[380px] flex-col justify-between gap-6 sm:min-h-[450px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="soft">Wheel Sprint</Badge>
                  <ChallengeStatusPill
                    label={isRunning ? "Running" : status === "finished" ? "Finished" : isCountdown ? "Countdown" : "Ready"}
                    tone={isRunning ? "success" : status === "finished" ? "accent" : isCountdown ? "primary" : "muted"}
                    pulse={isRunning || isCountdown}
                  />
                  <Badge variant="outline">{modeLabel(mode)}</Badge>
                  <Badge variant="outline">{stats.inputMethod}</Badge>
                </div>
                <div className="rounded-[var(--radius-full)] border border-white/55 bg-white/70 px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)] backdrop-blur dark:border-white/10 dark:bg-white/10">
                  {isCountdown ? "Starts in" : typeof mode === "number" ? "Time left" : "Elapsed"}: {timerLabel}s
                </div>
              </div>

              <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center text-center" aria-live="polite">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/55 bg-white/70 shadow-[0_24px_70px_rgba(98,68,33,0.18)] backdrop-blur dark:border-white/10 dark:bg-white/10 sm:h-36 sm:w-36">
                  <div className={cn("absolute inset-3 rounded-[1.5rem] border border-[var(--color-primary-border)]", isRunning && "motion-safe:animate-pulse")} />
                  <Mouse className={cn("h-12 w-12 text-[var(--color-primary)] sm:h-16 sm:w-16", isRunning && "motion-safe:animate-bounce")} aria-hidden />
                </div>

                <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
                  {isCountdown ? "Ready your hand" : isRunning ? "Scroll inside the arena" : status === "finished" ? "Sprint complete" : "Choose a mode, start, then scroll here"}
                </p>
                <h2 className="mt-3 text-5xl font-black tracking-[-0.06em] text-[var(--color-text-primary)] sm:text-7xl">
                  {formatNumber(stats.pixelsPerSecond)}
                  <span className="ml-2 text-lg tracking-[-0.02em] text-[var(--color-text-tertiary)] sm:text-2xl">px/s</span>
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
                  {isCountdown
                    ? "The page is locked to this challenge area when the run begins."
                    : isRunning
                      ? "Mouse wheel and touch movement are captured here without moving the page."
                      : status === "finished"
                        ? activeInsight
                        : "The shared challenge system now powers both scroll and click speed tools with Darma-friendly UI polish."}
                </p>

                {status === "finished" ? (
                  <ChallengeResultHighlight
                    title={activeScoreLabel}
                    description={activeInsight}
                    metricLabel="Average"
                    metricValue={`${formatNumber(stats.pixelsPerSecond)} px/s`}
                    icon={<Trophy className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />}
                    badges={[
                      { label: "Distance", value: `${formatNumber(stats.totalDistance)} px`, tone: "primary", icon: <Gauge className="h-3 w-3" aria-hidden /> },
                      { label: "Burst", value: `${formatNumber(stats.bestBurst)} px/s`, tone: "success", icon: <Zap className="h-3 w-3" aria-hidden /> },
                      { label: "Smooth", value: `${stats.smoothnessScore}%`, tone: "accent", icon: <Activity className="h-3 w-3" aria-hidden /> },
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
                <ChallengeSmallMetric label="Distance" value={`${formatNumber(stats.totalDistance)} px`} />
                <ChallengeSmallMetric label="Best burst" value={`${formatNumber(stats.bestBurst)} px/s`} />
                <ChallengeSmallMetric label="Events/s" value={stats.eventsPerSecond} />
                <ChallengeSmallMetric label="Input" value={stats.inputMethod} />
                <ChallengeSmallMetric label="Direction" value={stats.direction} />
              </div>
            </div>
          </div>
        </ChallengeArenaChrome>
      }
      controlsSlot={
        <ChallengeCard
          eyebrow="Challenge setup"
          title="Pick your sprint duration"
          description="Timed modes finish automatically. Manual mode keeps running until you stop it. Touch movement works on mobile and touchpads inside the arena."
          badge={<Badge variant="accent">Challenge system</Badge>}
        >
          <ChallengeModeSelector options={TEST_MODES} value={mode} disabled={isRunning || isCountdown} onChange={(v) => setMode(v)} />
        </ChallengeCard>
      }
      statsSlot={
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ChallengeStatTile label="Average speed" value={`${formatNumber(stats.pixelsPerSecond)}`} hint="pixels per second" icon={<Gauge className="h-5 w-5" />} />
          <ChallengeStatTile label="Best burst" value={`${formatNumber(stats.bestBurst)}`} hint="fastest 0.5s window" icon={<Zap className="h-5 w-5" />} />
          <ChallengeStatTile label="Smoothness" value={`${stats.smoothnessScore}%`} hint={smoothnessLabel(stats.smoothnessScore)} icon={<Activity className="h-5 w-5" />} />
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
                title="No scroll record yet"
                description="Run one sprint and Darma will pin your best scroll speed here for this browser."
              />
            }
          >
            {personalBest ? (
              <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-4">
                <p className="text-3xl font-black tracking-[-0.04em] text-[var(--color-primary)]">{formatNumber(personalBest.stats.pixelsPerSecond)} px/s</p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                  {formatNumber(personalBest.stats.totalDistance)} px · {personalBest.stats.eventsCount} events · {personalBest.stats.inputMethod}
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
                title="Your last runs will appear here"
                description="Finish a scroll sprint to unlock a local timeline of your last five attempts."
              />
            }
            renderItem={(attempt, index) => (
              <div key={attempt.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[var(--color-text-primary)]">#{index + 1} · {formatNumber(attempt.stats.pixelsPerSecond)} px/s</p>
                  <Badge variant="outline">{modeLabel(attempt.mode)}</Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
                  {formatNumber(attempt.stats.totalDistance)} px · {attempt.stats.eventsCount} events · {attempt.stats.inputMethod} · {attempt.stats.direction}
                </p>
              </div>
            )}
          />
        </div>
      }
      infoSlot={
        <ChallengeTipList
          eyebrow="Fun tools system"
          tips={[
            {
              icon: <Medal className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "Challenge UI pieces are reusable and now power more than one interactive tool.",
            },
            {
              icon: <Timer className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "Countdown, mode selection, local history, stats, and tips now follow one shared pattern.",
            },
            {
              icon: <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "Motion-heavy effects still use motion-safe classes and stay gentle for Darma’s calm identity.",
            },
            {
              icon: <Info className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "Results are best for comparison because OS, browser, wheel settings, and touchpads report scroll deltas differently.",
            },
            {
              icon: <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "This foundation now supports Click Speed Test and can expand to Spacebar Counter, Reaction Time Test, and more fun tools.",
            },
          ]}
        />
      }
    />
  );
}
