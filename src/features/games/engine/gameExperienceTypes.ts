import type { GameDefinition } from "../domain/game";

export type SharedGamePreferences = {
  muted: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  largeControls: boolean;
  autoPauseWhenHidden: boolean;
};

export type GameSessionStatus = "idle" | "playing" | "paused" | "completed";

export type GameSessionResult = {
  score?: number;
  scoreLabel?: string;
  summary?: string;
  outcome?: "completed" | "won" | "lost" | "practice";
  stats?: Record<string, string | number>;
  /** Only use when a larger numeric score is objectively better. */
  trackBestScore?: boolean;
};

export type StoredGameSessionResult = GameSessionResult & {
  completedAt: string;
  durationMs: number;
};

export type GameExperienceStats = {
  sessionsStarted: number;
  sessionsCompleted: number;
  totalPlayMs: number;
  bestScore: number | null;
  lastPlayedAt: string | null;
  lastResult: StoredGameSessionResult | null;
};

export type GameExperienceStore = {
  version: 1;
  preferences: SharedGamePreferences;
  onboardingCompleted: Record<string, boolean>;
  stats: Record<string, GameExperienceStats>;
};

export type GameExperienceManifest = {
  title: string;
  intro: string;
  controls: string;
  tips: string[];
  accessibilityNote: string;
  nativeOnboarding?: boolean;
  importedRuntime?: boolean;
};

export type RegisteredGameControls = {
  pause?: () => void;
  resume?: () => void;
  restart?: () => void;
  quit?: () => void;
  canPause?: boolean;
  canResume?: boolean;
  canRestart?: boolean;
};

export type GameSessionState = {
  status: GameSessionStatus;
  mode?: string;
  startedAt: number | null;
  pausedAt: number | null;
  pausedDurationMs: number;
  result: StoredGameSessionResult | null;
};

export type GameExperienceContextValue = {
  game: GameDefinition;
  manifest: GameExperienceManifest;
  hydrated: boolean;
  onboardingCompleted: boolean;
  completeOnboarding: () => void;
  preferences: SharedGamePreferences;
  updatePreference: <K extends keyof SharedGamePreferences>(key: K, value: SharedGamePreferences[K]) => void;
  resetPreferences: () => void;
  session: GameSessionState;
  stats: GameExperienceStats;
  startSession: (details?: { mode?: string }) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: (result?: GameSessionResult) => void;
  abandonSession: () => void;
  controls: RegisteredGameControls;
  registerControls: (controls: RegisteredGameControls) => () => void;
  isFullscreen: boolean;
  fullscreenSupported: boolean;
  toggleFullscreen: () => Promise<void>;
  announce: (message: string) => void;
  announcement: string;
};
