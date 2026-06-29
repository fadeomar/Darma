"use client";

/**
 * Single-run Tetris controller.
 *
 * Holds all state for one game (board, active player, queue, stats, drop timer)
 * and exposes a small imperative API (`dispatch`) plus derived display values.
 * A fresh run is obtained by remounting the consumer (changing its React key) —
 * this mirrors the original prototype, which rebuilt the game on every start,
 * and keeps reset logic trivial and bug-free.
 *
 * Pause/quit are owned by the parent player component; this hook only freezes
 * the drop interval via the `paused` flag and runs movement actions.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildBoard,
  nextBoard,
  playerController,
  randomTetromino,
} from "./tetrisEngine";
import type {
  Action,
  Board,
  GameStats,
  Player,
  TetrisResult,
} from "./tetrisTypes";

const DEFAULT_DROP_MS = 1000;
const MIN_DROP_MS = 100;
const SPEED_STEP_MS = 50;
const QUEUE_SIZE = 5;

function dropTimeForLevel(level: number): number {
  return Math.max(DEFAULT_DROP_MS - SPEED_STEP_MS * (level - 1), MIN_DROP_MS);
}

function buildGameStats(): GameStats {
  return { level: 1, linesCompleted: 0, linesPerLevel: 10, points: 0 };
}

function buildPlayer(previous?: Player): Player {
  let tetrominoes;
  if (previous) {
    tetrominoes = [...previous.tetrominoes];
    tetrominoes.unshift(randomTetromino());
  } else {
    tetrominoes = Array.from({ length: QUEUE_SIZE }, () => randomTetromino());
  }
  const queue = [...tetrominoes];
  const tetromino = queue.pop()!;
  return {
    collided: false,
    isFastDropping: false,
    position: { row: 0, column: 4 },
    tetrominoes: queue,
    tetromino,
  };
}

/** Total lines cleared across all levels (display only). */
function totalLines(stats: GameStats): number {
  return (stats.level - 1) * stats.linesPerLevel + stats.linesCompleted;
}

/** Dan Abramov's `useInterval`; `delay = null` pauses the timer. */
function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

export type TetrisGameApi = {
  board: Board;
  player: Player;
  stats: GameStats;
  linesCleared: number;
  linesToLevel: number;
  /** Run a single action (movement/rotation/drop). Rotation etc. are ignored once over. */
  dispatch: (action: Action) => void;
};

export function useTetrisGame({
  rows,
  columns,
  paused,
  onGameOver,
}: {
  rows: number;
  columns: number;
  paused: boolean;
  onGameOver: (result: TetrisResult) => void;
}): TetrisGameApi {
  const [stats, setStats] = useState<GameStats>(buildGameStats);
  const [player, setPlayer] = useState<Player>(() => buildPlayer());
  const [board, setBoard] = useState<Board>(() => buildBoard({ rows, columns }));
  const [gameOver, setGameOver] = useState(false);

  const resetPlayer = useCallback(() => {
    setPlayer((prev) => buildPlayer(prev));
  }, []);

  const addLinesCleared = useCallback((lines: number) => {
    setStats((previous) => {
      const points = previous.points + lines * 100;
      const newLinesCompleted = previous.linesCompleted + lines;
      const level =
        newLinesCompleted >= previous.linesPerLevel ? previous.level + 1 : previous.level;
      const linesCompleted = newLinesCompleted % previous.linesPerLevel;
      return { ...previous, level, linesCompleted, points };
    });
  }, []);

  // Recompute the board whenever the player moves/rotates/drops.
  useEffect(() => {
    setBoard((previousBoard) =>
      nextBoard({ board: previousBoard, player, resetPlayer, addLinesCleared }),
    );
  }, [player, resetPlayer, addLinesCleared]);

  // Auto-drop on a level-scaled cadence, frozen while paused or over.
  const dropDelay = paused || gameOver ? null : dropTimeForLevel(stats.level);
  const dispatch = useCallback(
    (action: Action) => {
      if (gameOver) return;
      playerController({ action, board, player, setPlayer, setGameOver });
    },
    [board, player, gameOver],
  );

  useInterval(() => dispatch("SlowDrop"), dropDelay);

  // Surface a finished run exactly once.
  const reported = useRef(false);
  const statsRef = useRef(stats);
  // Keep the latest stats available to the game-over effect without making it
  // depend on (and re-run for) every stats change. The sync effect is declared
  // first, so it commits before the reporting effect reads the ref.
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);
  useEffect(() => {
    if (gameOver && !reported.current) {
      reported.current = true;
      const finished = statsRef.current;
      onGameOver({
        points: finished.points,
        level: finished.level,
        lines: totalLines(finished),
      });
    }
  }, [gameOver, onGameOver]);

  return {
    board,
    player,
    stats,
    linesCleared: totalLines(stats),
    linesToLevel: stats.linesPerLevel - stats.linesCompleted,
    dispatch,
  };
}
