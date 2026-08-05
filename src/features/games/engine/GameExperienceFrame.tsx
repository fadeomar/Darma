"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Accessibility,
  CheckCircle2,
  Clock3,
  Gamepad2,
  Info,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameDefinition } from "../domain/game";
import { GameExperienceProvider, useGameExperience } from "./GameExperienceProvider";

function formatDuration(durationMs: number) {
  if (durationMs < 60_000) return `${Math.max(1, Math.round(durationMs / 1000))} sec`;
  const minutes = Math.floor(durationMs / 60_000);
  const seconds = Math.round((durationMs % 60_000) / 1000);
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes} min`;
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="darma-game-preference">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)} />
    </label>
  );
}

function GameExperienceContent({ children }: { children: ReactNode }) {
  const {
    game,
    manifest,
    hydrated,
    onboardingCompleted,
    completeOnboarding,
    preferences,
    updatePreference,
    resetPreferences,
    session,
    stats,
    controls,
    pauseSession,
    resumeSession,
    isFullscreen,
    fullscreenSupported,
    toggleFullscreen,
    announcement,
  } = useGameExperience();
  const [panel, setPanel] = useState<"instructions" | "settings" | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);

  const enterGame = useCallback(() => {
    completeOnboarding();
    setPanel(null);
    window.requestAnimationFrame(() => playerRef.current?.focus({ preventScroll: true }));
  }, [completeOnboarding]);

  const handlePause = useCallback(() => {
    controls.pause?.();
    pauseSession();
  }, [controls, pauseSession]);

  const handleResume = useCallback(() => {
    controls.resume?.();
    resumeSession();
  }, [controls, resumeSession]);

  const handleRestart = useCallback(() => {
    controls.restart?.();
  }, [controls]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key.toLowerCase() === "i" && event.shiftKey) {
        event.preventDefault();
        setPanel((current) => (current === "instructions" ? null : "instructions"));
      }
      if (event.key.toLowerCase() === "m" && event.shiftKey) {
        event.preventDefault();
        updatePreference("muted", !preferences.muted);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [preferences.muted, updatePreference]);

  const showOnboarding = hydrated && !manifest.nativeOnboarding && !onboardingCompleted;
  const sessionLabel = session.status === "playing"
    ? "Playing"
    : session.status === "paused"
      ? "Paused"
      : session.status === "completed"
        ? "Round complete"
        : "Ready";

  return (
    <div
      className={cn(
        "darma-game-experience",
        preferences.reducedMotion && "darma-game-experience--reduced-motion",
        preferences.highContrast && "darma-game-experience--high-contrast",
        preferences.largeControls && "darma-game-experience--large-controls",
        isFullscreen && "darma-game-experience--fullscreen",
      )}
      data-game-muted={preferences.muted ? "true" : "false"}
      data-game-session={session.status}
    >
      <div className="darma-game-experience__toolbar" data-darma-game-control="true">
        <div className="darma-game-experience__identity">
          <span className="darma-game-experience__icon" aria-hidden><Gamepad2 className="h-5 w-5" /></span>
          <span>
            <small>Darma game session</small>
            <strong>{game.title}</strong>
          </span>
          <Badge variant={session.status === "paused" ? "warning" : session.status === "completed" ? "soft" : "outline"}>
            {sessionLabel}
          </Badge>
        </div>

        <div className="darma-game-experience__actions">
          {session.status === "playing" && controls.pause && controls.canPause !== false ? (
            <Button size="sm" variant="secondary" onClick={handlePause} leftIcon={<Pause className="h-4 w-4" aria-hidden />}>
              Pause
            </Button>
          ) : null}
          {session.status === "paused" && controls.resume && controls.canResume !== false ? (
            <Button size="sm" variant="secondary" onClick={handleResume} leftIcon={<Play className="h-4 w-4" aria-hidden />}>
              Resume
            </Button>
          ) : null}
          {session.status === "completed" && controls.restart && controls.canRestart !== false ? (
            <Button size="sm" variant="soft" onClick={handleRestart} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>
              Replay
            </Button>
          ) : null}
          <Button
            size="icon"
            variant={panel === "instructions" ? "soft" : "ghost"}
            onClick={() => setPanel((current) => (current === "instructions" ? null : "instructions"))}
            aria-expanded={panel === "instructions"}
            aria-label="Game instructions"
            leftIcon={<Info className="h-4 w-4" aria-hidden />}
          >
            Instructions
          </Button>
          <Button
            size="icon"
            variant={panel === "settings" ? "soft" : "ghost"}
            onClick={() => setPanel((current) => (current === "settings" ? null : "settings"))}
            aria-expanded={panel === "settings"}
            aria-label="Game preferences"
            leftIcon={<Settings2 className="h-4 w-4" aria-hidden />}
          >
            Preferences
          </Button>
          {fullscreenSupported ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => void toggleFullscreen()}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              leftIcon={isFullscreen ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
            >
              {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            </Button>
          ) : null}
        </div>
      </div>

      {panel === "instructions" ? (
        <section className="darma-game-experience__panel" aria-labelledby="game-instructions-title">
          <div className="darma-game-experience__panel-head">
            <span>
              <small>Quick guide</small>
              <h3 id="game-instructions-title">How to play safely and clearly</h3>
            </span>
            <Button size="icon" variant="ghost" onClick={() => setPanel(null)} aria-label="Close instructions" leftIcon={<X className="h-4 w-4" aria-hidden />}>Close</Button>
          </div>
          <div className="darma-game-experience__guide-grid">
            <div>
              <strong>Controls</strong>
              <p>{manifest.controls}</p>
            </div>
            <div>
              <strong>Accessibility</strong>
              <p>{manifest.accessibilityNote}</p>
            </div>
            <div>
              <strong>Useful tips</strong>
              <ul>{manifest.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
            </div>
          </div>
        </section>
      ) : null}

      {panel === "settings" ? (
        <section className="darma-game-experience__panel" aria-labelledby="game-preferences-title">
          <div className="darma-game-experience__panel-head">
            <span>
              <small>Stored on this device</small>
              <h3 id="game-preferences-title">Shared game preferences</h3>
            </span>
            <Button size="icon" variant="ghost" onClick={() => setPanel(null)} aria-label="Close preferences" leftIcon={<X className="h-4 w-4" aria-hidden />}>Close</Button>
          </div>
          <div className="darma-game-preferences-grid">
            <PreferenceToggle label={preferences.muted ? "Sound muted" : "Sound enabled"} description="Integrated Darma games sync this preference; preserved games may keep their original controls." checked={preferences.muted} onChange={(value) => updatePreference("muted", value)} />
            <PreferenceToggle label="Reduce motion" description="Removes non-essential transitions and asks integrated games to simplify effects." checked={preferences.reducedMotion} onChange={(value) => updatePreference("reducedMotion", value)} />
            <PreferenceToggle label="High contrast" description="Strengthens player borders, surfaces, and labels." checked={preferences.highContrast} onChange={(value) => updatePreference("highContrast", value)} />
            <PreferenceToggle label="Larger controls" description="Increases shared toolbar and action target sizes." checked={preferences.largeControls} onChange={(value) => updatePreference("largeControls", value)} />
            <PreferenceToggle label="Auto-pause when hidden" description="Pauses compatible games when you switch tabs or lock the screen." checked={preferences.autoPauseWhenHidden} onChange={(value) => updatePreference("autoPauseWhenHidden", value)} />
          </div>
          <div className="darma-game-experience__panel-footer">
            <span><ShieldCheck className="h-4 w-4" aria-hidden /> Preferences and session summaries stay in local browser storage.</span>
            <Button size="sm" variant="outline" onClick={resetPreferences}>Reset shared preferences</Button>
          </div>
        </section>
      ) : null}

      <div ref={playerRef} tabIndex={-1} className="darma-game-experience__player">
        {children}
        {showOnboarding ? (
          <div className="darma-game-onboarding" role="dialog" aria-labelledby="game-onboarding-title">
            <div className="darma-game-onboarding__card">
              <span className="darma-game-onboarding__icon" aria-hidden><Gamepad2 className="h-6 w-6" /></span>
              <small>First time here</small>
              <h3 id="game-onboarding-title">{manifest.title}</h3>
              <p>{manifest.intro}</p>
              <div className="darma-game-onboarding__facts">
                <span><Clock3 className="h-4 w-4" aria-hidden /> {game.playTime} typical round</span>
                <span><Accessibility className="h-4 w-4" aria-hidden /> Shared accessibility controls</span>
                <span><ShieldCheck className="h-4 w-4" aria-hidden /> Local-only preferences</span>
              </div>
              <div className="darma-game-onboarding__controls">
                <strong>Controls</strong>
                <p>{manifest.controls}</p>
              </div>
              <Button size="lg" onClick={enterGame} leftIcon={<Play className="h-5 w-5" aria-hidden />}>
                Enter game
              </Button>
              <small className="darma-game-onboarding__shortcut">Open this guide later with Shift + I.</small>
            </div>
          </div>
        ) : null}
      </div>

      {session.status === "completed" && session.result ? (
        <div className="darma-game-experience__result" role="status">
          <span className="darma-game-experience__result-icon" aria-hidden><CheckCircle2 className="h-5 w-5" /></span>
          <span>
            <small>Latest completed session</small>
            <strong>{session.result.summary ?? session.result.scoreLabel ?? "Round complete"}</strong>
          </span>
          <span className="darma-game-experience__result-meta">
            {typeof session.result.score === "number" ? <Badge variant="soft">Score {session.result.score}</Badge> : null}
            <Badge variant="outline">{formatDuration(session.result.durationMs)}</Badge>
          </span>
        </div>
      ) : stats.sessionsCompleted > 0 && session.status === "idle" && stats.lastResult ? (
        <div className="darma-game-experience__history">
          <span><Clock3 className="h-4 w-4" aria-hidden /> {stats.sessionsCompleted} completed session{stats.sessionsCompleted === 1 ? "" : "s"}</span>
          <span>{formatDuration(stats.totalPlayMs)} recorded play</span>
          {stats.bestScore !== null ? <span>Best shared score {stats.bestScore}</span> : null}
        </div>
      ) : null}

      <span className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
    </div>
  );
}

export function GameExperienceFrame({ game, children }: { game: GameDefinition; children: ReactNode }) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  return (
    <div ref={shellRef} className="darma-game-experience-root">
      <GameExperienceProvider game={game} shellRef={shellRef}>
        <GameExperienceContent>{children}</GameExperienceContent>
      </GameExperienceProvider>
    </div>
  );
}
