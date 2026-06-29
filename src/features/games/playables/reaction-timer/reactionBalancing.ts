/**
 * Sprint 13 — gameplay balancing configuration for Reaction Timer Pro.
 *
 * Keep mode difficulty, scoring, rank thresholds, and mobile target sizes in one
 * place so future QA passes can tune the game without hunting through gameplay
 * components. Values are intentionally conservative: first-time users should be
 * able to make progress, while high ranks still require focus and consistency.
 */

export const REACTION_BALANCING_VERSION = "sprint13-2026-06";

export const reactionBalancing = {
  classic: {
    rounds: 5,
    /** Slightly shorter max wait keeps sessions snappy without encouraging guessing. */
    waitMinMs: 1400,
    waitMaxMs: 4200,
    rankThresholds: {
      eliteMs: 180,
      excellentMs: 235,
      goodMs: 310,
      averageMs: 420,
    },
    tipThresholds: {
      incredibleMs: 200,
      greatMs: 285,
      goodMs: 365,
    },
  },

  precision: {
    defaultTargetMs: 5000,
    presets: [3000, 5000, 7000] as const,
    randomMinMs: 3000,
    randomMaxMs: 8000,
    randomStepMs: 250,
    rankThresholds: {
      perfectMs: 20,
      excellentMs: 75,
      goodMs: 130,
      closeMs: 260,
    },
  },

  targetHunter: {
    durationMs: 30000,
    countdownFrom: 3,
    countdownIntervalMs: 650,
    firstSpawnDelayMs: 260,
    spawnDelayMs: 250,
    spawnDelayMinMs: 140,
    spawnComboStepMs: 8,
    mobileWidth: 560,
    targetDiameterDesktop: 72,
    targetDiameterMobile: 92,
    topControlsReserve: 76,
    edgePadding: 16,
    minPreviousDistanceRadiusMultiplier: 2.35,
    scoring: {
      hitPoints: 100,
      comboBonus: 22,
      missPenalty: 25,
      speedBonusCap: 110,
      speedBonusBaseMs: 920,
      speedBonusDivisor: 6,
      accuracyBaseMultiplier: 0.72,
      accuracyMultiplierRange: 0.28,
    },
    rankThresholds: {
      eliteScore: 2800,
      eliteAccuracy: 82,
      eliteAverageHitMs: 540,
      sharpScore: 1750,
      sharpAccuracy: 72,
      focusedScore: 900,
      warmupScore: 350,
    },
  },

  levelChallenge: {
    totalLevels: 6,
    countdownFrom: 3,
    countdownIntervalMs: 650,
    nextSpawnDelayMs: 250,
    signalWaitMinMs: 1150,
    signalWaitMaxMs: 2600,
    topControlsReserve: 76,
    edgePadding: 16,
    mobileWidth: 560,
    mobileScale: 1.32,
    ranks: {
      eliteScore: 1500,
      eliteAccuracy: 85,
      sharpScore: 950,
      sharpAccuracy: 70,
      solidScore: 450,
    },
    scoring: {
      hitPoints: 100,
      comboBonus: 20,
      missPenalty: 25,
      wrongTargetPenalty: 50,
      speedBonusCap: 170,
      speedBonusBaseMs: 920,
      speedBonusDivisor: 4,
      levelMultiplierStep: 0.15,
    },
    levels: [
      {
        index: 0,
        level: 1,
        id: "l1-signal",
        title: "Classic Signal",
        mechanic: "signal",
        objective: "Wait for GO, then react. Land 2 of 3 — or average under 520ms.",
        tip: "Watch the centre and react to the change. Don't anticipate.",
        opportunities: 3,
        requiredHits: 2,
        targetLifetimeMs: 0,
        baseRadius: 0,
        signalAttempts: 3,
        signalPassAvgMs: 520,
        signalMinValid: 2,
      },
      {
        index: 1,
        level: 2,
        id: "l2-fade",
        title: "Fade Target",
        mechanic: "fade",
        objective: "Hit the target before it fades. Catch 6 of 10.",
        tip: "Targets dissolve fast — strike as soon as you see one.",
        opportunities: 10,
        requiredHits: 6,
        targetLifetimeMs: 1350,
        baseRadius: 36,
        fade: true,
      },
      {
        index: 2,
        level: 3,
        id: "l3-shrink",
        title: "Shrink Target",
        mechanic: "shrink",
        objective: "Hit the target before it shrinks away. Catch 6 of 10.",
        tip: "Bigger is easier — go early while the target is large.",
        opportunities: 10,
        requiredHits: 6,
        targetLifetimeMs: 1450,
        baseRadius: 48,
        shrink: true,
        shrinkToRadius: 15,
      },
      {
        index: 3,
        level: 4,
        id: "l4-move",
        title: "Moving Target",
        mechanic: "move",
        objective: "Track and tap the moving target. Catch 5 of 10.",
        tip: "Lead the target slightly — tap where it's heading.",
        opportunities: 10,
        requiredHits: 5,
        targetLifetimeMs: 2050,
        baseRadius: 36,
        moveSpeed: 108,
      },
      {
        index: 4,
        level: 5,
        id: "l5-decoy",
        title: "Decoy Challenge",
        mechanic: "decoy",
        objective: "Hit only the ringed crosshair target. 6 of 10, under 5 wrong.",
        tip: "The correct target has a bright ring + crosshair. Decoys are slashed squares.",
        opportunities: 10,
        requiredHits: 6,
        maxWrong: 4,
        targetLifetimeMs: 2750,
        baseRadius: 34,
        decoys: 3,
      },
      {
        index: 5,
        level: 6,
        id: "l6-elite",
        title: "Elite Reflex",
        mechanic: "elite",
        objective: "Fade + movement + decoys, smaller targets. Hit 7 of 12.",
        tip: "Stay calm. Find the crosshair target first, then commit.",
        opportunities: 12,
        requiredHits: 7,
        maxWrong: 4,
        targetLifetimeMs: 1850,
        baseRadius: 30,
        fade: true,
        moveSpeed: 66,
        decoys: 2,
      },
    ] as const,
  },

  daily: {
    rankThresholds: {
      eliteScore: 900,
      excellentScore: 760,
      solidScore: 560,
      warmupScore: 320,
    },
    precision: {
      targetMinMs: 3000,
      targetMaxMs: 8000,
      targetStepMs: 250,
      thresholdsByDifficulty: { easy: 165, medium: 125, hard: 95 },
    },
    targetHunt: {
      durationByDifficultyMs: { easy: 20000, medium: 22000, hard: 25000 },
      scoreGoalByDifficulty: { easy: 900, medium: 1250, hard: 1650 },
      accuracyGoalByDifficulty: { easy: 60, medium: 68, hard: 75 },
    },
    classic: {
      targetAverageByDifficultyMs: { easy: 390, medium: 335, hard: 285 },
    },
  },
} as const;

export const BALANCING_SUMMARY = [
  {
    title: "Fair first run",
    detail: "Early levels and mobile target sizes were softened so new players can progress without feeling punished.",
  },
  {
    title: "Skill ceiling kept",
    detail: "Elite ranks still require speed plus accuracy, not just repeated tapping.",
  },
  {
    title: "Mode-specific scores",
    detail: "Classic, Precision, Target Hunter, Level Challenge, and Daily use separate tuned thresholds.",
  },
] as const;

export function clampScore(value: number, min = 0, max = 1000): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
