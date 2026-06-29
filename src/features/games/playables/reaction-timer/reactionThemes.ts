"use client";

/**
 * Sprint 17 — local visual themes + unlock rules for Reaction Timer Pro.
 *
 * Preferences intentionally live in a small, separate localStorage key so theme
 * changes never touch gameplay stats/progression. Unlocks are derived from the
 * normal local stats/achievements; if a theme becomes unavailable because the
 * user resets stats, the UI safely falls back to Darma Classic.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactionStorageV2 } from "./reactionTypes";

export const THEME_PREFS_KEY = "darma.game.reactionTimer.theme.v1";

export type ReactionThemeId = "classic" | "focus-dark" | "calm-ocean" | "sunset-pulse" | "soft-neon" | "high-contrast";

export type ReactionTheme = {
  id: ReactionThemeId;
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
  accentRgb: string;
  preview: string;
  unlockLabel: string;
  alwaysAvailable?: boolean;
  accessibility?: boolean;
  isUnlocked: (stats: ReactionStorageV2) => boolean;
};

function hasAchievement(stats: ReactionStorageV2, id: string): boolean {
  return stats.achievements.includes(id);
}

function hasAnyPlay(stats: ReactionStorageV2): boolean {
  return (
    stats.officialRuns > 0 ||
    stats.practiceRuns > 0 ||
    stats.precision.precisionRuns > 0 ||
    stats.targetHunter.targetHunterRuns > 0 ||
    stats.levelChallenge.levelChallengeRuns > 0 ||
    stats.daily.recentDailyResults.length > 0 ||
    stats.localBattle.localBattleRuns > 0
  );
}

export const REACTION_THEMES: ReactionTheme[] = [
  {
    id: "classic",
    label: "Darma Classic",
    shortLabel: "Classic",
    description: "The default purple-blue Darma arena with balanced effects.",
    accent: "#7c5cf6",
    accentRgb: "124, 92, 246",
    preview: "linear-gradient(135deg, #7c5cf6, #315cf6)",
    unlockLabel: "Available by default",
    alwaysAvailable: true,
    isUnlocked: () => true,
  },
  {
    id: "focus-dark",
    label: "Focus Dark",
    shortLabel: "Focus",
    description: "A calmer low-glare theme for longer focus sessions.",
    accent: "#38bdf8",
    accentRgb: "56, 189, 248",
    preview: "linear-gradient(135deg, #0f172a, #0369a1)",
    unlockLabel: "Reach Level 3 or unlock Focused Rank",
    isUnlocked: (stats) => stats.progression.level >= 3 || hasAchievement(stats, "progression-level-3"),
  },
  {
    id: "calm-ocean",
    label: "Calm Ocean",
    shortLabel: "Ocean",
    description: "A soft blue-green palette unlocked after your first play.",
    accent: "#14b8a6",
    accentRgb: "20, 184, 166",
    preview: "linear-gradient(135deg, #0e7490, #14b8a6)",
    unlockLabel: "Complete any first run or practice session",
    isUnlocked: hasAnyPlay,
  },
  {
    id: "sunset-pulse",
    label: "Sunset Pulse",
    shortLabel: "Sunset",
    description: "Warm, energetic gradients for daily routine players.",
    accent: "#fb923c",
    accentRgb: "251, 146, 60",
    preview: "linear-gradient(135deg, #fb7185, #fb923c)",
    unlockLabel: "Complete your first Daily Challenge",
    isUnlocked: (stats) => stats.daily.recentDailyResults.length > 0 || hasAchievement(stats, "daily-starter"),
  },
  {
    id: "soft-neon",
    label: "Soft Neon",
    shortLabel: "Neon",
    description: "A tasteful arcade accent unlocked by Target Hunter progress.",
    accent: "#a78bfa",
    accentRgb: "167, 139, 250",
    preview: "linear-gradient(135deg, #06b6d4, #a78bfa)",
    unlockLabel: "Reach a Target Hunter combo or score milestone",
    isUnlocked: (stats) =>
      stats.targetHunter.longestCombo >= 5 ||
      stats.targetHunter.bestScore >= 1500 ||
      hasAchievement(stats, "th-combo-five") ||
      hasAchievement(stats, "th-hunter-rookie"),
  },
  {
    id: "high-contrast",
    label: "High Contrast",
    shortLabel: "Contrast",
    description: "A stronger readability palette that is always available.",
    accent: "#facc15",
    accentRgb: "250, 204, 21",
    preview: "linear-gradient(135deg, #020617, #facc15)",
    unlockLabel: "Always available for accessibility",
    alwaysAvailable: true,
    accessibility: true,
    isUnlocked: () => true,
  },
];

export function getReactionTheme(id: string | null | undefined): ReactionTheme {
  return REACTION_THEMES.find((theme) => theme.id === id) ?? REACTION_THEMES[0];
}

export function isThemeUnlocked(theme: ReactionTheme, stats: ReactionStorageV2): boolean {
  return theme.alwaysAvailable === true || theme.isUnlocked(stats);
}

export function getUnlockedThemeCount(stats: ReactionStorageV2): number {
  return REACTION_THEMES.filter((theme) => isThemeUnlocked(theme, stats)).length;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeThemeId(value: unknown): ReactionThemeId {
  if (typeof value === "string" && REACTION_THEMES.some((theme) => theme.id === value)) return value as ReactionThemeId;
  return "classic";
}

export function readThemePreference(): ReactionThemeId {
  if (!canUseStorage()) return "classic";
  try {
    const raw = window.localStorage.getItem(THEME_PREFS_KEY);
    if (!raw) return "classic";
    const parsed = JSON.parse(raw) as { selectedThemeId?: unknown };
    return normalizeThemeId(parsed.selectedThemeId);
  } catch {
    return "classic";
  }
}

export function writeThemePreference(selectedThemeId: ReactionThemeId): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(THEME_PREFS_KEY, JSON.stringify({ selectedThemeId }));
  } catch {
    // Theme preference is cosmetic. Failing to save should never break play.
  }
}

export function useReactionTheme(stats: ReactionStorageV2) {
  const [selectedThemeId, setSelectedThemeId] = useState<ReactionThemeId>("classic");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSelectedThemeId(readThemePreference());
    setHydrated(true);
  }, []);

  const activeTheme = useMemo(() => {
    const selected = getReactionTheme(selectedThemeId);
    return isThemeUnlocked(selected, stats) ? selected : getReactionTheme("classic");
  }, [selectedThemeId, stats]);

  const selectTheme = useCallback(
    (nextThemeId: ReactionThemeId) => {
      const next = getReactionTheme(nextThemeId);
      if (!isThemeUnlocked(next, stats)) return false;
      setSelectedThemeId(next.id);
      writeThemePreference(next.id);
      return true;
    },
    [stats],
  );

  const resetTheme = useCallback(() => {
    setSelectedThemeId("classic");
    writeThemePreference("classic");
  }, []);

  return {
    hydrated,
    selectedThemeId,
    activeTheme,
    selectTheme,
    resetTheme,
  };
}
