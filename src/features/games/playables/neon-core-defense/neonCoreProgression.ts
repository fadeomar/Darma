/**
 * Neon Core Defense — progression & retention logic.
 *
 * Pure, framework-free. No React, no DOM, no storage — the only outside value it
 * ever touches is a `Date` the caller passes in, and even that is immediately
 * reduced to a local `YYYY-MM-DD` string so the whole module is deterministic and
 * testable. `neonCoreStorage.ts` persists the `ProgressState` this module produces;
 * the React layer only renders it.
 *
 * The design rule that keeps this safe: every mutation returns a *new* state and is
 * idempotent where it needs to be. Unlocking an achievement, claiming a mission,
 * completing a daily, or buying a store item can all be called twice with no double
 * pay-out, because each checks a flag or set membership before granting anything.
 * Currency is clamped at zero and purchases check affordability, so it can never go
 * negative.
 */

import { DEFAULT_CONFIG, POWER_UP_ORDER, WEAPON_ORDER } from "./neonCoreEngine";
import type { NeonCoreConfig, PowerUpId, WeaponId } from "./neonCoreTypes";

export const PROGRESS_VERSION = 5 as const;

/* ========================================================================== */
/* Settings (game feel, accessibility, performance)                            */
/* ========================================================================== */

/**
 * Player-owned toggles persisted alongside progression. `reducedMotion` here is an
 * explicit opt-in; the runtime always also honours the OS `prefers-reduced-motion`
 * query, so the effective value is `setting || systemPreference`.
 */
export type GameSettings = {
  music: boolean;
  sfx: boolean;
  /** 0–1. */
  musicVolume: number;
  /** 0–1. */
  sfxVolume: number;
  reducedMotion: boolean;
  screenShake: boolean;
  particles: boolean;
  haptics: boolean;
  performanceMode: boolean;
};

export const DEFAULT_SETTINGS: GameSettings = {
  music: true,
  sfx: true,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  reducedMotion: false,
  screenShake: true,
  particles: true,
  haptics: true,
  performanceMode: false,
};

/* ========================================================================== */
/* Levels                                                                      */
/* ========================================================================== */

export const MAX_LEVEL = 30;

/**
 * XP required to advance *from* level `i+1` to level `i+2`, indexed from 0. The
 * curve is gentle early and steep late; `MAX_LEVEL` is a hard ceiling past which
 * surplus XP simply stops counting toward levels (it still accrues as lifetime XP).
 */
export const LEVEL_STEP_XP: number[] = Array.from({ length: MAX_LEVEL - 1 }, (_, i) => {
  const level = i + 1;
  return Math.round(120 * Math.pow(level, 1.35));
});

/** Cumulative XP needed to *reach* each level (index 0 = level 1 = 0 XP). */
export const LEVEL_CUMULATIVE_XP: number[] = (() => {
  const out = [0];
  for (const step of LEVEL_STEP_XP) out.push(out[out.length - 1] + step);
  return out;
})();

export type LevelInfo = {
  level: number;
  /** XP accumulated inside the current level. */
  intoLevel: number;
  /** XP span of the current level (0 at max level). */
  span: number;
  /** 0–1 fill toward the next level (1 at max level). */
  ratio: number;
  atMax: boolean;
};

/** Resolve a lifetime XP total into a level and progress toward the next. */
export function levelForXp(xp: number): LevelInfo {
  const total = Math.max(0, Math.floor(xp));
  let level = 1;
  for (let i = 1; i < LEVEL_CUMULATIVE_XP.length; i += 1) {
    if (total >= LEVEL_CUMULATIVE_XP[i]) level = i + 1;
    else break;
  }
  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, intoLevel: 0, span: 0, ratio: 1, atMax: true };
  }
  const base = LEVEL_CUMULATIVE_XP[level - 1];
  const span = LEVEL_CUMULATIVE_XP[level] - base;
  const intoLevel = total - base;
  return { level, intoLevel, span, ratio: span > 0 ? intoLevel / span : 0, atMax: false };
}

/* ========================================================================== */
/* Run result → XP & currency                                                  */
/* ========================================================================== */

/** The shape a finished run hands to the progression system. */
export type RunResult = {
  score: number;
  wave: number;
  combo: number;
  /** 0–100. */
  accuracy: number;
  shotsFired: number;
  shotsHit: number;
  enemiesDestroyed: number;
  survivalTime: number;
  powerUpsCollected: number;
  flawlessWaves: number;
  damageTaken: number;
  shotsByWeapon: Record<WeaponId, number>;
  powerUpsByKind: Record<PowerUpId, number>;
};

const XP_WEIGHTS = {
  perScore: 0.1,
  perWave: 40,
  perSecond: 2,
  perAccuracyPoint: 3,
  perKill: 2,
} as const;

/** XP earned from a single run. Never negative. */
export function xpForRun(run: RunResult): number {
  const accuracyXp = run.shotsFired >= 10 ? run.accuracy * XP_WEIGHTS.perAccuracyPoint : 0;
  const xp =
    run.score * XP_WEIGHTS.perScore +
    run.wave * XP_WEIGHTS.perWave +
    run.survivalTime * XP_WEIGHTS.perSecond +
    accuracyXp +
    run.enemiesDestroyed * XP_WEIGHTS.perKill;
  return Math.max(0, Math.round(xp));
}

/** Reward currency ("cores") earned from a single run. Never negative. */
export function currencyForRun(run: RunResult): number {
  const cores =
    Math.floor(run.score / 500) +
    run.wave * 2 +
    Math.floor(run.survivalTime / 15) +
    run.powerUpsCollected;
  return Math.max(run.score > 0 ? 1 : 0, cores);
}

/** Cores granted for crossing into a new level (per level gained). */
export const LEVEL_UP_REWARD = 30;

/* ========================================================================== */
/* Lifetime statistics                                                         */
/* ========================================================================== */

export type LifetimeStats = {
  runs: number;
  totalScore: number;
  totalEnemiesDestroyed: number;
  totalShotsFired: number;
  totalShotsHit: number;
  totalPowerUps: number;
  totalSurvival: number;
  flawlessWaves: number;
  /** Runs finished with accuracy ≥ 70% and a meaningful number of shots. */
  accurateRuns: number;
  bestScore: number;
  bestWave: number;
  bestCombo: number;
  bestSurvival: number;
  weaponShots: Record<WeaponId, number>;
  powerUpsByKind: Record<PowerUpId, number>;
};

function emptyWeaponRecord(): Record<WeaponId, number> {
  return { pulse: 0, rapid: 0, heavy: 0 };
}

function emptyPowerUpRecord(): Record<PowerUpId, number> {
  return { shield: 0, slowTime: 0, multiShot: 0, explosive: 0 };
}

export function emptyLifetime(): LifetimeStats {
  return {
    runs: 0,
    totalScore: 0,
    totalEnemiesDestroyed: 0,
    totalShotsFired: 0,
    totalShotsHit: 0,
    totalPowerUps: 0,
    totalSurvival: 0,
    flawlessWaves: 0,
    accurateRuns: 0,
    bestScore: 0,
    bestWave: 0,
    bestCombo: 0,
    bestSurvival: 0,
    weaponShots: emptyWeaponRecord(),
    powerUpsByKind: emptyPowerUpRecord(),
  };
}

const ACCURATE_RUN_THRESHOLD = 70;
const ACCURATE_RUN_MIN_SHOTS = 20;

function foldRunIntoLifetime(prev: LifetimeStats, run: RunResult): LifetimeStats {
  const weaponShots = emptyWeaponRecord();
  for (const id of WEAPON_ORDER) weaponShots[id] = prev.weaponShots[id] + toCount(run.shotsByWeapon?.[id]);
  const powerUpsByKind = emptyPowerUpRecord();
  for (const id of POWER_UP_ORDER) powerUpsByKind[id] = prev.powerUpsByKind[id] + toCount(run.powerUpsByKind?.[id]);

  const wasAccurate = run.shotsFired >= ACCURATE_RUN_MIN_SHOTS && run.accuracy >= ACCURATE_RUN_THRESHOLD;

  return {
    runs: prev.runs + 1,
    totalScore: prev.totalScore + toCount(run.score),
    totalEnemiesDestroyed: prev.totalEnemiesDestroyed + toCount(run.enemiesDestroyed),
    totalShotsFired: prev.totalShotsFired + toCount(run.shotsFired),
    totalShotsHit: prev.totalShotsHit + toCount(run.shotsHit),
    totalPowerUps: prev.totalPowerUps + toCount(run.powerUpsCollected),
    totalSurvival: prev.totalSurvival + Math.max(0, run.survivalTime),
    flawlessWaves: prev.flawlessWaves + toCount(run.flawlessWaves),
    accurateRuns: prev.accurateRuns + (wasAccurate ? 1 : 0),
    bestScore: Math.max(prev.bestScore, toCount(run.score)),
    bestWave: Math.max(prev.bestWave, toCount(run.wave)),
    bestCombo: Math.max(prev.bestCombo, toCount(run.combo)),
    bestSurvival: Math.max(prev.bestSurvival, Math.floor(Math.max(0, run.survivalTime))),
    weaponShots,
    powerUpsByKind,
  };
}

/* ========================================================================== */
/* Achievements                                                                */
/* ========================================================================== */

export type AchievementId =
  | "first-run"
  | "score-1k"
  | "score-5k"
  | "score-20k"
  | "wave-5"
  | "wave-10"
  | "wave-20"
  | "sharpshooter"
  | "deadeye"
  | "combo-25"
  | "combo-50"
  | "pulse-master"
  | "rapid-master"
  | "heavy-master"
  | "collector"
  | "survivor"
  | "flawless-first"
  | "flawless-five";

export type AchievementDef = {
  id: AchievementId;
  label: string;
  description: string;
  reward: number;
  /** True once the condition is met, given the post-run lifetime + this run. */
  test: (lifetime: LifetimeStats, run: RunResult) => boolean;
};

/** Centralized achievement definitions. Evaluated post-run; unlock is one-time. */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-run", label: "Power On", description: "Finish your first run.", reward: 25, test: (l) => l.runs >= 1 },
  { id: "score-1k", label: "Warming Up", description: "Score 1,000 in a run.", reward: 20, test: (l) => l.bestScore >= 1000 },
  { id: "score-5k", label: "Core Veteran", description: "Score 5,000 in a run.", reward: 40, test: (l) => l.bestScore >= 5000 },
  { id: "score-20k", label: "Overload", description: "Score 20,000 in a run.", reward: 120, test: (l) => l.bestScore >= 20000 },
  { id: "wave-5", label: "Holding", description: "Reach wave 5.", reward: 20, test: (l) => l.bestWave >= 5 },
  { id: "wave-10", label: "Entrenched", description: "Reach wave 10.", reward: 50, test: (l) => l.bestWave >= 10 },
  { id: "wave-20", label: "Immovable", description: "Reach wave 20.", reward: 140, test: (l) => l.bestWave >= 20 },
  {
    id: "sharpshooter",
    label: "Sharpshooter",
    description: "Finish a run at 80%+ accuracy (20+ shots).",
    reward: 45,
    test: (_l, r) => r.shotsFired >= 20 && r.accuracy >= 80,
  },
  {
    id: "deadeye",
    label: "Deadeye",
    description: "Finish a run at 95%+ accuracy (30+ shots).",
    reward: 90,
    test: (_l, r) => r.shotsFired >= 30 && r.accuracy >= 95,
  },
  { id: "combo-25", label: "On a Roll", description: "Reach a 25× combo.", reward: 40, test: (l) => l.bestCombo >= 25 },
  { id: "combo-50", label: "Unbroken", description: "Reach a 50× combo.", reward: 100, test: (l) => l.bestCombo >= 50 },
  { id: "pulse-master", label: "Pulse Master", description: "Fire 1,000 Pulse rounds.", reward: 40, test: (l) => l.weaponShots.pulse >= 1000 },
  { id: "rapid-master", label: "Rapid Master", description: "Fire 1,000 Rapid rounds.", reward: 40, test: (l) => l.weaponShots.rapid >= 1000 },
  { id: "heavy-master", label: "Heavy Master", description: "Fire 1,000 Heavy rounds.", reward: 40, test: (l) => l.weaponShots.heavy >= 1000 },
  { id: "collector", label: "Collector", description: "Collect 50 power-ups.", reward: 50, test: (l) => l.totalPowerUps >= 50 },
  { id: "survivor", label: "Survivor", description: "Survive 3 minutes in one run.", reward: 70, test: (_l, r) => r.survivalTime >= 180 },
  { id: "flawless-first", label: "Untouched", description: "Clear a wave without taking damage.", reward: 30, test: (_l, r) => r.flawlessWaves >= 1 },
  { id: "flawless-five", label: "Pristine", description: "Clear 5 flawless waves in total.", reward: 80, test: (l) => l.flawlessWaves >= 5 },
];

const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

/* ========================================================================== */
/* Missions (lifetime, claimable)                                              */
/* ========================================================================== */

export type MissionId =
  | "destroy-500"
  | "reach-wave-15"
  | "score-50k-total"
  | "heavy-2k"
  | "collect-100"
  | "combo-40"
  | "accurate-5";

export type MissionDef = {
  id: MissionId;
  label: string;
  description: string;
  target: number;
  reward: number;
  /** Current progress toward `target`, from lifetime stats. */
  progress: (lifetime: LifetimeStats) => number;
};

/** Centralized mission definitions. Progress is lifetime-cumulative. */
export const MISSIONS: MissionDef[] = [
  { id: "destroy-500", label: "Purge", description: "Destroy 500 drones.", target: 500, reward: 60, progress: (l) => l.totalEnemiesDestroyed },
  { id: "reach-wave-15", label: "Deep Defence", description: "Reach wave 15.", target: 15, reward: 70, progress: (l) => l.bestWave },
  { id: "score-50k-total", label: "Six Figures Soon", description: "Earn 50,000 lifetime score.", target: 50000, reward: 60, progress: (l) => l.totalScore },
  { id: "heavy-2k", label: "Heavy Hitter", description: "Fire 2,000 Heavy rounds.", target: 2000, reward: 60, progress: (l) => l.weaponShots.heavy },
  { id: "collect-100", label: "Magpie", description: "Collect 100 power-ups.", target: 100, reward: 60, progress: (l) => l.totalPowerUps },
  { id: "combo-40", label: "Chain Reaction", description: "Reach a 40× combo.", target: 40, reward: 70, progress: (l) => l.bestCombo },
  { id: "accurate-5", label: "Marksman", description: "Finish 5 runs at 70%+ accuracy.", target: 5, reward: 80, progress: (l) => l.accurateRuns },
];

const MISSION_BY_ID = new Map(MISSIONS.map((m) => [m.id, m]));

export type MissionState = { claimed: boolean };

/* ========================================================================== */
/* Daily challenges (derived from the date, never stored as definitions)       */
/* ========================================================================== */

export type DailyMetric = "destroy" | "wave" | "score" | "powerups" | "combo" | "weaponShots" | "survive";

export type DailyChallenge = {
  /** Stable within a given day; used only for display keys. */
  key: string;
  metric: DailyMetric;
  label: string;
  target: number;
  reward: number;
  weapon?: WeaponId;
  /** "sum" accumulates across the day's runs; "max" tracks the day's best. */
  mode: "sum" | "max";
};

type DailyTemplate = {
  metric: DailyMetric;
  mode: "sum" | "max";
  reward: number;
  /** Produce a target from the day's seeded RNG. */
  make: (rng: () => number) => { target: number; weapon?: WeaponId };
  label: (target: number, weapon?: WeaponId) => string;
};

const WEAPON_LABEL: Record<WeaponId, string> = { pulse: "Pulse", rapid: "Rapid", heavy: "Heavy" };

const DAILY_TEMPLATES: DailyTemplate[] = [
  {
    metric: "destroy",
    mode: "sum",
    reward: 25,
    make: (rng) => ({ target: 40 + Math.floor(rng() * 60) }),
    label: (t) => `Destroy ${t} drones today`,
  },
  {
    metric: "wave",
    mode: "max",
    reward: 25,
    make: (rng) => ({ target: 6 + Math.floor(rng() * 8) }),
    label: (t) => `Reach wave ${t} in a run`,
  },
  {
    metric: "score",
    mode: "sum",
    reward: 25,
    make: (rng) => ({ target: 2000 + Math.floor(rng() * 6000) }),
    label: (t) => `Earn ${t.toLocaleString()} score today`,
  },
  {
    metric: "powerups",
    mode: "sum",
    reward: 25,
    make: (rng) => ({ target: 4 + Math.floor(rng() * 8) }),
    label: (t) => `Collect ${t} power-ups today`,
  },
  {
    metric: "combo",
    mode: "max",
    reward: 25,
    make: (rng) => ({ target: 12 + Math.floor(rng() * 18) }),
    label: (t) => `Reach a ${t}× combo`,
  },
  {
    metric: "weaponShots",
    mode: "sum",
    reward: 25,
    make: (rng) => {
      const weapon = WEAPON_ORDER[Math.floor(rng() * WEAPON_ORDER.length)];
      return { target: 120 + Math.floor(rng() * 180), weapon };
    },
    label: (t, weapon) => `Fire ${t} ${weapon ? WEAPON_LABEL[weapon] : ""} rounds today`,
  },
  {
    metric: "survive",
    mode: "sum",
    reward: 25,
    make: (rng) => ({ target: 120 + Math.floor(rng() * 180) }),
    label: (t) => `Survive ${Math.round(t / 60)} minutes in total today`,
  },
];

/** Local calendar day as `YYYY-MM-DD`. Uses local getters, never UTC. */
export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Deterministic string hash → 32-bit seed. */
function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DAILY_COUNT = 3;

/**
 * The three challenges for a given day. Pure function of the date string, so the
 * same day always yields the same set on any device without storing definitions —
 * only per-day progress is persisted.
 */
export function dailyChallengesFor(key: string): DailyChallenge[] {
  const rng = mulberry32(hashSeed(key));
  // Shuffle template indices, take the first three distinct.
  const order = DAILY_TEMPLATES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.slice(0, DAILY_COUNT).map((templateIndex) => {
    const template = DAILY_TEMPLATES[templateIndex];
    const { target, weapon } = template.make(rng);
    return {
      key: `${key}:${template.metric}:${target}:${weapon ?? ""}`,
      metric: template.metric,
      label: template.label(target, weapon),
      target,
      reward: template.reward,
      weapon,
      mode: template.mode,
    };
  });
}

export type DailyEntryState = { progress: number; completed: boolean };

export type DailyState = {
  dateKey: string;
  entries: DailyEntryState[];
};

function freshDaily(key: string): DailyState {
  return { dateKey: key, entries: dailyChallengesFor(key).map(() => ({ progress: 0, completed: false })) };
}

/** How much a run contributes to a daily metric. */
function dailyContribution(challenge: DailyChallenge, run: RunResult): number {
  switch (challenge.metric) {
    case "destroy":
      return run.enemiesDestroyed;
    case "wave":
      return run.wave;
    case "score":
      return run.score;
    case "powerups":
      return run.powerUpsCollected;
    case "combo":
      return run.combo;
    case "weaponShots":
      return challenge.weapon ? toCount(run.shotsByWeapon?.[challenge.weapon]) : 0;
    case "survive":
      return run.survivalTime;
    default:
      return 0;
  }
}

/* ========================================================================== */
/* Unlock catalog (weapons, passive modifiers, cosmetic themes)                */
/* ========================================================================== */

export type CatalogKind = "weapon" | "modifier" | "theme";

export type ModifierId = "hardened-core" | "rapid-coils" | "velocity" | "scavenger" | "momentum";
export type ThemeId = "neon" | "ember" | "toxic" | "mono" | "gold";

export type CatalogItem = {
  id: string;
  kind: CatalogKind;
  label: string;
  description: string;
  /** Cost in cores. 0 means unlocked by default. */
  cost: number;
};

/** Everything buyable, plus the free defaults (cost 0). Centralized. */
export const CATALOG: CatalogItem[] = [
  // Weapons — Pulse is free; Rapid and Heavy are unlocked through the store.
  { id: "weapon:pulse", kind: "weapon", label: "Pulse", description: "Balanced default weapon.", cost: 0 },
  { id: "weapon:rapid", kind: "weapon", label: "Rapid", description: "Fast, light rounds for swarms.", cost: 150 },
  { id: "weapon:heavy", kind: "weapon", label: "Heavy", description: "Slow, heavy rounds for hulks.", cost: 250 },
  // Passive modifiers — equip up to MODIFIER_SLOTS at once.
  { id: "mod:hardened-core", kind: "modifier", label: "Hardened Core", description: "+3 max core integrity.", cost: 200 },
  { id: "mod:rapid-coils", kind: "modifier", label: "Rapid Coils", description: "8% shorter fire cooldown.", cost: 200 },
  { id: "mod:velocity", kind: "modifier", label: "Velocity", description: "10% faster projectiles.", cost: 150 },
  { id: "mod:scavenger", kind: "modifier", label: "Scavenger", description: "50% higher power-up drop rate.", cost: 250 },
  { id: "mod:momentum", kind: "modifier", label: "Momentum", description: "Combos build faster and cap higher.", cost: 300 },
  // Cosmetic themes — Neon is free.
  { id: "theme:neon", kind: "theme", label: "Neon", description: "The classic cyan arena.", cost: 0 },
  { id: "theme:ember", kind: "theme", label: "Ember", description: "Warm amber and crimson.", cost: 120 },
  { id: "theme:toxic", kind: "theme", label: "Toxic", description: "Acid green haze.", cost: 120 },
  { id: "theme:mono", kind: "theme", label: "Mono", description: "Stark monochrome.", cost: 200 },
  { id: "theme:gold", kind: "theme", label: "Gold", description: "Molten gold prestige.", cost: 400 },
];

const CATALOG_BY_ID = new Map(CATALOG.map((c) => [c.id, c]));

/** Items owned from the start. */
export const DEFAULT_UNLOCKS: string[] = CATALOG.filter((c) => c.cost === 0).map((c) => c.id);

export const MODIFIER_SLOTS = 2;

export type ThemePalette = {
  id: ThemeId;
  /** Canvas arena veil / clear colour. */
  bg: string;
  /** Core body + halo hue family. */
  coreHue: number;
};

export const THEME_PALETTES: Record<ThemeId, ThemePalette> = {
  neon: { id: "neon", bg: "#07050f", coreHue: 195 },
  ember: { id: "ember", bg: "#0f0705", coreHue: 22 },
  toxic: { id: "toxic", bg: "#050f07", coreHue: 130 },
  mono: { id: "mono", bg: "#0a0a0c", coreHue: 220 },
  gold: { id: "gold", bg: "#0f0c05", coreHue: 45 },
};

export type Loadout = {
  /** Preferred starting weapon; falls back to Pulse if somehow locked. */
  weapon: WeaponId;
  /** Equipped passive modifier ids (bare, e.g. "hardened-core"), ≤ MODIFIER_SLOTS. */
  modifiers: ModifierId[];
  theme: ThemeId;
};

/* ========================================================================== */
/* The persisted state                                                         */
/* ========================================================================== */

export type ProgressState = {
  version: typeof PROGRESS_VERSION;
  xp: number;
  currency: number;
  lifetime: LifetimeStats;
  /** Unlocked achievement ids (one-time; membership is the guard). */
  achievements: AchievementId[];
  missions: Record<MissionId, MissionState>;
  daily: DailyState;
  /** Owned catalog item ids (full ids, e.g. "weapon:rapid"). */
  unlocks: string[];
  loadout: Loadout;
  settings: GameSettings;
};

export function defaultProgress(today = new Date()): ProgressState {
  const missions = {} as Record<MissionId, MissionState>;
  for (const mission of MISSIONS) missions[mission.id] = { claimed: false };
  return {
    version: PROGRESS_VERSION,
    xp: 0,
    currency: 0,
    lifetime: emptyLifetime(),
    achievements: [],
    missions,
    daily: freshDaily(dateKey(today)),
    unlocks: [...DEFAULT_UNLOCKS],
    loadout: { weapon: "pulse", modifiers: [], theme: "neon" },
    settings: { ...DEFAULT_SETTINGS },
  };
}

/* ========================================================================== */
/* Sanitisation (corruption-safe)                                              */
/* ========================================================================== */

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function toNonNegative(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function toTally<K extends string>(raw: unknown, keys: readonly K[]): Record<K, number> {
  const source = (raw ?? {}) as Partial<Record<K, unknown>>;
  const out = {} as Record<K, number>;
  for (const key of keys) out[key] = toCount(source[key]);
  return out;
}

function sanitizeLifetime(raw: unknown): LifetimeStats {
  const r = (raw ?? {}) as Partial<LifetimeStats>;
  return {
    runs: toCount(r.runs),
    totalScore: toCount(r.totalScore),
    totalEnemiesDestroyed: toCount(r.totalEnemiesDestroyed),
    totalShotsFired: toCount(r.totalShotsFired),
    totalShotsHit: toCount(r.totalShotsHit),
    totalPowerUps: toCount(r.totalPowerUps),
    totalSurvival: toNonNegative(r.totalSurvival),
    flawlessWaves: toCount(r.flawlessWaves),
    accurateRuns: toCount(r.accurateRuns),
    bestScore: toCount(r.bestScore),
    bestWave: toCount(r.bestWave),
    bestCombo: toCount(r.bestCombo),
    bestSurvival: toCount(r.bestSurvival),
    weaponShots: toTally(r.weaponShots, WEAPON_ORDER),
    powerUpsByKind: toTally(r.powerUpsByKind, POWER_UP_ORDER),
  };
}

function toBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toUnit(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

function sanitizeSettings(raw: unknown): GameSettings {
  const r = (raw ?? {}) as Partial<GameSettings>;
  return {
    music: toBool(r.music, DEFAULT_SETTINGS.music),
    sfx: toBool(r.sfx, DEFAULT_SETTINGS.sfx),
    musicVolume: toUnit(r.musicVolume, DEFAULT_SETTINGS.musicVolume),
    sfxVolume: toUnit(r.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
    reducedMotion: toBool(r.reducedMotion, DEFAULT_SETTINGS.reducedMotion),
    screenShake: toBool(r.screenShake, DEFAULT_SETTINGS.screenShake),
    particles: toBool(r.particles, DEFAULT_SETTINGS.particles),
    haptics: toBool(r.haptics, DEFAULT_SETTINGS.haptics),
    performanceMode: toBool(r.performanceMode, DEFAULT_SETTINGS.performanceMode),
  };
}

/** Merge a partial settings patch, returning a new state. */
export function updateSettings(state: ProgressState, patch: Partial<GameSettings>): ProgressState {
  return { ...state, settings: sanitizeSettings({ ...state.settings, ...patch }) };
}

function sanitizeLoadout(raw: unknown, unlocks: string[]): Loadout {
  const r = (raw ?? {}) as Partial<Loadout>;
  const owned = new Set(unlocks);
  const weapon: WeaponId =
    typeof r.weapon === "string" && WEAPON_ORDER.includes(r.weapon as WeaponId) && owned.has(`weapon:${r.weapon}`)
      ? (r.weapon as WeaponId)
      : "pulse";
  const modifiers: ModifierId[] = [];
  if (Array.isArray(r.modifiers)) {
    for (const m of r.modifiers) {
      const id = m as ModifierId;
      if (owned.has(`mod:${id}`) && CATALOG_BY_ID.has(`mod:${id}`) && !modifiers.includes(id)) modifiers.push(id);
      if (modifiers.length >= MODIFIER_SLOTS) break;
    }
  }
  const themeId = r.theme as ThemeId;
  const theme: ThemeId = owned.has(`theme:${themeId}`) && THEME_PALETTES[themeId] ? themeId : "neon";
  return { weapon, modifiers, theme };
}

/**
 * Rebuild a valid `ProgressState` from arbitrary parsed JSON, dropping anything
 * malformed. Never throws; the worst case is a fresh default. `today` normalises
 * the daily block, which also covers the date-rollover reset.
 */
export function sanitizeProgress(raw: unknown, today = new Date()): ProgressState {
  const base = defaultProgress(today);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<ProgressState> & Record<string, unknown>;

  const unlocks = Array.isArray(r.unlocks)
    ? Array.from(new Set([...DEFAULT_UNLOCKS, ...r.unlocks.filter((id): id is string => typeof id === "string" && CATALOG_BY_ID.has(id))]))
    : [...DEFAULT_UNLOCKS];

  const achievements = Array.isArray(r.achievements)
    ? (r.achievements.filter((id): id is AchievementId => typeof id === "string" && ACHIEVEMENT_BY_ID.has(id as AchievementId)))
    : [];

  const missions = {} as Record<MissionId, MissionState>;
  const rawMissions = (r.missions ?? {}) as Partial<Record<MissionId, { claimed?: unknown }>>;
  for (const mission of MISSIONS) {
    missions[mission.id] = { claimed: rawMissions[mission.id]?.claimed === true };
  }

  return {
    version: PROGRESS_VERSION,
    xp: toNonNegative(r.xp),
    currency: toNonNegative(r.currency),
    lifetime: sanitizeLifetime(r.lifetime),
    achievements: Array.from(new Set(achievements)),
    missions,
    daily: refreshDaily({ ...base, unlocks, daily: sanitizeDaily(r.daily) }, today).daily,
    unlocks,
    loadout: sanitizeLoadout(r.loadout, unlocks),
    settings: sanitizeSettings(r.settings),
  };
}

function sanitizeDaily(raw: unknown): DailyState {
  const r = (raw ?? {}) as Partial<DailyState>;
  const key = typeof r.dateKey === "string" ? r.dateKey : "";
  const entries = Array.isArray(r.entries)
    ? r.entries.map((e) => ({
        progress: toNonNegative((e as Partial<DailyEntryState>)?.progress),
        completed: (e as Partial<DailyEntryState>)?.completed === true,
      }))
    : [];
  return { dateKey: key, entries };
}

/* ========================================================================== */
/* State transitions                                                           */
/* ========================================================================== */

/**
 * Ensure the daily block matches `today`. If the stored date differs (or the entry
 * count is wrong after a template change), the challenges regenerate and progress
 * resets — this is the single place the date-rollover reset happens, so it can be
 * called freely on load, on view, and inside `evaluateRun`.
 */
export function refreshDaily(state: ProgressState, today = new Date()): ProgressState {
  const key = dateKey(today);
  const expected = dailyChallengesFor(key).length;
  if (state.daily.dateKey === key && state.daily.entries.length === expected) return state;
  return { ...state, daily: freshDaily(key) };
}

/** Clamp helper — currency can never be represented as negative. */
function clampCurrency(value: number): number {
  return Math.max(0, Math.floor(value));
}

/** A tally of what a run awarded, for the run-end summary. */
export type RunRewards = {
  xpGained: number;
  currencyGained: number;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
  achievementsUnlocked: AchievementDef[];
  dailiesCompleted: DailyChallenge[];
  missionsNowClaimable: MissionDef[];
};

/**
 * Fold a finished run into the progress state: lifetime stats, XP (+ level-up
 * cores), run cores, achievements (one-time, with their rewards), and daily
 * progress (+ completion cores). Returns the new state and a reward summary.
 *
 * This is the only place a run mutates persistent progress, and the React layer
 * calls it exactly once per game-over — never per frame.
 */
export function evaluateRun(input: ProgressState, run: RunResult, today = new Date()): { state: ProgressState; rewards: RunRewards } {
  const state = refreshDaily(input, today);
  const levelBefore = levelForXp(state.xp).level;

  const lifetime = foldRunIntoLifetime(state.lifetime, run);

  // XP + level-up cores.
  const xpGained = xpForRun(run);
  const xp = state.xp + xpGained;
  const levelAfter = levelForXp(xp).level;
  const levelsGained = Math.max(0, levelAfter - levelBefore);

  // Currency: run reward + level-up bonus + achievement/daily rewards below.
  let currency = state.currency + currencyForRun(run) + levelsGained * LEVEL_UP_REWARD;

  // Achievements — evaluate against post-run lifetime; grant each once.
  const unlockedSet = new Set(state.achievements);
  const achievementsUnlocked: AchievementDef[] = [];
  for (const def of ACHIEVEMENTS) {
    if (unlockedSet.has(def.id)) continue;
    if (def.test(lifetime, run)) {
      unlockedSet.add(def.id);
      achievementsUnlocked.push(def);
      currency += def.reward;
    }
  }

  // Daily challenges — accumulate/track, grant on first completion.
  const challenges = dailyChallengesFor(state.daily.dateKey);
  const dailiesCompleted: DailyChallenge[] = [];
  const entries = challenges.map((challenge, i) => {
    const prev = state.daily.entries[i] ?? { progress: 0, completed: false };
    const contribution = dailyContribution(challenge, run);
    const progress = challenge.mode === "max" ? Math.max(prev.progress, contribution) : prev.progress + contribution;
    let completed = prev.completed;
    if (!completed && progress >= challenge.target) {
      completed = true;
      currency += challenge.reward;
      dailiesCompleted.push(challenge);
    }
    return { progress, completed };
  });

  // Missions that became claimable this run (for the summary nudge only — the
  // reward is granted when the player actually claims, not here).
  const missionsNowClaimable = MISSIONS.filter((mission) => {
    const claimed = state.missions[mission.id]?.claimed;
    const wasComplete = mission.progress(state.lifetime) >= mission.target;
    const nowComplete = mission.progress(lifetime) >= mission.target;
    return !claimed && !wasComplete && nowComplete;
  });

  const next: ProgressState = {
    ...state,
    xp,
    currency: clampCurrency(currency),
    lifetime,
    achievements: Array.from(unlockedSet),
    daily: { dateKey: state.daily.dateKey, entries },
  };

  return {
    state: next,
    rewards: {
      xpGained,
      currencyGained: clampCurrency(currency) - state.currency,
      levelBefore,
      levelAfter,
      leveledUp: levelsGained > 0,
      achievementsUnlocked,
      dailiesCompleted,
      missionsNowClaimable,
    },
  };
}

/** True when a mission's lifetime target is met. */
export function isMissionComplete(state: ProgressState, id: MissionId): boolean {
  const def = MISSION_BY_ID.get(id);
  if (!def) return false;
  return def.progress(state.lifetime) >= def.target;
}

/**
 * Claim a completed mission's reward. Idempotent: a second call (double-click,
 * stale event) does nothing because `claimed` is already true.
 */
export function claimMission(state: ProgressState, id: MissionId): { state: ProgressState; claimed: boolean } {
  const def = MISSION_BY_ID.get(id);
  if (!def) return { state, claimed: false };
  if (state.missions[id]?.claimed) return { state, claimed: false };
  if (!isMissionComplete(state, id)) return { state, claimed: false };
  return {
    state: {
      ...state,
      currency: clampCurrency(state.currency + def.reward),
      missions: { ...state.missions, [id]: { claimed: true } },
    },
    claimed: true,
  };
}

/**
 * Buy a catalog item with cores. Refuses if unknown, already owned, or unaffordable,
 * so currency never goes negative and nothing is paid for twice.
 */
export function purchase(state: ProgressState, itemId: string): { state: ProgressState; ok: boolean } {
  const item = CATALOG_BY_ID.get(itemId);
  if (!item) return { state, ok: false };
  if (state.unlocks.includes(itemId)) return { state, ok: false };
  if (state.currency < item.cost) return { state, ok: false };
  return {
    state: {
      ...state,
      currency: clampCurrency(state.currency - item.cost),
      unlocks: [...state.unlocks, itemId],
    },
    ok: true,
  };
}

/** Set of unlocked weapons, for gating the weapon bar. */
export function unlockedWeapons(state: ProgressState): Set<WeaponId> {
  const out = new Set<WeaponId>();
  for (const id of WEAPON_ORDER) if (state.unlocks.includes(`weapon:${id}`)) out.add(id);
  out.add("pulse"); // Always available even if storage was tampered with.
  return out;
}

/** Equip an owned weapon as the starting weapon. Locked items are rejected. */
export function equipWeapon(state: ProgressState, weapon: WeaponId): ProgressState {
  if (!state.unlocks.includes(`weapon:${weapon}`)) return state;
  return { ...state, loadout: { ...state.loadout, weapon } };
}

/** Select an owned theme. Locked items are rejected. */
export function equipTheme(state: ProgressState, theme: ThemeId): ProgressState {
  if (!state.unlocks.includes(`theme:${theme}`)) return state;
  return { ...state, loadout: { ...state.loadout, theme } };
}

/**
 * Toggle a passive modifier on or off. Locked modifiers can't be equipped, and the
 * equipped set is capped at `MODIFIER_SLOTS`.
 */
export function toggleModifier(state: ProgressState, id: ModifierId): ProgressState {
  if (!state.unlocks.includes(`mod:${id}`)) return state;
  const active = state.loadout.modifiers.includes(id);
  let modifiers: ModifierId[];
  if (active) {
    modifiers = state.loadout.modifiers.filter((m) => m !== id);
  } else {
    if (state.loadout.modifiers.length >= MODIFIER_SLOTS) return state;
    modifiers = [...state.loadout.modifiers, id];
  }
  return { ...state, loadout: { ...state.loadout, modifiers } };
}

/* ========================================================================== */
/* Loadout → engine config & theme                                             */
/* ========================================================================== */

/** The theme palette the current loadout resolves to. */
export function activeTheme(state: ProgressState): ThemePalette {
  return THEME_PALETTES[state.loadout.theme] ?? THEME_PALETTES.neon;
}

/**
 * Fold the equipped passive modifiers into a copy of the engine config. The engine
 * reads `model.config` live, so the component assigns this before a run starts and
 * the whole simulation — cooldowns, health, drops, combos — picks it up.
 */
export function deriveConfig(state: ProgressState, base: NeonCoreConfig = DEFAULT_CONFIG): NeonCoreConfig {
  const mods = new Set(state.loadout.modifiers);

  const weapons = { ...base.weapons };
  if (mods.has("rapid-coils") || mods.has("velocity")) {
    for (const id of WEAPON_ORDER) {
      const w = { ...base.weapons[id] };
      if (mods.has("rapid-coils")) w.cooldown = w.cooldown * 0.92;
      if (mods.has("velocity")) w.projectileSpeed = w.projectileSpeed * 1.1;
      weapons[id] = w;
    }
  }

  const powerUps = mods.has("scavenger")
    ? { ...base.powerUps, dropChance: Math.min(1, base.powerUps.dropChance * 1.5) }
    : base.powerUps;

  const combo = mods.has("momentum")
    ? {
        ...base.combo,
        killsPerStep: Math.max(2, base.combo.killsPerStep - 1),
        maxMultiplier: base.combo.maxMultiplier + 1,
      }
    : base.combo;

  const coreMaxHealth = mods.has("hardened-core") ? base.coreMaxHealth + 3 : base.coreMaxHealth;

  return { ...base, coreMaxHealth, weapons, powerUps, combo };
}
