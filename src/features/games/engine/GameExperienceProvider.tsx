"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { GameDefinition } from "../domain/game";
import { getGameExperienceManifest } from "./gameExperienceRegistry";
import {
  DEFAULT_GAME_EXPERIENCE_STORE,
  DEFAULT_SHARED_GAME_PREFERENCES,
  EMPTY_GAME_EXPERIENCE_STATS,
  gameExperienceStore,
  getStatsForGame,
  readGameExperienceStore,
} from "./gameExperienceStorage";
import { calculateActiveSessionDuration, nextSharedBestScore } from "./gameExperienceSession";
import type {
  GameExperienceContextValue,
  GameExperienceStats,
  GameExperienceStore,
  GameSessionResult,
  GameSessionState,
  RegisteredGameControls,
  SharedGamePreferences,
  StoredGameSessionResult,
} from "./gameExperienceTypes";

const EMPTY_SESSION: GameSessionState = {
  status: "idle",
  startedAt: null,
  pausedAt: null,
  pausedDurationMs: 0,
  result: null,
};

const GameExperienceContext = createContext<GameExperienceContextValue | null>(null);

function persistStore(next: GameExperienceStore) {
  gameExperienceStore.write(next);
  return next;
}

export function GameExperienceProvider({
  game,
  shellRef,
  children,
}: {
  game: GameDefinition;
  shellRef: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const manifest = useMemo(() => getGameExperienceManifest(game), [game]);
  const [store, setStore] = useState<GameExperienceStore>(DEFAULT_GAME_EXPERIENCE_STORE);
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<GameSessionState>(EMPTY_SESSION);
  const sessionRef = useRef<GameSessionState>(EMPTY_SESSION);
  const [controls, setControls] = useState<RegisteredGameControls>({});
  const controlsTokenRef = useRef(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    setStore(readGameExperienceStore());
    setHydrated(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === gameExperienceStore.key) setStore(readGameExperienceStore());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [shellRef]);

  const updateStore = useCallback((updater: (current: GameExperienceStore) => GameExperienceStore) => {
    setStore((current) => persistStore(updater(current)));
  }, []);

  const completeOnboarding = useCallback(() => {
    updateStore((current) => ({
      ...current,
      onboardingCompleted: { ...current.onboardingCompleted, [game.slug]: true },
    }));
  }, [game.slug, updateStore]);

  const updatePreference = useCallback(<K extends keyof SharedGamePreferences>(key: K, value: SharedGamePreferences[K]) => {
    updateStore((current) => ({
      ...current,
      preferences: { ...current.preferences, [key]: value },
    }));
  }, [updateStore]);

  const resetPreferences = useCallback(() => {
    updateStore((current) => ({ ...current, preferences: { ...DEFAULT_SHARED_GAME_PREFERENCES } }));
  }, [updateStore]);

  const announce = useCallback((message: string) => {
    setAnnouncement("");
    window.setTimeout(() => setAnnouncement(message), 0);
  }, []);

  const startSession = useCallback((details?: { mode?: string }) => {
    const currentSession = sessionRef.current;
    if (currentSession.status === "playing" || currentSession.status === "paused") return;
    const now = Date.now();
    const next: GameSessionState = {
      status: "playing",
      mode: details?.mode,
      startedAt: now,
      pausedAt: null,
      pausedDurationMs: 0,
      result: null,
    };
    sessionRef.current = next;
    setSession(next);
    updateStore((current) => {
      const stats = getStatsForGame(current, game.slug);
      return {
        ...current,
        stats: {
          ...current.stats,
          [game.slug]: {
            ...stats,
            sessionsStarted: stats.sessionsStarted + 1,
            lastPlayedAt: new Date(now).toISOString(),
          },
        },
      };
    });
    announce(`${game.title} session started.`);
  }, [announce, game.slug, game.title, updateStore]);

  const pauseSession = useCallback(() => {
    const current = sessionRef.current;
    if (current.status !== "playing") return;
    const next = { ...current, status: "paused" as const, pausedAt: Date.now() };
    sessionRef.current = next;
    setSession(next);
    announce("Game paused.");
  }, [announce]);

  const resumeSession = useCallback(() => {
    const current = sessionRef.current;
    if (current.status !== "paused") return;
    const now = Date.now();
    const pausedFor = current.pausedAt === null ? 0 : Math.max(0, now - current.pausedAt);
    const next = {
      ...current,
      status: "playing" as const,
      pausedAt: null,
      pausedDurationMs: current.pausedDurationMs + pausedFor,
    };
    sessionRef.current = next;
    setSession(next);
    announce("Game resumed.");
  }, [announce]);

  const completeSession = useCallback((result: GameSessionResult = {}) => {
    const now = Date.now();
    const currentSession = sessionRef.current;
    if (currentSession.status === "completed" || currentSession.startedAt === null) return;
    const durationMs = calculateActiveSessionDuration(currentSession, now);
    const storedResult: StoredGameSessionResult = {
      score: result.score,
      scoreLabel: result.scoreLabel,
      summary: result.summary,
      outcome: result.outcome,
      stats: result.stats,
      completedAt: new Date(now).toISOString(),
      durationMs,
    };
    const nextSession: GameSessionState = {
      ...currentSession,
      status: "completed",
      pausedAt: null,
      result: storedResult,
    };
    sessionRef.current = nextSession;
    setSession(nextSession);
    updateStore((current) => {
      const stats = getStatsForGame(current, game.slug);
      const bestScore = nextSharedBestScore(stats.bestScore, result);
      return {
        ...current,
        stats: {
          ...current.stats,
          [game.slug]: {
            ...stats,
            sessionsCompleted: stats.sessionsCompleted + 1,
            totalPlayMs: stats.totalPlayMs + durationMs,
            bestScore,
            lastPlayedAt: storedResult.completedAt,
            lastResult: storedResult,
          },
        },
      };
    });
    announce(result.summary ? `Session complete. ${result.summary}` : "Session complete.");
  }, [announce, game.slug, updateStore]);

  const abandonSession = useCallback(() => {
    sessionRef.current = EMPTY_SESSION;
    setSession(EMPTY_SESSION);
    announce("Session ended without a saved result.");
  }, [announce]);

  const registerControls = useCallback((nextControls: RegisteredGameControls) => {
    const token = controlsTokenRef.current + 1;
    controlsTokenRef.current = token;
    setControls(nextControls);
    return () => {
      if (controlsTokenRef.current === token) setControls({});
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const element = shellRef.current;
    if (!element || typeof document === "undefined") return;
    try {
      if (document.fullscreenElement === element) await document.exitFullscreen();
      else if (document.fullscreenElement) {
        await document.exitFullscreen();
        await element.requestFullscreen?.();
      } else {
        await element.requestFullscreen?.();
      }
    } catch {
      announce("Fullscreen was blocked by the browser. The game is still playable in the page.");
    }
  }, [announce, shellRef]);

  const preferences = hydrated ? store.preferences : DEFAULT_SHARED_GAME_PREFERENCES;
  const stats: GameExperienceStats = hydrated ? getStatsForGame(store, game.slug) : EMPTY_GAME_EXPERIENCE_STATS;
  const fullscreenSupported = typeof document !== "undefined" && typeof document.documentElement.requestFullscreen === "function";

  useEffect(() => {
    if (!preferences.autoPauseWhenHidden) return;
    const onVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;
      const current = sessionRef.current;
      if (current.status !== "playing" || !controls.pause || controls.canPause === false) return;
      controls.pause();
      pauseSession();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [controls, pauseSession, preferences.autoPauseWhenHidden]);

  const value = useMemo<GameExperienceContextValue>(() => ({
    game,
    manifest,
    hydrated,
    onboardingCompleted: Boolean(store.onboardingCompleted[game.slug]),
    completeOnboarding,
    preferences,
    updatePreference,
    resetPreferences,
    session,
    stats,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    abandonSession,
    controls,
    registerControls,
    isFullscreen,
    fullscreenSupported,
    toggleFullscreen,
    announce,
    announcement,
  }), [
    abandonSession,
    announce,
    announcement,
    completeOnboarding,
    completeSession,
    controls,
    fullscreenSupported,
    game,
    hydrated,
    isFullscreen,
    manifest,
    pauseSession,
    preferences,
    registerControls,
    resetPreferences,
    resumeSession,
    session,
    startSession,
    stats,
    store.onboardingCompleted,
    toggleFullscreen,
    updatePreference,
  ]);

  return <GameExperienceContext.Provider value={value}>{children}</GameExperienceContext.Provider>;
}

export function useGameExperience(): GameExperienceContextValue {
  const value = useContext(GameExperienceContext);
  if (!value) throw new Error("useGameExperience must be used inside GameExperienceProvider");
  return value;
}

export function useGameExperienceControls(controls: RegisteredGameControls) {
  const { registerControls } = useGameExperience();
  const pause = controls.pause;
  const resume = controls.resume;
  const restart = controls.restart;
  const quit = controls.quit;
  const canPause = controls.canPause;
  const canResume = controls.canResume;
  const canRestart = controls.canRestart;

  useEffect(
    () => registerControls({ pause, resume, restart, quit, canPause, canResume, canRestart }),
    [canPause, canRestart, canResume, pause, quit, registerControls, restart, resume],
  );
}
