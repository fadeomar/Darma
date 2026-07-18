import { describe, expect, it } from "vitest";
import {
  accuracyPercent,
  aimHoldFire,
  applyUpgrade,
  beginHoldFire,
  createGame,
  DEFAULT_CONFIG,
  DEFAULT_WORLD,
  derivedWeapon,
  endHoldFire,
  endRun,
  favouriteWeapon,
  fire,
  getFireInterval,
  HOLD_FIRE,
  multiplierFor,
  resetGame,
  setParticleCap,
  setWeapon,
  stepHoldFire,
  update,
  wavePlan,
} from "./neonCoreEngine";
import type { Drop, Enemy, NeonCoreModel, Projectile } from "./neonCoreTypes";

function model(seed = 1): NeonCoreModel {
  return createGame(DEFAULT_WORLD, DEFAULT_CONFIG, seed);
}

function enemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    kind: "basic",
    x: 600,
    y: 300,
    radius: 18,
    targetRadius: 18,
    baseRadius: 18,
    vx: 0,
    vy: 0,
    health: 1,
    maxHealth: 3,
    hue: 190,
    flash: 0,
    splitCount: 0,
    ...overrides,
  };
}

function projectile(overrides: Partial<Projectile> = {}): Projectile {
  return { x: 600, y: 300, radius: 5, vx: 0, vy: 0, damage: 1, weapon: "pulse", explosive: false, ...overrides };
}

function drop(overrides: Partial<Drop> = {}): Drop {
  return { id: "shield", x: 600, y: 300, radius: 11, timer: 9, duration: 9, ...overrides };
}

describe("wavePlan (difficulty scaling)", () => {
  it("scales budget, spacing, speed and health with the wave", () => {
    const p1 = wavePlan(DEFAULT_CONFIG, 1);
    expect(p1.budget).toBe(DEFAULT_CONFIG.wave.baseBudget);
    expect(p1.speedMul).toBe(1);
    expect(p1.healthBonus).toBe(0);
    expect(p1.kinds).toEqual(["basic"]);

    const p5 = wavePlan(DEFAULT_CONFIG, 5);
    expect(p5.budget).toBe(DEFAULT_CONFIG.wave.baseBudget + DEFAULT_CONFIG.wave.budgetPerWave * 4);
    expect(p5.speedMul).toBeGreaterThan(1);
    expect(p5.kinds).toEqual(["basic", "fast", "tank", "splitter"]);
  });

  it("unlocks enemy kinds gradually and never exceeds the caps", () => {
    expect(wavePlan(DEFAULT_CONFIG, 2).kinds).toEqual(["basic", "fast"]);
    expect(wavePlan(DEFAULT_CONFIG, 3).kinds).toEqual(["basic", "fast", "tank"]);
    const deep = wavePlan(DEFAULT_CONFIG, 200);
    expect(deep.speedMul).toBeLessThanOrEqual(DEFAULT_CONFIG.wave.speedMulMax);
    expect(deep.healthBonus).toBeLessThanOrEqual(DEFAULT_CONFIG.wave.healthBonusMax);
    expect(deep.spawnInterval).toBeGreaterThanOrEqual(DEFAULT_CONFIG.wave.spawnIntervalMin);
  });
});

describe("combo multiplier", () => {
  it("adds a step every killsPerStep and clamps to the ceiling", () => {
    const c = DEFAULT_CONFIG.combo;
    expect(multiplierFor(0, c)).toBe(1);
    expect(multiplierFor(c.killsPerStep - 1, c)).toBe(1);
    expect(multiplierFor(c.killsPerStep, c)).toBe(1 + c.stepValue);
    expect(multiplierFor(10_000, c)).toBe(c.maxMultiplier);
  });
});

describe("weapons", () => {
  it("enforces the fire cooldown regardless of how fast fire() is called", () => {
    const m = model();
    expect(fire(m, 480, 0)).toBe(true);
    expect(m.projectiles.length).toBe(1);
    expect(fire(m, 480, 0)).toBe(false); // still on cooldown
    expect(m.projectiles.length).toBe(1);
  });

  it("switches weapon and reflects it in derived stats", () => {
    const m = model();
    expect(setWeapon(m, "heavy")).toBe(true);
    expect(setWeapon(m, "heavy")).toBe(false); // no-op when unchanged
    expect(derivedWeapon(m).cooldown).toBeCloseTo(DEFAULT_CONFIG.weapons.heavy.cooldown);
  });

  it("folds upgrades into damage, cooldown and projectile speed", () => {
    const m = model();
    m.upgrades.damage = 2;
    m.upgrades.fireRate = 1;
    m.upgrades.projectileSpeed = 1;
    const w = derivedWeapon(m, "pulse");
    expect(w.damage).toBeCloseTo(DEFAULT_CONFIG.weapons.pulse.damage + DEFAULT_CONFIG.upgrades.damage.value * 2);
    expect(w.cooldown).toBeCloseTo(DEFAULT_CONFIG.weapons.pulse.cooldown * (1 - DEFAULT_CONFIG.upgrades.fireRate.value));
    expect(w.projectileSpeed).toBeCloseTo(
      DEFAULT_CONFIG.weapons.pulse.projectileSpeed * (1 + DEFAULT_CONFIG.upgrades.projectileSpeed.value),
    );
  });

  it("never drops the cooldown below the configured floor", () => {
    const m = model();
    setWeapon(m, "rapid");
    m.upgrades.fireRate = DEFAULT_CONFIG.upgrades.fireRate.maxLevel;
    expect(derivedWeapon(m).cooldown).toBeGreaterThanOrEqual(DEFAULT_CONFIG.minCooldown);
  });
});

describe("upgrades (apply + guards)", () => {
  it("only applies while parked, is idempotent per offer, and respects the level cap", () => {
    const m = model();
    // Not parked → rejected.
    expect(applyUpgrade(m, "damage")).toBe(false);

    m.waveState = "upgrade";
    m.pendingUpgrades = ["damage"];
    expect(applyUpgrade(m, "damage")).toBe(true);
    expect(m.upgrades.damage).toBe(1);
    expect(m.waveState).toBe("spawning"); // moved to the next wave
    expect(m.pendingUpgrades).toEqual([]);

    // A repeat call for the same offer does nothing.
    expect(applyUpgrade(m, "damage")).toBe(false);
    expect(m.upgrades.damage).toBe(1);

    // At max level it refuses even when parked.
    m.waveState = "upgrade";
    m.pendingUpgrades = ["damage"];
    m.upgrades.damage = DEFAULT_CONFIG.upgrades.damage.maxLevel;
    expect(applyUpgrade(m, "damage")).toBe(false);
  });

  it("core-health upgrade raises max and heals by the same amount", () => {
    const m = model();
    m.core.health = 4;
    m.waveState = "upgrade";
    m.pendingUpgrades = ["coreHealth"];
    const before = m.core.maxHealth;
    applyUpgrade(m, "coreHealth");
    expect(m.core.maxHealth).toBe(before + DEFAULT_CONFIG.upgrades.coreHealth.value);
    expect(m.core.health).toBe(4 + DEFAULT_CONFIG.upgrades.coreHealth.value);
  });
});

describe("collisions, scoring and combo", () => {
  it("kills an enemy, scores by multiplier and increments the combo", () => {
    const m = model();
    m.enemies.push(enemy({ health: 1 }));
    m.projectiles.push(projectile());
    const events = update(m, 0.001);
    expect(events.killed).toBe(true);
    expect(m.enemies.length).toBe(0);
    expect(m.combo).toBe(1);
    expect(m.score).toBe(DEFAULT_CONFIG.enemies.basic.scorePerKill);
    expect(m.stats.enemiesDestroyed).toBe(1);
    expect(m.stats.shotsHit).toBe(1);
  });

  it("sums two projectiles on one enemy into a single death (no double payout)", () => {
    const m = model();
    m.enemies.push(enemy({ health: 2, maxHealth: 2 }));
    m.projectiles.push(projectile(), projectile());
    update(m, 0.001);
    expect(m.enemies.length).toBe(0);
    expect(m.stats.enemiesDestroyed).toBe(1);
    expect(m.score).toBe(DEFAULT_CONFIG.enemies.basic.scorePerKill);
  });

  it("damages the core and resets the combo when an enemy reaches it", () => {
    const m = model();
    m.combo = 6;
    m.enemies.push(enemy({ x: m.core.x, y: m.core.y, health: 3 }));
    const events = update(m, 0.001);
    expect(events.coreDamaged).toBe(true);
    expect(m.core.health).toBe(DEFAULT_CONFIG.coreMaxHealth - DEFAULT_CONFIG.enemies.basic.coreDamage);
    expect(m.combo).toBe(0);
    expect(m.enemies.length).toBe(0);
  });

  it("shield absorbs a core hit without damage and keeps the combo", () => {
    const m = model();
    m.combo = 3;
    m.effects.shield = 5;
    m.enemies.push(enemy({ x: m.core.x, y: m.core.y }));
    const events = update(m, 0.001);
    expect(events.coreDamaged).toBe(false);
    expect(m.core.health).toBe(DEFAULT_CONFIG.coreMaxHealth);
    expect(m.combo).toBe(3);
    expect(m.enemies.length).toBe(0);
  });

  it("splitters spawn two in-bounds children with no further splits", () => {
    const m = model();
    m.enemies.push(enemy({ kind: "splitter", health: 1, maxHealth: 4, splitCount: 2, baseRadius: 24, radius: 24 }));
    m.projectiles.push(projectile());
    update(m, 0.001);
    expect(m.enemies.length).toBe(2);
    for (const child of m.enemies) {
      expect(child.splitCount).toBe(0);
      expect(child.x).toBeGreaterThanOrEqual(0);
      expect(child.x).toBeLessThanOrEqual(DEFAULT_WORLD.width);
      expect(child.y).toBeGreaterThanOrEqual(0);
      expect(child.y).toBeLessThanOrEqual(DEFAULT_WORLD.height);
    }
  });

  it("explosive rounds splash nearby enemies", () => {
    const m = model();
    m.enemies.push(enemy({ x: 600, y: 300, health: 1, maxHealth: 1 }));
    m.enemies.push(enemy({ x: 640, y: 300, health: 5, maxHealth: 5 }));
    m.projectiles.push(projectile({ explosive: true }));
    update(m, 0.001);
    expect(m.enemies.length).toBe(1); // primary destroyed
    expect(m.enemies[0].health).toBeCloseTo(5 - DEFAULT_CONFIG.powerUps.explosionDamage);
  });
});

describe("power-up drops and stacking", () => {
  it("collects a drop and stacks duration up to the per-effect ceiling", () => {
    const shield = DEFAULT_CONFIG.powerUps.types.shield;
    const m = model();
    m.drops.push(drop());
    m.projectiles.push(projectile());
    update(m, 0.001);
    expect(m.effects.shield).toBeCloseTo(shield.duration);
    expect(m.stats.powerUpsCollected).toBe(1);

    // Collect again — extends but never beyond maxDuration.
    m.drops.push(drop());
    m.projectiles.push(projectile());
    update(m, 0.001);
    expect(m.effects.shield).toBeGreaterThan(shield.duration);
    expect(m.effects.shield).toBeLessThanOrEqual(shield.maxDuration);
  });

  it("a single drop is only collected once even with two projectiles on it", () => {
    const m = model();
    m.drops.push(drop());
    m.projectiles.push(projectile(), projectile());
    update(m, 0.001);
    expect(m.stats.powerUpsCollected).toBe(1);
    expect(m.drops.length).toBe(0);
  });
});

describe("temporary effect expiry", () => {
  it("decays effect timers and never leaves them negative", () => {
    const m = model();
    m.effects.multiShot = 0.05;
    update(m, 0.1);
    expect(m.effects.multiShot).toBe(0);
  });
});

describe("restart cleanup", () => {
  it("clears transient state and upgrades on reset", () => {
    const m = model();
    fire(m, 480, 0);
    m.effects.shield = 5;
    m.drops.push(drop());
    m.upgrades.damage = 3;
    m.score = 999;
    m.combo = 7;
    resetGame(m);
    expect(m.projectiles.length).toBe(0);
    expect(m.drops.length).toBe(0);
    expect(m.enemies.length).toBe(0);
    expect(m.effects.shield).toBe(0);
    expect(m.upgrades.damage).toBe(0);
    expect(m.score).toBe(0);
    expect(m.combo).toBe(0);
    expect(m.wave).toBe(1);
    expect(m.core.health).toBe(DEFAULT_CONFIG.coreMaxHealth);
  });
});

describe("stats helpers", () => {
  it("accuracyPercent guards divide-by-zero and rounds", () => {
    const m = model();
    expect(accuracyPercent(m)).toBe(0);
    m.stats.shotsFired = 4;
    m.stats.shotsHit = 3;
    expect(accuracyPercent(m)).toBe(75);
  });

  it("favouriteWeapon returns the most-fired weapon or null", () => {
    expect(favouriteWeapon({ pulse: 0, rapid: 0, heavy: 0 })).toBeNull();
    expect(favouriteWeapon({ pulse: 10, rapid: 3, heavy: 40 })).toBe("heavy");
  });
});

describe("particle cap", () => {
  it("clamps the live cap to [0, config.maxParticles]", () => {
    const m = model();
    setParticleCap(m, -50);
    expect(m.particleCap).toBe(0);
    setParticleCap(m, 10_000);
    expect(m.particleCap).toBe(DEFAULT_CONFIG.maxParticles);
  });

  it("never emits particles beyond the cap", () => {
    const m = model();
    setParticleCap(m, 5);
    for (let i = 0; i < 20; i += 1) {
      m.enemies.push(enemy({ x: 600 + i, health: 1 }));
      m.projectiles.push(projectile({ x: 600 + i }));
    }
    update(m, 0.001);
    expect(m.particles.length).toBeLessThanOrEqual(5);
  });
});

/**
 * Sustained fire. `beginHoldFire` is the press, `update` is the game loop, and every
 * assertion below runs the cadence through `update` at a fixed 60 Hz step so the
 * numbers are the ones a real client would see.
 */
describe("hold-to-fire cadence", () => {
  const STEP = 1 / 60;

  /** Run the loop for `seconds` and return how many sustained rounds left the core. */
  function advance(m: NeonCoreModel, seconds: number, step = STEP): number {
    let shots = 0;
    const frames = Math.round(seconds / step);
    for (let i = 0; i < frames; i += 1) shots += update(m, step).shots;
    return shots;
  }

  const pulseCooldownMs = DEFAULT_CONFIG.weapons.pulse.cooldown * 1000;

  it("fires immediately on the press, without waiting for the first interval", () => {
    const m = model();
    expect(beginHoldFire(m, 900, 300)).toBe(true);
    expect(m.projectiles.length).toBe(1);
    expect(m.stats.shotsFired).toBe(1);
  });

  it("a quick click is still exactly one shot", () => {
    const m = model();
    beginHoldFire(m, 900, 300);
    endHoldFire(m); // released well inside the first interval
    advance(m, 1);
    expect(m.stats.shotsFired).toBe(1);
  });

  it("keeps firing while held, and stops immediately on release", () => {
    const m = model();
    beginHoldFire(m, 900, 300);
    expect(advance(m, 1)).toBeGreaterThanOrEqual(2);

    endHoldFire(m);
    expect(advance(m, 1)).toBe(0);
  });

  it("holding is never faster than the weapon's own cooldown allows", () => {
    const m = model();
    beginHoldFire(m, 900, 300);
    const shots = advance(m, 3);
    // 3 s at Pulse's 220 ms floor is 13 rounds even with no ramp at all.
    expect(shots).toBeLessThanOrEqual(Math.ceil(3000 / pulseCooldownMs));
  });

  it("ramps up: a later window of the same hold lands more shots than an early one", () => {
    const m = model();
    beginHoldFire(m, 900, 300);
    const early = advance(m, HOLD_FIRE.rampDurationMs / 1000);
    const late = advance(m, HOLD_FIRE.rampDurationMs / 1000);
    expect(late).toBeGreaterThan(early);
  });

  it("releasing and pressing again restarts the ramp", () => {
    const m = model();
    beginHoldFire(m, 900, 300);
    advance(m, 2); // fully ramped
    expect(m.hold.heldMs).toBeGreaterThanOrEqual(HOLD_FIRE.rampDurationMs);

    endHoldFire(m);
    beginHoldFire(m, 900, 300);
    expect(m.hold.heldMs).toBe(0);
    expect(m.hold.sinceShotMs).toBe(0);
  });

  it("aims later rounds at the latest pointer position, not the press position", () => {
    const m = model();
    beginHoldFire(m, m.core.x + 300, m.core.y);
    expect(m.projectiles[0].vx).toBeGreaterThan(0); // opening shot went right

    aimHoldFire(m, m.core.x - 300, m.core.y);
    const before = m.projectiles.length;
    advance(m, 0.6);
    expect(m.projectiles.length).toBeGreaterThan(before);
    expect(m.projectiles[m.projectiles.length - 1].vx).toBeLessThan(0); // now going left
  });

  it("is frame-rate independent: 30 Hz and 144 Hz agree on the shot count", () => {
    const slow = model();
    beginHoldFire(slow, 900, 300);
    const slowShots = advance(slow, 2, 1 / 30);

    const fast = model();
    beginHoldFire(fast, 900, 300);
    const fastShots = advance(fast, 2, 1 / 144);

    expect(Math.abs(slowShots - fastShots)).toBeLessThanOrEqual(1);
  });

  it("does not fire while the engine is parked for an upgrade choice", () => {
    const m = model();
    beginHoldFire(m, 900, 300);
    m.waveState = "upgrade";
    expect(advance(m, 1)).toBe(0);
  });

  it("drops the trigger on game over and on restart", () => {
    const m = model();
    beginHoldFire(m, 900, 300);
    endRun(m);
    expect(m.hold.active).toBe(false);
    expect(advance(m, 1)).toBe(0);

    beginHoldFire(m, 900, 300);
    resetGame(m);
    expect(m.hold.active).toBe(false);
    expect(m.hold.heldMs).toBe(0);
    expect(m.hold.sinceShotMs).toBe(0);
    expect(advance(m, 1)).toBe(0);
  });

  it("a single long frame cannot release a burst, and banks no backlog", () => {
    const m = model();
    beginHoldFire(m, 900, 300);
    // Simulate the worst case a frozen tab could produce if dt were not clamped:
    // an enormous accumulator and an enormous step.
    m.hold.sinceShotMs = 10_000;
    m.fireCooldown = 0; // the weapon is ready, as it would be after the long gap
    const shots = stepHoldFire(m, 5);
    expect(shots).toBeGreaterThan(0);
    expect(shots).toBeLessThanOrEqual(HOLD_FIRE.maxShotsPerUpdate);
    // Stale time is discarded rather than carried, so the next frame can't burst either.
    expect(m.hold.sinceShotMs).toBeLessThanOrEqual(getFireInterval(m.hold.heldMs, pulseCooldownMs));
  });
});

describe("getFireInterval (pure ramp helper)", () => {
  const cooldownMs = 200;

  it("starts at the configured multiple of the weapon cooldown", () => {
    expect(getFireInterval(0, cooldownMs)).toBeCloseTo(cooldownMs * HOLD_FIRE.startMultiplier);
  });

  it("reaches the weapon's own rate at the end of the ramp and stays there", () => {
    const target = cooldownMs * HOLD_FIRE.endMultiplier;
    expect(getFireInterval(HOLD_FIRE.rampDurationMs, cooldownMs)).toBeCloseTo(target);
    expect(getFireInterval(HOLD_FIRE.rampDurationMs * 100, cooldownMs)).toBeCloseTo(target);
  });

  it("interpolates monotonically downward in between", () => {
    let previous = Infinity;
    for (let held = 0; held <= HOLD_FIRE.rampDurationMs; held += 100) {
      const interval = getFireInterval(held, cooldownMs);
      expect(interval).toBeLessThanOrEqual(previous);
      previous = interval;
    }
  });

  it("never returns less than the safe minimum, whatever the inputs", () => {
    expect(getFireInterval(1e9, 0)).toBe(HOLD_FIRE.minIntervalMs);
    expect(getFireInterval(1e9, 1)).toBe(HOLD_FIRE.minIntervalMs);
    // Negative / NaN-adjacent inputs are clamped rather than trusted.
    expect(getFireInterval(-500, cooldownMs)).toBeCloseTo(cooldownMs * HOLD_FIRE.startMultiplier);
    expect(getFireInterval(0, -50)).toBe(HOLD_FIRE.minIntervalMs);
  });

  it("scales with the weapon, so every weapon ends at its own maximum rate", () => {
    for (const id of ["pulse", "rapid", "heavy"] as const) {
      const ms = DEFAULT_CONFIG.weapons[id].cooldown * 1000;
      expect(getFireInterval(HOLD_FIRE.rampDurationMs, ms)).toBeCloseTo(ms);
      expect(getFireInterval(0, ms)).toBeGreaterThan(ms);
    }
  });
});

describe("hidden-tab time jump guard is caller-side, but update tolerates dt=0", () => {
  it("returns inert events for a non-positive dt", () => {
    const m = model();
    const events = update(m, 0);
    expect(events.hit).toBe(false);
    expect(events.killed).toBe(false);
    expect(m.stats.survivalTime).toBe(0);
  });
});
