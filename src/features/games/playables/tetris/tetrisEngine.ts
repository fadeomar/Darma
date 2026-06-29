/**
 * Pure Tetris engine.
 *
 * Ported from a CodeSandbox React-hooks Tetris prototype (no licence file was
 * shipped with the source — see the playable's README note). The original
 * algorithms — collision, rotation, ghost piece, line clears and scoring — are
 * preserved; only the following changed during the port:
 *   - Converted to TypeScript with explicit types.
 *   - Merged the formerly circular `Board` ⇄ `PlayerController` modules into one
 *     file so the dependency graph is clean.
 *   - Scoped CSS class names to the `dt-piece*` namespace (no global `.tetromino`).
 */

import type {
  Action,
  Board,
  BoardCell,
  Player,
  Position,
  Shape,
  Tetromino,
  TetrominoKey,
} from "./tetrisTypes";

const PIECE = "dt-piece";

export const TETROMINOES: Record<TetrominoKey, Tetromino> = {
  I: {
    shape: [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
    className: `${PIECE} ${PIECE}--i`,
  },
  J: {
    shape: [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    className: `${PIECE} ${PIECE}--j`,
  },
  L: {
    shape: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    className: `${PIECE} ${PIECE}--l`,
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    className: `${PIECE} ${PIECE}--o`,
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    className: `${PIECE} ${PIECE}--s`,
  },
  T: {
    shape: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
    className: `${PIECE} ${PIECE}--t`,
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    className: `${PIECE} ${PIECE}--z`,
  },
};

const TETROMINO_KEYS = Object.keys(TETROMINOES) as TetrominoKey[];

export const randomTetromino = (): Tetromino => {
  const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
  // Clone the shape so rotations never mutate the shared template.
  const template = TETROMINOES[key];
  return { className: template.className, shape: template.shape.map((row) => [...row]) };
};

export const rotate = ({ piece, direction }: { piece: Shape; direction: number }): Shape => {
  // Transpose rows and columns.
  const transposed = piece.map((_, index) => piece.map((column) => column[index]));
  // Reverse rows to rotate clockwise, columns to rotate counter-clockwise.
  if (direction > 0) return transposed.map((row) => row.reverse());
  return transposed.reverse();
};

const defaultCell = (): BoardCell => ({ occupied: false, className: "" });

export const buildBoard = ({ rows, columns }: { rows: number; columns: number }): Board => {
  const builtRows = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => defaultCell()),
  );
  return { rows: builtRows, size: { rows, columns } };
};

export const transferToBoard = ({
  className,
  isOccupied,
  position,
  rows,
  shape,
}: {
  className: string;
  isOccupied: boolean;
  position: Position;
  rows: BoardCell[][];
  shape: Shape;
}): BoardCell[][] => {
  shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        const _y = y + position.row;
        const _x = x + position.column;
        rows[_y][_x] = { occupied: isOccupied, className };
      }
    });
  });
  return rows;
};

export const hasCollision = ({
  board,
  position,
  shape,
}: {
  board: Board;
  position: Position;
  shape: Shape;
}): boolean => {
  for (let y = 0; y < shape.length; y++) {
    const row = y + position.row;
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const column = x + position.column;
        if (board.rows[row] && board.rows[row][column] && board.rows[row][column].occupied) {
          return true;
        }
      }
    }
  }
  return false;
};

export const isWithinBoard = ({
  board,
  position,
  shape,
}: {
  board: Board;
  position: Position;
  shape: Shape;
}): boolean => {
  for (let y = 0; y < shape.length; y++) {
    const row = y + position.row;
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const column = x + position.column;
        const isValidPosition = Boolean(board.rows[row] && board.rows[row][column]);
        if (!isValidPosition) return false;
      }
    }
  }
  return true;
};

export const movePlayer = ({
  delta,
  position,
  shape,
  board,
}: {
  delta: Position;
  position: Position;
  shape: Shape;
  board: Board;
}): { collided: boolean; nextPosition: Position } => {
  const desiredNextPosition: Position = {
    row: position.row + delta.row,
    column: position.column + delta.column,
  };

  const collided = hasCollision({ board, position: desiredNextPosition, shape });
  const isOnBoard = isWithinBoard({ board, position: desiredNextPosition, shape });

  const preventMove = !isOnBoard || (isOnBoard && collided);
  const nextPosition = preventMove ? position : desiredNextPosition;

  const isMovingDown = delta.row > 0;
  const isHit = isMovingDown && (collided || !isOnBoard);

  return { collided: isHit, nextPosition };
};

const findDropPosition = ({
  board,
  position,
  shape,
}: {
  board: Board;
  position: Position;
  shape: Shape;
}): Position => {
  const max = board.size.rows - position.row + 1;
  let row = 0;

  for (let i = 0; i < max; i++) {
    const delta: Position = { row: i, column: 0 };
    const { collided } = movePlayer({ delta, position, shape, board });
    if (collided) break;
    row = position.row + i;
  }

  return { ...position, row };
};

export const nextBoard = ({
  board,
  player,
  resetPlayer,
  addLinesCleared,
}: {
  board: Board;
  player: Player;
  resetPlayer: () => void;
  addLinesCleared: (lines: number) => void;
}): Board => {
  const { tetromino, position } = player;

  // Copy the board, keeping only locked cells; transient (ghost/active) cells reset.
  let rows = board.rows.map((row) =>
    row.map((cell) => (cell.occupied ? cell : defaultCell())),
  );

  // Project the ghost piece to where it would land.
  const dropPosition = findDropPosition({ board, position, shape: tetromino.shape });
  const ghostClassName = `${tetromino.className} ${player.isFastDropping ? "" : `${PIECE}--ghost`}`;
  rows = transferToBoard({
    className: ghostClassName,
    isOccupied: player.isFastDropping,
    position: dropPosition,
    rows,
    shape: tetromino.shape,
  });

  // Draw the active piece. Mark cells occupied (locked) when it has collided.
  if (!player.isFastDropping) {
    rows = transferToBoard({
      className: tetromino.className,
      isOccupied: player.collided,
      position,
      rows,
      shape: tetromino.shape,
    });
  }

  // Clear any fully-filled lines, dropping the rows above down.
  const blankRow = rows[0].map(() => defaultCell());
  let linesCleared = 0;
  rows = rows.reduce<BoardCell[][]>((acc, row) => {
    if (row.every((column) => column.occupied)) {
      linesCleared++;
      acc.unshift(blankRow.map((cell) => ({ ...cell })));
    } else {
      acc.push(row);
    }
    return acc;
  }, []);

  if (linesCleared > 0) addLinesCleared(linesCleared);

  // Lock complete: spawn the next piece.
  if (player.collided || player.isFastDropping) resetPlayer();

  return { rows, size: { ...board.size } };
};

const attemptRotation = ({
  board,
  player,
  setPlayer,
}: {
  board: Board;
  player: Player;
  setPlayer: (player: Player) => void;
}): void => {
  const shape = rotate({ piece: player.tetromino.shape, direction: 1 });
  const position = player.position;
  const isValidRotation =
    isWithinBoard({ board, position, shape }) && !hasCollision({ board, position, shape });

  if (isValidRotation) {
    setPlayer({ ...player, tetromino: { ...player.tetromino, shape } });
  }
};

const attemptMovement = ({
  board,
  action,
  player,
  setPlayer,
  setGameOver,
}: {
  board: Board;
  action: Action;
  player: Player;
  setPlayer: (player: Player) => void;
  setGameOver: (gameOver: boolean) => void;
}): void => {
  const delta: Position = { row: 0, column: 0 };
  let isFastDropping = false;

  if (action === "FastDrop") {
    isFastDropping = true;
  } else if (action === "SlowDrop") {
    delta.row += 1;
  } else if (action === "Left") {
    delta.column -= 1;
  } else if (action === "Right") {
    delta.column += 1;
  }

  const { collided, nextPosition } = movePlayer({
    delta,
    position: player.position,
    shape: player.tetromino.shape,
    board,
  });

  // A collision while still at the top row means the stack reached the ceiling.
  if (collided && player.position.row === 0) {
    setGameOver(true);
  }

  setPlayer({ ...player, collided, isFastDropping, position: nextPosition });
};

export const playerController = ({
  action,
  board,
  player,
  setPlayer,
  setGameOver,
}: {
  action: Action | undefined;
  board: Board;
  player: Player;
  setPlayer: (player: Player) => void;
  setGameOver: (gameOver: boolean) => void;
}): void => {
  if (!action) return;
  if (action === "Rotate") {
    attemptRotation({ board, player, setPlayer });
  } else {
    attemptMovement({ board, action, player, setPlayer, setGameOver });
  }
};

/** Map a physical key code to a game action. Unmapped keys return `undefined`. */
const KEY_TO_ACTION: Record<string, Action> = {
  ArrowUp: "Rotate",
  ArrowDown: "SlowDrop",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  KeyP: "Pause",
  KeyQ: "Quit",
  Escape: "Quit",
  Space: "FastDrop",
};

export const actionForKey = (code: string): Action | undefined => KEY_TO_ACTION[code];

export const actionIsDrop = (action: Action | undefined): boolean =>
  action === "SlowDrop" || action === "FastDrop";
