"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CircleDot,
  Gamepad2,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui";
import type { GameDefinition } from "../../domain/game";

type Phase =
  | "menu"
  | "instructions"
  | "levelSelect"
  | "playing"
  | "paused"
  | "levelComplete"
  | "gameOver";
type Mode = "levels" | "endless";
type ObstacleKind = "ring" | "cross" | "bars";

type GameColor = {
  id: string;
  name: string;
  value: string;
};

type LevelConfig = {
  id: number;
  name: string;
  subtitle: string;
  colorCount: number;
  /** Base angular speed of rotating obstacles (rad/s). */
  rotationSpeed: number;
  /** World-units between obstacle centers — bigger = more reaction time. */
  obstacleSpacing: number;
  /** World-Y of the first obstacle, so it never spawns on top of the player. */
  firstObstacleDelay: number;
  /** Size multiplier for obstacles. */
  obstacleScale: number;
  /** Pixels of collision forgiveness — bigger = more lenient edges. */
  collisionTolerance: number;
  /** Per-level gravity; gentler early levels float more and are easier. */
  gravity: number;
  /** Per-level jump impulse, paired with gravity for a consistent arc. */
  jumpForce: number;
  /**
   * Visual radius of the player orb (px). Smaller on beginner levels so the orb
   * is clear but threads gates comfortably; grows slightly on harder tiers.
   */
  playerRadius: number;
  /** Clamp on upward speed so spamming taps can't launch the orb uncontrollably. */
  maxRise: number;
  /** Clamp on downward speed so falling stays controllable and readable. */
  maxFall: number;
  /** World-Y finish line. */
  distance: number;
  /** Whether alternating obstacles spin in reverse. */
  allowReverse: boolean;
  obstacleKinds: ObstacleKind[];
};

// NOTE: this game is "tap to rise" (gravity + jump), so there is no horizontal
// auto-scroll; difficulty is driven by rotationSpeed, colorCount, spacing and
// gravity rather than a scrollSpeed. The "safe window" is the angular size of a
// matching color segment, derived from colorCount.

type Obstacle = {
  id: number;
  kind: ObstacleKind;
  y: number;
  radius: number;
  size: number;
  angle: number;
  speed: number;
  direction: 1 | -1;
  colors: GameColor[];
  passed: boolean;
};

type Collectible = {
  id: string;
  kind: "star" | "switch";
  y: number;
  xOffset: number;
  collected: boolean;
  pulse: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
};

type Model = {
  playerY: number;
  velocity: number;
  cameraY: number;
  playerColor: GameColor;
  obstacles: Obstacle[];
  collectibles: Collectible[];
  score: number;
  stars: number;
  passed: number;
  streak: number;
  bestStreak: number;
  elapsed: number;
  highScore: number;
  levelComplete: boolean;
  gameOver: boolean;
  /** True once the player has tapped to begin — gates the "Tap to start" hold. */
  started: boolean;
  /** Timestamp (performance.now ms) until which the shake reaction is active. */
  shakeUntil: number;
};

const WORLD = { width: 420, height: 680, playerX: 210, playerScreenY: 510 };

// Centralized feel constants.
const SHAKE_MS = 320; // collision shake is a brief, time-based reaction only
const SHAKE_MAG = 8; // peak shake offset in px at full intensity
const START_GRACE = 0.7; // seconds after the first tap where obstacles can't kill
// Collision uses a radius SMALLER than the visual orb so tiny edge grazes that
// look safe never cause an unfair death (visual 10 -> collision ~7).
const COLLISION_FORGIVENESS = 3;

const COLORS: GameColor[] = [
  { id: "red", name: "Red", value: "#ef4444" },
  { id: "blue", name: "Blue", value: "#38bdf8" },
  { id: "yellow", name: "Yellow", value: "#facc15" },
  { id: "green", name: "Green", value: "#22c55e" },
  { id: "purple", name: "Purple", value: "#a855f7" },
  { id: "orange", name: "Orange", value: "#fb923c" },
];

// Difficulty climbs gradually: rotation speed creeps up, spacing tightens
// slightly, color count rises in steps, and collision tolerance shrinks as the
// player improves. Every level keeps a clear, fair, passable path.
// Physics tiers (gravity / jumpForce / velocity clamps) are intentionally gentle:
// the orb rises in a controlled arc, repeated taps stay clamped, and falling is
// readable. Radius, rotation and spacing climb slowly so beginners learn the
// mechanic before any real pressure. Advanced stays hard but never impossible.
const LEVELS: LevelConfig[] = [
  // Beginner tier (1-3): tiny orb, floaty gravity, slow spin, wide windows.
  {
    id: 1,
    name: "First Gate",
    subtitle: "One slow ring, three colors. Onboarding.",
    colorCount: 3,
    rotationSpeed: 0.42,
    obstacleSpacing: 330,
    firstObstacleDelay: 500,
    obstacleScale: 1.0,
    collisionTolerance: 9,
    gravity: 720,
    jumpForce: 290,
    playerRadius: 9,
    maxRise: 300,
    maxFall: 340,
    distance: 1500,
    allowReverse: false,
    obstacleKinds: ["ring"],
  },
  {
    id: 2,
    name: "Color Orbit",
    subtitle: "Three colors, a star to grab.",
    colorCount: 3,
    rotationSpeed: 0.48,
    obstacleSpacing: 320,
    firstObstacleDelay: 480,
    obstacleScale: 1.0,
    collisionTolerance: 9,
    gravity: 740,
    jumpForce: 295,
    playerRadius: 10,
    maxRise: 305,
    maxFall: 350,
    distance: 1700,
    allowReverse: false,
    obstacleKinds: ["ring"],
  },
  {
    id: 3,
    name: "Double Focus",
    subtitle: "Four colors, a simple cross joins.",
    colorCount: 4,
    rotationSpeed: 0.56,
    obstacleSpacing: 310,
    firstObstacleDelay: 470,
    obstacleScale: 1.0,
    collisionTolerance: 8,
    gravity: 770,
    jumpForce: 300,
    playerRadius: 10,
    maxRise: 310,
    maxFall: 360,
    distance: 1850,
    allowReverse: false,
    obstacleKinds: ["ring", "cross"],
  },
  // Intermediate tier (4-6): slightly bigger orb, medium gravity, reverse spin.
  {
    id: 4,
    name: "Reverse Spin",
    subtitle: "Four colors, rings now spin both ways.",
    colorCount: 4,
    rotationSpeed: 0.66,
    obstacleSpacing: 300,
    firstObstacleDelay: 460,
    obstacleScale: 1.0,
    collisionTolerance: 8,
    gravity: 800,
    jumpForce: 310,
    playerRadius: 11,
    maxRise: 320,
    maxFall: 380,
    distance: 2050,
    allowReverse: true,
    obstacleKinds: ["ring", "cross"],
  },
  {
    id: 5,
    name: "Moving Lanes",
    subtitle: "Sliding color bars with a clear gap.",
    colorCount: 4,
    rotationSpeed: 0.74,
    obstacleSpacing: 305,
    firstObstacleDelay: 460,
    obstacleScale: 1.0,
    collisionTolerance: 7,
    gravity: 820,
    jumpForce: 315,
    playerRadius: 11,
    maxRise: 325,
    maxFall: 390,
    distance: 2200,
    allowReverse: true,
    obstacleKinds: ["ring", "bars"],
  },
  {
    id: 6,
    name: "Pinwheel",
    subtitle: "Five colors, ring and cross mix.",
    colorCount: 5,
    rotationSpeed: 0.82,
    obstacleSpacing: 295,
    firstObstacleDelay: 450,
    obstacleScale: 0.98,
    collisionTolerance: 7,
    gravity: 840,
    jumpForce: 320,
    playerRadius: 11,
    maxRise: 330,
    maxFall: 400,
    distance: 2350,
    allowReverse: true,
    obstacleKinds: ["cross", "ring"],
  },
  // Advanced tier (7-10): hard but fair — no pixel-perfect timing required.
  {
    id: 7,
    name: "Mixed Gates",
    subtitle: "Five colors, all gate types.",
    colorCount: 5,
    rotationSpeed: 0.92,
    obstacleSpacing: 290,
    firstObstacleDelay: 450,
    obstacleScale: 0.96,
    collisionTolerance: 7,
    gravity: 860,
    jumpForce: 328,
    playerRadius: 12,
    maxRise: 338,
    maxFall: 420,
    distance: 2500,
    allowReverse: true,
    obstacleKinds: ["ring", "bars", "cross"],
  },
  {
    id: 8,
    name: "Tighter Timing",
    subtitle: "Five colors, faster spin.",
    colorCount: 5,
    rotationSpeed: 1.0,
    obstacleSpacing: 285,
    firstObstacleDelay: 440,
    obstacleScale: 0.95,
    collisionTolerance: 6,
    gravity: 880,
    jumpForce: 332,
    playerRadius: 12,
    maxRise: 342,
    maxFall: 430,
    distance: 2650,
    allowReverse: true,
    obstacleKinds: ["ring", "cross", "bars"],
  },
  {
    id: 9,
    name: "Switch Storm",
    subtitle: "Six colors, frequent switches.",
    colorCount: 6,
    rotationSpeed: 1.1,
    obstacleSpacing: 280,
    firstObstacleDelay: 440,
    obstacleScale: 0.95,
    collisionTolerance: 6,
    gravity: 900,
    jumpForce: 336,
    playerRadius: 12,
    maxRise: 346,
    maxFall: 440,
    distance: 2800,
    allowReverse: true,
    obstacleKinds: ["ring", "bars", "cross"],
  },
  {
    id: 10,
    name: "Final Spectrum",
    subtitle: "Six colors, full challenge.",
    colorCount: 6,
    rotationSpeed: 1.2,
    obstacleSpacing: 275,
    firstObstacleDelay: 440,
    obstacleScale: 0.95,
    collisionTolerance: 6,
    gravity: 920,
    jumpForce: 340,
    playerRadius: 12,
    maxRise: 350,
    maxFall: 450,
    distance: 3000,
    allowReverse: true,
    obstacleKinds: ["ring", "cross", "bars"],
  },
];

function playerCollisionRadius(level: LevelConfig) {
  // Effective collision radius is a few px smaller than the visual orb so the
  // game feels fair — visible-but-safe grazes don't kill.
  return Math.max(6, level.playerRadius - COLLISION_FORGIVENESS);
}

// Tuning shared by collision + drawing so the two never disagree.
const RING_STROKE = 26; // visual + collision band thickness of a ring arc
const CROSS_INNER = 34; // hub radius — arms start here, leaving a safe centre to thread
const BAR_THICKNESS = 30; // vertical thickness of a sliding bar lane
const BAR_CELL_W = 52; // width of one color cell in a sliding bar
const BAR_SCROLL_PX = 46; // pixels the bar lane scrolls per radian of angle
const BOUNDARY_GRACE = 0.18; // fraction of a segment near edges treated as forgiving
const DEBUG_LEVELS = false; // when true, log level configs + validation warnings

function ringRadius(level: LevelConfig) {
  return 70 * level.obstacleScale;
}

function crossRadius(level: LevelConfig) {
  return 74 * level.obstacleScale;
}

// Ring palette is the level palette repeated twice, so diametrically opposite
// arcs share a color. The orb crosses a ring at both its bottom and top edge;
// mirroring guarantees a single color clears the whole pass (fair, not luck).
function ringSegmentColors(colors: GameColor[]): GameColor[] {
  return [...colors, ...colors];
}

// A cross has 4 arms; opposite arms mirror (A,B,A,B) so the orb's two crossings
// always require the same color.
function crossArmColors(colors: GameColor[]): GameColor[] {
  const a = colors[0];
  const b = colors[1 % colors.length];
  return [a, b, a, b];
}

// A sliding bar is a repeating strip of color cells plus one transparent GAP
// cell, guaranteeing an always-safe lane somewhere in the cycle.
function barCellColors(colors: GameColor[]): (GameColor | null)[] {
  return [...colors, null];
}

// Scroll offset of the bar lane in pixels (angle already encodes direction).
function barOffset(obstacle: Obstacle): number {
  const period = barCellColors(obstacle.colors).length * BAR_CELL_W;
  return (((obstacle.angle * BAR_SCROLL_PX) % period) + period) % period;
}

// Resolve which bar cell currently sits over the orb's fixed center X.
function barCellAtCenter(obstacle: Obstacle): {
  cell: GameColor | null;
  index: number;
  frac: number;
} {
  const cells = barCellColors(obstacle.colors);
  const offset = barOffset(obstacle);
  const index = Math.floor(offset / BAR_CELL_W) % cells.length;
  const frac =
    (offset - Math.floor(offset / BAR_CELL_W) * BAR_CELL_W) / BAR_CELL_W;
  return { cell: cells[index], index, frac };
}

/**
 * Static fairness check for a level config. It does not simulate the full run,
 * but it rejects obviously unfair / impossible setups. Returns a list of
 * human-readable warnings (empty = looks playable).
 */
function validateLevelConfig(level: LevelConfig): string[] {
  const warnings: string[] = [];
  const colors = activeColors(level.colorCount);
  const maxRadius = Math.max(ringRadius(level), crossRadius(level));

  if (level.colorCount < 3 || level.colorCount > COLORS.length) {
    warnings.push(
      `colorCount ${level.colorCount} out of supported range 3..${COLORS.length}`,
    );
  }
  // First obstacle must give the player room to react after the start.
  if (level.firstObstacleDelay < 340) {
    warnings.push(
      `firstObstacleDelay ${level.firstObstacleDelay} too small (<340); first gate spawns too close`,
    );
  }
  // Enough vertical gap that two obstacles' collision bands never overlap.
  if (level.obstacleSpacing < maxRadius * 2 + 70) {
    warnings.push(
      `obstacleSpacing ${level.obstacleSpacing} too small for radius ${maxRadius.toFixed(0)}; gates may overlap`,
    );
  }
  // Obstacle must fit inside the playfield with margin.
  if (maxRadius * 2 > WORLD.width - 40) {
    warnings.push(
      `obstacle diameter ${(maxRadius * 2).toFixed(0)} too large for width ${WORLD.width}`,
    );
  }
  // A bar lane must keep a transparent gap so a safe path always exists.
  if (
    level.obstacleKinds.includes("bars") &&
    barCellColors(colors).every((cell) => cell !== null)
  ) {
    warnings.push("bars have no gap cell; lane could fully block the path");
  }
  // Reaction window for the fastest spin must stay humane.
  const segmentAngle = (Math.PI * 2) / (level.colorCount * 2); // mirrored ring segment
  const windowSeconds = segmentAngle / level.rotationSpeed;
  if (windowSeconds < 0.18) {
    warnings.push(
      `color window ${windowSeconds.toFixed(2)}s too tight; raise spacing/colors or lower rotationSpeed`,
    );
  }
  // Level must be long enough to host a few gates but not endless.
  if (level.distance < level.firstObstacleDelay + level.obstacleSpacing * 2) {
    warnings.push("distance too short to host at least 3 gates");
  }
  return warnings;
}

if (DEBUG_LEVELS && typeof window !== "undefined") {
  LEVELS.forEach((level) => {
    const warnings = validateLevelConfig(level);
    if (warnings.length) {
      console.warn(
        `[ColorOrbit] Level ${level.id} "${level.name}" warnings:`,
        warnings,
      );
    } else {
      console.info(`[ColorOrbit] Level ${level.id} "${level.name}" OK`, level);
    }
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function activeColors(count: number) {
  return COLORS.slice(0, clamp(count, 3, COLORS.length));
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function multiplierForStreak(streak: number) {
  if (streak >= 10) return 4;
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}

function readHighScore() {
  if (typeof window === "undefined") return 0;
  return (
    Number(window.localStorage.getItem("dharma-color-orbit-best") ?? 0) || 0
  );
}

function writeHighScore(score: number) {
  if (typeof window === "undefined") return score;
  const next = Math.max(readHighScore(), score);
  window.localStorage.setItem("dharma-color-orbit-best", String(next));
  return next;
}

function readMuted() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("dharma-color-orbit-muted") === "1";
}

function writeMuted(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("dharma-color-orbit-muted", value ? "1" : "0");
}

function createAudio() {
  let ctx: AudioContext | null = null;
  const ensure = () => {
    if (typeof window === "undefined") return null;
    const AudioCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) return null;
    if (!ctx) ctx = new AudioCtor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  };
  const tone = (
    frequency: number,
    duration: number,
    type: OscillatorType,
    gainValue = 0.04,
    delay = 0,
  ) => {
    const audio = ensure();
    if (!audio) return;
    const now = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  };
  return {
    unlock() {
      ensure();
    },
    play(
      event:
        | "start"
        | "jump"
        | "pass"
        | "star"
        | "switch"
        | "fail"
        | "lose"
        | "win"
        | "click",
    ) {
      if (event === "click") tone(260, 0.045, "triangle", 0.025);
      if (event === "start")
        [329.63, 392, 523.25].forEach((f, index) =>
          tone(f, 0.08, "sine", 0.04, index * 0.06),
        );
      // jump: short soft pop
      if (event === "jump") tone(380, 0.07, "triangle", 0.035);
      // correct pass: positive soft tone
      if (event === "pass")
        [523.25, 659.25].forEach((f, index) =>
          tone(f, 0.07, "sine", 0.035, index * 0.045),
        );
      // star: light sparkle
      if (event === "star")
        [784, 987.77].forEach((f, index) =>
          tone(f, 0.08, "sine", 0.035, index * 0.045),
        );
      // color switch: soft magical switch
      if (event === "switch")
        [300, 600, 450].forEach((f, index) =>
          tone(f, 0.065, "triangle", 0.035, index * 0.04),
        );
      // wrong collision: short, low, soft fail — sine not sawtooth, so it is not painful
      if (event === "fail")
        [220, 165].forEach((f, index) =>
          tone(f, 0.16, "sine", 0.04, index * 0.07),
        );
      // game over: subtle descending fail tone
      if (event === "lose")
        [240, 180, 130].forEach((f, index) =>
          tone(f, 0.18, "triangle", 0.035, index * 0.1),
        );
      // win: pleasant short celebration
      if (event === "win")
        [523.25, 659.25, 783.99, 1046.5].forEach((f, index) =>
          tone(f, 0.12, "sine", 0.04, index * 0.075),
        );
    },
    startBackground() {
      // Background music intentionally disabled after QA: the previous ambient loop was distracting.
    },
    stopBackground() {
      // Sound effects stay available through the mute button; there is no continuous background sound.
    },
  };
}

function obstacleRadius(level: LevelConfig, kind: ObstacleKind) {
  if (kind === "ring") return ringRadius(level);
  if (kind === "cross") return crossRadius(level);
  return BAR_THICKNESS / 2; // bars only block a thin horizontal band
}

function buildObstacles(
  level: LevelConfig,
  mode: Mode,
): { obstacles: Obstacle[]; collectibles: Collectible[] } {
  const colors = activeColors(level.colorCount);
  // Defensive: never let spacing/first-delay drop below a fair minimum even if a
  // future config edit is too aggressive.
  const spacing = Math.max(level.obstacleSpacing, 220);
  const first = Math.max(level.firstObstacleDelay, 360);
  const count =
    mode === "endless"
      ? 20
      : Math.max(3, Math.ceil((level.distance - first) / spacing));
  const obstacles: Obstacle[] = [];
  const collectibles: Collectible[] = [];

  for (let i = 0; i < count; i += 1) {
    const y = first + i * spacing;
    const kind = level.obstacleKinds[i % level.obstacleKinds.length];
    obstacles.push({
      id: i + 1,
      kind,
      y,
      radius: obstacleRadius(level, kind),
      size: 2 * BAR_CELL_W, // visible half-width of a sliding bar lane
      angle: (i * Math.PI) / 5,
      speed: level.rotationSpeed * (0.9 + (i % 3) * 0.06),
      direction: level.allowReverse && i % 2 === 1 ? -1 : 1,
      colors,
      passed: false,
    });

    // Collectibles sit ON the orb's center line (the orb is locked to center X)
    // and in the safe gap before/after a gate, never inside a collision band.
    // A color switch sits just BEFORE each gate so the player can prepare.
    collectibles.push({
      id: `switch-${i}`,
      kind: "switch",
      y: y - spacing * 0.42,
      xOffset: 0,
      collected: false,
      pulse: Math.random() * Math.PI * 2,
    });
    if (i % 2 === 0) {
      collectibles.push({
        id: `star-${i}`,
        kind: "star",
        y: y + spacing * 0.42,
        xOffset: 0,
        collected: false,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }
  return { obstacles, collectibles };
}

function createModel(level: LevelConfig, mode: Mode): Model {
  const colors = activeColors(level.colorCount);
  const built = buildObstacles(level, mode);
  return {
    playerY: 0,
    velocity: 0,
    cameraY: 0,
    playerColor: colors[0],
    obstacles: built.obstacles,
    collectibles: built.collectibles,
    score: 0,
    stars: 0,
    passed: 0,
    streak: 0,
    bestStreak: 0,
    elapsed: 0,
    highScore: readHighScore(),
    levelComplete: false,
    gameOver: false,
    started: false,
    shakeUntil: 0,
  };
}

function TinyButton({
  children,
  onClick,
  className = "",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function ColorSwitchGame({ game }: { game: GameDefinition }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("menu");
  const [mode, setMode] = useState<Mode>("levels");
  const [levelIndex, setLevelIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [snapshot, setSnapshot] = useState(() =>
    createModel(LEVELS[0], "levels"),
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<Model>(createModel(LEVELS[0], "levels"));
  const phaseRef = useRef<Phase>("menu");
  const modeRef = useRef<Mode>("levels");
  const levelRef = useRef(LEVELS[0]);
  const mutedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const audioRef = useRef<ReturnType<typeof createAudio> | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const playSound = useCallback(
    (
      event:
        | "start"
        | "jump"
        | "pass"
        | "star"
        | "switch"
        | "fail"
        | "lose"
        | "win"
        | "click",
    ) => {
      if (!mutedRef.current) audioRef.current?.play(event);
    },
    [],
  );

  const level = LEVELS[levelIndex];
  const progress =
    mode === "levels"
      ? clamp(Math.round((snapshot.playerY / level.distance) * 100), 0, 100)
      : Math.min(999, snapshot.passed);
  const multiplier = multiplierForStreak(snapshot.streak);
  const isRecord = snapshot.score > 0 && snapshot.score >= snapshot.highScore;

  useEffect(() => {
    audioRef.current = createAudio();
    setMuted(readMuted());
    setSnapshot((current) => ({ ...current, highScore: readHighScore() }));
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      audioRef.current?.stopBackground();
    };
  }, []);

  useEffect(() => {
    mutedRef.current = muted;
    writeMuted(muted);
    if (muted) audioRef.current?.stopBackground();
    else if (phase === "playing") audioRef.current?.startBackground();
  }, [muted, phase]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const emit = useCallback(
    (
      x: number,
      y: number,
      kind: "success" | "fail" | "switch" | "star" | "win",
      color?: string,
    ) => {
      const palette =
        kind === "fail"
          ? ["#fb7185", "#fecdd3", "#f43f5e"]
          : kind === "star"
            ? ["#facc15", "#fde68a", "#fff7ed"]
            : kind === "switch"
              ? COLORS.map((item) => item.value)
              : [color ?? "#38bdf8", "#22c55e", "#facc15", "#a855f7"];
      const amount = kind === "win" ? 90 : kind === "fail" ? 52 : 24;
      for (let i = 0; i < amount; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed =
          kind === "win" ? 2 + Math.random() * 5 : 1.5 + Math.random() * 3;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 36 + Math.random() * 38,
          size: 2.5 + Math.random() * 5,
          color: palette[i % palette.length],
        });
      }
    },
    [],
  );

  const gameEffect = useCallback(
    (
      x: number,
      y: number,
      kind: "success" | "fail" | "switch" | "star" | "win",
      color?: string,
    ) => {
      emit(x, y, kind, color);
      if (kind === "success") playSound("pass");
      if (kind === "star") playSound("star");
      if (kind === "switch") playSound("switch");
      if (kind === "fail") playSound("fail");
    },
    [emit, playSound],
  );

  const resetRun = useCallback(
    (nextMode: Mode, nextLevelIndex = levelIndex) => {
      const nextLevel =
        LEVELS[
          nextMode === "endless" ? Math.min(5, nextLevelIndex) : nextLevelIndex
        ];
      const next = createModel(nextLevel, nextMode);
      modelRef.current = next;
      modeRef.current = nextMode;
      levelRef.current = nextLevel;
      setMode(nextMode);
      setLevelIndex(
        nextMode === "endless" ? Math.min(5, nextLevelIndex) : nextLevelIndex,
      );
      setSnapshot({ ...next });
    },
    [levelIndex],
  );

  const startGame = useCallback(
    (nextMode: Mode, nextLevelIndex = levelIndex) => {
      audioRef.current?.unlock();
      playSound("start");
      resetRun(nextMode, nextLevelIndex);
      setPhase("playing");
      phaseRef.current = "playing";
      lastRef.current = null;
      if (!mutedRef.current) audioRef.current?.startBackground();
    },
    [levelIndex, resetRun],
  );

  const jump = useCallback(() => {
    if (
      phaseRef.current === "menu" ||
      phaseRef.current === "instructions" ||
      phaseRef.current === "levelSelect"
    )
      return;
    if (phaseRef.current === "levelComplete" || phaseRef.current === "gameOver")
      return;
    if (phaseRef.current === "paused") {
      setPhase("playing");
      phaseRef.current = "playing";
      if (!mutedRef.current) audioRef.current?.startBackground();
      return;
    }
    const model = modelRef.current;
    // First tap simply begins the run (the orb hovers until then), so the player
    // is never dropped into danger before they're ready.
    model.started = true;
    // Tap SETS upward velocity (it never accumulates), and we clamp to maxRise so
    // spamming taps can't launch the orb uncontrollably.
    model.velocity = Math.min(
      levelRef.current.jumpForce,
      levelRef.current.maxRise,
    );
    playSound("jump");
    const playerScreen = worldToScreen(model.playerY, model.cameraY);
    emit(WORLD.playerX, playerScreen, "switch", model.playerColor.value);
  }, [emit]);

  const endRun = useCallback(
    (win: boolean) => {
      const model = modelRef.current;
      if (model.gameOver || model.levelComplete) return;
      model.gameOver = !win;
      model.levelComplete = win;
      model.highScore = writeHighScore(model.score);
      setSnapshot({ ...model });
      setPhase(win ? "levelComplete" : "gameOver");
      phaseRef.current = win ? "levelComplete" : "gameOver";
      audioRef.current?.stopBackground();
      playSound(win ? "win" : "lose");
      emit(WORLD.width / 2, WORLD.height * 0.35, win ? "win" : "fail");
    },
    [emit],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ([" ", "ArrowUp", "w", "W"].includes(event.key)) {
        event.preventDefault();
        jump();
      }
      if (event.key.toLowerCase() === "p" || event.key === "Escape") {
        if (phaseRef.current === "playing") {
          setPhase("paused");
          phaseRef.current = "paused";
          audioRef.current?.stopBackground();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  useEffect(() => {
    const step = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        rafRef.current = window.requestAnimationFrame(step);
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      if (
        canvas.width !== Math.floor(rect.width * dpr) ||
        canvas.height !== Math.floor(rect.height * dpr)
      ) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const scale = Math.min(
        rect.width / WORLD.width,
        rect.height / WORLD.height,
      );
      const offsetX = (rect.width - WORLD.width * scale) / 2;
      const offsetY = (rect.height - WORLD.height * scale) / 2;
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      const dt =
        lastRef.current === null
          ? 0
          : Math.min(0.035, (time - lastRef.current) / 1000);
      lastRef.current = time;
      const model = modelRef.current;
      if (phaseRef.current === "playing")
        updateModel(
          model,
          levelRef.current,
          modeRef.current,
          dt,
          endRun,
          gameEffect,
        );
      drawGame(
        ctx,
        model,
        levelRef.current,
        modeRef.current,
        particlesRef.current,
        phaseRef.current,
      );
      ctx.restore();

      particlesRef.current = particlesRef.current.filter(
        (p) => p.life < p.maxLife,
      );
      for (const p of particlesRef.current) {
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.035;
      }

      if (phaseRef.current === "playing") {
        setSnapshot({ ...model });
      }
      rafRef.current = window.requestAnimationFrame(step);
    };
    rafRef.current = window.requestAnimationFrame(step);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [endRun, gameEffect]);

  const currentColors = useMemo(
    () => activeColors(level.colorCount),
    [level.colorCount],
  );

  return (
    <section
      ref={shellRef}
      className={`relative isolate overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-slate-950 shadow-2xl ${focusMode ? "fixed inset-3 z-50" : ""}`}
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(236,72,153,0.24),transparent_32%),radial-gradient(circle_at_78%_20%,rgba(56,189,248,0.24),transparent_32%),linear-gradient(135deg,#020617,#111827_44%,#1e1b4b)]"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-[720px] flex-col text-white lg:min-h-[760px]">
        {phase === "menu" ||
        phase === "instructions" ||
        phase === "levelSelect" ? (
          <div className="grid flex-1 gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:p-8">
            <div className="flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="soft">Original Dharma build</Badge>
                <Badge variant="outline">Canvas arcade</Badge>
                <Badge variant="accent">10 levels</Badge>
              </div>
              <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.06em] sm:text-6xl">
                Color Orbit Switch
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
                Tap through matching color gates, collect stars, switch colors,
                and survive the orbit. Built from scratch for Dharma, with
                sounds, levels, win, lose, and score flow.
              </p>

              {phase === "menu" ? (
                <div className="mt-7 flex flex-wrap gap-3">
                  <TinyButton
                    onClick={() => startGame("levels", levelIndex)}
                    className="bg-white text-slate-950 hover:bg-white/90"
                  >
                    <Play className="h-4 w-4" aria-hidden /> Start level
                  </TinyButton>
                  <TinyButton onClick={() => setPhase("levelSelect")}>
                    <CircleDot className="h-4 w-4" aria-hidden /> Select level
                  </TinyButton>
                  <TinyButton onClick={() => startGame("endless", 5)}>
                    <Zap className="h-4 w-4" aria-hidden /> Endless
                  </TinyButton>
                  <TinyButton onClick={() => setPhase("instructions")}>
                    <Gamepad2 className="h-4 w-4" aria-hidden /> How to play
                  </TinyButton>
                  <TinyButton onClick={() => setMuted((value) => !value)}>
                    {muted ? (
                      <VolumeX className="h-4 w-4" aria-hidden />
                    ) : (
                      <Volume2 className="h-4 w-4" aria-hidden />
                    )}
                  </TinyButton>
                </div>
              ) : null}

              {phase === "instructions" ? (
                <div className="mt-6 max-w-3xl rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur-md">
                  <h3 className="text-2xl font-black">
                    Instructions and scoring
                  </h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InfoTile
                      title="Controls"
                      body="Tap, click, Space, Arrow Up, or W to jump. P or Esc pauses."
                    />
                    <InfoTile
                      title="Rule"
                      body="Your orb can pass only through obstacle segments that match its current color."
                    />
                    <InfoTile
                      title="Switch item"
                      body="The glowing color switch changes your orb color. Watch the new color before the next gate."
                    />
                    <InfoTile
                      title="Scoring"
                      body="Pass +100, star +50, streak multiplier x2/x3/x4, level complete +500."
                    />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <TinyButton onClick={() => setPhase("menu")}>
                      <ArrowLeft className="h-4 w-4" aria-hidden /> Back
                    </TinyButton>
                    <TinyButton
                      onClick={() => startGame("levels", levelIndex)}
                      className="bg-white text-slate-950 hover:bg-white/90"
                    >
                      <Play className="h-4 w-4" aria-hidden /> Play
                    </TinyButton>
                  </div>
                </div>
              ) : null}

              {phase === "levelSelect" ? (
                <div className="mt-6 max-w-5xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-2xl font-black">Select a level</h3>
                    <TinyButton onClick={() => setPhase("menu")}>
                      <ArrowLeft className="h-4 w-4" aria-hidden /> Back
                    </TinyButton>
                  </div>
                  <div className="mt-4 grid max-h-[380px] gap-3 overflow-y-auto pr-2 sm:grid-cols-2 xl:grid-cols-3">
                    {LEVELS.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => startGame("levels", index)}
                        className={`rounded-[1.4rem] border p-4 text-left shadow-lg transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${index === levelIndex ? "border-fuchsia-200 bg-fuchsia-300/20" : "border-white/10 bg-white/10 hover:bg-white/15"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black">
                              {item.id}. {item.name}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-white/60">
                              {item.subtitle}
                            </p>
                          </div>
                          <span className="rounded-full bg-white/15 px-2 py-1 text-xs font-black">
                            {item.colorCount} colors
                          </span>
                        </div>
                        <div className="mt-3 flex gap-1.5">
                          {activeColors(item.colorCount).map((color) => (
                            <span
                              key={color.id}
                              className="h-4 w-4 rounded-full border border-white/30"
                              style={{ background: color.value }}
                            />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-center">
              <div className="relative h-[520px] w-full max-w-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-2xl">
                <canvas
                  className="h-full w-full"
                  ref={
                    phase === "menu" ||
                    phase === "instructions" ||
                    phase === "levelSelect"
                      ? canvasRef
                      : undefined
                  }
                />
                <div className="absolute inset-x-4 bottom-4 rounded-[1.4rem] border border-white/10 bg-white/10 p-3 backdrop-blur-md">
                  <p className="text-sm font-black">
                    Current level: {level.id}. {level.name}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    {currentColors.map((color) => (
                      <span
                        key={color.id}
                        className="h-5 flex-1 rounded-full"
                        style={{ background: color.value }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {phase === "playing" ||
        phase === "paused" ||
        phase === "levelComplete" ||
        phase === "gameOver" ? (
          <div className="flex flex-1 flex-col p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[1.35rem] border border-white/10 bg-white/10 p-3 shadow-xl backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="soft">
                  {mode === "levels" ? `Level ${level.id}` : "Endless"}
                </Badge>
                <span className="rounded-full bg-black/20 px-3 py-1.5 text-xs font-black text-white/80">
                  Score {snapshot.score}
                </span>
                <span className="rounded-full bg-black/20 px-3 py-1.5 text-xs font-black text-white/80">
                  Streak {snapshot.streak} · x{multiplier}
                </span>
                <span className="rounded-full bg-black/20 px-3 py-1.5 text-xs font-black text-white/80">
                  Stars {snapshot.stars}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <TinyButton
                  className="min-h-10 px-3"
                  onClick={() => setMuted((value) => !value)}
                >
                  {muted ? (
                    <VolumeX className="h-4 w-4" aria-hidden />
                  ) : (
                    <Volume2 className="h-4 w-4" aria-hidden />
                  )}
                </TinyButton>
                <TinyButton
                  className="min-h-10 px-3"
                  onClick={() => setFocusMode((value) => !value)}
                >
                  <Maximize2 className="h-4 w-4" aria-hidden />
                </TinyButton>
                <TinyButton
                  className="min-h-10 px-3"
                  onClick={() => {
                    if (phase === "playing") {
                      setPhase("paused");
                      phaseRef.current = "paused";
                      audioRef.current?.stopBackground();
                    } else if (phase === "paused") {
                      setPhase("playing");
                      phaseRef.current = "playing";
                      if (!mutedRef.current)
                        audioRef.current?.startBackground();
                    }
                  }}
                  disabled={phase === "levelComplete" || phase === "gameOver"}
                >
                  {phase === "paused" ? (
                    <Play className="h-4 w-4" aria-hidden />
                  ) : (
                    <Pause className="h-4 w-4" aria-hidden />
                  )}
                </TinyButton>
              </div>
            </div>

            <div className="mb-3 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-yellow-200 transition-[width]"
                style={{
                  width:
                    mode === "levels"
                      ? `${progress}%`
                      : `${Math.min(100, snapshot.passed * 4)}%`,
                }}
              />
            </div>

            <div
              className="relative min-h-[560px] flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-2xl"
              onPointerDown={jump}
              role="button"
              tabIndex={0}
              aria-label="Tap to jump"
            >
              <canvas
                ref={
                  phase === "playing" ||
                  phase === "paused" ||
                  phase === "levelComplete" ||
                  phase === "gameOver"
                    ? canvasRef
                    : undefined
                }
                className="h-full min-h-[560px] w-full touch-none"
              />

              {phase === "paused" ? (
                <Overlay
                  title="Paused"
                  body="Resume when ready. The background sound is stopped while paused."
                  icon={<Pause className="h-10 w-10" aria-hidden />}
                >
                  <TinyButton
                    onClick={() => {
                      setPhase("playing");
                      phaseRef.current = "playing";
                      if (!mutedRef.current)
                        audioRef.current?.startBackground();
                    }}
                    className="bg-white text-slate-950 hover:bg-white/90"
                  >
                    <Play className="h-4 w-4" aria-hidden /> Resume
                  </TinyButton>
                  <TinyButton
                    onClick={() => {
                      audioRef.current?.stopBackground();
                      setPhase("menu");
                      phaseRef.current = "menu";
                    }}
                  >
                    Menu
                  </TinyButton>
                </Overlay>
              ) : null}

              {phase === "levelComplete" ? (
                <Overlay
                  title={mode === "levels" ? "Level Complete" : "New High Run"}
                  body="Clean pass. Your score, stars, streak, and time are saved locally only."
                  icon={
                    <Trophy className="h-10 w-10 text-yellow-200" aria-hidden />
                  }
                >
                  <TinyButton onClick={() => startGame(mode, levelIndex)}>
                    <RotateCcw className="h-4 w-4" aria-hidden /> Replay
                  </TinyButton>
                  {mode === "levels" && levelIndex < LEVELS.length - 1 ? (
                    <TinyButton
                      onClick={() => startGame("levels", levelIndex + 1)}
                      className="bg-white text-slate-950 hover:bg-white/90"
                    >
                      Next level
                    </TinyButton>
                  ) : null}
                  <TinyButton
                    onClick={() => {
                      setPhase("menu");
                      phaseRef.current = "menu";
                    }}
                  >
                    Menu
                  </TinyButton>
                </Overlay>
              ) : null}

              {phase === "gameOver" ? (
                <Overlay
                  title="Game Over"
                  body="You touched a non-matching color. Try timing the jump and wait for your color window."
                  icon={
                    <Sparkles className="h-10 w-10 text-rose-200" aria-hidden />
                  }
                >
                  <TinyButton
                    onClick={() => startGame(mode, levelIndex)}
                    className="bg-white text-slate-950 hover:bg-white/90"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden /> Retry
                  </TinyButton>
                  <TinyButton
                    onClick={() => {
                      setPhase("levelSelect");
                      phaseRef.current = "levelSelect";
                    }}
                  >
                    Levels
                  </TinyButton>
                  <TinyButton
                    onClick={() => {
                      setPhase("menu");
                      phaseRef.current = "menu";
                    }}
                  >
                    Menu
                  </TinyButton>
                </Overlay>
              ) : null}
            </div>

            <div className="mt-3 grid gap-2 text-center text-xs font-black text-white/75 sm:grid-cols-5">
              <Stat label="Passed" value={String(snapshot.passed)} />
              <Stat label="Best streak" value={String(snapshot.bestStreak)} />
              <Stat label="Time" value={`${snapshot.elapsed.toFixed(1)}s`} />
              <Stat label="Best score" value={String(snapshot.highScore)} />
              <Stat label="Record" value={isRecord ? "Yes" : "No"} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function worldToScreen(playerY: number, cameraY: number) {
  return WORLD.playerScreenY - (playerY - cameraY);
}

function updateModel(
  model: Model,
  level: LevelConfig,
  mode: Mode,
  dt: number,
  endRun: (win: boolean) => void,
  emit: (
    x: number,
    y: number,
    kind: "success" | "fail" | "switch" | "star" | "win",
    color?: string,
  ) => void,
) {
  // The orb hovers at spawn until the first tap, so the player is never dropped
  // into danger before they choose to begin. (Shake is purely time-based now.)
  if (!model.started) return;

  model.elapsed += dt;
  model.velocity -= level.gravity * dt;
  // Clamp both directions so taps stay controlled and falling stays readable.
  model.velocity = clamp(model.velocity, -level.maxFall, level.maxRise);
  model.playerY += model.velocity * dt;
  model.cameraY = Math.max(model.cameraY, model.playerY - 210);

  // Short grace window after the first tap: obstacles can't kill yet, giving
  // beginners a moment to orient before the first gate matters.
  const invulnerable = model.elapsed < START_GRACE;
  const collisionR = playerCollisionRadius(level);

  if (mode === "endless") {
    const last = model.obstacles[model.obstacles.length - 1];
    if (last && last.y - model.cameraY < 1600) {
      const base = LEVELS[Math.min(9, Math.floor(model.passed / 6) + 4)];
      const colors = activeColors(base.colorCount);
      const spacing = Math.max(
        220,
        base.obstacleSpacing - Math.min(40, model.passed * 1.5),
      );
      const y = last.y + spacing;
      const id = last.id + 1;
      const kind = base.obstacleKinds[id % base.obstacleKinds.length];
      model.obstacles.push({
        id,
        kind,
        y,
        radius: obstacleRadius(base, kind),
        size: 2 * BAR_CELL_W,
        angle: id * 0.7,
        speed: base.rotationSpeed + model.passed * 0.02,
        direction: base.allowReverse && id % 2 === 1 ? -1 : 1,
        colors,
        passed: false,
      });
      model.collectibles.push({
        id: `switch-${id}`,
        kind: "switch",
        y: y - spacing * 0.42,
        xOffset: 0,
        collected: false,
        pulse: Math.random() * Math.PI * 2,
      });
      if (id % 2 === 0) {
        model.collectibles.push({
          id: `star-${id}`,
          kind: "star",
          y: y + spacing * 0.42,
          xOffset: 0,
          collected: false,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }
    model.obstacles = model.obstacles.filter(
      (obstacle) => obstacle.y > model.cameraY - 400,
    );
    model.collectibles = model.collectibles.filter(
      (item) => item.y > model.cameraY - 300 && !item.collected,
    );
  }

  const playerScreenY = worldToScreen(model.playerY, model.cameraY);
  if (
    playerScreenY > WORLD.height + 80 ||
    model.playerY < model.cameraY - 220
  ) {
    model.shakeUntil = now() + SHAKE_MS;
    endRun(false);
    return;
  }

  for (const obstacle of model.obstacles) {
    obstacle.angle += obstacle.speed * obstacle.direction * dt;
    const sy = worldToScreen(obstacle.y, model.cameraY);
    if (
      !invulnerable &&
      obstacleFatalHit(
        obstacle,
        playerScreenY,
        sy,
        model.playerColor.id,
        level.collisionTolerance,
        collisionR,
      )
    ) {
      model.shakeUntil = now() + SHAKE_MS;
      emit(WORLD.playerX, playerScreenY, "fail");
      endRun(false);
      return;
    }
    if (!obstacle.passed && model.playerY > obstacle.y + obstacle.radius + 28) {
      obstacle.passed = true;
      model.passed += 1;
      model.streak += 1;
      model.bestStreak = Math.max(model.bestStreak, model.streak);
      model.score += 100 * multiplierForStreak(model.streak);
      emit(WORLD.playerX, sy, "success", model.playerColor.value);
    }
  }

  for (const item of model.collectibles) {
    if (item.collected) continue;
    item.pulse += dt * 4;
    const sy = worldToScreen(item.y, model.cameraY);
    const x = WORLD.playerX + item.xOffset;
    const dist = Math.hypot(WORLD.playerX - x, playerScreenY - sy);
    // Collectibles sit on the orb's center line; a forgiving radius makes them easy to grab.
    if (dist < level.playerRadius + 22) {
      item.collected = true;
      if (item.kind === "star") {
        model.stars += 1;
        model.score += 50;
        emit(x, sy, "star");
      } else {
        const choices = activeColors(level.colorCount).filter(
          (color) => color.id !== model.playerColor.id,
        );
        model.playerColor = pick(
          choices.length ? choices : activeColors(level.colorCount),
        );
        emit(x, sy, "switch", model.playerColor.value);
      }
    }
  }

  if (mode === "levels" && model.playerY >= level.distance) {
    model.score += 500;
    emit(WORLD.width / 2, WORLD.height * 0.35, "win");
    endRun(true);
  }
}

function norm2pi(angle: number) {
  return ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

// True when the player's color matches the segment at `angle`, including a small
// forgiving zone at each segment boundary (so edge grazes are not unfair deaths).
function segmentColorMatches(
  segs: GameColor[],
  angle: number,
  playerColorId: string,
): boolean {
  const seg = (Math.PI * 2) / segs.length;
  const local = norm2pi(angle);
  const idx = Math.floor(local / seg) % segs.length;
  const frac = (local - idx * seg) / seg;
  if (segs[idx].id === playerColorId) return true;
  if (
    frac < BOUNDARY_GRACE &&
    segs[(idx - 1 + segs.length) % segs.length].id === playerColorId
  )
    return true;
  if (
    frac > 1 - BOUNDARY_GRACE &&
    segs[(idx + 1) % segs.length].id === playerColorId
  )
    return true;
  return false;
}

/**
 * Returns true only for a fair, fatal collision. The orb is locked to center X,
 * so every obstacle is evaluated along the vertical axis. Each obstacle kind is
 * built so the orb's two crossings (below + above center) require a SINGLE color,
 * and a tolerance + boundary grace keep edge contact from being punished.
 */
function obstacleFatalHit(
  obstacle: Obstacle,
  py: number,
  sy: number,
  playerColorId: string,
  tolerance: number,
  playerR: number,
): boolean {
  const cy = sy;
  if (cy < -160 || cy > WORLD.height + 160) return false;
  const dy = py - cy;
  const axisAngle = (dy >= 0 ? Math.PI / 2 : -Math.PI / 2) - obstacle.angle;

  if (obstacle.kind === "ring") {
    const dist = Math.abs(dy);
    const half = RING_STROKE / 2 + playerR - tolerance;
    if (dist < obstacle.radius - half || dist > obstacle.radius + half)
      return false; // not on the arc
    return !segmentColorMatches(
      ringSegmentColors(obstacle.colors),
      axisAngle,
      playerColorId,
    );
  }

  if (obstacle.kind === "cross") {
    const r = Math.abs(dy);
    // Safe hub at the centre + past the tips: lets any color thread the "X" window.
    if (r > obstacle.radius + 16 || r < CROSS_INNER) return false;
    const local = norm2pi(axisAngle);
    const sector = ((Math.round(local / (Math.PI / 2)) % 4) + 4) % 4;
    const nearest = sector * (Math.PI / 2);
    const distanceToArm = Math.abs(Math.sin(local - nearest)) * r;
    if (distanceToArm > playerR + 9 - tolerance) return false; // in the gap between arms = safe
    return crossArmColors(obstacle.colors)[sector].id !== playerColorId;
  }

  // bars: a sliding lane with one transparent gap, always offering a safe path.
  const half = BAR_THICKNESS / 2 + playerR - tolerance;
  if (Math.abs(dy) > half) return false; // not crossing the lane
  const { cell, index, frac } = barCellAtCenter(obstacle);
  if (!cell || cell.id === playerColorId) return false;
  const cells = barCellColors(obstacle.colors);
  if (frac < BOUNDARY_GRACE) {
    const prev = cells[(index - 1 + cells.length) % cells.length];
    if (!prev || prev.id === playerColorId) return false;
  }
  if (frac > 1 - BOUNDARY_GRACE) {
    const next = cells[(index + 1) % cells.length];
    if (!next || next.id === playerColorId) return false;
  }
  return true;
}

function drawGame(
  ctx: CanvasRenderingContext2D,
  model: Model,
  level: LevelConfig,
  mode: Mode,
  particles: Particle[],
  phase: Phase,
) {
  // Time-based shake: a brief fail reaction that decays on its own within
  // SHAKE_MS and then stops completely. Allowed only during play and the loss
  // reaction (gameOver), so Level Complete / paused / menu stay perfectly stable
  // and there is never any continuous vibration.
  const remaining = model.shakeUntil - now();
  const shakeActive = phase === "playing" || phase === "gameOver";
  const shakeIntensity =
    shakeActive && remaining > 0 ? Math.min(1, remaining / SHAKE_MS) : 0;
  const shakeX =
    shakeIntensity > 0 ? (Math.random() - 0.5) * SHAKE_MAG * shakeIntensity : 0;
  const shakeY =
    shakeIntensity > 0 ? (Math.random() - 0.5) * SHAKE_MAG * shakeIntensity : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);
  const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  gradient.addColorStop(0, "#020617");
  gradient.addColorStop(0.52, "#111827");
  gradient.addColorStop(1, "#1e1b4b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  for (let y = (model.cameraY * 0.28) % 36; y < WORLD.height; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD.width, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (const obstacle of model.obstacles)
    drawObstacle(ctx, obstacle, worldToScreen(obstacle.y, model.cameraY));
  for (const item of model.collectibles)
    if (!item.collected)
      drawCollectible(ctx, item, worldToScreen(item.y, model.cameraY));

  for (const p of particles) {
    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const playerScreenY = worldToScreen(model.playerY, model.cameraY);
  ctx.save();
  ctx.shadowColor = model.playerColor.value;
  ctx.shadowBlur = 22;
  ctx.fillStyle = model.playerColor.value;
  ctx.beginPath();
  ctx.arc(WORLD.playerX, playerScreenY, level.playerRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,.82)";
  ctx.stroke();
  ctx.restore();

  // "Tap to start" hold: until the first tap the orb hovers, so the player is
  // never dropped into danger. A pulsing prompt invites the first move.
  if (phase === "playing" && !model.started) {
    const pulse = 0.55 + Math.sin(now() / 260) * 0.25;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.font = "900 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TAP TO START", WORLD.width / 2, playerScreenY - 60);
    ctx.globalAlpha = Math.max(0.4, pulse);
    ctx.font = "700 13px system-ui, sans-serif";
    ctx.fillText(
      "Match your color through each gate",
      WORLD.width / 2,
      playerScreenY - 36,
    );
    ctx.restore();
  }

  ctx.fillStyle = "rgba(255,255,255,.78)";
  ctx.font = "800 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `ORB: ${model.playerColor.name.toUpperCase()}`,
    WORLD.width / 2,
    28,
  );

  if (mode === "levels") {
    const finishY = worldToScreen(level.distance, model.cameraY);
    if (finishY > -80 && finishY < WORLD.height + 80) {
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(30, finishY);
      ctx.lineTo(WORLD.width - 30, finishY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#facc15";
      ctx.font = "900 13px system-ui, sans-serif";
      ctx.fillText("FINISH", WORLD.width / 2, finishY - 10);
    }
  }
  ctx.restore();
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  obstacle: Obstacle,
  y: number,
) {
  if (y < -160 || y > WORLD.height + 160) return;
  const cx = WORLD.width / 2;

  // Bars slide horizontally (no rotation) — drawn directly in screen space so
  // the visible lane matches the collision lane exactly.
  if (obstacle.kind === "bars") {
    const cells = barCellColors(obstacle.colors);
    const offset = barOffset(obstacle);
    // Faint channel so the lane and its moving gap read clearly.
    ctx.fillStyle = "rgba(255,255,255,.05)";
    roundRect(
      ctx,
      0,
      y - BAR_THICKNESS / 2 - 2,
      WORLD.width,
      BAR_THICKNESS + 4,
      8,
    );
    ctx.fill();
    const kStart = Math.floor((offset - cx) / BAR_CELL_W);
    const kEnd = Math.floor((offset + WORLD.width - cx) / BAR_CELL_W);
    for (let k = kStart; k <= kEnd; k += 1) {
      const cell = cells[((k % cells.length) + cells.length) % cells.length];
      const left = cx + k * BAR_CELL_W - offset;
      if (!cell) continue; // transparent gap = the always-safe lane
      ctx.fillStyle = cell.value;
      roundRect(
        ctx,
        left + 3,
        y - BAR_THICKNESS / 2,
        BAR_CELL_W - 6,
        BAR_THICKNESS,
        9,
      );
      ctx.fill();
    }
    return;
  }

  ctx.save();
  ctx.translate(cx, y);
  ctx.rotate(obstacle.angle);
  if (obstacle.kind === "ring") {
    // Palette repeated twice so opposite arcs share a color (fair single-color pass).
    const segs = ringSegmentColors(obstacle.colors);
    const segment = (Math.PI * 2) / segs.length;
    for (let i = 0; i < segs.length; i += 1) {
      ctx.beginPath();
      ctx.strokeStyle = segs[i].value;
      ctx.lineWidth = RING_STROKE;
      ctx.lineCap = "butt";
      ctx.arc(
        0,
        0,
        obstacle.radius,
        i * segment + 0.04,
        (i + 1) * segment - 0.04,
      );
      ctx.stroke();
    }
  } else {
    // Cross arms mirror (A,B,A,B) so the orb's two crossings need one color.
    // Arms start at the hub radius, leaving a safe centre to thread by timing.
    const arms = crossArmColors(obstacle.colors);
    const armLength = obstacle.radius - CROSS_INNER + 14;
    for (let i = 0; i < 4; i += 1) {
      ctx.save();
      ctx.rotate((Math.PI / 2) * i);
      ctx.fillStyle = arms[i].value;
      roundRect(ctx, CROSS_INNER, -12, armLength, 24, 12);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, CROSS_INNER - 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCollectible(
  ctx: CanvasRenderingContext2D,
  item: Collectible,
  y: number,
) {
  if (y < -60 || y > WORLD.height + 60) return;
  const x = WORLD.playerX + item.xOffset;
  const scale = 1 + Math.sin(item.pulse) * 0.08;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (item.kind === "star") {
    ctx.fillStyle = "#facc15";
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 16;
    drawStar(ctx, 0, 0, 5, 13, 6);
    ctx.fill();
  } else {
    const gradient = ctx.createConicGradient(item.pulse, 0, 0);
    COLORS.forEach((color, index) =>
      gradient.addColorStop(index / COLORS.length, color.value),
    );
    gradient.addColorStop(1, COLORS[0].value);
    ctx.fillStyle = gradient;
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,.75)";
    ctx.stroke();
  }
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i += 1) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;
    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

function InfoTile({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
      <p className="font-black text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-white/65">{body}</p>
    </div>
  );
}

function Overlay({
  title,
  body,
  icon,
  children,
}: {
  title: string;
  body: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/72 p-4 text-center backdrop-blur-sm">
      <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl">
        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-[2rem] border border-white/10 bg-white/10">
          {icon}
        </div>
        <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-white/65">{body}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {children}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 shadow-lg backdrop-blur-md">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">
        {label}
      </p>
      {value ? (
        <p className="mt-1 text-base font-black text-white">{value}</p>
      ) : null}
    </div>
  );
}
