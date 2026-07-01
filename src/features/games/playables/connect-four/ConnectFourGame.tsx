"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  Bot,
  Brain,
  Lightbulb,
  RotateCcw,
  Shield,
  Sparkles,
  Trophy,
  Undo2,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge, Button, Select } from "@/components/ui";
import type { GameDefinition } from "../../domain/game";
import {
  chooseConnectFourAiMove,
  createInitialConnectFourState,
  getConnectFourThreatColumns,
  otherPlayer,
  playConnectFourMove,
  undoConnectFourMove,
} from "./connectFourEngine";
import {
  DEFAULT_CONNECT_FOUR_STATS,
  clearConnectFourStats,
  loadConnectFourStats,
  saveConnectFourStats,
} from "./connectFourStorage";
import type {
  ConnectFourDifficulty,
  ConnectFourMode,
  ConnectFourStats,
  ConnectFourState,
} from "./connectFourTypes";
import {
  createSimpleGameAudio,
  type SimpleGameSound,
} from "../shared/simpleGameAudio";

const MODE_LABELS: Record<ConnectFourMode, string> = {
  local: "Local 2-player",
  computer: "Vs computer",
};

const DIFFICULTY_LABELS: Record<ConnectFourDifficulty, string> = {
  casual: "Casual",
  smart: "Smart",
  pro: "Pro AI",
};

function playerLabel(player: "red" | "yellow") {
  return player === "red" ? "Red" : "Yellow";
}

function formatWinRate(stats: ConnectFourStats) {
  if (stats.gamesCompleted === 0) return "0%";
  return `${Math.round(((stats.redWins + stats.yellowWins) / stats.gamesCompleted) * 100)}%`;
}

export function ConnectFourGame({ game }: { game: GameDefinition }) {
  const [mode, setMode] = useState<ConnectFourMode>("computer");
  const [difficulty, setDifficulty] = useState<ConnectFourDifficulty>("smart");
  const [state, setState] = useState<ConnectFourState>(() =>
    createInitialConnectFourState({ mode, difficulty }),
  );
  const [stats, setStats] = useState<ConnectFourStats>(
    DEFAULT_CONNECT_FOUR_STATS,
  );
  const [hintColumn, setHintColumn] = useState<number | null>(null);
  const [hoverColumn, setHoverColumn] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const recordedRef = useRef(false);
  const audioRef = useRef<ReturnType<typeof createSimpleGameAudio> | null>(
    null,
  );

  useEffect(() => {
    setStats(loadConnectFourStats());
    audioRef.current = createSimpleGameAudio();
  }, []);

  function playSound(sound: SimpleGameSound) {
    if (!soundEnabled) return;
    audioRef.current?.unlock();
    audioRef.current?.play(sound);
  }

  const reset = useCallback(
    (nextMode = mode, nextDifficulty = difficulty) => {
      recordedRef.current = false;
      setHintColumn(null);
      setHoverColumn(null);
      setState(
        createInitialConnectFourState({
          mode: nextMode,
          difficulty: nextDifficulty,
        }),
      );
    },
    [difficulty, mode],
  );

  useEffect(() => {
    reset(mode, difficulty);
  }, [difficulty, mode, reset]);

  useEffect(() => {
    if (state.status !== "won" && state.status !== "draw") return;
    if (recordedRef.current) return;
    recordedRef.current = true;

    const nextStats: ConnectFourStats = {
      ...stats,
      gamesCompleted: stats.gamesCompleted + 1,
      redWins: stats.redWins + (state.winner === "red" ? 1 : 0),
      yellowWins: stats.yellowWins + (state.winner === "yellow" ? 1 : 0),
      computerWins:
        stats.computerWins +
        (state.settings.mode === "computer" && state.winner === "yellow"
          ? 1
          : 0),
      draws: stats.draws + (state.status === "draw" ? 1 : 0),
      bestWinMoves: state.winner
        ? Math.min(stats.bestWinMoves ?? state.moves.length, state.moves.length)
        : stats.bestWinMoves,
    };
    setStats(nextStats);
    saveConnectFourStats(nextStats);
  }, [
    state.moves.length,
    state.settings.mode,
    state.status,
    state.winner,
    stats,
  ]);

  useEffect(() => {
    if (state.status === "won")
      playSound(state.winner === "red" ? "win" : "lose");
    if (state.status === "draw") playSound("miss");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.winner]);

  useEffect(() => {
    if (
      state.settings.mode !== "computer" ||
      state.currentPlayer !== "yellow" ||
      state.status === "won" ||
      state.status === "draw"
    )
      return;
    const timeout = window.setTimeout(() => {
      const column = chooseConnectFourAiMove(
        state.board,
        "yellow",
        state.settings.difficulty,
      );
      if (column !== null) {
        playSound("ai");
        setState((current) => playConnectFourMove(current, column));
      }
    }, 420);
    return () => window.clearTimeout(timeout);
  }, [
    state.board,
    state.currentPlayer,
    state.settings.difficulty,
    state.settings.mode,
    state.status,
  ]);

  function startIfNeeded() {
    if (state.moves.length === 0 && state.status === "ready") {
      const nextStats = { ...stats, gamesStarted: stats.gamesStarted + 1 };
      setStats(nextStats);
      saveConnectFourStats(nextStats);
    }
  }

  function drop(column: number) {
    if (state.settings.mode === "computer" && state.currentPlayer === "yellow")
      return;
    if (state.status === "won" || state.status === "draw") return;
    startIfNeeded();
    setHintColumn(null);
    playSound("drop");
    setState((current) => playConnectFourMove(current, column));
  }

  function undo() {
    recordedRef.current = false;
    setHintColumn(null);
    setState((current) => undoConnectFourMove(current));
  }

  function showHint() {
    playSound("hint");
    const player = state.currentPlayer;
    const column = chooseConnectFourAiMove(state.board, player, "pro");
    setHintColumn(column);
    const nextStats = { ...stats, hintsUsed: stats.hintsUsed + 1 };
    setStats(nextStats);
    saveConnectFourStats(nextStats);
  }

  function clearStats() {
    clearConnectFourStats();
    setStats(DEFAULT_CONNECT_FOUR_STATS);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key >= "1" && event.key <= "7") {
      event.preventDefault();
      drop(Number(event.key) - 1);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setHoverColumn((current) => Math.max(0, (current ?? 3) - 1));
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setHoverColumn((current) => Math.min(6, (current ?? 3) + 1));
      return;
    }
    if (event.key === "Enter" && hoverColumn !== null) {
      event.preventDefault();
      drop(hoverColumn);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undo();
    }
  }

  const opponentThreats = useMemo(
    () =>
      getConnectFourThreatColumns(
        state.board,
        otherPlayer(state.currentPlayer),
      ),
    [state.board, state.currentPlayer],
  );
  const playerThreats = useMemo(
    () => getConnectFourThreatColumns(state.board, state.currentPlayer),
    [state.board, state.currentPlayer],
  );
  const winningSet = useMemo(
    () =>
      new Set(state.winningLine.map((point) => `${point.row}:${point.col}`)),
    [state.winningLine],
  );
  const isComputerThinking =
    state.settings.mode === "computer" &&
    state.currentPlayer === "yellow" &&
    state.status !== "won" &&
    state.status !== "draw";
  const boardShellStyle = {
    maxWidth: "min(100%, calc((100dvh - 340px) * 1.16), 700px)",
  } as CSSProperties;

  return (
    <section
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${game.title} playable area`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3 sm:px-5">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-primary)]">
            Strategy pro build
          </p>
          <h2 className="text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
            Connect Four Pro
          </h2>
          <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
            Drop discs, build traps, block threats, and play local or against a
            stronger AI.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft">Turn {playerLabel(state.currentPlayer)}</Badge>
          <Badge variant="outline">Moves {state.moves.length}</Badge>
          <Badge variant="outline">{MODE_LABELS[state.settings.mode]}</Badge>
          {isComputerThinking ? (
            <Badge variant="warning">Computer thinking…</Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-5">
        <div className="relative rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-xs)] sm:p-4">
          <div
            className="mx-auto mb-2 grid grid-cols-7 gap-1.5"
            style={boardShellStyle}
            aria-label="Column controls"
          >
            {Array.from({ length: state.settings.cols }, (_, column) => {
              const isHint = hintColumn === column;
              const isThreat = opponentThreats.includes(column);
              const isWin = playerThreats.includes(column);
              return (
                <button
                  key={column}
                  type="button"
                  onClick={() => drop(column)}
                  onMouseEnter={() => setHoverColumn(column)}
                  disabled={
                    state.status === "won" ||
                    state.status === "draw" ||
                    (state.settings.mode === "computer" &&
                      state.currentPlayer === "yellow")
                  }
                  className={`min-h-10 rounded-[var(--radius-sm)] border text-xs font-black transition focus-visible:shadow-[var(--focus-ring)] disabled:opacity-45 ${
                    isHint
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : isWin
                        ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
                        : isThreat
                          ? "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"
                          : hoverColumn === column
                            ? "border-[var(--color-border-strong)] bg-[var(--color-control-hover)] text-[var(--color-text-primary)]"
                            : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]"
                  }`}
                  aria-label={`Drop in column ${column + 1}`}
                >
                  {column + 1}
                </button>
              );
            })}
          </div>

          <div
            className="mx-auto rounded-[1.25rem] border border-[var(--color-border-default)] bg-[linear-gradient(135deg,var(--color-primary-soft),var(--color-surface-subtle))] p-2 shadow-inner"
            style={boardShellStyle}
          >
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${state.settings.cols}, minmax(0, 1fr))`,
              }}
            >
              {state.board.flatMap((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isWinningCell = winningSet.has(
                    `${rowIndex}:${colIndex}`,
                  );
                  const isColumnFocus =
                    hoverColumn === colIndex || hintColumn === colIndex;
                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      type="button"
                      onClick={() => drop(colIndex)}
                      disabled={
                        state.status === "won" ||
                        state.status === "draw" ||
                        (state.settings.mode === "computer" &&
                          state.currentPlayer === "yellow")
                      }
                      className={`aspect-square rounded-[var(--radius-full)] border transition focus-visible:shadow-[var(--focus-ring)] ${
                        isWinningCell
                          ? "scale-105 border-white shadow-[0_0_0_3px_var(--color-success-bg)]"
                          : "border-white/40"
                      } ${isColumnFocus ? "ring-2 ring-[var(--color-primary)]" : ""} ${
                        cell === "red"
                          ? "bg-[radial-gradient(circle_at_35%_30%,#fecaca,#ef4444_55%,#991b1b)]"
                          : cell === "yellow"
                            ? "bg-[radial-gradient(circle_at_35%_30%,#fef3c7,#f59e0b_55%,#92400e)]"
                            : "bg-[var(--color-surface-overlay)] shadow-inner"
                      }`}
                      aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}${cell ? `, ${cell} disc` : ", empty"}`}
                      style={
                        cell
                          ? { animation: "connectFourPop 180ms ease-out" }
                          : undefined
                      }
                    />
                  );
                }),
              )}
            </div>
          </div>

          <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3">
            <p className="text-sm font-black text-[var(--color-text-primary)]">
              {state.status === "won"
                ? "Game complete"
                : state.status === "draw"
                  ? "Draw"
                  : "Live coach"}
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
              {isComputerThinking
                ? "Computer is choosing a column…"
                : state.message}
            </p>
            {(opponentThreats.length > 0 ||
              playerThreats.length > 0 ||
              hintColumn !== null) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {playerThreats.length > 0 && (
                  <Badge variant="success">
                    Winning column:{" "}
                    {playerThreats.map((col) => col + 1).join(", ")}
                  </Badge>
                )}
                {opponentThreats.length > 0 && (
                  <Badge variant="warning">
                    Block: {opponentThreats.map((col) => col + 1).join(", ")}
                  </Badge>
                )}
                {hintColumn !== null && (
                  <Badge variant="info">Hint: column {hintColumn + 1}</Badge>
                )}
              </div>
            )}
          </div>

          {state.status === "won" || state.status === "draw" ? (
            <div className="absolute inset-3 flex items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface-overlay)]/88 p-4 text-center backdrop-blur-md">
              <div className="max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-5 shadow-[var(--shadow-card)]">
                <div className="text-4xl">
                  {state.status === "draw"
                    ? "🤝"
                    : state.winner === "red"
                      ? "🏆"
                      : "🤖"}
                </div>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">
                  {state.status === "draw"
                    ? "Draw game"
                    : state.winner === "red"
                      ? "Red wins"
                      : state.settings.mode === "computer"
                        ? "Computer wins"
                        : "Yellow wins"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {state.message}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => reset()}
                  leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
                >
                  Play again
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-3">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
            <h3 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]">
              <Sparkles
                className="h-4 w-4 text-[var(--color-primary)]"
                aria-hidden
              />{" "}
              Game setup
            </h3>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
                Mode
                <Select
                  value={mode}
                  onChange={(event) =>
                    setMode(event.target.value as ConnectFourMode)
                  }
                >
                  {Object.entries(MODE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
                AI difficulty
                <Select
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value as ConnectFourDifficulty)
                  }
                  disabled={mode === "local"}
                >
                  {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                onClick={() => reset()}
                leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
              >
                New
              </Button>
              <Button
                variant="outline"
                onClick={undo}
                disabled={state.moves.length === 0}
                leftIcon={<Undo2 className="h-4 w-4" aria-hidden />}
              >
                Undo
              </Button>
              <Button
                variant="soft"
                onClick={showHint}
                disabled={state.status === "won" || state.status === "draw"}
                leftIcon={<Lightbulb className="h-4 w-4" aria-hidden />}
              >
                Hint
              </Button>
              <Button variant="secondary" onClick={clearStats}>
                Clear stats
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

          <div className="grid grid-cols-2 gap-2">
            <StatCard
              icon={<Users className="h-4 w-4" aria-hidden />}
              label="Started"
              value={stats.gamesStarted}
            />
            <StatCard
              icon={<Trophy className="h-4 w-4" aria-hidden />}
              label="Completed"
              value={stats.gamesCompleted}
            />
            <StatCard
              icon={<Brain className="h-4 w-4" aria-hidden />}
              label="Win rate"
              value={formatWinRate(stats)}
            />
            <StatCard
              icon={<Bot className="h-4 w-4" aria-hidden />}
              label="AI wins"
              value={stats.computerWins}
            />
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 text-sm leading-6 text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)]">
            <h3 className="flex items-center gap-2 font-black text-[var(--color-text-primary)]">
              <Shield
                className="h-4 w-4 text-[var(--color-primary)]"
                aria-hidden
              />{" "}
              Pro rules
            </h3>
            <p className="mt-2">
              Numbers 1–7 drop discs by keyboard. Green columns can win now;
              amber columns warn about opponent threats. Pro AI searches deeper
              and blocks traps.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-xs)]">
      <div className="flex items-center gap-2 text-[var(--color-primary)]">
        {icon}
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          {label}
        </span>
      </div>
      <p className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  );
}
