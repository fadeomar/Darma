"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, Heart, Maximize2, Minimize2, Pause, Play, RotateCcw, Volume2, VolumeX, Zap } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { createSimpleGameAudio } from "../shared/simpleGameAudio";
import type { GameDefinition } from "../../domain/game";
import type { RunnerControls, RunnerEvent, RunnerHud, RunnerStats } from "./runnerScene";

const STORAGE_KEY = "darma:endless-runner:best-score";
const MUTE_KEY = "darma:endless-runner:muted";
const MAX_LIVES = 3;

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
    <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-white shadow-inner shadow-black/20">
      <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-amber-200/75">{label}</p>
      <p ref={valueRef} className="mt-1 text-lg font-black leading-none tracking-[-0.03em]">
        {initial}
      </p>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-white shadow-inner shadow-black/20">
      <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-amber-200/75">{label}</p>
      <p className="mt-1 text-lg font-black leading-none tracking-[-0.03em]">{value}</p>
    </div>
  );
}

function TinyTip({ children }: { children: ReactNode }) {
  return <span className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-bold leading-5 text-white/78">{children}</span>;
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
  const router = useRouter();
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

  const isPlaying = hud.phase === "playing";
  const statusLabel = useMemo(() => {
    if (!ready) return "Loading";
    if (hud.phase === "playing") return "Running";
    if (hud.phase === "paused") return "Paused";
    if (hud.phase === "over") return "Game over";
    return "Ready";
  }, [ready, hud.phase]);

  const playSound = useCallback((sound: "start" | "bonus" | "crash" | "drop" | "click") => {
    if (mutedRef.current) return;
    if (!audioRef.current) audioRef.current = createSimpleGameAudio();
    audioRef.current.play(sound);
  }, []);

  const onHud = useCallback((next: RunnerHud) => {
    hudRef.current = next;
    setHud(next);
  }, []);

  const onStats = useCallback((stats: RunnerStats) => {
    if (scoreElRef.current) scoreElRef.current.textContent = String(stats.score);
    if (distanceElRef.current) distanceElRef.current.textContent = String(stats.distance);
    if (speedElRef.current) speedElRef.current.textContent = `${Math.round(stats.speed / 10)}x`;
  }, []);

  const onEvent = useCallback(
    (event: RunnerEvent) => {
      if (event === "start") playSound("start");
      else if (event === "jump") playSound("drop");
      else if (event === "coin") playSound("bonus");
      else if (event === "hit") playSound("crash");
      else if (event === "over") {
        playSound("crash");
        const finalScore = hudRef.current.score;
        if (finalScore > bestRef.current) {
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

    void import("./runnerScene").then(({ launchRunner }) => {
      const parent = containerRef.current;
      if (cancelled || !parent) return;
      controls = launchRunner(parent, { onHud, onStats, onEvent }, bestRef.current);
      controlsRef.current = controls;
      setReady(true);
    });

    return () => {
      cancelled = true;
      controls?.destroy();
      controlsRef.current = null;
      setReady(false);
    };
  }, [onHud, onStats, onEvent]);

  const start = useCallback(() => controlsRef.current?.start(), []);
  const pause = useCallback(() => controlsRef.current?.pause(), []);
  const resume = useCallback(() => controlsRef.current?.resume(), []);
  const restart = useCallback(() => controlsRef.current?.restart(), []);
  const jump = useCallback(() => controlsRef.current?.jump(), []);
  const slide = useCallback(() => controlsRef.current?.slide(), []);

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

  // Keyboard controls (jump / slide / pause / start). Prevent page scroll.
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (["input", "textarea", "select"].includes(tag ?? "")) return;

      if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
        event.preventDefault();
        jump();
      } else if (["ArrowDown", "KeyS"].includes(event.code)) {
        event.preventDefault();
        slide();
      } else if (["KeyP", "Escape"].includes(event.code)) {
        event.preventDefault();
        togglePause();
      } else if (event.code === "Enter") {
        event.preventDefault();
        const phase = hudRef.current.phase;
        if (phase === "paused") resume();
        else if (phase === "playing") jump();
        else start();
      }
    };
    window.addEventListener("keydown", handleKeyboard, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [jump, resume, slide, start, togglePause]);

  // hud.score only changes on phase-change events (0 on idle/restart, final
  // score on game over), so this stays accurate without live score in React.
  const displayBest = Math.max(best, hud.score);
  const overlayVisible = hud.phase !== "playing";

  return (
    <div
      ref={shellRef}
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[#070716] shadow-[var(--shadow-card)]",
        focusMode && "fixed inset-2 z-50 overflow-y-auto rounded-[2rem] border-amber-300/50 bg-[#070716] p-2 sm:inset-4",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/35 px-4 py-3 text-white sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => (focusMode ? setFocusMode(false) : router.push("/games"))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            aria-label={focusMode ? "Exit focus mode" : "Back to games"}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-amber-200/70">Darma Arcade</p>
            <h2 className="truncate text-base font-black tracking-[-0.02em] text-white sm:text-lg">{game.title}</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft">Phaser</Badge>
          <Badge variant={hud.phase === "playing" ? "accent" : "outline"}>{statusLabel}</Badge>
        </div>
      </div>

      <div className={cn("grid gap-4 p-3 sm:p-5", focusMode ? "xl:grid-cols-[minmax(0,1fr)_300px]" : "2xl:grid-cols-[minmax(0,1fr)_290px]")}>
        <div className="min-w-0">
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <LiveStatPill label="Score" valueRef={scoreElRef} initial="0" />
            <StatPill label="Best" value={displayBest} />
            <LiveStatPill label="Meters" valueRef={distanceElRef} initial="0" />
            <LiveStatPill label="Speed" valueRef={speedElRef} initial="30x" />
            <StatPill label="Lives" value={<Hearts lives={hud.lives} />} />
          </div>

          <div
            className="relative mx-auto aspect-[2/1] overflow-hidden rounded-[1.5rem] border border-amber-300/25 bg-slate-950 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            style={{ width: "min(100%, calc(clamp(240px, 100svh - 310px, 500px) * 2))", maxWidth: "100%" }}
          >
            <div
              ref={containerRef}
              className="block h-full w-full touch-none select-none overflow-hidden rounded-[1.1rem] bg-slate-950 [&>canvas]:rounded-[1.1rem]"
              aria-label="Endless Runner game"
              role="img"
              onContextMenu={(event) => event.preventDefault()}
            />

            {overlayVisible ? (
              <div className="pointer-events-none absolute inset-2 flex items-center justify-center rounded-[1.1rem]">
                <div className="max-w-md rounded-[1.5rem] border border-amber-200/35 bg-slate-950/78 p-5 text-center text-white shadow-2xl backdrop-blur-md">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-amber-200/80">
                    {!ready ? "Loading" : hud.phase === "over" ? "Final score" : hud.phase === "paused" ? "Take a breath" : "Sprite-based runner"}
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                    {!ready ? "Preparing…" : hud.phase === "over" ? `${hud.score} points` : hud.phase === "paused" ? "Paused" : "Ready to run"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    {hud.phase === "over"
                      ? `Best score: ${displayBest}. Press restart, Enter, or tap to run again.`
                      : "Jump over ground obstacles, slide under birds and branches, and grab coins. Space/↑/W jump, ↓/S slide."}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={hud.phase === "paused" ? resume : start} size="sm" variant="primary" className="gap-2" disabled={!ready}>
                <Play className="h-4 w-4" aria-hidden />
                {hud.phase === "paused" ? "Resume" : hud.phase === "over" ? "Play again" : "Start"}
              </Button>
              <Button type="button" onClick={pause} size="sm" variant="secondary" className="gap-2" disabled={!isPlaying}>
                <Pause className="h-4 w-4" aria-hidden />
                Pause
              </Button>
              <Button type="button" onClick={restart} size="sm" variant="secondary" className="gap-2" disabled={!ready}>
                <RotateCcw className="h-4 w-4" aria-hidden />
                Restart
              </Button>
              <Button type="button" onClick={jump} size="sm" variant="soft" className="gap-2" disabled={!ready}>
                <Zap className="h-4 w-4" aria-hidden />
                Jump
              </Button>
              <Button type="button" onClick={slide} size="sm" variant="soft" className="gap-2" disabled={!ready}>
                <ArrowDown className="h-4 w-4" aria-hidden />
                Slide
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

            <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
              <TinyTip>Space / ↑ / W = Jump</TinyTip>
              <TinyTip>↓ / S = Slide</TinyTip>
              <TinyTip>P / Esc = Pause</TinyTip>
            </div>
          </div>
        </div>

        <aside className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-white">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/35 bg-amber-300/20 text-2xl">🏃</span>
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-amber-200/70">Endless run</p>
              <h3 className="text-lg font-black tracking-[-0.02em]">Phaser sprite runner</h3>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-white/72">
            <p>This build runs on Phaser with the original parallax forest backgrounds, an animated sprite character, and proper game objects — rocks, crates, spikes, logs, a flying bird, and hanging branches.</p>
            <p>You start with three lives and a short shield after each hit, so a single mistake never ends the run. Jump over ground obstacles, slide under head-height ones, and collect coins.</p>
          </div>
          <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-black/25 p-3 text-xs font-bold text-white/75">
            <span>• Tap the game or the Jump button on mobile.</span>
            <span>• Speed ramps up slowly over distance.</span>
            <span>• Restart is instant — no page reload.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
