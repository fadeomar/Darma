"use client";

/**
 * Precision Timer mode overlays, rendered inside the shared arena.
 *
 * States: lobby → countdown → running → result. The running clock is displayed
 * with requestAnimationFrame for smoothness, but the authoritative measurement
 * is taken from performance.now() in `useReactionGame` — this view never decides
 * the score.
 *
 * Accessibility: the target time and the running/result time are always present
 * as HTML text; the SVG ring is decorative (aria-hidden). Ranks carry a text
 * label, never colour alone.
 */

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, RotateCcw, Target, Timer } from "lucide-react";
import { Button } from "@/components/ui";
import { ReactionInsightPanel } from "./ReactionInsightPanel";
import { ReactionSharePanel } from "./ReactionSharePanel";
import { cn } from "@/lib/cn";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import {
  PRECISION_TARGET_PRESETS,
  buildPrecisionShareText,
  formatSeconds,
  formatSignedMs,
  getPrecisionRank,
  getPrecisionTip,
  randomPrecisionTargetMs,
} from "./precisionScoring";
import { buildPrecisionInsight } from "./reactionInsights";
import { buildPrecisionShareResult, type ShareActionKind, type ShareableGameResult } from "./reactionShareCard";
import type { PrecisionState } from "./precisionMachine";
import type { PrecisionResult, PrecisionStats } from "./precisionTypes";

const RING_R = 86;
const RING_C = 2 * Math.PI * RING_R;
const TICKS = 12;

/** Live elapsed-time display for the running state (rAF-driven, cosmetic only). */
function RunningRing({
  startedAt,
  targetMs,
  reducedMotion,
}: {
  startedAt: number;
  targetMs: number;
  reducedMotion: boolean;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setElapsedMs(Math.max(0, performance.now() - startedAt));
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [startedAt]);

  const progress = Math.min(1, targetMs > 0 ? elapsedMs / targetMs : 0);
  const overshoot = elapsedMs > targetMs;
  const dashOffset = RING_C * (1 - progress);

  return (
    <div className={cn("rtp-precision-ringwrap", overshoot && "rtp-precision-ringwrap--over")}>
      <svg className="rtp-precision-ring" viewBox="0 0 200 200" aria-hidden>
        <circle className="rtp-precision-ring-track" cx="100" cy="100" r={RING_R} />
        {Array.from({ length: TICKS }).map((_, i) => {
          const angle = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
          const inner = RING_R - 8;
          const outer = RING_R + 2;
          return (
            <line
              key={i}
              className="rtp-precision-ring-tick"
              x1={100 + Math.cos(angle) * inner}
              y1={100 + Math.sin(angle) * inner}
              x2={100 + Math.cos(angle) * outer}
              y2={100 + Math.sin(angle) * outer}
            />
          );
        })}
        <circle
          className={cn("rtp-precision-ring-progress", overshoot && "rtp-precision-ring-progress--over")}
          cx="100"
          cy="100"
          r={RING_R}
          strokeDasharray={RING_C}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
          style={reducedMotion ? undefined : { transition: "stroke-dashoffset 90ms linear" }}
        />
        {/* Target marker fixed at the top (12 o'clock) — the finish point. */}
        <circle className="rtp-precision-ring-marker" cx="100" cy={100 - RING_R} r="5" />
      </svg>
      <div className="rtp-precision-ringtext">
        <span className="rtp-precision-elapsed" aria-live="off">
          {formatSeconds(elapsedMs)}
        </span>
        <span className="rtp-precision-target-sub">Target {formatSeconds(targetMs)}</span>
      </div>
    </div>
  );
}

function PrecisionLobby({
  stats,
  hydrated,
  targetMs,
  onSetTarget,
  onStart,
  onBack,
}: {
  stats: PrecisionStats;
  hydrated: boolean;
  targetMs: number;
  onSetTarget: (ms: number) => void;
  onStart: () => void;
  onBack: () => void;
  onShareAction?: (action: ShareActionKind, result: ShareableGameResult) => void;
}) {
  const bestForTarget = hydrated ? stats.bestByTargetMs[String(targetMs)] : undefined;
  return (
    <div className="rtp-precision-lobby">
      <span className="rtp-eyebrow">Precision Timer</span>
      <h2 className="rtp-lobby-title">Stop on the mark</h2>
      <p className="rtp-lobby-text">
        Start the timer, count carefully, then stop as close as you can to the target.
      </p>

      <div className="rtp-precision-targets" role="group" aria-label="Choose a target time">
        {PRECISION_TARGET_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={cn("rtp-precision-target", targetMs === preset && "rtp-precision-target--on")}
            onClick={() => onSetTarget(preset)}
            aria-pressed={targetMs === preset}
          >
            {formatSeconds(preset)}
          </button>
        ))}
        <button
          type="button"
          className="rtp-precision-target"
          onClick={() => onSetTarget(randomPrecisionTargetMs())}
        >
          Random
        </button>
      </div>

      <div className="rtp-lobby-stats" aria-live="polite">
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Target</span>
          <span className="rtp-lobby-stat-value">{formatSeconds(targetMs)}</span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Best (this target)</span>
          <span className="rtp-lobby-stat-value">
            {bestForTarget !== undefined ? `±${bestForTarget} ms` : "—"}
          </span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Best precision</span>
          <span className="rtp-lobby-stat-value">
            {hydrated && stats.bestAbsDifferenceMs !== null ? `±${stats.bestAbsDifferenceMs} ms` : "—"}
          </span>
        </div>
      </div>

      <div className="rtp-lobby-actions">
        <Button size="lg" onClick={onStart} leftIcon={<Timer className="h-5 w-5" aria-hidden />}>
          Start Precision
        </Button>
        <Button size="lg" variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}>
          Back to modes
        </Button>
      </div>
    </div>
  );
}

function PrecisionResultCard({
  result,
  previousBestAbs,
  onRetry,
  onBack,
  onShareAction,
}: {
  result: PrecisionResult;
  previousBestAbs: number | null;
  onRetry: () => void;
  onBack: () => void;
  onShareAction?: (action: ShareActionKind, result: ShareableGameResult) => void;
}) {
  const [copied, setCopied] = useState(false);
  const rank = getPrecisionRank(result.absDifferenceMs);
  const isBest = previousBestAbs === null || result.absDifferenceMs < previousBestAbs;
  const insight = buildPrecisionInsight(result);
  const shareResult = buildPrecisionShareResult(result);

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(buildPrecisionShareText(result));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="rtp-precision-result">
      <div className="rtp-summary-trophy" aria-hidden>
        {rank.glyph}
      </div>
      <span className="rtp-eyebrow">Precision result</span>
      <div className="rtp-precision-diff">{formatSignedMs(result.differenceMs)}</div>
      <div className="rtp-rank-badge">
        <span aria-hidden>{rank.glyph}</span>
        <span>{rank.label}</span>
        {isBest ? <span className="rtp-rank-best">New best</span> : null}
      </div>

      <div className="rtp-precision-grid">
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Target</span>
          <span className="rtp-summary-stat-value">{formatSeconds(result.targetMs)}</span>
        </div>
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Your stop</span>
          <span className="rtp-summary-stat-value">{formatSeconds(result.elapsedMs)}</span>
        </div>
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Difference</span>
          <span className="rtp-summary-stat-value">{formatSignedMs(result.differenceMs)}</span>
        </div>
      </div>

      <p className="rtp-result-tip">{getPrecisionTip(result)}</p>

      <ReactionInsightPanel insight={insight} compact />

      <ReactionSharePanel result={shareResult} onShareAction={onShareAction} compact />

      <div className="rtp-summary-actions">
        <Button size="lg" onClick={onRetry} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
          Try again
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleCopy}
          leftIcon={copied ? <Check className="h-5 w-5" aria-hidden /> : <Copy className="h-5 w-5" aria-hidden />}
        >
          {copied ? "Copied" : "Copy result"}
        </Button>
        <Button size="lg" variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}>
          Back to modes
        </Button>
      </div>
    </div>
  );
}

export function PrecisionView({
  state,
  runningStartedAt,
  previousBestAbs,
  stats,
  hydrated,
  reducedMotion,
  onSetTarget,
  onStart,
  onRetry,
  onBack,
  onShareAction,
}: {
  state: PrecisionState;
  runningStartedAt: number | null;
  previousBestAbs: number | null;
  stats: PrecisionStats;
  hydrated: boolean;
  reducedMotion: boolean;
  onSetTarget: (ms: number) => void;
  onStart: () => void;
  onRetry: () => void;
  onBack: () => void;
  onShareAction?: (action: ShareActionKind, result: ShareableGameResult) => void;
}) {
  if (state.phase === "lobby") {
    return (
      <PrecisionLobby
        stats={stats}
        hydrated={hydrated}
        targetMs={state.targetMs}
        onSetTarget={onSetTarget}
        onStart={onStart}
        onBack={onBack}
        onShareAction={onShareAction}
      />
    );
  }

  if (state.phase === "countdown") {
    const value = state.countdownValue;
    return (
      <div className="rtp-play">
        <span className="rtp-eyebrow">Precision · {formatSeconds(state.targetMs)}</span>
        <div className="rtp-instruction rtp-instruction--countdown" aria-live="assertive">
          {value && value > 0 ? value : "Start"}
        </div>
        <p className="rtp-play-sub">Get ready to count toward {formatSeconds(state.targetMs)}.</p>
      </div>
    );
  }

  if (state.phase === "running") {
    return (
      <div className="rtp-precision-running">
        <span className="rtp-eyebrow">Tap anywhere to stop</span>
        {runningStartedAt !== null ? (
          <RunningRing startedAt={runningStartedAt} targetMs={state.targetMs} reducedMotion={reducedMotion} />
        ) : null}
        <p className="rtp-play-sub">Stop the timer as close as you can to {formatSeconds(state.targetMs)}.</p>
        <div className="rtp-hints">
          <span className="rtp-hint">
            <Target className="h-3.5 w-3.5" aria-hidden /> Tap / click
          </span>
          <span className="rtp-hint">Space / Enter to stop</span>
        </div>
      </div>
    );
  }

  // result
  if (state.result) {
    return (
      <PrecisionResultCard
        result={state.result}
        previousBestAbs={previousBestAbs}
        onRetry={onRetry}
        onBack={onBack}
        onShareAction={onShareAction}
      />
    );
  }
  return null;
}
