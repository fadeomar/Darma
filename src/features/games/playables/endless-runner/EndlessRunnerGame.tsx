"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { ArrowDown, Heart, Maximize2, Minimize2, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX, Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { createSimpleGameAudio, type SimpleGameSound } from "../shared/simpleGameAudio";
import type { GameDefinition } from "../../domain/game";
import type { RunnerControls, RunnerEvent, RunnerHud, RunnerStats } from "./runnerScene";

const STORAGE_KEY = "darma:endless-runner:best-score";
const MUTE_KEY = "darma:endless-runner:muted";
const MAX_LIVES = 3;
const BASE_SPEED = 300;

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

const INITIAL_HUD: RunnerHud = { phase: "idle", score: 0, distance: 0, speed: 300, lives: MAX_LIVES };

// Score/distance/speed change every frame during play. Rendering them through
// React state would mean a re-render several times a second for the whole
// game shell. Instead this pill owns a plain DOM node and is only ever
// written to imperatively (via the ref) from the Phaser scene's throttled
// onStats callback — React never re-renders it once mounted.
function LiveStatPill({ label, valueRef, initial }: { label: string; valueRef: RefObject<HTMLParagraphElement | null>; initial: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-black/35 px-2 py-1.5 text-white shadow-inner shadow-black/20 backdrop-blur-sm sm:px-3 sm:py-2">
      <p className="truncate font-mono text-xs font-black uppercase tracking-[0.12em] text-amber-100/70">{label}</p>
      <p ref={valueRef} className="mt-1 truncate text-sm font-black leading-none tracking-[-0.03em] sm:text-lg">
        {initial}
      </p>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-black/35 px-2 py-1.5 text-white shadow-inner shadow-black/20 backdrop-blur-sm sm:px-3 sm:py-2">
      <p className="truncate font-mono text-xs font-black uppercase tracking-[0.12em] text-amber-100/70">{label}</p>
      <p className="mt-1 truncate text-sm font-black leading-none tracking-[-0.03em] sm:text-lg">{value}</p>
    </div>
  );
}

function Hearts({ lives }: { lives: number }) {
  return (
    <span className="flex items-center gap-1">
      {Array.from({ length: MAX_LIVES }).map((_, index) => (
        <Heart
          key={index}
          className={cn("h-4 w-4", index < lives ? "fill-rose-400 text-rose-400" : "text-white/25")}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function EndlessRunnerGame({ game }: { game: GameDefinition }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<RunnerControls | null>(null);
  const audioRef = useRef<ReturnType<typeof createSimpleGameAudio> | null>(null);
  const mutedRef = useRef(false);
  const bestRef = useRef(0);
  const hudRef = useRef<RunnerHud>(INITIAL_HUD);

  // Written directly by onStats, never through setState — see LiveStatPill.
  const scoreElRef = useRef<HTMLParagraphElement | null>(null);
  const distanceElRef = useRef<HTMLParagraphElement | null>(null);
  const speedElRef = useRef<HTMLParagraphElement | null>(null);

  const [ready, setReady] = useState(false);
  // hud only changes on phase transitions, life loss, or a new best — never
  // on every-frame score/distance/speed ticks (those go through onStats).
  const [hud, setHud] = useState<RunnerHud>(INITIAL_HUD);
  const [best, setBest] = useState(0);
  const [muted, setMuted] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [newBest, setNewBest] = useState(false);

  const isPlaying = hud.phase === "playing";
  const statusLabel = useMemo(() => {
    if (!ready) return "Loading";
    if (hud.phase === "playing") return "Running";
    if (hud.phase === "paused") return "Paused";
    if (hud.phase === "over") return "Game over";
    return "Ready";
  }, [ready, hud.phase]);

  const playSound = useCallback((sound: SimpleGameSound) => {
    if (mutedRef.current) return;
    if (!audioRef.current) audioRef.current = createSimpleGameAudio();
    audioRef.current.play(sound);
  }, []);

  const onHud = useCallback((next: RunnerHud) => {
    hudRef.current = next;
    // Phase updates are rare, so synchronizing the DOM here is cheap and keeps
    // restart/game-over values accurate before the next throttled stats tick.
    if (scoreElRef.current) scoreElRef.current.textContent = String(next.score);
    if (distanceElRef.current) distanceElRef.current.textContent = String(next.distance);
    if (speedElRef.current) speedElRef.current.textContent = `${(next.speed / BASE_SPEED).toFixed(1)}×`;
    setHud(next);
  }, []);

  const onStats = useCallback((stats: RunnerStats) => {
    if (scoreElRef.current) scoreElRef.current.textContent = String(stats.score);
    if (distanceElRef.current) distanceElRef.current.textContent = String(stats.distance);
    if (speedElRef.current) speedElRef.current.textContent = `${(stats.speed / BASE_SPEED).toFixed(1)}×`;
  }, []);

  const onEvent = useCallback(
    (event: RunnerEvent) => {
      if (event === "start") {
        setNewBest(false);
        playSound("start");
      } else if (event === "jump") playSound("jump");
      else if (event === "slide") playSound("slide");
      else if (event === "fast-fall") playSound("drop");
      else if (event === "land") playSound("land");
      else if (event === "coin") playSound("bonus");
      else if (event === "hit") playSound("crash");
      else if (event === "over") {
        playSound("lose");
        const finalScore = hudRef.current.score;
        const beatBest = finalScore > bestRef.current;
        setNewBest(beatBest);
        if (beatBest) {
          bestRef.current = finalScore;
          writeBest(finalScore);
          setBest(finalScore);
        }
      }
    },
    [playSound],
  );

  // Load persisted state before mounting Phaser.
  useEffect(() => {
    const savedBest = readNumber(STORAGE_KEY, 0);
    const savedMuted = readMuted();
    bestRef.current = savedBest;
    mutedRef.current = savedMuted;
    setBest(savedBest);
    setMuted(savedMuted);
  }, []);

  // Mount Phaser client-side only, and always destroy it on unmount so we never
  // leak a running game loop or a duplicated canvas.
  useEffect(() => {
    let cancelled = false;
    let controls: RunnerControls | null = null;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (event: MediaQueryListEvent) => controls?.setReducedMotion(event.matches);
    motionQuery.addEventListener("change", handleMotionChange);

    void import("./runnerScene").then(({ launchRunner }) => {
      const parent = containerRef.current;
      if (cancelled || !parent) return;
      controls = launchRunner(parent, { onHud, onStats, onEvent }, bestRef.current, {
        reducedMotion: motionQuery.matches,
      });
      controlsRef.current = controls;
      setReady(true);
    });

    return () => {
      cancelled = true;
      motionQuery.removeEventListener("change", handleMotionChange);
      controls?.destroy();
      controlsRef.current = null;
      audioRef.current?.destroy();
      audioRef.current = null;
      setReady(false);
    };
  }, [onHud, onStats, onEvent]);

  const start = useCallback(() => controlsRef.current?.start(), []);
  const pause = useCallback(() => controlsRef.current?.pause(), []);
  const resume = useCallback(() => controlsRef.current?.resume(), []);
  const restart = useCallback(() => controlsRef.current?.restart(), []);
  const jump = useCallback(() => controlsRef.current?.jump(), []);
  const downStart = useCallback(() => controlsRef.current?.downStart(), []);
  const downEnd = useCallback(() => controlsRef.current?.downEnd(), []);

  const togglePause = useCallback(() => {
    if (hudRef.current.phase === "playing") pause();
    else if (hudRef.current.phase === "paused") resume();
  }, [pause, resume]);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      mutedRef.current = next;
      writeMuted(next);
      return next;
    });
  }, []);

  const toggleFocus = useCallback(() => setFocusMode((current) => !current), []);

  useEffect(() => {
    if (!focusMode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [focusMode]);

  // Keyboard controls use explicit press/release state. This prevents browser
  // key-repeat from continually extending a slide and gives airborne Down a
  // responsive fast-fall that stops as soon as the key is released.
  useEffect(() => {
    const isInteractiveTarget = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      const tag = element?.tagName.toLowerCase();
      return element?.isContentEditable || ["input", "textarea", "select", "button", "a"].includes(tag ?? "");
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) return;

      if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
        event.preventDefault();
        if (!event.repeat) jump();
      } else if (["ArrowDown", "KeyS"].includes(event.code)) {
        event.preventDefault();
        if (!event.repeat) downStart();
      } else if (["KeyP", "Escape"].includes(event.code)) {
        event.preventDefault();
        if (!event.repeat) togglePause();
      } else if (event.code === "KeyR") {
        event.preventDefault();
        if (!event.repeat) restart();
      } else if (event.code === "Enter") {
        event.preventDefault();
        if (event.repeat) return;
        const phase = hudRef.current.phase;
        if (phase === "paused") resume();
        else if (phase === "playing") jump();
        else start();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (["ArrowDown", "KeyS"].includes(event.code)) {
        event.preventDefault();
        downEnd();
      }
    };

    const pauseForInterruption = () => {
      downEnd();
      if (hudRef.current.phase === "playing") pause();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") pauseForInterruption();
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp, { passive: false });
    window.addEventListener("blur", pauseForInterruption);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", pauseForInterruption);
      document.removeEventListener("visibilitychange", handleVisibility);
      downEnd();
    };
  }, [downEnd, downStart, jump, pause, restart, resume, start, togglePause]);

  const startDownPointer = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      downStart();
    },
    [downStart],
  );

  const endDownPointer = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      downEnd();
    },
    [downEnd],
  );

  const handleDownKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (!["Space", "Enter"].includes(event.code)) return;
      event.preventDefault();
      if (!event.repeat) downStart();
    },
    [downStart],
  );

  const handleDownKeyUp = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (!["Space", "Enter"].includes(event.code)) return;
      event.preventDefault();
      downEnd();
    },
    [downEnd],
  );

  // hud.score only changes on phase-change events (0 on idle/restart, final
  // score on game over), so this stays accurate without live score in React.
  const displayBest = Math.max(best, hud.score);
  const overlayVisible = hud.phase !== "playing";

  return (
    <div
      ref={shellRef}
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[#070716] shadow-[var(--shadow-card)]",
        focusMode && "fixed inset-2 z-50 overflow-y-auto rounded-[1.75rem] border-amber-300/40 bg-[#070716] p-2 sm:inset-4",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/35 px-3 py-2.5 text-white sm:px-4">
        <div className="min-w-0">
          <p className="font-mono text-xs font-black uppercase tracking-[0.14em] text-amber-100/60">Darma Arcade</p>
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            <h2 className="truncate text-sm font-black tracking-[-0.02em] text-white sm:text-base">{game.title}</h2>
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-mono text-xs font-black uppercase tracking-[0.1em]",
                hud.phase === "playing"
                  ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
                  : "border-white/15 bg-white/10 text-white/70",
              )}
              aria-live="polite"
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            aria-label={muted ? "Turn sound on" : "Mute game sound"}
            aria-pressed={muted}
          >
            {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={toggleFocus}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            aria-label={focusMode ? "Exit focus mode" : "Open focus mode"}
            aria-pressed={focusMode}
          >
            {focusMode ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>

      <div className="p-2 sm:p-3">
        <div
          className={cn(
            "relative mx-auto aspect-[2/1] w-full overflow-hidden rounded-[1.25rem] border border-amber-300/20 bg-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.42)]",
            focusMode ? "max-w-[1400px]" : "max-w-[1200px]",
          )}
        >
          <div
            ref={containerRef}
            className="block h-full w-full touch-none select-none overflow-hidden rounded-[1.2rem] bg-slate-950 [&>canvas]:rounded-[1.2rem]"
            aria-label="Endless Runner game"
            role="img"
            onContextMenu={(event) => event.preventDefault()}
          />

          <div className="pointer-events-none absolute inset-x-2 top-2 z-20 grid grid-cols-5 gap-1 sm:inset-x-3 sm:top-3 sm:gap-2">
            <LiveStatPill label="Score" valueRef={scoreElRef} initial="0" />
            <StatPill label="Best" value={displayBest} />
            <LiveStatPill label="Meters" valueRef={distanceElRef} initial="0" />
            <LiveStatPill label="Speed" valueRef={speedElRef} initial="1.0×" />
            <StatPill label="Lives" value={<Hearts lives={hud.lives} />} />
          </div>

          {overlayVisible ? (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-end justify-center bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent p-3 sm:p-5">
              <div className="pointer-events-auto w-full max-w-[560px] rounded-[1.1rem] border border-amber-100/25 bg-slate-950/80 p-2.5 text-white shadow-2xl backdrop-blur-md sm:rounded-[1.25rem] sm:p-4">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-mono text-xs font-black uppercase tracking-[0.14em] text-amber-100/70">
                      {newBest && hud.phase === "over" ? <Sparkles className="h-3 w-3" aria-hidden /> : null}
                      {!ready
                        ? "Loading stage"
                        : hud.phase === "over"
                          ? newBest
                            ? "New personal best"
                            : "Run complete"
                          : hud.phase === "paused"
                            ? "Run paused"
                            : "First move"}
                    </p>
                    <h3 className="mt-0.5 text-base font-black tracking-[-0.035em] sm:mt-1 sm:text-2xl">
                      {!ready
                        ? "Preparing…"
                        : hud.phase === "over"
                          ? newBest
                            ? `${hud.score} — new best!`
                            : `${hud.score} points`
                          : hud.phase === "paused"
                            ? "Ready when you are"
                            : "Read ahead, then react"}
                    </h3>
                    <p className="mt-1 hidden max-w-md text-xs leading-5 text-white/70 sm:block sm:text-sm">
                      {hud.phase === "over"
                        ? newBest
                          ? "That run set a new local record. Replay immediately and try to extend it."
                          : `Best score: ${displayBest}. Replay immediately without reloading the page.`
                        : hud.phase === "paused"
                          ? "Your position is frozen. Resume when you are ready to continue."
                          : "Jump over ground obstacles. Hold Down or S to slide, or use it in the air to fast-fall."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={hud.phase === "paused" ? resume : hud.phase === "over" ? restart : start}
                    size="sm"
                    variant="primary"
                    className="min-h-9 shrink-0 gap-2 px-3 sm:min-h-[38px] sm:px-5"
                    disabled={!ready}
                  >
                    <Play className="h-4 w-4" aria-hidden />
                    {hud.phase === "paused" ? "Resume" : hud.phase === "over" ? "Run again" : "Start run"}
                  </Button>
                </div>
                {hud.phase === "over" ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                    <div className="rounded-lg bg-white/[0.05] px-2 py-2">
                      <p className="font-mono text-xs font-black uppercase tracking-[0.1em] text-white/45">Distance</p>
                      <p className="mt-1 text-sm font-black">{hud.distance} m</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.05] px-2 py-2">
                      <p className="font-mono text-xs font-black uppercase tracking-[0.1em] text-white/45">Top speed</p>
                      <p className="mt-1 text-sm font-black">{(hud.speed / BASE_SPEED).toFixed(1)}×</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.05] px-2 py-2">
                      <p className="font-mono text-xs font-black uppercase tracking-[0.1em] text-white/45">Best</p>
                      <p className="mt-1 text-sm font-black">{displayBest}</p>
                    </div>
                  </div>
                ) : hud.phase === "idle" ? (
                  <div className="mt-3 hidden flex-wrap gap-1.5 border-t border-white/10 pt-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white/60 sm:flex">
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1">Space / ↑ / W · jump</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1">Hold ↓ / S · slide</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1">P / Esc · pause</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 border-t border-white/10 bg-black/20 p-3 sm:p-4 lg:grid-cols-[auto_minmax(300px,440px)_minmax(0,1fr)] lg:items-center">
        <div className="order-2 flex flex-wrap gap-2 lg:order-1">
          <Button type="button" onClick={hud.phase === "paused" ? resume : start} size="sm" variant="secondary" className="gap-2 border-white/10 bg-white/[0.06] text-white hover:bg-white/10" disabled={!ready}>
            <Play className="h-4 w-4" aria-hidden />
            {hud.phase === "paused" ? "Resume" : hud.phase === "over" ? "Play again" : "Start"}
          </Button>
          <Button type="button" onClick={pause} size="sm" variant="secondary" className="gap-2 border-white/10 bg-white/[0.06] text-white hover:bg-white/10" disabled={!isPlaying}>
            <Pause className="h-4 w-4" aria-hidden />
            Pause
          </Button>
          <Button type="button" onClick={restart} size="sm" variant="secondary" className="gap-2 border-white/10 bg-white/[0.06] text-white hover:bg-white/10" disabled={!ready}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Restart
          </Button>
        </div>

        <div className="order-1 grid grid-cols-2 gap-2 lg:order-2">
          <Button type="button" onClick={jump} size="lg" variant="soft" className="min-h-12 gap-2 border-amber-200/20 bg-amber-200/10 text-amber-50 hover:bg-amber-200/15" disabled={!ready}>
            <Zap className="h-4 w-4" aria-hidden />
            Jump
          </Button>
          <Button
            type="button"
            size="lg"
            variant="soft"
            className="min-h-12 touch-none gap-2 border-sky-200/20 bg-sky-200/10 text-sky-50 hover:bg-sky-200/15"
            disabled={!ready}
            onPointerDown={startDownPointer}
            onPointerUp={endDownPointer}
            onPointerCancel={endDownPointer}
            onKeyDown={handleDownKeyDown}
            onKeyUp={handleDownKeyUp}
            aria-label="Hold to slide on the ground or fast-fall in the air"
          >
            <ArrowDown className="h-4 w-4" aria-hidden />
            Slide / Drop
          </Button>
        </div>

        <p className="order-3 text-xs leading-5 text-white/60 lg:text-right">
          Keyboard: <strong className="text-white/80">Space / ↑ / W</strong> jumps · <strong className="text-white/80">hold ↓ / S</strong> slides or fast-falls · <strong className="text-white/80">P / Esc</strong> pauses · <strong className="text-white/80">R</strong> restarts
        </p>
      </div>
    </div>
  );
}
