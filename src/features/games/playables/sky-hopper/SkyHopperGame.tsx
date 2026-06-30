"use client";

/**
 * Sky Hopper — the production player for `/games/sky-hopper`.
 *
 * An original reskin of the classic "tap to fly through the gaps" arcade game.
 * The simulation lives in `skyHopperEngine.ts` (delta-time, frame-rate
 * independent) and is held in a ref; a single requestAnimationFrame loop advances
 * physics and renders to a high-DPI canvas. React state only changes on discrete
 * events (score, phase), never per frame, so the UI stays cheap and smooth.
 *
 * All artwork is drawn procedurally on the canvas and all audio is synthesized —
 * no copyrighted Flappy Bird sprites or sounds are used. See ATTRIBUTION.md.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bird as BirdIcon,
  Gamepad2,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameDefinition } from "../../domain/game";
import {
  createGame,
  DEFAULT_CONFIG,
  flap,
  idleStep,
  medalForScore,
  resetGame,
  speedForScore,
  update,
  WORLD,
} from "./skyHopperEngine";
import { playSkyHopperSound, unlockSkyHopperAudio } from "./skyHopperAudio";
import { commitBestScore, readBestScore, readMuted, writeMuted } from "./skyHopperStorage";
import type { Medal, SkyHopperModel, SkyHopperPhase } from "./skyHopperTypes";

const MEDAL_LABELS: Record<Medal, string> = {
  none: "No medal",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

const CONTROLS: { keys: string; label: string }[] = [
  { keys: "Space / ↑", label: "Flap" },
  { keys: "Click / Tap", label: "Flap" },
  { keys: "P", label: "Pause" },
  { keys: "Enter", label: "Start / Restart" },
];

export function SkyHopperGame({ game }: { game: GameDefinition }) {
  const router = useRouter();

  const [phase, setPhase] = useState<SkyHopperPhase>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [muted, setMuted] = useState(false);
  const [medal, setMedal] = useState<Medal>("none");
  const [isRecord, setIsRecord] = useState(false);
  const [milestone, setMilestone] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<SkyHopperModel>(createGame(DEFAULT_CONFIG));
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const phaseRef = useRef<SkyHopperPhase>("ready");
  const mutedRef = useRef(false);
  const bestRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const milestoneTimerRef = useRef<number | null>(null);
  const renderSize = useRef({ scale: 1, dpr: 1 });

  // Keep refs in sync with state the RAF loop must read without re-subscribing.
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    bestRef.current = best;
  }, [best]);

  // Hydrate best score + mute preference from storage.
  useEffect(() => {
    setBest(readBestScore());
    setMuted(readMuted());
    setHydrated(true);
  }, []);

  // Track reduced-motion preference.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reducedMotionRef.current = query.matches;
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const showMilestone = useCallback((text: string) => {
    setMilestone(text);
    if (milestoneTimerRef.current) window.clearTimeout(milestoneTimerRef.current);
    milestoneTimerRef.current = window.setTimeout(() => setMilestone(null), 1100);
  }, []);

  const endGame = useCallback(() => {
    if (phaseRef.current === "over") return;
    phaseRef.current = "over";
    setPhase("over");
    const finalScore = modelRef.current.score;
    const wonMedal = medalForScore(finalScore);
    setMedal(wonMedal);
    const previousBest = bestRef.current;
    const newBest = commitBestScore(finalScore);
    const record = finalScore > 0 && newBest > previousBest;
    setBest(newBest);
    setIsRecord(record);
    playSkyHopperSound("hit", mutedRef.current);
    window.setTimeout(() => playSkyHopperSound("gameover", mutedRef.current), 240);
    if (record && wonMedal !== "none") {
      window.setTimeout(() => playSkyHopperSound("medal", mutedRef.current), 620);
    }
  }, []);

  const startGame = useCallback(() => {
    resetGame(modelRef.current);
    setScore(0);
    setMedal("none");
    setIsRecord(false);
    setMilestone(null);
    lastTimeRef.current = null;
    phaseRef.current = "playing";
    setPhase("playing");
    unlockSkyHopperAudio();
    playSkyHopperSound("start", mutedRef.current);
  }, []);

  const flapAction = useCallback(() => {
    flap(modelRef.current);
    playSkyHopperSound("flap", mutedRef.current);
  }, []);

  const togglePause = useCallback(() => {
    setPhase((current) => {
      if (current === "playing") {
        phaseRef.current = "paused";
        return "paused";
      }
      if (current === "paused") {
        phaseRef.current = "playing";
        lastTimeRef.current = null;
        return "playing";
      }
      return current;
    });
  }, []);

  // Primary interaction: flap while playing, start from ready, resume from pause.
  const handleTap = useCallback(() => {
    const current = phaseRef.current;
    if (current === "ready") {
      startGame();
      return;
    }
    if (current === "playing") {
      flapAction();
      return;
    }
    if (current === "paused") {
      togglePause();
    }
    // "over" intentionally ignores taps; restart is via the button / Enter.
  }, [startGame, flapAction, togglePause]);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      mutedRef.current = next;
      writeMuted(next);
      return next;
    });
  }, []);

  // Keyboard controls (window-level so the game responds without focusing the canvas).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

      switch (event.code) {
        case "Space":
        case "ArrowUp":
          event.preventDefault();
          handleTap();
          break;
        case "ArrowDown":
          event.preventDefault();
          break;
        case "KeyP":
          event.preventDefault();
          togglePause();
          break;
        case "Enter":
          event.preventDefault();
          if (phaseRef.current === "ready" || phaseRef.current === "over") startGame();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleTap, togglePause, startGame]);

  // Auto-pause when the tab is hidden so the bird doesn't "fall" in the background.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && phaseRef.current === "playing") togglePause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [togglePause]);

  // Prevent the page from scrolling when tapping the canvas on touch devices.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouchStart = (event: TouchEvent) => {
      event.preventDefault();
      handleTap();
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    return () => canvas.removeEventListener("touchstart", onTouchStart);
  }, [handleTap]);

  // High-DPI sizing: keep the backing store matched to the displayed size.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const cssWidth = canvas.clientWidth || WORLD.width;
      const cssHeight = canvas.clientHeight || WORLD.height;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      renderSize.current = { scale: cssWidth / WORLD.width, dpr };
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // The single animation loop. Runs for the component's lifetime; advances physics
  // only while playing, and always renders so overlays sit on a live scene.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (!canvas || !ctx) return;

    const frame = (time: number) => {
      const last = lastTimeRef.current;
      lastTimeRef.current = time;
      const dt = last === null ? 0 : Math.min((time - last) / 1000, 0.1);
      elapsedRef.current += dt;

      const model = modelRef.current;
      const current = phaseRef.current;

      if (current === "playing" && dt > 0) {
        const events = update(model, dt);
        if (events.scored) {
          setScore(events.score);
          playSkyHopperSound("point", mutedRef.current);
          if (events.score > 0 && events.score % 10 === 0) {
            showMilestone(`${events.score} — keep flying!`);
            playSkyHopperSound("medal", mutedRef.current);
          }
        }
        if (events.hit) endGame();
      } else if (current === "ready") {
        idleStep(model, dt, elapsedRef.current);
      }

      drawScene(ctx, model, current, elapsedRef.current, renderSize.current, reducedMotionRef.current);
      rafRef.current = window.requestAnimationFrame(frame);
    };

    rafRef.current = window.requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [endGame, showMilestone]);

  // Cleanup the milestone timer on unmount.
  useEffect(() => () => {
    if (milestoneTimerRef.current) window.clearTimeout(milestoneTimerRef.current);
  }, []);

  const displayBest = hydrated ? best : 0;
  const speedTier = Math.round(((speedForScore(score) - DEFAULT_CONFIG.speedStart) / (DEFAULT_CONFIG.speedMax - DEFAULT_CONFIG.speedStart)) * 100);

  return (
    <div className="dsh-shell">
      <div className="dsh-topbar">
        <div className="dsh-topbar-id">
          <span className="dsh-eyebrow">Arcade flyer</span>
          <h2 className="dsh-topbar-title">{game.title}</h2>
        </div>
        <div className="dsh-topbar-controls">
          <Badge variant="soft">Tap to fly</Badge>
          <Badge variant="outline">Best {displayBest}</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            aria-pressed={muted}
            leftIcon={muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
          >
            {muted ? "Muted" : "Sound"}
          </Button>
          {phase === "playing" || phase === "paused" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePause}
              leftIcon={phase === "paused" ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
            >
              {phase === "paused" ? "Resume" : "Pause"}
            </Button>
          ) : null}
          {phase !== "ready" ? (
            <Button variant="secondary" size="sm" onClick={startGame} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>
              Restart
            </Button>
          ) : null}
        </div>
      </div>

      <div className="dsh-stage">
        <div className="dsh-layout">
          <div className="dsh-board-wrap">
            <div className="dsh-board">
              <canvas
                ref={canvasRef}
                className="dsh-canvas"
                role="application"
                tabIndex={0}
                aria-label={`${game.title} play area. Press space or tap to flap and fly through the gaps.`}
                onPointerDown={(event) => {
                  // Touch is handled by the native non-passive listener; avoid double-flaps.
                  if (event.pointerType === "touch") return;
                  event.preventDefault();
                  canvasRef.current?.focus();
                  handleTap();
                }}
              />

              {/* Live score HUD (kept out of the canvas for crispness + a11y). */}
              {phase === "playing" || phase === "paused" ? (
                <div className="dsh-score" aria-live="off">
                  <span>{score}</span>
                </div>
              ) : null}

              {milestone ? <div className="dsh-milestone" role="status">{milestone}</div> : null}

              {phase === "ready" ? (
                <Overlay>
                  <span className="dsh-overlay-eyebrow"><BirdIcon className="h-4 w-4" aria-hidden /> Ready?</span>
                  <h3 className="dsh-overlay-title">Flap through the sky</h3>
                  <p className="dsh-overlay-text">
                    Tap, click, or press Space to flap. Glide through the cloud gaps — each one you clear scores a
                    point. The gaps tighten and the wind picks up as you go.
                  </p>
                  <Button size="lg" onClick={startGame} leftIcon={<Play className="h-5 w-5" aria-hidden />}>
                    Start game
                  </Button>
                  <p className="dsh-overlay-hint">Press Enter or Space to start</p>
                </Overlay>
              ) : null}

              {phase === "paused" ? (
                <Overlay>
                  <span className="dsh-overlay-eyebrow">Paused</span>
                  <h3 className="dsh-overlay-title">Catch your breath</h3>
                  <div className="dsh-overlay-actions">
                    <Button size="lg" onClick={togglePause} leftIcon={<Play className="h-5 w-5" aria-hidden />}>
                      Resume
                    </Button>
                    <Button size="lg" variant="outline" onClick={startGame} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
                      Restart
                    </Button>
                  </div>
                  <p className="dsh-overlay-hint">Press P to resume</p>
                </Overlay>
              ) : null}

              {phase === "over" ? (
                <Overlay>
                  <span className="dsh-overlay-eyebrow">Game over</span>
                  <h3 className="dsh-overlay-title">Nice flight!</h3>
                  {isRecord ? (
                    <span className="dsh-record">
                      <Trophy className="h-4 w-4" aria-hidden /> New best score!
                    </span>
                  ) : null}
                  <div className="dsh-result-grid">
                    <ResultStat label="Score" value={score} highlight />
                    <ResultStat label="Best" value={displayBest} />
                    <MedalStat medal={medal} />
                  </div>
                  <div className="dsh-overlay-actions">
                    <Button size="lg" onClick={startGame} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
                      Play again
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => router.push("/games")}
                      leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}
                    >
                      Back to games
                    </Button>
                  </div>
                  <p className="dsh-overlay-hint">Press Enter to play again</p>
                </Overlay>
              ) : null}
            </div>
          </div>

          <aside className="dsh-panel" aria-label="Sky Hopper stats and controls">
            <div className="dsh-stat-grid">
              <div className="dsh-stat dsh-stat--highlight">
                <span className="dsh-stat-label">Score</span>
                <span className="dsh-stat-value">{phase === "ready" ? 0 : score}</span>
              </div>
              <div className="dsh-stat">
                <span className="dsh-stat-label">Best</span>
                <span className="dsh-stat-value">{displayBest}</span>
              </div>
              <div className="dsh-stat">
                <span className="dsh-stat-label">Medal</span>
                <span className="dsh-stat-value dsh-stat-value--sm">{MEDAL_LABELS[medalForScore(Math.max(score, 0))]}</span>
              </div>
              <div className="dsh-stat">
                <span className="dsh-stat-label">Wind</span>
                <span className="dsh-stat-value dsh-stat-value--sm">{Math.max(0, Math.min(100, speedTier))}%</span>
              </div>
            </div>

            <div className="dsh-panel-card">
              <span className="dsh-panel-kicker">
                <Sparkles className="h-4 w-4" aria-hidden /> Difficulty ramp
              </span>
              <p>The cloud gap narrows and the breeze speeds up the further you fly. Every 10 points is a milestone.</p>
            </div>

            <div className="dsh-panel-card">
              <span className="dsh-panel-kicker">
                <Keyboard className="h-4 w-4" aria-hidden /> Controls
              </span>
              <ul className="dsh-guide-list">
                {CONTROLS.map((control) => (
                  <li key={`${control.keys}-${control.label}`} className="dsh-guide-item">
                    <kbd className="dsh-kbd">{control.keys}</kbd>
                    <span>{control.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <div className="dsh-guide">
        <span className="dsh-guide-title">
          <Gamepad2 className="h-4 w-4" aria-hidden /> How to play
        </span>
        <span>Flap to stay airborne and thread each gap. On touch, tap anywhere on the play area. Your best score is saved on this device.</span>
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="dsh-overlay">
      <div className="dsh-overlay-card">{children}</div>
    </div>
  );
}

function ResultStat({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn("dsh-result-stat", highlight && "dsh-result-stat--highlight")}>
      <span className="dsh-stat-label">{label}</span>
      <span className="dsh-result-value">{value}</span>
    </div>
  );
}

function MedalStat({ medal }: { medal: Medal }) {
  return (
    <div className="dsh-result-stat">
      <span className="dsh-stat-label">Medal</span>
      <span className="dsh-result-value dsh-result-value--sm">
        {medal === "none" ? "—" : <span className={cn("dsh-medal-chip", `dsh-medal-chip--${medal}`)}>{MEDAL_LABELS[medal]}</span>}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Canvas rendering (all original, procedural artwork)                        */
/* ------------------------------------------------------------------------- */

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  model: SkyHopperModel,
  phase: SkyHopperPhase,
  elapsed: number,
  size: { scale: number; dpr: number },
  reducedMotion: boolean,
): void {
  const { scale, dpr } = size;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);

  const w = WORLD.width;
  const h = WORLD.height;
  const groundY = h - model.config.groundHeight;

  // Sky gradient.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#7ec9f0");
  sky.addColorStop(0.55, "#aee3f7");
  sky.addColorStop(1, "#d8f3ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sun glow.
  const sun = ctx.createRadialGradient(w * 0.78, h * 0.2, 6, w * 0.78, h * 0.2, 90);
  sun.addColorStop(0, "rgba(255, 246, 209, 0.95)");
  sun.addColorStop(1, "rgba(255, 246, 209, 0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  // Parallax clouds (slow). Frozen position under reduced motion.
  const cloudShift = reducedMotion ? 0 : (model.distance * 0.18) % (w + 120);
  drawCloud(ctx, ((w * 0.2 - cloudShift) % (w + 120) + (w + 120)) % (w + 120) - 60, h * 0.18, 1);
  drawCloud(ctx, ((w * 0.7 - cloudShift) % (w + 120) + (w + 120)) % (w + 120) - 60, h * 0.32, 0.75);
  drawCloud(ctx, ((w * 1.15 - cloudShift) % (w + 120) + (w + 120)) % (w + 120) - 60, h * 0.12, 0.6);

  // Pipes (soft rounded pillars).
  for (const pipe of model.pipes) {
    drawPillar(ctx, pipe.x, 0, model.config.pipeWidth, pipe.gapTop, "top");
    drawPillar(ctx, pipe.x, pipe.gapTop + pipe.gap, model.config.pipeWidth, groundY - (pipe.gapTop + pipe.gap), "bottom");
  }

  // Ground with parallax stripes.
  drawGround(ctx, groundY, w, h - groundY, model.distance, reducedMotion);

  // Bird.
  drawBird(ctx, model, phase, elapsed, reducedMotion);
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  const r = 18 * scale;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r, y + r * 0.3, r * 0.9, 0, Math.PI * 2);
  ctx.arc(x + r * 2, y, r * 0.8, 0, Math.PI * 2);
  ctx.arc(x + r, y - r * 0.4, r * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPillar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, height: number, end: "top" | "bottom"): void {
  if (height <= 0) return;
  const body = ctx.createLinearGradient(x, 0, x + w, 0);
  body.addColorStop(0, "#7fd17f");
  body.addColorStop(0.5, "#5cbb5c");
  body.addColorStop(1, "#3f9d49");
  ctx.fillStyle = body;
  roundRectPath(ctx, x, y, w, height, 10);
  ctx.fill();

  // Highlight stripe.
  ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
  roundRectPath(ctx, x + 6, y + (end === "bottom" ? 6 : 4), 7, Math.max(0, height - 12), 4);
  ctx.fill();

  // Cap at the gap-facing end.
  const capHeight = 18;
  const capY = end === "top" ? y + height - capHeight : y;
  const cap = ctx.createLinearGradient(x, 0, x + w, 0);
  cap.addColorStop(0, "#6cc56c");
  cap.addColorStop(1, "#3c9446");
  ctx.fillStyle = cap;
  roundRectPath(ctx, x - 4, capY, w + 8, capHeight, 7);
  ctx.fill();
  ctx.strokeStyle = "rgba(31, 92, 45, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGround(ctx: CanvasRenderingContext2D, groundY: number, w: number, height: number, distance: number, reducedMotion: boolean): void {
  // Grass band.
  ctx.fillStyle = "#7fd17a";
  ctx.fillRect(0, groundY, w, 12);
  ctx.fillStyle = "#6bbe68";
  ctx.fillRect(0, groundY + 10, w, 4);

  // Sandy soil.
  const soil = ctx.createLinearGradient(0, groundY + 12, 0, groundY + height);
  soil.addColorStop(0, "#e7d39a");
  soil.addColorStop(1, "#d6bf82");
  ctx.fillStyle = soil;
  ctx.fillRect(0, groundY + 12, w, height - 12);

  // Parallax dashes.
  ctx.fillStyle = "rgba(160, 128, 72, 0.45)";
  const stripeWidth = 26;
  const shift = reducedMotion ? 0 : distance % (stripeWidth * 2);
  for (let x = -stripeWidth * 2 - shift; x < w + stripeWidth; x += stripeWidth * 2) {
    ctx.fillRect(x, groundY + 22, stripeWidth, 5);
  }
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  model: SkyHopperModel,
  phase: SkyHopperPhase,
  elapsed: number,
  reducedMotion: boolean,
): void {
  const { bird } = model;
  const maxFall = 520;
  const rotation =
    phase === "ready"
      ? 0
      : Math.max(-0.45, Math.min(1.1, bird.velocity / maxFall)) * (bird.velocity < 0 ? 0.9 : 1.3);

  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(rotation);

  // Soft shadow.
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  ctx.beginPath();
  ctx.ellipse(2, bird.radius + 3, bird.radius * 0.9, bird.radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body.
  const body = ctx.createRadialGradient(-4, -4, 3, 0, 0, bird.radius + 4);
  body.addColorStop(0, "#fff0a8");
  body.addColorStop(0.6, "#ffd23f");
  body.addColorStop(1, "#f7a823");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
  ctx.fill();

  // Belly.
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.beginPath();
  ctx.arc(2, 4, bird.radius * 0.62, 0, Math.PI * 2);
  ctx.fill();

  // Wing (flaps with the flap timer; gentle idle bob otherwise).
  const wingPhase = reducedMotion ? 0.2 : bird.wing > 0 ? 1 - bird.wing / 0.18 : (Math.sin(elapsed * 10) + 1) / 2;
  const wingY = -2 + wingPhase * 8;
  ctx.fillStyle = "#f3b53a";
  ctx.beginPath();
  ctx.ellipse(-3, wingY, bird.radius * 0.6, bird.radius * 0.42, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(180, 120, 20, 0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Eye.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(bird.radius * 0.45, -bird.radius * 0.35, bird.radius * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#26323f";
  ctx.beginPath();
  ctx.arc(bird.radius * 0.55, -bird.radius * 0.35, bird.radius * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Beak.
  ctx.fillStyle = "#ff8a3d";
  ctx.beginPath();
  ctx.moveTo(bird.radius * 0.7, -bird.radius * 0.05);
  ctx.lineTo(bird.radius * 1.35, bird.radius * 0.1);
  ctx.lineTo(bird.radius * 0.7, bird.radius * 0.32);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
