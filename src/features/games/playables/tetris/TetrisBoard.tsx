"use client";

import { cn } from "@/lib/cn";
import type { Board } from "./tetrisTypes";

/**
 * The main playfield. A CSS grid of cells; the active piece, its ghost, and
 * locked blocks are all expressed through each cell's `className`.
 */
export function TetrisBoard({ board }: { board: Board }) {
  const style = {
    gridTemplateRows: `repeat(${board.size.rows}, 1fr)`,
    gridTemplateColumns: `repeat(${board.size.columns}, 1fr)`,
  } as const;

  return (
    <div className="dt-board" style={style} role="grid" aria-label="Tetris board">
      {board.rows.map((row, y) =>
        row.map((cell, x) => (
          // Stable per-coordinate key (fixes the original `x * columns + x` bug).
          <div key={`${y}-${x}`} className={cn("dt-cell", cell.className)} aria-hidden />
        )),
      )}
    </div>
  );
}
