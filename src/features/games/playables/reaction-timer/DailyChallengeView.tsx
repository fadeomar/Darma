"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { ArrowLeft, CalendarClock, Copy, Crosshair, RotateCcw, Timer, Zap } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { ReactionInsightPanel } from "./ReactionInsightPanel";
import { ReactionSharePanel } from "./ReactionSharePanel";
import { ReactionSessionFlowPanel } from "./ReactionSessionFlowPanel";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { cn } from "@/lib/cn";
import { isGameplayControlTarget, useActiveGameplayGuards, useVisibilityInterruption } from "./reactionRuntimeGuards";
import { CLASSIC_ROUNDS, randomWaitMs } from "./reactionScoring";
import { finalizeTargetHunterRun, pickSpawn, spawnDelayForCombo, targetRadiusForWidth } from "./targetHunterScoring";
import {
  buildDailyClassicResult,
  buildDailyPrecisionResult,
  buildDailyShareText,
  buildDailyTargetHuntResult,
  formatDailyType,
  getDailyChallenge,
  getDailyRank,
  summarizeDailyClassic,
  todayDateKey,
} from "./dailyChallengeScoring";
import { buildDailyInsight } from "./reactionInsights";
import { buildDailyShareResult, type ShareActionKind, type ShareableGameResult } from "./reactionShareCard";
import { dailyResultFlow } from "./reactionSessionFlow";
import type { DailyChallengeDefinition, DailyChallengeResult, DailyChallengeStats } from "./dailyChallengeTypes";
import type { PlayCue } from "./reactionAudio";
import type { Vibrate } from "./reactionHaptics";

type DailyPhase =
  | "lobby"
  | "intro"
  | "countdown"
  | "classic-waiting"
  | "classic-signal"
  | "precision-running"
  | "hunt-playing"
  | "interrupted"
  | "result";

type TargetState = { x: number; y: number; r: number; shownAt: number };


function bestToday(stats: DailyChallengeStats, dateKey: string): DailyChallengeResult | null {
  return stats.dailyChallenges[dateKey]?.bestResult ?? null;
}

function attemptsToday(stats: DailyChallengeStats, dateKey: string): number {
  return stats.dailyChallenges[dateKey]?.attempts ?? 0;
}


function DailyLobby({
  stats,
  hydrated,
  challenge,
  onStart,
  onBack,
}: {
  stats: DailyChallengeStats;
  hydrated: boolean;
  challenge: DailyChallengeDefinition;
  onStart: () => void;
  onBack: () => void;
  onShareAction?: (action: ShareActionKind, result: ShareableGameResult) => void;
}) {
  const record = hydrated ? stats.dailyChallenges[challenge.dateKey] : null;
  const best = hydrated ? bestToday(stats, challenge.dateKey) : null;
  return (
    <div className="rtp-daily-lobby">
      <span className="rtp-eyebrow">Daily Challenge</span>
      <h2 className="rtp-lobby-title">{challenge.title}</h2>
      <p className="rtp-lobby-text">{challenge.description}</p>

      <div className="rtp-daily-goal">
        <span className="rtp-daily-goal-icon" aria-hidden>
          <CalendarClock className="h-5 w-5" />
        </span>
        <span>
          <strong>Today’s goal</strong>
          <span>{challenge.objective}</span>
        </span>
      </div>

      <div className="rtp-daily-badges" aria-label="Daily challenge metadata">
        <Badge variant="soft">{formatDailyType(challenge.type)}</Badge>
        <Badge variant="outline">{challenge.difficulty}</Badge>
        <Badge variant="outline">{challenge.estimatedDuration}</Badge>
        <Badge variant="outline">Local only</Badge>
      </div>

      <div className="rtp-lobby-stats" aria-live="polite">
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Current streak</span>
          <span className="rtp-lobby-stat-value">{hydrated ? `${stats.dailyStreak}` : "—"}</span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Longest streak</span>
          <span className="rtp-lobby-stat-value">{hydrated ? `${stats.longestDailyStreak}` : "—"}</span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Attempts today</span>
          <span className="rtp-lobby-stat-value">{hydrated ? `${record?.attempts ?? 0}` : "—"}</span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Best today</span>
          <span className="rtp-lobby-stat-value">{best ? `${best.score} pts` : "—"}</span>
        </div>
      </div>

      <div className="rtp-lobby-actions">
        <Button size="lg" onClick={onStart} leftIcon={<Zap className="h-5 w-5" aria-hidden />}>
          {record?.completed ? "Play again" : "Start Daily"}
        </Button>
        <Button size="lg" variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}>
          Back to modes
        </Button>
      </div>

      <p className="rtp-daily-local-note">
        Same local date, same challenge. Your streak and leaderboard are stored only on this device.
      </p>
    </div>
  );
}

function DailyResultCard({
  result,
  streak,
  bestScoreBefore,
  onRetry,
  onBack,
  onShareAction,
}: {
  result: DailyChallengeResult;
  streak: number;
  bestScoreBefore: number | null;
  onRetry: () => void;
  onBack: () => void;
  onShareAction?: (action: ShareActionKind, result: ShareableGameResult) => void;
}) {
  const [copied, setCopied] = useState(false);
  const rank = getDailyRank(result.score);
  const isNewBest = bestScoreBefore === null || result.score > bestScoreBefore;
  const insight = buildDailyInsight(result, streak);
  const shareResult = buildDailyShareResult(result, streak);
  const flow = dailyResultFlow({ isNewBest, objectivePassed: result.objectivePassed });

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(buildDailyShareText(result, streak));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="rtp-daily-result">
      <div className="rtp-summary-trophy" aria-hidden>{rank.glyph}</div>
      <span className="rtp-eyebrow">Daily result</span>
      <h2 className="rtp-lobby-title">{result.challengeTitle}</h2>
      <div className="rtp-daily-score">{result.score}</div>
      <div className="rtp-rank-badge">
        <span aria-hidden>{rank.glyph}</span>
        <span>{rank.label}</span>
        {isNewBest ? <span className="rtp-rank-best">Best today</span> : null}
      </div>

      <div className="rtp-precision-grid">
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Primary</span>
          <span className="rtp-summary-stat-value">{result.primaryMetric}</span>
        </div>
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Details</span>
          <span className="rtp-summary-stat-value">{result.secondaryMetric}</span>
        </div>
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Objective</span>
          <span className="rtp-summary-stat-value">{result.objectivePassed ? "Passed" : "Replay to beat it"}</span>
        </div>
      </div>

      <p className="rtp-result-tip">{rank.note} {result.detail}</p>

      <ReactionInsightPanel insight={insight} compact />

      <ReactionSharePanel result={shareResult} onShareAction={onShareAction} compact />

      <ReactionSessionFlowPanel flow={flow} compact />

      <div className="rtp-summary-actions" data-rtp-control="true">
        <Button size="lg" onClick={onRetry} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
          Play again
        </Button>
        <Button size="lg" variant="secondary" onClick={handleCopy} leftIcon={<Copy className="h-5 w-5" aria-hidden />}>
          {copied ? "Copied" : "Copy result"}
        </Button>
        <Button size="lg" variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}>
          Back to modes
        </Button>
      </div>
    </div>
  );
}

function RunningPrecisionTimer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setElapsed(performance.now() - startedAt);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
    };
  }, [startedAt]);
  return <span>{(elapsed / 1000).toFixed(3)}s</span>;
}

export function DailyChallengeView({
  stats,
  hydrated,
  reducedMotion,
  highContrast,
  play,
  vibrate,
  onComplete,
  onRunStart,
  onBack,
  topControls,
  modal,
  onModalBackdrop,
  onShareAction,
}: {
  stats: DailyChallengeStats;
  hydrated: boolean;
  reducedMotion: boolean;
  highContrast?: boolean;
  play: PlayCue;
  vibrate: Vibrate;
  onComplete: (result: DailyChallengeResult) => void;
  onRunStart?: () => void;
  onBack: () => void;
  topControls?: ReactNode;
  modal?: ReactNode;
  onModalBackdrop?: () => void;
  onShareAction?: (action: ShareActionKind, result: ShareableGameResult) => void;
}) {
  const challenge = useMemo(() => getDailyChallenge(todayDateKey()), []);
  const [phase, setPhase] = useState<DailyPhase>("lobby");
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState<DailyChallengeResult | null>(null);
  const [bestBefore, setBestBefore] = useState<number | null>(null);
  const [classicTimes, setClassicTimes] = useState<number[]>([]);
  const [classicEarly, setClassicEarly] = useState<number[]>([]);
  const [classicRoundTick, setClassicRoundTick] = useState(0);
  const [precisionStartedAt, setPrecisionStartedAt] = useState<number | null>(null);
  const [target, setTarget] = useState<TargetState | null>(null);
  const [huntStartedAt, setHuntStartedAt] = useState<number | null>(null);
  const [huntLeftMs, setHuntLeftMs] = useState(challenge.huntDurationMs ?? 20000);
  const [huntHits, setHuntHits] = useState(0);
  const [huntMisses, setHuntMisses] = useState(0);
  const [huntCombo, setHuntCombo] = useState(0);
  const [huntMaxCombo, setHuntMaxCombo] = useState(0);
  const huntTimesRef = useRef<number[]>([]);
  const waitTimerRef = useRef<number | null>(null);
  const signalAtRef = useRef(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const submittedRef = useRef(false);

  const activeDailyPhase =
    phase === "countdown" ||
    phase === "classic-waiting" ||
    phase === "classic-signal" ||
    phase === "precision-running" ||
    phase === "hunt-playing";

  const clearWait = useCallback(() => {
    if (waitTimerRef.current !== null) {
      window.clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearWait, [clearWait]);

  const interruptDaily = useCallback(() => {
    if (!activeDailyPhase) return;
    clearWait();
    submittedRef.current = false;
    setTarget(null);
    setHuntStartedAt(null);
    setPrecisionStartedAt(null);
    setPhase("interrupted");
    play("level.fail");
  }, [activeDailyPhase, clearWait, play]);

  useActiveGameplayGuards(activeDailyPhase);
  useVisibilityInterruption(activeDailyPhase, interruptDaily);

  const startCountdown = useCallback(() => {
    onRunStart?.();
    submittedRef.current = false;
    setResult(null);
    setBestBefore(bestToday(stats, challenge.dateKey)?.score ?? null);
    setClassicTimes([]);
    setClassicEarly([]);
    setClassicRoundTick(0);
    setTarget(null);
    setHuntStartedAt(null);
    setHuntLeftMs(challenge.huntDurationMs ?? 20000);
    setHuntHits(0);
    setHuntMisses(0);
    setHuntCombo(0);
    setHuntMaxCombo(0);
    huntTimesRef.current = [];
    setCountdown(3);
    setPhase("countdown");
  }, [challenge.dateKey, challenge.huntDurationMs, onRunStart, stats]);

  useEffect(() => {
    if (phase !== "countdown") return;
    play("countdown.tick");
    const timer = window.setTimeout(() => {
      setCountdown((current) => {
        if (current > 1) return current - 1;
        if (challenge.type === "classic") setPhase("classic-waiting");
        if (challenge.type === "precision") {
          setPrecisionStartedAt(performance.now());
          setPhase("precision-running");
        }
        if (challenge.type === "target-hunt") {
          setHuntStartedAt(performance.now());
          setPhase("hunt-playing");
        }
        play("level.start");
        vibrate("signal");
        return 0;
      });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [phase, countdown, challenge.type, play, vibrate]);

  useEffect(() => {
    if (phase !== "classic-waiting") return;
    clearWait();
    waitTimerRef.current = window.setTimeout(() => {
      signalAtRef.current = performance.now();
      play("signal.go");
      vibrate("signal");
      setPhase("classic-signal");
    }, randomWaitMs());
    return clearWait;
  }, [phase, classicRoundTick, clearWait, play, vibrate]);

  const completeDaily = useCallback((dailyResult: DailyChallengeResult) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    onComplete(dailyResult);
    setResult(dailyResult);
    setPhase("result");
  }, [onComplete]);

  const finishClassicIfReady = useCallback((times: number[], early: number[]) => {
    if (times.length + early.length < CLASSIC_ROUNDS) return;
    const run = summarizeDailyClassic(times, early);
    completeDaily(buildDailyClassicResult(challenge, run));
  }, [challenge, completeDaily]);

  const handleClassicPress = useCallback(() => {
    if (phase === "classic-waiting") {
      clearWait();
      play("tooEarly.error");
      vibrate("tooEarly");
      setClassicEarly((prev) => {
        const next = [...prev, performance.now()];
        finishClassicIfReady(classicTimes, next);
        if (classicTimes.length + next.length < CLASSIC_ROUNDS) {
          setClassicRoundTick((tick) => tick + 1);
          setPhase("classic-waiting");
        }
        return next;
      });
      return;
    }
    if (phase === "classic-signal") {
      const ms = Math.max(0, Math.round(performance.now() - signalAtRef.current));
      play("result.success");
      vibrate("tap");
      setClassicTimes((prev) => {
        const next = [...prev, ms];
        finishClassicIfReady(next, classicEarly);
        if (next.length + classicEarly.length < CLASSIC_ROUNDS) {
          setClassicRoundTick((tick) => tick + 1);
          setPhase("classic-waiting");
        }
        return next;
      });
    }
  }, [phase, clearWait, play, vibrate, classicTimes, classicEarly, finishClassicIfReady]);

  const handlePrecisionStop = useCallback(() => {
    if (phase !== "precision-running" || precisionStartedAt === null) return;
    const elapsed = performance.now() - precisionStartedAt;
    const dailyPrecisionResult = buildDailyPrecisionResult(challenge, elapsed);
    play(dailyPrecisionResult.precision?.rankId === "perfect" ? "precision.perfect" : "precision.stop");
    vibrate("tap");
    completeDaily(dailyPrecisionResult);
  }, [phase, precisionStartedAt, challenge, completeDaily, play, vibrate]);

  const spawnTarget = useCallback(() => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const r = targetRadiusForWidth(rect.width);
    const spot = pickSpawn(rect.width, rect.height, r, target);
    if (!spot) return;
    setTarget({ x: spot.x, y: spot.y, r, shownAt: performance.now() });
  }, [target]);

  useEffect(() => {
    if (phase !== "hunt-playing") return;
    if (!target) spawnTarget();
  }, [phase, target, spawnTarget]);

  useEffect(() => {
    if (phase !== "hunt-playing" || huntStartedAt === null) return;
    let raf = 0;
    let cancelled = false;
    const duration = challenge.huntDurationMs ?? 20000;
    const tick = () => {
      if (cancelled) return;
      const left = Math.max(0, duration - (performance.now() - huntStartedAt));
      setHuntLeftMs(left);
      if (left <= 0) {
        const finished = finalizeTargetHunterRun({
          hits: huntHits,
          misses: huntMisses,
          hitTimesMs: huntTimesRef.current,
          longestCombo: huntMaxCombo,
          durationMs: duration,
          usedTouch: false,
        });
        completeDaily(buildDailyTargetHuntResult(challenge, finished));
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
    };
  }, [phase, huntStartedAt, huntHits, huntMisses, huntMaxCombo, challenge, completeDaily]);

  const handleHuntPointer = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (phase !== "hunt-playing" || !target) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = Math.hypot(x - target.x, y - target.y) <= target.r;
    if (hit) {
      const hitTime = Math.max(0, Math.round(performance.now() - target.shownAt));
      huntTimesRef.current = [...huntTimesRef.current, hitTime];
      play("target.hit");
      vibrate("tap");
      setHuntHits((n) => n + 1);
      setHuntCombo((combo) => {
        const next = combo + 1;
        setHuntMaxCombo((max) => Math.max(max, next));
        return next;
      });
      setTarget(null);
      window.setTimeout(spawnTarget, reducedMotion ? 50 : spawnDelayForCombo(huntCombo));
    } else {
      play("target.miss");
      vibrate("tooEarly");
      setHuntMisses((n) => n + 1);
      setHuntCombo(0);
    }
  }, [phase, target, play, vibrate, spawnTarget, reducedMotion, huntCombo]);

  const handleStagePointer = (event: PointerEvent<HTMLDivElement>) => {
    if (isGameplayControlTarget(event.target)) return;
    event.preventDefault();
    if (phase === "classic-waiting" || phase === "classic-signal") handleClassicPress();
    if (phase === "precision-running") handlePrecisionStop();
    if (phase === "hunt-playing") handleHuntPointer(event);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (typeof document !== "undefined" && document.fullscreenElement) return;
        event.preventDefault();
        onBack();
      }
      if (event.code === "Space" || event.code === "Enter") {
        if (phase === "lobby") return;
        event.preventDefault();
        if (phase === "intro") startCountdown();
        if (phase === "classic-waiting" || phase === "classic-signal") handleClassicPress();
        if (phase === "precision-running") handlePrecisionStop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, startCountdown, handleClassicPress, handlePrecisionStop, onBack]);

  return (
    <div
      ref={stageRef}
      className={cn("rtp-stage rtp-stage--idle rtp-daily-shell", activeDailyPhase && "rtp-stage--active-run", highContrast && "rtp-daily-shell--contrast")}
      data-rtp-active-stage={activeDailyPhase ? "true" : undefined}
      onPointerDown={handleStagePointer}
    >
      {topControls ? (
        <div
          className="rtp-stage-top"
          data-rtp-control="true"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {topControls}
        </div>
      ) : null}

      <div className="rtp-stage-overlay">
        {phase === "lobby" ? (
          <DailyLobby stats={stats} hydrated={hydrated} challenge={challenge} onStart={() => setPhase("intro")} onBack={onBack} />
        ) : phase === "intro" ? (
          <div className="rtp-daily-intro">
            <span className="rtp-eyebrow">{formatDailyType(challenge.type)}</span>
            <h2 className="rtp-lobby-title">{challenge.title}</h2>
            <p className="rtp-lobby-text">{challenge.objective}</p>
            <div className="rtp-daily-badges">
              <Badge variant="soft">Seeded for {challenge.dateKey}</Badge>
              <Badge variant="outline">{challenge.estimatedDuration}</Badge>
            </div>
            <div className="rtp-lobby-actions">
              <Button size="lg" onClick={startCountdown} leftIcon={<Zap className="h-5 w-5" aria-hidden />}>
                Start challenge
              </Button>
              <Button size="lg" variant="ghost" onClick={() => setPhase("lobby")} leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}>
                Daily lobby
              </Button>
            </div>
          </div>
        ) : phase === "countdown" ? (
          <div className="rtp-daily-play">
            <span className="rtp-eyebrow">Daily Challenge</span>
            <div className="rtp-instruction rtp-instruction--countdown" aria-live="assertive">{countdown}</div>
            <p className="rtp-play-sub">Get ready — today’s objective starts after the countdown.</p>
          </div>
        ) : phase === "classic-waiting" || phase === "classic-signal" ? (
          <div className="rtp-daily-play">
            <span className="rtp-eyebrow">Classic Daily · {classicTimes.length + classicEarly.length + 1}/{CLASSIC_ROUNDS}</span>
            <div className={cn("rtp-instruction", phase === "classic-signal" ? "rtp-instruction--go" : "rtp-instruction--waiting")} aria-live="assertive">
              {phase === "classic-signal" ? "GO — tap now" : "Wait for the signal"}
            </div>
            <p className="rtp-play-sub">Goal: {challenge.objective}</p>
          </div>
        ) : phase === "precision-running" && precisionStartedAt !== null ? (
          <div className="rtp-daily-play">
            <span className="rtp-eyebrow">Precision Daily</span>
            <div className="rtp-daily-live-timer"><RunningPrecisionTimer startedAt={precisionStartedAt} /></div>
            <p className="rtp-play-sub">Target {challenge.targetMs ? `${(challenge.targetMs / 1000).toFixed(3)}s` : "—"} · tap to stop.</p>
          </div>
        ) : phase === "hunt-playing" ? (
          <div className="rtp-daily-hunt">
            <div className="rtp-th-hud rtp-daily-hud" data-rtp-control="true">
              <span><Timer className="h-4 w-4" aria-hidden /> {(huntLeftMs / 1000).toFixed(1)}s</span>
              <span><Crosshair className="h-4 w-4" aria-hidden /> {huntHits} hits</span>
              <span>{huntMisses} misses</span>
              <span>combo {huntCombo}</span>
            </div>
            {target ? (
              <span
                className="rtp-daily-target"
                style={{ left: target.x - target.r, top: target.y - target.r, width: target.r * 2, height: target.r * 2 }}
                aria-hidden
              />
            ) : null}
            <p className="rtp-daily-hunt-note">Tap the target. Outside taps count as misses.</p>
          </div>
        ) : phase === "interrupted" ? (
          <div className="rtp-run-interrupted" role="status" aria-live="assertive">
            <span className="rtp-eyebrow">Daily run interrupted</span>
            <h2 className="rtp-pause-title">Timing paused for fairness</h2>
            <p className="rtp-play-sub">The tab or app changed while today’s challenge was active, so this attempt was not saved.</p>
            <div className="rtp-summary-actions" data-rtp-control="true">
              <Button size="lg" onClick={startCountdown}>Try again</Button>
              <Button size="lg" variant="ghost" onClick={() => setPhase("lobby")}>Daily lobby</Button>
            </div>
          </div>
        ) : phase === "result" && result ? (
          <DailyResultCard result={result} streak={stats.dailyStreak} bestScoreBefore={bestBefore} onRetry={startCountdown} onBack={onBack} onShareAction={onShareAction} />
        ) : null}
      </div>

      <span className="sr-only" aria-live="polite">
        Daily challenge phase: {phase}. {result ? `Score ${result.score}` : ""}
      </span>

      {modal ? (
        <div className="rtp-modal-backdrop" data-rtp-control="true" onPointerDown={onModalBackdrop} onClick={onModalBackdrop}>
          <div onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
            {modal}
          </div>
        </div>
      ) : null}
    </div>
  );
}
