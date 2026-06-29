/**
 * Achievement engine for Reaction Timer Pro.
 *
 * Rules are small, deterministic, and pure: each reads an `AchievementContext`
 * (the post-merge stats plus what just happened) and returns a boolean. They are
 * evaluated additively — once an id is in `stats.achievements` it stays unlocked,
 * so a rule flipping back to false never re-locks or re-fires a toast.
 *
 * Progress-style achievements expose `progress()` for the UI bar; the unlock
 * itself is still decided by `isUnlocked` so the two can never disagree.
 */

import type {
  Achievement,
  AchievementContext,
  AchievementRarity,
  ReactionStorageV2,
} from "./reactionTypes";

export const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
};

/** Sort weight for displaying rarity (epic first when desired). */
export const RARITY_ORDER: Record<AchievementRarity, number> = {
  epic: 0,
  rare: 1,
  uncommon: 2,
  common: 3,
};

const FINISHED_CLASSIC = (ctx: AchievementContext): boolean =>
  ctx.latest?.mode === "classic" && ctx.latest.validRounds >= 5;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-spark",
    glyph: "⚡",
    title: "First Spark",
    description: "Complete your first valid reaction.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.totalValidRounds >= 1,
  },
  {
    id: "clean-focus",
    glyph: "🎯",
    title: "Clean Focus",
    description: "Finish a 5-round challenge with zero early presses.",
    rarity: "uncommon",
    isUnlocked: (ctx) => FINISHED_CLASSIC(ctx) && ctx.latest!.earlyPresses === 0,
  },
  {
    id: "under-400",
    glyph: "🌱",
    title: "Under 400",
    description: "Get a reaction under 400ms.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.bestMs !== null && ctx.stats.bestMs < 400,
  },
  {
    id: "under-300",
    glyph: "🚀",
    title: "Under 300",
    description: "Get a reaction under 300ms.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.stats.bestMs !== null && ctx.stats.bestMs < 300,
  },
  {
    id: "under-250",
    glyph: "🔥",
    title: "Under 250",
    description: "Get a reaction under 250ms.",
    rarity: "rare",
    isUnlocked: (ctx) => ctx.stats.bestMs !== null && ctx.stats.bestMs < 250,
  },
  {
    id: "elite-reflex",
    glyph: "💎",
    title: "Elite Reflex",
    description: "Get a reaction under 180ms.",
    rarity: "epic",
    isUnlocked: (ctx) => ctx.stats.bestMs !== null && ctx.stats.bestMs < 180,
  },
  {
    id: "consistent-hands",
    glyph: "🤝",
    title: "Consistent Hands",
    description: "Finish a run with 85%+ consistency.",
    rarity: "rare",
    isUnlocked: (ctx) => FINISHED_CLASSIC(ctx) && ctx.latest!.consistency >= 85,
  },
  {
    id: "comeback",
    glyph: "📈",
    title: "Comeback",
    description: "Beat your previous best time.",
    rarity: "uncommon",
    isUnlocked: (ctx) =>
      ctx.latest?.bestMs != null &&
      ctx.previousBestMs !== null &&
      ctx.latest.bestMs < ctx.previousBestMs,
  },
  {
    id: "five-runs",
    glyph: "🏅",
    title: "Five Runs",
    description: "Complete 5 official runs.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.stats.officialRuns >= 5,
    progress: (s) => ({ current: Math.min(s.officialRuns, 5), target: 5 }),
  },
  {
    id: "ten-runs",
    glyph: "🏆",
    title: "Ten Runs",
    description: "Complete 10 official runs.",
    rarity: "rare",
    isUnlocked: (ctx) => ctx.stats.officialRuns >= 10,
    progress: (s) => ({ current: Math.min(s.officialRuns, 10), target: 10 }),
  },
  {
    id: "practice-starter",
    glyph: "🎛️",
    title: "Practice Starter",
    description: "Use practice mode.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.practiceRuns >= 1,
  },
  {
    id: "daily-return",
    glyph: "📅",
    title: "Daily Return",
    description: "Play on two different days.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.stats.playDays.length >= 2,
    progress: (s) => ({ current: Math.min(s.playDays.length, 2), target: 2 }),
  },
  {
    id: "no-guessing",
    glyph: "✅",
    title: "No Guessing",
    description: "Finish a run with no early presses and 100% accuracy.",
    rarity: "rare",
    isUnlocked: (ctx) => FINISHED_CLASSIC(ctx) && ctx.latest!.earlyPresses === 0 && ctx.latest!.accuracy === 100,
  },
  {
    id: "speed-climber",
    glyph: "🧗",
    title: "Speed Climber",
    description: "Improve your average from the previous run.",
    rarity: "uncommon",
    isUnlocked: (ctx) =>
      ctx.latest?.averageMs != null &&
      ctx.previousRun?.averageMs != null &&
      ctx.latest.averageMs < ctx.previousRun.averageMs,
  },

  // Precision Timer (Sprint 5). These read `ctx.precision` (the attempt that just
  // finished) and/or the persisted `precision` stats; they never fire on a
  // reaction-mode evaluation because `ctx.precision` is null there.
  {
    id: "precision-first-stop",
    glyph: "⏱️",
    title: "First Precision Stop",
    description: "Complete your first Precision Timer attempt.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.precision.precisionRuns >= 1,
  },
  {
    id: "precision-close-call",
    glyph: "🎯",
    title: "Close Call",
    description: "Stop within 250ms of the target.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.precision != null && ctx.precision.absDifferenceMs <= 250,
  },
  {
    id: "precision-sharp",
    glyph: "🪄",
    title: "Sharp Timer",
    description: "Stop within 120ms of the target.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.precision != null && ctx.precision.absDifferenceMs <= 120,
  },
  {
    id: "precision-expert",
    glyph: "🧭",
    title: "Precision Expert",
    description: "Stop within 75ms of the target.",
    rarity: "rare",
    isUnlocked: (ctx) => ctx.precision != null && ctx.precision.absDifferenceMs <= 75,
  },
  {
    id: "precision-perfect",
    glyph: "💠",
    title: "Perfect Timing",
    description: "Stop within 20ms of the target.",
    rarity: "epic",
    isUnlocked: (ctx) => ctx.precision != null && ctx.precision.absDifferenceMs <= 20,
  },
  {
    id: "precision-early-bird",
    glyph: "🐦",
    title: "Early Bird",
    description: "Stop early but within 120ms of the target.",
    rarity: "uncommon",
    isUnlocked: (ctx) =>
      ctx.precision != null && ctx.precision.differenceMs < 0 && ctx.precision.absDifferenceMs <= 120,
  },
  {
    id: "precision-late-nerves",
    glyph: "⏳",
    title: "Last Second Nerves",
    description: "Stop late but within 120ms of the target.",
    rarity: "uncommon",
    isUnlocked: (ctx) =>
      ctx.precision != null && ctx.precision.differenceMs > 0 && ctx.precision.absDifferenceMs <= 120,
  },

  // Target Hunter (Sprint 6). `ctx.targetHunter` is the run that just finished;
  // it is null for every other evaluation, so these never fire elsewhere.
  {
    id: "th-first-hit",
    glyph: "🎯",
    title: "First Hit",
    description: "Hit your first Target Hunter target.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.targetHunter.totalHits >= 1,
  },
  {
    id: "th-hunter-rookie",
    glyph: "🏹",
    title: "Hunter Rookie",
    description: "Complete your first Target Hunter run.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.targetHunter.targetHunterRuns >= 1,
  },
  {
    id: "th-combo-five",
    glyph: "🔥",
    title: "Combo Five",
    description: "Reach a 5-hit combo.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.stats.targetHunter.longestCombo >= 5,
  },
  {
    id: "th-combo-ten",
    glyph: "⚡",
    title: "Combo Ten",
    description: "Reach a 10-hit combo.",
    rarity: "rare",
    isUnlocked: (ctx) => ctx.stats.targetHunter.longestCombo >= 10,
  },
  {
    id: "th-clean-hunt",
    glyph: "🧼",
    title: "Clean Hunt",
    description: "Finish a Target Hunter run with 90%+ accuracy.",
    rarity: "rare",
    isUnlocked: (ctx) => ctx.targetHunter != null && ctx.targetHunter.hits > 0 && ctx.targetHunter.accuracy >= 90,
  },
  {
    id: "th-sharp-hunter",
    glyph: "🪄",
    title: "Sharp Hunter",
    description: "Finish a run with an average hit time under 500ms.",
    rarity: "rare",
    isUnlocked: (ctx) =>
      ctx.targetHunter != null && ctx.targetHunter.averageHitMs !== null && ctx.targetHunter.averageHitMs < 500,
  },
  {
    id: "th-lightning-tap",
    glyph: "🌩️",
    title: "Lightning Tap",
    description: "Hit a single target in under 250ms.",
    rarity: "epic",
    isUnlocked: (ctx) =>
      ctx.targetHunter != null && ctx.targetHunter.bestHitMs !== null && ctx.targetHunter.bestHitMs < 250,
  },

  // Level Challenge (Sprint 7). Most read the persisted per-level pass map so
  // they stay unlocked; a few read `ctx.levelChallenge` (the attempt that just
  // finished) for run-specific conditions. Null for every non-LC evaluation.
  {
    id: "lc-level-one",
    glyph: "🟢",
    title: "Level One Clear",
    description: "Complete Level 1: Classic Signal.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.levelChallenge.completedLevels.includes(1),
  },
  {
    id: "lc-fade",
    glyph: "🌫️",
    title: "Fade Catcher",
    description: "Complete Level 2: Fade Target.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.levelChallenge.completedLevels.includes(2),
  },
  {
    id: "lc-shrink",
    glyph: "🔬",
    title: "Shrink Master",
    description: "Complete Level 3: Shrink Target.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.stats.levelChallenge.completedLevels.includes(3),
  },
  {
    id: "lc-move",
    glyph: "🛰️",
    title: "Motion Tracker",
    description: "Complete Level 4: Moving Target.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.stats.levelChallenge.completedLevels.includes(4),
  },
  {
    id: "lc-decoy",
    glyph: "🃏",
    title: "Decoy Dodger",
    description: "Complete Level 5: Decoy Challenge.",
    rarity: "rare",
    isUnlocked: (ctx) => ctx.stats.levelChallenge.completedLevels.includes(5),
  },
  {
    id: "lc-elite",
    glyph: "👑",
    title: "Elite Clear",
    description: "Complete Level 6: Elite Reflex.",
    rarity: "epic",
    isUnlocked: (ctx) => ctx.stats.levelChallenge.completedLevels.includes(6),
  },
  {
    id: "lc-complete",
    glyph: "🏆",
    title: "Challenge Complete",
    description: "Complete all six levels.",
    rarity: "epic",
    isUnlocked: (ctx) => ctx.stats.levelChallenge.allLevelsCompletedAt !== null,
    progress: (s) => ({ current: Math.min(s.levelChallenge.completedLevels.length, 6), target: 6 }),
  },
  {
    id: "lc-clean-level",
    glyph: "🧼",
    title: "Clean Level",
    description: "Complete any level with 90%+ accuracy.",
    rarity: "rare",
    isUnlocked: (ctx) => ctx.levelChallenge != null && ctx.levelChallenge.passed && ctx.levelChallenge.accuracy >= 90,
  },
  {
    id: "lc-no-wrong",
    glyph: "🛡️",
    title: "No Wrong Target",
    description: "Complete the Decoy Challenge without hitting a decoy.",
    rarity: "rare",
    isUnlocked: (ctx) =>
      ctx.levelChallenge != null &&
      ctx.levelChallenge.level === 5 &&
      ctx.levelChallenge.passed &&
      ctx.levelChallenge.wrongTargets === 0,
  },
  {
    id: "lc-comeback",
    glyph: "🔁",
    title: "Comeback Clear",
    description: "Fail a level and then clear it on a retry.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.levelChallenge != null && ctx.levelChallenge.comebackClear,
  },
  {
    id: "lc-perfect-start",
    glyph: "✨",
    title: "Perfect Start",
    description: "Clear Level 1 with zero early presses.",
    rarity: "uncommon",
    isUnlocked: (ctx) =>
      ctx.levelChallenge != null &&
      ctx.levelChallenge.level === 1 &&
      ctx.levelChallenge.passed &&
      ctx.levelChallenge.earlyPresses === 0,
  },
  {
    id: "lc-focus-climber",
    glyph: "🧗",
    title: "Focus Climber",
    description: "Unlock Level 4.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.stats.levelChallenge.unlockedLevel >= 4,
  },


  // Local Battle (Sprint 9). These unlock from local-only two-player battles.
  {
    id: "battle-first-duel",
    glyph: "⚔️",
    title: "First Duel",
    description: "Complete your first Local Battle.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.localBattle.localBattleRuns >= 1,
  },
  {
    id: "battle-friendly-rivalry",
    glyph: "🤝",
    title: "Friendly Rivalry",
    description: "Complete 5 local battles.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.stats.localBattle.localBattleRuns >= 5,
    progress: (s) => ({ current: Math.min(s.localBattle.localBattleRuns, 5), target: 5 }),
  },
  {
    id: "battle-close-match",
    glyph: "🪡",
    title: "Close Match",
    description: "Finish a battle with a very small margin.",
    rarity: "uncommon",
    isUnlocked: (ctx) =>
      ctx.localBattle != null &&
      (ctx.localBattle.marginLabel.includes("0 ms") ||
        ctx.localBattle.marginLabel.includes("1 ms") ||
        ctx.localBattle.marginLabel.includes("2 ms") ||
        ctx.localBattle.winner === "draw"),
  },
  {
    id: "battle-clean-duel",
    glyph: "🧼",
    title: "Clean Duel",
    description: "Win a Classic Battle with zero early presses.",
    rarity: "rare",
    isUnlocked: (ctx) => {
      const battle = ctx.localBattle;
      if (!battle || battle.battleType !== "classic" || battle.winner === "draw") return false;
      const result = battle.winner === "player1" ? battle.player1Result : battle.player2Result;
      return result.kind === "classic" && result.earlyPresses === 0;
    },
  },
  {
    id: "battle-precision-duelist",
    glyph: "⏱️",
    title: "Precision Duelist",
    description: "Win a Precision Battle.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.localBattle != null && ctx.localBattle.battleType === "precision" && ctx.localBattle.winner !== "draw",
  },
  {
    id: "battle-hunter-duelist",
    glyph: "🏹",
    title: "Hunter Duelist",
    description: "Win a Target Hunt Battle.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.localBattle != null && ctx.localBattle.battleType === "target-hunter" && ctx.localBattle.winner !== "draw",
  },
  {
    id: "battle-rematch",
    glyph: "🔁",
    title: "Rematch",
    description: "Use rematch after a battle.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.localBattle.rematchCount >= 1,
  },

  // Daily Challenge (Sprint 8). These read the daily stats slice and the latest
  // daily result. Multiple attempts on the same date never duplicate-unlock.
  {
    id: "daily-starter",
    glyph: "📅",
    title: "Daily Starter",
    description: "Complete your first Daily Challenge.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.daily.recentDailyResults.length >= 1,
  },
  {
    id: "daily-streak-two",
    glyph: "🔥",
    title: "Streak Two",
    description: "Complete daily challenges on 2 different local days.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.stats.daily.longestDailyStreak >= 2,
    progress: (s) => ({ current: Math.min(s.daily.longestDailyStreak, 2), target: 2 }),
  },
  {
    id: "daily-streak-five",
    glyph: "🏆",
    title: "Streak Five",
    description: "Complete daily challenges on 5 different local days.",
    rarity: "rare",
    isUnlocked: (ctx) => ctx.stats.daily.longestDailyStreak >= 5,
    progress: (s) => ({ current: Math.min(s.daily.longestDailyStreak, 5), target: 5 }),
  },
  {
    id: "daily-perfect",
    glyph: "💎",
    title: "Daily Perfect",
    description: "Achieve a top rank in any Daily Challenge.",
    rarity: "rare",
    isUnlocked: (ctx) => ctx.dailyChallenge != null && ctx.dailyChallenge.score >= 900,
  },
  {
    id: "daily-comeback-day",
    glyph: "📈",
    title: "Comeback Day",
    description: "Improve today’s result after a replay.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.dailyChallenge != null && ctx.dailyChallenge.improvedToday,
  },
  {
    id: "daily-weekly-reflex",
    glyph: "🗓️",
    title: "Weekly Reflex",
    description: "Complete 5 daily challenges within the local activity window.",
    rarity: "rare",
    isUnlocked: (ctx) => ctx.stats.daily.weeklyActivity.length >= 5,
    progress: (s) => ({ current: Math.min(s.daily.weeklyActivity.length, 5), target: 5 }),
  },
  {
    id: "daily-local-champion",
    glyph: "🥇",
    title: "Local Champion",
    description: "Set a new local daily leaderboard best.",
    rarity: "rare",
    isUnlocked: (ctx) =>
      ctx.dailyChallenge != null &&
      ctx.stats.daily.localLeaderboards[0]?.id === ctx.dailyChallenge.id,
  },
  {
    id: "daily-consistent-routine",
    glyph: "✅",
    title: "Consistent Routine",
    description: "Complete 3 daily challenges with good accuracy.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.stats.daily.recentDailyResults.filter((r) => r.accuracy >= 75).length >= 3,
    progress: (s) => ({
      current: Math.min(s.daily.recentDailyResults.filter((r) => r.accuracy >= 75).length, 3),
      target: 3,
    }),
  },

  // Local progression / XP (Sprint 16). These unlock from the local-only
  // progression slice and never require an account or backend.
  {
    id: "progression-first-xp",
    glyph: "✨",
    title: "First XP",
    description: "Earn your first local progression XP.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.progression.xp > 0,
  },
  {
    id: "progression-level-3",
    glyph: "🎯",
    title: "Focused Rank",
    description: "Reach Level 3 and become Focused.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.progression.level >= 3,
    progress: (s) => ({ current: Math.min(s.progression.level, 3), target: 3 }),
  },
  {
    id: "progression-level-6",
    glyph: "⚡",
    title: "Sharp Rank",
    description: "Reach Level 6 in local progression.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.stats.progression.level >= 6,
    progress: (s) => ({ current: Math.min(s.progression.level, 6), target: 6 }),
  },
  {
    id: "progression-level-10",
    glyph: "🤲",
    title: "Quick Hands",
    description: "Reach Level 10 in local progression.",
    rarity: "rare",
    isUnlocked: (ctx) => ctx.stats.progression.level >= 10,
    progress: (s) => ({ current: Math.min(s.progression.level, 10), target: 10 }),
  },
  {
    id: "progression-reflex-pro",
    glyph: "🏅",
    title: "Reflex Pro",
    description: "Unlock the Reflex Pro rank title.",
    rarity: "epic",
    isUnlocked: (ctx) => ctx.stats.progression.unlockedRankTitles.includes("Reflex Pro"),
  },
  {
    id: "progression-all-rounder",
    glyph: "🧭",
    title: "All-Rounder",
    description: "Earn progression XP from at least five different activity types.",
    rarity: "rare",
    isUnlocked: (ctx) => new Set(ctx.stats.progression.xpHistory.map((event) => event.kind)).size >= 5,
  },

  // Shareable result cards (Sprint 11). These unlock only after a successful
  // copy/native-share/download action, all local-only and duplicate-safe.
  {
    id: "share-first",
    glyph: "📣",
    title: "First Share",
    description: "Copy or share your first result.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.share.shareCount >= 1,
  },
  {
    id: "share-downloaded-card",
    glyph: "🖼️",
    title: "Downloaded Card",
    description: "Download your first result card PNG.",
    rarity: "common",
    isUnlocked: (ctx) => ctx.stats.share.downloadCount >= 1,
  },
  {
    id: "share-daily-brag",
    glyph: "📅",
    title: "Daily Brag",
    description: "Share a Daily Challenge result.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.stats.share.dailyShareCount >= 1,
  },
  {
    id: "share-friendly-challenge",
    glyph: "⚔️",
    title: "Friendly Challenge",
    description: "Share a Local Battle result.",
    rarity: "uncommon",
    isUnlocked: (ctx) => ctx.stats.share.battleShareCount >= 1,
  },
  {
    id: "share-reflex-story",
    glyph: "🧩",
    title: "Reflex Story",
    description: "Share results from 3 different modes.",
    rarity: "rare",
    isUnlocked: (ctx) => ctx.stats.share.sharedModes.length >= 3,
    progress: (s) => ({ current: Math.min(s.share.sharedModes.length, 3), target: 3 }),
  },
];

export const ACHIEVEMENT_COUNT = ACHIEVEMENTS.length;

const ACHIEVEMENTS_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS_BY_ID.get(id);
}

/**
 * Evaluate every rule against the context and return the FULL set of unlocked
 * ids (already-unlocked ∪ newly-satisfied). The caller diffs against the prior
 * set to discover what is new and to stamp unlock timestamps.
 */
export function evaluateAchievements(ctx: AchievementContext): string[] {
  const unlocked = new Set(ctx.stats.achievements);
  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.has(achievement.id)) continue;
    if (achievement.isUnlocked(ctx)) unlocked.add(achievement.id);
  }
  return Array.from(unlocked);
}

/** Sorted achievements for display: unlocked first, then by rarity, then title. */
export function sortAchievementsForDisplay(unlocked: Set<string>): Achievement[] {
  return [...ACHIEVEMENTS].sort((a, b) => {
    const au = unlocked.has(a.id) ? 0 : 1;
    const bu = unlocked.has(b.id) ? 0 : 1;
    if (au !== bu) return au - bu;
    if (RARITY_ORDER[a.rarity] !== RARITY_ORDER[b.rarity]) return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
    return a.title.localeCompare(b.title);
  });
}

/** Convenience: progress for a progress-style achievement, or null. */
export function achievementProgress(
  achievement: Achievement,
  stats: ReactionStorageV2,
): { current: number; target: number; pct: number } | null {
  if (!achievement.progress) return null;
  const { current, target } = achievement.progress(stats);
  const pct = target > 0 ? Math.max(0, Math.min(100, Math.round((current / target) * 100))) : 0;
  return { current, target, pct };
}
