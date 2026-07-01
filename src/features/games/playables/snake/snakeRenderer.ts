import type { SnakeDirection, SnakePoint } from "./snakeTypes";

/**
 * Pure canvas drawing + small math helpers for Snake Pro. Nothing here touches
 * React or game state directly — SnakeBoard.tsx owns the animation loop and
 * passes plain values in, so the rendering logic stays easy to reason about
 * and easy to reuse (e.g. from a future thumbnail/preview canvas).
 */

const FOOD_EMOJI = ["🍎", "🍓", "🍇", "🍒"];
const GOLDEN_EMOJI = "⭐";

const ANGLE_FOR_DIRECTION: Record<SnakeDirection, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

export type SnakeParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const bits = parseInt(
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value,
    16,
  );
  return [(bits >> 16) & 255, (bits >> 8) & 255, bits & 255];
}

function lerpColor(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Ease-out-back curve so spawned food "pops" in with a tiny overshoot instead of just fading in. */
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = clamp01(t);
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/** A deterministic pick so a given food position keeps the same look while it's on the board. */
export function foodEmojiFor(seed: number): string {
  const index = ((seed % FOOD_EMOJI.length) + FOOD_EMOJI.length) % FOOD_EMOJI.length;
  return FOOD_EMOJI[index];
}

export function drawArenaBackground(
  ctx: CanvasRenderingContext2D,
  boardPx: number,
  cols: number,
  showGrid: boolean,
): void {
  const radial = ctx.createRadialGradient(
    boardPx * 0.5,
    boardPx * 0.36,
    boardPx * 0.04,
    boardPx * 0.5,
    boardPx * 0.5,
    boardPx * 0.75,
  );
  radial.addColorStop(0, "#123625");
  radial.addColorStop(0.55, "#0b241a");
  radial.addColorStop(1, "#050f0b");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, boardPx, boardPx);

  const sheen = ctx.createLinearGradient(0, 0, boardPx, boardPx);
  sheen.addColorStop(0, "rgba(255,255,255,0.05)");
  sheen.addColorStop(0.4, "rgba(255,255,255,0)");
  sheen.addColorStop(1, "rgba(0,0,0,0.14)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, boardPx, boardPx);

  const cell = boardPx / cols;
  ctx.beginPath();
  if (showGrid) {
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    for (let i = 1; i < cols; i += 1) {
      const p = Math.round(i * cell) + 0.5;
      ctx.moveTo(p, 0);
      ctx.lineTo(p, boardPx);
      ctx.moveTo(0, p);
      ctx.lineTo(boardPx, p);
    }
  } else {
    // No forced grid — only faint quarter guides so the arena still reads as a bounded playfield.
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach((fraction) => {
      const p = Math.round(boardPx * fraction) + 0.5;
      ctx.moveTo(p, 0);
      ctx.lineTo(p, boardPx);
      ctx.moveTo(0, p);
      ctx.lineTo(boardPx, p);
    });
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  roundRectPath(ctx, 1, 1, boardPx - 2, boardPx - 2, boardPx * 0.03);
  ctx.stroke();
}

export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cell: number,
): void {
  const half = cell * 0.44;
  ctx.save();
  ctx.translate(cx, cy);
  const gradient = ctx.createLinearGradient(-half, -half, half, half);
  gradient.addColorStop(0, "#8a8177");
  gradient.addColorStop(0.55, "#57534e");
  gradient.addColorStop(1, "#26221e");
  ctx.fillStyle = gradient;
  roundRectPath(ctx, -half, -half, half * 2, half * 2, cell * 0.14);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  roundRectPath(ctx, -half * 0.55, half * 0.05, half * 1.1, half * 0.5, cell * 0.06);
  ctx.fill();
  ctx.restore();
}

export function drawFood(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cell: number,
  emoji: string,
  spawnProgress: number,
  pulseSeed: number,
  isGolden: boolean,
): void {
  const scale =
    spawnProgress < 1
      ? Math.max(0, easeOutBack(spawnProgress))
      : 1 + Math.sin(pulseSeed) * (isGolden ? 0.1 : 0.06);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const glowRadius = cell * (isGolden ? 0.62 : 0.5);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
  glow.addColorStop(0, isGolden ? "rgba(250,204,21,0.55)" : "rgba(239,68,68,0.3)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `${Math.round(cell * 0.66)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, 0, cell * 0.03);
  ctx.restore();
}

/**
 * Lerps only the head from its previous cell to its current one, snapping instead of
 * sliding across the whole board when portal-wrap teleports it from one edge to the other.
 */
export function interpolateHead(
  prev: SnakePoint,
  current: SnakePoint,
  size: number,
  wrap: boolean,
  progress: number,
): SnakePoint {
  let dx = current.x - prev.x;
  let dy = current.y - prev.y;
  if (wrap) {
    if (Math.abs(dx) > 1) dx += dx > 0 ? -size : size;
    if (Math.abs(dy) > 1) dy += dy > 0 ? -size : size;
  }
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) return current;
  return { x: prev.x + dx * progress, y: prev.y + dy * progress };
}

/**
 * Splits the logical body path into visually contiguous chunks. In Portal Wrap
 * mode two consecutive logical cells can sit on opposite edges of the board
 * (e.g. head at x=0, neck at x=15); drawing a stroke between them would smear a
 * giant line clean across the arena. Any gap larger than one cell starts a new
 * chunk so each side of a wrap renders as its own clean piece. Chunks keep their
 * original indices so width/colour taper stays continuous along the whole snake.
 */
function splitBodyChunks(points: SnakePoint[]): number[][] {
  const chunks: number[][] = [];
  let current: number[] = [0];
  for (let i = 1; i < points.length; i += 1) {
    const dx = Math.abs(points[i].x - points[i - 1].x);
    const dy = Math.abs(points[i].y - points[i - 1].y);
    if (dx > 1.001 || dy > 1.001) {
      chunks.push(current);
      current = [i];
    } else {
      current.push(i);
    }
  }
  chunks.push(current);
  return chunks;
}

/**
 * Draws the body as a tapering, rounded "tube" through the given cell-space
 * points (head first). Each contiguous chunk is stroked with round caps/joins so
 * grid turns read as smooth organic bends rather than stacked squares, and wrap
 * teleports never connect across the board (see {@link splitBodyChunks}).
 */
export function drawSnakeBody(
  ctx: CanvasRenderingContext2D,
  points: SnakePoint[],
  cell: number,
  options: { alive: boolean },
): void {
  if (points.length < 1) return;
  const total = points.length;
  const headWidth = cell * 0.82;
  const tailWidth = cell * 0.32;
  const headColor = options.alive ? "#4ade80" : "#f87171";
  const tailColor = options.alive ? "#065f46" : "#7f1d1d";

  const denom = Math.max(1, total - 1);
  const widthAt = (index: number) => lerp(headWidth, tailWidth, index / denom);
  const colorAt = (index: number) =>
    lerpColor(headColor, tailColor, index / denom);
  const pixel = (index: number) => ({
    x: (points[index].x + 0.5) * cell,
    y: (points[index].y + 0.5) * cell,
  });

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const chunks = splitBodyChunks(points);

  for (const chunk of chunks) {
    // A lone cell (e.g. the head right after it wraps) has no neighbour to
    // stroke toward, so render it as a filled dot instead of skipping it.
    if (chunk.length === 1) {
      const p = pixel(chunk[0]);
      ctx.fillStyle = colorAt(chunk[0]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, widthAt(chunk[0]) / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    for (let k = 0; k < chunk.length - 1; k += 1) {
      const a = chunk[k];
      const b = chunk[k + 1];
      const pa = pixel(a);
      const pb = pixel(b);
      ctx.strokeStyle = colorAt((a + b) / 2);
      ctx.lineWidth = widthAt((a + b) / 2);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }
  }

  // Slim, lighter gloss pass on top for a rounded/shiny scale look (per chunk so
  // it also never bridges a wrap seam).
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#f0fdf4";
  for (const chunk of chunks) {
    for (let k = 0; k < chunk.length - 1; k += 1) {
      const a = chunk[k];
      const b = chunk[k + 1];
      const pa = pixel(a);
      const pb = pixel(b);
      ctx.lineWidth = widthAt((a + b) / 2) * 0.32;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

export function drawSnakeHead(
  ctx: CanvasRenderingContext2D,
  headCenterPx: SnakePoint,
  direction: SnakeDirection,
  cell: number,
  options: { alive: boolean; tonguePhase: number; blink: boolean },
): void {
  const angle = ANGLE_FOR_DIRECTION[direction];
  const r = cell * 0.44;
  ctx.save();
  ctx.translate(headCenterPx.x, headCenterPx.y);
  ctx.rotate(angle);

  const gradient = ctx.createRadialGradient(-r * 0.15, -r * 0.3, r * 0.1, 0, 0, r * 1.15);
  if (options.alive) {
    gradient.addColorStop(0, "#bbf7d0");
    gradient.addColorStop(0.55, "#22c55e");
    gradient.addColorStop(1, "#065f46");
  } else {
    gradient.addColorStop(0, "#fecaca");
    gradient.addColorStop(0.55, "#ef4444");
    gradient.addColorStop(1, "#7f1d1d");
  }
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.05, r * 0.86, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (options.alive && options.tonguePhase > 0) {
    const len = r * 1.35 * options.tonguePhase;
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = Math.max(1, cell * 0.045);
    ctx.beginPath();
    ctx.moveTo(r * 0.9, 0);
    ctx.lineTo(r * 0.9 + len, 0);
    ctx.moveTo(r * 0.9 + len, 0);
    ctx.lineTo(r * 0.9 + len + cell * 0.08, -cell * 0.07);
    ctx.moveTo(r * 0.9 + len, 0);
    ctx.lineTo(r * 0.9 + len + cell * 0.08, cell * 0.07);
    ctx.stroke();
  }

  const eyeForward = r * 0.32;
  const eyeSide = r * 0.42;
  [-1, 1].forEach((side) => {
    if (options.alive) {
      const eyeRx = cell * 0.1;
      const eyeRy = options.blink ? cell * 0.02 : cell * 0.1;
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.ellipse(eyeForward, side * eyeSide, eyeRx, eyeRy, 0, 0, Math.PI * 2);
      ctx.fill();
      if (!options.blink) {
        ctx.fillStyle = "#111827";
        ctx.beginPath();
        ctx.arc(eyeForward + cell * 0.025, side * eyeSide, cell * 0.045, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = "#450a0a";
      ctx.lineWidth = Math.max(1, cell * 0.04);
      const s = cell * 0.06;
      ctx.beginPath();
      ctx.moveTo(eyeForward - s, side * eyeSide - s);
      ctx.lineTo(eyeForward + s, side * eyeSide + s);
      ctx.moveTo(eyeForward - s, side * eyeSide + s);
      ctx.lineTo(eyeForward + s, side * eyeSide - s);
      ctx.stroke();
    }
  });

  ctx.restore();
}

export function spawnBurst(
  particles: SnakeParticle[],
  x: number,
  y: number,
  color: string,
  count = 14,
): void {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const speed = 60 + Math.random() * 90;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 0.35 + Math.random() * 0.25,
      size: 1.5 + Math.random() * 2.5,
      color,
    });
  }
}

export function updateParticles(particles: SnakeParticle[], dt: number): void {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.life += dt;
    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: SnakeParticle[]): void {
  for (const p of particles) {
    const alpha = 1 - p.life / p.maxLife;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export const SNAKE_GOLDEN_EMOJI = GOLDEN_EMOJI;
