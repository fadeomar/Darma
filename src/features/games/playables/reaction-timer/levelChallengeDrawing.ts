/**
 * Pure Canvas 2D drawing helpers for Level Challenge.
 *
 * These take a context + geometry and paint; they hold no state and never read
 * timers. The engine (`LevelChallengeStage`) owns all game state and timing and
 * calls these each frame. Correct vs decoy targets differ by SHAPE (crosshair
 * ring vs slashed square), not colour alone — see `drawCorrectTarget` /
 * `drawDecoyTarget`.
 */

/** Soft central orb used by the signal level (Level 1). */
export function drawSignalOrb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rgb: string,
  intensity: number,
): void {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.08, cx, cy, r);
  glow.addColorStop(0, `rgba(${rgb}, ${0.2 + intensity * 0.55})`);
  glow.addColorStop(0.55, `rgba(${rgb}, ${0.08 + intensity * 0.2})`);
  glow.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${rgb}, ${0.3 + intensity * 0.45})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * The correct target: a bright double ring with a crosshair core. `alpha` drives
 * the fade levels; `r` is the (possibly shrunk) current radius.
 */
export function drawCorrectTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  // Glow.
  const glow = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 1.5);
  glow.addColorStop(0, "rgba(45, 212, 160, 0.55)");
  glow.addColorStop(0.6, "rgba(45, 212, 160, 0.16)");
  glow.addColorStop(1, "rgba(45, 212, 160, 0)");
  ctx.beginPath();
  ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
  // Outer + inner ring (the "ringed" cue).
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  // Core.
  ctx.beginPath();
  ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(16, 185, 129, 0.95)";
  ctx.fill();
  // Crosshair (shape cue).
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.34, y);
  ctx.lineTo(x + r * 0.34, y);
  ctx.moveTo(x, y - r * 0.34);
  ctx.lineTo(x, y + r * 0.34);
  ctx.stroke();
  ctx.restore();
}

/**
 * A decoy: a slashed square outline — clearly a different SHAPE from the correct
 * ringed/crosshair target, so it reads as "avoid" without relying on colour.
 */
export function drawDecoyTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const s = r * 0.86; // half side of the square
  ctx.strokeStyle = "rgba(203, 213, 225, 0.85)";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x - s, y - s, s * 2, s * 2);
  // Diagonal slash (the "not this one" cue).
  ctx.beginPath();
  ctx.moveTo(x - s * 0.7, y - s * 0.7);
  ctx.lineTo(x + s * 0.7, y + s * 0.7);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.95)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** An expanding ring effect (hit / wrong / miss feedback). */
export function drawRipple(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  rgb: string,
  reach: number,
): void {
  const radius = 8 + progress * reach;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${rgb}, ${0.7 * (1 - progress)})`;
  ctx.lineWidth = 3 * (1 - progress) + 0.5;
  ctx.stroke();
}

/** Static (reduced-motion) feedback dot in place of an expanding ripple. */
export function drawStaticDot(ctx: CanvasRenderingContext2D, x: number, y: number, rgb: string): void {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${rgb}, 0.5)`;
  ctx.fill();
}
