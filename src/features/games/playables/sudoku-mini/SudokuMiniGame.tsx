"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameDefinition } from "../../domain/game";
import {
  applyHint,
  createInitialSudokuState,
  enterValue,
  eraseCell,
  findConflicts,
  formatSudokuTime,
  generateSudokuPuzzle,
  getPeerCells,
  isGiven,
  redoSudokuMove,
  undoSudokuMove,
} from "./sudokuEngine";
import {
  clearSudokuSave,
  emptySudokuStats,
  readSudokuSave,
  readSudokuStats,
  recordSudokuCompletion,
  recordSudokuStart,
  writeSudokuSave,
  writeSudokuStats,
} from "./sudokuStorage";
import type { SudokuDifficulty, SudokuGameState, SudokuMode, SudokuSize, SudokuStats } from "./sudokuTypes";

const DIFFICULTIES: SudokuDifficulty[] = ["easy", "medium", "hard", "expert"];
const MODES: { id: SudokuMode; label: string; description: string }[] = [
  { id: "classic", label: "Classic", description: "Normal play with timer and mistakes." },
  { id: "zen", label: "Zen", description: "Relaxed play with no game over." },
  { id: "mistake-limit", label: "3 mistakes", description: "Game over after three wrong entries." },
];

function makePuzzle(size: SudokuSize, difficulty: SudokuDifficulty, mode: SudokuMode, seed = `${Date.now()}`): SudokuGameState {
  return createInitialSudokuState(generateSudokuPuzzle({ size, difficulty, seed }), mode);
}

function getBestTime(stats: SudokuStats, state: SudokuGameState): number | null {
  return stats.bestTimes[`${state.puzzle.size}-${state.puzzle.difficulty}`] ?? null;
}

function getCompletedNumbers(state: SudokuGameState): Set<number> {
  const complete = new Set<number>();
  for (let value = 1; value <= state.puzzle.size; value += 1) {
    const correctCount = state.values.filter((cell, index) => cell === value && state.puzzle.solution[index] === value).length;
    if (correctCount === state.puzzle.size) complete.add(value);
  }
  return complete;
}

function getConflictCells(state: SudokuGameState): Set<number> {
  const cells = new Set<number>();
  state.values.forEach((value, index) => {
    if (!value) return;
    const conflicts = findConflicts(state.values, state.puzzle, index);
    conflicts.forEach((cell) => cells.add(cell));
    if (conflicts.length > 0) cells.add(index);
    if (!isGiven(state.puzzle, index) && value !== state.puzzle.solution[index]) cells.add(index);
  });
  return cells;
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 text-center">
      <div className="font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{value}</div>
    </div>
  );
}

export function SudokuMiniGame({ game }: { game: GameDefinition }) {
  const [size, setSize] = useState<SudokuSize>(6);
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>("medium");
  const [mode, setMode] = useState<SudokuMode>("classic");
  const [state, setState] = useState<SudokuGameState>(() => makePuzzle(6, "medium", "classic", "initial"));
  const [stats, setStats] = useState<SudokuStats>(() => emptySudokuStats());
  const recordedWinRef = useRef<string | null>(null);

  useEffect(() => {
    const saved = readSudokuSave();
    const savedStats = readSudokuStats();
    setStats(savedStats);
    if (saved && saved.phase !== "won" && saved.phase !== "lost") {
      setState(saved);
      setSize(saved.puzzle.size);
      setDifficulty(saved.puzzle.difficulty);
      setMode(saved.mode);
    }
  }, []);

  useEffect(() => {
    if (state.phase !== "playing") return;
    const id = window.setInterval(() => {
      setState((current) => current.phase === "playing" ? { ...current, elapsedSeconds: current.elapsedSeconds + 1 } : current);
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === "playing" || state.phase === "paused") writeSudokuSave(state);
    if (state.phase === "won" && recordedWinRef.current !== state.puzzle.id) {
      recordedWinRef.current = state.puzzle.id;
      clearSudokuSave();
      setStats((current) => {
        const next = recordSudokuCompletion(current, state);
        writeSudokuStats(next);
        return next;
      });
    }
  }, [state]);

  const selectedValue = state.values[state.selected];
  const peerCells = useMemo(() => getPeerCells(state.selected, state.puzzle), [state.selected, state.puzzle]);
  const conflictCells = useMemo(() => getConflictCells(state), [state]);
  const completedNumbers = useMemo(() => getCompletedNumbers(state), [state]);
  const bestTime = getBestTime(stats, state);

  const startNew = useCallback((nextSize = size, nextDifficulty = difficulty, nextMode = mode) => {
    const next = makePuzzle(nextSize, nextDifficulty, nextMode);
    recordedWinRef.current = null;
    setState(next);
    setSize(nextSize);
    setDifficulty(nextDifficulty);
    setMode(nextMode);
    setStats((current) => {
      const updated = recordSudokuStart(current);
      writeSudokuStats(updated);
      return updated;
    });
  }, [difficulty, mode, size]);

  const selectCell = useCallback((cell: number) => {
    setState((current) => ({ ...current, selected: cell }));
  }, []);

  const handleValue = useCallback((value: number) => {
    setState((current) => enterValue(current, current.selected, value));
  }, []);

  const handleErase = useCallback(() => {
    setState((current) => eraseCell(current, current.selected));
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "backspace", "delete", "n", "h", "p", "z", "y"].includes(key) || /^[1-9]$/.test(key)) event.preventDefault();
    setState((current) => {
      const row = Math.floor(current.selected / current.puzzle.size);
      const col = current.selected % current.puzzle.size;
      if (key === "arrowup") return { ...current, selected: Math.max(0, row - 1) * current.puzzle.size + col };
      if (key === "arrowdown") return { ...current, selected: Math.min(current.puzzle.size - 1, row + 1) * current.puzzle.size + col };
      if (key === "arrowleft") return { ...current, selected: row * current.puzzle.size + Math.max(0, col - 1) };
      if (key === "arrowright") return { ...current, selected: row * current.puzzle.size + Math.min(current.puzzle.size - 1, col + 1) };
      if (key === "backspace" || key === "delete") return eraseCell(current, current.selected);
      if (key === "n") return { ...current, noteMode: !current.noteMode };
      if (key === "h") return applyHint(current);
      if (key === "p") return { ...current, phase: current.phase === "paused" ? "playing" : current.phase === "playing" ? "paused" : current.phase };
      if ((event.metaKey || event.ctrlKey) && key === "z" && event.shiftKey) return redoSudokuMove(current);
      if ((event.metaKey || event.ctrlKey) && key === "z") return undoSudokuMove(current);
      if ((event.metaKey || event.ctrlKey) && key === "y") return redoSudokuMove(current);
      const value = Number.parseInt(key, 10);
      if (value >= 1 && value <= current.puzzle.size) return enterValue(current, current.selected, value);
      return current;
    });
  }, []);

  const boardStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${state.puzzle.size}, minmax(0, 1fr))`,
  };

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3 sm:px-5">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Playable logic game</p>
          <h2 className="text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{game.title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft">{state.puzzle.size}×{state.puzzle.size}</Badge>
          <Badge variant="outline">{state.puzzle.difficulty}</Badge>
          <Badge variant={state.noteMode ? "accent" : "outline"}>{state.noteMode ? "Notes on" : "Normal"}</Badge>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_310px] lg:p-5">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatPill label="Time" value={formatSudokuTime(state.elapsedSeconds)} />
            <StatPill label="Mistakes" value={state.mode === "mistake-limit" ? `${state.mistakes}/3` : `${state.mistakes}`} />
            <StatPill label="Hints" value={`${state.hintsUsed}`} />
            <StatPill label="Best" value={bestTime ? formatSudokuTime(bestTime) : "—"} />
          </div>

          <div className="mx-auto w-full max-w-[560px] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-2 shadow-[inset_0_1px_0_var(--color-border-subtle)]">
            <div className="grid overflow-hidden rounded-[var(--radius-md)] border-2 border-[var(--color-text-primary)]" style={boardStyle}>
              {state.values.map((value, cell) => {
                const row = Math.floor(cell / state.puzzle.size);
                const col = cell % state.puzzle.size;
                const selected = cell === state.selected;
                const peer = peerCells.has(cell);
                const same = selectedValue > 0 && value === selectedValue;
                const given = isGiven(state.puzzle, cell);
                const conflict = conflictCells.has(cell);
                const borderStyle: CSSProperties = {
                  borderRightWidth: (col + 1) % state.puzzle.boxCols === 0 && col < state.puzzle.size - 1 ? 2 : 1,
                  borderBottomWidth: (row + 1) % state.puzzle.boxRows === 0 && row < state.puzzle.size - 1 ? 2 : 1,
                };
                return (
                  <button
                    key={cell}
                    type="button"
                    onClick={() => selectCell(cell)}
                    aria-label={`Row ${row + 1}, column ${col + 1}, ${value ? `value ${value}` : "empty"}${given ? ", given" : ", editable"}`}
                    aria-pressed={selected}
                    className={cn(
                      "aspect-square border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] text-xl font-black text-[var(--color-text-primary)] outline-none transition focus-visible:shadow-[var(--focus-ring)] sm:text-2xl",
                      given && "bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)]",
                      peer && !selected && "bg-[var(--color-primary-soft)]/45",
                      same && !selected && "bg-[var(--color-accent-soft)]",
                      selected && "bg-[var(--color-primary)] text-[var(--color-primary-text)]",
                      conflict && "bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
                    )}
                    style={borderStyle}
                  >
                    {value ? value : (
                      <span className="grid h-full grid-cols-3 content-center gap-0.5 p-1 text-[9px] font-bold leading-none text-[var(--color-text-tertiary)] sm:text-[10px]">
                        {Array.from({ length: state.puzzle.size }, (_, index) => index + 1).map((note) => <span key={note}>{state.notes[cell].includes(note) ? note : ""}</span>)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mx-auto grid max-w-[560px] grid-cols-6 gap-2">
            {Array.from({ length: state.puzzle.size }, (_, index) => index + 1).map((value) => (
              <Button key={value} variant={completedNumbers.has(value) ? "ghost" : "secondary"} disabled={completedNumbers.has(value) || state.phase !== "playing"} onClick={() => handleValue(value)} className="min-h-12 text-lg font-black">
                {value}
              </Button>
            ))}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <h3 className="text-sm font-black text-[var(--color-text-primary)]">Game controls</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant={state.noteMode ? "soft" : "secondary"} onClick={() => setState((current) => ({ ...current, noteMode: !current.noteMode }))}>Notes</Button>
              <Button variant="secondary" onClick={handleErase}>Erase</Button>
              <Button variant="secondary" onClick={() => setState((current) => applyHint(current))}>Hint</Button>
              <Button variant="secondary" onClick={() => setState((current) => undoSudokuMove(current))} disabled={state.undoStack.length === 0}>Undo</Button>
              <Button variant="secondary" onClick={() => setState((current) => redoSudokuMove(current))} disabled={state.redoStack.length === 0}>Redo</Button>
              <Button variant="secondary" onClick={() => setState((current) => ({ ...current, phase: current.phase === "paused" ? "playing" : current.phase === "playing" ? "paused" : current.phase }))}>{state.phase === "paused" ? "Resume" : "Pause"}</Button>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <h3 className="text-sm font-black text-[var(--color-text-primary)]">New puzzle</h3>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[4, 6].map((value) => <Button key={value} variant={size === value ? "soft" : "secondary"} onClick={() => startNew(value as SudokuSize, difficulty, mode)}>{value}×{value}</Button>)}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DIFFICULTIES.map((item) => <Button key={item} variant={difficulty === item ? "soft" : "secondary"} onClick={() => startNew(size, item, mode)} className="capitalize">{item}</Button>)}
              </div>
              <div className="space-y-2">
                {MODES.map((item) => (
                  <button key={item.id} type="button" onClick={() => startNew(size, difficulty, item.id)} className={cn("w-full rounded-[var(--radius-md)] border px-3 py-2 text-left text-xs transition", mode === item.id ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : "border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)]") }>
                    <strong className="block text-sm">{item.label}</strong>
                    {item.description}
                  </button>
                ))}
              </div>
              <Button fullWidth onClick={() => startNew()}>New game</Button>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4 text-xs leading-5 text-[var(--color-text-secondary)]">
            <h3 className="text-sm font-black text-[var(--color-text-primary)]">Progress</h3>
            <p className="mt-2">Started: {stats.gamesStarted} · Completed: {stats.gamesCompleted}</p>
            <p>Keyboard: arrows move, numbers fill, N notes, H hint, P pause.</p>
          </div>
        </aside>
      </div>

      {(state.phase === "paused" || state.phase === "won" || state.phase === "lost") ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 text-center shadow-2xl">
            <div className="text-4xl">{state.phase === "won" ? "🎉" : state.phase === "lost" ? "😵" : "⏸️"}</div>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
              {state.phase === "won" ? "Puzzle complete!" : state.phase === "lost" ? "Game over" : "Paused"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              {state.phase === "won" ? `Solved in ${formatSudokuTime(state.elapsedSeconds)} with ${state.mistakes} mistake${state.mistakes === 1 ? "" : "s"}.` : state.phase === "lost" ? "The mistake limit mode ended after three wrong entries." : "Take a break. Your current puzzle is saved locally."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {state.phase === "paused" ? <Button onClick={() => setState((current) => ({ ...current, phase: "playing" }))}>Resume</Button> : null}
              <Button variant="secondary" onClick={() => startNew()}>New puzzle</Button>
              {state.phase !== "paused" ? <Button variant="outline" onClick={() => setState(createInitialSudokuState(state.puzzle, state.mode))}>Retry</Button> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
