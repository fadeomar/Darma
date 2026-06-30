/**
 * Shared types for the Darma Tetris playable.
 *
 * The original CodeSandbox prototype used loose, untyped objects. These types
 * make the board, pieces, player, and stats explicit so the engine and React
 * layers stay in sync.
 */

/** Position of a piece's top-left anchor inside the board grid. */
export type Position = {
  row: number;
  column: number;
};

/** The seven standard tetromino keys. */
export type TetrominoKey = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

/** A 2D matrix of 0/1 describing which cells a piece occupies. */
export type Shape = number[][];

/** A tetromino: its current shape matrix and the CSS class used to colour it. */
export type Tetromino = {
  shape: Shape;
  className: string;
};

/** A single board cell. `occupied` cells survive into the next frame. */
export type BoardCell = {
  occupied: boolean;
  className: string;
};

/** The board grid plus its dimensions. */
export type Board = {
  rows: BoardCell[][];
  size: {
    rows: number;
    columns: number;
  };
};

/**
 * The active player: the falling piece, its position, the upcoming queue, and
 * the two flags the board reducer reads to decide when to lock a piece.
 */
export type Player = {
  collided: boolean;
  isFastDropping: boolean;
  position: Position;
  /** Upcoming queue; the active piece is popped from the end. */
  tetrominoes: Tetromino[];
  tetromino: Tetromino;
};

/** Score/level progression. */
export type GameStats = {
  level: number;
  linesCompleted: number;
  linesPerLevel: number;
  points: number;
};

/** Top-level lifecycle of the player UI. */
export type TetrisStatus = "idle" | "playing" | "paused" | "over";

/** Player intents, decoupled from the physical keys that trigger them. */
export type Action =
  | "Left"
  | "Right"
  | "Rotate"
  | "SlowDrop"
  | "FastDrop"
  | "Pause"
  | "Quit";

/** A finished run, surfaced to the game-over screen and high-score store. */
export type TetrisResult = {
  points: number;
  level: number;
  lines: number;
};
