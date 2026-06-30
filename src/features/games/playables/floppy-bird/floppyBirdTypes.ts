/** Shared types for Floppy Bird. */

export type FloppyBirdPhase = "intro" | "ready" | "playing" | "paused" | "over";

export type Medal = "none" | "bronze" | "silver" | "gold" | "platinum";

export type BirdModel = {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: number;
  wingTimer: number;
};

export type PipePair = {
  x: number;
  gapY: number;
  gap: number;
  scored: boolean;
  color: "green" | "red";
};

export type FloppyBirdConfig = {
  gravity: number;
  flapVelocity: number;
  birdX: number;
  birdWidth: number;
  birdHeight: number;
  pipeWidth: number;
  pipeSpacing: number;
  gapStart: number;
  gapMin: number;
  gapStep: number;
  speedStart: number;
  speedMax: number;
  speedStep: number;
  groundHeight: number;
  edgeMargin: number;
};

export type FloppyBirdModel = {
  bird: BirdModel;
  pipes: PipePair[];
  score: number;
  distance: number;
  config: FloppyBirdConfig;
  rng: () => number;
  pipeColor: "green" | "red";
};

export type StepEvents = {
  scored: boolean;
  hit: boolean;
  score: number;
};
