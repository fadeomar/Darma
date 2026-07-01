"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent,
  type ReactNode,
} from "react";
import {
  Award,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge, Button, Select } from "@/components/ui";
import type { GameDefinition } from "../../domain/game";
import {
  boardFillPercent,
  createInitialSnakeState,
  queueDirection,
  snakeStepIntervalMs,
  stepSnake,
} from "./snakeEngine";
import {
  DEFAULT_SNAKE_PREFERENCES,
  DEFAULT_SNAKE_STATS,
  loadSnakePreferences,
  loadSnakeStats,
  recordSnakeGame,
  saveSnakePreferences,
  saveSnakeStats,
} from "./snakeStorage";
import type {
  SnakeDifficulty,
  SnakeDirection,
  SnakeMode,
  SnakeStats,
  SnakeState,
} from "./snakeTypes";
import {
  createSimpleGameAudio,
  type SimpleGameSound,
} from "../shared/simpleGameAudio";
import { SnakeBoard } from "./SnakeBoard";

const DIFFICULTY_LABEL: Record<SnakeDifficulty, string> = {
  chill: "Chill",
  normal: "Normal",
  fast: "Fast",
  insane: "Insane",
};

const MODE_LABEL: Record<SnakeMode, string> = {
  classic: "Classic walls",
  wrap: "Portal wrap",
  maze: "Maze runner",
};

const KEY_TO_DIRECTION: Record<string, SnakeDirection> = {
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
};

export function SnakeGame({ game }: { game: GameDefinition }) {
  const [mode, setMode] = useState<SnakeMode>("classic");
  const [difficulty, setDifficulty] = useState<SnakeDifficulty>("normal");
  const [size, setSize] = useState(16);
  const [state, setState] = useState<SnakeState>(() =>
    createInitialSnakeState({ mode, difficulty, size }),
  );
  const [stats, setStats] = useState<SnakeStats>(DEFAULT_SNAKE_STATS);
  const [showGrid, setShowGrid] = useState(DEFAULT_SNAKE_PREFERENCES.showGrid);
  const [focusMode, setFocusMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(
    DEFAULT_SNAKE_PREFERENCES.soundEnabled,
  );
  const shellRef = useRef<HTMLElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const recordedGameOverRef = useRef(false);
  const handledTickRef = useRef(-1);
  const audioRef = useRef<ReturnType<typeof createSimpleGameAudio> | null>(
    null,
  );

  useEffect(() => {
    setStats(loadSnakeStats());
    const prefs = loadSnakePreferences();
    setShowGrid(prefs.showGrid);
    setSoundEnabled(prefs.soundEnabled);
    audioRef.current = createSimpleGameAudio();
  }, []);

  useEffect(() => {
    saveSnakePreferences({ showGrid, soundEnabled });
  }, [showGrid, soundEnabled]);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setFocusMode(false);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function toggleFocusMode() {
    setFocusMode((current) => {
      const next = !current;
      if (next) {
        shellRef.current?.requestFullscreen?.().catch(() => {
          /* CSS overlay focus mode still applies when fullscreen is unavailable */
        });
      } else if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
      return next;
    });
  }

  function playSound(sound: SimpleGameSound) {
    if (!soundEnabled) return;
    audioRef.current?.unlock();
    audioRef.current?.play(sound);
  }

  const reset = useCallback(
    (nextMode = mode, nextDifficulty = difficulty, nextSize = size) => {
      recordedGameOverRef.current = false;
      setState(
        createInitialSnakeState({
          mode: nextMode,
          difficulty: nextDifficulty,
          size: nextSize,
          seed: Date.now(),
        }),
      );
    },
    [difficulty, mode, size],
  );

  useEffect(() => {
    reset(mode, difficulty, size);
  }, [difficulty, mode, reset, size]);

  useEffect(() => {
    if (state.status !== "running") return;
    const interval = window.setInterval(() => {
      setState((current) => stepSnake(current));
    }, snakeStepIntervalMs(state.settings.difficulty, state.level));
    return () => window.clearInterval(interval);
  }, [state.level, state.settings.difficulty, state.status]);

  useEffect(() => {
    if (state.status !== "game-over" || recordedGameOverRef.current) return;
    recordedGameOverRef.current = true;
    const nextStats = recordSnakeGame(stats, state.score, state.apples);
    setStats(nextStats);
    saveSnakeStats(nextStats);
  }, [state.apples, state.score, state.status, stats]);

  useEffect(() => {
    if (state.ticks === handledTickRef.current) return;
    handledTickRef.current = state.ticks;
    if (state.event === "eat") playSound("eat");
    if (state.event === "golden") playSound("bonus");
    if (state.event.startsWith("crash")) playSound("crash");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.event, state.ticks]);

  function startGame() {
    playSound("start");
    setState((current) => ({
      ...current,
      status: "running",
      message: "Game on. Plan two turns ahead.",
    }));
  }

  function togglePause() {
    setState((current) => {
      if (current.status === "running")
        return {
          ...current,
          status: "paused",
          message: "Paused. Take the next turn calmly.",
        };
      if (current.status === "paused" || current.status === "ready")
        return { ...current, status: "running", message: "Back in motion." };
      return current;
    });
  }

  function changeDirection(direction: SnakeDirection) {
    setState((current) => {
      // Game over freezes movement until Reset / Play Again; keys are inert.
      if (current.status === "game-over") return current;
      const next = queueDirection(current, direction);
      if (next !== current)
        playSound(current.status === "ready" ? "start" : "move");
      // A movement key both starts a ready game and resumes a paused one, so the
      // player never has to reach for the mouse mid-round.
      if (next.status === "ready")
        return {
          ...next,
          status: "running",
          message: "Great start. Keep the lane open.",
        };
      if (current.status === "paused")
        return { ...next, status: "running", message: "Back in motion." };
      return next;
    });
  }

  // Keyboard lives on `window`, not the game root, so arrows/WASD work even when
  // focus is on a Start/Reset button, a Select, or nothing at all. A ref holds the
  // latest handler so the listener is installed once but always sees fresh state.
  const keyHandlerRef = useRef<(event: globalThis.KeyboardEvent) => void>(
    () => {},
  );

  // Runs after every render so the ref always points at the current closure
  // (fresh changeDirection / togglePause), without re-installing the listener.
  useEffect(() => {
    keyHandlerRef.current = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // Never hijack typing in form fields / editable content.
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      const direction = KEY_TO_DIRECTION[event.key];
      if (direction) {
        event.preventDefault(); // stop arrows/WASD from scrolling the page
        changeDirection(direction);
        return;
      }
      if (event.key === " " || event.key.toLowerCase() === "p") {
        event.preventDefault();
        togglePause();
      }
    };
  });

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) =>
      keyHandlerRef.current(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    // The board sets `touch-action: none`, so this swipe won't scroll the page.
    event.preventDefault();
    changeDirection(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up",
    );
  }

  const fillPercent = boardFillPercent(state);
  const isNewRecord =
    state.status === "game-over" &&
    state.score >= stats.highScore &&
    state.score > 0;

  return (
    <section
      ref={shellRef}
      className={`dsnk-shell ${focusMode ? "dsnk-shell--focus" : "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]"}`}
      aria-label={`${game.title} playable area`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3 sm:px-5">
        <div>
          {!focusMode ? (
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-primary)]">
              Arcade pro build
            </p>
          ) : null}
          <h2 className="text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
            Snake Pro
          </h2>
          {!focusMode ? (
            <p className="text-xs text-[var(--color-text-secondary)]">
              Classic snake upgraded with modes, pace, maze, golden food, stats,
              and mobile swipes.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft">Score {state.score}</Badge>
          <Badge variant="outline">
            High {Math.max(stats.highScore, state.score)}
          </Badge>
          <Badge variant="outline">Level {state.level}</Badge>
        </div>
      </div>

      <div className="dsnk-layout grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-5">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[radial-gradient(circle_at_top,var(--color-primary-soft),transparent_45%),var(--color-surface-base)] p-3">
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Apples" value={String(state.apples)} />
            <Stat label="Streak" value={String(state.streak)} />
            <Stat label="Fill" value={`${fillPercent}%`} />
            <Stat
              label="Speed"
              value={DIFFICULTY_LABEL[state.settings.difficulty]}
            />
          </div>

          <div
            className="dsnk-arena-wrap relative"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="dsnk-arena">
              <SnakeBoard state={state} showGrid={showGrid} />
            </div>

            {state.status !== "running" ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-md)] bg-black/55 p-5 text-center backdrop-blur-md">
                <div className="max-w-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--radius-full)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    {state.status === "game-over" ? (
                      <Trophy className="h-7 w-7" aria-hidden />
                    ) : (
                      <Play className="h-7 w-7" aria-hidden />
                    )}
                  </div>
                  <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                    {state.status === "game-over"
                      ? isNewRecord
                        ? "New high score"
                        : "Game over"
                      : state.status === "paused"
                        ? "Paused"
                        : "Ready"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/80">
                    {state.message}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {state.status === "game-over" ? (
                      <Button
                        onClick={() => reset()}
                        leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
                      >
                        Play again
                      </Button>
                    ) : (
                      <Button
                        onClick={startGame}
                        leftIcon={<Play className="h-4 w-4" aria-hidden />}
                      >
                        Start
                      </Button>
                    )}
                    {state.status === "paused" ? (
                      <Button variant="secondary" onClick={togglePause}>
                        Resume
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            {!focusMode ? (
              <>
                <h3 className="text-sm font-black text-[var(--color-text-primary)]">
                  Game setup
                </h3>
                <div className="mt-3 space-y-3">
                  <label className="block text-xs font-bold text-[var(--color-text-muted)]">
                    Mode
                    <Select
                      className="mt-1"
                      value={mode}
                      onChange={(event) =>
                        setMode(event.target.value as SnakeMode)
                      }
                    >
                      {Object.entries(MODE_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="block text-xs font-bold text-[var(--color-text-muted)]">
                    Difficulty
                    <Select
                      className="mt-1"
                      value={difficulty}
                      onChange={(event) =>
                        setDifficulty(event.target.value as SnakeDifficulty)
                      }
                    >
                      {Object.entries(DIFFICULTY_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="block text-xs font-bold text-[var(--color-text-muted)]">
                    Board size
                    <Select
                      className="mt-1"
                      value={String(size)}
                      onChange={(event) => setSize(Number(event.target.value))}
                    >
                      <option value="14">Compact 14×14</option>
                      <option value="16">Balanced 16×16</option>
                      <option value="20">Large 20×20</option>
                    </Select>
                  </label>
                </div>
              </>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                onClick={togglePause}
                variant={state.status === "running" ? "secondary" : "primary"}
                leftIcon={
                  state.status === "running" ? (
                    <Pause className="h-4 w-4" aria-hidden />
                  ) : (
                    <Play className="h-4 w-4" aria-hidden />
                  )
                }
              >
                {state.status === "running" ? "Pause" : "Start"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => reset()}
                leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
              >
                Reset
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowGrid((value) => !value)}
                leftIcon={<LayoutGrid className="h-4 w-4" aria-hidden />}
              >
                {showGrid ? "Hide grid" : "Show grid"}
              </Button>
              <Button
                variant="secondary"
                onClick={toggleFocusMode}
                leftIcon={
                  focusMode ? (
                    <Minimize2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <Maximize2 className="h-4 w-4" aria-hidden />
                  )
                }
              >
                {focusMode ? "Exit full" : "Full screen"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSoundEnabled((value) => !value)}
                leftIcon={
                  soundEnabled ? (
                    <Volume2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <VolumeX className="h-4 w-4" aria-hidden />
                  )
                }
              >
                {soundEnabled ? "Sound on" : "Sound off"}
              </Button>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <h3 className="text-sm font-black text-[var(--color-text-primary)]">
              Touch controls
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <span />
              <Button variant="secondary" onClick={() => changeDirection("up")}>
                ↑
              </Button>
              <span />
              <Button
                variant="secondary"
                onClick={() => changeDirection("left")}
              >
                ←
              </Button>
              <Button variant="soft" onClick={togglePause}>
                Pause
              </Button>
              <Button
                variant="secondary"
                onClick={() => changeDirection("right")}
              >
                →
              </Button>
              <span />
              <Button
                variant="secondary"
                onClick={() => changeDirection("down")}
              >
                ↓
              </Button>
              <span />
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--color-text-secondary)]">
              Keyboard: arrows or WASD. Mobile: swipe on the board or use the
              buttons.
            </p>
          </div>

          {!focusMode ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Feature
                icon={<Sparkles className="h-4 w-4" aria-hidden />}
                title="Golden food"
                text="Every 5 apples can spawn a timed bonus worth extra points."
              />
              <Feature
                icon={<Shield className="h-4 w-4" aria-hidden />}
                title="Modes"
                text="Use classic walls, portal wrapping, or maze blocks for different skill curves."
              />
              <Feature
                icon={<Award className="h-4 w-4" aria-hidden />}
                title="Local records"
                text={`High score ${stats.highScore}, best apples ${stats.bestApples}, games ${stats.gamesPlayed}.`}
              />
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-3 text-center">
      <div className="font-mono text-lg font-black text-[var(--color-text-primary)]">
        {value}
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {label}
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]">
        <span className="text-[var(--color-primary)]">{icon}</span>
        {title}
      </div>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
        {text}
      </p>
    </div>
  );
}
