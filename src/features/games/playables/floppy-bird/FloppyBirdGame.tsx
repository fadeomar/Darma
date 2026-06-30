"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Maximize2, Minimize2, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
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
} from "./floppyBirdEngine";
import { playFloppyBirdSound, unlockFloppyBirdAudio } from "./floppyBirdAudio";
import { commitBestScore, readBestScore, readMuted, writeMuted } from "./floppyBirdStorage";
import type { FloppyBirdModel, FloppyBirdPhase, Medal } from "./floppyBirdTypes";

type SpriteKey = string;

type SpriteRect = { x: number; y: number; w: number; h: number };

const SPRITES: Record<SpriteKey, SpriteRect> = {
  "theme-day": { x: 0, y: 0, w: 288, h: 512 },
  platform: { x: 584, y: 0, w: 336, h: 112 },
  "pipe-red-top": { x: 0, y: 646, w: 52, h: 320 },
  "pipe-red-bottom": { x: 56, y: 646, w: 52, h: 320 },
  "pipe-green-bottom": { x: 168, y: 646, w: 52, h: 320 },
  "pipe-green-top": { x: 112, y: 646, w: 52, h: 320 },
  "score-board": { x: 4, y: 516, w: 232, h: 123 },
  "coin-dull-metal": { x: 224, y: 906, w: 44, h: 44 },
  "coin-dull-bronze": { x: 224, y: 954, w: 44, h: 44 },
  "coin-shine-silver": { x: 242, y: 516, w: 44, h: 44 },
  "coin-shine-gold": { x: 242, y: 564, w: 44, h: 44 },
  "toast-new": { x: 224, y: 1002, w: 32, h: 14 },
  "banner-game-ready": { x: 586, y: 118, w: 192, h: 58 },
  "banner-game-over": { x: 786, y: 118, w: 200, h: 52 },
  "banner-instruction": { x: 584, y: 182, w: 114, h: 98 },
  "btn-play": { x: 706, y: 236, w: 110, h: 64 },
  "btn-ok": { x: 924, y: 84, w: 80, h: 28 },
  "bird-yellow-up": { x: 6, y: 982, w: 34, h: 24 },
  "bird-yellow-mid": { x: 62, y: 982, w: 34, h: 24 },
  "bird-yellow-down": { x: 118, y: 982, w: 34, h: 24 },
  "number-lg-0": { x: 992, y: 120, w: 24, h: 36 },
  "number-lg-1": { x: 272, y: 910, w: 16, h: 36 },
  "number-lg-2": { x: 584, y: 320, w: 24, h: 36 },
  "number-lg-3": { x: 612, y: 320, w: 24, h: 36 },
  "number-lg-4": { x: 640, y: 320, w: 24, h: 36 },
  "number-lg-5": { x: 668, y: 320, w: 24, h: 36 },
  "number-lg-6": { x: 584, y: 368, w: 24, h: 36 },
  "number-lg-7": { x: 612, y: 368, w: 24, h: 36 },
  "number-lg-8": { x: 640, y: 368, w: 24, h: 36 },
  "number-lg-9": { x: 668, y: 368, w: 24, h: 36 },
  "number-md-0": { x: 274, y: 612, w: 14, h: 20 },
  "number-md-1": { x: 278, y: 954, w: 10, h: 20 },
  "number-md-2": { x: 274, y: 978, w: 14, h: 20 },
  "number-md-3": { x: 262, y: 1002, w: 14, h: 20 },
  "number-md-4": { x: 1004, y: 0, w: 14, h: 20 },
  "number-md-5": { x: 1004, y: 24, w: 14, h: 20 },
  "number-md-6": { x: 1010, y: 52, w: 14, h: 20 },
  "number-md-7": { x: 1010, y: 84, w: 14, h: 20 },
  "number-md-8": { x: 586, y: 484, w: 14, h: 20 },
  "number-md-9": { x: 622, y: 412, w: 14, h: 20 },
};

const MEDAL_LABELS: Record<Medal, string> = {
  none: "No medal",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

function medalSprite(medal: Medal): SpriteKey | null {
  if (medal === "bronze") return "coin-dull-bronze";
  if (medal === "silver") return "coin-dull-metal";
  if (medal === "gold") return "coin-shine-gold";
  if (medal === "platinum") return "coin-shine-silver";
  return null;
}

export function FloppyBirdGame({ game }: { game: GameDefinition }) {
  const router = useRouter();
  const [phase, setPhase] = useState<FloppyBirdPhase>("intro");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [muted, setMuted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [medal, setMedal] = useState<Medal>("none");
  const [isRecord, setIsRecord] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const shellRef = useRef<HTMLDivElement | null>(null);
  const focusModeRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const atlasRef = useRef<HTMLImageElement | null>(null);
  const modelRef = useRef<FloppyBirdModel>(createGame(DEFAULT_CONFIG));
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const phaseRef = useRef<FloppyBirdPhase>("intro");
  const mutedRef = useRef(false);
  const bestRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const renderSizeRef = useRef({ scaleX: 1, scaleY: 1, dpr: 1 });

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    bestRef.current = best;
  }, [best]);

  useEffect(() => {
    setBest(readBestScore());
    setMuted(readMuted());
    setHydrated(true);
  }, []);

  useEffect(() => {
    const image = new Image();
    image.src = "/games/floppy-bird/atlas.png";
    image.onload = () => {
      atlasRef.current = image;
      setAssetsReady(true);
    };
    image.onerror = () => setAssetsReady(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedMotionRef.current = query.matches;
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const goReady = useCallback(() => {
    unlockFloppyBirdAudio();
    resetGame(modelRef.current);
    setScore(0);
    setMedal("none");
    setIsRecord(false);
    phaseRef.current = "ready";
    setPhase("ready");
    lastTimeRef.current = null;
    playFloppyBirdSound("swoosh", mutedRef.current);
  }, []);

  const startRun = useCallback(() => {
    unlockFloppyBirdAudio();
    resetGame(modelRef.current);
    flap(modelRef.current);
    setScore(0);
    setMedal("none");
    setIsRecord(false);
    phaseRef.current = "playing";
    setPhase("playing");
    lastTimeRef.current = null;
    playFloppyBirdSound("wing", mutedRef.current);
  }, []);

  const endRun = useCallback(() => {
    if (phaseRef.current === "over") return;
    const finalScore = modelRef.current.score;
    const nextMedal = medalForScore(finalScore);
    const previousBest = bestRef.current;
    const newBest = commitBestScore(finalScore);
    setScore(finalScore);
    setBest(newBest);
    setMedal(nextMedal);
    setIsRecord(finalScore > 0 && newBest > previousBest);
    phaseRef.current = "over";
    setPhase("over");
    playFloppyBirdSound("hit", mutedRef.current);
    window.setTimeout(() => playFloppyBirdSound("die", mutedRef.current), 220);
  }, []);

  const flapAction = useCallback(() => {
    flap(modelRef.current);
    playFloppyBirdSound("wing", mutedRef.current);
  }, []);

  const togglePause = useCallback(() => {
    setPhase((current) => {
      if (current === "playing") {
        phaseRef.current = "paused";
        playFloppyBirdSound("swoosh", mutedRef.current);
        return "paused";
      }
      if (current === "paused") {
        phaseRef.current = "playing";
        lastTimeRef.current = null;
        playFloppyBirdSound("swoosh", mutedRef.current);
        return "playing";
      }
      return current;
    });
  }, []);

  const handleTap = useCallback(() => {
    const current = phaseRef.current;
    if (current === "intro") {
      goReady();
      return;
    }
    if (current === "ready") {
      startRun();
      return;
    }
    if (current === "playing") {
      flapAction();
      return;
    }
    if (current === "paused") {
      togglePause();
    }
  }, [flapAction, goReady, startRun, togglePause]);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      mutedRef.current = next;
      writeMuted(next);
      return next;
    });
  }, []);

  const setFocus = useCallback((next: boolean) => {
    focusModeRef.current = next;
    setFocusMode(next);
    if (typeof document === "undefined") return;
    if (next) {
      shellRef.current?.requestFullscreen?.().catch(() => {
        /* CSS overlay focus mode still applies when fullscreen is unavailable */
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const toggleFocus = useCallback(() => {
    setFocus(!focusModeRef.current);
  }, [setFocus]);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && focusModeRef.current) {
        focusModeRef.current = false;
        setFocusMode(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

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
        case "KeyP":
          event.preventDefault();
          togglePause();
          break;
        case "Enter":
          event.preventDefault();
          if (phaseRef.current === "intro") goReady();
          else if (phaseRef.current === "ready" || phaseRef.current === "over") startRun();
          break;
        case "Escape":
          if (focusModeRef.current) {
            event.preventDefault();
            setFocus(false);
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goReady, handleTap, setFocus, startRun, togglePause]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && phaseRef.current === "playing") togglePause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [togglePause]);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const cssWidth = canvas.clientWidth || WORLD.width;
      const cssHeight = canvas.clientHeight || WORLD.height;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      renderSizeRef.current = { scaleX: cssWidth / WORLD.width, scaleY: cssHeight / WORLD.height, dpr };
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

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
      if ((current === "intro" || current === "ready") && dt > 0) {
        idleStep(model, dt, elapsedRef.current);
      }
      if (current === "playing" && dt > 0) {
        const events = update(model, dt);
        if (events.scored) {
          setScore(events.score);
          playFloppyBirdSound("point", mutedRef.current);
        }
        if (events.hit) endRun();
      }

      drawScene({
        ctx,
        atlas: atlasRef.current,
        model,
        phase: current,
        elapsed: elapsedRef.current,
        best: bestRef.current,
        medal,
        isRecord,
        assetsReady,
        size: renderSizeRef.current,
        reducedMotion: reducedMotionRef.current,
      });
      rafRef.current = window.requestAnimationFrame(frame);
    };

    rafRef.current = window.requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [assetsReady, endRun, isRecord, medal]);

  const displayBest = hydrated ? best : 0;
  const speedTier = Math.round(((speedForScore(score) - DEFAULT_CONFIG.speedStart) / (DEFAULT_CONFIG.speedMax - DEFAULT_CONFIG.speedStart)) * 100);

  return (
    <div ref={shellRef} className={cn("dfb-shell", focusMode && "dfb-shell--focus")}>
      <div className="dfb-topbar">
        <div className="dfb-topbar-info">
          <span className="dfb-eyebrow">Arcade flyer</span>
          <h2 className="dfb-title">{game.title}</h2>
        </div>
        <div className="dfb-top-actions">
          <span className="dfb-top-meta">
            <Badge variant="soft">Tap to fly</Badge>
            <Badge variant="outline">Best {displayBest}</Badge>
          </span>
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
          {phase !== "intro" ? (
            <Button variant="secondary" size="sm" onClick={goReady} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>
              Restart
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFocus}
            aria-pressed={focusMode}
            leftIcon={focusMode ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
          >
            {focusMode ? "Exit focus" : "Focus"}
          </Button>
        </div>
      </div>

      <div className="dfb-play-wrap">
        <div className="dfb-play-layout">
          <div className="dfb-stage-card">
            <div className="dfb-canvas-frame">
              <canvas
                ref={canvasRef}
                className="dfb-canvas"
                role="application"
                tabIndex={0}
                aria-label={`${game.title}. Press Space or tap to flap.`}
                onPointerDown={(event) => {
                  if (event.pointerType === "touch") return;
                  event.preventDefault();
                  canvasRef.current?.focus();
                  handleTap();
                }}
              />
              {!assetsReady ? <div className="dfb-loading">Loading sprites…</div> : null}
              {phase === "intro" ? (
                <button type="button" className="dfb-play-button dfb-play-button--intro" onClick={goReady}>
                  Play
                </button>
              ) : null}
              {phase === "over" ? (
                <button type="button" className="dfb-play-button dfb-play-button--over" onClick={startRun}>
                  Play again
                </button>
              ) : null}
              {phase === "paused" ? (
                <button type="button" className="dfb-play-button dfb-play-button--pause" onClick={togglePause}>
                  Resume
                </button>
              ) : null}
            </div>
          </div>

          <aside className="dfb-side" aria-label="Floppy Bird score and controls">
            <div className="dfb-score-card">
              <span>Score</span>
              <strong>{phase === "intro" || phase === "ready" ? 0 : score}</strong>
            </div>
            <div className="dfb-score-card">
              <span>Best</span>
              <strong>{displayBest}</strong>
            </div>
            <div className="dfb-score-card">
              <span>Medal</span>
              <strong>{MEDAL_LABELS[medalForScore(Math.max(score, 0))]}</strong>
            </div>
            <div className="dfb-score-card">
              <span>Speed</span>
              <strong>{Math.max(0, Math.min(100, speedTier))}%</strong>
            </div>

            <div className="dfb-help-card">
              <h3>Controls</h3>
              <ul>
                <li><kbd>Space</kbd><span>Flap / start</span></li>
                <li><kbd>Tap</kbd><span>Flap</span></li>
                <li><kbd>P</kbd><span>Pause</span></li>
                <li><kbd>Enter</kbd><span>Start / restart</span></li>
              </ul>
            </div>

            <div className="dfb-side-actions">
              <Button className="dfb-back-btn" variant="outline" size="sm" onClick={() => router.push("/games")} leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
                Back to games
              </Button>
              <p>Clear pipes, score points, and earn medals at 10, 20, 30, and 40.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function drawScene({
  ctx,
  atlas,
  model,
  phase,
  elapsed,
  best,
  medal,
  isRecord,
  assetsReady,
  size,
  reducedMotion,
}: {
  ctx: CanvasRenderingContext2D;
  atlas: HTMLImageElement | null;
  model: FloppyBirdModel;
  phase: FloppyBirdPhase;
  elapsed: number;
  best: number;
  medal: Medal;
  isRecord: boolean;
  assetsReady: boolean;
  size: { scaleX: number; scaleY: number; dpr: number };
  reducedMotion: boolean;
}): void {
  ctx.setTransform(size.scaleX * size.dpr, 0, 0, size.scaleY * size.dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);

  if (!atlas || !assetsReady) {
    ctx.fillStyle = "#4ec0ca";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = "#fff";
    ctx.font = "700 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Loading…", WORLD.width / 2, WORLD.height / 2);
    return;
  }

  drawSprite(ctx, atlas, "theme-day", 0, 0, WORLD.width, WORLD.height);
  drawPipes(ctx, atlas, model);
  drawPlatform(ctx, atlas, model.distance, reducedMotion);
  drawBird(ctx, atlas, model, phase, elapsed, reducedMotion);

  if (phase === "playing" || phase === "paused") {
    drawLargeNumber(ctx, atlas, model.score, WORLD.width / 2, 74);
  }

  if (phase === "intro") drawIntro(ctx, atlas, best, elapsed);
  if (phase === "ready") drawReady(ctx, atlas);
  if (phase === "paused") drawPause(ctx);
  if (phase === "over") drawGameOver(ctx, atlas, model.score, best, medal, isRecord);
}

function drawSprite(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement, key: SpriteKey, x: number, y: number, w?: number, h?: number): void {
  const s = SPRITES[key];
  ctx.drawImage(atlas, s.x, s.y, s.w, s.h, Math.round(x), Math.round(y), Math.round(w ?? s.w), Math.round(h ?? s.h));
}

function drawPlatform(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement, distance: number, reducedMotion: boolean): void {
  const y = WORLD.height - DEFAULT_CONFIG.groundHeight;
  const shift = reducedMotion ? 0 : Math.round(distance % 48);
  for (let x = -shift - 48; x < WORLD.width + 48; x += 336) {
    drawSprite(ctx, atlas, "platform", x, y, 336, DEFAULT_CONFIG.groundHeight);
  }
}

function drawPipes(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement, model: FloppyBirdModel): void {
  const groundY = WORLD.height - model.config.groundHeight;
  for (const pipe of model.pipes) {
    const topKey: SpriteKey = pipe.color === "red" ? "pipe-red-top" : "pipe-green-top";
    const bottomKey: SpriteKey = pipe.color === "red" ? "pipe-red-bottom" : "pipe-green-bottom";
    const gapTop = pipe.gapY - pipe.gap / 2;
    const gapBottom = pipe.gapY + pipe.gap / 2;
    drawSprite(ctx, atlas, topKey, pipe.x, gapTop - 320, model.config.pipeWidth, 320);
    drawSprite(ctx, atlas, bottomKey, pipe.x, gapBottom, model.config.pipeWidth, 320);
    if (gapBottom + 320 < groundY) {
      drawSprite(ctx, atlas, bottomKey, pipe.x, gapBottom + 318, model.config.pipeWidth, 320);
    }
  }
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  atlas: HTMLImageElement,
  model: FloppyBirdModel,
  phase: FloppyBirdPhase,
  elapsed: number,
  reducedMotion: boolean,
): void {
  const { bird } = model;
  const frame = reducedMotion ? 1 : Math.abs(Math.floor(elapsed * 10) % 3);
  const key = frame === 0 ? "bird-yellow-up" : frame === 1 ? "bird-yellow-mid" : "bird-yellow-down";
  const rotation = phase === "intro" || phase === "ready" ? 0 : Math.max(-0.35, Math.min(1.25, bird.velocity / 420));
  ctx.save();
  ctx.translate(Math.round(bird.x), Math.round(bird.y));
  ctx.rotate(rotation);
  drawSprite(ctx, atlas, key, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
  ctx.restore();
}

function drawLargeNumber(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement, value: number, centerX: number, y: number): void {
  const digits = String(Math.max(0, Math.floor(value))).split("");
  const gap = 2;
  const widths = digits.map((digit) => SPRITES[`number-lg-${digit}` as SpriteKey].w);
  const total = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, digits.length - 1) * gap;
  let x = centerX - total / 2;
  digits.forEach((digit, index) => {
    const key = `number-lg-${digit}` as SpriteKey;
    const s = SPRITES[key];
    drawSprite(ctx, atlas, key, x, y, s.w, s.h);
    x += widths[index] + gap;
  });
}

function drawMediumNumber(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement, value: number, rightX: number, y: number): void {
  const digits = String(Math.max(0, Math.floor(value))).split("");
  const gap = 2;
  const widths = digits.map((digit) => SPRITES[`number-md-${digit}` as SpriteKey].w);
  const total = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, digits.length - 1) * gap;
  let x = rightX - total;
  digits.forEach((digit, index) => {
    const key = `number-md-${digit}` as SpriteKey;
    const s = SPRITES[key];
    drawSprite(ctx, atlas, key, x, y, s.w, s.h);
    x += widths[index] + gap;
  });
}

function drawIntro(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement, best: number, elapsed: number): void {
  ctx.save();
  ctx.textAlign = "center";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#5b4b56";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 29px monospace";
  ctx.strokeText("Floppy Bird", WORLD.width / 2, 135);
  ctx.fillText("Floppy Bird", WORLD.width / 2, 135);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 11px monospace";
  ctx.fillText("BEST", WORLD.width / 2, 172);
  drawMediumNumber(ctx, atlas, best, WORLD.width / 2 + 20, 182);
  ctx.restore();

  const bob = Math.sin(elapsed * 3) * 5;
  const tempModel = createGame(DEFAULT_CONFIG, 1);
  tempModel.bird.x = WORLD.width / 2;
  tempModel.bird.y = 217 + bob;
  drawBird(ctx, atlas, tempModel, "intro", elapsed, false);
  drawSprite(ctx, atlas, "btn-play", 89, 264, 110, 64);
}

function drawReady(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement): void {
  drawSprite(ctx, atlas, "banner-game-ready", 48, 112, 192, 58);
  drawSprite(ctx, atlas, "banner-instruction", 87, 190, 114, 98);
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 10px monospace";
  ctx.fillText("Tap / Space to start", WORLD.width / 2, 320);
  ctx.restore();
}

function drawPause(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "900 24px monospace";
  ctx.fillText("Paused", WORLD.width / 2, 214);
  ctx.font = "700 10px monospace";
  ctx.fillText("Press P or Resume", WORLD.width / 2, 238);
  ctx.restore();
}

function drawGameOver(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement, score: number, best: number, medal: Medal, isRecord: boolean): void {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.restore();

  drawSprite(ctx, atlas, "banner-game-over", 44, 92, 200, 52);
  drawSprite(ctx, atlas, "score-board", 28, 166, 232, 123);
  drawMediumNumber(ctx, atlas, score, 215, 203);
  drawMediumNumber(ctx, atlas, best, 215, 244);
  const coin = medalSprite(medal);
  if (coin) {
    drawSprite(ctx, atlas, coin, 57, 210, 44, 44);
  } else {
    drawNoMedal(ctx, 79, 232, 21);
  }
  if (isRecord) drawSprite(ctx, atlas, "toast-new", 150, 226, 32, 14);
  drawSprite(ctx, atlas, "btn-ok", 104, 321, 80, 28);
}

/** Muted placeholder so the medal slot reads as "no medal", not a missing asset. */
function drawNoMedal(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(91, 75, 86, 0.12)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(91, 75, 86, 0.32)";
  ctx.stroke();
  ctx.fillStyle = "rgba(91, 75, 86, 0.6)";
  ctx.font = "900 8px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("NO", cx, cy - 4);
  ctx.fillText("MEDAL", cx, cy + 5);
  ctx.restore();
}
