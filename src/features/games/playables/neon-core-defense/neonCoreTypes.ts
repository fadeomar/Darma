/**
 * Neon Core Defense — shared types.
 *
 * An original arcade take on the classic "defend the centre" shooter: a stationary
 * core sits in the middle of the arena, enemies converge from the edges, and the
 * player fires by aiming with a pointer. Unlike a fixed-world game, the arena here
 * *is* the rendered canvas, so `world` is remeasured on resize and every spawn is
 * derived from it.
 *
 * All motion is expressed in CSS pixels per **second** (not per frame), and every
 * timer lives in the model rather than in a DOM timer, so the simulation runs
 * identically on a 60 Hz or 144 Hz display and freezes completely when the player
 * component simply stops calling `update`.
 */

export type NeonCorePhase = "intro" | "playing" | "paused" | "over";

/** Arena size in CSS pixels — mirrors the canvas' displayed size. */
export type World = {
  width: number;
  height: number;
};

export type EnemyKind = "basic" | "fast" | "tank" | "splitter";

export type WeaponId = "pulse" | "rapid" | "heavy";

export type UpgradeId = "damage" | "fireRate" | "projectileSpeed" | "coreHealth" | "scoreMultiplier";

export type PowerUpId = "shield" | "slowTime" | "multiShot" | "explosive";

/**
 * Where the wave machine currently is.
 *
 * `upgrade` is a hard stop: the engine parks here after an upgrade wave clears and
 * refuses to advance until `applyUpgrade` is called, which is what lets the player
 * choose without the arena moving under them.
 */
export type WaveState = "spawning" | "clearing" | "break" | "upgrade";

export type Core = {
  /** Centre of the arena; recomputed on resize. */
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  /** Counts down after a hit; render-only damage flash. */
  damageFlash: number;
};

export type Projectile = {
  x: number;
  y: number;
  radius: number;
  /** Velocity in px/second. */
  vx: number;
  vy: number;
  damage: number;
  /** Weapon that fired it — drives colour and trail only. */
  weapon: WeaponId;
  /** Detonates for area damage on impact (from the explosive power-up). */
  explosive: boolean;
};

export type Enemy = {
  kind: EnemyKind;
  x: number;
  y: number;
  /** Current drawn/collided radius; eases toward `targetRadius` as health drops. */
  radius: number;
  targetRadius: number;
  /** Radius at full health; the shrink curve is derived from this. */
  baseRadius: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  hue: number;
  /** Render-only hit flash timer, set on damage and decayed each step. */
  flash: number;
  /**
   * Children to emit on death. Splitter offspring carry 0 so a split can never
   * chain into an unbounded cascade.
   */
  splitCount: number;
};

/**
 * An inbound-enemy telegraph. The enemy does not exist (and cannot be shot or do
 * damage) until the warning elapses, which is what makes edge spawning fair.
 */
export type SpawnWarning = {
  x: number;
  y: number;
  kind: EnemyKind;
  radius: number;
  /** Seconds until the enemy materialises. */
  timer: number;
  /** Original duration, so the render can draw a fill ratio. */
  duration: number;
};

/** A power-up token dropped by a kill. Shoot it to collect it before it expires. */
export type Drop = {
  id: PowerUpId;
  x: number;
  y: number;
  radius: number;
  /** Seconds until it vanishes. */
  timer: number;
  duration: number;
};

export type Particle = {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  hue: number;
  /** 1 → 0; the particle is culled once this reaches 0. */
  alpha: number;
};

/** Per-type tuning. Every enemy behaviour difference lives here, not in `update`. */
export type EnemyTypeConfig = {
  radius: number;
  /** Base speed in px/second at wave 1, before wave scaling. */
  speed: number;
  health: number;
  hue: number;
  /** Core health removed if this enemy reaches the core. */
  coreDamage: number;
  scorePerHit: number;
  scorePerKill: number;
  /** First wave this type can appear on. */
  unlockWave: number;
  /** Relative spawn weight once unlocked. */
  weight: number;
  /** Number of smaller enemies produced on death. */
  splitCount: number;
};

/** Everything that distinguishes one weapon from another. */
export type WeaponConfig = {
  label: string;
  blurb: string;
  /** Minimum seconds between shots, before fire-rate upgrades. */
  cooldown: number;
  damage: number;
  projectileSpeed: number;
  projectileRadius: number;
  /** Visual identity: projectile hue and glow size. */
  hue: number;
  glow: number;
};

/** One in-run upgrade track. */
export type UpgradeConfig = {
  label: string;
  blurb: string;
  maxLevel: number;
  /**
   * Per-level magnitude. Read by `derivedStats` / `applyUpgrade`; the meaning is
   * per-track (flat damage, cooldown fraction, speed fraction, health, multiplier).
   */
  value: number;
};

/** Per-power-up tuning. */
export type PowerUpConfig = {
  label: string;
  blurb: string;
  /** Relative drop weight. */
  weight: number;
  /** Seconds granted per pickup. */
  duration: number;
  /** Ceiling when re-collecting while already active. */
  maxDuration: number;
  hue: number;
};

/** Centralized drop + effect tuning. */
export type PowerUpTuning = {
  /** Probability a kill drops anything at all. */
  dropChance: number;
  /** Hard cap on simultaneous uncollected drops. */
  maxActiveDrops: number;
  dropLifetime: number;
  dropRadius: number;
  /** Enemy speed multiplier while slow-time is active. */
  slowFactor: number;
  /** Projectiles emitted per trigger pull while multi-shot is active. */
  multiShotCount: number;
  /** Total spread angle, in radians, across multi-shot pellets. */
  multiShotSpread: number;
  explosionRadius: number;
  explosionDamage: number;
  types: Record<PowerUpId, PowerUpConfig>;
};

/** Centralized difficulty curve. `wavePlan()` is the only reader of these. */
export type WaveScaling = {
  /** Enemies in wave 1. */
  baseBudget: number;
  budgetPerWave: number;
  /** Speed multiplier added per wave beyond the first. */
  speedMulPerWave: number;
  speedMulMax: number;
  /** Every N waves, all enemies gain +1 max health. */
  healthEveryWaves: number;
  healthBonusMax: number;
  spawnIntervalStart: number;
  spawnIntervalMin: number;
  /** Seconds removed from the spawn interval per wave. */
  spawnIntervalPerWave: number;
  /** Rest between a cleared wave and the next one. */
  breakDuration: number;
  /** How long an edge telegraph shows before the enemy appears. */
  warningDuration: number;
  /** Enemies never materialise closer than this to the core. */
  minSpawnDistance: number;
  /** Keep simultaneous telegraphs from stacking on one spot. */
  minWarningSeparation: number;
  /** Rejection-sampling budget for finding a fair spawn point. */
  spawnAttempts: number;
  /** An upgrade is offered after every Nth wave. */
  upgradeEveryWaves: number;
  /** How many options to put in front of the player. */
  upgradeChoices: number;
};

/** Combo → multiplier shaping. */
export type ComboScaling = {
  /** Kills per multiplier step. */
  killsPerStep: number;
  /** Multiplier added per step. */
  stepValue: number;
  maxMultiplier: number;
};

/** Tunable constants — all in CSS pixels and seconds. */
export type NeonCoreConfig = {
  coreRadius: number;
  coreMaxHealth: number;
  /** Seconds of damage flash after the core is hit. */
  coreFlashTime: number;
  /** Radius floor as a fraction of `baseRadius` when an enemy is nearly dead. */
  shrinkFloorRatio: number;
  /** How fast a damaged enemy eases down to its new radius (px/second). */
  shrinkSpeed: number;
  /** Radius/health/speed scale applied to splitter offspring. */
  splitRadiusRatio: number;
  /** Offspring speed multiplier — children scatter a little faster. */
  splitSpeedRatio: number;
  particlesPerHit: number;
  particlesPerKill: number;
  /** Hard ceiling on live particles — the default before any performance scaling. */
  maxParticles: number;
  /** Safety ceiling on in-flight projectiles; the oldest is dropped past this. */
  maxProjectiles: number;
  /** Safety ceiling on live enemies; splits and spawns stop adding past this. */
  maxEnemies: number;
  /** Per-second velocity retention for particles. */
  particleFriction: number;
  /** Alpha lost per second by a particle. */
  particleFade: number;
  /** Seconds of screen shake queued by a core hit. */
  shakeTime: number;
  shakeMagnitude: number;
  /** Floor on fire cooldown after upgrades, so fire rate can't reach zero. */
  minCooldown: number;
  enemies: Record<EnemyKind, EnemyTypeConfig>;
  weapons: Record<WeaponId, WeaponConfig>;
  upgrades: Record<UpgradeId, UpgradeConfig>;
  powerUps: PowerUpTuning;
  wave: WaveScaling;
  combo: ComboScaling;
};

/** Cumulative per-run statistics, surfaced in the HUD and the game-over card. */
export type RunStats = {
  shotsFired: number;
  shotsHit: number;
  enemiesDestroyed: number;
  highestCombo: number;
  waveReached: number;
  /** Seconds survived. */
  survivalTime: number;
  damageTaken: number;
  /** Waves cleared without the core taking a hit. */
  flawlessWaves: number;
  /** Shots fired per weapon — the basis of the "favourite weapon" stat. */
  shotsByWeapon: Record<WeaponId, number>;
  /** Power-ups collected this run, per kind. */
  powerUpsByKind: Record<PowerUpId, number>;
  powerUpsCollected: number;
};

/** Live upgrade levels for a run. */
export type UpgradeLevels = Record<UpgradeId, number>;

/** Remaining seconds per power-up. Zero means inactive. */
export type EffectTimers = Record<PowerUpId, number>;

/**
 * Sustained ("hold-to-fire") state.
 *
 * The player presses and holds; the first shot leaves immediately and the engine
 * keeps firing on a cadence that tightens the longer the button is down. Every
 * field here is advanced by `dt` inside `update`, exactly like every other timer in
 * the model, so pausing freezes the ramp and no DOM timer can outlive a run.
 */
export type HoldFireState = {
  /** True between a primary press and its release/cancel. */
  active: boolean;
  /** Milliseconds the button has been held — drives the fire-rate ramp. */
  heldMs: number;
  /** Milliseconds since the last sustained shot; the cadence accumulator. */
  sinceShotMs: number;
  /** Latest pointer position in arena space, so aim tracks the pointer live. */
  aimX: number;
  aimY: number;
};

/** Hold-to-fire cadence tuning. All intervals in milliseconds. */
export type HoldFireTuning = {
  /** Interval at the instant of the press, as a multiple of the weapon cooldown. */
  startMultiplier: number;
  /** Interval once the ramp completes, as a multiple of the weapon cooldown. */
  endMultiplier: number;
  /** How long the ramp from start to end takes. */
  rampDurationMs: number;
  /** Absolute floor on the interval, whatever the weapon and upgrades say. */
  minIntervalMs: number;
  /** Catch-up cap: sustained shots a single `update` may emit. */
  maxShotsPerUpdate: number;
};

/** Weapon numbers after upgrades are folded in. */
export type DerivedWeapon = {
  cooldown: number;
  damage: number;
  projectileSpeed: number;
  projectileRadius: number;
};

/** Mutable per-run model held in a ref and advanced each animation frame. */
export type NeonCoreModel = {
  core: Core;
  projectiles: Projectile[];
  enemies: Enemy[];
  warnings: SpawnWarning[];
  drops: Drop[];
  particles: Particle[];
  /** Recycled `Particle` objects, reused by `emitBurst` to avoid per-frame GC. */
  particlePool: Particle[];
  /** Live particle cap for this run; the component lowers it in performance mode. */
  particleCap: number;
  score: number;
  combo: number;
  /** Derived from `combo` + the score upgrade; cached so render and HUD agree. */
  multiplier: number;
  wave: number;
  waveState: WaveState;
  /** Enemies still to be queued for the current wave. */
  waveRemaining: number;
  /** Counts down to the next spawn within a wave. */
  spawnTimer: number;
  /** Counts down the rest between waves. */
  breakTimer: number;
  /** Counts down to the next allowed shot — the engine's rate limiter. */
  fireCooldown: number;
  /** Sustained-fire state; inert unless the player is holding the trigger. */
  hold: HoldFireState;
  weapon: WeaponId;
  upgrades: UpgradeLevels;
  effects: EffectTimers;
  /** Options presented while `waveState === "upgrade"`; empty otherwise. */
  pendingUpgrades: UpgradeId[];
  /** Render-only shake, decayed in `update` so pausing freezes it too. */
  shake: number;
  /** Core damage taken during the current wave; 0 at clear means a flawless wave. */
  damageThisWave: number;
  stats: RunStats;
  world: World;
  config: NeonCoreConfig;
  /** Seeded so the engine is deterministic and testable. */
  rng: () => number;
};

/**
 * Discrete events emitted by a single `update`, so React state and the HUD can
 * react to what happened without the loop touching state every frame.
 */
export type StepEvents = {
  /** A projectile connected (damage or kill). */
  hit: boolean;
  /** At least one enemy was destroyed this step. */
  killed: boolean;
  /** The core took damage this step. */
  coreDamaged: boolean;
  /** Core health hit zero — the run is over. */
  coreDestroyed: boolean;
  /** A wave was fully cleared this step. */
  waveCleared: boolean;
  /** A new wave started this step. */
  waveStarted: boolean;
  /** The engine parked for an upgrade choice this step. */
  upgradeReady: boolean;
  /** A power-up was picked up this step. */
  powerUpCollected: PowerUpId | null;
  /** Sustained-fire shots that actually left the core this step (0, 1, or 2). */
  shots: number;
  /** Score after this step. */
  score: number;
};

/** One power-up chip in the HUD. */
export type EffectSnapshot = {
  id: PowerUpId;
  /** Seconds left, quantised to 0.1s so the HUD doesn't rerender every frame. */
  remaining: number;
  /** 0–1 fill for the chip's progress bar. */
  ratio: number;
};

/**
 * The compact, comparable slice the React HUD renders. The loop rebuilds this
 * every frame but only pushes it into state when a field actually changes.
 */
export type HudSnapshot = {
  score: number;
  combo: number;
  multiplier: number;
  wave: number;
  waveState: WaveState;
  health: number;
  maxHealth: number;
  threats: number;
  /** Whole seconds left in the break, or 0 outside a break. */
  breakSeconds: number;
  weapon: WeaponId;
  effects: EffectSnapshot[];
  pendingUpgrades: UpgradeId[];
  /** Current upgrade levels, so the parked upgrade card renders without a ref. */
  upgradeLevels: UpgradeLevels;
};
