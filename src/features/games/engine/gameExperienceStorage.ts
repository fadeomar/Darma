import { createLocalJsonStore } from "./gameStorageAdapter";
import type {
  GameExperienceStats,
  GameExperienceStore,
  SharedGamePreferences,
  StoredGameSessionResult,
} from "./gameExperienceTypes";

export const GAME_EXPERIENCE_STORAGE_KEY = "darma:games:experience:v1";

export const DEFAULT_SHARED_GAME_PREFERENCES: SharedGamePreferences = {
  muted: false,
  reducedMotion: false,
  highContrast: false,
  largeControls: false,
  autoPauseWhenHidden: true,
};

export const EMPTY_GAME_EXPERIENCE_STATS: GameExperienceStats = {
  sessionsStarted: 0,
  sessionsCompleted: 0,
  totalPlayMs: 0,
  bestScore: null,
  lastPlayedAt: null,
  lastResult: null,
};

export const DEFAULT_GAME_EXPERIENCE_STORE: GameExperienceStore = {
  version: 1,
  preferences: DEFAULT_SHARED_GAME_PREFERENCES,
  onboardingCompleted: {},
  stats: {},
};

function finiteNonNegative(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function nullableFinite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeResult(value: unknown): StoredGameSessionResult | null {
  if (!value || typeof value !== "object") return null;
  const result = value as Partial<StoredGameSessionResult>;
  const completedAt = typeof result.completedAt === "string" ? result.completedAt : null;
  if (!completedAt) return null;

  const stats = result.stats && typeof result.stats === "object"
    ? Object.fromEntries(
        Object.entries(result.stats).filter(([, item]) => typeof item === "string" || (typeof item === "number" && Number.isFinite(item))),
      )
    : undefined;

  return {
    score: nullableFinite(result.score) ?? undefined,
    scoreLabel: typeof result.scoreLabel === "string" ? result.scoreLabel.slice(0, 80) : undefined,
    summary: typeof result.summary === "string" ? result.summary.slice(0, 220) : undefined,
    outcome:
      result.outcome === "completed" || result.outcome === "won" || result.outcome === "lost" || result.outcome === "practice"
        ? result.outcome
        : undefined,
    stats,
    completedAt,
    durationMs: finiteNonNegative(result.durationMs),
  };
}

export function normalizeSharedGamePreferences(value: unknown): SharedGamePreferences {
  const candidate = value && typeof value === "object" ? (value as Partial<SharedGamePreferences>) : {};
  return {
    muted: typeof candidate.muted === "boolean" ? candidate.muted : DEFAULT_SHARED_GAME_PREFERENCES.muted,
    reducedMotion:
      typeof candidate.reducedMotion === "boolean" ? candidate.reducedMotion : DEFAULT_SHARED_GAME_PREFERENCES.reducedMotion,
    highContrast:
      typeof candidate.highContrast === "boolean" ? candidate.highContrast : DEFAULT_SHARED_GAME_PREFERENCES.highContrast,
    largeControls:
      typeof candidate.largeControls === "boolean" ? candidate.largeControls : DEFAULT_SHARED_GAME_PREFERENCES.largeControls,
    autoPauseWhenHidden:
      typeof candidate.autoPauseWhenHidden === "boolean"
        ? candidate.autoPauseWhenHidden
        : DEFAULT_SHARED_GAME_PREFERENCES.autoPauseWhenHidden,
  };
}

export function normalizeGameExperienceStats(value: unknown): GameExperienceStats {
  const candidate = value && typeof value === "object" ? (value as Partial<GameExperienceStats>) : {};
  return {
    sessionsStarted: Math.floor(finiteNonNegative(candidate.sessionsStarted)),
    sessionsCompleted: Math.floor(finiteNonNegative(candidate.sessionsCompleted)),
    totalPlayMs: finiteNonNegative(candidate.totalPlayMs),
    bestScore: nullableFinite(candidate.bestScore),
    lastPlayedAt: typeof candidate.lastPlayedAt === "string" ? candidate.lastPlayedAt : null,
    lastResult: normalizeResult(candidate.lastResult),
  };
}

export function normalizeGameExperienceStore(value: unknown): GameExperienceStore {
  const candidate = value && typeof value === "object" ? (value as Partial<GameExperienceStore>) : {};
  const onboardingCompleted = candidate.onboardingCompleted && typeof candidate.onboardingCompleted === "object"
    ? Object.fromEntries(
        Object.entries(candidate.onboardingCompleted).filter(
          ([key, completed]) => key.length > 0 && completed === true,
        ),
      )
    : {};
  const stats = candidate.stats && typeof candidate.stats === "object"
    ? Object.fromEntries(
        Object.entries(candidate.stats).map(([slug, item]) => [slug, normalizeGameExperienceStats(item)]),
      )
    : {};

  return {
    version: 1,
    preferences: normalizeSharedGamePreferences(candidate.preferences),
    onboardingCompleted,
    stats,
  };
}

export const gameExperienceStore = createLocalJsonStore<GameExperienceStore>({
  key: GAME_EXPERIENCE_STORAGE_KEY,
  version: 1,
  defaultState: DEFAULT_GAME_EXPERIENCE_STORE,
  migrate: normalizeGameExperienceStore,
});


export function readGameExperienceStore(): GameExperienceStore {
  if (typeof window === "undefined" || !window.localStorage) return DEFAULT_GAME_EXPERIENCE_STORE;

  try {
    if (window.localStorage.getItem(GAME_EXPERIENCE_STORAGE_KEY)) {
      return gameExperienceStore.read();
    }

    const preferences = { ...DEFAULT_SHARED_GAME_PREFERENCES };
    const legacySharedRaw = window.localStorage.getItem("darma.game.settings.v1");
    if (legacySharedRaw) {
      const legacy = JSON.parse(legacySharedRaw) as Record<string, unknown>;
      if (typeof legacy.soundEnabled === "boolean") preferences.muted = !legacy.soundEnabled;
      if (typeof legacy.reducedEffects === "boolean") preferences.reducedMotion = legacy.reducedEffects;
      if (typeof legacy.highContrastMode === "boolean") preferences.highContrast = legacy.highContrastMode;
    } else {
      const mathRaw = window.localStorage.getItem("darma.game.math-sprint.v1");
      if (mathRaw) {
        const math = JSON.parse(mathRaw) as Record<string, unknown>;
        if (typeof math.muted === "boolean") preferences.muted = math.muted;
      }
    }

    const migrated: GameExperienceStore = {
      ...DEFAULT_GAME_EXPERIENCE_STORE,
      preferences,
    };
    gameExperienceStore.write(migrated);
    return migrated;
  } catch {
    return gameExperienceStore.read();
  }
}

export function getStatsForGame(store: GameExperienceStore, slug: string): GameExperienceStats {
  return normalizeGameExperienceStats(store.stats[slug]);
}
