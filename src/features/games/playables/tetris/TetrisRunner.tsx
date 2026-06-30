"use client";

import { useEffect } from "react";
import { actionForKey } from "./tetrisEngine";
import { NextPreview } from "./NextPreview";
import { TetrisBoard } from "./TetrisBoard";
import { TouchControls } from "./TouchControls";
import { useTetrisGame } from "./useTetrisGame";
import type { Action, TetrisResult } from "./tetrisTypes";

const PREVENT_SCROLL_CODES = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
]);

/**
 * The live play layout: board, stats panel, next-piece previews and touch
 * controls. Owns in-game keyboard handling (movement, pause-toggle, quit) via a
 * window listener scoped to this component's lifetime. Pause and quit are
 * delegated upward so the lifecycle stays in one place (TetrisGame).
 */
export function TetrisRunner({
  rows,
  columns,
  paused,
  highScore,
  onGameOver,
  onTogglePause,
  onQuit,
}: {
  rows: number;
  columns: number;
  paused: boolean;
  highScore: number;
  onGameOver: (result: TetrisResult) => void;
  onTogglePause: () => void;
  onQuit: () => void;
}) {
  const game = useTetrisGame({ rows, columns, paused, onGameOver });
  const { dispatch, board, player, stats, linesCleared, linesToLevel } = game;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      const action = actionForKey(event.code);
      if (!action) return;

      // Stop arrows/space from scrolling the page while the game is mounted.
      if (PREVENT_SCROLL_CODES.has(event.code)) event.preventDefault();

      if (action === "Pause") {
        onTogglePause();
        return;
      }
      if (action === "Quit") {
        onQuit();
        return;
      }
      if (paused) return; // movement is frozen while paused
      dispatch(action as Action);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, paused, onTogglePause, onQuit]);

  const displayHighScore = Math.max(highScore, stats.points);

  return (
    <div className="dt-layout">
      <div className="dt-board-wrap">
        <TetrisBoard board={board} />
      </div>

      <aside className="dt-panel" aria-label="Game info">
        <div className="dt-stat-grid">
          <Stat label="Score" value={stats.points.toLocaleString()} highlight />
          <Stat label="Level" value={stats.level} />
          <Stat label="Lines" value={linesCleared} />
          <Stat label="To next" value={linesToLevel} />
        </div>

        <div className="dt-highscore">
          <span className="dt-stat-label">High score</span>
          <span className="dt-highscore-value">{displayHighScore.toLocaleString()}</span>
        </div>

        <div className="dt-next">
          <span className="dt-stat-label">Next</span>
          <NextPreview tetrominoes={player.tetrominoes} />
        </div>
      </aside>

      <div className="dt-touch-wrap">
        <TouchControls paused={paused} onAction={dispatch} onTogglePause={onTogglePause} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "dt-stat dt-stat--highlight" : "dt-stat"}>
      <span className="dt-stat-label">{label}</span>
      <span className="dt-stat-value">{value}</span>
    </div>
  );
}
