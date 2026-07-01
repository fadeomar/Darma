"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Maximize2, Minimize2, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameDefinition } from "../../domain/game";

type Phase = "idle" | "playing" | "paused" | "won" | "lost";
type DirectionName = "left" | "right" | "up" | "down" | "none";
type Tile = "#" | "." | "o" | "-" | "G" | " ";
type GhostId = "blinky" | "pinky" | "inky" | "clyde";

type Direction = { name: DirectionName; x: number; y: number; angle1: number; angle2: number };
type Actor = {
  x: number;
  y: number;
  dir: DirectionName;
  nextDir: DirectionName;
  speed: number;
};
type GhostActor = Actor & {
  id: GhostId;
  eaten: boolean;
  scatter: { col: number; row: number };
  spawnCol: number;
  spawnRow: number;
  releaseDelay: number;
};
type Fruit = { col: number; row: number; ttl: number; eaten: boolean } | null;
type PacmanModel = {
  phase: Phase;
  score: number;
  best: number;
  level: number;
  lives: number;
  pelletsLeft: number;
  elapsed: number;
  powerTimer: number;
  ghostCombo: number;
  mouth: number;
  mouthDirection: 1 | -1;
  map: Tile[][];
  pacman: Actor;
  ghosts: GhostActor[];
  fruit: Fruit;
  message: string;
};

type HudState = {
  phase: Phase;
  score: number;
  best: number;
  level: number;
  lives: number;
  pelletsLeft: number;
  powerTimer: number;
  message: string;
};

const STORAGE_KEY = "darma:pacman-canvas:best-score";
const MUTE_KEY = "darma:pacman-canvas:muted";
const TILE_SIZE = 30;
const WORLD_WIDTH = 540;
const WORLD_HEIGHT = 390;
const MAX_LEVEL = 10;
const PACMAN_RADIUS = 14;
const GHOST_SIZE = 30;
const GHOST_COLLISION_RADIUS = 18;
const BASE_PACMAN_SPEED = 118;
const BASE_GHOST_SPEED = 96;
const POWER_DURATION = 7600;
const FRUIT_DURATION = 9000;
const MAP_TEMPLATE = [
  "##################",
  "#o..#........#..o#",
  "#.#...##..##...#.#",
  "#.##.#......#.##.#",
  "#..#...#--#...#..#",
  "##.##.#GGGG#.##.##",
  "......######......",
  "##.##........##.##",
  "##.#####..#####.##",
  "#...##......##...#",
  "#.#....####....#.#",
  "#o..##......##..o#",
  "##################",
] as const;

const DIRECTIONS: Record<DirectionName, Direction> = {
  right: { name: "right", x: 1, y: 0, angle1: 0.18, angle2: 1.82 },
  left: { name: "left", x: -1, y: 0, angle1: 1.18, angle2: 0.82 },
  up: { name: "up", x: 0, y: -1, angle1: 1.68, angle2: 1.32 },
  down: { name: "down", x: 0, y: 1, angle1: 0.68, angle2: 0.32 },
  none: { name: "none", x: 0, y: 0, angle1: 0.18, angle2: 1.82 },
};

const OPPOSITE: Record<DirectionName, DirectionName> = {
  left: "right",
  right: "left",
  up: "down",
  down: "up",
  none: "none",
};

const GHOST_ASSETS: Record<GhostId, Record<Exclude<DirectionName, "none"> | "default", string>> = {
  blinky: {
    default: "/games/pacman/ghost/blinky/blinky.svg",
    left: "/games/pacman/ghost/blinky/blinky_left.svg",
    right: "/games/pacman/ghost/blinky/blinky_right.svg",
    up: "/games/pacman/ghost/blinky/blinky_up.svg",
    down: "/games/pacman/ghost/blinky/blinky_down.svg",
  },
  pinky: {
    default: "/games/pacman/ghost/pinky/pinky.svg",
    left: "/games/pacman/ghost/pinky/pinky_left.svg",
    right: "/games/pacman/ghost/pinky/pinky_right.svg",
    up: "/games/pacman/ghost/pinky/pinky_up.svg",
    down: "/games/pacman/ghost/pinky/pinky_down.svg",
  },
  inky: {
    default: "/games/pacman/ghost/inky/inky.svg",
    left: "/games/pacman/ghost/inky/inky_left.svg",
    right: "/games/pacman/ghost/inky/inky_right.svg",
    up: "/games/pacman/ghost/inky/inky_up.svg",
    down: "/games/pacman/ghost/inky/inky_down.svg",
  },
  clyde: {
    default: "/games/pacman/ghost/clyde/clyde.svg",
    left: "/games/pacman/ghost/clyde/clyde_left.svg",
    right: "/games/pacman/ghost/clyde/clyde_right.svg",
    up: "/games/pacman/ghost/clyde/clyde_up.svg",
    down: "/games/pacman/ghost/clyde/clyde_down.svg",
  },
};

const DAZZLED_ASSETS: Record<Exclude<DirectionName, "none"> | "default", string> = {
  default: "/games/pacman/ghost/dazzled/dazzled.svg",
  left: "/games/pacman/ghost/dazzled/dazzled_left.svg",
  right: "/games/pacman/ghost/dazzled/dazzled_right.svg",
  up: "/games/pacman/ghost/dazzled/dazzled_up.svg",
  down: "/games/pacman/ghost/dazzled/dazzled_down.svg",
};

const DEAD_ASSETS: Record<Exclude<DirectionName, "none"> | "default", string> = {
  default: "/games/pacman/ghost/dead/dead.svg",
  left: "/games/pacman/ghost/dead/dead_left.svg",
  right: "/games/pacman/ghost/dead/dead_right.svg",
  up: "/games/pacman/ghost/dead/dead_up.svg",
  down: "/games/pacman/ghost/dead/dead_down.svg",
};

type AudioName = "theme" | "waka" | "powerpill" | "eatghost" | "die";

function readNumber(key: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function writeBest(score: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(score));
}

function readMuted() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "true";
}

function writeMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUTE_KEY, muted ? "true" : "false");
}

function cloneMap(): Tile[][] {
  return MAP_TEMPLATE.map((row) => row.split("") as Tile[]);
}

function countPellets(map: Tile[][]) {
  return map.reduce((total, row) => total + row.filter((tile) => tile === "." || tile === "o").length, 0);
}

function cellCenter(col: number, row: number) {
  return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
}

function gridFromPosition(x: number, y: number) {
  return {
    col: Math.floor(((x + WORLD_WIDTH) % WORLD_WIDTH) / TILE_SIZE),
    row: Math.floor(Math.max(0, Math.min(WORLD_HEIGHT - 1, y)) / TILE_SIZE),
  };
}

function isCenterAligned(actor: Actor, threshold = 3.2) {
  const col = Math.round((actor.x - TILE_SIZE / 2) / TILE_SIZE);
  const row = Math.round((actor.y - TILE_SIZE / 2) / TILE_SIZE);
  const center = cellCenter(col, row);
  return Math.abs(actor.x - center.x) <= threshold && Math.abs(actor.y - center.y) <= threshold;
}

function snapToCenter(actor: Actor) {
  const col = Math.round((actor.x - TILE_SIZE / 2) / TILE_SIZE);
  const row = Math.round((actor.y - TILE_SIZE / 2) / TILE_SIZE);
  const center = cellCenter(col, row);
  actor.x = center.x;
  actor.y = center.y;
}

function getTile(map: Tile[][], col: number, row: number): Tile {
  if (row < 0 || row >= map.length) return "#";
  const width = map[0]?.length ?? 0;
  const wrappedCol = ((col % width) + width) % width;
  return map[row]?.[wrappedCol] ?? "#";
}

function canMove(map: Tile[][], actor: Actor, dirName: DirectionName, actorType: "pacman" | "ghost") {
  if (dirName === "none") return false;
  const dir = DIRECTIONS[dirName];
  const { col, row } = gridFromPosition(actor.x, actor.y);
  const nextCol = col + dir.x;
  const nextRow = row + dir.y;
  const tile = getTile(map, nextCol, nextRow);
  if (tile === "#") return false;
  if (actorType === "pacman" && (tile === "-" || tile === "G")) return false;
  return true;
}

function moveActor(map: Tile[][], actor: Actor, dt: number, actorType: "pacman" | "ghost") {
  if (isCenterAligned(actor)) {
    snapToCenter(actor);
    if (actor.nextDir !== actor.dir && canMove(map, actor, actor.nextDir, actorType)) {
      actor.dir = actor.nextDir;
    }
    if (!canMove(map, actor, actor.dir, actorType)) {
      actor.dir = "none";
    }
  }

  const dir = DIRECTIONS[actor.dir];
  actor.x += dir.x * actor.speed * dt;
  actor.y += dir.y * actor.speed * dt;

  if (actor.x < -TILE_SIZE / 2) actor.x = WORLD_WIDTH + TILE_SIZE / 2;
  if (actor.x > WORLD_WIDTH + TILE_SIZE / 2) actor.x = -TILE_SIZE / 2;
  actor.y = Math.max(TILE_SIZE / 2, Math.min(WORLD_HEIGHT - TILE_SIZE / 2, actor.y));
}

function createGhosts(level: number): GhostActor[] {
  const speed = BASE_GHOST_SPEED + Math.min(34, level * 5);
  const positions: Array<{ id: GhostId; col: number; row: number; dir: DirectionName; scatter: { col: number; row: number }; delay: number }> = [
    { id: "blinky", col: 8, row: 5, dir: "up", scatter: { col: 16, row: 1 }, delay: 0 },
    { id: "pinky", col: 7, row: 5, dir: "right", scatter: { col: 1, row: 1 }, delay: 900 },
    { id: "inky", col: 9, row: 5, dir: "left", scatter: { col: 16, row: 11 }, delay: 2200 },
    { id: "clyde", col: 10, row: 5, dir: "left", scatter: { col: 1, row: 11 }, delay: 3600 },
  ];
  return positions.map((ghost) => {
    const center = cellCenter(ghost.col, ghost.row);
    return {
      id: ghost.id,
      x: center.x,
      y: center.y,
      dir: ghost.dir,
      nextDir: ghost.dir,
      speed,
      eaten: false,
      scatter: ghost.scatter,
      spawnCol: ghost.col,
      spawnRow: ghost.row,
      releaseDelay: ghost.delay,
    };
  });
}

function createModel(best: number): PacmanModel {
  const map = cloneMap();
  const start = cellCenter(0, 6);
  return {
    phase: "idle",
    score: 0,
    best,
    level: 1,
    lives: 3,
    pelletsLeft: countPellets(map),
    elapsed: 0,
    powerTimer: 0,
    ghostCombo: 0,
    mouth: 0.22,
    mouthDirection: 1,
    map,
    pacman: {
      x: start.x,
      y: start.y,
      dir: "none",
      nextDir: "right",
      speed: BASE_PACMAN_SPEED,
    },
    ghosts: createGhosts(1),
    fruit: null,
    message: "Press Start to play",
  };
}

function resetPositions(model: PacmanModel) {
  const start = cellCenter(0, 6);
  model.pacman.x = start.x;
  model.pacman.y = start.y;
  model.pacman.dir = "none";
  model.pacman.nextDir = "right";
  model.ghosts = createGhosts(model.level);
  model.powerTimer = 0;
  model.ghostCombo = 0;
}

function startNextLevel(model: PacmanModel) {
  model.level += 1;
  model.map = cloneMap();
  model.pelletsLeft = countPellets(model.map);
  model.fruit = null;
  model.pacman.speed = BASE_PACMAN_SPEED + Math.min(28, model.level * 4);
  resetPositions(model);
  model.phase = "paused";
  model.message = `Level ${model.level} ready`;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function squaredGridDistance(col: number, row: number, target: { col: number; row: number }) {
  return (col - target.col) ** 2 + (row - target.row) ** 2;
}

function legalGhostDirections(map: Tile[][], ghost: GhostActor) {
  const dirs = (["left", "right", "up", "down"] as DirectionName[]).filter((dir) => canMove(map, ghost, dir, "ghost"));
  const withoutReverse = dirs.filter((dir) => dir !== OPPOSITE[ghost.dir]);
  return withoutReverse.length > 0 ? withoutReverse : dirs;
}

function ghostTarget(model: PacmanModel, ghost: GhostActor, index: number): { col: number; row: number } {
  const pac = gridFromPosition(model.pacman.x, model.pacman.y);
  const pacDir = DIRECTIONS[model.pacman.dir === "none" ? model.pacman.nextDir : model.pacman.dir];
  if (ghost.eaten) return { col: ghost.spawnCol, row: ghost.spawnRow };
  if (model.powerTimer > 0) return ghost.scatter;
  if (ghost.id === "blinky") return pac;
  if (ghost.id === "pinky") return { col: pac.col + pacDir.x * 4, row: pac.row + pacDir.y * 4 };
  if (ghost.id === "inky") return index % 2 === 0 ? pac : { col: pac.col + pacDir.x * 2, row: pac.row + pacDir.y * 2 };
  const ghostGrid = gridFromPosition(ghost.x, ghost.y);
  return squaredGridDistance(ghostGrid.col, ghostGrid.row, pac) < 18 ? ghost.scatter : pac;
}

function chooseGhostDirection(model: PacmanModel, ghost: GhostActor, index: number) {
  if (!isCenterAligned(ghost)) return;
  snapToCenter(ghost);
  if (ghost.releaseDelay > 0) {
    ghost.releaseDelay -= 120;
    ghost.nextDir = ghost.dir;
    return;
  }
  const dirs = legalGhostDirections(model.map, ghost);
  if (dirs.length === 0) {
    ghost.nextDir = "none";
    return;
  }
  if (model.powerTimer > 0 && !ghost.eaten) {
    const currentGrid = gridFromPosition(ghost.x, ghost.y);
    const pacGrid = gridFromPosition(model.pacman.x, model.pacman.y);
    ghost.nextDir = dirs.slice().sort((a, b) => {
      const da = DIRECTIONS[a];
      const db = DIRECTIONS[b];
      return squaredGridDistance(currentGrid.col + db.x, currentGrid.row + db.y, pacGrid) - squaredGridDistance(currentGrid.col + da.x, currentGrid.row + da.y, pacGrid);
    })[0] ?? dirs[0];
    return;
  }
  const target = ghostTarget(model, ghost, index);
  const currentGrid = gridFromPosition(ghost.x, ghost.y);
  ghost.nextDir = dirs.slice().sort((a, b) => {
    const da = DIRECTIONS[a];
    const db = DIRECTIONS[b];
    return squaredGridDistance(currentGrid.col + da.x, currentGrid.row + da.y, target) - squaredGridDistance(currentGrid.col + db.x, currentGrid.row + db.y, target);
  })[0] ?? dirs[0];
}

function eatTile(model: PacmanModel, playSound: (name: AudioName) => void) {
  const { col, row } = gridFromPosition(model.pacman.x, model.pacman.y);
  const tile = getTile(model.map, col, row);
  if (tile === ".") {
    model.score += 10;
    model.pelletsLeft = Math.max(0, model.pelletsLeft - 1);
    model.map[row][col] = " ";
    playSound("waka");
  }
  if (tile === "o") {
    model.score += 50;
    model.pelletsLeft = Math.max(0, model.pelletsLeft - 1);
    model.map[row][col] = " ";
    model.powerTimer = POWER_DURATION;
    model.ghostCombo = 0;
    model.ghosts.forEach((ghost) => {
      if (!ghost.eaten) ghost.speed = Math.max(68, BASE_GHOST_SPEED - 24 + model.level * 2);
    });
    playSound("powerpill");
  }
  if (model.fruit && !model.fruit.eaten && model.fruit.col === col && model.fruit.row === row) {
    model.fruit.eaten = true;
    model.score += 200;
    playSound("waka");
  }
}

function loseLife(model: PacmanModel) {
  model.lives -= 1;
  if (model.lives <= 0) {
    model.phase = "lost";
    model.message = "Game Over";
  } else {
    resetPositions(model);
    model.phase = "paused";
    model.message = `${model.lives} ${model.lives === 1 ? "life" : "lives"} left`;
  }
}

function updateGame(model: PacmanModel, dt: number, playSound: (name: AudioName) => void) {
  if (model.phase !== "playing") return;
  model.elapsed += dt * 1000;
  if (!model.fruit && model.pelletsLeft < 72) {
    model.fruit = { col: 9, row: 9, ttl: FRUIT_DURATION, eaten: false };
  }
  if (model.fruit && !model.fruit.eaten) {
    model.fruit.ttl -= dt * 1000;
    if (model.fruit.ttl <= 0) model.fruit = null;
  }

  if (model.powerTimer > 0) {
    model.powerTimer = Math.max(0, model.powerTimer - dt * 1000);
    if (model.powerTimer <= 0) {
      model.ghostCombo = 0;
      model.ghosts.forEach((ghost) => {
        ghost.eaten = false;
        ghost.speed = BASE_GHOST_SPEED + Math.min(34, model.level * 5);
      });
    }
  }

  const mouthStep = dt * 4.3;
  model.mouth += mouthStep * model.mouthDirection;
  if (model.mouth > 0.27) {
    model.mouth = 0.27;
    model.mouthDirection = -1;
  }
  if (model.mouth < 0.04) {
    model.mouth = 0.04;
    model.mouthDirection = 1;
  }

  moveActor(model.map, model.pacman, dt, "pacman");
  eatTile(model, playSound);

  model.ghosts.forEach((ghost, index) => {
    chooseGhostDirection(model, ghost, index);
    const previousSpeed = ghost.speed;
    if (ghost.eaten) ghost.speed = BASE_GHOST_SPEED + 62;
    moveActor(model.map, ghost, dt, "ghost");
    ghost.speed = previousSpeed;

    if (ghost.eaten) {
      const home = cellCenter(ghost.spawnCol, ghost.spawnRow);
      if (distance(ghost, home) < 10) {
        ghost.eaten = false;
        ghost.speed = BASE_GHOST_SPEED + Math.min(34, model.level * 5);
      }
    }
  });

  for (const ghost of model.ghosts) {
    if (distance(model.pacman, ghost) < GHOST_COLLISION_RADIUS) {
      if (model.powerTimer > 0 && !ghost.eaten) {
        ghost.eaten = true;
        ghost.speed = BASE_GHOST_SPEED + 62;
        model.ghostCombo += 1;
        model.score += 100 * 2 ** Math.min(3, model.ghostCombo);
        playSound("eatghost");
      } else if (!ghost.eaten) {
        playSound("die");
        loseLife(model);
      }
      break;
    }
  }

  if (model.pelletsLeft <= 0 && model.phase === "playing") {
    if (model.level >= MAX_LEVEL) {
      model.phase = "won";
      model.message = "You cleared Pacman";
    } else {
      startNextLevel(model);
    }
  }

  if (model.score > model.best) {
    model.best = model.score;
    writeBest(model.best);
  }
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawMap(ctx: CanvasRenderingContext2D, model: PacmanModel) {
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.save();
  ctx.shadowColor = "rgba(22, 105, 255, 0.85)";
  ctx.shadowBlur = 7;
  for (let row = 0; row < model.map.length; row += 1) {
    for (let col = 0; col < model.map[row].length; col += 1) {
      const tile = model.map[row][col];
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      if (tile === "#") {
        const left = getTile(model.map, col - 1, row) === "#";
        const right = getTile(model.map, col + 1, row) === "#";
        const up = getTile(model.map, col, row - 1) === "#";
        const down = getTile(model.map, col, row + 1) === "#";
        ctx.fillStyle = "#0316a8";
        drawRoundRect(ctx, x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6, left || right || up || down ? 5 : 9);
        ctx.fill();
        ctx.strokeStyle = "#24a3ff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      if (tile === "-") {
        ctx.strokeStyle = "#ffd7ef";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + TILE_SIZE / 2);
        ctx.lineTo(x + TILE_SIZE - 3, y + TILE_SIZE / 2);
        ctx.stroke();
      }
      if (tile === ".") {
        ctx.fillStyle = "#fff7d7";
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (tile === "o") {
        const pulse = 5 + Math.sin(model.elapsed / 140) * 1.5;
        ctx.fillStyle = "#fff7d7";
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  if (model.fruit && !model.fruit.eaten) {
    const center = cellCenter(model.fruit.col, model.fruit.row);
    ctx.save();
    ctx.font = "24px Apple Color Emoji, Segoe UI Emoji, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🍒", center.x, center.y);
    ctx.restore();
  }
}

function drawPacman(ctx: CanvasRenderingContext2D, model: PacmanModel) {
  const pac = model.pacman;
  const dirName = pac.dir === "none" ? pac.nextDir : pac.dir;
  const dir = DIRECTIONS[dirName];
  ctx.save();
  ctx.fillStyle = "#ffeb1a";
  ctx.strokeStyle = "#ffeb1a";
  ctx.shadowColor = "rgba(255, 235, 26, 0.65)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(pac.x, pac.y);
  ctx.arc(pac.x, pac.y, PACMAN_RADIUS, (dir.angle1 + model.mouth) * Math.PI, (dir.angle2 - model.mouth) * Math.PI, false);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function resolveGhostAsset(model: PacmanModel, ghost: GhostActor) {
  const dir = (ghost.dir === "none" ? "default" : ghost.dir) as Exclude<DirectionName, "none"> | "default";
  if (ghost.eaten) return DEAD_ASSETS[dir];
  if (model.powerTimer > 0) return DAZZLED_ASSETS[dir];
  return GHOST_ASSETS[ghost.id][dir];
}

function drawGhostFallback(ctx: CanvasRenderingContext2D, ghost: GhostActor, scared: boolean) {
  const colors: Record<GhostId, string> = { blinky: "#ff2b2b", pinky: "#ffb5ff", inky: "#00e5ff", clyde: "#ffb000" };
  ctx.save();
  ctx.fillStyle = scared ? "#2437ff" : colors[ghost.id];
  ctx.beginPath();
  ctx.arc(ghost.x, ghost.y - 2, 12, Math.PI, 0);
  ctx.lineTo(ghost.x + 12, ghost.y + 12);
  ctx.lineTo(ghost.x + 6, ghost.y + 8);
  ctx.lineTo(ghost.x, ghost.y + 12);
  ctx.lineTo(ghost.x - 6, ghost.y + 8);
  ctx.lineTo(ghost.x - 12, ghost.y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(ghost.x - 5, ghost.y - 3, 3, 0, Math.PI * 2);
  ctx.arc(ghost.x + 5, ghost.y - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawActors(ctx: CanvasRenderingContext2D, model: PacmanModel, images: Map<string, HTMLImageElement>) {
  for (const ghost of model.ghosts) {
    const src = resolveGhostAsset(model, ghost);
    const image = images.get(src);
    if (image?.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, ghost.x - GHOST_SIZE / 2, ghost.y - GHOST_SIZE / 2, GHOST_SIZE, GHOST_SIZE);
    } else {
      drawGhostFallback(ctx, ghost, model.powerTimer > 0 && !ghost.eaten);
    }
  }
  drawPacman(ctx, model);
}

function drawOverlay(ctx: CanvasRenderingContext2D, model: PacmanModel) {
  if (model.phase === "playing") return;
  const title = model.phase === "idle" ? "PACMAN" : model.phase === "paused" ? model.message : model.phase === "won" ? "YOU WIN" : "GAME OVER";
  const hint = model.phase === "idle" ? "Press Start, Enter, or Space" : model.phase === "paused" ? "Press Resume to continue" : "Restart to play again";
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.fillStyle = "rgba(5, 5, 16, 0.9)";
  ctx.strokeStyle = "rgba(255, 235, 26, 0.82)";
  ctx.lineWidth = 2;
  drawRoundRect(ctx, 124, 128, 292, 132, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffeb1a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 28px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.fillText(title, WORLD_WIDTH / 2, 174);
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.font = "700 13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.fillText(hint, WORLD_WIDTH / 2, 210);
  ctx.fillStyle = "rgba(255,255,255,0.64)";
  ctx.font = "700 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.fillText(`Score ${model.score}  •  Best ${model.best}`, WORLD_WIDTH / 2, 234);
  ctx.restore();
}

function drawFrame(ctx: CanvasRenderingContext2D, model: PacmanModel, images: Map<string, HTMLImageElement>) {
  drawMap(ctx, model);
  drawActors(ctx, model, images);
  drawOverlay(ctx, model);
}

function toHud(model: PacmanModel): HudState {
  return {
    phase: model.phase,
    score: model.score,
    best: model.best,
    level: model.level,
    lives: model.lives,
    pelletsLeft: model.pelletsLeft,
    powerTimer: model.powerTimer,
    message: model.message,
  };
}

function uniqueAssetSources() {
  const sources = new Set<string>();
  Object.values(GHOST_ASSETS).forEach((assetGroup) => Object.values(assetGroup).forEach((src) => sources.add(src)));
  Object.values(DAZZLED_ASSETS).forEach((src) => sources.add(src));
  Object.values(DEAD_ASSETS).forEach((src) => sources.add(src));
  return Array.from(sources);
}

function DirectionButton({ label, direction, onDirection }: { label: string; direction: DirectionName; onDirection: (direction: DirectionName) => void }) {
  return (
    <button
      type="button"
      onClick={() => onDirection(direction)}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lg font-black text-white shadow-inner transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
      aria-label={`Move ${direction}`}
    >
      {label}
    </button>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2 shadow-inner">
      <p className="font-mono text-[9px] font-black uppercase tracking-[0.12em] text-yellow-200/75">{label}</p>
      <p className="mt-0.5 font-mono text-lg font-black leading-none text-white">{value}</p>
    </div>
  );
}

export function PacmanCanvasGame({ game }: { game: GameDefinition }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [muted, setMuted] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [hud, setHud] = useState<HudState>(() => toHud(createModel(0)));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<PacmanModel>(createModel(0));
  const imageMapRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const audioRef = useRef<Partial<Record<AudioName, HTMLAudioElement>>>({});
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const mutedRef = useRef(false);
  const focusModeRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastHudJsonRef = useRef("");

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    focusModeRef.current = focusMode;
  }, [focusMode]);

  const syncHud = useCallback(() => {
    const nextHud = toHud(modelRef.current);
    const signature = JSON.stringify(nextHud);
    if (signature !== lastHudJsonRef.current) {
      lastHudJsonRef.current = signature;
      setHud(nextHud);
    }
  }, []);

  const playSound = useCallback((name: AudioName) => {
    if (mutedRef.current) return;
    const audio = audioRef.current[name];
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, []);

  const unlockAudio = useCallback(() => {
    (Object.values(audioRef.current) as Array<HTMLAudioElement | undefined>).forEach((audio) => {
      if (!audio) return;
      audio.muted = true;
      void audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        })
        .catch(() => {
          audio.muted = false;
        });
    });
  }, []);

  useEffect(() => {
    const best = readNumber(STORAGE_KEY, 0);
    const nextModel = createModel(best);
    modelRef.current = nextModel;
    setHud(toHud(nextModel));
    const storedMuted = readMuted();
    mutedRef.current = storedMuted;
    setMuted(storedMuted);
    setHydrated(true);
  }, []);

  useEffect(() => {
    audioRef.current = {
      theme: new Audio("/games/pacman/audio/theme.mp3"),
      waka: new Audio("/games/pacman/audio/waka.mp3"),
      powerpill: new Audio("/games/pacman/audio/powerpill.mp3"),
      eatghost: new Audio("/games/pacman/audio/eatghost.mp3"),
      die: new Audio("/games/pacman/audio/die.mp3"),
    };
    (Object.values(audioRef.current) as Array<HTMLAudioElement | undefined>).forEach((audio) => {
      if (!audio) return;
      audio.preload = "auto";
      audio.volume = 0.45;
    });
    return () => {
      (Object.values(audioRef.current) as Array<HTMLAudioElement | undefined>).forEach((audio) => {
        if (!audio) return;
        audio.pause();
        audio.src = "";
      });
    };
  }, []);

  useEffect(() => {
    const sources = uniqueAssetSources();
    let loaded = 0;
    if (sources.length === 0) {
      setAssetsReady(true);
      return;
    }
    sources.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        loaded += 1;
        if (loaded >= sources.length) setAssetsReady(true);
      };
      img.onerror = () => {
        loaded += 1;
        if (loaded >= sources.length) setAssetsReady(true);
      };
      img.src = src;
      imageMapRef.current.set(src, img);
    });
  }, []);

  const renderNow = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const targetWidth = Math.round(WORLD_WIDTH * dpr);
    const targetHeight = Math.round(WORLD_HEIGHT * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFrame(context, modelRef.current, imageMapRef.current);
  }, []);

  useEffect(() => {
    let mounted = true;
    const frame = (time: number) => {
      if (!mounted) return;
      const previous = lastTimeRef.current ?? time;
      const dt = Math.min(0.05, Math.max(0, (time - previous) / 1000));
      lastTimeRef.current = time;
      updateGame(modelRef.current, dt, playSound);
      renderNow();
      syncHud();
      rafRef.current = window.requestAnimationFrame(frame);
    };
    rafRef.current = window.requestAnimationFrame(frame);
    return () => {
      mounted = false;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [playSound, renderNow, syncHud]);

  useEffect(() => {
    renderNow();
  }, [assetsReady, renderNow]);

  const setDirection = useCallback((direction: DirectionName) => {
    if (direction === "none") return;
    modelRef.current.pacman.nextDir = direction;
    if (modelRef.current.phase === "idle") {
      modelRef.current.message = "Press Start to play";
    }
    syncHud();
  }, [syncHud]);

  const startOrResume = useCallback(() => {
    unlockAudio();
    const model = modelRef.current;
    if (model.phase === "lost" || model.phase === "won") {
      const best = model.best;
      modelRef.current = createModel(best);
      modelRef.current.phase = "playing";
      modelRef.current.pacman.dir = "right";
    } else {
      model.phase = "playing";
      if (model.pacman.dir === "none") model.pacman.dir = model.pacman.nextDir === "none" ? "right" : model.pacman.nextDir;
    }
    modelRef.current.message = "Playing";
    lastTimeRef.current = null;
    playSound("theme");
    syncHud();
    renderNow();
  }, [playSound, renderNow, syncHud, unlockAudio]);

  const pauseGame = useCallback(() => {
    const model = modelRef.current;
    if (model.phase === "playing") {
      model.phase = "paused";
      model.message = "Paused";
      syncHud();
      renderNow();
    }
  }, [renderNow, syncHud]);

  const restartGame = useCallback(() => {
    unlockAudio();
    const best = modelRef.current.best;
    modelRef.current = createModel(best);
    modelRef.current.phase = "playing";
    modelRef.current.pacman.dir = "right";
    modelRef.current.message = "Playing";
    lastTimeRef.current = null;
    playSound("theme");
    syncHud();
    renderNow();
  }, [playSound, renderNow, syncHud, unlockAudio]);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      mutedRef.current = next;
      writeMuted(next);
      return next;
    });
  }, []);

  const toggleFocus = useCallback(() => {
    setFocusMode((current) => !current);
    window.setTimeout(() => renderNow(), 80);
  }, [renderNow]);

  const handleKeyboard = useCallback((event: KeyboardEvent) => {
    const tag = event.target instanceof HTMLElement ? event.target.tagName.toLowerCase() : "";
    if (["input", "textarea", "select"].includes(tag)) return;
    const key = event.key.toLowerCase();
    if (["arrowleft", "a"].includes(key)) {
      event.preventDefault();
      setDirection("left");
    } else if (["arrowright", "d"].includes(key)) {
      event.preventDefault();
      setDirection("right");
    } else if (["arrowup", "w"].includes(key)) {
      event.preventDefault();
      setDirection("up");
    } else if (["arrowdown", "s"].includes(key)) {
      event.preventDefault();
      setDirection("down");
    } else if (key === " " || key === "enter") {
      event.preventDefault();
      startOrResume();
    } else if (key === "p" || key === "escape") {
      event.preventDefault();
      if (modelRef.current.phase === "playing") pauseGame();
      else if (modelRef.current.phase === "paused") startOrResume();
    }
  }, [pauseGame, setDirection, startOrResume]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [handleKeyboard]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    touchStartRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) {
      if (modelRef.current.phase !== "playing") startOrResume();
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) setDirection(dx > 0 ? "right" : "left");
    else setDirection(dy > 0 ? "down" : "up");
  }, [setDirection, startOrResume]);

  const statusLabel = useMemo(() => {
    if (!hydrated) return "Loading";
    if (!assetsReady) return "Loading sprites";
    if (hud.phase === "playing") return hud.powerTimer > 0 ? "Power mode" : "Playing";
    if (hud.phase === "paused") return hud.message || "Paused";
    if (hud.phase === "won") return "Win screen";
    if (hud.phase === "lost") return "Game over";
    return "Ready";
  }, [assetsReady, hydrated, hud.message, hud.phase, hud.powerTimer]);

  const isPlaying = hud.phase === "playing";

  return (
    <div
      ref={shellRef}
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[#050510] shadow-[var(--shadow-card)]",
        focusMode && "fixed inset-2 z-50 overflow-y-auto rounded-[2rem] border-yellow-300/50 bg-[#050510] p-2 sm:inset-4",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/40 px-4 py-3 text-white sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => (focusMode ? setFocusMode(false) : router.push("/games"))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
            aria-label={focusMode ? "Exit focus mode" : "Back to games"}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-yellow-200/70">Darma Arcade</p>
            <h2 className="truncate text-base font-black tracking-[-0.02em] text-white sm:text-lg">{game.title}</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft">Canvas</Badge>
          <Badge variant={hud.phase === "playing" ? "accent" : "outline"}>{statusLabel}</Badge>
        </div>
      </div>

      <div className={cn("grid gap-4 p-3 sm:p-5", focusMode ? "xl:grid-cols-[minmax(0,1fr)_320px]" : "xl:grid-cols-[minmax(0,1fr)_300px]")}> 
        <div className="min-w-0">
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <StatPill label="Score" value={hud.score} />
            <StatPill label="Best" value={hud.best} />
            <StatPill label="Level" value={`${hud.level}/${MAX_LEVEL}`} />
            <StatPill label="Lives" value={"🟡".repeat(Math.max(0, hud.lives)) || "0"} />
            <StatPill label="Pellets" value={hud.pelletsLeft} />
          </div>

          <div
            className="relative mx-auto aspect-[540/390] overflow-hidden rounded-[1.5rem] border border-yellow-300/20 bg-black p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            /*
             * Size the frame by the SMALLER of the column width (100%) and the
             * width implied by the available viewport height. Because the frame
             * keeps its fixed 540/390 aspect ratio, capping the height-derived
             * width guarantees the maze never grows taller than the screen, so
             * the HUD, canvas, and controls all stay above the fold without page
             * scroll. The reserved ~300px covers the page/game headers, HUD, and
             * control rows; clamp keeps it playable between 260px and 520px tall.
             */
            style={{
              width:
                "min(100%, calc(clamp(260px, 100svh - 300px, 520px) * 540 / 390))",
              maxWidth: "100%",
            }}
          >
            <canvas
              ref={canvasRef}
              width={WORLD_WIDTH}
              height={WORLD_HEIGHT}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              className="block h-full w-full touch-none select-none rounded-[1.1rem] bg-black object-contain outline-none"
              aria-label="Pacman game canvas"
              role="img"
            />
            {hud.powerTimer > 0 ? (
              <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-blue-300/40 bg-blue-600/25 px-3 py-1.5 text-xs font-black text-blue-50 backdrop-blur-md">
                Power {Math.ceil(hud.powerTimer / 1000)}s
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={startOrResume} size="sm" variant="primary" className="gap-2">
                <Play className="h-4 w-4" aria-hidden />
                {hud.phase === "paused" ? "Resume" : hud.phase === "lost" || hud.phase === "won" ? "Play again" : "Start"}
              </Button>
              <Button type="button" onClick={pauseGame} size="sm" variant="secondary" className="gap-2" disabled={!isPlaying}>
                <Pause className="h-4 w-4" aria-hidden />
                Pause
              </Button>
              <Button type="button" onClick={restartGame} size="sm" variant="secondary" className="gap-2">
                <RotateCcw className="h-4 w-4" aria-hidden />
                Restart
              </Button>
              <Button type="button" onClick={toggleMute} size="sm" variant="ghost" className="gap-2 text-white hover:bg-white/10">
                {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
                {muted ? "Muted" : "Sound"}
              </Button>
              <Button type="button" onClick={toggleFocus} size="sm" variant="ghost" className="gap-2 text-white hover:bg-white/10">
                {focusMode ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
                {focusMode ? "Exit focus" : "Focus"}
              </Button>
            </div>

            <div className="mx-auto grid w-[144px] grid-cols-3 gap-2 sm:mx-0">
              <span />
              <DirectionButton label="↑" direction="up" onDirection={setDirection} />
              <span />
              <DirectionButton label="←" direction="left" onDirection={setDirection} />
              <DirectionButton label="↓" direction="down" onDirection={setDirection} />
              <DirectionButton label="→" direction="right" onDirection={setDirection} />
            </div>
          </div>
        </div>

        <aside className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-white">
          <div className="flex items-center gap-3">
            <img src="/games/pacman/img/Pacman-Icon.svg" alt="" className="h-11 w-11 rounded-2xl bg-yellow-300 p-1" />
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-yellow-200/70">Classic maze</p>
              <h3 className="text-lg font-black tracking-[-0.02em]">Preserved original feel</h3>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-white/72">
            <p>
              This build keeps the original Pacman canvas size, maze, ghost SVG assets, pills, power pills, and arcade sound files, but removes the old debug/demo shell.
            </p>
            <p>
              Controls: arrows or WASD on desktop, swipe or the D-pad on mobile. Space/Enter starts, P/Esc pauses.
            </p>
          </div>
          <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-black/25 p-3 text-xs font-bold text-white/75">
            <span>• Eat all pellets to advance levels.</span>
            <span>• Power pills turn ghosts vulnerable.</span>
            <span>• Best score is saved locally only.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
