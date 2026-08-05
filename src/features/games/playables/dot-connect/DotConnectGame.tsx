"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  Bot,
  Check,
  CircleOff,
  Gamepad2,
  MousePointer2,
  Redo2,
  RotateCcw,
  Sparkles,
  Trophy,
  Undo2,
  Users,
} from "lucide-react";

import { Badge, Button, Select } from "@/components/ui";

import type { GameDefinition } from "../../domain/game";
import {
  useGameExperience,
  useGameExperienceControls,
} from "../../engine/GameExperienceProvider";
import {
  advanceDotPath,
  chooseDotConnectAiPath,
  createDotBoard,
  isValidDotPath,
  recolorDotPath,
} from "./dotConnectEngine";
import type {
  DotBoard,
  DotColor,
  DotConnectDifficulty,
  DotConnectMode,
  DotConnectPhase,
  DotConnectPlayer,
  DotConnectScores,
  DotCoordinate,
} from "./dotConnectTypes";

const TARGET_OPTIONS = [30, 50, 100] as const;
const DIFFICULTY_OPTIONS: Record<
  DotConnectDifficulty,
  {
    label: string;
    nodeBudget: number;
    startBudget: number;
    maxPathLength: number;
  }
> = {
  relaxed: {
    label: "Relaxed",
    nodeBudget: 300,
    startBudget: 4,
    maxPathLength: 6,
  },
  balanced: {
    label: "Balanced",
    nodeBudget: 900,
    startBudget: 8,
    maxPathLength: 12,
  },
  sharp: {
    label: "Sharp",
    nodeBudget: 2400,
    startBudget: 12,
    maxPathLength: 20,
  },
};
type TargetScore = (typeof TARGET_OPTIONS)[number];

const DOT_META: Record<
  DotColor,
  { label: string; symbol: string; hex: string }
> = {
  coral: { label: "Coral circle", symbol: "●", hex: "#ef5a5a" },
  blue: { label: "Blue diamond", symbol: "◆", hex: "#3b82f6" },
  gold: { label: "Gold square", symbol: "■", hex: "#d79a12" },
  mint: { label: "Mint triangle", symbol: "▲", hex: "#16a085" },
};

function playerLabel(mode: DotConnectMode, player: DotConnectPlayer) {
  if (player === "one") return "Player 1";
  return mode === "computer" ? "Computer" : "Player 2";
}

function otherPlayer(player: DotConnectPlayer): DotConnectPlayer {
  return player === "one" ? "two" : "one";
}

function coordinateKey({ row, column }: DotCoordinate) {
  return `${row}:${column}`;
}

function scoreSummary(scores: DotConnectScores, target: TargetScore) {
  return `${scores.one} to ${scores.two}. First to ${target}.`;
}

export function DotConnectGame({ game }: { game: GameDefinition }) {
  const [mode, setMode] = useState<DotConnectMode>("computer");
  const [target, setTarget] = useState<TargetScore>(100);
  const [difficulty, setDifficulty] =
    useState<DotConnectDifficulty>("balanced");
  const [board, setBoard] = useState<DotBoard>(() => createDotBoard());
  const [scores, setScores] = useState<DotConnectScores>({ one: 0, two: 0 });
  const [turn, setTurn] = useState<DotConnectPlayer>("one");
  const [phase, setPhase] = useState<DotConnectPhase>("idle");
  const [path, setPath] = useState<DotCoordinate[]>([]);
  const [message, setMessage] = useState(
    "Player 1 starts. Connect two or more matching dots.",
  );
  const [paused, setPaused] = useState(false);

  const {
    session: sharedSession,
    startSession,
    completeSession,
    abandonSession,
    announce,
  } = useGameExperience();

  const boardElementRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef(board);
  const scoresRef = useRef(scores);
  const pathRef = useRef(path);
  const modeRef = useRef(mode);
  const targetRef = useRef(target);
  const difficultyRef = useRef(difficulty);
  const turnRef = useRef(turn);
  const phaseRef = useRef(phase);
  const sessionRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const pointerActiveRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const pointerOriginRef = useRef({ x: 0, y: 0 });
  const pausedRef = useRef(false);
  const sharedSessionStatusRef = useRef(sharedSession.status);
  const resolvePathRef = useRef<
    (candidate: DotCoordinate[], scoringPlayer: DotConnectPlayer) => void
  >(() => {});

  const replaceBoard = useCallback((next: DotBoard) => {
    boardRef.current = next;
    setBoard(next);
  }, []);

  const replaceScores = useCallback((next: DotConnectScores) => {
    scoresRef.current = next;
    setScores(next);
  }, []);

  const replacePath = useCallback((next: DotCoordinate[]) => {
    pathRef.current = next;
    setPath(next);
  }, []);

  const replaceTurn = useCallback((next: DotConnectPlayer) => {
    turnRef.current = next;
    setTurn(next);
  }, []);

  const replacePhase = useCallback((next: DotConnectPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearPendingWork = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    pointerActiveRef.current = false;
  }, []);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const session = sessionRef.current;
    const timer = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((entry) => entry !== timer);
      if (session !== sessionRef.current) return;
      callback();
    }, delay);
    timersRef.current.push(timer);
  }, []);

  useEffect(() => clearPendingWork, [clearPendingWork]);

  useEffect(() => {
    sharedSessionStatusRef.current = sharedSession.status;
  }, [sharedSession.status]);

  const resetGame = useCallback(
    (
      nextMode: DotConnectMode = modeRef.current,
      nextTarget: TargetScore = targetRef.current,
      nextDifficulty: DotConnectDifficulty = difficultyRef.current,
    ) => {
      sessionRef.current += 1;
      clearPendingWork();
      if (sharedSessionStatusRef.current !== "idle") abandonSession();
      modeRef.current = nextMode;
      targetRef.current = nextTarget;
      difficultyRef.current = nextDifficulty;
      setMode(nextMode);
      setTarget(nextTarget);
      setDifficulty(nextDifficulty);
      replaceBoard(createDotBoard());
      replaceScores({ one: 0, two: 0 });
      const startingPlayer: DotConnectPlayer =
        nextMode === "local" && Math.random() < 0.5 ? "two" : "one";
      replaceTurn(startingPlayer);
      replacePath([]);
      replacePhase("idle");
      pausedRef.current = false;
      setPaused(false);
      setMessage(
        nextMode === "computer"
          ? "Player 1 starts. Connect two or more matching dots."
          : `${playerLabel(nextMode, startingPlayer)} starts. Pass the device after each move.`,
      );
    },
    [
      abandonSession,
      clearPendingWork,
      replaceBoard,
      replacePath,
      replacePhase,
      replaceScores,
      replaceTurn,
    ],
  );

  const resolvePath = useCallback(
    (candidate: DotCoordinate[], scoringPlayer: DotConnectPlayer) => {
      if (!isValidDotPath(boardRef.current, candidate)) {
        replacePath([]);
        replacePhase("idle");
        setMessage("That path is not valid. Connect adjacent matching dots.");
        return;
      }

      replacePath(candidate);
      replacePhase("resolving");
      setMessage(
        `${playerLabel(modeRef.current, scoringPlayer)} connected ${candidate.length} dots.`,
      );

      schedule(() => {
        const nextBoard = recolorDotPath(boardRef.current, candidate);
        const nextScores: DotConnectScores = {
          ...scoresRef.current,
          [scoringPlayer]: scoresRef.current[scoringPlayer] + candidate.length,
        };

        replaceBoard(nextBoard);
        replaceScores(nextScores);
        replacePath([]);

        if (nextScores[scoringPlayer] >= targetRef.current) {
          replaceTurn(scoringPlayer);
          replacePhase("game-over");
          const winnerLabel = playerLabel(modeRef.current, scoringPlayer);
          const summary = `${winnerLabel} wins ${nextScores.one} to ${nextScores.two}.`;
          setMessage(summary);
          completeSession({
            score: nextScores[scoringPlayer],
            scoreLabel: `${nextScores.one}–${nextScores.two}`,
            summary,
            outcome:
              modeRef.current === "computer"
                ? scoringPlayer === "one"
                  ? "won"
                  : "lost"
                : "completed",
            stats: {
              player1: nextScores.one,
              opponent: nextScores.two,
              target: targetRef.current,
            },
          });
          announce(summary);
          return;
        }

        const nextPlayer = otherPlayer(scoringPlayer);
        replaceTurn(nextPlayer);

        if (modeRef.current === "computer" && nextPlayer === "two") {
          replacePhase("ai-turn");
          setMessage("Computer is choosing a path…");

          schedule(() => {
            const aiPath = chooseDotConnectAiPath(
              boardRef.current,
              DIFFICULTY_OPTIONS[difficultyRef.current],
            );
            if (!isValidDotPath(boardRef.current, aiPath)) {
              replacePhase("idle");
              replaceTurn("one");
              setMessage("Player 1's turn. Connect two or more matching dots.");
              return;
            }

            replacePath(aiPath);
            setMessage(`Computer found a ${aiPath.length}-dot path.`);
            schedule(() => resolvePathRef.current(aiPath, "two"), 300);
          }, 360);
          return;
        }

        replacePhase("idle");
        setMessage(
          `${playerLabel(modeRef.current, nextPlayer)}'s turn. ${scoreSummary(nextScores, targetRef.current)}`,
        );
      }, 220);
    },
    [
      announce,
      completeSession,
      replaceBoard,
      replacePath,
      replacePhase,
      replaceScores,
      replaceTurn,
      schedule,
    ],
  );

  useEffect(() => {
    resolvePathRef.current = resolvePath;
  }, [resolvePath]);

  const humanCanInteract =
    !paused &&
    (phase === "idle" || phase === "selecting") &&
    (mode === "local" || turn === "one");

  const selectCoordinate = useCallback(
    (coordinate: DotCoordinate) => {
      if (
        pausedRef.current ||
        (phaseRef.current !== "idle" && phaseRef.current !== "selecting") ||
        (modeRef.current === "computer" && turnRef.current === "two")
      ) {
        return;
      }

      if (pathRef.current.length === 0) {
        startSession({ mode: modeRef.current });
      }

      const next = advanceDotPath(
        boardRef.current,
        pathRef.current,
        coordinate,
      );
      if (next === pathRef.current) return;
      replacePath(next);
      replacePhase("selecting");
      setMessage(
        next.length >= 2
          ? `${next.length} dots selected. Release after dragging or submit the path.`
          : "Choose an adjacent dot with the same symbol and color.",
      );
    },
    [replacePath, replacePhase, startSession],
  );

  function coordinateFromPoint(clientX: number, clientY: number) {
    const element = document
      .elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>("[data-dot-index]");
    const raw = element?.dataset.dotIndex;
    if (!raw) return null;
    const [row, column] = raw.split(":").map(Number);
    if (!Number.isInteger(row) || !Number.isInteger(column)) return null;
    return { row, column };
  }

  function handlePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    coordinate: DotCoordinate,
  ) {
    if (!humanCanInteract) return;
    event.preventDefault();
    pointerActiveRef.current = true;
    pointerMovedRef.current = false;
    pointerOriginRef.current = { x: event.clientX, y: event.clientY };
    boardElementRef.current?.setPointerCapture(event.pointerId);
    selectCoordinate(coordinate);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointerActiveRef.current) return;
    event.preventDefault();

    const distance = Math.hypot(
      event.clientX - pointerOriginRef.current.x,
      event.clientY - pointerOriginRef.current.y,
    );
    if (distance > 4) pointerMovedRef.current = true;

    const coordinate = coordinateFromPoint(event.clientX, event.clientY);
    if (coordinate) selectCoordinate(coordinate);
  }

  function finishPointer(event: PointerEvent<HTMLDivElement>) {
    if (!pointerActiveRef.current) return;
    pointerActiveRef.current = false;
    if (boardElementRef.current?.hasPointerCapture(event.pointerId)) {
      boardElementRef.current.releasePointerCapture(event.pointerId);
    }

    const candidate = pathRef.current;
    if (pointerMovedRef.current && isValidDotPath(boardRef.current, candidate)) {
      resolvePath(candidate, turnRef.current);
    }
  }

  function cancelSelection() {
    if (phaseRef.current !== "selecting") return;
    pointerActiveRef.current = false;
    replacePath([]);
    replacePhase("idle");
    setMessage(
      `${playerLabel(modeRef.current, turnRef.current)}'s turn. Connect two or more matching dots.`,
    );
  }

  function undoTail() {
    if (phaseRef.current !== "selecting") return;
    const next = pathRef.current.slice(0, -1);
    replacePath(next);
    if (next.length === 0) {
      replacePhase("idle");
      setMessage("Selection cleared. Choose any dot to begin.");
    } else {
      setMessage(`${next.length} dot${next.length === 1 ? "" : "s"} selected.`);
    }
  }

  function submitSelection() {
    const candidate = pathRef.current;
    if (!isValidDotPath(boardRef.current, candidate)) {
      setMessage("Select at least two adjacent matching dots first.");
      return;
    }
    resolvePath(candidate, turnRef.current);
  }

  function focusCell(row: number, column: number) {
    const boundedRow = Math.max(0, Math.min(boardRef.current.length - 1, row));
    const boundedColumn = Math.max(
      0,
      Math.min((boardRef.current[boundedRow]?.length ?? 1) - 1, column),
    );
    document
      .querySelector<HTMLElement>(
        `[data-dot-index="${boundedRow}:${boundedColumn}"]`,
      )
      ?.focus();
  }

  function handleCellKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    coordinate: DotCoordinate,
  ) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusCell(coordinate.row - 1, coordinate.column);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      focusCell(coordinate.row + 1, coordinate.column);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusCell(coordinate.row, coordinate.column - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusCell(coordinate.row, coordinate.column + 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectCoordinate(coordinate);
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelSelection();
    }
  }

  const pauseGame = useCallback(() => {
    if (phaseRef.current !== "idle" && phaseRef.current !== "selecting") return;
    pointerActiveRef.current = false;
    pausedRef.current = true;
    setPaused(true);
    setMessage("Paused. Your current path is preserved.");
  }, []);

  const resumeGame = useCallback(() => {
    pausedRef.current = false;
    setPaused(false);
    setMessage(
      pathRef.current.length > 0
        ? `${pathRef.current.length} dots selected. Continue the path or submit it.`
        : `${playerLabel(modeRef.current, turnRef.current)}'s turn. Connect two or more matching dots.`,
    );
  }, []);

  useGameExperienceControls({
    pause: pauseGame,
    resume: resumeGame,
    restart: resetGame,
    canPause: !paused && (phase === "idle" || phase === "selecting"),
    canResume: paused,
    canRestart: true,
  });

  const selectedOrder = useMemo(
    () =>
      new Map(
        path.map((coordinate, index) => [coordinateKey(coordinate), index]),
      ),
    [path],
  );

  const selectedKeys = useMemo(
    () => new Set(path.map(coordinateKey)),
    [path],
  );
  const selectedColor = path[0]
    ? board[path[0].row]?.[path[0].column]
    : undefined;
  const pathPoints = path
    .map(
      ({ row, column }) =>
        `${(column + 0.5) * 10},${(row + 0.5) * 10}`,
    )
    .join(" ");
  const winner = phase === "game-over" ? turn : null;

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Pattern puzzle
          </p>
          <h2 className="truncate text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
            {game.title}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft">No signup</Badge>
          <Badge variant="outline">Mouse, touch, keyboard</Badge>
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0" aria-label="Dots Connect board and score">
          <div className="mb-3 grid grid-cols-2 gap-2">
            {(["one", "two"] as const).map((player) => {
              const active = turn === player && phase !== "game-over";
              return (
                <div
                  key={player}
                  className={`rounded-[var(--radius-md)] border px-3 py-2.5 transition ${
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                      : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]"
                  }`}
                  aria-current={active ? "true" : undefined}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
                      {player === "two" && mode === "computer" ? (
                        <Bot className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <Gamepad2 className="h-3.5 w-3.5" aria-hidden />
                      )}
                      {playerLabel(mode, player)}
                    </span>
                    {active ? (
                      <span className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-primary-text-strong)]">
                        Turn
                      </span>
                    ) : null}
                  </div>
                  <strong className="mt-1 block text-2xl font-black tabular-nums text-[var(--color-text-primary)]">
                    {scores[player]}
                    <span className="ml-1 text-xs font-bold text-[var(--color-text-tertiary)]">
                      / {target}
                    </span>
                  </strong>
                </div>
              );
            })}
          </div>

          <div
            ref={boardElementRef}
            className={`relative mx-auto aspect-square w-full max-w-[640px] select-none touch-none overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-surface-base)] p-2 shadow-inner ${
              humanCanInteract
                ? "border-[var(--color-border-default)]"
                : "border-[var(--color-border-subtle)]"
            }`}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointer}
            onPointerCancel={() => {
              pointerActiveRef.current = false;
              cancelSelection();
            }}
            aria-label="Ten by ten Dots Connect board"
          >
            <svg
              className="pointer-events-none absolute inset-2 z-10 h-[calc(100%-1rem)] w-[calc(100%-1rem)]"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              {pathPoints ? (
                <polyline
                  points={pathPoints}
                  fill="none"
                  stroke={selectedColor ? DOT_META[selectedColor].hex : "currentColor"}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.82"
                />
              ) : null}
            </svg>

            <div className="relative z-20 grid h-full grid-cols-10 gap-px">
              {board.flatMap((row, rowIndex) =>
                row.map((color, columnIndex) => {
                  const coordinate = {
                    row: rowIndex,
                    column: columnIndex,
                  };
                  const key = coordinateKey(coordinate);
                  const selected = selectedKeys.has(key);
                  const selectionIndex = selectedOrder.get(key) ?? -1;
                  const meta = DOT_META[color];

                  return (
                    <button
                      key={key}
                      type="button"
                      data-dot-index={key}
                      tabIndex={rowIndex === 0 && columnIndex === 0 ? 0 : -1}
                      disabled={!humanCanInteract}
                      aria-label={`${meta.label}, row ${rowIndex + 1}, column ${columnIndex + 1}${
                        selected ? `, selected ${selectionIndex + 1}` : ""
                      }`}
                      aria-pressed={selected}
                      onPointerDown={(event: PointerEvent<HTMLButtonElement>) =>
                        handlePointerDown(event, coordinate)
                      }
                      onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) =>
                        handleCellKeyDown(event, coordinate)
                      }
                      className={`group relative flex min-h-0 items-center justify-center rounded-[4px] outline-none transition focus-visible:z-30 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 disabled:cursor-not-allowed ${
                        selected
                          ? "bg-[var(--color-primary-soft)]"
                          : "hover:bg-[var(--color-surface-subtle)]"
                      }`}
                    >
                      <span
                        className={`flex h-[62%] w-[62%] max-h-10 max-w-10 items-center justify-center rounded-full text-[clamp(0.55rem,2.1vw,1rem)] font-black text-white shadow-sm transition-transform group-hover:scale-105 ${
                          selected
                            ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[var(--color-surface-base)]"
                            : ""
                        }`}
                        style={
                          {
                            backgroundColor: meta.hex,
                          } as CSSProperties
                        }
                        aria-hidden
                      >
                        {meta.symbol}
                      </span>
                      {selected ? (
                        <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-text-primary)] px-1 text-xs font-black leading-none text-[var(--color-surface-base)]">
                          {selectionIndex + 1}
                        </span>
                      ) : null}
                    </button>
                  );
                }),
              )}
            </div>

            {paused || phase === "ai-turn" || phase === "resolving" ? (
              <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-[var(--color-surface-base)]/45 backdrop-blur-[1px]">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] px-3 py-2 text-xs font-black text-[var(--color-text-primary)] shadow-lg">
                  <Sparkles className="h-4 w-4 animate-pulse" aria-hidden />
                  {paused
                    ? "Game paused"
                    : phase === "ai-turn"
                      ? "Computer thinking"
                      : "Scoring path"}
                </span>
              </div>
            ) : null}
          </div>

          <p
            className="mt-3 min-h-6 text-center text-sm font-semibold text-[var(--color-text-secondary)]"
            aria-live="polite"
            aria-atomic="true"
          >
            {message}
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button
              variant="primary"
              onClick={submitSelection}
              disabled={paused || phase !== "selecting" || path.length < 2}
              leftIcon={<Check className="h-4 w-4" aria-hidden />}
            >
              Submit {path.length >= 2 ? `+${path.length}` : "path"}
            </Button>
            <Button
              variant="outline"
              onClick={undoTail}
              disabled={paused || phase !== "selecting" || path.length === 0}
              leftIcon={<Undo2 className="h-4 w-4" aria-hidden />}
            >
              Undo dot
            </Button>
            <Button
              variant="soft"
              onClick={cancelSelection}
              disabled={paused || phase !== "selecting"}
              leftIcon={<CircleOff className="h-4 w-4" aria-hidden />}
            >
              Cancel
            </Button>
          </div>
        </section>

        <aside className="grid content-start gap-3" aria-label="Game controls">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
            <h3 className="inline-flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]">
              <Sparkles
                className="h-4 w-4 text-[var(--color-primary)]"
                aria-hidden
              />
              Game setup
            </h3>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
                Opponent
                <Select
                  value={mode}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    resetGame(
                      event.target.value as DotConnectMode,
                      targetRef.current,
                      difficultyRef.current,
                    )
                  }
                >
                  <option value="computer">Play computer</option>
                  <option value="local">Local 2-player</option>
                </Select>
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
                Target score
                <Select
                  value={target}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    resetGame(
                      modeRef.current,
                      Number(event.target.value) as TargetScore,
                      difficultyRef.current,
                    )
                  }
                >
                  {TARGET_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      First to {option}
                    </option>
                  ))}
                </Select>
              </label>
              {mode === "computer" ? (
                <label className="grid gap-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
                  Computer level
                  <Select
                    value={difficulty}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      resetGame(
                        modeRef.current,
                        targetRef.current,
                        event.target.value as DotConnectDifficulty,
                      )
                    }
                  >
                    {Object.entries(DIFFICULTY_OPTIONS).map(
                      ([value, option]) => (
                        <option key={value} value={value}>
                          {option.label}
                        </option>
                      ),
                    )}
                  </Select>
                </label>
              ) : null}
            </div>
            <Button
              variant="secondary"
              onClick={() => resetGame()}
              leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
              className="mt-3 w-full"
            >
              New game
            </Button>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
            <h3 className="inline-flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]">
              <MousePointer2
                className="h-4 w-4 text-[var(--color-primary)]"
                aria-hidden
              />
              How to play
            </h3>
            <ol className="mt-3 grid gap-2 text-xs leading-5 text-[var(--color-text-secondary)]">
              <li>1. Drag through adjacent matching dots, or select them one at a time.</li>
              <li>2. Move horizontally or vertically. Diagonal jumps are rejected.</li>
              <li>3. Backtrack over the previous dot to undo only the path tail.</li>
              <li>4. Release a drag or press Submit to score the selected dots.</li>
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
              <Users className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                Mode
              </p>
              <p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">
                {mode === "computer"
                  ? `${DIFFICULTY_OPTIONS[difficulty].label} AI`
                  : "Local duel"}
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
              <Redo2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                Selected
              </p>
              <p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">
                {path.length} dots
              </p>
            </div>
          </div>
        </aside>
      </div>

      {winner ? (
        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-primary-soft)] px-4 py-5 text-center sm:px-5">
          <Trophy
            className="mx-auto h-7 w-7 text-[var(--color-primary-text-strong)]"
            aria-hidden
          />
          <h3 className="mt-2 text-xl font-black text-[var(--color-text-primary)]">
            {playerLabel(mode, winner)} wins
          </h3>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Final score: {scores.one}–{scores.two}. Start a clean board and play again.
          </p>
          <Button
            variant="primary"
            onClick={() => resetGame()}
            leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
            className="mt-3"
          >
            Play again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
