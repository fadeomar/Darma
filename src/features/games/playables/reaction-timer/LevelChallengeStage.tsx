"use client";

/**
 * Level Challenge gameplay engine (Sprint 7).
 *
 * Drives a single level from countdown → active → done and emits a result. Two
 * internal engines share one canvas + HUD:
 *   • Signal (Level 1): wait → GO → measure reaction, N attempts.
 *   • Target (Levels 2-6): spawn a correct target (+ optional decoys) with
 *     fade / shrink / move mechanics; hit it before it expires.
 *
 * Timing rule: every spawn/hit/elapsed value uses `performance.now()`. The rAF
 * loop is cosmetic + drives motion, but never decides the score. Game state
 * lives in refs; React state changes only when a displayed value changes.
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
  EDGE_PADDING,
  LEVEL_COUNTDOWN_FROM,
  LEVEL_COUNTDOWN_INTERVAL_MS,
  NEXT_SPAWN_DELAY_MS,
  SIGNAL_MAX_WAIT_MS,
  SIGNAL_MIN_WAIT_MS,
  TOP_CONTROLS_RESERVE,
  finalizeLevelResult,
  scaleRadiusForWidth,
} from "./levelChallengeScoring";
import {
  drawCorrectTarget,
  drawDecoyTarget,
  drawRipple,
  drawSignalOrb,
  drawStaticDot,
} from "./levelChallengeDrawing";
import type { LevelChallengeHud, LevelChallengeResult, LevelDef } from "./levelChallengeTypes";

type Node = { x: number; y: number; vx: number; vy: number; r: number; shownAt: number };
type Round = { correct: Node; decoys: Node[]; shownAt: number; resolved: boolean; missCounted: boolean };
type Effect = { kind: "hit" | "miss" | "wrong"; x: number; y: number; start: number; life: number };

const SIGNAL_GO_TIMEOUT_MS = 2200;
const SIGNAL_GAP_MS = 700;

const EFFECT_RGB: Record<Effect["kind"], string> = {
  hit: "45, 212, 160",
  miss: "239, 68, 68",
  wrong: "239, 68, 68",
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export function LevelChallengeStage({
  def,
  comeback,
  reducedMotion,
  play,
  vibrate,
  onComplete,
  onQuit,
  onRestart,
}: {
  def: LevelDef;
  /** True when this level was already failed earlier in the session. */
  comeback: boolean;
  reducedMotion: boolean;
  play: PlayCue;
  vibrate: Vibrate;
  onComplete: (result: LevelChallengeResult) => void;
  onQuit: () => void;
  onRestart: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const accessibilityDescriptionId = useId();

  const [phase, setPhase] = useState<"countdown" | "active" | "interrupted">("countdown");
  const [countdownValue, setCountdownValue] = useState<number>(LEVEL_COUNTDOWN_FROM);
  const [signalLabel, setSignalLabel] = useState<"wait" | "go" | null>(null);
  const [hud, setHud] = useState<LevelChallengeHud>({
    level: def.level,
    left: def.mechanic === "signal" ? (def.signalAttempts ?? 3) : def.opportunities,
    total: def.mechanic === "signal" ? (def.signalAttempts ?? 3) : def.opportunities,
    hits: 0,
    misses: 0,
    wrongTargets: 0,
    accuracy: 0,
    combo: 0,
    required: def.mechanic === "signal" ? (def.signalMinValid ?? 2) : def.requiredHits,
  });

  const playRef = useRef(play);
  const vibrateRef = useRef(vibrate);
  const completeRef = useRef(onComplete);
  const reducedRef = useRef(reducedMotion);
  useEffect(() => {
    playRef.current = play;
    vibrateRef.current = vibrate;
    completeRef.current = onComplete;
    reducedRef.current = reducedMotion;
  }, [play, vibrate, onComplete, reducedMotion]);

  const effectsRef = useRef<Effect[]>([]);
  const game = useRef({
    phase: "countdown" as "countdown" | "active" | "done",
    countdownStart: 0,
    lastTick: LEVEL_COUNTDOWN_FROM + 1,
    width: 0,
    height: 0,
    lastFrame: 0,
    // Shared counters.
    hits: 0,
    misses: 0,
    wrongTargets: 0,
    earlyPresses: 0,
    combo: 0,
    maxCombo: 0,
    hitTimes: [] as number[],
    finished: false,
    // Signal engine.
    signalState: "idle" as "idle" | "waiting" | "go" | "gap",
    signalShownAt: 0,
    signalNextAt: 0,
    attemptsResolved: 0,
    // Target engine.
    round: null as Round | null,
    oppsResolved: 0,
    nextSpawnAt: 0,
  });

  const interruptLevel = useCallback(() => {
    const g = game.current;
    if (g.phase !== "countdown" && g.phase !== "active") return;
    g.phase = "done";
    g.finished = true;
    g.round = null;
    setSignalLabel(null);
    setPhase("interrupted");
    playRef.current("level.fail");
  }, []);

  useActiveGameplayGuards(phase === "countdown" || phase === "active");
  useVisibilityInterruption(phase === "countdown" || phase === "active", interruptLevel);

  const pushHud = useCallback(() => {
    const g = game.current;
    const attempts = g.hits + g.misses + g.wrongTargets;
    const isSignal = def.mechanic === "signal";
    const total = isSignal ? (def.signalAttempts ?? 3) : def.opportunities;
    const used = isSignal ? g.attemptsResolved : g.oppsResolved;
    setHud({
      level: def.level,
      left: Math.max(0, total - used),
      total,
      hits: g.hits,
      misses: g.misses,
      wrongTargets: g.wrongTargets,
      accuracy: attempts > 0 ? Math.round((g.hits / attempts) * 100) : 0,
      combo: g.combo,
      required: isSignal ? (def.signalMinValid ?? 2) : def.requiredHits,
    });
  }, [def]);

  // --- shared finish ---
  const finishLevel = useCallback(() => {
    const g = game.current;
    if (g.finished) return;
    g.finished = true;
    g.phase = "done";
    g.round = null;
    const result = finalizeLevelResult({
      def,
      hits: g.hits,
      misses: g.misses,
      wrongTargets: g.wrongTargets,
      hitTimesMs: g.hitTimes,
      maxCombo: g.maxCombo,
      earlyPresses: g.earlyPresses,
      comebackClear: comeback,
    });
    completeRef.current(result);
  }, [def, comeback]);

  const registerHit = (now: number, hitTimeMs: number, x: number, y: number) => {
    const g = game.current;
    g.hits += 1;
    g.hitTimes.push(Math.max(0, Math.round(hitTimeMs)));
    g.combo += 1;
    g.maxCombo = Math.max(g.maxCombo, g.combo);
    effectsRef.current.push({ kind: "hit", x, y, start: now, life: 460 });
    playRef.current("target.hit");
    vibrateRef.current("tap");
    if (g.combo > 0 && g.combo % 5 === 0) {
      playRef.current("combo.up");
      vibrateRef.current("achievement");
    }
  };

  // --- pointer / key input ---
  const handlePress = (clientX: number, clientY: number) => {
    const g = game.current;
    if (g.phase !== "active") return;
    const now = performance.now();

    if (def.mechanic === "signal") {
      if (g.signalState === "go") {
        const reaction = now - g.signalShownAt;
        registerHit(now, reaction, g.width / 2, g.height / 2);
        resolveSignalAttempt(now);
      } else if (g.signalState === "waiting") {
        // Early press — a penalty, but it does NOT consume the attempt.
        g.earlyPresses += 1;
        g.misses += 1;
        g.combo = 0;
        effectsRef.current.push({ kind: "miss", x: g.width / 2, y: g.height / 2, start: now, life: 420 });
        playRef.current("tooEarly.error");
        vibrateRef.current("tooEarly");
        g.signalNextAt = now + randomSignalWait();
        pushHud();
      }
      return;
    }

    // Target levels need canvas coordinates.
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const round = g.round;
    if (!round || round.resolved) return; // gap / not yet spawned → no penalty

    const cr = currentRadius(round, now);
    if (Math.hypot(x - round.correct.x, y - round.correct.y) <= cr) {
      registerHit(now, now - round.shownAt, round.correct.x, round.correct.y);
      resolveRound(now);
      return;
    }
    // Decoy?
    for (const d of round.decoys) {
      if (Math.hypot(x - d.x, y - d.y) <= d.r) {
        g.wrongTargets += 1;
        g.combo = 0;
        effectsRef.current.push({ kind: "wrong", x: d.x, y: d.y, start: now, life: 420 });
        playRef.current("decoy.wrong");
        vibrateRef.current("tooEarly");
        pushHud();
        return;
      }
    }
    // Empty space — at most one counted miss per round.
    if (!round.missCounted) {
      round.missCounted = true;
      g.misses += 1;
      g.combo = 0;
      effectsRef.current.push({ kind: "miss", x, y, start: now, life: 420 });
      playRef.current("target.miss");
      vibrateRef.current("tooEarly");
      pushHud();
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isGameplayControlTarget(event.target)) return;
    event.preventDefault();
    handlePress(event.clientX, event.clientY);
  };

  // --- signal helpers ---
  function randomSignalWait(): number {
    return SIGNAL_MIN_WAIT_MS + Math.random() * (SIGNAL_MAX_WAIT_MS - SIGNAL_MIN_WAIT_MS);
  }
  function startSignalAttempt(now: number) {
    const g = game.current;
    g.signalState = "waiting";
    g.signalNextAt = now + randomSignalWait();
    setSignalLabel("wait");
  }
  function resolveSignalAttempt(now: number) {
    const g = game.current;
    g.attemptsResolved += 1;
    pushHud();
    const total = def.signalAttempts ?? 3;
    if (g.attemptsResolved >= total) {
      finishLevel();
      return;
    }
    g.signalState = "gap";
    g.signalNextAt = now + SIGNAL_GAP_MS;
    setSignalLabel(null);
  }

  // --- target helpers ---
  function currentRadius(round: Round, now: number): number {
    if (!def.shrink || def.shrinkToRadius === undefined) return round.correct.r;
    const frac = (now - round.shownAt) / def.targetLifetimeMs;
    const toR = scaleRadiusForWidth(def.shrinkToRadius, game.current.width);
    return lerp(round.correct.r, toR, frac);
  }

  function pickPoint(radius: number, avoid: { x: number; y: number; r: number }[]): { x: number; y: number } {
    const g = game.current;
    const minX = radius + EDGE_PADDING;
    const maxX = g.width - radius - EDGE_PADDING;
    const minY = TOP_CONTROLS_RESERVE + radius;
    const maxY = g.height - radius - EDGE_PADDING;
    const rnd = () => ({
      x: minX + Math.random() * Math.max(1, maxX - minX),
      y: minY + Math.random() * Math.max(1, maxY - minY),
    });
    let candidate = rnd();
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const ok = avoid.every((a) => Math.hypot(candidate.x - a.x, candidate.y - a.y) >= a.r + radius + 18);
      if (ok) return candidate;
      candidate = rnd();
    }
    return candidate;
  }

  function spawnRound(now: number) {
    const g = game.current;
    const radius = scaleRadiusForWidth(def.baseRadius, g.width);
    const placed: { x: number; y: number; r: number }[] = [];
    const spot = pickPoint(radius, placed);
    placed.push({ ...spot, r: radius });

    const speed = def.moveSpeed ?? 0;
    const angle = Math.random() * Math.PI * 2;
    const correct: Node = {
      x: spot.x,
      y: spot.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: radius,
      shownAt: now,
    };

    const decoys: Node[] = [];
    for (let i = 0; i < (def.decoys ?? 0); i += 1) {
      const dr = radius;
      const dspot = pickPoint(dr, placed);
      placed.push({ ...dspot, r: dr });
      decoys.push({ x: dspot.x, y: dspot.y, vx: 0, vy: 0, r: dr, shownAt: now });
    }

    g.round = { correct, decoys, shownAt: now, resolved: false, missCounted: false };
    playRef.current(def.mechanic === "decoy" || def.mechanic === "elite" ? "level.start" : "target.spawn");
  }

  function resolveRound(now: number) {
    const g = game.current;
    if (g.round) g.round.resolved = true;
    g.round = null;
    g.oppsResolved += 1;
    g.nextSpawnAt = now + NEXT_SPAWN_DELAY_MS;
    pushHud();
    if (g.oppsResolved >= def.opportunities) finishLevel();
  }

  // --- the loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = 1;
    let raf = 0;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];

    const seed = () => {
      const g = game.current;
      const count = Math.round(Math.min(36, Math.max(12, (g.width * g.height) / 32000)));
      particles.length = 0;
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x: Math.random() * g.width,
          y: Math.random() * g.height,
          vx: (Math.random() - 0.5) * 0.14,
          vy: (Math.random() - 0.5) * 0.14,
          r: Math.random() * 1.5 + 0.5,
          a: Math.random() * 0.3 + 0.1,
        });
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      game.current.width = rect.width;
      game.current.height = rect.height;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) seed();
      // Keep an in-flight target inside the new safe bounds after a resize.
      const r = game.current.round;
      if (r) {
        const clampNode = (n: Node) => {
          n.x = Math.max(n.r + EDGE_PADDING, Math.min(rect.width - n.r - EDGE_PADDING, n.x));
          n.y = Math.max(TOP_CONTROLS_RESERVE + n.r, Math.min(rect.height - n.r - EDGE_PADDING, n.y));
        };
        clampNode(r.correct);
        r.decoys.forEach(clampNode);
      }
    };

    const loop = () => {
      const now = performance.now();
      const g = game.current;
      const W = g.width;
      const H = g.height;
      const dt = g.lastFrame ? Math.min(0.05, (now - g.lastFrame) / 1000) : 0;
      g.lastFrame = now;
      ctx.clearRect(0, 0, W, H);

      if (!reducedRef.current) {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -4) p.x = W + 4;
          if (p.x > W + 4) p.x = -4;
          if (p.y < -4) p.y = H + 4;
          if (p.y > H + 4) p.y = -4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(148, 163, 184, ${p.a})`;
          ctx.fill();
        }
      }

      if (g.phase === "countdown") {
        const elapsed = now - g.countdownStart;
        const value = LEVEL_COUNTDOWN_FROM - Math.floor(elapsed / LEVEL_COUNTDOWN_INTERVAL_MS);
        if (value !== g.lastTick) {
          g.lastTick = value;
          if (value > 0) {
            setCountdownValue(value);
            playRef.current("countdown.tick");
          }
        }
        if (value <= 0) {
          g.phase = "active";
          setPhase("active");
          playRef.current("level.start");
          vibrateRef.current("signal");
          if (def.mechanic === "signal") {
            startSignalAttempt(now);
          } else {
            g.nextSpawnAt = now + 260;
          }
          pushHud();
        }
      } else if (g.phase === "active") {
        if (def.mechanic === "signal") {
          // Signal engine transitions.
          if (g.signalState === "waiting" && now >= g.signalNextAt) {
            g.signalState = "go";
            g.signalShownAt = now;
            setSignalLabel("go");
            playRef.current("signal.go");
            vibrateRef.current("signal");
          } else if (g.signalState === "go" && now - g.signalShownAt >= SIGNAL_GO_TIMEOUT_MS) {
            // Missed the window.
            g.misses += 1;
            g.combo = 0;
            resolveSignalAttempt(now);
          } else if (g.signalState === "gap" && now >= g.signalNextAt) {
            startSignalAttempt(now);
          }
          // Draw the orb (bright on GO, dim while waiting).
          const intensity = g.signalState === "go" ? 0.95 : 0.18;
          const rgb = g.signalState === "go" ? "45, 212, 160" : "100, 116, 139";
          drawSignalOrb(ctx, W / 2, H / 2, Math.min(W, H) * 0.16, rgb, intensity);
        } else {
          // Target engine.
          if (!g.round && g.oppsResolved < def.opportunities && now >= g.nextSpawnAt) {
            spawnRound(now);
            pushHud();
          }
          const round = g.round;
          if (round) {
            const elapsed = now - round.shownAt;
            // Movement (correct target only).
            if (def.moveSpeed) {
              const n = round.correct;
              n.x += n.vx * dt;
              n.y += n.vy * dt;
              const cr = n.r;
              if (n.x < cr + EDGE_PADDING || n.x > W - cr - EDGE_PADDING) n.vx *= -1;
              if (n.y < TOP_CONTROLS_RESERVE + cr || n.y > H - cr - EDGE_PADDING) n.vy *= -1;
              n.x = Math.max(cr + EDGE_PADDING, Math.min(W - cr - EDGE_PADDING, n.x));
              n.y = Math.max(TOP_CONTROLS_RESERVE + cr, Math.min(H - cr - EDGE_PADDING, n.y));
            }
            // Expiry → one miss for the failed opportunity.
            if (elapsed >= def.targetLifetimeMs && !round.resolved) {
              if (!round.missCounted) {
                round.missCounted = true;
                g.misses += 1;
                g.combo = 0;
              }
              resolveRound(now);
            } else {
              const lifeFrac = elapsed / def.targetLifetimeMs;
              const alpha = def.fade ? Math.max(0, 1 - lifeFrac) : 1;
              const cr = currentRadius(round, now);
              for (const d of round.decoys) drawDecoyTarget(ctx, d.x, d.y, d.r, alpha);
              drawCorrectTarget(ctx, round.correct.x, round.correct.y, cr, alpha);
            }
          }
        }
      }

      // Effects.
      const list = effectsRef.current;
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const e = list[i];
        const progress = (now - e.start) / e.life;
        if (progress >= 1) {
          list.splice(i, 1);
          continue;
        }
        if (reducedRef.current) {
          if (progress < 0.5) drawStaticDot(ctx, e.x, e.y, EFFECT_RGB[e.kind]);
          continue;
        }
        drawRipple(ctx, e.x, e.y, progress, EFFECT_RGB[e.kind], e.kind === "hit" ? 54 : 44);
      }

      if (game.current.phase !== "done") raf = window.requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    resize();
    game.current.countdownStart = performance.now();
    raf = window.requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      if (raf) window.cancelAnimationFrame(raf);
    };
    // Engine runs once per mount; the parent remounts via a key to retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard Space/Enter for the signal level only (other levels are pointer-first).
  useEffect(() => {
    if (def.mechanic !== "signal") return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        handlePress(game.current.width / 2, game.current.height / 2);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.mechanic]);

  const goalPct = Math.min(100, hud.required > 0 ? Math.round((hud.hits / hud.required) * 100) : 0);

  return (
    <div
      ref={wrapRef}
      className={cn("rtp-lc-stage", phase === "active" && "rtp-lc-stage--active")}
      role="group"
      aria-label="Level Challenge active stage"
      aria-describedby={accessibilityDescriptionId}
      onPointerDown={handlePointerDown}
    >
      <p id={accessibilityDescriptionId} className="sr-only">
        {accessibilityCanvasDescription("level-challenge")}
      </p>
      <canvas ref={canvasRef} aria-hidden className="rtp-canvas rtp-lc-canvas" />

      {phase === "interrupted" ? (
        <div className="rtp-run-interrupted" role="status" aria-live="assertive">
          <span className="rtp-eyebrow">Level interrupted</span>
          <h2 className="rtp-pause-title">Timing paused for fairness</h2>
          <p className="rtp-play-sub">The tab or app changed while this level was active, so the attempt was not saved.</p>
          <div className="rtp-summary-actions" data-rtp-control="true">
            <Button size="lg" onClick={onRestart}>Try again</Button>
            <Button size="lg" variant="ghost" onClick={onQuit}>Back</Button>
          </div>
        </div>
      ) : phase === "countdown" ? (
        <div className="rtp-lc-countdown">
          <span className="rtp-eyebrow">
            Level {def.level} · {def.title}
          </span>
          <div className="rtp-instruction rtp-instruction--countdown" aria-live="assertive">
            {countdownValue > 0 ? countdownValue : "Go"}
          </div>
          <p className="rtp-play-sub">{def.objective}</p>
        </div>
      ) : (
        <>
          <div className="rtp-lc-hud" aria-live="off" onPointerDown={(e) => e.stopPropagation()}>
            <div className="rtp-th-hud-stat rtp-th-hud-stat--time">
              <span className="rtp-th-hud-label">{def.mechanic === "signal" ? "Try" : "Left"}</span>
              <span className="rtp-th-hud-value">{hud.left}</span>
            </div>
            <div className="rtp-th-hud-stat">
              <span className="rtp-th-hud-label">Hits</span>
              <span className="rtp-th-hud-value">
                {hud.hits}/{hud.required}
              </span>
            </div>
            <div className="rtp-th-hud-stat">
              <span className="rtp-th-hud-label">Miss</span>
              <span className="rtp-th-hud-value">{hud.misses}</span>
            </div>
            {def.decoys ? (
              <div className="rtp-th-hud-stat">
                <span className="rtp-th-hud-label">Wrong</span>
                <span className="rtp-th-hud-value">{hud.wrongTargets}</span>
              </div>
            ) : null}
            <div className="rtp-th-hud-stat">
              <span className="rtp-th-hud-label">Acc</span>
              <span className="rtp-th-hud-value">{hud.accuracy}%</span>
            </div>
            <div className={cn("rtp-th-hud-stat", hud.combo >= 5 && "rtp-th-hud-stat--combo")}>
              <span className="rtp-th-hud-label">Combo</span>
              <span className="rtp-th-hud-value">{hud.combo}</span>
            </div>
          </div>

          {/* Goal progress bar. */}
          <div className="rtp-lc-goal" onPointerDown={(e) => e.stopPropagation()}>
            <span className="rtp-lc-goal-label">
              Goal {hud.hits}/{hud.required}
            </span>
            <span className="rtp-lc-goal-bar" aria-hidden>
              <span className="rtp-lc-goal-fill" style={{ width: `${goalPct}%` }} />
            </span>
          </div>

          {def.mechanic === "signal" ? (
            <div className="rtp-lc-signaltext" aria-live="assertive">
              {signalLabel === "go" ? "GO — press now!" : signalLabel === "wait" ? "Wait…" : ""}
            </div>
          ) : (
            <p className="rtp-th-active-hint">
              <Crosshair className="h-3.5 w-3.5" aria-hidden />{" "}
              {def.decoys ? "Hit the ringed crosshair — avoid the slashed squares" : "Tap the target before it goes"}
            </p>
          )}

          <div className="rtp-th-quit" onPointerDown={(e) => e.stopPropagation()}>
            <Button size="sm" variant="ghost" onClick={onQuit} leftIcon={<LogOut className="h-4 w-4" aria-hidden />}>
              Quit
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
