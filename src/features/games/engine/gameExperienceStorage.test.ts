import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHARED_GAME_PREFERENCES,
  normalizeGameExperienceStats,
  normalizeGameExperienceStore,
  normalizeSharedGamePreferences,
} from "./gameExperienceStorage";

describe("shared game experience storage", () => {
  it("falls back safely when preferences are malformed", () => {
    expect(normalizeSharedGamePreferences({ muted: "yes", highContrast: true })).toEqual({
      ...DEFAULT_SHARED_GAME_PREFERENCES,
      highContrast: true,
    });
  });

  it("drops invalid onboarding and stat values", () => {
    const normalized = normalizeGameExperienceStore({
      version: 99,
      preferences: { muted: true, largeControls: true },
      onboardingCompleted: { snake: true, tetris: false, broken: "yes" },
      stats: {
        snake: {
          sessionsStarted: 4.8,
          sessionsCompleted: -4,
          totalPlayMs: 1250,
          bestScore: 30,
          lastPlayedAt: "2026-07-29T10:00:00.000Z",
          lastResult: {
            score: 30,
            summary: "A short completed run",
            completedAt: "2026-07-29T10:00:00.000Z",
            durationMs: 1250,
            stats: { Apples: 4, Broken: null },
          },
        },
      },
    });

    expect(normalized.version).toBe(1);
    expect(normalized.onboardingCompleted).toEqual({ snake: true });
    expect(normalized.stats.snake.sessionsStarted).toBe(4);
    expect(normalized.stats.snake.sessionsCompleted).toBe(0);
    expect(normalized.stats.snake.lastResult?.stats).toEqual({ Apples: 4 });
  });

  it("returns an empty safe shape for corrupt game stats", () => {
    expect(normalizeGameExperienceStats("not-an-object")).toEqual({
      sessionsStarted: 0,
      sessionsCompleted: 0,
      totalPlayMs: 0,
      bestScore: null,
      lastPlayedAt: null,
      lastResult: null,
    });
  });
});
