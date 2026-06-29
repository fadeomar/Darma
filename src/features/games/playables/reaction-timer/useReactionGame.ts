"use client";

/**
 * Orchestrates the Reaction Timer Pro game loop: drives the pure machine with
 * timers, captures high-resolution timestamps, plays audio + haptic feedback,
 * and persists finished classic runs. Components stay presentational and read
 * from here.
 *
 * Timing rule: feedback (audio/haptics) is emitted AFTER state transitions and
 * never participates in the clock. The reaction timestamp is captured with
 * `performance.now()` at input time. `play`/`vibrate` have stable identities so
 * listing them in the timing effect can't reschedule the random-wait timer.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useReactionAudio } from "./reactionAudio";
import { useReactionHaptics } from "./reactionHaptics";
import { useReactionSettings } from "./reactionSettings";
import { ACHIEVEMENTS } from "./reactionAchievements";
import { INITIAL_STATE, reactionReducer } from "./reactionMachine";
import { INITIAL_PRECISION_STATE, precisionReducer } from "./precisionMachine";
import { evaluatePrecision } from "./precisionScoring";
import { getRank, randomWaitMs } from "./reactionScoring";
import {
  EMPTY_STORAGE,
  mergeLevelChallenge,
  mergePrecision,
  mergeRun,
  mergeTargetHunter,
  readStorage,
  recordPractice,
  resetLevelChallenge,
  writeStorage,
} from "./reactionStorage";
import type { GameMode, ReactionStorageV2, RunSummary } from "./reactionTypes";
import type { TargetHunterResult } from "./targetHunterTypes";
import type { LevelChallengeResult } from "./levelChallengeTypes";

const COUNTDOWN_INTERVAL_MS = 650;
const TOO_EARLY_RETRY_MS = 1300;
const ROUND_RESULT_MS = 1800;

export function useReactionGame() {
  const [state, dispatch] = useReducer(reactionReducer, INITIAL_STATE);
  const [stats, setStats] = useState<ReactionStorageV2>(EMPTY_STORAGE);
  const [hydrated, setHydrated] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  // Records *before* the current run was saved — let the summary report genuine
  // "new personal best" / improvement lines instead of comparing against values
  // the merge has already updated.
  const [previousBestMs, setPreviousBestMs] = useState<number | null>(null);
  const [previousBestAverageMs, setPreviousBestAverageMs] = useState<number | null>(null);
  const [previousRun, setPreviousRun] = useState<RunSummary | null>(null);

  const { settings, hydrated: settingsHydrated, update: updateSetting, reset: resetSettings } = useReactionSettings();
  const play = useReactionAudio(settings.soundEnabled, settings.volume);
  const vibrate = useReactionHaptics(settings.hapticsEnabled);

  // Precision Timer mode runs on its own pure machine but shares the single
  // stats/achievement/feedback pipeline below so the localStorage blob never has
  // two owners writing stale copies over each other.
  const [precision, dispatchPrecision] = useReducer(precisionReducer, INITIAL_PRECISION_STATE);
  const [precisionRunningStartedAt, setPrecisionRunningStartedAt] = useState<number | null>(null);
  const [previousPrecisionBestAbs, setPreviousPrecisionBestAbs] = useState<number | null>(null);
  // Target Hunter best score BEFORE the latest run was merged (for "new best").
  const [previousTargetHunterBestScore, setPreviousTargetHunterBestScore] = useState(0);
  // Level Challenge best score for the just-played level BEFORE merge.
  const [previousLevelScore, setPreviousLevelScore] = useState(0);
  const precisionTimerRef = useRef<number | null>(null);
  const precisionStartedAtRef = useRef(0);
  const precisionTargetRef = useRef(precision.targetMs);
  const precisionPhaseRef = useRef(precision.phase);
  const precisionLockRef = useRef(false);

  const timerRef = useRef<number | null>(null);
  const signalShownAtRef = useRef(0);
  const phaseRef = useRef(state.phase);
  const submitLockRef = useRef(false);
  const persistedRunRef = useRef<string | null>(null);
  // Read in the timing effect without re-running it (avoids touching live timers).
  const autoAdvanceRef = useRef(settings.autoAdvance);
  useEffect(() => {
    autoAdvanceRef.current = settings.autoAdvance;
  }, [settings.autoAdvance]);

  // Mirror phase into a ref so the input handler reads it without a stale closure.
  useEffect(() => {
    phaseRef.current = state.phase;
  }, [state.phase]);

  useEffect(() => {
    precisionPhaseRef.current = precision.phase;
  }, [precision.phase]);
  useEffect(() => {
    precisionTargetRef.current = precision.targetMs;
  }, [precision.targetMs]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearPrecisionTimer = useCallback(() => {
    if (precisionTimerRef.current !== null) {
      window.clearTimeout(precisionTimerRef.current);
      precisionTimerRef.current = null;
    }
  }, []);

  // Hydrate persisted stats on mount.
  useEffect(() => {
    setStats(readStorage());
    setHydrated(true);
    return clearTimer;
  }, [clearTimer]);

  // Schedule timed transitions whenever the phase (or countdown value) changes.
  useEffect(() => {
    submitLockRef.current = false;
    clearTimer();

    if (state.phase === "countdown") {
      if (state.countdownValue && state.countdownValue > 0) play("countdown.tick");
      timerRef.current = window.setTimeout(() => {
        if (state.countdownValue && state.countdownValue > 0) {
          dispatch({ type: "COUNTDOWN_TICK" });
        } else {
          dispatch({ type: "BEGIN_WAITING" });
        }
      }, COUNTDOWN_INTERVAL_MS);
    } else if (state.phase === "waiting") {
      timerRef.current = window.setTimeout(() => {
        signalShownAtRef.current = performance.now();
        play("signal.go");
        vibrate("signal");
        dispatch({ type: "SHOW_SIGNAL" });
      }, randomWaitMs());
    } else if (state.phase === "too-early") {
      timerRef.current = window.setTimeout(() => dispatch({ type: "RETRY" }), TOO_EARLY_RETRY_MS);
    } else if (state.phase === "round-result") {
      if (autoAdvanceRef.current) {
        timerRef.current = window.setTimeout(() => dispatch({ type: "ADVANCE" }), ROUND_RESULT_MS);
      }
    }

    return clearTimer;
  }, [state.phase, state.countdownValue, clearTimer, play, vibrate]);

  // Precision countdown → running. The running clock baseline is captured with
  // performance.now() exactly when the run begins (never from CSS/rAF).
  useEffect(() => {
    precisionLockRef.current = false;
    clearPrecisionTimer();

    if (precision.phase === "countdown") {
      if (precision.countdownValue && precision.countdownValue > 0) play("countdown.tick");
      precisionTimerRef.current = window.setTimeout(() => {
        if (precision.countdownValue && precision.countdownValue > 0) {
          dispatchPrecision({ type: "COUNTDOWN_TICK" });
        } else {
          const startedAt = performance.now();
          precisionStartedAtRef.current = startedAt;
          setPrecisionRunningStartedAt(startedAt);
          play("signal.go");
          vibrate("signal");
          dispatchPrecision({ type: "BEGIN_RUNNING" });
        }
      }, COUNTDOWN_INTERVAL_MS);
    }

    return clearPrecisionTimer;
  }, [precision.phase, precision.countdownValue, clearPrecisionTimer, play, vibrate]);

  // Persist a finished classic run exactly once.
  useEffect(() => {
    if (state.phase !== "final-summary" || !state.run) return;
    if (state.run.mode !== "classic") return;
    if (persistedRunRef.current === state.run.id) return;
    persistedRunRef.current = state.run.id;
    play("final.victory");
    vibrate("victory");

    setStats((current) => {
      // Capture the prior records before merging this run so the summary can
      // compare the new result against what it is about to (potentially) beat.
      setPreviousBestMs(current.bestMs);
      setPreviousBestAverageMs(current.bestAverageMs);
      setPreviousRun(current.lastResults[0] ?? null);
      const before = new Set(current.achievements);
      const next = mergeRun(current, state.run!);
      writeStorage(next);
      setNewAchievements(next.achievements.filter((id) => !before.has(id)));
      return next;
    });
  }, [state.phase, state.run, play, vibrate]);

  // Achievement feedback — fires once per unlock batch (separate from victory).
  useEffect(() => {
    if (newAchievements.length === 0) return;
    play("achievement.unlock");
    vibrate("achievement");
  }, [newAchievements, play, vibrate]);

  /** Reaction / early-press input. Capture the timestamp first for accuracy. */
  const press = useCallback(() => {
    const now = performance.now();
    if (submitLockRef.current) return;
    const phase = phaseRef.current;

    if (phase === "signal") {
      submitLockRef.current = true;
      const reactionMs = Math.max(0, Math.round(now - signalShownAtRef.current));
      const rank = getRank(reactionMs).id;
      const cue =
        rank === "elite" || rank === "excellent"
          ? "result.success"
          : rank === "good" || rank === "average"
            ? "result.average"
            : "result.bad";
      play(cue);
      dispatch({ type: "VALID_PRESS", reactionMs, at: new Date().toISOString() });
    } else if (phase === "waiting") {
      submitLockRef.current = true;
      play("tooEarly.error");
      vibrate("tooEarly");
      dispatch({ type: "EARLY_PRESS", at: new Date().toISOString() });
    }
  }, [play, vibrate]);

  const start = useCallback((mode: GameMode) => {
    persistedRunRef.current = null;
    setNewAchievements([]);
    setPreviousBestMs(null);
    setPreviousBestAverageMs(null);
    setPreviousRun(null);
    // Practice contributes to lifetime tracking (practice count, day streak) and
    // can unlock "Practice Starter" / "Daily Return" — recorded once per start.
    if (mode === "practice") {
      setStats((current) => {
        const before = new Set(current.achievements);
        const next = recordPractice(current);
        writeStorage(next);
        const newly = next.achievements.filter((id) => !before.has(id));
        if (newly.length) setNewAchievements(newly);
        return next;
      });
    }
    dispatch({ type: "START", mode });
  }, []);

  const advanceNow = useCallback(() => dispatch({ type: "ADVANCE" }), []);
  const pause = useCallback(() => {
    play("pause");
    dispatch({ type: "PAUSE" });
  }, [play]);
  const resume = useCallback(() => {
    play("resume");
    dispatch({ type: "RESUME" });
  }, [play]);

  const reset = useCallback(() => {
    clearTimer();
    setNewAchievements([]);
    dispatch({ type: "RESET" });
  }, [clearTimer]);

  const clearStats = useCallback(() => {
    writeStorage(EMPTY_STORAGE);
    setStats(EMPTY_STORAGE);
    setNewAchievements([]);
    clearPrecisionTimer();
    dispatchPrecision({ type: "TO_LOBBY" });
    reset();
  }, [reset, clearPrecisionTimer]);

  const dismissAchievements = useCallback(() => setNewAchievements([]), []);

  /** Stop the precision timer. Measures with performance.now(), guards against a
   *  double stop, then persists + unlocks achievements through the shared pipeline. */
  const precisionStop = useCallback(() => {
    const now = performance.now();
    if (precisionLockRef.current) return;
    if (precisionPhaseRef.current !== "running") return;
    precisionLockRef.current = true;

    const elapsedMs = now - precisionStartedAtRef.current;
    const result = evaluatePrecision(precisionTargetRef.current, elapsedMs);

    vibrate("tap");
    if (result.rankId === "perfect" || result.rankId === "excellent") {
      play("result.success");
      vibrate("victory");
    } else if (result.rankId === "good" || result.rankId === "close") {
      play("result.average");
    } else {
      play("result.bad");
      vibrate("tooEarly");
    }

    dispatchPrecision({ type: "STOP", result });

    setStats((current) => {
      setPreviousPrecisionBestAbs(current.precision.bestAbsDifferenceMs);
      const before = new Set(current.achievements);
      const next = mergePrecision(current, result);
      writeStorage(next);
      const newly = next.achievements.filter((id) => !before.has(id));
      if (newly.length) setNewAchievements(newly);
      return next;
    });
  }, [play, vibrate]);

  const precisionStart = useCallback(() => {
    setNewAchievements([]);
    dispatchPrecision({ type: "START" });
  }, []);

  const precisionRetry = useCallback(() => {
    setNewAchievements([]);
    dispatchPrecision({ type: "RETRY" });
  }, []);

  const precisionSetTarget = useCallback((targetMs: number) => {
    dispatchPrecision({ type: "SET_TARGET", targetMs });
  }, []);

  const precisionToLobby = useCallback(() => {
    clearPrecisionTimer();
    dispatchPrecision({ type: "TO_LOBBY" });
  }, [clearPrecisionTimer]);

  /** Persist a finished Target Hunter run + unlock achievements (single owner). */
  const targetHunterComplete = useCallback(
    (result: TargetHunterResult) => {
      play("final.victory");
      vibrate("victory");
      setStats((current) => {
        setPreviousTargetHunterBestScore(current.targetHunter.bestScore);
        const before = new Set(current.achievements);
        const next = mergeTargetHunter(current, result);
        writeStorage(next);
        const newly = next.achievements.filter((id) => !before.has(id));
        if (newly.length) setNewAchievements(newly);
        return next;
      });
    },
    [play, vibrate],
  );

  /** Clear any pending achievement toast when a Target Hunter run begins. */
  const targetHunterStart = useCallback(() => setNewAchievements([]), []);

  /** Persist a finished Level Challenge attempt + unlock achievements. */
  const levelChallengeComplete = useCallback(
    (result: LevelChallengeResult) => {
      play(result.passed ? "final.victory" : "result.bad");
      vibrate(result.passed ? "victory" : "tooEarly");
      setStats((current) => {
        setPreviousLevelScore(current.levelChallenge.bestLevelScoresByLevel[String(result.level)] ?? 0);
        const before = new Set(current.achievements);
        const next = mergeLevelChallenge(current, result);
        writeStorage(next);
        const newly = next.achievements.filter((id) => !before.has(id));
        if (newly.length) setNewAchievements(newly);
        return next;
      });
    },
    [play, vibrate],
  );

  /** Clear any pending achievement toast when a level begins. */
  const levelChallengeStart = useCallback(() => setNewAchievements([]), []);

  /** Reset only Level Challenge progress (keeps every other stat + settings). */
  const resetLevelProgress = useCallback(() => {
    setStats((current) => {
      const next = resetLevelChallenge(current);
      writeStorage(next);
      return next;
    });
  }, []);

  const toggleSound = useCallback(
    () => updateSetting("soundEnabled", !settings.soundEnabled),
    [updateSetting, settings.soundEnabled],
  );

  /** Manual one-shot feedback previews for the Settings panel. */
  const testSound = useCallback(() => play("signal.go"), [play]);
  const testHaptics = useCallback(() => vibrate("signal"), [vibrate]);

  const unlockedAchievements = useMemo(() => new Set(stats.achievements), [stats.achievements]);
  const newlyUnlocked = useMemo(
    () => ACHIEVEMENTS.filter((a) => newAchievements.includes(a.id)),
    [newAchievements],
  );

  return {
    state,
    stats,
    hydrated,
    settings,
    settingsHydrated,
    updateSetting,
    resetSettings,
    soundEnabled: settings.soundEnabled,
    toggleSound,
    testSound,
    testHaptics,
    unlockedAchievements,
    newlyUnlocked,
    previousBestMs,
    previousBestAverageMs,
    previousRun,
    press,
    start,
    advanceNow,
    pause,
    resume,
    reset,
    clearStats,
    dismissAchievements,
    // Precision Timer mode
    precision,
    precisionRunningStartedAt,
    previousPrecisionBestAbs,
    precisionStart,
    precisionStop,
    precisionRetry,
    precisionSetTarget,
    precisionToLobby,
    // Target Hunter mode
    targetHunterComplete,
    targetHunterStart,
    previousTargetHunterBestScore,
    // Level Challenge mode
    levelChallengeComplete,
    levelChallengeStart,
    resetLevelProgress,
    previousLevelScore,
    // Shared feedback (stable identities) for the canvas engines.
    play,
    vibrate,
  };
}

export type ReactionGame = ReturnType<typeof useReactionGame>;
