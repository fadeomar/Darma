"use client";

import { cn } from "@/lib/cn";
import { buildBoard, transferToBoard } from "./tetrisEngine";
import type { Tetromino } from "./tetrisTypes";

const PREVIEW_SIZE = 4;

function PreviewPiece({ tetromino }: { tetromino: Tetromino }) {
  const board = buildBoard({ rows: PREVIEW_SIZE, columns: PREVIEW_SIZE });
  board.rows = transferToBoard({
    className: tetromino.className,
    isOccupied: false,
    position: { row: 0, column: 0 },
    rows: board.rows,
    shape: tetromino.shape,
  });

  return (
    <div className="dt-preview" aria-hidden>
      {board.rows.map((row, y) =>
        row.map((cell, x) => (
          <div key={`${y}-${x}`} className={cn("dt-preview-cell", cell.className)} />
        )),
      )}
    </div>
  );
}

/**
 * The "next pieces" queue. `tetrominoes` is the player's upcoming list; the
 * piece spawned next sits at the end, so we take the tail and show it first.
 */
export function NextPreview({ tetrominoes, count = 3 }: { tetrominoes: Tetromino[]; count?: number }) {
  const upcoming = tetrominoes.slice(-count).reverse();
  return (
    <div className="dt-previews">
      {upcoming.map((tetromino, index) => (
        <PreviewPiece key={index} tetromino={tetromino} />
      ))}
    </div>
  );
}
