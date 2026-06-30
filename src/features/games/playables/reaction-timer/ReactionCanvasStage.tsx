"use client";

/**
 * Canvas 2D background stage for the reaction arena.
 *
 * Responsibilities: ambient drifting particles, a breathing central ring, a
 * countdown pulse, and an expanding burst at the GO signal. It carries NO
 * readable UI (text/buttons live in the HTML overlay) and NEVER feeds game
 * timing — the signal timestamp is captured by the machine, not by frames.
 *
 * Safeguards: SSR-safe (guards on window/ctx), devicePixelRatio aware,
 * ResizeObserver-driven sizing, single rAF with cleanup, and a reduced-motion
 * path that paints one static frame instead of animating.
 */

import { useEffect, useRef } from "react";
import type { ReactionPhase } from "./reactionTypes";

type Particle = { x: number; y: number; vx: number; vy: number; r: number; a: number };
/** An expanding ripple ring. `start` can be in the future for staggered ripples. */
type Burst = { start: number; life: number; reach: number; width: number };

const PHASE_COLORS: Record<ReactionPhase, string> = {
  idle: "124, 92, 246",
  countdown: "124, 92, 246",
  waiting: "100, 116, 139",
  signal: "45, 212, 160",
  "too-early": "239, 68, 68",
  "round-result": "94, 134, 246",
  "final-summary": "124, 92, 246",
  paused: "100, 116, 139",
};

/** Orb/glow intensity per phase — drives how alive vs. calm the centre feels. */
const PHASE_INTENSITY: Record<ReactionPhase, number> = {
  idle: 0.34,
  countdown: 0.42,
  waiting: 0.16,
  signal: 0.95,
  "too-early": 0.82,
  "round-result": 0.46,
  "final-summary": 0.52,
  paused: 0.16,
};

export function ReactionCanvasStage({
  phase,
  countdownValue = null,
  reducedMotion,
  className,
}: {
  phase: ReactionPhase;
  /** Current countdown number, so the orb can pulse on each tick. */
  countdownValue?: number | null;
  reducedMotion: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef(phase);
  const prevPhaseRef = useRef(phase);
  const countdownRef = useRef(countdownValue);

  // Keep the persistent rAF loop reading the latest phase/countdown without restarting it.
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    countdownRef.current = countdownValue;
  }, [countdownValue]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let frame = 0;
    let flashStart = -999; // frame the GO white-flash began
    let countdownPulseStart = -999; // frame of the last countdown tick pulse
    let prevCountdown = countdownRef.current;
    const particles: Particle[] = [];
    const bursts: Burst[] = [];

    const spawnBurst = (reach: number, life: number, lineW: number, delay: number) => {
      bursts.push({ start: frame + delay, life, reach, width: lineW });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) seed();
      if (reducedMotion) drawStatic();
    };

    const seed = () => {
      const count = Math.round(Math.min(48, Math.max(18, (width * height) / 26000)));
      particles.length = 0;
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: Math.random() * 1.8 + 0.6,
          a: Math.random() * 0.4 + 0.15,
        });
      }
    };

    const drawScene = (animate: boolean) => {
      const color = PHASE_COLORS[phaseRef.current] ?? PHASE_COLORS.idle;
      const cx = width / 2;
      const cy = height / 2;
      ctx.clearRect(0, 0, width, height);

      // Drifting particles.
      for (const p of particles) {
        if (animate) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -4) p.x = width + 4;
          if (p.x > width + 4) p.x = -4;
          if (p.y < -4) p.y = height + 4;
          if (p.y > height + 4) p.y = -4;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.a})`;
        ctx.fill();
      }

      const phase = phaseRef.current;
      const intensity = PHASE_INTENSITY[phase] ?? 0.34;
      const minDim = Math.min(width, height);
      // The orb breathes gently, and changes shape to communicate each state:
      // pops at GO, contracts on too-early, ticks on countdown, celebrates at the end.
      const breathe = animate ? Math.sin(frame / 38) * 0.04 : 0;
      let pop = phase === "signal" ? 0.1 : phase === "too-early" ? -0.05 : 0;
      if (animate && phase === "countdown") {
        const tickAge = frame - countdownPulseStart;
        if (tickAge >= 0 && tickAge < 16) pop += 0.12 * (1 - tickAge / 16);
      }
      if (animate && phase === "final-summary") {
        pop += Math.sin(frame / 30) * 0.05;
      }
      const orbR = minDim * 0.155 * (1 + breathe + pop);

      // Glowing central orb — a soft radial core, brightest at the signal.
      const glow = ctx.createRadialGradient(cx, cy, orbR * 0.08, cx, cy, orbR);
      glow.addColorStop(0, `rgba(${color}, ${0.2 + intensity * 0.55})`);
      glow.addColorStop(0.55, `rgba(${color}, ${0.08 + intensity * 0.2})`);
      glow.addColorStop(1, `rgba(${color}, 0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Crisp orb outline.
      ctx.beginPath();
      ctx.arc(cx, cy, orbR * 0.92, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color}, ${0.3 + intensity * 0.45})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Waiting: two counter-rotating dashed rings that subtly breathe — the orb
      // reads as "locked", tense and focused, but NOT a predictable progress bar.
      if ((phase === "waiting" || phase === "paused") && animate) {
        const tense = orbR * (1.95 + Math.sin(frame / 14) * 0.22);
        ctx.save();
        ctx.setLineDash([5, 11]);
        ctx.lineDashOffset = -frame * 0.4;
        ctx.beginPath();
        ctx.arc(cx, cy, tense, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color}, 0.22)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.setLineDash([3, 14]);
        ctx.lineDashOffset = frame * 0.55;
        ctx.beginPath();
        ctx.arc(cx, cy, orbR * 1.45, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color}, 0.14)`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // Expanding ripple rings (GO signal, too-early flash, gentle result pulse).
      for (let i = bursts.length - 1; i >= 0; i -= 1) {
        const b = bursts[i];
        const progress = (frame - b.start) / b.life;
        if (progress >= 1) {
          bursts.splice(i, 1);
          continue;
        }
        if (progress < 0) continue; // staggered ring not started yet
        const radius = orbR + progress * minDim * b.reach;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color}, ${0.65 * (1 - progress)})`;
        ctx.lineWidth = b.width * (1 - progress) + 0.5;
        ctx.stroke();
      }

      // Brief GO white flash — short and bright, always paired with the burst +
      // "GO!" text so it is never a color-only cue.
      if (animate) {
        const flashAge = frame - flashStart;
        if (flashAge >= 0 && flashAge < 9) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * (1 - flashAge / 9)})`;
          ctx.fillRect(0, 0, width, height);
        }
      }
    };

    const drawStatic = () => drawScene(false);

    const loop = () => {
      frame += 1;
      // Spawn phase-appropriate ripples the moment a phase begins.
      if (phaseRef.current !== prevPhaseRef.current) {
        if (phaseRef.current === "signal") {
          // Strong triple ripple + white flash — the GO moment is the headline.
          spawnBurst(0.66, 42, 5, 0);
          spawnBurst(0.66, 42, 4, 9);
          spawnBurst(0.5, 32, 3, 18);
          flashStart = frame;
        } else if (phaseRef.current === "too-early") {
          // Quick red double-flash for an unmistakable error.
          spawnBurst(0.42, 24, 5, 0);
          spawnBurst(0.34, 20, 3, 6);
        } else if (phaseRef.current === "round-result") {
          // A single calm, rewarding pulse between rounds.
          spawnBurst(0.5, 64, 2, 0);
        } else if (phaseRef.current === "final-summary") {
          // Celebratory cascade to mark the end of the challenge.
          spawnBurst(0.55, 70, 3, 0);
          spawnBurst(0.46, 60, 2, 12);
          spawnBurst(0.62, 84, 2, 26);
        }
      }

      // Countdown tick: pulse the orb and emit a soft ring each new number.
      if (phaseRef.current === "countdown" && countdownRef.current !== prevCountdown) {
        countdownPulseStart = frame;
        spawnBurst(0.3, 28, 2, 0);
      }
      prevCountdown = countdownRef.current;

      // Final summary keeps a slow celebratory pulse so the screen stays alive.
      if (phaseRef.current === "final-summary" && frame % 96 === 0) {
        spawnBurst(0.5, 78, 1.5, 0);
      }

      prevPhaseRef.current = phaseRef.current;
      drawScene(true);
      raf = window.requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    // Window resize is a backup for environments/transitions where the element
    // observer doesn't fire (e.g. entering/leaving fullscreen).
    window.addEventListener("resize", resize);
    resize();

    if (!reducedMotion) {
      raf = window.requestAnimationFrame(loop);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      if (raf) window.cancelAnimationFrame(raf);
    };
    // Re-run only when motion preference flips (animated vs static engine).
  }, [reducedMotion]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
