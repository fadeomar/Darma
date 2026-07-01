"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bot, Brain, Copy, RotateCcw, Sparkles, Trophy, Users } from "lucide-react";
import { Badge, Button, Select } from "@/components/ui";
import type { GameDefinition } from "../../domain/game";
import { applyMove, boardToText, createInitialTicState, getAiMove, getWinningLines } from "./ticTacToeEngine";
import { DEFAULT_TIC_STATS, loadTicStats, recordTicGame, saveTicStats } from "./ticTacToeStorage";
import type { TicDifficulty, TicMode, TicSettings, TicState, TicStats } from "./ticTacToeTypes";

const DIFFICULTY_LABEL: Record<TicDifficulty, string> = {
  casual: "Casual",
  smart: "Smart",
  unbeatable: "Unbeatable 3×3",
};

const MODE_LABEL: Record<TicMode, string> = {
  ai: "Vs computer",
  local: "Local 2-player",
};

export function TicTacToeGame({ game }: { game: GameDefinition }) {
  const [mode, setMode] = useState<TicMode>("ai");
  const [difficulty, setDifficulty] = useState<TicDifficulty>("smart");
  const [size, setSize] = useState<3 | 4>(3);
  const [state, setState] = useState<TicState>(() => createInitialTicState({ mode, difficulty, size }));
  const [stats, setStats] = useState<TicStats>(DEFAULT_TIC_STATS);
  const [message, setMessage] = useState("You are X. Build a fork or block the threat.");
  const recordedRef = useRef(false);

  useEffect(() => {
    setStats(loadTicStats());
  }, []);

  function reset(next: Partial<TicSettings> = {}) {
    const nextSettings = { mode, difficulty, size, ...next };
    recordedRef.current = false;
    setState(createInitialTicState(nextSettings));
    setMessage(nextSettings.mode === "ai" ? "You are X. The computer plays O." : "Local match. X starts first.");
  }

  useEffect(() => {
    reset({ mode, difficulty, size });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, difficulty, size]);

  useEffect(() => {
    if (state.status !== "playing" || state.settings.mode !== "ai" || state.current !== "O") return;
    const timeout = window.setTimeout(() => {
      setState((current) => {
        if (current.status !== "playing" || current.current !== "O") return current;
        const move = getAiMove(current.board, current.settings, "O", current.settings.difficulty);
        return move === null ? current : applyMove(current, move);
      });
    }, 340);
    return () => window.clearTimeout(timeout);
  }, [state.board, state.current, state.settings.difficulty, state.settings.mode, state.status]);

  useEffect(() => {
    if (state.status === "playing" || recordedRef.current) return;
    recordedRef.current = true;
    const winner = state.status === "draw" ? "draw" : state.winner?.mark ?? "draw";
    const nextStats = recordTicGame(stats, winner);
    setStats(nextStats);
    saveTicStats(nextStats);
    if (state.status === "draw") setMessage("Draw. Solid defense from both sides.");
    else setMessage(`${state.winner?.mark} wins with a clean line.`);
  }, [state.status, state.winner?.mark, stats]);

  function chooseCell(index: number) {
    if (state.settings.mode === "ai" && state.current === "O") return;
    setState((current) => applyMove(current, index));
  }

  const winningThreats = useMemo(() => {
    if (state.status !== "playing") return [];
    return getWinningLines(state.settings.size, state.settings.winLength)
      .map((line) => ({ line, xCount: line.filter((index) => state.board[index] === "X").length, oCount: line.filter((index) => state.board[index] === "O").length, blanks: line.filter((index) => !state.board[index]) }))
      .filter((line) => line.blanks.length === 1 && (line.xCount === state.settings.winLength - 1 || line.oCount === state.settings.winLength - 1));
  }, [state.board, state.settings.size, state.settings.winLength, state.status]);

  const shareText = `Tic Tac Toe Pro on Darma\n${state.status === "draw" ? "Draw" : state.winner ? `${state.winner.mark} won` : "In progress"}\n${boardToText(state.board, state.settings.size)}`;

  async function copyBoard() {
    try {
      await navigator.clipboard.writeText(shareText);
      setMessage("Board copied. Share the result or save the position.");
    } catch {
      setMessage("Copy was blocked by the browser, but the board is still playable.");
    }
  }

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]" aria-label={`${game.title} playable area`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3 sm:px-5">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-primary)]">Strategy board pro</p>
          <h2 className="text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Tic Tac Toe Pro</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">AI, 4×4 mode, tactical hints, local scoreboard, and shareable board state.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft">Turn {state.current}</Badge>
          <Badge variant="outline">Moves {state.moves}</Badge>
          <Badge variant="outline">Threats {winningThreats.length}</Badge>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_330px] lg:p-5">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[radial-gradient(circle_at_top,var(--color-primary-soft),transparent_45%),var(--color-surface-base)] p-4">
          <div className="mx-auto max-w-[560px]">
            <div className="mb-4 grid grid-cols-3 gap-2">
              <Stat label="X wins" value={String(stats.xWins)} />
              <Stat label="O wins" value={String(stats.oWins)} />
              <Stat label="Draws" value={String(stats.draws)} />
            </div>

            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${state.settings.size}, minmax(0, 1fr))` }}>
              {state.board.map((cell, index) => {
                const isWinning = state.winner?.line.includes(index) ?? false;
                const isThreat = winningThreats.some((threat) => threat.blanks.includes(index));
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => chooseCell(index)}
                    disabled={Boolean(cell) || state.status !== "playing" || (state.settings.mode === "ai" && state.current === "O")}
                    className={`aspect-square rounded-[var(--radius-md)] border text-5xl font-black shadow-[var(--shadow-xs)] outline-none transition focus-visible:shadow-[var(--focus-ring)] disabled:cursor-not-allowed sm:text-6xl ${
                      isWinning
                        ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
                        : isThreat
                          ? "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"
                          : "border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-soft)]"
                    }`}
                    aria-label={`Row ${Math.floor(index / state.settings.size) + 1}, column ${(index % state.settings.size) + 1}${cell ? `, ${cell}` : ", empty"}`}
                  >
                    {cell}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-4 text-center">
              <h3 className="text-xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
                {state.status === "won" ? `${state.winner?.mark} wins` : state.status === "draw" ? "Draw" : state.settings.mode === "ai" && state.current === "O" ? "Computer thinking" : `${state.current} to move`}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{message}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Button onClick={() => reset()} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>New game</Button>
                <Button variant="secondary" onClick={copyBoard} leftIcon={<Copy className="h-4 w-4" aria-hidden />}>Copy board</Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <h3 className="text-sm font-black text-[var(--color-text-primary)]">Match setup</h3>
            <div className="mt-3 space-y-3">
              <label className="block text-xs font-bold text-[var(--color-text-muted)]">
                Mode
                <Select className="mt-1" value={mode} onChange={(event) => setMode(event.target.value as TicMode)}>
                  {Object.entries(MODE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </label>
              <label className="block text-xs font-bold text-[var(--color-text-muted)]">
                AI difficulty
                <Select className="mt-1" value={difficulty} onChange={(event) => setDifficulty(event.target.value as TicDifficulty)} disabled={mode !== "ai"}>
                  {Object.entries(DIFFICULTY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </label>
              <label className="block text-xs font-bold text-[var(--color-text-muted)]">
                Board
                <Select className="mt-1" value={String(size)} onChange={(event) => setSize(Number(event.target.value) as 3 | 4)}>
                  <option value="3">3×3 classic</option>
                  <option value="4">4×4 pro line</option>
                </Select>
              </label>
            </div>
          </div>

          <Feature icon={<Bot className="h-4 w-4" aria-hidden />} title="AI opponent" text="Smart AI blocks immediate wins; unbeatable mode uses minimax on 3×3." />
          <Feature icon={<Brain className="h-4 w-4" aria-hidden />} title="Tactical pressure" text="Cells that can complete a line are highlighted so the game teaches better defense." />
          <Feature icon={<Users className="h-4 w-4" aria-hidden />} title="Local 2-player" text="Switch to same-device mode for fast matches with a friend." />
          <Feature icon={<Trophy className="h-4 w-4" aria-hidden />} title="Local stats" text={`Games ${stats.gamesPlayed}. X streak ${stats.currentStreak}. Best ${stats.bestStreak}.`} />
          <Feature icon={<Sparkles className="h-4 w-4" aria-hidden />} title="Pro board" text="4×4 mode changes the rhythm and avoids the usual solved feel of basic Tic Tac Toe." />
        </aside>
      </div>
    </section>
  );
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
