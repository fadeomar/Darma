/**
 * Neon Core Defense — the simulation.
 *
 * Pure, framework-free game logic: no React, no canvas, no DOM. The player
 * component owns a single `NeonCoreModel` in a ref and calls `update(model, dt)`
 * once per animation frame; everything here mutates that model in place and
 * returns the discrete events worth reacting to.
 *
 * Every timer — spawn cadence, edge warnings, wave breaks, fire cooldown, power-up
 * durations, damage flash, shake — is a number in the model advanced by `dt`, never
 * a `setInterval` or `setTimeout`. That is what makes pause correct: the component
 * stops calling `update` and the entire run freezes exactly where it was. It also
 * means there is no timer to leak on unmount and no effect that can outlive a run.
 *
 * All tuning lives in `DEFAULT_CONFIG`. `wavePlan()` is the single place that turns
 * a wave number into spawn parameters, and `derivedWeapon()` is the single place
 * that folds upgrades into weapon numbers.
 */

import type {
  ComboScaling,
  DerivedWeapon,
  Enemy,
  EnemyKind,
  EnemyTypeConfig,
  EffectTimers,
  HoldFireState,
  HoldFireTuning,
  NeonCoreConfig,
  NeonCoreModel,
  Particle,
  PowerUpConfig,
  PowerUpId,
  RunStats,
  StepEvents,
  UpgradeConfig,
  UpgradeId,
  UpgradeLevels,
  WeaponConfig,
  WeaponId,
  World,
} from "./neonCoreTypes";

/**
 * Per-type behaviour. Read as a table: `fast` trades health and size for speed,
 * `tank` is the mirror image, and `splitter` is worth the most because killing one
 * makes your own life harder.
 */
const ENEMY_TYPES: Record<EnemyKind, EnemyTypeConfig> = {
  basic: {
    radius: 18,
    speed: 62,
    health: 3,
    hue: 190,
    coreDamage: 1,
    scorePerHit: 1,
    scorePerKill: 5,
    unlockWave: 1,
    weight: 10,
    splitCount: 0,
  },
  fast: {
    radius: 11,
    speed: 128,
    health: 1,
    hue: 55,
    coreDamage: 1,
    scorePerHit: 1,
    scorePerKill: 8,
    unlockWave: 2,
    weight: 7,
    splitCount: 0,
  },
  tank: {
    radius: 30,
    speed: 34,
    health: 8,
    hue: 320,
    coreDamage: 3,
    scorePerHit: 1,
    scorePerKill: 18,
    unlockWave: 3,
    weight: 4,
    splitCount: 0,
  },
  splitter: {
    radius: 24,
    speed: 54,
    health: 4,
    hue: 275,
    coreDamage: 2,
    scorePerHit: 1,
    scorePerKill: 12,
    unlockWave: 4,
    weight: 5,
    splitCount: 2,
  },
};

/**
 * The three weapons. They are deliberately close in damage-per-second — the
 * difference is the shape of it. Pulse is the neutral baseline, Rapid trades
 * per-shot damage for uptime (good into swarms of `fast`), Heavy trades uptime for
 * a big slow round (good into `tank`).
 */
const WEAPONS: Record<WeaponId, WeaponConfig> = {
  pulse: {
    label: "Pulse",
    blurb: "Balanced rate and damage. The all-rounder.",
    cooldown: 0.22,
    damage: 1,
    projectileSpeed: 340,
    projectileRadius: 5,
    hue: 195,
    glow: 3,
  },
  rapid: {
    label: "Rapid",
    blurb: "Fast, light rounds. Shreds swarms, struggles on armour.",
    cooldown: 0.09,
    damage: 0.5,
    projectileSpeed: 420,
    projectileRadius: 3.2,
    hue: 60,
    glow: 2.2,
  },
  heavy: {
    label: "Heavy",
    blurb: "Slow, huge rounds. Built for hulks.",
    cooldown: 0.62,
    damage: 3,
    projectileSpeed: 260,
    projectileRadius: 9,
    hue: 320,
    glow: 4,
  },
};

/** The in-run upgrade tracks offered between waves. */
const UPGRADES: Record<UpgradeId, UpgradeConfig> = {
  damage: {
    label: "Amplify",
    blurb: "+0.5 damage on every shot, whatever you're holding.",
    maxLevel: 5,
    value: 0.5,
  },
  fireRate: {
    label: "Overclock",
    blurb: "12% shorter cooldown between shots.",
    maxLevel: 5,
    value: 0.12,
  },
  projectileSpeed: {
    label: "Railgun",
    blurb: "15% faster projectiles — less leading, more hits.",
    maxLevel: 4,
    value: 0.15,
  },
  coreHealth: {
    label: "Reinforce",
    blurb: "+2 max core integrity, and repair that much now.",
    maxLevel: 5,
    value: 2,
  },
  scoreMultiplier: {
    label: "Overdrive",
    blurb: "+0.5× score multiplier, on top of your combo.",
    maxLevel: 4,
    value: 0.5,
  },
};

/** Temporary power-ups dropped by kills. */
const POWER_UPS: Record<PowerUpId, PowerUpConfig> = {
  shield: {
    label: "Shield",
    blurb: "Drones that reach the core are vaporised instead of hurting it.",
    weight: 8,
    duration: 8,
    maxDuration: 16,
    hue: 150,
  },
  slowTime: {
    label: "Slow field",
    blurb: "Everything inbound crawls at 45% speed.",
    weight: 7,
    duration: 7,
    maxDuration: 14,
    hue: 210,
  },
  multiShot: {
    label: "Multi-shot",
    blurb: "Every trigger pull fires a three-round spread.",
    weight: 6,
    duration: 9,
    maxDuration: 18,
    hue: 45,
  },
  explosive: {
    label: "Explosive",
    blurb: "Rounds detonate on impact, splashing nearby drones.",
    weight: 5,
    duration: 8,
    maxDuration: 16,
    hue: 15,
  },
};

export const DEFAULT_CONFIG: NeonCoreConfig = {
  coreRadius: 14,
  coreMaxHealth: 10,
  coreFlashTime: 0.45,
  shrinkFloorRatio: 0.45,
  shrinkSpeed: 70,
  splitRadiusRatio: 0.55,
  splitSpeedRatio: 1.35,
  particlesPerHit: 6,
  particlesPerKill: 16,
  maxParticles: 260,
  maxProjectiles: 220,
  maxEnemies: 90,
  particleFriction: 0.16,
  particleFade: 0.6,
  shakeTime: 0.32,
  shakeMagnitude: 6,
  minCooldown: 0.05,
  enemies: ENEMY_TYPES,
  weapons: WEAPONS,
  upgrades: UPGRADES,
  powerUps: {
    dropChance: 0.12,
    maxActiveDrops: 4,
    dropLifetime: 9,
    dropRadius: 11,
    slowFactor: 0.45,
    multiShotCount: 3,
    multiShotSpread: 0.42,
    explosionRadius: 74,
    explosionDamage: 1.5,
    types: POWER_UPS,
  },
  wave: {
    baseBudget: 6,
    budgetPerWave: 2,
    speedMulPerWave: 0.05,
    speedMulMax: 2.1,
    healthEveryWaves: 4,
    healthBonusMax: 4,
    spawnIntervalStart: 1.15,
    spawnIntervalMin: 0.32,
    spawnIntervalPerWave: 0.06,
    breakDuration: 4,
    warningDuration: 0.85,
    minSpawnDistance: 190,
    minWarningSeparation: 70,
    spawnAttempts: 12,
    upgradeEveryWaves: 3,
    upgradeChoices: 3,
  },
  combo: {
    killsPerStep: 4,
    stepValue: 0.5,
    maxMultiplier: 5,
  },
};

/**
 * Hold-to-fire cadence.
 *
 * The ramp is expressed as a *multiple of the current weapon cooldown* rather than
 * as absolute milliseconds, because the three weapons sit two orders of magnitude
 * apart on rate (Rapid 90 ms, Heavy 620 ms). A fixed 220 ms → 80 ms ramp would be
 * meaningless for Rapid and would hand Heavy a 7× damage buff. Anchoring to the
 * weapon means holding opens a little slower than the weapon's native maximum and
 * tightens to exactly that maximum — the existing balance is the ceiling, never the
 * floor, so sustained fire can't out-DPS what click-spam could already achieve.
 *
 * Concretely, per weapon: Pulse 352 ms → 220 ms, Rapid 144 ms → 90 ms,
 * Heavy 992 ms → 620 ms, reached smoothly over 1.2 s of holding.
 *
 * `minIntervalMs` mirrors `DEFAULT_CONFIG.minCooldown` (0.05 s): the same hard floor
 * the engine already enforces on upgraded weapons, restated here as a runaway guard.
 */
export const HOLD_FIRE: HoldFireTuning = {
  startMultiplier: 1.6,
  endMultiplier: 1,
  rampDurationMs: 1200,
  minIntervalMs: 50,
  maxShotsPerUpdate: 2,
};

/**
 * Milliseconds the engine should wait between sustained shots, given how long the
 * trigger has been held and the current weapon's cooldown.
 *
 * Pure and frame-rate independent — a 30 Hz and a 144 Hz client asked for the same
 * hold duration get the same interval. Extracted so the interpolation and its
 * boundaries can be tested without a game model.
 */
export function getFireInterval(
  holdDurationMs: number,
  weaponCooldownMs: number,
  tuning: HoldFireTuning = HOLD_FIRE,
): number {
  const span = Math.max(1, tuning.rampDurationMs);
  const progress = Math.min(1, Math.max(0, holdDurationMs / span));
  const multiplier = tuning.startMultiplier + (tuning.endMultiplier - tuning.startMultiplier) * progress;
  return Math.max(tuning.minIntervalMs, Math.max(0, weaponCooldownMs) * multiplier);
}

export const WEAPON_ORDER: WeaponId[] = ["pulse", "rapid", "heavy"];
export const POWER_UP_ORDER: PowerUpId[] = ["shield", "slowTime", "multiShot", "explosive"];
export const UPGRADE_ORDER: UpgradeId[] = ["damage", "fireRate", "projectileSpeed", "coreHealth", "scoreMultiplier"];

/** A minimal seeded PRNG, so runs are reproducible when a seed is supplied. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fallback world used before the canvas has been measured. */
export const DEFAULT_WORLD: World = { width: 960, height: 600 };

/** Concrete spawn parameters for a wave. The whole difficulty curve is here. */
export type WavePlan = {
  budget: number;
  spawnInterval: number;
  speedMul: number;
  healthBonus: number;
  kinds: EnemyKind[];
};

/** Turn a wave number into spawn parameters. The only reader of `config.wave`. */
export function wavePlan(config: NeonCoreConfig, wave: number): WavePlan {
  const w = config.wave;
  const step = Math.max(0, wave - 1);
  const kinds = (Object.keys(config.enemies) as EnemyKind[]).filter(
    (kind) => wave >= config.enemies[kind].unlockWave,
  );
  return {
    budget: w.baseBudget + w.budgetPerWave * step,
    spawnInterval: Math.max(w.spawnIntervalMin, w.spawnIntervalStart - w.spawnIntervalPerWave * step),
    speedMul: Math.min(w.speedMulMax, 1 + w.speedMulPerWave * step),
    healthBonus: Math.min(w.healthBonusMax, Math.floor(step / w.healthEveryWaves)),
    kinds,
  };
}

/** Multiplier from combo alone, clamped to the configured ceiling. */
export function multiplierFor(combo: number, scaling: ComboScaling): number {
  const steps = Math.floor(combo / scaling.killsPerStep);
  return Math.min(scaling.maxMultiplier, 1 + steps * scaling.stepValue);
}

/**
 * Fold the run's upgrades into a weapon's numbers. Every consumer — `fire`, the
 * HUD, the upgrade card — reads through here, so there is one definition of what
 * a weapon currently does.
 */
export function derivedWeapon(model: NeonCoreModel, weapon: WeaponId = model.weapon): DerivedWeapon {
  const { config, upgrades } = model;
  const base = config.weapons[weapon];
  const cooldown = Math.max(
    config.minCooldown,
    base.cooldown * Math.pow(1 - config.upgrades.fireRate.value, upgrades.fireRate),
  );
  return {
    cooldown,
    damage: base.damage + config.upgrades.damage.value * upgrades.damage,
    projectileSpeed: base.projectileSpeed * (1 + config.upgrades.projectileSpeed.value * upgrades.projectileSpeed),
    projectileRadius: base.projectileRadius,
  };
}

/** Recompute the cached score multiplier from combo + the Overdrive upgrade. */
function recomputeMultiplier(model: NeonCoreModel): void {
  const fromCombo = multiplierFor(model.combo, model.config.combo);
  const fromUpgrade = model.config.upgrades.scoreMultiplier.value * model.upgrades.scoreMultiplier;
  model.multiplier = fromCombo + fromUpgrade;
}

/** Radius an enemy should be showing at its current health. */
function radiusForHealth(enemy: Enemy, config: NeonCoreConfig): number {
  const ratio = enemy.maxHealth <= 0 ? 1 : enemy.health / enemy.maxHealth;
  const floor = config.shrinkFloorRatio;
  return enemy.baseRadius * (floor + (1 - floor) * Math.max(0, ratio));
}

function emptyUpgrades(): UpgradeLevels {
  return { damage: 0, fireRate: 0, projectileSpeed: 0, coreHealth: 0, scoreMultiplier: 0 };
}

function emptyEffects(): EffectTimers {
  return { shield: 0, slowTime: 0, multiShot: 0, explosive: 0 };
}

function idleHold(): HoldFireState {
  return { active: false, heldMs: 0, sinceShotMs: 0, aimX: 0, aimY: 0 };
}

function emptyStats(): RunStats {
  return {
    shotsFired: 0,
    shotsHit: 0,
    enemiesDestroyed: 0,
    highestCombo: 0,
    waveReached: 1,
    survivalTime: 0,
    damageTaken: 0,
    flawlessWaves: 0,
    shotsByWeapon: { pulse: 0, rapid: 0, heavy: 0 },
    powerUpsByKind: { shield: 0, slowTime: 0, multiShot: 0, explosive: 0 },
    powerUpsCollected: 0,
  };
}

export function createGame(
  world: World = DEFAULT_WORLD,
  config: NeonCoreConfig = DEFAULT_CONFIG,
  seed = Math.floor(Math.random() * 0xffffffff),
): NeonCoreModel {
  const model: NeonCoreModel = {
    core: {
      x: world.width / 2,
      y: world.height / 2,
      radius: config.coreRadius,
      health: config.coreMaxHealth,
      maxHealth: config.coreMaxHealth,
      damageFlash: 0,
    },
    projectiles: [],
    enemies: [],
    warnings: [],
    drops: [],
    particles: [],
    particlePool: [],
    particleCap: config.maxParticles,
    score: 0,
    combo: 0,
    multiplier: 1,
    wave: 1,
    waveState: "spawning",
    waveRemaining: 0,
    spawnTimer: 0,
    breakTimer: 0,
    fireCooldown: 0,
    hold: idleHold(),
    weapon: "pulse",
    upgrades: emptyUpgrades(),
    effects: emptyEffects(),
    pendingUpgrades: [],
    shake: 0,
    damageThisWave: 0,
    stats: emptyStats(),
    world: { ...world },
    config,
    rng: mulberry32(seed),
  };
  beginWave(model, 1);
  return model;
}

/** Arm the model for `wave`, without touching score or stats. */
function beginWave(model: NeonCoreModel, wave: number): void {
  const plan = wavePlan(model.config, wave);
  model.wave = wave;
  model.waveState = "spawning";
  model.waveRemaining = plan.budget;
  // A beat of air before the first telegraph of the wave.
  model.spawnTimer = wave === 1 ? 0.5 : 0.25;
  model.breakTimer = 0;
  model.pendingUpgrades = [];
  // Reset the per-wave damage tally; a wave cleared with this still 0 is flawless.
  model.damageThisWave = 0;
  model.stats.waveReached = Math.max(model.stats.waveReached, wave);
}

/**
 * Clear a run back to its opening state, reusing the same model object.
 *
 * Every transient is dropped here — drops, effects, upgrade levels, cooldown,
 * pending choices — so nothing from the previous run can bleed into the new one.
 * The selected weapon deliberately survives: all three are available from wave 1,
 * so it is a preference, not progress.
 */
export function resetGame(model: NeonCoreModel): void {
  model.projectiles.length = 0;
  model.enemies.length = 0;
  model.warnings.length = 0;
  model.drops.length = 0;
  model.particles.length = 0;
  model.score = 0;
  model.combo = 0;
  model.multiplier = 1;
  model.shake = 0;
  model.fireCooldown = 0;
  // A restart drops the trigger: a pointer still held from the previous run cannot
  // carry its ramp — or a stuck `active` flag — into the new one.
  model.hold = idleHold();
  model.upgrades = emptyUpgrades();
  model.effects = emptyEffects();
  model.pendingUpgrades = [];
  model.core.x = model.world.width / 2;
  model.core.y = model.world.height / 2;
  model.core.health = model.config.coreMaxHealth;
  model.core.maxHealth = model.config.coreMaxHealth;
  model.core.damageFlash = 0;
  model.damageThisWave = 0;
  model.stats = emptyStats();
  beginWave(model, 1);
}

/**
 * Tear down a finished run's live state.
 *
 * `update` stops being called once the core falls, so nothing can tick anyway, but
 * clearing here means the frozen game-over scene shows no active shield, no
 * uncollected drops, and no in-flight rounds.
 */
export function endRun(model: NeonCoreModel): void {
  model.projectiles.length = 0;
  model.warnings.length = 0;
  model.drops.length = 0;
  model.effects = emptyEffects();
  model.pendingUpgrades = [];
  model.fireCooldown = 0;
  // Game over releases the trigger, so a pointer still down when the core fell
  // cannot resume firing if the same model is stepped again.
  model.hold = idleHold();
}

/**
 * Re-centre the core after a resize. Entities keep their absolute positions —
 * enemies simply continue toward the core's new location on the next step.
 */
export function resizeWorld(model: NeonCoreModel, width: number, height: number): void {
  if (width <= 0 || height <= 0) return;
  model.world.width = width;
  model.world.height = height;
  model.core.x = width / 2;
  model.core.y = height / 2;
}

/**
 * Switch weapons.
 *
 * The fire cooldown is intentionally *not* cleared: if switching reset it, cycling
 * weapons would be a free way to ignore Heavy's rate limit.
 */
export function setWeapon(model: NeonCoreModel, weapon: WeaponId): boolean {
  if (model.weapon === weapon) return false;
  model.weapon = weapon;
  return true;
}

/**
 * Swap the tuning the simulation runs on. The progression layer folds equipped
 * passive modifiers into a config copy and applies it here between runs; because
 * the engine reads `model.config` live, cooldowns, health, drop rate, and combo
 * shaping all pick it up on the next `resetGame`. `startWeapon` sets the round the
 * next run opens with (the equipped, unlocked weapon).
 */
export function applyLoadout(model: NeonCoreModel, config: NeonCoreConfig, startWeapon: WeaponId): void {
  model.config = config;
  model.weapon = startWeapon;
}

/**
 * Fire toward an arena-space point, if the weapon is off cooldown.
 *
 * The cooldown is enforced here rather than in the UI, so click-spam, autoclickers,
 * and synthetic pointer events all hit the same rate limit. Returns whether a shot
 * actually left the core.
 */
export function fire(model: NeonCoreModel, targetX: number, targetY: number): boolean {
  if (model.fireCooldown > 0) return false;
  // Parked for an upgrade choice: rounds fired now would hang in a frozen arena.
  if (model.waveState === "upgrade") return false;

  const { core, config, effects } = model;
  const weapon = derivedWeapon(model);
  model.fireCooldown = weapon.cooldown;

  const baseAngle = Math.atan2(targetY - core.y, targetX - core.x);
  const multi = effects.multiShot > 0;
  const count = multi ? config.powerUps.multiShotCount : 1;
  const spread = multi ? config.powerUps.multiShotSpread : 0;
  const explosive = effects.explosive > 0;

  for (let i = 0; i < count; i += 1) {
    const offset = count === 1 ? 0 : (i / (count - 1) - 0.5) * spread;
    const angle = baseAngle + offset;
    model.projectiles.push({
      x: core.x,
      y: core.y,
      radius: weapon.projectileRadius,
      vx: Math.cos(angle) * weapon.projectileSpeed,
      vy: Math.sin(angle) * weapon.projectileSpeed,
      damage: weapon.damage,
      weapon: model.weapon,
      explosive,
    });
    // Count every pellet, so multi-shot can't inflate accuracy past 100%.
    model.stats.shotsFired += 1;
    model.stats.shotsByWeapon[model.weapon] += 1;
  }
  // Safety cap: on a very long run, drop the oldest rounds rather than letting the
  // array grow unbounded (rounds off-screen are culled anyway; this is a backstop).
  while (model.projectiles.length > config.maxProjectiles) model.projectiles.shift();
  return true;
}

/**
 * Press and hold the trigger, aimed at an arena-space point.
 *
 * The first shot leaves *immediately* — it goes through the same `fire` above, so a
 * quick click is still exactly one shot under the same cooldown, ammo, park, and
 * multi-shot rules. The ramp then starts from zero, which is what makes a release
 * and a fresh press reset the cadence.
 *
 * Returns whether that opening shot actually left the core; the hold is armed either
 * way, so pressing while the weapon is still cooling starts firing the moment it is
 * ready rather than swallowing the input.
 */
export function beginHoldFire(model: NeonCoreModel, targetX: number, targetY: number): boolean {
  const { hold } = model;
  hold.active = true;
  hold.heldMs = 0;
  hold.sinceShotMs = 0;
  hold.aimX = targetX;
  hold.aimY = targetY;
  return fire(model, targetX, targetY);
}

/**
 * Update where a held trigger is pointing. Every subsequent sustained shot reads
 * this, so aim follows the pointer instead of locking to the press location.
 */
export function aimHoldFire(model: NeonCoreModel, targetX: number, targetY: number): void {
  model.hold.aimX = targetX;
  model.hold.aimY = targetY;
}

/**
 * Release the trigger. Idempotent, and safe to call from anywhere that must stop
 * fire — pointer up/cancel, lost capture, blur, tab hide, pause, game over,
 * restart, unmount. Clearing the accumulator here is what prevents a backlog of
 * shots from being released on the next press.
 */
export function endHoldFire(model: NeonCoreModel): void {
  const { hold } = model;
  hold.active = false;
  hold.heldMs = 0;
  hold.sinceShotMs = 0;
}

/**
 * Advance the sustained-fire cadence by `dt` seconds and emit any shots due.
 * Returns how many actually left the core.
 *
 * Called from `update`, so it inherits every guarantee the rest of the simulation
 * has: it cannot tick while paused (nothing calls `update`), while parked for an
 * upgrade (`update` returns early), or after the run ends. Two separate brakes stop
 * a stalled tab or a long frame from dumping a burst — `maxShotsPerUpdate` caps the
 * catch-up loop, and any accumulator left above one interval is truncated so stale
 * time is discarded rather than banked.
 */
export function stepHoldFire(model: NeonCoreModel, dt: number, tuning: HoldFireTuning = HOLD_FIRE): number {
  const { hold } = model;
  if (!hold.active || dt <= 0) return 0;

  const ms = dt * 1000;
  hold.heldMs += ms;
  hold.sinceShotMs += ms;

  const interval = getFireInterval(hold.heldMs, derivedWeapon(model).cooldown * 1000, tuning);
  let shots = 0;
  while (shots < tuning.maxShotsPerUpdate && hold.sinceShotMs >= interval) {
    // `fire` owns the real rate limit; a refusal means the weapon is still cooling,
    // so leave the accumulator alone and try again next frame.
    if (!fire(model, hold.aimX, hold.aimY)) break;
    hold.sinceShotMs -= interval;
    shots += 1;
  }
  // Never carry more than one interval of credit forward.
  if (hold.sinceShotMs > interval) hold.sinceShotMs = interval;
  return shots;
}

/**
 * Set the live particle cap (0…config.maxParticles). The React layer lowers this
 * for reduced motion, performance mode, or a particles-off setting; the simulation
 * itself never reads settings.
 */
export function setParticleCap(model: NeonCoreModel, cap: number): void {
  model.particleCap = Math.max(0, Math.min(model.config.maxParticles, Math.floor(cap)));
}

/** Upgrade tracks that still have room to level. */
function availableUpgrades(model: NeonCoreModel): UpgradeId[] {
  return UPGRADE_ORDER.filter((id) => model.upgrades[id] < model.config.upgrades[id].maxLevel);
}

/** Pick the options to offer, without repeats, using the seeded RNG. */
function offerUpgrades(model: NeonCoreModel): UpgradeId[] {
  const pool = availableUpgrades(model);
  // Fisher-Yates on a copy; deterministic under a fixed seed.
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(model.rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, model.config.wave.upgradeChoices);
}

/**
 * Apply the player's upgrade choice and start the next wave.
 *
 * Guarded so it is idempotent per offer: it only does anything while the engine is
 * parked in `upgrade` with `id` among the pending options, and the first successful
 * call clears both. A double-click, a duplicated event, or a stale callback
 * therefore cannot bank the same upgrade twice.
 */
export function applyUpgrade(model: NeonCoreModel, id: UpgradeId): boolean {
  if (model.waveState !== "upgrade") return false;
  if (!model.pendingUpgrades.includes(id)) return false;

  const config = model.config.upgrades[id];
  if (model.upgrades[id] >= config.maxLevel) return false;
  model.upgrades[id] += 1;

  if (id === "coreHealth") {
    model.core.maxHealth += config.value;
    model.core.health = Math.min(model.core.maxHealth, model.core.health + config.value);
  }
  if (id === "scoreMultiplier") recomputeMultiplier(model);

  // beginWave clears pendingUpgrades and moves the state out of "upgrade".
  beginWave(model, model.wave + 1);
  return true;
}

/** Weighted pick among the kinds unlocked on this wave. */
function pickKind(model: NeonCoreModel, plan: WavePlan): EnemyKind {
  const total = plan.kinds.reduce((sum, kind) => sum + model.config.enemies[kind].weight, 0);
  let roll = model.rng() * total;
  for (const kind of plan.kinds) {
    roll -= model.config.enemies[kind].weight;
    if (roll <= 0) return kind;
  }
  return plan.kinds[plan.kinds.length - 1] ?? "basic";
}

/** Weighted pick among power-up kinds. */
function pickPowerUp(model: NeonCoreModel): PowerUpId {
  const types = model.config.powerUps.types;
  const total = POWER_UP_ORDER.reduce((sum, id) => sum + types[id].weight, 0);
  let roll = model.rng() * total;
  for (const id of POWER_UP_ORDER) {
    roll -= types[id].weight;
    if (roll <= 0) return id;
  }
  return POWER_UP_ORDER[POWER_UP_ORDER.length - 1];
}

/**
 * Find a fair edge point for a telegraph: outside the arena, at least
 * `minSpawnDistance` from the core, and not stacked on another pending warning.
 *
 * Rejection sampling can legitimately fail on a small arena, so the last resort
 * pushes the candidate radially outward to the minimum distance rather than
 * returning nothing — a wave must never stall for want of a spawn point.
 */
function findSpawnPoint(model: NeonCoreModel, radius: number): { x: number; y: number } {
  const { world, config, core, rng } = model;
  const w = config.wave;

  const candidate = (): { x: number; y: number } => {
    if (rng() > 0.5) {
      return { x: rng() < 0.5 ? -radius : world.width + radius, y: rng() * world.height };
    }
    return { x: rng() * world.width, y: rng() < 0.5 ? -radius : world.height + radius };
  };

  const farEnoughFromWarnings = (x: number, y: number): boolean =>
    model.warnings.every((warning) => Math.hypot(warning.x - x, warning.y - y) >= w.minWarningSeparation);

  let fallback = candidate();
  for (let attempt = 0; attempt < w.spawnAttempts; attempt += 1) {
    const point = attempt === 0 ? fallback : candidate();
    const distance = Math.hypot(point.x - core.x, point.y - core.y);
    if (distance >= w.minSpawnDistance && farEnoughFromWarnings(point.x, point.y)) return point;
    fallback = point;
  }

  // Push the last candidate out to the minimum distance along its own bearing.
  const dx = fallback.x - core.x;
  const dy = fallback.y - core.y;
  const distance = Math.hypot(dx, dy) || 1;
  const scale = Math.max(1, w.minSpawnDistance / distance);
  return { x: core.x + dx * scale, y: core.y + dy * scale };
}

/** Queue an edge telegraph. The enemy itself materialises when the timer elapses. */
function queueWarning(model: NeonCoreModel, plan: WavePlan): void {
  const kind = pickKind(model, plan);
  const radius = model.config.enemies[kind].radius;
  const point = findSpawnPoint(model, radius);
  model.warnings.push({
    x: point.x,
    y: point.y,
    kind,
    radius,
    timer: model.config.wave.warningDuration,
    duration: model.config.wave.warningDuration,
  });
}

/** Build an enemy of `kind` at a point, aimed at the core. */
function makeEnemy(
  model: NeonCoreModel,
  kind: EnemyKind,
  x: number,
  y: number,
  plan: WavePlan,
  overrides?: { radiusRatio?: number; speedRatio?: number; health?: number; splitCount?: number },
): Enemy {
  const type = model.config.enemies[kind];
  const { core } = model;
  const radiusRatio = overrides?.radiusRatio ?? 1;
  const baseRadius = type.radius * radiusRatio;
  const health = overrides?.health ?? type.health + plan.healthBonus;
  const speed = type.speed * plan.speedMul * (overrides?.speedRatio ?? 1);
  const angle = Math.atan2(core.y - y, core.x - x);

  return {
    kind,
    x,
    y,
    radius: baseRadius,
    targetRadius: baseRadius,
    baseRadius,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    health,
    maxHealth: health,
    hue: type.hue + (model.rng() * 24 - 12),
    flash: 0,
    splitCount: overrides?.splitCount ?? type.splitCount,
  };
}

/**
 * Emit a splitter's offspring.
 *
 * Children are clamped inside the arena so a splitter killed while still off-screen
 * cannot drop enemies out of bounds, and they carry `splitCount: 0` so a split can
 * never chain.
 */
function splitEnemy(model: NeonCoreModel, parent: Enemy, plan: WavePlan): void {
  const { config, world } = model;
  const childRadius = parent.baseRadius * config.splitRadiusRatio;
  // Keep children fully inside the arena regardless of where the parent died.
  const minX = childRadius;
  const maxX = Math.max(childRadius, world.width - childRadius);
  const minY = childRadius;
  const maxY = Math.max(childRadius, world.height - childRadius);

  for (let i = 0; i < parent.splitCount; i += 1) {
    if (model.enemies.length >= config.maxEnemies) break; // never exceed the cap
    const angle = (Math.PI * 2 * i) / parent.splitCount + model.rng() * 0.6;
    const offset = parent.baseRadius * 0.8;
    const x = Math.min(maxX, Math.max(minX, parent.x + Math.cos(angle) * offset));
    const y = Math.min(maxY, Math.max(minY, parent.y + Math.sin(angle) * offset));
    const child = makeEnemy(model, parent.kind, x, y, plan, {
      radiusRatio: config.splitRadiusRatio,
      speedRatio: config.splitSpeedRatio,
      health: Math.max(1, Math.ceil(parent.maxHealth / 2)),
      splitCount: 0,
    });
    model.enemies.push(child);
  }
}

/**
 * Roll for a power-up drop on a kill.
 *
 * Exactly one roll per kill, capped by `maxActiveDrops`, and the token is clamped
 * into the arena so a kill just off-screen can't leave a drop somewhere the player
 * has no way to shoot.
 */
function maybeDrop(model: NeonCoreModel, x: number, y: number): void {
  const pu = model.config.powerUps;
  if (model.drops.length >= pu.maxActiveDrops) return;
  if (model.rng() >= pu.dropChance) return;

  const { world } = model;
  const r = pu.dropRadius;
  model.drops.push({
    id: pickPowerUp(model),
    x: Math.min(Math.max(x, r), Math.max(r, world.width - r)),
    y: Math.min(Math.max(y, r), Math.max(r, world.height - r)),
    radius: r,
    timer: pu.dropLifetime,
    duration: pu.dropLifetime,
  });
}

/**
 * Bank a collected power-up.
 *
 * Stacking rule: re-collecting a live effect *extends* it rather than replacing it,
 * but never past that effect's `maxDuration`, so a lucky streak of drops can't turn
 * into a permanent shield. Different effects are independent and may all run at once.
 */
function collectPowerUp(model: NeonCoreModel, id: PowerUpId, events: StepEvents): void {
  const type = model.config.powerUps.types[id];
  model.effects[id] = Math.min(type.maxDuration, model.effects[id] + type.duration);
  model.stats.powerUpsByKind[id] += 1;
  model.stats.powerUpsCollected += 1;
  events.powerUpCollected = id;
  emitBurst(model, model.core.x, model.core.y, type.hue, 10);
}

/**
 * Return a spent particle to the pool for reuse. Particles are purely cosmetic, so
 * their randomness stays non-deterministic; only their *count* is bounded. The pool
 * is itself capped so it can't grow without limit on a long run.
 */
function releaseParticle(model: NeonCoreModel, particle: Particle): void {
  if (model.particlePool.length < model.particleCap) model.particlePool.push(particle);
}

/**
 * Spawn up to `count` particles, honouring the live cap. Objects are drawn from the
 * pool when available and every field is overwritten on reuse, so no stale state
 * (position, velocity, alpha) can leak from a particle's previous life.
 */
function emitBurst(model: NeonCoreModel, x: number, y: number, hue: number, count: number): void {
  const { rng } = model;
  const room = model.particleCap - model.particles.length;
  if (room <= 0) return;
  const n = Math.min(count, room);
  for (let i = 0; i < n; i += 1) {
    const speed = rng() * 260 + 40;
    const angle = rng() * Math.PI * 2;
    const radius = rng() * 2 + 0.5;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const recycled = model.particlePool.pop();
    if (recycled) {
      recycled.x = x;
      recycled.y = y;
      recycled.radius = radius;
      recycled.vx = vx;
      recycled.vy = vy;
      recycled.hue = hue;
      recycled.alpha = 1;
      model.particles.push(recycled);
    } else {
      model.particles.push({ x, y, radius, vx, vy, hue, alpha: 1 });
    }
  }
}

/** True when two circles overlap. */
function collides(ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean {
  return Math.hypot(ax - bx, ay - by) - ar - br < 1;
}

/** Award score for an event, scaled by the live multiplier. */
function award(model: NeonCoreModel, base: number): void {
  model.score += Math.round(base * model.multiplier);
}

/** Apply core damage and break the combo. */
function damageCore(model: NeonCoreModel, amount: number, events: StepEvents): void {
  const { core, config } = model;
  core.health = Math.max(0, core.health - amount);
  core.damageFlash = config.coreFlashTime;
  model.shake = config.shakeTime;
  model.stats.damageTaken += amount;
  model.damageThisWave += amount;
  // A hit on the core is what breaks a combo — kills alone never end one.
  model.combo = 0;
  recomputeMultiplier(model);
  events.coreDamaged = true;
  if (core.health <= 0) events.coreDestroyed = true;
}

/**
 * Destroy the enemy at `index`, paying out score, combo, particles, splits, and a
 * possible drop. The caller must only invoke this from a high-to-low index walk.
 */
function killEnemyAt(model: NeonCoreModel, index: number, events: StepEvents, plan: WavePlan): void {
  const enemy = model.enemies[index];
  model.enemies.splice(index, 1);

  emitBurst(model, enemy.x, enemy.y, enemy.hue, model.config.particlesPerKill);
  model.combo += 1;
  recomputeMultiplier(model);
  model.stats.highestCombo = Math.max(model.stats.highestCombo, model.combo);
  model.stats.enemiesDestroyed += 1;
  award(model, model.config.enemies[enemy.kind].scorePerKill);

  if (enemy.splitCount > 0) splitEnemy(model, enemy, plan);
  maybeDrop(model, enemy.x, enemy.y);
  events.killed = true;
}

/**
 * Advance the simulation by `dt` seconds.
 *
 * Collisions are resolved in two phases. Phase one walks projectiles and records
 * damage into a map keyed by enemy index, splicing only projectiles. Phase two
 * applies that damage in a single high-to-low walk over the enemies. Splitting the
 * work this way is what lets explosive rounds damage several enemies at once
 * without a splice invalidating an index that is still in use, and it means two
 * projectiles landing on the same enemy in one step sum into one death rather than
 * paying out twice.
 */
export function update(model: NeonCoreModel, dt: number): StepEvents {
  const events: StepEvents = {
    hit: false,
    killed: false,
    coreDamaged: false,
    coreDestroyed: false,
    waveCleared: false,
    waveStarted: false,
    upgradeReady: false,
    powerUpCollected: null,
    shots: 0,
    score: model.score,
  };
  if (dt <= 0) return events;
  // Parked for an upgrade choice: nothing moves until `applyUpgrade` is called.
  if (model.waveState === "upgrade") return events;

  const { config, core, world, effects } = model;
  const plan = wavePlan(config, model.wave);

  model.stats.survivalTime += dt;
  if (core.damageFlash > 0) core.damageFlash = Math.max(0, core.damageFlash - dt);
  if (model.shake > 0) model.shake = Math.max(0, model.shake - dt);
  if (model.fireCooldown > 0) model.fireCooldown = Math.max(0, model.fireCooldown - dt);

  // Sustained fire, after the cooldown tick so a shot due this frame can take the
  // cooldown that just expired. Rounds fired here join the same projectile list and
  // are resolved by the collision phases below in this very step.
  events.shots = stepHoldFire(model, dt);

  // Effect timers. Expiry is implicit: a zero here means the effect is simply off
  // the next time anything reads it, so no effect can outlive its timer.
  for (const id of POWER_UP_ORDER) {
    if (effects[id] > 0) effects[id] = Math.max(0, effects[id] - dt);
  }
  const timeScale = effects.slowTime > 0 ? config.powerUps.slowFactor : 1;

  /* Wave machine ---------------------------------------------------------- */
  if (model.waveState === "spawning") {
    model.spawnTimer -= dt;
    while (model.spawnTimer <= 0 && model.waveRemaining > 0) {
      queueWarning(model, plan);
      model.waveRemaining -= 1;
      model.spawnTimer += plan.spawnInterval;
    }
    if (model.waveRemaining <= 0) model.waveState = "clearing";
  }

  /* Telegraphs: tick down, then materialise. Warnings are queued and consumed
     inside the same wave, so the current plan is always the right one. */
  for (let i = model.warnings.length - 1; i >= 0; i -= 1) {
    const warning = model.warnings[i];
    warning.timer -= dt;
    if (warning.timer > 0) continue;
    // Cap is a safety net; waves are already bounded, so this rarely trips.
    if (model.enemies.length < config.maxEnemies) {
      model.enemies.push(makeEnemy(model, warning.kind, warning.x, warning.y, plan));
    }
    model.warnings.splice(i, 1);
  }

  // Uncollected drops decay.
  for (let i = model.drops.length - 1; i >= 0; i -= 1) {
    const drop = model.drops[i];
    drop.timer -= dt;
    if (drop.timer <= 0) model.drops.splice(i, 1);
  }

  // Particles: drift, decay, cull.
  const retain = Math.pow(config.particleFriction, dt);
  for (let i = model.particles.length - 1; i >= 0; i -= 1) {
    const p = model.particles[i];
    p.vx *= retain;
    p.vy *= retain;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.alpha -= config.particleFade * dt;
    if (p.alpha <= 0) {
      model.particles.splice(i, 1);
      releaseParticle(model, p);
    }
  }

  // Projectiles: travel, then cull once fully off-arena.
  const margin = 40;
  for (let i = model.projectiles.length - 1; i >= 0; i -= 1) {
    const p = model.projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (
      p.x + p.radius < -margin ||
      p.x - p.radius > world.width + margin ||
      p.y + p.radius < -margin ||
      p.y - p.radius > world.height + margin
    ) {
      model.projectiles.splice(i, 1);
    }
  }

  // Enemies: approach the core (slowed if the field is up), ease pending shrink,
  // and resolve core contact. Core contact consumes the enemy, so a splitter that
  // gets through does not get to split as well.
  for (let i = model.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = model.enemies[i];
    enemy.x += enemy.vx * dt * timeScale;
    enemy.y += enemy.vy * dt * timeScale;

    if (enemy.radius > enemy.targetRadius) {
      enemy.radius = Math.max(enemy.targetRadius, enemy.radius - config.shrinkSpeed * dt);
    }
    if (enemy.flash > 0) enemy.flash = Math.max(0, enemy.flash - dt);

    if (!collides(core.x, core.y, core.radius, enemy.x, enemy.y, enemy.radius)) continue;

    model.enemies.splice(i, 1);
    if (effects.shield > 0) {
      // Absorbed: the drone dies, the core is untouched, and the combo survives.
      emitBurst(model, enemy.x, enemy.y, config.powerUps.types.shield.hue, config.particlesPerHit);
      continue;
    }
    emitBurst(model, enemy.x, enemy.y, 0, config.particlesPerHit);
    damageCore(model, config.enemies[enemy.kind].coreDamage, events);
    if (events.coreDestroyed) break;
  }

  /* Collisions, phase one: projectiles → drops, then projectiles → enemies.
     Only projectiles and drops are spliced here; enemy damage is banked by index. */
  const damage = new Map<number, number>();
  const addDamage = (index: number, amount: number) => {
    damage.set(index, (damage.get(index) ?? 0) + amount);
  };

  for (let j = model.projectiles.length - 1; j >= 0; j -= 1) {
    const p = model.projectiles[j];

    // A drop pays out once: it is removed before the effect is applied, so two
    // projectiles arriving on the same frame cannot both collect it.
    let collected = false;
    for (let d = model.drops.length - 1; d >= 0; d -= 1) {
      const drop = model.drops[d];
      if (!collides(p.x, p.y, p.radius, drop.x, drop.y, drop.radius)) continue;
      model.drops.splice(d, 1);
      collectPowerUp(model, drop.id, events);
      collected = true;
      break;
    }
    if (collected) {
      model.projectiles.splice(j, 1);
      continue;
    }

    // First overlap wins, so one round can never damage two enemies directly.
    let hitIndex = -1;
    for (let i = 0; i < model.enemies.length; i += 1) {
      const enemy = model.enemies[i];
      if (collides(p.x, p.y, p.radius, enemy.x, enemy.y, enemy.radius)) {
        hitIndex = i;
        break;
      }
    }
    if (hitIndex < 0) continue;

    addDamage(hitIndex, p.damage);
    emitBurst(model, p.x, p.y, model.enemies[hitIndex].hue, config.particlesPerHit);
    events.hit = true;
    model.stats.shotsHit += 1;

    if (p.explosive) {
      const blast = config.powerUps;
      emitBurst(model, p.x, p.y, blast.types.explosive.hue, config.particlesPerKill);
      for (let i = 0; i < model.enemies.length; i += 1) {
        if (i === hitIndex) continue;
        const enemy = model.enemies[i];
        if (Math.hypot(enemy.x - p.x, enemy.y - p.y) <= blast.explosionRadius + enemy.radius) {
          addDamage(i, blast.explosionDamage);
        }
      }
    }

    model.projectiles.splice(j, 1);
  }

  /* Collisions, phase two: apply banked damage high-index first. Splices below the
     current index never move a pending one, and `splitEnemy` only appends. */
  const damaged = [...damage.keys()].sort((a, b) => b - a);
  for (const index of damaged) {
    const enemy = model.enemies[index];
    if (!enemy) continue;
    enemy.health -= damage.get(index) ?? 0;
    if (enemy.health > 0) {
      enemy.targetRadius = radiusForHealth(enemy, config);
      enemy.flash = 0.09; // brief white flash on a non-fatal hit
      award(model, config.enemies[enemy.kind].scorePerHit);
      continue;
    }
    killEnemyAt(model, index, events, plan);
  }

  /* Wave completion, break, and the upgrade stop. Checked after collisions so the
     kill that empties the arena starts the break in the same step. */
  if (model.waveState === "clearing" && model.enemies.length === 0 && model.warnings.length === 0) {
    events.waveCleared = true;
    // Cleared with no core damage this wave → a flawless wave.
    if (model.damageThisWave === 0) model.stats.flawlessWaves += 1;
    const isUpgradeWave = model.wave % config.wave.upgradeEveryWaves === 0;
    const offer = isUpgradeWave ? offerUpgrades(model) : [];
    if (offer.length > 0) {
      // Park until the player chooses. Nothing else ticks while parked.
      model.waveState = "upgrade";
      model.pendingUpgrades = offer;
      events.upgradeReady = true;
    } else {
      model.waveState = "break";
      model.breakTimer = config.wave.breakDuration;
    }
  } else if (model.waveState === "break") {
    model.breakTimer -= dt;
    if (model.breakTimer <= 0) {
      beginWave(model, model.wave + 1);
      events.waveStarted = true;
    }
  }

  events.score = model.score;
  return events;
}

/** Enemies currently in play — surfaced in the HUD. */
export function activeThreats(model: NeonCoreModel): number {
  return model.enemies.length;
}

/** Shots that connected, as a 0–100 percentage. */
export function accuracyPercent(model: NeonCoreModel): number {
  const { shotsFired, shotsHit } = model.stats;
  if (shotsFired <= 0) return 0;
  return Math.round((shotsHit / shotsFired) * 100);
}

/** The weapon with the most shots fired, or null if nothing has been fired. */
export function favouriteWeapon(usage: Record<WeaponId, number>): WeaponId | null {
  let best: WeaponId | null = null;
  for (const id of WEAPON_ORDER) {
    if (usage[id] <= 0) continue;
    if (!best || usage[id] > usage[best]) best = id;
  }
  return best;
}
