"use client";

/**
 * Level Challenge mode shell (Sprint 7). Owns the lobby → intro → playing →
 * result/complete flow and reuses the `.rtp-stage` container so fullscreen
 * sizing, top controls, and the settings modal behave like every other mode.
 * Live gameplay (and the countdown) lives in `LevelChallengeStage`; this
 * component never touches gameplay timing.
 *
 * Accessibility: every result value is HTML text, ranks + pass/fail carry text
 * labels (not colour alone), decoy guidance is described in words, and the lobby
 * states that pointer/touch is recommended.
 */

import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Lock, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { LevelChallengeStage } from "./LevelChallengeStage";
import type { PlayCue } from "./reactionAudio";
import type { Vibrate } from "./reactionHaptics";
import {
  LEVELS,
  TOTAL_LEVELS,
  buildLevelChallengeShareText,
  formatLevelMs,
  formatLevelScore,
  getChallengeRank,
  getLevelChallengeRank,
  getLevelDef,
} from "./levelChallengeScoring";
import type { LevelChallengeResult, LevelChallengeStats } from "./levelChallengeTypes";

type LevelState = "locked" | "current" | "completed";

function levelStateFor(level: number, stats: LevelChallengeStats): LevelState {
  if (stats.completedLevels.includes(level)) return "completed";
  if (level <= stats.unlockedLevel) return "current";
  return "locked";
}

function LevelChallengeLobby({
  stats,
  hydrated,
  onPlayLevel,
  onResetProgress,
  onBack,
}: {
  stats: LevelChallengeStats;
  hydrated: boolean;
  onPlayLevel: (level: number) => void;
  onResetProgress: () => void;
  onBack: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const currentLevel = Math.min(TOTAL_LEVELS, Math.max(1, stats.unlockedLevel));

  return (
    <div className="rtp-lc-lobby">
      <span className="rtp-eyebrow">Level Challenge</span>
      <h2 className="rtp-lobby-title">Six reflex levels</h2>
      <p className="rtp-lobby-text">
        Clear one level to unlock the next: signal, fade, shrink, move, decoy, and elite. Progress
        saves on this device.
      </p>

      <div className="rtp-lobby-stats" aria-live="polite">
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Best level</span>
          <span className="rtp-lobby-stat-value">{hydrated ? stats.bestLevelReached || "—" : "—"}</span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Completed</span>
          <span className="rtp-lobby-stat-value">
            {hydrated ? `${stats.completedLevels.length} / ${TOTAL_LEVELS}` : "—"}
          </span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Best score</span>
          <span className="rtp-lobby-stat-value">
            {hydrated ? formatLevelScore(stats.bestLevelChallengeScore) : "—"}
          </span>
        </div>
      </div>

      <div className="rtp-lc-grid" role="list">
        {LEVELS.map((def) => {
          const state = hydrated ? levelStateFor(def.level, stats) : def.level === 1 ? "current" : "locked";
          const best = stats.bestLevelScoresByLevel[String(def.level)];
          const locked = state === "locked";
          return (
            <button
              key={def.id}
              type="button"
              role="listitem"
              className={cn("rtp-lc-card", `rtp-lc-card--${state}`)}
              disabled={locked}
              onClick={() => !locked && onPlayLevel(def.level)}
              aria-label={`Level ${def.level}: ${def.title}. ${
                locked ? "Locked. Complete the previous level to unlock." : state === "completed" ? "Completed." : "Unlocked."
              }`}
            >
              <span className="rtp-lc-card-top">
                <span className="rtp-lc-card-num">L{def.level}</span>
                <span className={cn("rtp-lc-card-state", `rtp-lc-card-state--${state}`)}>
                  {locked ? <Lock className="h-3.5 w-3.5" aria-hidden /> : null}
                  {state === "completed" ? "Completed" : state === "current" ? "Play" : "Locked"}
                </span>
              </span>
              <span className="rtp-lc-card-title">{def.title}</span>
              <span className="rtp-lc-card-goal">{def.objective}</span>
              {best !== undefined ? <span className="rtp-lc-card-best">Best {formatLevelScore(best)}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="rtp-lobby-actions">
        <Button size="lg" onClick={() => onPlayLevel(currentLevel)} leftIcon={<Play className="h-5 w-5" aria-hidden />}>
          {currentLevel === 1 && stats.completedLevels.length === 0 ? "Start Level 1" : `Continue · Level ${currentLevel}`}
        </Button>
        <Button size="lg" variant="ghost" onClick={() => onPlayLevel(1)}>
          From Level 1
        </Button>
        <Button size="lg" variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}>
          Back to modes
        </Button>
      </div>

      <p className="rtp-th-recommend">Pointer or touch recommended (Level 1 also supports Space / Enter).</p>

      {confirmReset ? (
        <div className="rtp-lc-reset" role="alertdialog" aria-label="Confirm reset of Level Challenge progress">
          <span>Reset all Level Challenge progress on this device? Other stats are kept.</span>
          <div className="rtp-lc-reset-actions">
            <button
              type="button"
              className="rtp-clear-confirm-yes"
              onClick={() => {
                onResetProgress();
                setConfirmReset(false);
              }}
            >
              Yes, reset
            </button>
            <button type="button" className="rtp-clear-confirm-no" autoFocus onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="rtp-lc-resetlink" onClick={() => setConfirmReset(true)}>
          Reset level progress
        </button>
      )}
    </div>
  );
}

function LevelIntro({
  level,
  onStart,
  onBack,
}: {
  level: number;
  onStart: () => void;
  onBack: () => void;
}) {
  const def = getLevelDef(level);
  return (
    <div className="rtp-lc-intro">
      <span className="rtp-eyebrow">Level {def.level}</span>
      <h2 className="rtp-lobby-title">{def.title}</h2>
      <p className="rtp-lobby-text">{def.objective}</p>
      <p className="rtp-lc-intro-tip">Tip: {def.tip}</p>
      <p className="rtp-lc-intro-controls">
        {def.mechanic === "signal" ? "Tap anywhere or press Space / Enter when you see GO." : "Tap / click the target."}
      </p>
      <div className="rtp-lobby-actions">
        <Button size="lg" onClick={onStart} leftIcon={<Play className="h-5 w-5" aria-hidden />}>
          Start level
        </Button>
        <Button size="lg" variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}>
          Back
        </Button>
      </div>
    </div>
  );
}

function LevelResultCard({
  result,
  previousBestScore,
  allCompleted,
  challengeTotalBest,
  onNextLevel,
  onReplay,
  onRetry,
  onBack,
  onRestartChallenge,
}: {
  result: LevelChallengeResult;
  previousBestScore: number;
  allCompleted: boolean;
  challengeTotalBest: number;
  onNextLevel: (() => void) | null;
  onReplay: () => void;
  onRetry: () => void;
  onBack: () => void;
  onRestartChallenge: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const rank = getLevelChallengeRank(result.passed, result.score, result.accuracy);
  const isBest = result.passed && result.score > previousBestScore;

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(buildLevelChallengeShareText(result));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  // Challenge-complete celebration takes over when the final level closes the set.
  if (allCompleted && result.passed) {
    const challengeRank = getChallengeRank(challengeTotalBest);
    return (
      <div className="rtp-lc-result rtp-lc-complete">
        <div className="rtp-summary-trophy" aria-hidden>
          🏆
        </div>
        <span className="rtp-eyebrow">Challenge complete</span>
        <h2 className="rtp-lobby-title">All six levels cleared</h2>
        <div className="rtp-rank-badge">
          <span aria-hidden>{challengeRank.glyph}</span>
          <span>{challengeRank.label}</span>
        </div>
        <p className="rtp-result-tip">Overall best score {formatLevelScore(challengeTotalBest)}. {challengeRank.note}</p>
        <div className="rtp-summary-actions">
          <Button size="lg" onClick={onRestartChallenge} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
            Play again from Level 1
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

  return (
    <div className="rtp-lc-result">
      <div className="rtp-summary-trophy" aria-hidden>
        {rank.glyph}
      </div>
      <span className="rtp-eyebrow">
        Level {result.level} · {result.passed ? "Passed" : "Failed"}
      </span>
      <div className="rtp-th-score">{formatLevelScore(result.score)}</div>
      <div className="rtp-rank-badge">
        <span aria-hidden>{rank.glyph}</span>
        <span>{rank.label}</span>
        {isBest ? <span className="rtp-rank-best">New best</span> : null}
      </div>

      <div className="rtp-th-grid">
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Hits</span>
          <span className="rtp-summary-stat-value">
            {result.hits}/{result.requiredHits}
          </span>
        </div>
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Misses</span>
          <span className="rtp-summary-stat-value">{result.misses}</span>
        </div>
        {result.mechanic === "decoy" || result.mechanic === "elite" ? (
          <div className="rtp-summary-stat">
            <span className="rtp-summary-stat-label">Wrong</span>
            <span className="rtp-summary-stat-value">{result.wrongTargets}</span>
          </div>
        ) : null}
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Accuracy</span>
          <span className="rtp-summary-stat-value">{result.accuracy}%</span>
        </div>
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Avg hit</span>
          <span className="rtp-summary-stat-value">{formatLevelMs(result.averageHitMs)}</span>
        </div>
        <div className="rtp-summary-stat">
          <span className="rtp-summary-stat-label">Best combo</span>
          <span className="rtp-summary-stat-value">{result.maxCombo}</span>
        </div>
      </div>

      <p className="rtp-result-tip">
        {result.passed
          ? rank.note
          : `Goal: ${result.requiredHits} hits${
              result.mechanic === "decoy" || result.mechanic === "elite" ? " with few wrong taps" : ""
            }. ${getLevelDef(result.level).tip}`}
      </p>

      <div className="rtp-summary-actions">
        {result.passed && onNextLevel ? (
          <Button size="lg" onClick={onNextLevel} leftIcon={<ArrowRight className="h-5 w-5" aria-hidden />}>
            Next level
          </Button>
        ) : null}
        {result.passed ? (
          <Button size="lg" variant={onNextLevel ? "outline" : "primary"} onClick={onReplay} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
            Replay level
          </Button>
        ) : (
          <Button size="lg" onClick={onRetry} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
            Retry level
          </Button>
        )}
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

export function LevelChallengeView({
  stats,
  hydrated,
  reducedMotion,
  highContrast,
  play,
  vibrate,
  previousLevelScore,
  onComplete,
  onRunStart,
  onResetProgress,
  onBack,
  topControls,
  modal,
  onModalBackdrop,
}: {
  stats: LevelChallengeStats;
  hydrated: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  play: PlayCue;
  vibrate: Vibrate;
  previousLevelScore: number;
  onComplete: (result: LevelChallengeResult) => void;
  onRunStart?: () => void;
  onResetProgress: () => void;
  onBack: () => void;
  topControls?: ReactNode;
  modal?: ReactNode;
  onModalBackdrop?: () => void;
}) {
  const [phase, setPhase] = useState<"lobby" | "intro" | "playing" | "result">("lobby");
  const [level, setLevel] = useState(1);
  const [result, setResult] = useState<LevelChallengeResult | null>(null);
  const [runKey, setRunKey] = useState(0);
  // Levels failed this session — drives the "Comeback Clear" achievement.
  const [failedThisSession, setFailedThisSession] = useState<Set<number>>(() => new Set());

  const openIntro = (lvl: number) => {
    setLevel(lvl);
    setPhase("intro");
  };

  const startLevel = () => {
    onRunStart?.();
    setRunKey((k) => k + 1);
    setPhase("playing");
  };

  const handleComplete = (finished: LevelChallengeResult) => {
    onComplete(finished);
    if (!finished.passed) {
      setFailedThisSession((prev) => {
        const next = new Set(prev);
        next.add(finished.level);
        return next;
      });
    }
    setResult(finished);
    setPhase("result");
  };

  const allCompleted =
    hydrated && Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).every((l) => stats.completedLevels.includes(l));

  const nextLevel = level < TOTAL_LEVELS ? level + 1 : null;
  const canAdvance = nextLevel !== null && nextLevel <= stats.unlockedLevel;

  return (
    <div className={cn("rtp-stage rtp-stage--idle rtp-th-shell", highContrast && "rtp-th-shell--contrast")}>
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
        <LevelChallengeStage
          key={runKey}
          def={getLevelDef(level)}
          comeback={failedThisSession.has(level)}
          reducedMotion={reducedMotion}
          play={play}
          vibrate={vibrate}
          onComplete={handleComplete}
          onQuit={() => setPhase("lobby")}
        />
      ) : (
        <div className="rtp-stage-overlay">
          {phase === "lobby" ? (
            <LevelChallengeLobby
              stats={stats}
              hydrated={hydrated}
              onPlayLevel={openIntro}
              onResetProgress={onResetProgress}
              onBack={onBack}
            />
          ) : phase === "intro" ? (
            <LevelIntro level={level} onStart={startLevel} onBack={() => setPhase("lobby")} />
          ) : result ? (
            <LevelResultCard
              result={result}
              previousBestScore={previousLevelScore}
              allCompleted={allCompleted}
              challengeTotalBest={Object.values(stats.bestLevelScoresByLevel).reduce((s, v) => s + v, 0)}
              onNextLevel={canAdvance && nextLevel !== null ? () => openIntro(nextLevel) : null}
              onReplay={startLevel}
              onRetry={startLevel}
              onBack={onBack}
              onRestartChallenge={() => openIntro(1)}
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
