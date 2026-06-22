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
  calculateClickStats,
  consistencyLabel,
  createEmptyStats,
  formatNumber,
  modeLabel,
  pointerSource,
  resultInsight,
  scoreLabel,
} from "./clickMetrics";
import type { ClickAttempt, ClickSample, ClickStats, ClickTestMode } from "./types";

const HISTORY_KEY = "darma:click-speed-test:history:v1";
const TEST_MODES: ChallengeModeOption<ClickTestMode>[] = [
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

function metricText(stats: ClickStats, mode: ClickTestMode) {
  return [
    `Click Speed Test — ${modeLabel(mode)}`,
    `Score: ${formatNumber(stats.clicksPerSecond, 2)} CPS`,
    `Total clicks: ${stats.totalClicks}`,
    `Best burst: ${stats.bestBurst} clicks/sec`,
    `Average gap: ${formatNumber(stats.averageGapMs)} ms`,
    `Fastest gap: ${formatNumber(stats.fastestGapMs)} ms`,
    `Consistency: ${stats.consistencyScore}%`,
    `Input: ${stats.inputMethod}`,
  ].join("\n");
}

function normalizeAttempt(value: unknown): ClickAttempt | null {
  if (!value || typeof value !== "object") return null;
  const attempt = value as ClickAttempt;
  if (!attempt.id || !attempt.stats) return null;

  return {
    ...attempt,
    stats: {
      ...createEmptyStats(),
      ...attempt.stats,
      inputMethod: attempt.stats.inputMethod ?? "None",
    },
  };
}

function loadHistory() {
  return loadChallengeHistoryWithFallback<ClickAttempt>({
    key: HISTORY_KEY,
    normalize: normalizeAttempt,
    limit: 5,
  });
}

function saveHistory(history: ClickAttempt[]) {
  saveChallengeHistory(HISTORY_KEY, history, 5);
}

export default function ClickSpeedTestClient() {
  const [status, setStatus] = useState<TestStatus>("idle");
  const [mode, setMode] = useState<ClickTestMode>(10);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [stats, setStats] = useState<ClickStats>(() => createEmptyStats());
  const [history, setHistory] = useState<ClickAttempt[]>([]);

  const prefersReducedMotion = usePrefersReducedMotion();
  const targetRef = useRef<HTMLButtonElement | null>(null);
  const samplesRef = useRef<ClickSample[]>([]);
  const startTimeRef = useRef(0);
  const statusRef = useRef<TestStatus>(status);
  const modeRef = useRef<ClickTestMode>(mode);
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
    startTimeRef.current = performance.now();
    statusRef.current = "running";
    setElapsedMs(0);
    setStats(createEmptyStats());
    setStatus("running");
    window.setTimeout(() => targetRef.current?.focus(), 0);
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
    const finalStats = calculateClickStats(samplesRef.current, elapsed);
    const activeMode = modeRef.current;
    const attempt: ClickAttempt = {
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
      setStats(calculateClickStats(samplesRef.current, elapsed));
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
    setElapsedMs(0);
    setStats(createEmptyStats());
    setCountdown(COUNTDOWN_STEPS[0]);
    setStatus("countdown");
    statusRef.current = "countdown";
    window.setTimeout(() => targetRef.current?.focus(), 0);

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
    statusRef.current = "idle";
    setElapsedMs(0);
    setStats(createEmptyStats());
    setStatus("idle");
  }, [clearCountdown]);

  const registerClick = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (statusRef.current !== "running") return;
    if (!event.isPrimary) return;

    event.preventDefault();
    const elapsed = Math.max(performance.now() - startTimeRef.current, 1);
    samplesRef.current.push({ time: elapsed, source: pointerSource(event.pointerType) });
    setElapsedMs(elapsed);
    setStats(calculateClickStats(samplesRef.current, elapsed));
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
  const activeScoreLabel = scoreLabel(stats.clicksPerSecond);
  const activeInsight = resultInsight(stats);
  const personalBest = useMemo(
    () => history.reduce<ClickAttempt | null>((best, attempt) => (!best || attempt.stats.clicksPerSecond > best.stats.clicksPerSecond ? attempt : best), null),
    [history],
  );
  const isRunning = status === "running";
  const isCountdown = status === "countdown";
  const canCopy = stats.totalClicks > 0 && status !== "countdown";

  return (
    <ToolLayoutInteractiveChallenge
      arenaSlot={
        <ChallengeArenaChrome>
          <div
            role="application"
            aria-label="Click speed test arena"
            className={cn(
              "relative min-h-[430px] select-none overflow-hidden rounded-[1.45rem] border border-white/50 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.95),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(255,151,65,0.28),transparent_30%),radial-gradient(circle_at_50%_86%,rgba(80,205,190,0.28),transparent_28%),linear-gradient(135deg,rgba(255,248,237,0.96),rgba(246,225,199,0.82)_48%,rgba(228,236,255,0.72))] p-5 outline-none dark:border-white/10 dark:bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(255,151,65,0.16),transparent_30%),radial-gradient(circle_at_50%_86%,rgba(80,205,190,0.16),transparent_28%),linear-gradient(135deg,rgba(36,29,24,0.96),rgba(54,39,28,0.86)_48%,rgba(30,33,60,0.72))] sm:min-h-[500px] sm:p-7",
              (isRunning || isCountdown) && "touch-none",
            )}
          >
            <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(119,83,45,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(119,83,45,0.08)_1px,transparent_1px)] [background-size:38px_38px]" />
            <ChallengeProgressRail
              value={progress}
              label="Click test progress"
              active={isRunning}
              tone={isRunning ? "success" : status === "finished" ? "accent" : "primary"}
            />
            {isRunning ? (
              <div className="pointer-events-none absolute inset-x-10 top-10 h-40 rounded-full bg-[radial-gradient(circle,rgba(255,151,65,0.26),transparent_70%)] blur-2xl motion-safe:animate-pulse" />
            ) : null}

            {isCountdown ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(255,248,237,0.72)] backdrop-blur-sm dark:bg-[rgba(20,17,14,0.72)]" aria-live="assertive">
                <div className="text-center">
                  <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-text-tertiary)]">Get ready</p>
                  <div className="mt-4 text-8xl font-black tracking-[-0.08em] text-[var(--color-primary)] motion-safe:animate-ping sm:text-9xl">
                    {countdown}
                  </div>
                  <p className="mt-4 text-sm font-bold text-[var(--color-text-secondary)]">Put your pointer on the click target.</p>
                </div>
              </div>
            ) : null}

            <div className="relative z-10 flex min-h-[380px] flex-col justify-between gap-6 sm:min-h-[450px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="soft">Click Sprint</Badge>
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
                <button
                  ref={targetRef}
                  type="button"
                  onPointerDown={registerClick}
                  disabled={!isRunning}
                  className={cn(
                    "relative flex h-36 w-36 items-center justify-center rounded-[2.2rem] border border-white/60 bg-white/75 shadow-[0_26px_80px_rgba(98,68,33,0.2)] outline-none transition focus:shadow-[var(--focus-ring)] disabled:cursor-default disabled:opacity-95 dark:border-white/10 dark:bg-white/10 sm:h-44 sm:w-44",
                    isRunning && "cursor-pointer active:scale-95 motion-safe:hover:scale-[1.03] motion-safe:active:scale-95",
                  )}
                >
                  <span className={cn("absolute inset-4 rounded-[1.65rem] border border-[var(--color-primary-border)]", isRunning && "motion-safe:animate-pulse")} />
                  <Mouse className={cn("h-14 w-14 text-[var(--color-primary)] sm:h-20 sm:w-20", isRunning && "motion-safe:animate-bounce")} aria-hidden />
                </button>

                <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
                  {isCountdown ? "Ready your fingers" : isRunning ? "Click the target" : status === "finished" ? "Sprint complete" : "Choose a mode, start, then click the target"}
                </p>
                <h2 className="mt-3 text-5xl font-black tracking-[-0.06em] text-[var(--color-text-primary)] sm:text-7xl">
                  {formatNumber(stats.clicksPerSecond, 2)}
                  <span className="ml-2 text-lg tracking-[-0.02em] text-[var(--color-text-tertiary)] sm:text-2xl">CPS</span>
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
                  {isCountdown
                    ? "The target activates when the countdown finishes."
                    : isRunning
                      ? "Every primary pointer press inside the target is counted without selecting text or moving the page."
                      : status === "finished"
                        ? activeInsight
                        : "Phase 4 adds the second interactive tool using the reusable Darma challenge system."}
                </p>

                {status === "finished" ? (
                  <ChallengeResultHighlight
                    title={activeScoreLabel}
                    description={activeInsight}
                    metricLabel="CPS"
                    metricValue={formatNumber(stats.clicksPerSecond, 2)}
                    icon={<Trophy className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />}
                    badges={[
                      { label: "Clicks", value: stats.totalClicks, tone: "primary", icon: <Mouse className="h-3 w-3" aria-hidden /> },
                      { label: "Burst", value: `${stats.bestBurst}/s`, tone: "success", icon: <Zap className="h-3 w-3" aria-hidden /> },
                      { label: "Consistency", value: `${stats.consistencyScore}%`, tone: "accent", icon: <Activity className="h-3 w-3" aria-hidden /> },
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
                <ChallengeSmallMetric label="Clicks" value={stats.totalClicks} />
                <ChallengeSmallMetric label="Best burst" value={`${stats.bestBurst}/s`} />
                <ChallengeSmallMetric label="Avg gap" value={`${formatNumber(stats.averageGapMs)} ms`} />
                <ChallengeSmallMetric label="Fastest gap" value={`${formatNumber(stats.fastestGapMs)} ms`} />
                <ChallengeSmallMetric label="Input" value={stats.inputMethod} />
              </div>
            </div>
          </div>
        </ChallengeArenaChrome>
      }
      controlsSlot={
        <ChallengeCard
          eyebrow="Challenge setup"
          title="Pick your click duration"
          description="Timed modes finish automatically. Manual mode keeps running until you stop it. The target supports mouse, touch, and pen pointer input."
          badge={<Badge variant="accent">Phase 4 expansion</Badge>}
        >
          <ChallengeModeSelector options={TEST_MODES} value={mode} disabled={isRunning || isCountdown} onChange={(v) => setMode(v)} />
        </ChallengeCard>
      }
      statsSlot={
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ChallengeStatTile label="Click speed" value={`${formatNumber(stats.clicksPerSecond, 2)}`} hint="clicks per second" icon={<Gauge className="h-5 w-5" />} />
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
                title="No click record yet"
                description="Finish one sprint and your strongest CPS result will stay here locally."
              />
            }
          >
            {personalBest ? (
              <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-4">
                <p className="text-3xl font-black tracking-[-0.04em] text-[var(--color-primary)]">{formatNumber(personalBest.stats.clicksPerSecond, 2)} CPS</p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                  {personalBest.stats.totalClicks} clicks · {personalBest.stats.bestBurst}/s burst · {personalBest.stats.inputMethod}
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
                title="No click attempts yet"
                description="Your last five click sprints will appear here after the first completed run."
              />
            }
            renderItem={(attempt, index) => (
              <div key={attempt.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[var(--color-text-primary)]">#{index + 1} · {formatNumber(attempt.stats.clicksPerSecond, 2)} CPS</p>
                  <Badge variant="outline">{modeLabel(attempt.mode)}</Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
                  {attempt.stats.totalClicks} clicks · {attempt.stats.bestBurst}/s burst · {attempt.stats.consistencyScore}% consistency · {attempt.stats.inputMethod}
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
              text: "Click Speed Test proves the reusable challenge UI can support more than one fun tool.",
            },
            {
              icon: <Timer className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "Use 5 seconds for quick sprints, 10 seconds for classic CPS, and longer modes for endurance.",
            },
            {
              icon: <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "The tool runs locally and saves only your last five attempts in this browser.",
            },
            {
              icon: <Info className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "Results are best for comparison because mouse switches, touchscreens, browser timing, and device refresh rate can affect CPS.",
            },
            {
              icon: <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />,
              text: "This same pattern now supports Spacebar Counter and Reaction Time Test, and can expand to Keyboard Test next.",
            },
          ]}
        />
      }
    />
  );
}
