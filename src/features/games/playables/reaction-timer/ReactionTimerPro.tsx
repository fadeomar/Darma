"use client";

/**
 * Reaction Timer Pro — the production player for `/games/reaction-timer`.
 *
 * Composes the arena (Canvas + overlay), HUD, per-phase overlays, the stats
 * strip (below the player, never beside it), and the achievement toast. Game
 * logic lives in `useReactionGame`; this component is layout + input wiring.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { Expand, Keyboard, Minimize2, MousePointerClick, Pause, Play, Settings, Volume2, VolumeX, X } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameDefinition } from "../../domain/game";
import { ReactionAchievementToast } from "./ReactionAchievementToast";
import { ReactionArena } from "./ReactionArena";
import { ReactionFinalSummary } from "./ReactionFinalSummary";
import { ReactionModeSelect } from "./ReactionModeSelect";
import { ReactionOnboardingCard } from "./ReactionOnboardingCard";
import { ReactionRoundResult } from "./ReactionRoundResult";
import { ReactionSettingsPanel } from "./ReactionSettingsPanel";
import { ReactionSessionFlowPanel } from "./ReactionSessionFlowPanel";
import { ReactionStatsStrip } from "./ReactionStatsStrip";
import { ReactionThemePanel } from "./ReactionThemePanel";
import { ReactionEducationSection } from "./ReactionEducationSection";
import { PrecisionView } from "./PrecisionView";
import { TargetHunterView } from "./TargetHunterView";
import { LevelChallengeView } from "./LevelChallengeView";
import { DailyChallengeView } from "./DailyChallengeView";
import { LocalBattleView } from "./LocalBattleView";
import { getInstruction } from "./reactionMachine";
import { CLASSIC_ROUNDS } from "./reactionScoring";
import { hapticsSupported } from "./reactionHaptics";
import { useFullscreen, useReducedMotion } from "./reactionHooks";
import { useReactionOnboarding } from "./reactionOnboarding";
import { useReactionTheme } from "./reactionThemes";
import { useActiveGameplayGuards, useVisibilityInterruption } from "./reactionRuntimeGuards";
import { useReactionGame } from "./useReactionGame";
import type { ReactionPhase } from "./reactionTypes";
import type { InputMethod } from "./reactionInsights";
import type { ReactionState } from "./reactionMachine";
import type { PrecisionPhase } from "./precisionTypes";
import type { ShareActionKind, ShareableGameResult } from "./reactionShareCard";

/** Map a precision phase to a reaction phase so the shared Canvas picks a tone. */
const PRECISION_CANVAS_PHASE: Record<PrecisionPhase, ReactionPhase> = {
  lobby: "idle",
  countdown: "countdown",
  running: "waiting",
  result: "round-result",
};

const SUBTEXT: Partial<Record<ReactionState["phase"], string>> = {
  countdown: "Keep your finger ready — do not tap before the signal.",
  waiting: "Wait for the signal… the next change is the real one.",
  signal: "Press now — anywhere in the arena.",
  "too-early": "Too soon — wait for the signal. This counts against accuracy.",
};

export function ReactionTimerPro({ game }: { game: GameDefinition }) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(shellRef);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hapticsAvailable, setHapticsAvailable] = useState(false);
  const [lastInputMethod, setLastInputMethod] = useState<InputMethod>("unknown");
  const { ready: onboardingReady, onboarding, completeIntro } = useReactionOnboarding();
  // Which mode owns the arena. "modes" shows the selector + classic/practice
  // flow; the others hand the arena to that mode's view.
  const [view, setView] = useState<"modes" | "precision" | "target-hunter" | "level-challenge" | "daily-challenge" | "local-battle">("modes");
  const game$ = useReactionGame();
  const {
    state,
    stats,
    hydrated,
    settings,
    updateSetting,
    resetSettings,
    soundEnabled,
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
    precision,
    precisionRunningStartedAt,
    previousPrecisionBestAbs,
    precisionStart,
    precisionStop,
    precisionRetry,
    precisionSetTarget,
    precisionToLobby,
    targetHunterComplete,
    targetHunterStart,
    previousTargetHunterBestScore,
    levelChallengeComplete,
    levelChallengeStart,
    resetLevelProgress,
    previousLevelScore,
    dailyChallengeComplete,
    dailyChallengeStart,
    localBattleComplete,
    localBattleStart,
    shareActionComplete,
    play,
    vibrate,
  } = game$;
  const { selectedThemeId, activeTheme, selectTheme, resetTheme } = useReactionTheme(stats);

  const phase = state.phase;
  const inPrecision = view === "precision";
  const inTargetHunter = view === "target-hunter";
  const inLevelChallenge = view === "level-challenge";
  const inDailyChallenge = view === "daily-challenge";
  const inLocalBattle = view === "local-battle";
  const isPlayPhase = phase === "waiting" || phase === "signal";
  const isClassic = state.mode === "classic";
  const classicTimingPhase = ["countdown", "waiting", "signal", "too-early", "round-result"].includes(phase);
  const precisionTimingPhase = inPrecision && ["countdown", "running"].includes(precision.phase);

  const openPrecision = useCallback(() => setView("precision"), []);
  const exitPrecision = useCallback(() => {
    precisionToLobby();
    setView("modes");
  }, [precisionToLobby]);
  const openTargetHunter = useCallback(() => setView("target-hunter"), []);
  const exitTargetHunter = useCallback(() => setView("modes"), []);
  const openLevelChallenge = useCallback(() => setView("level-challenge"), []);
  const exitLevelChallenge = useCallback(() => setView("modes"), []);
  const openDailyChallenge = useCallback(() => setView("daily-challenge"), []);
  const exitDailyChallenge = useCallback(() => setView("modes"), []);
  const openLocalBattle = useCallback(() => setView("local-battle"), []);
  const exitLocalBattle = useCallback(() => setView("modes"), []);
  // Treat system reduced-motion and the in-game "reduce effects" setting alike.
  const calmMotion = reducedMotion || settings.reducedEffects;

  // Detect haptics support on the client (avoids SSR/hydration mismatch).
  useEffect(() => {
    setHapticsAvailable(hapticsSupported());
  }, []);

  // Lightweight input-method awareness for educational result notes. It is not
  // used for scoring, because browser/device latency can vary by input path.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.pointerType === "pen" || event.pointerType === "mouse") {
        setLastInputMethod(event.pointerType);
      } else {
        setLastInputMethod("mouse");
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "Enter") setLastInputMethod("keyboard");
    };
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, { capture: true });
      window.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, []);

  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const hasAnyHistory = Boolean(
    hydrated &&
      (stats.officialRuns > 0 ||
        stats.practiceRuns > 0 ||
        stats.precision.precisionRuns > 0 ||
        stats.targetHunter.targetHunterRuns > 0 ||
        stats.levelChallenge.levelChallengeRuns > 0 ||
        stats.daily.recentDailyResults.length > 0 ||
        stats.localBattle.localBattleRuns > 0),
  );
  const showFirstRunOnboarding = hydrated && onboardingReady && !onboarding.introCompleted && !hasAnyHistory;
  const completeOnboardingAndStartClassic = useCallback(() => {
    completeIntro("completed");
    start("classic");
  }, [completeIntro, start]);
  const skipOnboarding = useCallback(() => {
    completeIntro("skipped");
  }, [completeIntro]);

  // Sprint 12: while timing-sensitive play is active, keep the page from
  // scrolling/selecting text and pause Classic runs if the tab becomes hidden.
  useActiveGameplayGuards(!settingsOpen && (classicTimingPhase || precisionTimingPhase));
  useVisibilityInterruption(classicTimingPhase && !settingsOpen, () => {
    if (["countdown", "waiting", "signal", "too-early", "round-result"].includes(phase)) pause();
  });

  const handleShareAction = useCallback(
    (action: ShareActionKind, result: ShareableGameResult) => {
      shareActionComplete({ action, mode: result.mode });
    },
    [shareActionComplete],
  );

  // Global keyboard: Space/Enter reacts (or starts / advances); Esc pauses.
  // Suppressed while the settings dialog owns input.
  useEffect(() => {
    if (settingsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

      // Target Hunter is pointer/touch-first. Let focused buttons handle
      // Space/Enter natively; only intercept Esc to leave the mode (when not
      // using Esc to exit fullscreen).
      if (inTargetHunter) {
        if (event.key === "Escape") {
          if (typeof document !== "undefined" && document.fullscreenElement) return;
          event.preventDefault();
          exitTargetHunter();
        }
        return;
      }

      // Level Challenge owns its own input (the stage listens for Space/Enter on
      // the signal level). Only intercept Esc here to leave the mode.
      if (inLevelChallenge) {
        if (event.key === "Escape") {
          if (typeof document !== "undefined" && document.fullscreenElement) return;
          event.preventDefault();
          exitLevelChallenge();
        }
        return;
      }

      // Daily Challenge owns its own keyboard flow. Only intercept Esc here to
      // leave the mode when the browser is not already using it for fullscreen.
      if (inDailyChallenge) {
        if (event.key === "Escape") {
          if (typeof document !== "undefined" && document.fullscreenElement) return;
          event.preventDefault();
          exitDailyChallenge();
        }
        return;
      }

      // Local Battle owns turn-level input. Only intercept Esc to leave the mode.
      if (inLocalBattle) {
        if (event.key === "Escape") {
          if (typeof document !== "undefined" && document.fullscreenElement) return;
          event.preventDefault();
          exitLocalBattle();
        }
        return;
      }

      // Precision mode owns the keyboard while it holds the arena.
      if (inPrecision) {
        if (event.code === "Space" || event.code === "Enter") {
          if (precision.phase === "running") {
            event.preventDefault();
            precisionStop();
          } else if (precision.phase === "lobby") {
            event.preventDefault();
            precisionStart();
          } else if (precision.phase === "result") {
            event.preventDefault();
            precisionRetry();
          }
          return;
        }
        if (event.key === "Escape") {
          if (typeof document !== "undefined" && document.fullscreenElement) return;
          event.preventDefault();
          exitPrecision();
        }
        return;
      }

      if (event.code === "Space" || event.code === "Enter") {
        if (phase === "waiting" || phase === "signal") {
          event.preventDefault();
          press();
        } else if (phase === "idle") {
          event.preventDefault();
          start("classic");
        } else if (phase === "round-result") {
          event.preventDefault();
          advanceNow();
        }
        return;
      }

      if (event.key === "Escape") {
        // Let the browser handle Esc to leave fullscreen.
        if (typeof document !== "undefined" && document.fullscreenElement) return;
        if (phase === "paused") {
          event.preventDefault();
          resume();
        } else if (["countdown", "waiting", "signal", "round-result", "too-early"].includes(phase)) {
          event.preventDefault();
          pause();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, press, start, advanceNow, pause, resume, settingsOpen, inPrecision, precision.phase, precisionStop, precisionStart, precisionRetry, exitPrecision, inTargetHunter, exitTargetHunter, inLevelChallenge, exitLevelChallenge, inDailyChallenge, exitDailyChallenge, inLocalBattle, exitLocalBattle]);

  const fullscreenControls = isFullscreen ? (
    <div className="rtp-hovercontrols">
      <button type="button" className="rtp-hovercontrol" data-rtp-control="true" onClick={toggleSound} aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}>
        {soundEnabled ? <Volume2 className="h-5 w-5" aria-hidden /> : <VolumeX className="h-5 w-5" aria-hidden />}
      </button>
      <button type="button" className="rtp-hovercontrol" data-rtp-control="true" onClick={() => setSettingsOpen(true)} aria-label="Open settings">
        <Settings className="h-5 w-5" aria-hidden />
      </button>
      {["countdown", "waiting", "signal", "round-result", "too-early"].includes(phase) ? (
        <button type="button" className="rtp-hovercontrol" data-rtp-control="true" onClick={pause} aria-label="Pause">
          <Pause className="h-5 w-5" aria-hidden />
        </button>
      ) : null}
      <button type="button" className="rtp-hovercontrol" data-rtp-control="true" onClick={toggleFullscreen} aria-label="Exit fullscreen">
        <X className="h-5 w-5" aria-hidden />
      </button>
    </div>
  ) : null;

  const instruction = getInstruction(state);
  const roundForDisplay = Math.min(state.validCount + (phase === "round-result" ? 0 : 1), CLASSIC_ROUNDS);

  let overlay: ReactNode;
  if (inPrecision) {
    overlay = (
      <PrecisionView
        state={precision}
        runningStartedAt={precisionRunningStartedAt}
        previousBestAbs={previousPrecisionBestAbs}
        stats={stats.precision}
        hydrated={hydrated}
        reducedMotion={calmMotion}
        onSetTarget={precisionSetTarget}
        onStart={precisionStart}
        onRetry={precisionRetry}
        onBack={exitPrecision}
        onShareAction={handleShareAction}
      />
    );
  } else if (phase === "idle") {
    overlay = (
      <div className="rtp-lobby-stack">
        {showFirstRunOnboarding ? (
          <ReactionOnboardingCard
            onStartClassic={completeOnboardingAndStartClassic}
            onSkip={skipOnboarding}
          />
        ) : null}
        <ReactionModeSelect
          stats={stats}
          hydrated={hydrated}
          lastResult={stats.lastResults[0] ?? null}
          isNewUser={!hasAnyHistory}
          recommendedMode="classic"
          onStartClassic={() => {
            if (showFirstRunOnboarding) completeIntro("completed");
            start("classic");
          }}
          onStartPractice={() => {
            if (showFirstRunOnboarding) completeIntro("completed");
            start("practice");
          }}
          onOpenPrecision={() => {
            if (showFirstRunOnboarding) completeIntro("completed");
            openPrecision();
          }}
          onOpenTargetHunter={() => {
            if (showFirstRunOnboarding) completeIntro("completed");
            openTargetHunter();
          }}
          onOpenLevelChallenge={() => {
            if (showFirstRunOnboarding) completeIntro("completed");
            openLevelChallenge();
          }}
          onOpenDailyChallenge={() => {
            if (showFirstRunOnboarding) completeIntro("completed");
            openDailyChallenge();
          }}
          onOpenLocalBattle={() => {
            if (showFirstRunOnboarding) completeIntro("completed");
            openLocalBattle();
          }}
        />
      </div>
    );
  } else if (phase === "round-result") {
    overlay = (
      <ReactionRoundResult
        attempt={state.lastAttempt}
        validCount={state.validCount}
        mode={state.mode}
        bestMs={stats.bestMs}
        reducedMotion={calmMotion}
        autoAdvance={settings.autoAdvance}
        onNext={advanceNow}
      />
    );
  } else if (phase === "final-summary" && state.run) {
    overlay = (
      <ReactionFinalSummary
        run={state.run}
        previousBestMs={previousBestMs}
        previousBestAverageMs={previousBestAverageMs}
        previousRun={previousRun}
        onPlayAgain={() => start("classic")}
        onPractice={() => start("practice")}
        onMenu={reset}
        inputMethod={lastInputMethod}
        showFirstRunGuide={state.run.mode === "classic" && previousRun === null}
        onShareAction={handleShareAction}
      />
    );
  } else if (phase === "paused") {
    overlay = (
      <div className="rtp-pause">
        <span className="rtp-eyebrow">Paused</span>
        <h2 className="rtp-pause-title">Take a breath</h2>
        <ReactionSessionFlowPanel
          compact
          flow={{
            title: "Run safely paused",
            description: "Resume keeps the current run in progress. Quit returns to the mode menu without saving this attempt.",
            steps: [
              { label: "Started", status: "done" },
              { label: "Paused", status: "active" },
              { label: "Resume or quit", status: "next" },
            ],
            tone: "info",
          }}
        />
        <div className="rtp-pause-actions" data-rtp-control="true">
          <Button size="lg" onClick={resume} leftIcon={<Play className="h-5 w-5" aria-hidden />}>
            Resume
          </Button>
          <Button size="lg" variant="outline" onClick={reset} leftIcon={<X className="h-5 w-5" aria-hidden />}>
            Quit to menu
          </Button>
        </div>
      </div>
    );
  } else {
    // countdown / waiting / signal / too-early
    overlay = (
      <div className="rtp-play">
        {isClassic ? (
          <div className="rtp-rounddots" aria-label={`Round ${roundForDisplay} of ${CLASSIC_ROUNDS}`}>
            {Array.from({ length: CLASSIC_ROUNDS }).map((_, index) => (
              <span key={index} className={cn("rtp-dot", index < state.validCount && "rtp-dot--done", index === state.validCount && "rtp-dot--active")} aria-hidden />
            ))}
          </div>
        ) : (
          <span className="rtp-eyebrow">Practice</span>
        )}
        <div
          className={cn(
            "rtp-instruction",
            phase === "countdown" && "rtp-instruction--countdown",
            phase === "waiting" && "rtp-instruction--waiting",
            phase === "signal" && "rtp-instruction--go",
            phase === "too-early" && "rtp-instruction--error",
          )}
          aria-live="assertive"
        >
          {instruction}
        </div>
        {settings.showHints ? <p className="rtp-play-sub">{SUBTEXT[phase]}</p> : null}
        {settings.inputHints ? (
          <div className="rtp-hints">
            <span className="rtp-hint">
              <MousePointerClick className="h-3.5 w-3.5" aria-hidden /> Click / tap
            </span>
            <span className="rtp-hint">
              <Keyboard className="h-3.5 w-3.5" aria-hidden /> Space / Enter
            </span>
            <span className="rtp-hint">Esc pauses</span>
          </div>
        ) : null}
      </div>
    );
  }

  const settingsModal = settingsOpen ? (
    <ReactionSettingsPanel
      settings={settings}
      hapticsAvailable={hapticsAvailable}
      onUpdate={updateSetting}
      onReset={resetSettings}
      onTestSound={testSound}
      onTestHaptics={testHaptics}
      onClose={closeSettings}
    />
  ) : null;

  return (
    <div
      ref={shellRef}
      className={cn(
        "rtp-shell group/rtp",
        isFullscreen && "rtp-shell--fullscreen",
        (settings.highContrastMode || activeTheme.id === "high-contrast") && "rtp-shell--contrast",
      )}
      data-rtp-theme={activeTheme.id}
      style={{ "--rtp-theme-accent-rgb": activeTheme.accentRgb } as CSSProperties}
    >
      <div className="rtp-topbar">
        <div className="rtp-topbar-id">
          <span className="rtp-eyebrow">Playable game</span>
          <h2 className="rtp-topbar-title">{game.title}</h2>
        </div>
        <div className="rtp-topbar-controls">
          <Badge variant="soft">5 rounds</Badge>
          <Badge variant="outline">{activeTheme.shortLabel} theme</Badge>
          <Badge variant="outline">performance.now()</Badge>
          <Button variant="ghost" size="sm" onClick={toggleSound} leftIcon={soundEnabled ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}>
            Sound {soundEnabled ? "on" : "off"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            leftIcon={<Settings className="h-4 w-4" aria-hidden />}
          >
            Settings
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFullscreen}
            leftIcon={isFullscreen ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Expand className="h-4 w-4" aria-hidden />}
          >
            {isFullscreen ? "Exit" : "Fullscreen"}
          </Button>
        </div>
      </div>

      {inLocalBattle ? (
        <LocalBattleView
          stats={stats.localBattle}
          hydrated={hydrated}
          reducedMotion={calmMotion}
          highContrast={settings.highContrastMode}
          play={play}
          vibrate={vibrate}
          onComplete={localBattleComplete}
          onRunStart={localBattleStart}
          onBack={exitLocalBattle}
          onShareAction={handleShareAction}
          topControls={fullscreenControls}
          modal={settingsModal}
          onModalBackdrop={closeSettings}
        />
      ) : inDailyChallenge ? (
        <DailyChallengeView
          stats={stats.daily}
          hydrated={hydrated}
          reducedMotion={calmMotion}
          highContrast={settings.highContrastMode}
          play={play}
          vibrate={vibrate}
          onComplete={dailyChallengeComplete}
          onRunStart={dailyChallengeStart}
          onBack={exitDailyChallenge}
          onShareAction={handleShareAction}
          topControls={fullscreenControls}
          modal={settingsModal}
          onModalBackdrop={closeSettings}
        />
      ) : inLevelChallenge ? (
        <LevelChallengeView
          stats={stats.levelChallenge}
          hydrated={hydrated}
          reducedMotion={calmMotion}
          highContrast={settings.highContrastMode}
          play={play}
          vibrate={vibrate}
          previousLevelScore={previousLevelScore}
          onComplete={levelChallengeComplete}
          onRunStart={levelChallengeStart}
          onResetProgress={resetLevelProgress}
          onBack={exitLevelChallenge}
          onShareAction={handleShareAction}
          topControls={fullscreenControls}
          modal={settingsModal}
          onModalBackdrop={closeSettings}
        />
      ) : inTargetHunter ? (
        <TargetHunterView
          stats={stats.targetHunter}
          hydrated={hydrated}
          reducedMotion={calmMotion}
          highContrast={settings.highContrastMode}
          play={play}
          vibrate={vibrate}
          previousBestScore={previousTargetHunterBestScore}
          onComplete={targetHunterComplete}
          onRunStart={targetHunterStart}
          onBack={exitTargetHunter}
          onShareAction={handleShareAction}
          topControls={fullscreenControls}
          modal={settingsModal}
          onModalBackdrop={closeSettings}
        />
      ) : (
        <ReactionArena
          phase={inPrecision ? PRECISION_CANVAS_PHASE[precision.phase] : phase}
          countdownValue={inPrecision ? precision.countdownValue : state.countdownValue}
          reducedMotion={calmMotion}
          interactive={inPrecision ? precision.phase === "running" : isPlayPhase}
          onPress={inPrecision ? precisionStop : press}
          ariaLabel={
            inPrecision
              ? precision.phase === "running"
                ? "Tap to stop the timer"
                : "Precision timer"
              : phase === "signal"
                ? "React now"
                : "Wait for the signal"
          }
          topControls={fullscreenControls}
          modal={settingsModal}
          onModalBackdrop={closeSettings}
        >
          {overlay}
        </ReactionArena>
      )}

      <ReactionStatsStrip
        stats={stats}
        hydrated={hydrated}
        unlockedAchievements={unlockedAchievements}
        onClearStats={clearStats}
      />

      <ReactionThemePanel
        stats={stats}
        selectedThemeId={selectedThemeId}
        activeThemeId={activeTheme.id}
        onSelectTheme={selectTheme}
        onResetTheme={resetTheme}
      />

      <ReactionEducationSection stats={stats} lastInputMethod={lastInputMethod} />

      <ReactionAchievementToast achievements={newlyUnlocked} onDismiss={dismissAchievements} />
    </div>
  );
}
