"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type TouchEvent, type ReactNode } from "react";
import { Award, Pause, Play, RotateCcw, Shield, Sparkles, Trophy } from "lucide-react";
import { Badge, Button, Select } from "@/components/ui";
import type { GameDefinition } from "../../domain/game";
import { boardFillPercent, createInitialSnakeState, queueDirection, SNAKE_SPEED_MS, stepSnake } from "./snakeEngine";
import { DEFAULT_SNAKE_STATS, loadSnakeStats, recordSnakeGame, saveSnakeStats } from "./snakeStorage";
import type { SnakeDifficulty, SnakeDirection, SnakeMode, SnakeStats, SnakeState } from "./snakeTypes";

type SnakeCellKind = "head" | "body" | "food" | "golden" | "obstacle";

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
  const [state, setState] = useState<SnakeState>(() => createInitialSnakeState({ mode, difficulty, size }));
  const [stats, setStats] = useState<SnakeStats>(DEFAULT_SNAKE_STATS);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const recordedGameOverRef = useRef(false);

  useEffect(() => {
    setStats(loadSnakeStats());
  }, []);

  const reset = useCallback((nextMode = mode, nextDifficulty = difficulty, nextSize = size) => {
    recordedGameOverRef.current = false;
    setState(createInitialSnakeState({ mode: nextMode, difficulty: nextDifficulty, size: nextSize, seed: Date.now() }));
  }, [difficulty, mode, size]);

  useEffect(() => {
    reset(mode, difficulty, size);
  }, [difficulty, mode, reset, size]);

  useEffect(() => {
    if (state.status !== "running") return;
    const interval = window.setInterval(() => {
      setState((current) => stepSnake(current));
    }, Math.max(42, SNAKE_SPEED_MS[state.settings.difficulty] - (state.level - 1) * 5));
    return () => window.clearInterval(interval);
  }, [state.level, state.settings.difficulty, state.status]);

  useEffect(() => {
    if (state.status !== "game-over" || recordedGameOverRef.current) return;
    recordedGameOverRef.current = true;
    const nextStats = recordSnakeGame(stats, state.score, state.apples);
    setStats(nextStats);
    saveSnakeStats(nextStats);
  }, [state.apples, state.score, state.status, stats]);

  function startGame() {
    setState((current) => ({ ...current, status: "running", message: "Game on. Plan two turns ahead." }));
  }

  function togglePause() {
    setState((current) => {
      if (current.status === "running") return { ...current, status: "paused", message: "Paused. Take the next turn calmly." };
      if (current.status === "paused" || current.status === "ready") return { ...current, status: "running", message: "Back in motion." };
      return current;
    });
  }

  function changeDirection(direction: SnakeDirection) {
    setState((current) => {
      const next = queueDirection(current, direction);
      if (next.status === "ready") return { ...next, status: "running", message: "Great start. Keep the lane open." };
      return next;
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const direction = KEY_TO_DIRECTION[event.key];
    if (direction) {
      event.preventDefault();
      changeDirection(direction);
      return;
    }
    if (event.key === " " || event.key.toLowerCase() === "p") {
      event.preventDefault();
      togglePause();
    }
  }

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
    changeDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  }

  const occupiedMap = useMemo(() => {
    const map = new Map<string, SnakeCellKind>();
    state.obstacles.forEach((point) => map.set(`${point.x}:${point.y}`, "obstacle"));
    state.snake.forEach((point, index) => map.set(`${point.x}:${point.y}`, index === 0 ? "head" : "body"));
    map.set(`${state.food.x}:${state.food.y}`, "food");
    if (state.goldenFood) map.set(`${state.goldenFood.x}:${state.goldenFood.y}`, "golden");
    return map;
  }, [state.food.x, state.food.y, state.goldenFood, state.obstacles, state.snake]);

  const fillPercent = boardFillPercent(state);
  const isNewRecord = state.status === "game-over" && state.score >= stats.highScore && state.score > 0;

  return (
    <section
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label={`${game.title} playable area`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3 sm:px-5">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-primary)]">Arcade pro build</p>
          <h2 className="text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Snake Pro</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">Classic snake upgraded with modes, pace, maze, golden food, stats, and mobile swipes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft">Score {state.score}</Badge>
          <Badge variant="outline">High {Math.max(stats.highScore, state.score)}</Badge>
          <Badge variant="outline">Level {state.level}</Badge>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-5">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[radial-gradient(circle_at_top,var(--color-primary-soft),transparent_45%),var(--color-surface-base)] p-3">
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Apples" value={String(state.apples)} />
            <Stat label="Streak" value={String(state.streak)} />
            <Stat label="Fill" value={`${fillPercent}%`} />
            <Stat label="Speed" value={DIFFICULTY_LABEL[state.settings.difficulty]} />
          </div>

          <div
            className="mx-auto grid max-w-[min(74vh,620px)] touch-none gap-[3px] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-border-subtle)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            style={{ gridTemplateColumns: `repeat(${state.settings.size}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: state.settings.size * state.settings.size }).map((_, index) => {
              const x = index % state.settings.size;
              const y = Math.floor(index / state.settings.size);
              const kind = occupiedMap.get(`${x}:${y}`);
              return <Cell key={`${x}-${y}`} kind={kind} isHead={kind === "head"} />;
            })}
          </div>

          {state.status !== "running" ? (
            <div className="absolute inset-3 flex items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface-overlay)]/85 p-5 text-center backdrop-blur-md">
              <div className="max-w-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--radius-full)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  {state.status === "game-over" ? <Trophy className="h-7 w-7" aria-hidden /> : <Play className="h-7 w-7" aria-hidden />}
                </div>
                <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">
                  {state.status === "game-over" ? (isNewRecord ? "New high score" : "Game over") : state.status === "paused" ? "Paused" : "Ready"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{state.message}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {state.status === "game-over" ? <Button onClick={() => reset()} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>Play again</Button> : <Button onClick={startGame} leftIcon={<Play className="h-4 w-4" aria-hidden />}>Start</Button>}
                  {state.status === "paused" ? <Button variant="secondary" onClick={togglePause}>Resume</Button> : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-3">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <h3 className="text-sm font-black text-[var(--color-text-primary)]">Game setup</h3>
            <div className="mt-3 space-y-3">
              <label className="block text-xs font-bold text-[var(--color-text-muted)]">
                Mode
                <Select className="mt-1" value={mode} onChange={(event) => setMode(event.target.value as SnakeMode)}>
                  {Object.entries(MODE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </label>
              <label className="block text-xs font-bold text-[var(--color-text-muted)]">
                Difficulty
                <Select className="mt-1" value={difficulty} onChange={(event) => setDifficulty(event.target.value as SnakeDifficulty)}>
                  {Object.entries(DIFFICULTY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </label>
              <label className="block text-xs font-bold text-[var(--color-text-muted)]">
                Board size
                <Select className="mt-1" value={String(size)} onChange={(event) => setSize(Number(event.target.value))}>
                  <option value="14">Compact 14×14</option>
                  <option value="16">Balanced 16×16</option>
                  <option value="20">Large 20×20</option>
                </Select>
              </label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button onClick={togglePause} variant={state.status === "running" ? "secondary" : "primary"} leftIcon={state.status === "running" ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}>
                {state.status === "running" ? "Pause" : "Start"}
              </Button>
              <Button variant="secondary" onClick={() => reset()} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>Reset</Button>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <h3 className="text-sm font-black text-[var(--color-text-primary)]">Touch controls</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <span />
              <Button variant="secondary" onClick={() => changeDirection("up")}>↑</Button>
              <span />
              <Button variant="secondary" onClick={() => changeDirection("left")}>←</Button>
              <Button variant="soft" onClick={togglePause}>Pause</Button>
              <Button variant="secondary" onClick={() => changeDirection("right")}>→</Button>
              <span />
              <Button variant="secondary" onClick={() => changeDirection("down")}>↓</Button>
              <span />
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--color-text-secondary)]">Keyboard: arrows or WASD. Mobile: swipe on the board or use the buttons.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Feature icon={<Sparkles className="h-4 w-4" aria-hidden />} title="Golden food" text="Every 5 apples can spawn a timed bonus worth extra points." />
            <Feature icon={<Shield className="h-4 w-4" aria-hidden />} title="Modes" text="Use classic walls, portal wrapping, or maze blocks for different skill curves." />
            <Feature icon={<Award className="h-4 w-4" aria-hidden />} title="Local records" text={`High score ${stats.highScore}, best apples ${stats.bestApples}, games ${stats.gamesPlayed}.`} />
          </div>
        </aside>
      </div>
    </section>
  );
}

function Cell({ kind, isHead }: { kind?: SnakeCellKind; isHead?: boolean }) {
  const className =
    kind === "head"
      ? "bg-[var(--color-primary)] shadow-[0_0_0_2px_var(--color-primary-border),0_0_18px_var(--color-primary-soft)]"
      : kind === "body"
        ? "bg-[var(--color-primary-soft)] border border-[var(--color-primary-border)]"
        : kind === "food"
          ? "bg-[var(--color-success)] rounded-[var(--radius-full)] shadow-[0_0_16px_var(--color-success-bg)]"
          : kind === "golden"
            ? "bg-[var(--color-warning)] rounded-[var(--radius-full)] shadow-[0_0_18px_var(--color-warning-bg)]"
            : kind === "obstacle"
              ? "bg-[var(--color-text-tertiary)]"
              : "bg-[var(--color-surface-overlay)]";
  return <div className={`aspect-square rounded-[4px] ${className}`} aria-label={kind ? `${kind}${isHead ? " current head" : ""}` : "empty"} />;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-3 text-center">
      <div className="font-mono text-lg font-black text-[var(--color-text-primary)]">{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]">
        <span className="text-[var(--color-primary)]">{icon}</span>
        {title}
      </div>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{text}</p>
    </div>
  );
}
