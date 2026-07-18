import { describe, expect, it } from "vitest";
import {
  claimMission,
  DAILY_COUNT,
  dailyChallengesFor,
  dateKey,
  defaultProgress,
  deriveConfig,
  equipTheme,
  equipWeapon,
  evaluateRun,
  isMissionComplete,
  LEVEL_CUMULATIVE_XP,
  levelForXp,
  MAX_LEVEL,
  MODIFIER_SLOTS,
  purchase,
  refreshDaily,
  toggleModifier,
  updateSettings,
  currencyForRun,
  xpForRun,
  type RunResult,
} from "./neonCoreProgression";
import { DEFAULT_CONFIG } from "./neonCoreEngine";

function run(overrides: Partial<RunResult> = {}): RunResult {
  return {
    score: 0,
    wave: 1,
    combo: 0,
    accuracy: 0,
    shotsFired: 0,
    shotsHit: 0,
    enemiesDestroyed: 0,
    survivalTime: 0,
    powerUpsCollected: 0,
    flawlessWaves: 0,
    damageTaken: 0,
    shotsByWeapon: { pulse: 0, rapid: 0, heavy: 0 },
    powerUpsByKind: { shield: 0, slowTime: 0, multiShot: 0, explosive: 0 },
    ...overrides,
  };
}

describe("levels", () => {
  it("maps xp to levels and clamps at the maximum", () => {
    expect(levelForXp(0).level).toBe(1);
    expect(levelForXp(-100).level).toBe(1);
    expect(levelForXp(LEVEL_CUMULATIVE_XP[1]).level).toBe(2);
    const max = levelForXp(1e12);
    expect(max.level).toBe(MAX_LEVEL);
    expect(max.atMax).toBe(true);
    expect(max.ratio).toBe(1);
  });

  it("reports fractional progress within a level", () => {
    const mid = Math.floor((LEVEL_CUMULATIVE_XP[1] + LEVEL_CUMULATIVE_XP[2]) / 2);
    const info = levelForXp(mid);
    expect(info.level).toBe(2);
    expect(info.ratio).toBeGreaterThan(0);
    expect(info.ratio).toBeLessThan(1);
  });
});

describe("xp for a run", () => {
  it("is never negative and rewards score, waves and survival", () => {
    expect(xpForRun(run({ wave: 0 }))).toBe(0); // an empty run yields no XP
    expect(xpForRun(run())).toBeGreaterThanOrEqual(0);
    const a = xpForRun(run({ score: 1000, wave: 5, survivalTime: 60, enemiesDestroyed: 20 }));
    const b = xpForRun(run({ score: 2000, wave: 5, survivalTime: 60, enemiesDestroyed: 20 }));
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
  });
});

describe("reward currency for a run", () => {
  it("is never negative and scales with score, wave, survival and pick-ups", () => {
    expect(currencyForRun(run({ wave: 0 }))).toBe(0);
    const modest = currencyForRun(run({ score: 500, wave: 2, survivalTime: 30 }));
    const strong = currencyForRun(run({ score: 5000, wave: 10, survivalTime: 200, powerUpsCollected: 5 }));
    expect(modest).toBeGreaterThan(0);
    expect(strong).toBeGreaterThan(modest);
  });

  it("cannot be farmed faster by dying immediately than by playing on", () => {
    const quickDeath = currencyForRun(run({ score: 50, wave: 1, survivalTime: 10 }));
    const realRun = currencyForRun(run({ score: 4000, wave: 8, survivalTime: 180, powerUpsCollected: 4 }));
    expect(realRun).toBeGreaterThan(quickDeath * 5);
  });
});

describe("evaluateRun", () => {
  it("grants the first-run achievement once and never re-grants it", () => {
    const start = defaultProgress(new Date("2026-07-18T12:00:00"));
    const first = evaluateRun(start, run({ score: 100, wave: 1 }), new Date("2026-07-18T12:00:00"));
    expect(first.state.achievements).toContain("first-run");
    expect(first.rewards.achievementsUnlocked.some((a) => a.id === "first-run")).toBe(true);
    expect(first.state.currency).toBeGreaterThan(0);
    expect(first.state.lifetime.runs).toBe(1);

    const second = evaluateRun(first.state, run({ score: 100 }), new Date("2026-07-18T12:05:00"));
    expect(second.rewards.achievementsUnlocked.some((a) => a.id === "first-run")).toBe(false);
    expect(second.state.lifetime.runs).toBe(2);
  });

  it("never produces negative currency", () => {
    const start = defaultProgress();
    const result = evaluateRun(start, run(), new Date());
    expect(result.state.currency).toBeGreaterThanOrEqual(0);
  });

  it("accumulates 'sum' daily progress and completes it once", () => {
    const day = new Date("2026-07-18T09:00:00");
    const key = dateKey(day);
    const challenges = dailyChallengesFor(key);
    const destroyIndex = challenges.findIndex((c) => c.metric === "destroy");
    // Only assert the completion mechanics when this day rolled a "destroy" daily.
    if (destroyIndex === -1) return;
    const target = challenges[destroyIndex].target;

    let state = defaultProgress(day);
    const r = evaluateRun(state, run({ enemiesDestroyed: target }), day);
    expect(r.state.daily.entries[destroyIndex].completed).toBe(true);
    expect(r.rewards.dailiesCompleted.length).toBeGreaterThan(0);

    // A further run does not re-award the completed daily.
    state = r.state;
    const again = evaluateRun(state, run({ enemiesDestroyed: target }), day);
    expect(again.rewards.dailiesCompleted.some((c) => c.metric === "destroy")).toBe(false);
  });
});

describe("missions", () => {
  it("claims a completed mission once and rejects repeats and incompletes", () => {
    const p = defaultProgress();
    expect(isMissionComplete(p, "destroy-500")).toBe(false);
    expect(claimMission(p, "destroy-500").claimed).toBe(false);

    p.lifetime.totalEnemiesDestroyed = 600;
    expect(isMissionComplete(p, "destroy-500")).toBe(true);
    const first = claimMission(p, "destroy-500");
    expect(first.claimed).toBe(true);
    expect(first.state.currency).toBe(p.currency + 60);

    const second = claimMission(first.state, "destroy-500");
    expect(second.claimed).toBe(false);
    expect(second.state.currency).toBe(first.state.currency);
  });
});

describe("store purchases and equips", () => {
  it("buys with cores, blocks duplicates, and never goes negative", () => {
    const p = defaultProgress();
    p.currency = 200;
    const buy = purchase(p, "weapon:rapid"); // cost 150
    expect(buy.ok).toBe(true);
    expect(buy.state.currency).toBe(50);
    expect(buy.state.unlocks).toContain("weapon:rapid");

    expect(purchase(buy.state, "weapon:rapid").ok).toBe(false); // already owned

    const poor = defaultProgress();
    poor.currency = 10;
    const denied = purchase(poor, "weapon:heavy"); // cost 250
    expect(denied.ok).toBe(false);
    expect(denied.state.currency).toBe(10);
  });

  it("refuses to equip locked items and honours modifier slots", () => {
    const locked = defaultProgress();
    expect(equipWeapon(locked, "rapid").loadout.weapon).toBe("pulse");
    expect(equipTheme(locked, "gold").loadout.theme).toBe("neon");

    const p = defaultProgress();
    p.unlocks.push("weapon:rapid", "mod:velocity", "mod:scavenger", "mod:momentum");
    expect(equipWeapon(p, "rapid").loadout.weapon).toBe("rapid");

    let s = toggleModifier(p, "velocity");
    s = toggleModifier(s, "scavenger");
    expect(s.loadout.modifiers.length).toBe(MODIFIER_SLOTS);
    s = toggleModifier(s, "momentum"); // slots full → ignored
    expect(s.loadout.modifiers.length).toBe(MODIFIER_SLOTS);
    s = toggleModifier(s, "velocity"); // toggle off
    expect(s.loadout.modifiers).not.toContain("velocity");
  });
});

describe("passive modifiers → config", () => {
  it("hardened-core raises max core health", () => {
    const p = defaultProgress();
    p.unlocks.push("mod:hardened-core");
    p.loadout.modifiers = ["hardened-core"];
    expect(deriveConfig(p).coreMaxHealth).toBe(DEFAULT_CONFIG.coreMaxHealth + 3);
  });

  it("velocity and rapid-coils reshape every weapon; a bare loadout is unchanged", () => {
    const p = defaultProgress();
    expect(deriveConfig(p).weapons.pulse.projectileSpeed).toBe(DEFAULT_CONFIG.weapons.pulse.projectileSpeed);

    p.unlocks.push("mod:velocity", "mod:rapid-coils");
    p.loadout.modifiers = ["velocity", "rapid-coils"];
    const cfg = deriveConfig(p);
    expect(cfg.weapons.pulse.projectileSpeed).toBeCloseTo(DEFAULT_CONFIG.weapons.pulse.projectileSpeed * 1.1);
    expect(cfg.weapons.pulse.cooldown).toBeCloseTo(DEFAULT_CONFIG.weapons.pulse.cooldown * 0.92);
  });
});

describe("daily challenges", () => {
  it("is deterministic per date and produces the configured count", () => {
    const a = dailyChallengesFor("2026-07-18");
    const b = dailyChallengesFor("2026-07-18");
    expect(a).toEqual(b);
    expect(a).toHaveLength(DAILY_COUNT);
  });

  it("differs across dates (keys carry the date)", () => {
    const a = dailyChallengesFor("2026-07-18").map((c) => c.key);
    const c = dailyChallengesFor("2026-07-19").map((c) => c.key);
    expect(a).not.toEqual(c);
  });

  it("resets on a date rollover but is stable within a day", () => {
    const p = defaultProgress(new Date("2026-07-18T10:00:00"));
    p.daily.entries[0].progress = 999;
    const same = refreshDaily(p, new Date("2026-07-18T23:59:00"));
    expect(same).toBe(p); // same reference — no reset

    const rolled = refreshDaily(p, new Date("2026-07-19T00:01:00"));
    expect(rolled.daily.dateKey).toBe("2026-07-19");
    expect(rolled.daily.entries.every((e) => e.progress === 0 && !e.completed)).toBe(true);
  });
});

describe("settings", () => {
  it("clamps volumes into 0..1 and coerces booleans", () => {
    const p = defaultProgress();
    const next = updateSettings(p, { musicVolume: 5, sfxVolume: -1, music: false });
    expect(next.settings.musicVolume).toBe(1);
    expect(next.settings.sfxVolume).toBe(0);
    expect(next.settings.music).toBe(false);
  });
});
