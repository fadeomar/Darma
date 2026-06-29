"use client";

/**
 * Target Hunter gameplay engine (Sprint 6).
 *
 * Owns the full active run: a 3-2-1 countdown, then a 30-second Quick Hunt where
 * one target appears at a time and the player taps it. Canvas draws the target,
 * hit/miss effects, and ambient particles; the HTML overlay (rendered here for
 * the HUD, and by `TargetHunterView` for lobby/result) carries every readable
 * value so nothing important lives only on the canvas.
 *
 * Timing rule: spawn + hit times use `performance.now()` only. The canvas RAF is
 * cosmetic and never authoritative for the score. The clock for "time left" is
 * also `performance.now()`-derived, not frame counting.
 *
 * Render budget: game state lives in refs; React state changes only when a
 * displayed value changes (a hit, a miss, a whole-second tick, or the countdown
 * number) — never every frame.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Crosshair, LogOut } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { accessibilityCanvasDescription } from "./reactionAccessibility";
import { isGameplayControlTarget, useActiveGameplayGuards, useVisibilityInterruption } from "./reactionRuntimeGuards";
import type { PlayCue } from "./reactionAudio";
import type { Vibrate } from "./reactionHaptics";
import {
  FIRST_SPAWN_DELAY_MS,
  TARGET_HUNTER_COUNTDOWN_FROM,
  TARGET_HUNTER_COUNTDOWN_INTERVAL_MS,
  TARGET_HUNTER_DURATION_MS,
  finalizeTargetHunterRun,
  pickSpawn,
  spawnDelayForCombo,
  targetRadiusForWidth,
} from "./targetHunterScoring";
import type { ActiveTarget, TargetHunterHud, TargetHunterResult } from "./targetHunterTypes";

type Effect = { type: "hit" | "miss" | "combo"; x: number; y: number; start: number; life: number };
type Particle = { x: number; y: number; vx: number; vy: number; r: number; a: number };

const EMPTY_HUD: TargetHunterHud = {
  secondsLeft: Math.round(TARGET_HUNTER_DURATION_MS / 1000),
  hits: 0,
  misses: 0,
  accuracy: 0,
  combo: 0,
  averageHitMs: null,
};

export function TargetHunterStage({
  reducedMotion,
  play,
  vibrate,
  onComplete,
  onQuit,
  onRestart,
}: {
  reducedMotion: boolean;
  play: PlayCue;
  vibrate: Vibrate;
  onComplete: (result: TargetHunterResult) => void;
  onQuit: () => void;
  onRestart: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const accessibilityDescriptionId = useId();

  const [countdownValue, setCountdownValue] = useState<number>(TARGET_HUNTER_COUNTDOWN_FROM);
  const [phase, setPhase] = useState<"countdown" | "active" | "interrupted">("countdown");
  const [hud, setHud] = useState<TargetHunterHud>(EMPTY_HUD);

  // Stable refs for callbacks/flags so the rAF effect runs exactly once.
  const playRef = useRef(play);
  const vibrateRef = useRef(vibrate);
  const completeRef = useRef(onComplete);
  const reducedRef = useRef(reducedMotion);
  useEffect(() => {
    playRef.current = play;
  }, [play]);
  useEffect(() => {
    vibrateRef.current = vibrate;
  }, [vibrate]);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    reducedRef.current = reducedMotion;
  }, [reducedMotion]);

  // Authoritative game state (mutated by the loop + pointer handler).
  const game = useRef({
    phase: "countdown" as "countdown" | "active" | "done",
    countdownStart: 0,
    lastTick: TARGET_HUNTER_COUNTDOWN_FROM + 1,
    runStart: 0,
    nextSpawnAt: 0,
    target: null as ActiveTarget | null,
    lastTarget: null as ActiveTarget | null,
    hits: 0,
    misses: 0,
    combo: 0,
    longestCombo: 0,
    hitTimes: [] as number[],
    usedTouch: false,
    finished: false,
  });

  const effectsRef = useRef<Effect[]>([]);

  const interruptRun = useCallback(() => {
    const g = game.current;
    if (g.phase !== "countdown" && g.phase !== "active") return;
    g.phase = "done";
    g.finished = true;
    g.target = null;
    setPhase("interrupted");
    playRef.current("level.fail");
  }, []);

  useActiveGameplayGuards(phase === "countdown" || phase === "active");
  useVisibilityInterruption(phase === "countdown" || phase === "active", interruptRun);

  // Push a fresh HUD snapshot from the authoritative counters. Stable identity —
  // it only reads refs + the stable setHud, so the rAF loop can call it safely.
  const pushHud = useCallback(() => {
    const g = game.current;
    const attempts = g.hits + g.misses;
    const elapsed = g.runStart ? performance.now() - g.runStart : 0;
    const secondsLeft = Math.max(0, Math.ceil((TARGET_HUNTER_DURATION_MS - elapsed) / 1000));
    setHud({
      secondsLeft,
      hits: g.hits,
      misses: g.misses,
      accuracy: attempts > 0 ? Math.round((g.hits / attempts) * 100) : 0,
      combo: g.combo,
      averageHitMs: g.hits > 0 ? Math.round(g.hitTimes.reduce((s, t) => s + t, 0) / g.hits) : null,
    });
  }, []);

  // Pointer hit/miss detection. Counts only while a run is active. Records touch
  // usage and measures hit time with performance.now() (never frame time).
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isGameplayControlTarget(event.target)) return;
    event.preventDefault();
    const g = game.current;
    if (g.phase !== "active") return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (event.pointerType === "touch") g.usedTouch = true;

    const rect = wrap.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const now = performance.now();

    const t = g.target;
    if (t && Math.hypot(x - t.x, y - t.y) <= t.r) {
      // Hit.
      const hitTimeMs = Math.max(0, Math.round(now - t.shownAt));
      g.hits += 1;
      g.hitTimes.push(hitTimeMs);
      g.combo += 1;
      g.longestCombo = Math.max(g.longestCombo, g.combo);
      effectsRef.current.push({ type: "hit", x: t.x, y: t.y, start: now, life: 460 });
      playRef.current("target.hit");
      vibrateRef.current("tap");
      if (g.combo > 0 && g.combo % 5 === 0) {
        effectsRef.current.push({ type: "combo", x: t.x, y: t.y, start: now, life: 620 });
        playRef.current("combo.up");
        vibrateRef.current("achievement");
      }
      g.lastTarget = t;
      g.target = null;
      g.nextSpawnAt = now + spawnDelayForCombo(g.combo);
      pushHud();
    } else {
      // Miss — tapped outside the target.
      g.misses += 1;
      g.combo = 0;
      effectsRef.current.push({ type: "miss", x, y, start: now, life: 420 });
      playRef.current("target.miss");
      vibrateRef.current("tooEarly");
      pushHud();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    const particles: Particle[] = [];

    const seedParticles = () => {
      const count = Math.round(Math.min(40, Math.max(14, (width * height) / 30000)));
      particles.length = 0;
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          r: Math.random() * 1.6 + 0.5,
          a: Math.random() * 0.32 + 0.12,
        });
      }
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
      if (particles.length === 0) seedParticles();
      // Keep an in-flight target inside the new safe bounds after a resize.
      const g = game.current;
      if (g.target) {
        const r = g.target.r;
        g.target.x = Math.max(r + 14, Math.min(width - r - 14, g.target.x));
        g.target.y = Math.max(72 + r, Math.min(height - r - 14, g.target.y));
      }
    };

    const drawTarget = (t: ActiveTarget, now: number) => {
      const reduced = reducedRef.current;
      const pulse = reduced ? 1 : 1 + Math.sin(now / 140) * 0.05;
      const r = t.r * pulse;
      // Soft glow.
      const glow = ctx.createRadialGradient(t.x, t.y, r * 0.1, t.x, t.y, r * 1.5);
      glow.addColorStop(0, "rgba(45, 212, 160, 0.55)");
      glow.addColorStop(0.6, "rgba(45, 212, 160, 0.18)");
      glow.addColorStop(1, "rgba(45, 212, 160, 0)");
      ctx.beginPath();
      ctx.arc(t.x, t.y, r * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      // Outer ring.
      ctx.beginPath();
      ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
      ctx.lineWidth = 3;
      ctx.stroke();
      // Inner core.
      ctx.beginPath();
      ctx.arc(t.x, t.y, r * 0.52, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(16, 185, 129, 0.95)";
      ctx.fill();
      // Crosshair motif (shape cue, not colour-only).
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t.x - r * 0.32, t.y);
      ctx.lineTo(t.x + r * 0.32, t.y);
      ctx.moveTo(t.x, t.y - r * 0.32);
      ctx.lineTo(t.x, t.y + r * 0.32);
      ctx.stroke();
    };

    const drawEffects = (now: number) => {
      const reduced = reducedRef.current;
      const list = effectsRef.current;
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const e = list[i];
        const progress = (now - e.start) / e.life;
        if (progress >= 1) {
          list.splice(i, 1);
          continue;
        }
        if (reduced) {
          // Static, brief dot instead of an expanding ring.
          if (progress < 0.5) {
            ctx.beginPath();
            ctx.arc(e.x, e.y, 10, 0, Math.PI * 2);
            ctx.fillStyle =
              e.type === "miss" ? "rgba(239, 68, 68, 0.5)" : "rgba(45, 212, 160, 0.5)";
            ctx.fill();
          }
          continue;
        }
        const color =
          e.type === "miss" ? "239, 68, 68" : e.type === "combo" ? "250, 204, 21" : "45, 212, 160";
        const radius = 8 + progress * (e.type === "combo" ? 90 : 54);
        ctx.beginPath();
        ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color}, ${0.7 * (1 - progress)})`;
        ctx.lineWidth = 3 * (1 - progress) + 0.5;
        ctx.stroke();
      }
    };

    const loop = () => {
      const now = performance.now();
      const g = game.current;
      ctx.clearRect(0, 0, width, height);

      // Ambient particles (skipped under reduced motion).
      if (!reducedRef.current) {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -4) p.x = width + 4;
          if (p.x > width + 4) p.x = -4;
          if (p.y < -4) p.y = height + 4;
          if (p.y > height + 4) p.y = -4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(148, 163, 184, ${p.a})`;
          ctx.fill();
        }
      }

      if (g.phase === "countdown") {
        const elapsed = now - g.countdownStart;
        const value = TARGET_HUNTER_COUNTDOWN_FROM - Math.floor(elapsed / TARGET_HUNTER_COUNTDOWN_INTERVAL_MS);
        if (value !== g.lastTick) {
          g.lastTick = value;
          if (value > 0) {
            setCountdownValue(value);
            playRef.current("countdown.tick");
          }
        }
        if (value <= 0) {
          g.phase = "active";
          g.runStart = now;
          g.nextSpawnAt = now + FIRST_SPAWN_DELAY_MS;
          setPhase("active");
          playRef.current("level.start");
          vibrateRef.current("signal");
          pushHud();
        }
      } else if (g.phase === "active") {
        const elapsed = now - g.runStart;
        if (elapsed >= TARGET_HUNTER_DURATION_MS) {
          if (!g.finished) {
            g.finished = true;
            g.phase = "done";
            g.target = null;
            const result = finalizeTargetHunterRun({
              hits: g.hits,
              misses: g.misses,
              hitTimesMs: g.hitTimes,
              longestCombo: g.longestCombo,
              durationMs: TARGET_HUNTER_DURATION_MS,
              usedTouch: g.usedTouch,
            });
            completeRef.current(result);
          }
        } else {
          // Spawn the next target when the gap has elapsed.
          if (!g.target && now >= g.nextSpawnAt) {
            const r = targetRadiusForWidth(width);
            const spot = pickSpawn(width, height, r, g.lastTarget);
            if (spot) {
              g.target = { x: spot.x, y: spot.y, r, shownAt: now };
              playRef.current("target.spawn");
            }
          }
          if (g.target) drawTarget(g.target, now);
          // HUD second-by-second tick.
          const secondsLeft = Math.max(0, Math.ceil((TARGET_HUNTER_DURATION_MS - elapsed) / 1000));
          setHud((prev) => (prev.secondsLeft === secondsLeft ? prev : { ...prev, secondsLeft }));
        }
      }

      drawEffects(now);

      if (game.current.phase !== "done") {
        raf = window.requestAnimationFrame(loop);
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    resize();

    // Start the run.
    game.current.countdownStart = performance.now();
    raf = window.requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      if (raf) window.cancelAnimationFrame(raf);
    };
    // Engine runs once per mount; retry remounts via a key in the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={wrapRef}
      className={cn("rtp-th-stage", phase === "active" && "rtp-th-stage--active")}
      role="group"
      aria-label="Target Hunter active stage"
      aria-describedby={accessibilityDescriptionId}
      onPointerDown={handlePointerDown}
    >
      <p id={accessibilityDescriptionId} className="sr-only">
        {accessibilityCanvasDescription("target-hunter")}
      </p>
      <canvas ref={canvasRef} aria-hidden className="rtp-canvas rtp-th-canvas" />

      {phase === "interrupted" ? (
        <div className="rtp-run-interrupted" role="status" aria-live="assertive">
          <span className="rtp-eyebrow">Run interrupted</span>
          <h2 className="rtp-pause-title">Timing paused for fairness</h2>
          <p className="rtp-play-sub">The tab or app changed while the timer was active, so this run was not saved.</p>
          <div className="rtp-summary-actions" data-rtp-control="true">
            <Button size="lg" onClick={onRestart}>Try again</Button>
            <Button size="lg" variant="ghost" onClick={onQuit}>Quit run</Button>
          </div>
        </div>
      ) : phase === "countdown" ? (
        <div className="rtp-th-countdown">
          <span className="rtp-eyebrow">Target Hunter</span>
          <div className="rtp-instruction rtp-instruction--countdown" aria-live="assertive">
            {countdownValue > 0 ? countdownValue : "Hunt"}
          </div>
          <p className="rtp-play-sub">Get ready — tap each target the moment it appears.</p>
        </div>
      ) : (
        <>
          <div className="rtp-th-hud" aria-live="off" onPointerDown={(event) => event.stopPropagation()}>
            <div className="rtp-th-hud-stat rtp-th-hud-stat--time">
              <span className="rtp-th-hud-label">Time</span>
              <span className="rtp-th-hud-value">{hud.secondsLeft}s</span>
            </div>
            <div className="rtp-th-hud-stat">
              <span className="rtp-th-hud-label">Hits</span>
              <span className="rtp-th-hud-value">{hud.hits}</span>
            </div>
            <div className="rtp-th-hud-stat">
              <span className="rtp-th-hud-label">Miss</span>
              <span className="rtp-th-hud-value">{hud.misses}</span>
            </div>
            <div className="rtp-th-hud-stat">
              <span className="rtp-th-hud-label">Acc</span>
              <span className="rtp-th-hud-value">{hud.accuracy}%</span>
            </div>
            <div className={cn("rtp-th-hud-stat", hud.combo >= 5 && "rtp-th-hud-stat--combo")}>
              <span className="rtp-th-hud-label">Combo</span>
              <span className="rtp-th-hud-value">{hud.combo}</span>
            </div>
            <div className="rtp-th-hud-stat">
              <span className="rtp-th-hud-label">Avg</span>
              <span className="rtp-th-hud-value">{hud.averageHitMs !== null ? `${hud.averageHitMs}ms` : "—"}</span>
            </div>
          </div>

          <p className="rtp-th-active-hint">
            <Crosshair className="h-3.5 w-3.5" aria-hidden /> Tap the target — avoid tapping empty space
          </p>

          <div className="rtp-th-quit" onPointerDown={(event) => event.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              onClick={onQuit}
              leftIcon={<LogOut className="h-4 w-4" aria-hidden />}
            >
              Quit
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
