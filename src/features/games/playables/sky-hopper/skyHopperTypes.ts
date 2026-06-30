/**
 * Sky Hopper — shared types.
 *
 * The game is an original reskin of the classic "tap to fly through gaps" arcade
 * mechanic. All physics live in a fixed logical world (see WORLD in
 * `skyHopperEngine.ts`) and are advanced with real delta time so the speed is
 * identical on a 60 Hz or 144 Hz display.
 */

export type SkyHopperPhase = "ready" | "playing" | "paused" | "over";

export type Medal = "none" | "bronze" | "silver" | "gold" | "platinum";

export type Bird = {
  /** Fixed horizontal position in world units. */
  x: number;
  /** Vertical centre in world units. */
  y: number;
  /** Collision radius in world units. */
  radius: number;
  /** Vertical velocity in world units / second (positive = falling). */
  velocity: number;
  /** Render-only wing flap timer. */
  wing: number;
};

export type Pipe = {
  /** Left edge of the obstacle column in world units. */
  x: number;
  /** Top of the gap (everything above is solid) in world units. */
  gapTop: number;
  /** Height of the passable gap in world units. */
  gap: number;
  /** Set once the bird has cleared this pipe so a point is only counted once. */
  scored: boolean;
};

/** Tunable constants — all in world units and seconds. */
export type SkyHopperConfig = {
  gravity: number;
  flapVelocity: number;
  birdX: number;
  birdRadius: number;
  pipeWidth: number;
  /** Horizontal distance between successive pipes. */
  pipeSpacing: number;
  gapStart: number;
  gapMin: number;
  /** Gap reduction per point scored. */
  gapStep: number;
  speedStart: number;
  speedMax: number;
  /** Speed increase per point scored. */
  speedStep: number;
  groundHeight: number;
  /** Minimum margin between a pipe gap and the top/ground. */
  edgeMargin: number;
};

/** Mutable per-run model held in a ref and advanced each animation frame. */
export type SkyHopperModel = {
  bird: Bird;
  pipes: Pipe[];
  score: number;
  /** Distance scrolled — drives ground/cloud parallax. */
  distance: number;
  config: SkyHopperConfig;
  /** Deterministic-ish source for gap placement; seeded so tests are stable. */
  rng: () => number;
};

/** Discrete events emitted by a single `update` so the UI/audio react without per-frame React state. */
export type StepEvents = {
  scored: boolean;
  hit: boolean;
  /** New score value when `scored` is true (otherwise unchanged). */
  score: number;
};
