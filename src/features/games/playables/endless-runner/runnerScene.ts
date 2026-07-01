// Client-only Phaser engine for the Endless Runner. This module statically
// imports Phaser, so it MUST only ever be loaded through a dynamic import()
// from the browser (see EndlessRunnerGame.tsx) — never during SSR, because
// Phaser touches `window` at module-evaluation time.
import Phaser from "phaser";

export type RunnerPhase = "idle" | "playing" | "paused" | "over";

// Emitted rarely: only on phase changes, life loss, or a new best score.
export type RunnerHud = {
  phase: RunnerPhase;
  score: number;
  distance: number;
  speed: number;
  lives: number;
};

// Emitted frequently (throttled) so the UI can update live numbers via direct
// DOM writes instead of React state, keeping gameplay decoupled from React.
export type RunnerStats = {
  score: number;
  distance: number;
  speed: number;
};

export type RunnerEvent = "start" | "jump" | "slide" | "coin" | "hit" | "over";

export type RunnerCallbacks = {
  onHud: (hud: RunnerHud) => void;
  onStats: (stats: RunnerStats) => void;
  onEvent: (event: RunnerEvent) => void;
};

export type RunnerControls = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  jump: () => void;
  slide: () => void;
  destroy: () => void;
};

const WORLD_WIDTH = 900;
const WORLD_HEIGHT = 450;
const GROUND_TOP = 372; // Y of the walkable ground surface.
const PLAYER_X = 150;
const START_SPEED = 300;
const MAX_SPEED = 600;
const MAX_LIVES = 3;
const INVULN_MS = 1500;
const HURT_POSE_MS = 260; // brief "hurt" pose right after a hit, independent of the longer invuln blink

// Jump tuning: gravity is split into three tiers so the arc has a strong
// launch, a soft hang near the apex, and a snappier fall — a single constant
// gravity value cannot produce all three at once. World gravity (rather than
// per-body gravity) is retuned per-frame in update(); obstacles/coins opt out
// via allowGravity:false so only the player is affected.
const JUMP_VELOCITY = -920;
const RISE_GRAVITY = 2100;
const APEX_GRAVITY = 1000;
const FALL_GRAVITY = 3000;
const APEX_VELOCITY_THRESHOLD = 140;
const COYOTE_MS = 110; // grace window to still jump just after walking off a ledge
const JUMP_BUFFER_MS = 140; // early jump press is honored on landing
const JUMP_AIRTIME_MS = 860; // approximate full rise+fall time at the tuning above, used for fairness spacing

const SLIDE_MS = 620;
const SLIDE_JUMP_LOCK_MS = 300; // can't cancel the first part of a slide into a jump
const HIT_FREEZE_MS = 550; // obstacle stays visible (frozen) this long after a hit

const GRACE_MS = 13000; // first ~13s only spawns simple, well-spaced obstacles
const DIFFICULTY_STAGE_MS = 60000; // after this, rarer/longer patterns unlock
const RAMP_RATE = 0.012; // px/s of speed gained per ms once the grace window ends

// Fairness spacing: obstacle gaps are derived from current speed, human
// reaction time, and how long the previous obstacle's action occupies the
// player — never a fixed pixel floor that becomes unfair as speed ramps up.
const REACTION_MS = 380;
const SAME_ACTION_BUFFER_MS = 260;
const SWITCH_ACTION_BUFFER_MS = 220;

const MAX_OBSTACLES = 14;
const MAX_COINS = 24;
const STAT_EMIT_MS = 150; // throttle for the high-frequency, non-React stats callback

// Off by default. Flip locally (or press ` at runtime) to see FPS/object counts.
const DEBUG_MODE = false;
// Off by default. Flip locally to draw Arcade Physics hitboxes for tuning collisions.
const DEBUG_HITBOXES = false;

const LIFE = 0x0b1020;

type ObstacleKind = "rock" | "crate" | "spikes" | "log" | "bird" | "branch";
type ObstacleAction = "jump" | "slide";
type PlayerAnimState = "idle" | "run" | "jump" | "fall" | "slide" | "hurt";

const OBSTACLE_ACTION: Record<ObstacleKind, ObstacleAction> = {
  rock: "jump",
  crate: "jump",
  spikes: "jump",
  log: "jump",
  bird: "slide",
  branch: "slide",
};

// A small pattern manager beats pure per-obstacle randomness: each entry is a
// short, hand-checked sequence, so the run reads as "designed" obstacles
// rather than a slot machine, and rapid jump/slide alternation never happens
// by chance.
type Pattern = ObstacleKind[];
const EARLY_PATTERNS: Pattern[] = [["rock"], ["crate"], ["rock", "crate"], ["crate", "rock"]];
const CORE_PATTERNS: Pattern[] = [
  ["rock"],
  ["crate"],
  ["spikes"],
  ["log"],
  ["bird"],
  ["branch"],
  ["rock", "crate"],
  ["crate", "spikes"],
  ["rock", "bird"],
  ["crate", "branch"],
  ["spikes", "rock"],
  ["log", "crate"],
];
const LATE_PATTERNS: Pattern[] = [
  ["rock", "bird", "crate"],
  ["branch", "rock", "bird"],
  ["log", "branch"],
  ["spikes", "bird"],
  ["crate", "log", "rock"],
];

// Hero art: one real, individually-posed CC0 sprite per animation state (see
// ASSETS.md + images/HERO-LICENSE.txt). Each file is 80x110; Phaser animations
// support frames from different texture keys directly, so no packed
// spritesheet/atlas is needed. If any file is missing or fails to load, a
// procedurally-drawn placeholder of the same size is generated under the same
// key instead, so the game never breaks.
type HeroPoseKey = "idle" | "walk1" | "walk2" | "jump" | "fall" | "slide" | "hurt";
const HERO_NATIVE_W = 80;
const HERO_NATIVE_H = 110;
const HERO_SCALE = 0.72;
const HERO_POSE_FILES: Record<HeroPoseKey, string> = {
  idle: "hero-idle.png",
  walk1: "hero-walk1.png",
  walk2: "hero-walk2.png",
  jump: "hero-jump.png",
  fall: "hero-fall.png",
  slide: "hero-slide.png",
  hurt: "hero-hurt.png",
};
const HERO_POSE_KEYS = Object.keys(HERO_POSE_FILES) as HeroPoseKey[];
function heroTexKey(pose: HeroPoseKey) {
  return `er-hero-${pose}`;
}

const BG_LAYER1_URL = "/games/endless-runner/images/layer1.jpg";
const BG_LAYER2_URL = "/games/endless-runner/images/layer2.jpg";

function drawTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (g: Phaser.GameObjects.Graphics) => void,
) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
}

// ---- Procedural hero art (fallback for any missing/failed pose asset) -----

type HeroPose = {
  legStride?: number; // horizontal leg offset for a run cycle, 0 = neutral stance
  bob?: number; // vertical offset for torso/head (negative = up), for idle/run life
  lean?: number; // horizontal shift of torso/head, negative = leaning back
  crouch?: boolean; // slide pose: low, wide torso
  armsUp?: boolean; // jump/hurt: arms raised
  armsOut?: boolean; // fall: arms out for balance
  reachDown?: boolean; // fall: legs extended toward the ground
  tuckUp?: boolean; // jump: knees tucked up
  hurt?: boolean; // hurt: tilted head, open mouth, angled brows
};

const OUTLINE = 0x1e1b16;
const JACKET = 0xf97316;
const JACKET_HI = 0xfb923c;
const JACKET_LOW = 0xc2410c;
const TRIM = 0x1f2937;
const SKIN = 0xfcd9a8;
const HAIR = 0x241a12;
const BAND = 0x0ea5e9;
const SHOE = 0x111827;
const SHOE_SOLE = 0xf59e0b;

function drawHeroPose(g: Phaser.GameObjects.Graphics, ox: number, oy: number, pose: HeroPose) {
  const stride = pose.legStride ?? 0;
  const bob = pose.bob ?? 0;
  const lean = pose.lean ?? 0;
  const cx = ox + 28 + lean;
  const cy = oy + bob;

  // Ground contact shadow is intentionally NOT baked into the sheet — it's a
  // separate, dynamically-scaled game object (see RunnerScene.playerShadow)
  // so it can react to jump height in real time.

  // Legs (skipped/replaced for crouch, which draws its own low legs below).
  if (!pose.crouch) {
    const legTop = cy + 44;
    const legLen = pose.reachDown ? 22 : pose.tuckUp ? 10 : 18;
    const legW = 9;
    const drawLeg = (dx: number, bendUp: boolean) => {
      const topY = bendUp ? legTop + 6 : legTop;
      g.fillStyle(TRIM, 1);
      g.fillRoundedRect(cx - 4 + dx, topY, legW, legLen, 3);
      g.lineStyle(1.5, OUTLINE, 0.5);
      g.strokeRoundedRect(cx - 4 + dx, topY, legW, legLen, 3);
      g.fillStyle(SHOE, 1);
      g.fillRoundedRect(cx - 4 + dx - 1, topY + legLen - 6, legW + 2, 8, 3);
      g.fillStyle(SHOE_SOLE, 1);
      g.fillRect(cx - 4 + dx - 1, topY + legLen, legW + 2, 2);
    };
    drawLeg(-stride, pose.tuckUp === true && stride > 0);
    drawLeg(stride, pose.tuckUp === true && stride < 0);
  } else {
    // Slide: low, mostly-horizontal silhouette with one leg kicked forward.
    g.fillStyle(TRIM, 1);
    g.fillRoundedRect(cx - 2, cy + 50, 30, 10, 4);
    g.fillStyle(SHOE, 1);
    g.fillRoundedRect(cx + 22, cy + 48, 12, 9, 3);
    g.fillStyle(SHOE_SOLE, 1);
    g.fillRect(cx + 22, cy + 57, 12, 2);
  }

  // Torso.
  const torsoY = pose.crouch ? cy + 34 : cy + 18;
  const torsoH = pose.crouch ? 20 : 28;
  const torsoW = pose.crouch ? 34 : 24;
  const torsoX = cx - torsoW / 2 - (pose.crouch ? 6 : 0);
  g.fillStyle(JACKET, 1);
  g.fillRoundedRect(torsoX, torsoY, torsoW, torsoH, 8);
  g.fillStyle(JACKET_HI, 1);
  g.fillRoundedRect(torsoX, torsoY, torsoW, Math.round(torsoH * 0.35), 6);
  g.fillStyle(JACKET_LOW, 0.55);
  g.fillRoundedRect(torsoX, torsoY + torsoH * 0.65, torsoW, torsoH * 0.35, 6);
  g.lineStyle(2, OUTLINE, 0.9);
  g.strokeRoundedRect(torsoX, torsoY, torsoW, torsoH, 8);

  // Arms.
  const armW = 8;
  const shoulderY = torsoY + 4;
  const drawArm = (dx: number, up: boolean, out: boolean) => {
    const ax = cx + dx;
    const ay = up ? shoulderY - 16 : out ? shoulderY + 2 : shoulderY + 2;
    const len = up ? 20 : 18;
    const angle = out ? 0.35 * Math.sign(dx || 1) : 0;
    g.save();
    g.translateCanvas(ax, ay);
    if (angle) g.rotateCanvas(angle);
    g.fillStyle(JACKET_LOW, 1);
    g.fillRoundedRect(-armW / 2, 0, armW, len, 3);
    g.lineStyle(1.5, OUTLINE, 0.5);
    g.strokeRoundedRect(-armW / 2, 0, armW, len, 3);
    g.fillStyle(SKIN, 1);
    g.fillCircle(0, len, armW / 2 + 1);
    g.restore();
  };
  if (pose.crouch) {
    drawArm(18, false, false);
  } else if (pose.armsUp) {
    drawArm(-14, true, false);
    drawArm(14, true, false);
  } else if (pose.armsOut) {
    drawArm(-16, false, true);
    drawArm(16, false, true);
  } else {
    drawArm(-14 - stride * 0.6, false, false);
    drawArm(14 - stride * 0.6, false, false);
  }

  // Head.
  const headCx = pose.crouch ? cx + 14 : cx + (pose.hurt ? 3 : 0);
  const headCy = pose.crouch ? torsoY - 4 : torsoY - 12 - (pose.hurt ? 3 : 0);
  const headR = 11;
  g.fillStyle(SKIN, 1);
  g.fillCircle(headCx, headCy, headR);
  g.lineStyle(1.5, OUTLINE, 0.6);
  g.strokeCircle(headCx, headCy, headR);
  g.fillStyle(HAIR, 1);
  g.fillRect(headCx - 9, headCy - 11, 18, 5);
  g.fillStyle(BAND, 1);
  g.fillRect(headCx - 10, headCy - 4, 20, 3.5);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(headCx + 4, headCy - 6, 1.1);

  // Face.
  if (pose.hurt) {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(headCx + 4, headCy - 1, 3);
    g.fillStyle(OUTLINE, 1);
    g.fillCircle(headCx + 4, headCy - 1, 1.6);
    g.fillStyle(0x7a4a24, 1);
    g.fillEllipse(headCx + 4, headCy + 6, 4, 3);
    g.lineStyle(1.5, OUTLINE, 0.8);
    g.beginPath();
    g.moveTo(headCx - 2, headCy - 8);
    g.lineTo(headCx + 1, headCy - 10);
    g.strokePath();
  } else {
    g.fillStyle(OUTLINE, 1);
    g.fillCircle(headCx + 4, headCy - 1, 1.4);
    g.lineStyle(1.2, 0x7a4a24, 0.8);
    g.beginPath();
    g.moveTo(headCx + 1, headCy + 5);
    g.lineTo(headCx + 6, headCy + 5);
    g.strokePath();
  }
}

// One representative pose per animation state, used only when the real CC0
// asset (see HERO_POSE_FILES) is missing or fails to load.
const HERO_POSE_CONFIG: Record<HeroPoseKey, HeroPose> = {
  idle: { bob: 0 },
  walk1: { legStride: 7, bob: 0 },
  walk2: { legStride: -7, bob: 0 },
  jump: { lean: -2, tuckUp: true, armsUp: true },
  fall: { lean: 2, reachDown: true, armsOut: true },
  slide: { crouch: true, bob: 0 },
  hurt: { armsUp: true, hurt: true },
};

function drawHeroPoseFallback(scene: Phaser.Scene, pose: HeroPoseKey) {
  const key = heroTexKey(pose);
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // The hand-drawn poses were designed for a 56x80 cell; center that drawing
  // within the same 80x110 canvas the real asset uses, so both paths share
  // identical sprite dimensions, scale, and hitbox math.
  drawHeroPose(g, (HERO_NATIVE_W - 56) / 2, HERO_NATIVE_H - 80 - 6, HERO_POSE_CONFIG[pose]);
  g.generateTexture(key, HERO_NATIVE_W, HERO_NATIVE_H);
  g.destroy();
}

function drawBackgroundFallback(scene: Phaser.Scene, key: string, hillColor: number, skyTop: number, skyBottom: number) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const steps = 12;
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(skyTop),
      Phaser.Display.Color.ValueToColor(skyBottom),
      steps - 1,
      i,
    );
    g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
    g.fillRect(0, Math.round((WORLD_HEIGHT / steps) * i), WORLD_WIDTH, Math.ceil(WORLD_HEIGHT / steps) + 1);
  }
  g.fillStyle(hillColor, 0.55);
  g.fillEllipse(WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.82, WORLD_WIDTH * 0.5, 140);
  g.fillEllipse(WORLD_WIDTH * 0.7, WORLD_HEIGHT * 0.86, WORLD_WIDTH * 0.6, 160);
  g.fillStyle(hillColor, 0.8);
  g.fillEllipse(WORLD_WIDTH * 0.45, WORLD_HEIGHT * 0.92, WORLD_WIDTH * 0.7, 120);
  g.generateTexture(key, WORLD_WIDTH, WORLD_HEIGHT);
  g.destroy();
}

// A self-contained Phaser scene. Ground/obstacle/coin/particle textures are
// generated procedurally so the build needs no external binary assets for
// those; the real hero sprites and background jpgs are loaded from disk and
// used automatically when present (see HERO_POSE_FILES / ASSETS.md), falling
// back to generated art per-pose if any file is missing or fails to load.
class RunnerScene extends Phaser.Scene {
  private callbacks: RunnerCallbacks;
  private best: number;

  private phase: RunnerPhase = "idle";
  private ready = false;
  private debugMode = DEBUG_MODE;
  private failedLoads = new Set<string>();

  private layer1!: Phaser.GameObjects.TileSprite;
  private layer2!: Phaser.GameObjects.TileSprite;
  private ground!: Phaser.GameObjects.TileSprite;
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private coins!: Phaser.Physics.Arcade.Group;
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private debugText?: Phaser.GameObjects.Text;

  private speed = START_SPEED;
  private distance = 0;
  private score = 0;
  private lives = MAX_LIVES;

  private obstacleAcc = 0;
  private obstacleGap = 650;
  private coinAcc = 0;
  private coinGap = 900;
  private obstacleQueue: ObstacleKind[] = [];
  private lastObstacleAction: ObstacleAction | null = null;

  private grounded = true;
  private sliding = false;
  private slideUntil = 0;
  private slideJumpLockUntil = 0;
  private invulnUntil = 0;
  private hurtUntil = 0;
  private playerState: PlayerAnimState = "idle";

  private runTimeMs = 0;
  private lastGroundedAt = 0;
  private jumpBufferUntil = 0;

  private statTimer = 0;
  private debugTimer = 0;
  private lastEmitted: { phase: RunnerPhase; lives: number; best: number } | null = null;

  constructor(callbacks: RunnerCallbacks, best: number) {
    super("runner");
    this.callbacks = callbacks;
    this.best = best;
  }

  preload() {
    HERO_POSE_KEYS.forEach((pose) => {
      this.load.image(heroTexKey(pose), `/games/endless-runner/images/${HERO_POSE_FILES[pose]}`);
    });
    this.load.image("er-layer1", BG_LAYER1_URL);
    this.load.image("er-layer2", BG_LAYER2_URL);
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      this.failedLoads.add(file.key);
    });
  }

  create() {
    this.buildTextures();
    this.createAnimations();

    this.layer1 = this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, "er-layer1").setOrigin(0, 0);
    this.layer2 = this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, "er-layer2").setOrigin(0, 0).setAlpha(0.9);

    // Soft dimming so sprites read clearly over the photographic background.
    this.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x050914, 0.28).setOrigin(0, 0);

    this.ground = this.add
      .tileSprite(0, GROUND_TOP, WORLD_WIDTH, WORLD_HEIGHT - GROUND_TOP, "er-ground")
      .setOrigin(0, 0);

    this.playerShadow = this.add.ellipse(PLAYER_X, GROUND_TOP, 34, 9, 0x000000, 0.32).setDepth(4);

    this.player = this.physics.add.sprite(PLAYER_X, GROUND_TOP, heroTexKey("idle"));
    this.player.setOrigin(0.5, 1);
    this.player.setScale(HERO_SCALE);
    this.player.setDepth(5);
    this.player.setCollideWorldBounds(false);
    this.setPlayerBody(false);
    this.player.anims.play("idle");

    this.obstacles = this.physics.add.group({ allowGravity: false, maxSize: MAX_OBSTACLES, runChildUpdate: false });
    this.coins = this.physics.add.group({ allowGravity: false, maxSize: MAX_COINS, runChildUpdate: false });

    this.dustEmitter = this.add.particles(0, 0, "er-dust", {
      lifespan: 320,
      speed: { min: 30, max: 90 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.6, end: 0 },
      quantity: 0,
      emitting: false,
    });
    this.dustEmitter.setDepth(4);
    this.sparkEmitter = this.add.particles(0, 0, "er-spark", {
      lifespan: 380,
      speed: { min: 60, max: 160 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 0,
      emitting: false,
    });
    this.sparkEmitter.setDepth(6);

    this.physics.add.overlap(this.player, this.obstacles, (_p, obj) => {
      this.handleHit(obj as Phaser.Physics.Arcade.Image);
    });
    this.physics.add.overlap(this.player, this.coins, (_p, obj) => {
      this.handleCoin(obj as Phaser.Physics.Arcade.Image);
    });

    // Pointer taps inside the canvas jump (and start the run on the first tap).
    this.input.on("pointerdown", () => {
      this.jump();
    });

    this.debugText = this.add
      .text(8, 6, "", { fontFamily: "monospace", fontSize: "12px", color: "#7dffb0" })
      .setDepth(10)
      .setScrollFactor(0)
      .setVisible(this.debugMode);
    this.input.keyboard?.on("keydown-BACKTICK", () => {
      this.debugMode = !this.debugMode;
      this.debugText?.setVisible(this.debugMode);
    });

    // Freeze the world until the player starts; parallax still drifts in update.
    this.physics.pause();
    this.ready = true;
    this.emitPhase();
  }

  // ---- Texture generation -------------------------------------------------

  private buildTextures() {
    // Real assets are attempted in preload(); fall back to generated ones,
    // per pose, only if a given file failed to load (or was never present).
    HERO_POSE_KEYS.forEach((pose) => {
      const key = heroTexKey(pose);
      if (this.failedLoads.has(key) || !this.textures.exists(key)) {
        drawHeroPoseFallback(this, pose);
      }
    });
    if (this.failedLoads.has("er-layer1") || !this.textures.exists("er-layer1")) {
      drawBackgroundFallback(this, "er-layer1", 0x2a3f2a, 0x1b2540, 0x3a3f6b);
    }
    if (this.failedLoads.has("er-layer2") || !this.textures.exists("er-layer2")) {
      drawBackgroundFallback(this, "er-layer2", 0x223522, 0x24305a, 0x50588c);
    }

    drawTexture(this, "er-ground", 64, WORLD_HEIGHT - GROUND_TOP, (g) => {
      g.fillStyle(0x3b2a1c, 1);
      g.fillRect(0, 0, 64, WORLD_HEIGHT - GROUND_TOP);
      g.fillStyle(0x2a1d12, 1);
      g.fillRect(0, 14, 64, WORLD_HEIGHT - GROUND_TOP - 14);
      g.fillStyle(0x6a8a3a, 1);
      g.fillRect(0, 0, 64, 12);
      g.fillStyle(0x86b04a, 1);
      g.fillRect(0, 0, 64, 5);
      g.fillStyle(0x1f150c, 1);
      g.fillRect(10, 26, 6, 6);
      g.fillRect(38, 40, 7, 7);
      g.fillRect(52, 22, 5, 5);
    });

    drawTexture(this, "er-rock", 58, 46, (g) => {
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(29, 44, 50, 7);
      g.fillStyle(0x6b7280, 1);
      g.fillPoints(
        [
          new Phaser.Math.Vector2(4, 46),
          new Phaser.Math.Vector2(10, 18),
          new Phaser.Math.Vector2(28, 4),
          new Phaser.Math.Vector2(48, 16),
          new Phaser.Math.Vector2(54, 46),
        ],
        true,
      );
      g.fillStyle(0x9ca3af, 1);
      g.fillTriangle(14, 24, 26, 12, 30, 26);
      g.fillStyle(0x4b5563, 1);
      g.fillTriangle(34, 30, 46, 20, 48, 42);
      g.lineStyle(2, 0x374151, 0.8);
      g.strokePoints(
        [
          new Phaser.Math.Vector2(4, 46),
          new Phaser.Math.Vector2(10, 18),
          new Phaser.Math.Vector2(28, 4),
          new Phaser.Math.Vector2(48, 16),
          new Phaser.Math.Vector2(54, 46),
        ],
        true,
      );
    });

    drawTexture(this, "er-crate", 52, 52, (g) => {
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(26, 50, 46, 7);
      g.fillStyle(0x8a5a2b, 1);
      g.fillRoundedRect(2, 2, 48, 48, 4);
      g.fillStyle(0xb07636, 1);
      g.fillRoundedRect(6, 6, 40, 40, 3);
      g.lineStyle(4, 0x5f3d1c, 1);
      g.strokeRect(6, 6, 40, 40);
      g.lineBetween(6, 6, 46, 46);
      g.lineBetween(46, 6, 6, 46);
      g.lineStyle(2, 0x3f2712, 0.9);
      g.strokeRoundedRect(2, 2, 48, 48, 4);
    });

    drawTexture(this, "er-spikes", 68, 34, (g) => {
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(34, 32, 58, 6);
      g.fillStyle(0x475569, 1);
      g.fillRect(2, 26, 64, 8);
      g.fillStyle(0xcbd5e1, 1);
      for (let i = 0; i < 4; i += 1) {
        const x = 6 + i * 15;
        g.fillTriangle(x, 28, x + 7, 2, x + 14, 28);
      }
      g.fillStyle(0xf1f5f9, 1);
      for (let i = 0; i < 4; i += 1) {
        const x = 6 + i * 15;
        g.fillTriangle(x + 5, 26, x + 7, 6, x + 9, 26);
      }
      g.lineStyle(1.5, 0x1e293b, 0.6);
      for (let i = 0; i < 4; i += 1) {
        const x = 6 + i * 15;
        g.strokeTriangle(x, 28, x + 7, 2, x + 14, 28);
      }
    });

    drawTexture(this, "er-log", 66, 40, (g) => {
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(33, 38, 58, 6);
      g.fillStyle(0x7a4a24, 1);
      g.fillRoundedRect(2, 8, 62, 26, 12);
      g.fillStyle(0x9c6234, 1);
      g.fillRoundedRect(2, 8, 62, 10, 10);
      g.fillStyle(0xc98a4b, 1);
      g.fillCircle(10, 21, 9);
      g.fillStyle(0x7a4a24, 1);
      g.fillCircle(10, 21, 5);
      g.fillStyle(0xc98a4b, 1);
      g.fillCircle(56, 21, 9);
      g.fillStyle(0x7a4a24, 1);
      g.fillCircle(56, 21, 5);
      g.lineStyle(2, 0x4a2c14, 0.8);
      g.strokeRoundedRect(2, 8, 62, 26, 12);
    });

    drawTexture(this, "er-bird", 48, 34, (g) => {
      g.fillStyle(0x8b5cf6, 1);
      g.fillEllipse(24, 20, 30, 16);
      g.fillStyle(0xa78bfa, 1);
      g.fillTriangle(10, 18, 30, 6, 30, 20); // wing
      g.fillStyle(0xede9fe, 1);
      g.fillCircle(36, 16, 7); // head
      g.fillStyle(0x111827, 1);
      g.fillCircle(38, 15, 2); // eye
      g.fillStyle(0xf59e0b, 1);
      g.fillTriangle(43, 15, 48, 17, 43, 19); // beak
      g.lineStyle(1.5, 0x5b21b6, 0.6);
      g.strokeEllipse(24, 20, 30, 16);
    });

    drawTexture(this, "er-branch", 70, 30, (g) => {
      // Hanging branch: requires a slide, same head-height danger zone as the bird.
      g.fillStyle(0x5b3a1f, 1);
      g.fillRoundedRect(0, 0, 70, 12, 4);
      g.fillStyle(0x7a4a24, 1);
      g.fillTriangle(10, 12, 18, 12, 12, 26);
      g.fillTriangle(28, 12, 38, 12, 32, 30);
      g.fillTriangle(46, 12, 56, 12, 50, 24);
      g.fillStyle(0x3f6b2a, 1);
      g.fillEllipse(14, 24, 12, 8);
      g.fillEllipse(34, 28, 12, 8);
      g.fillEllipse(52, 22, 12, 8);
    });

    drawTexture(this, "er-coin", 30, 30, (g) => {
      g.fillStyle(0x000000, 0.2);
      g.fillCircle(16, 17, 13);
      g.fillStyle(0xfbbf24, 1);
      g.fillCircle(15, 15, 13);
      g.fillStyle(0xfde68a, 1);
      g.fillCircle(15, 15, 8);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(13, 8, 4, 14);
      g.fillStyle(0xfffbeb, 0.9);
      g.fillCircle(10, 10, 2);
      g.lineStyle(1.5, 0xb45309, 0.7);
      g.strokeCircle(15, 15, 13);
    });

    drawTexture(this, "er-dust", 16, 16, (g) => {
      g.fillStyle(0xe8e2d6, 1);
      g.fillCircle(8, 8, 7);
    });

    drawTexture(this, "er-spark", 14, 14, (g) => {
      g.fillStyle(0xfff3c4, 1);
      g.fillPoints(
        [
          new Phaser.Math.Vector2(7, 0),
          new Phaser.Math.Vector2(9, 5),
          new Phaser.Math.Vector2(14, 7),
          new Phaser.Math.Vector2(9, 9),
          new Phaser.Math.Vector2(7, 14),
          new Phaser.Math.Vector2(5, 9),
          new Phaser.Math.Vector2(0, 7),
          new Phaser.Math.Vector2(5, 5),
        ],
        true,
      );
    });
  }

  private createAnimations() {
    // Each pose is its own texture key, so animations reference frames across
    // different textures directly — no packed spritesheet/atlas required.
    const anim = (key: string, poses: HeroPoseKey[], frameRate: number, repeat: number) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: poses.map((pose) => ({ key: heroTexKey(pose) })),
        frameRate,
        repeat,
      });
    };
    anim("idle", ["idle"], 1, -1);
    anim("run", ["walk1", "walk2"], 8, -1);
    anim("jump", ["jump"], 1, 0);
    anim("fall", ["fall"], 1, 0);
    anim("slide", ["slide"], 1, 0);
    anim("hurt", ["hurt"], 1, 0);
  }

  // ---- Body sizing & animation state ---------------------------------------

  // Sizes/offsets are in the native 80x110 sprite frame; Arcade Physics scales
  // both automatically by the sprite's current scale (HERO_SCALE), so this
  // stays correct regardless of the real-asset vs. procedural-fallback path.
  // Measured against the real sprites' opaque pixel bounds, then trimmed in —
  // torso-core sized for standing/airborne, a low band for the prone slide.
  private setPlayerBody(sliding: boolean) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (sliding) {
      body.setSize(54, 34);
      body.setOffset(13, 68);
    } else {
      body.setSize(34, 86);
      body.setOffset(23, 16);
    }
  }

  private applyPlayerState(next: PlayerAnimState) {
    if (this.playerState === next) return;
    this.playerState = next;
    this.player.anims.play(next, true);
  }

  // ---- Public control surface (called from React) -------------------------

  start() {
    if (!this.ready) return;
    if (this.phase === "over") {
      this.resetRun();
    }
    this.phase = "playing";
    this.physics.resume();
    this.callbacks.onEvent("start");
    this.emitPhase();
  }

  pauseRun() {
    if (this.phase !== "playing") return;
    this.phase = "paused";
    this.physics.pause();
    this.emitPhase();
  }

  resumeRun() {
    if (this.phase !== "paused") return;
    this.phase = "playing";
    this.physics.resume();
    this.emitPhase();
  }

  restart() {
    this.resetRun();
    this.phase = "playing";
    this.physics.resume();
    this.callbacks.onEvent("start");
    this.emitPhase();
  }

  jump() {
    if (!this.ready) return;
    if (this.phase === "idle" || this.phase === "over") {
      this.start();
      return;
    }
    if (this.phase !== "playing") return;
    // Early part of a slide can't be cancelled into a jump — it has to commit.
    if (this.sliding && this.time.now < this.slideJumpLockUntil) return;

    const withinCoyote = this.time.now - this.lastGroundedAt <= COYOTE_MS;
    if (this.grounded || withinCoyote) {
      this.performJump();
    } else {
      // Buffer the press so an early tap still lands the jump the instant we touch down.
      this.jumpBufferUntil = this.time.now + JUMP_BUFFER_MS;
    }
  }

  private performJump() {
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocityY(JUMP_VELOCITY);
    this.grounded = false;
    this.jumpBufferUntil = 0;
    this.endSlide();
    this.dustEmitter.explode(6, this.player.x, GROUND_TOP - 2);
    this.player.setScale(0.9, 1.15);
    this.tweens.add({ targets: this.player, scaleX: 1, scaleY: 1, duration: 160, ease: "Sine.Out" });
    this.callbacks.onEvent("jump");
  }

  slide() {
    if (!this.ready || this.phase !== "playing") return;
    if (!this.grounded) {
      // Airborne: fast drop.
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocityY(-JUMP_VELOCITY * 0.9);
      return;
    }
    this.sliding = true;
    this.slideUntil = this.time.now + SLIDE_MS;
    this.slideJumpLockUntil = this.time.now + SLIDE_JUMP_LOCK_MS;
    this.setPlayerBody(true);
    this.callbacks.onEvent("slide");
  }

  private endSlide() {
    if (!this.sliding) return;
    this.sliding = false;
    this.setPlayerBody(false);
  }

  private resetRun() {
    // Kill any in-flight tween (invuln blink, jump squash, death tint) before
    // touching visual state, so nothing from the previous run can bleed in.
    this.tweens.killTweensOf(this.player);

    this.speed = START_SPEED;
    this.distance = 0;
    this.score = 0;
    this.lives = MAX_LIVES;
    this.obstacleAcc = 0;
    this.obstacleGap = 650;
    this.coinAcc = 0;
    this.coinGap = 900;
    this.obstacleQueue = [];
    this.lastObstacleAction = null;
    this.invulnUntil = 0;
    this.hurtUntil = 0;
    this.runTimeMs = 0;
    this.jumpBufferUntil = 0;
    this.slideJumpLockUntil = 0;
    this.slideUntil = 0;
    this.statTimer = 0;
    this.lastEmitted = null;

    this.endSlide();
    this.obstacles.getChildren().forEach((child) => this.recycleObstacle(child as Phaser.Physics.Arcade.Image));
    this.coins.getChildren().forEach((child) => this.recycleCoin(child as Phaser.Physics.Arcade.Image));

    this.player.setAlpha(1);
    this.player.clearTint();
    this.player.setScale(1, 1);
    this.player.setPosition(PLAYER_X, GROUND_TOP);
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.grounded = true;
    this.lastGroundedAt = 0;
    this.applyPlayerState("idle");
  }

  // ---- Object pooling -------------------------------------------------------

  private recycleObstacle(image: Phaser.Physics.Arcade.Image) {
    if (!image.active) return;
    image.setActive(false).setVisible(false);
    const body = image.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
    image.setAlpha(1);
    image.clearTint();
    image.setData("hit", false);
    image.setData("hitAt", 0);
  }

  private recycleCoin(coin: Phaser.Physics.Arcade.Image) {
    if (!coin.active) return;
    coin.setActive(false).setVisible(false);
    const body = coin.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
    coin.setAlpha(1);
    coin.clearTint();
    coin.setScale(1, 1);
  }

  // ---- Spawning: pattern manager + speed-aware fairness gaps ---------------

  private nextObstacleKind(): ObstacleKind {
    if (this.obstacleQueue.length === 0) {
      const inGrace = this.runTimeMs < GRACE_MS;
      const late = this.runTimeMs >= DIFFICULTY_STAGE_MS;
      const pool = inGrace ? EARLY_PATTERNS : late ? CORE_PATTERNS.concat(LATE_PATTERNS) : CORE_PATTERNS;
      const pattern = pool[Math.floor(Math.random() * pool.length)];
      this.obstacleQueue.push(...pattern);
    }
    return this.obstacleQueue.shift() as ObstacleKind;
  }

  // Minimum fair pixel gap for the *next* obstacle, given the current speed
  // and what action the *previous* obstacle required. A fixed pixel floor
  // becomes unfair as speed ramps up; deriving it from time keeps it fair at
  // any speed, and after DIFFICULTY_STAGE_MS the extra difficulty only ever
  // comes from tighter same-action combos or longer patterns — never from an
  // impossible gap.
  private minGapPx(nextAction: ObstacleAction): number {
    const reactionPx = this.speed * (REACTION_MS / 1000);
    const switchingAction = this.lastObstacleAction !== null && this.lastObstacleAction !== nextAction;
    if (!switchingAction) {
      return reactionPx + this.speed * (SAME_ACTION_BUFFER_MS / 1000);
    }
    // The previous obstacle's action determines how long the player is
    // occupied (mid-air, or crouched) before they're free to react again.
    const previousManeuverMs = this.lastObstacleAction === "jump" ? JUMP_AIRTIME_MS : SLIDE_MS;
    return reactionPx + this.speed * ((previousManeuverMs + SWITCH_ACTION_BUFFER_MS) / 1000);
  }

  private spawnObstacle(): boolean {
    const inGrace = this.runTimeMs < GRACE_MS;
    const kind = this.nextObstacleKind();
    const action = OBSTACLE_ACTION[kind];
    const key = `er-${kind}`;
    let y = GROUND_TOP;
    let originY = 1;
    if (kind === "bird" || kind === "branch") {
      // Flies at head/jump height: slide under it, or time a jump.
      y = GROUND_TOP - 60;
      originY = 0.5;
    }

    const obstacle = this.obstacles.get(WORLD_WIDTH + 60, y, key) as Phaser.Physics.Arcade.Image | null;
    if (!obstacle) return false; // pool exhausted this tick; retry next frame

    obstacle.setTexture(key);
    obstacle.setPosition(WORLD_WIDTH + 60, y);
    obstacle.setOrigin(0.5, originY);
    obstacle.setDepth(4);
    obstacle.setActive(true).setVisible(true).setAlpha(1);
    obstacle.clearTint();
    const body = obstacle.body as Phaser.Physics.Arcade.Body;
    body.reset(WORLD_WIDTH + 60, y);
    body.enable = true;
    body.setAllowGravity(false);
    // Slightly forgiving hitbox — smaller than the sprite, never larger.
    body.setSize(obstacle.width * 0.7, obstacle.height * 0.72);
    body.setOffset(obstacle.width * 0.15, obstacle.height * 0.18);
    obstacle.setVelocityX(-this.speed);
    obstacle.setData("requiresSlide", action === "slide");
    obstacle.setData("hit", false);
    obstacle.setData("hitAt", 0);

    this.obstacleGap = this.minGapPx(action) + Math.random() * (inGrace ? 220 : 160);
    this.lastObstacleAction = action;
    return true;
  }

  private spawnCoins() {
    const count = 1 + Math.floor(Math.random() * 3);
    const baseY = GROUND_TOP - 70 - Math.random() * 70;
    for (let i = 0; i < count; i += 1) {
      const x = WORLD_WIDTH + 40 + i * 34;
      const coin = this.coins.get(x, baseY, "er-coin") as Phaser.Physics.Arcade.Image | null;
      if (!coin) continue;
      coin.setTexture("er-coin");
      coin.setPosition(x, baseY);
      coin.setOrigin(0.5, 0.5);
      coin.setDepth(4);
      coin.setActive(true).setVisible(true).setAlpha(1);
      coin.clearTint();
      const body = coin.body as Phaser.Physics.Arcade.Body;
      body.reset(x, baseY);
      body.enable = true;
      body.setAllowGravity(false);
      coin.setVelocityX(-this.speed);
    }
  }

  // ---- Collisions ---------------------------------------------------------

  private handleHit(obstacle: Phaser.Physics.Arcade.Image) {
    if (this.phase !== "playing") return;
    // Only active, unresolved, on-screen obstacles can hurt the player.
    if (!obstacle.active || !obstacle.visible || obstacle.getData("hit")) return;
    if (this.time.now < this.invulnUntil) return;
    // Sliding clears a bird/branch cleanly (extra fairness).
    if (this.sliding && obstacle.getData("requiresSlide")) return;

    // Don't recycle the obstacle yet — freeze it in place so the player can
    // see exactly what hit them. It's cleaned up later in update() (or on
    // the next restart), never destroyed, since it's a pooled object.
    obstacle.setData("hit", true);
    obstacle.setData("hitAt", this.time.now);
    const obstacleBody = obstacle.body as Phaser.Physics.Arcade.Body;
    obstacleBody.setVelocityX(0);
    obstacleBody.enable = false;

    this.lives -= 1;
    this.hurtUntil = this.time.now + HURT_POSE_MS;
    this.cameras.main.shake(180, 0.01);
    this.sparkEmitter.setParticleTint(0xff6b6b);
    this.sparkEmitter.explode(10, this.player.x, this.player.y - 30);
    this.callbacks.onEvent("hit");

    if (this.lives <= 0) {
      this.gameOver();
      return;
    }

    // Shield-style invulnerability feedback: a cool tint plus a blink, capped
    // duration so it never keeps animating once the run actually ends.
    this.invulnUntil = this.time.now + INVULN_MS;
    this.tweens.killTweensOf(this.player);
    this.player.setTint(0x7dd3fc);
    this.tweens.add({
      targets: this.player,
      alpha: 0.35,
      duration: 120,
      yoyo: true,
      repeat: Math.floor(INVULN_MS / 240),
      onComplete: () => {
        this.player.setAlpha(1);
        this.player.clearTint();
      },
    });
    this.emitPhase();
  }

  private handleCoin(coin: Phaser.Physics.Arcade.Image) {
    this.recycleCoin(coin);
    this.score += 25;
    this.sparkEmitter.setParticleTint(0xfde68a);
    this.sparkEmitter.explode(8, coin.x, coin.y);
    this.callbacks.onEvent("coin");
    // No emitPhase() here on purpose: score changes flow through the
    // throttled onStats channel only, never through React state.
  }

  private gameOver() {
    this.phase = "over";
    this.physics.pause();
    // No tween may survive into the next run or keep animating forever once
    // the run has actually ended.
    this.tweens.killTweensOf(this.player);
    this.player.setAlpha(1);
    this.player.setTint(0xff6b6b);
    if (this.score > this.best) this.best = this.score;
    this.callbacks.onEvent("over");
    this.emitPhase();
  }

  // ---- HUD / stats ----------------------------------------------------------

  private emitPhase() {
    const changed =
      this.lastEmitted === null ||
      this.lastEmitted.phase !== this.phase ||
      this.lastEmitted.lives !== this.lives ||
      this.lastEmitted.best !== this.best;
    if (!changed) return;
    this.lastEmitted = { phase: this.phase, lives: this.lives, best: this.best };
    this.callbacks.onHud({
      phase: this.phase,
      score: this.score,
      distance: Math.floor(this.distance),
      speed: Math.round(this.speed),
      lives: this.lives,
    });
  }

  private emitStats() {
    this.callbacks.onStats({
      score: this.score,
      distance: Math.floor(this.distance),
      speed: Math.round(this.speed),
    });
  }

  // ---- Main loop ----------------------------------------------------------

  update(_time: number, deltaMs: number) {
    if (!this.ready) return;
    const dt = Math.min(0.033, deltaMs / 1000);

    // Parallax always drifts a little so the scene never looks frozen.
    const drift = this.phase === "playing" ? this.speed : START_SPEED * 0.25;
    this.layer1.tilePositionX += drift * 0.12 * dt;
    this.layer2.tilePositionX += drift * 0.4 * dt;
    if (this.phase === "playing") this.ground.tilePositionX += this.speed * dt;

    if (this.phase !== "playing") {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      if (this.phase === "idle" || this.phase === "paused") this.applyPlayerState("idle");
      this.renderDebug();
      return;
    }

    const wasGrounded = this.grounded;

    // Ground clamp (manual so we need no static collider).
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.player.y >= GROUND_TOP) {
      this.player.y = GROUND_TOP;
      if (body.velocity.y > 0) body.setVelocityY(0);
      this.grounded = true;
      this.lastGroundedAt = this.time.now;
    } else {
      this.grounded = false;
    }

    // Just landed: a small squash + dust puff for readability, scaled by how
    // hard the landing was.
    if (this.grounded && !wasGrounded) {
      this.player.setScale(1.18, 0.82);
      this.tweens.add({ targets: this.player, scaleX: 1, scaleY: 1, duration: 130, ease: "Sine.Out" });
      this.dustEmitter.explode(5, this.player.x, GROUND_TOP - 2);
    }

    // A jump pressed just before landing still fires the instant we touch down.
    if (this.grounded && this.jumpBufferUntil > 0 && this.time.now <= this.jumpBufferUntil) {
      this.performJump();
    }

    // Three-tier gravity for a natural arc: strong rise, soft hang near the
    // apex, faster fall. Obstacles/coins have allowGravity:false, so retuning
    // world gravity here only ever affects the player.
    if (this.grounded) {
      this.physics.world.gravity.y = FALL_GRAVITY;
    } else if (body.velocity.y < -APEX_VELOCITY_THRESHOLD) {
      this.physics.world.gravity.y = RISE_GRAVITY;
    } else if (body.velocity.y > APEX_VELOCITY_THRESHOLD) {
      this.physics.world.gravity.y = FALL_GRAVITY;
    } else {
      this.physics.world.gravity.y = APEX_GRAVITY;
    }

    // Slide timing.
    if (this.sliding && this.time.now >= this.slideUntil) this.endSlide();

    // Shadow follows the player and shrinks/fades with jump height, so it
    // reads as ground contact feedback rather than a static decal.
    const airHeight = Math.max(0, GROUND_TOP - this.player.y);
    const shadowT = Math.max(0.25, 1 - airHeight / 160);
    this.playerShadow.x = this.player.x;
    this.playerShadow.setScale(shadowT, shadowT);
    this.playerShadow.setAlpha(0.32 * shadowT);

    // Animation state: hurt pose briefly wins, then slide, then air states,
    // then run/idle on the ground.
    if (this.time.now < this.hurtUntil) {
      this.applyPlayerState("hurt");
    } else if (this.sliding) {
      this.applyPlayerState("slide");
    } else if (!this.grounded) {
      this.applyPlayerState(body.velocity.y < 0 ? "jump" : "fall");
    } else {
      this.applyPlayerState("run");
    }

    // Difficulty: flat speed during the opening grace window, then a gentle,
    // time-based ramp (never a sudden jump) up to the speed cap.
    this.runTimeMs += dt * 1000;
    this.distance += this.speed * dt * 0.03;
    if (this.runTimeMs < GRACE_MS) {
      this.speed = START_SPEED;
    } else {
      this.speed = Math.min(MAX_SPEED, START_SPEED + (this.runTimeMs - GRACE_MS) * RAMP_RATE);
    }
    this.score = Math.max(this.score, Math.floor(this.distance));

    // Keep moving objects locked to current speed.
    this.obstacles.setVelocityX(-this.speed);
    this.coins.setVelocityX(-this.speed);

    // Obstacle spawning by pixel spacing (fair regardless of speed).
    // spawnObstacle() sets this.obstacleGap for the *next* spawn itself, since
    // that spacing depends on the grace window and which action is required.
    this.obstacleAcc += this.speed * dt;
    if (this.obstacleAcc >= this.obstacleGap) {
      const spawned = this.spawnObstacle();
      if (spawned) this.obstacleAcc = 0;
    }

    // Coin spawning.
    this.coinAcc += this.speed * dt;
    if (this.coinAcc >= this.coinGap) {
      this.coinAcc = 0;
      this.spawnCoins();
      this.coinGap = 820 + Math.random() * 520;
    }

    // Recycle objects, but only once collision has clearly resolved: a hit
    // obstacle is frozen in place and stays visible for HIT_FREEZE_MS before
    // it's recycled; everything else is only recycled once it's off-screen.
    // Pooled objects are reused via group.get(), never destroyed, so object
    // counts stay bounded no matter how long the run lasts.
    for (const child of this.obstacles.getChildren()) {
      const image = child as Phaser.Physics.Arcade.Image;
      if (!image.active) continue;
      if (image.getData("hit")) {
        const hitAt = image.getData("hitAt") as number;
        if (this.time.now - hitAt >= HIT_FREEZE_MS) this.recycleObstacle(image);
        continue;
      }
      if (image.x < -120) this.recycleObstacle(image);
    }
    let coinCount = 0;
    for (const child of this.coins.getChildren()) {
      const coin = child as Phaser.Physics.Arcade.Image;
      if (!coin.active) continue;
      coinCount += 1;
      // Cheap spin illusion: no per-coin tweens to manage/clean up.
      coin.scaleX = Math.abs(Math.sin(this.time.now / 220 + coin.y));
      if (coin.x < -80) this.recycleCoin(coin);
    }

    // React only ever hears about score/distance/speed via this throttled,
    // non-setState channel — see EndlessRunnerGame.tsx.
    this.statTimer += dt;
    if (this.statTimer >= STAT_EMIT_MS / 1000) {
      this.statTimer = 0;
      this.emitStats();
    }

    this.renderDebug(coinCount);
  }

  private renderDebug(coinCountHint?: number) {
    if (!this.debugMode || !this.debugText) return;
    this.debugTimer += 1;
    if (this.debugTimer % 6 !== 0) return; // ~10x/sec at 60fps, not every frame
    const obstacleCount = this.obstacles.countActive(true);
    const coinCount = coinCountHint ?? this.coins.countActive(true);
    const fps = Math.round(this.game.loop.actualFps);
    this.debugText.setText(
      `FPS ${fps} | speed ${Math.round(this.speed)} | obstacles ${obstacleCount}/${MAX_OBSTACLES} | coins ${coinCount}/${MAX_COINS} | phase ${this.phase}`,
    );
  }
}

export function launchRunner(
  parent: HTMLElement,
  callbacks: RunnerCallbacks,
  best: number,
): RunnerControls {
  const scene = new RunnerScene(callbacks, best);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    backgroundColor: LIFE,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: "arcade", arcade: { gravity: { x: 0, y: FALL_GRAVITY }, debug: DEBUG_HITBOXES } },
    scene,
    audio: { noAudio: true },
    banner: false,
  });

  return {
    start: () => scene.start(),
    pause: () => scene.pauseRun(),
    resume: () => scene.resumeRun(),
    restart: () => scene.restart(),
    jump: () => scene.jump(),
    slide: () => scene.slide(),
    destroy: () => game.destroy(true),
  };
}
