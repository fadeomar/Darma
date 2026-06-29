"use client";

/**
 * Target Hunter mode shell (Sprint 6). Owns the lobby → playing → result flow
 * and reuses the `.rtp-stage` container so fullscreen sizing, top controls, and
 * the settings modal behave exactly like the other modes. Live gameplay (and the
 * countdown) lives in `TargetHunterStage`; this component never touches timing.
 *
 * Accessibility: every result value is HTML text, ranks carry a text label (not
 * colour alone), and the lobby states clearly that pointer/touch is recommended.
 */

import { useState, type ReactNode } from "react";
import { ArrowLeft, Check, Copy, Crosshair, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";
import { ReactionInsightPanel } from "./ReactionInsightPanel";
import { ReactionSharePanel } from "./ReactionSharePanel";
import { ReactionSessionFlowPanel } from "./ReactionSessionFlowPanel";
import { cn } from "@/lib/cn";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { TargetHunterStage } from "./TargetHunterStage";
import type { PlayCue } from "./reactionAudio";
import type { Vibrate } from "./reactionHaptics";
import {
  buildTargetHunterShareText,
  formatHitMs,
  formatScore,
  getTargetHunterRank,
} from "./targetHunterScoring";
import { buildTargetHunterInsight } from "./reactionInsights";
import { buildTargetHunterShareResult, type ShareActionKind, type ShareableGameResult } from "./reactionShareCard";
import { targetHunterResultFlow } from "./reactionSessionFlow";
import type { TargetHunterResult, TargetHunterStats } from "./targetHunterTypes";

function TargetHunterLobby({
  stats,
  hydrated,
  onStart,
  onBack,
}: {
  stats: TargetHunterStats;
  hydrated: boolean;
  onStart: () => void;
  onBack: () => void;
  onShareAction?: (action: ShareActionKind, result: ShareableGameResult) => void;
}) {
  return (
    <div className="rtp-th-lobby">
      <span className="rtp-eyebrow">Target Hunter</span>
      <h2 className="rtp-lobby-title">Hunt the targets</h2>
      <p className="rtp-lobby-text">
        A target appears, you tap it as fast as you can. Thirty seconds — build speed, accuracy, and
        focus. Tapping empty space counts as a miss.
      </p>

      <div className="rtp-lobby-stats" aria-live="polite">
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Best score</span>
          <span className="rtp-lobby-stat-value">{hydrated ? formatScore(stats.bestScore) : "—"}</span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Best accuracy</span>
          <span className="rtp-lobby-stat-value">{hydrated ? `${stats.bestAccuracy}%` : "—"}</span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Best avg hit</span>
          <span className="rtp-lobby-stat-value">{hydrated ? formatHitMs(stats.bestAverageHitMs) : "—"}</span>
        </div>
      </div>

      <div className="rtp-lobby-actions">
        <Button size="lg" onClick={onStart} leftIcon={<Crosshair className="h-5 w-5" aria-hidden />}>
          Start Quick Hunt
        </Button>
        <Button size="lg" variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}>
          Back to modes
        </Button>
      </div>

      <p className="rtp-th-recommend">Pointer or touch recommended for this mode.</p>
    </div>
  );
}

function TargetHunterResultCard({
  result,
  previousBestScore,
  onPlayAgain,
  onBack,
  onShareAction,
}: {
  result: TargetHunterResult;
  previousBestScore: number;
  onPlayAgain: () => void;
  onBack: () => void;
  onShareAction?: (action: ShareActionKind, result: ShareableGameResult) => void;
}) {
  const [copied, setCopied] = useState(false);
  const rank = getTargetHunterRank(result.score, result.accuracy, result.averageHitMs);
  const isBest = result.score > previousBestScore;
  const insight = buildTargetHunterInsight(result);
  const shareResult = buildTargetHunterShareResult(result);
  const flow = targetHunterResultFlow(isBest);

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(buildTargetHunterShareText(result));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="rtp-th-result">
      <div className="rtp-summary-trophy" aria-hidden>
        {rank.glyph}
      </div>
      <span className="rtp-eyebrow">Target Hunter</span>
      <div className="rtp-th-score">{formatScore(result.score)}</div>
      <div className="rtp-rank-badge">
        <span aria-hidden>{rank.glyph}</span>
        <span>{rank.label}</span>
        {isBest ? <span className="rtp-rank-best">New best</span> : null}
      </div>

      <div className="rtp-th-grid">
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Hits</span>
          <span className="rtp-summary-stat-value">{result.hits}</span>
        </div>
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Misses</span>
          <span className="rtp-summary-stat-value">{result.misses}</span>
        </div>
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Accuracy</span>
          <span className="rtp-summary-stat-value">{result.accuracy}%</span>
        </div>
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Longest combo</span>
          <span className="rtp-summary-stat-value">{result.longestCombo}</span>
        </div>
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Avg hit</span>
          <span className="rtp-summary-stat-value">{formatHitMs(result.averageHitMs)}</span>
        </div>
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Best hit</span>
          <span className="rtp-summary-stat-value">{formatHitMs(result.bestHitMs)}</span>
        </div>
      </div>

      <p className="rtp-result-tip">{rank.note}</p>

      <ReactionInsightPanel insight={insight} compact />

      <ReactionSharePanel result={shareResult} onShareAction={onShareAction} compact />

      <ReactionSessionFlowPanel flow={flow} compact />

      <div className="rtp-summary-actions" data-rtp-control="true">
        <Button size="lg" onClick={onPlayAgain} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
          Play again
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

export function TargetHunterView({
  stats,
  hydrated,
  reducedMotion,
  highContrast,
  play,
  vibrate,
  previousBestScore,
  onComplete,
  onRunStart,
  onBack,
  topControls,
  modal,
  onModalBackdrop,
  onShareAction,
}: {
  stats: TargetHunterStats;
  hydrated: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  play: PlayCue;
  vibrate: Vibrate;
  /** Best score BEFORE the latest run was merged (drives the "New best" badge). */
  previousBestScore: number;
  /** Persist a finished run + unlock achievements (the single storage owner). */
  onComplete: (result: TargetHunterResult) => void;
  /** Called when a run begins (clears any stale achievement toast). */
  onRunStart?: () => void;
  onBack: () => void;
  topControls?: ReactNode;
  modal?: ReactNode;
  onModalBackdrop?: () => void;
  onShareAction?: (action: ShareActionKind, result: ShareableGameResult) => void;
}) {
  const [phase, setPhase] = useState<"lobby" | "playing" | "result">("lobby");
  const [result, setResult] = useState<TargetHunterResult | null>(null);
  const [runKey, setRunKey] = useState(0);

  const startRun = () => {
    onRunStart?.();
    setRunKey((k) => k + 1);
    setPhase("playing");
  };

  const handleComplete = (finished: TargetHunterResult) => {
    onComplete(finished);
    setResult(finished);
    setPhase("result");
  };

  return (
    <div
      className={cn("rtp-stage rtp-stage--idle rtp-th-shell", highContrast && "rtp-th-shell--contrast")}
    >
      {topControls ? (
        <div
          className="rtp-stage-top"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {topControls}
        </div>
      ) : null}

      {phase === "playing" ? (
        <TargetHunterStage
          key={runKey}
          reducedMotion={reducedMotion}
          play={play}
          vibrate={vibrate}
          onComplete={handleComplete}
          onQuit={() => setPhase("lobby")}
          onRestart={startRun}
        />
      ) : (
        <div className="rtp-stage-overlay">
          {phase === "lobby" ? (
            <TargetHunterLobby stats={stats} hydrated={hydrated} onStart={startRun} onBack={onBack} />
          ) : result ? (
            <TargetHunterResultCard
              result={result}
              previousBestScore={previousBestScore}
              onPlayAgain={startRun}
              onBack={onBack}
              onShareAction={onShareAction}
            />
          ) : null}
        </div>
      )}

      {modal ? (
        <div
          className="rtp-stage-modal"
          onPointerDown={(event) => {
            event.stopPropagation();
            if (event.target === event.currentTarget) onModalBackdrop?.();
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {modal}
        </div>
      ) : null}
    </div>
  );
}
