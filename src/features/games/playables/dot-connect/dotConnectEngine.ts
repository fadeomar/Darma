import type { DotBoard, DotColor, DotCoordinate } from "./dotConnectTypes";

export const DOT_CONNECT_BOARD_SIZE = 10;
export const DOT_CONNECT_COLORS: readonly DotColor[] = [
  "coral",
  "blue",
  "gold",
  "mint",
];

export type RandomSource = () => number;

const coordinateKey = ({ row, column }: DotCoordinate) => `${row}:${column}`;

export function coordinatesEqual(
  left: DotCoordinate | undefined,
  right: DotCoordinate | undefined,
) {
  return Boolean(
    left && right && left.row === right.row && left.column === right.column,
  );
}

export function isAdjacent(left: DotCoordinate, right: DotCoordinate) {
  return (
    Math.abs(left.row - right.row) +
      Math.abs(left.column - right.column) ===
    1
  );
}

export function createDotBoard(
  size = DOT_CONNECT_BOARD_SIZE,
  random: RandomSource = Math.random,
): DotBoard {
  const board = Array.from({ length: size }, () =>
    Array.from(
      { length: size },
      () =>
        DOT_CONNECT_COLORS[
          Math.floor(random() * DOT_CONNECT_COLORS.length)
        ],
    ),
  );

  return ensureBoardHasMove(board, random);
}

export function getNeighbors(board: DotBoard, coordinate: DotCoordinate) {
  const candidates: DotCoordinate[] = [
    { row: coordinate.row - 1, column: coordinate.column },
    { row: coordinate.row + 1, column: coordinate.column },
    { row: coordinate.row, column: coordinate.column - 1 },
    { row: coordinate.row, column: coordinate.column + 1 },
  ];

  return candidates.filter(
    ({ row, column }) =>
      row >= 0 &&
      row < board.length &&
      column >= 0 &&
      column < (board[row]?.length ?? 0),
  );
}

export function isValidDotPath(board: DotBoard, path: DotCoordinate[]) {
  if (path.length < 2) return false;

  const first = path[0];
  const color = board[first.row]?.[first.column];
  if (!color) return false;

  const visited = new Set<string>();

  for (let index = 0; index < path.length; index += 1) {
    const coordinate = path[index];
    if (board[coordinate.row]?.[coordinate.column] !== color) return false;

    const key = coordinateKey(coordinate);
    if (visited.has(key)) return false;
    visited.add(key);

    if (index > 0 && !isAdjacent(path[index - 1], coordinate)) return false;
  }

  return true;
}

/**
 * Extend an ordered path without ever allowing a disconnected selection.
 * Returning to the previous cell removes only the tail; revisiting any other
 * selected cell is rejected.
 */
export function advanceDotPath(
  board: DotBoard,
  path: DotCoordinate[],
  coordinate: DotCoordinate,
) {
  if (!board[coordinate.row]?.[coordinate.column]) return path;
  if (path.length === 0) return [coordinate];

  const tail = path[path.length - 1];
  if (coordinatesEqual(tail, coordinate)) return path;

  const previous = path[path.length - 2];
  if (coordinatesEqual(previous, coordinate)) return path.slice(0, -1);

  if (path.some((entry) => coordinatesEqual(entry, coordinate))) return path;
  if (!isAdjacent(tail, coordinate)) return path;
  if (
    board[tail.row]?.[tail.column] !==
    board[coordinate.row]?.[coordinate.column]
  ) {
    return path;
  }

  return [...path, coordinate];
}

export function hasAvailableDotMove(board: DotBoard) {
  for (let row = 0; row < board.length; row += 1) {
    for (let column = 0; column < board[row].length; column += 1) {
      const color = board[row][column];
      const coordinate = { row, column };
      if (
        getNeighbors(board, coordinate).some(
          (neighbor) => board[neighbor.row][neighbor.column] === color,
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

export function findAvailableDotPair(board: DotBoard): DotCoordinate[] {
  for (let row = 0; row < board.length; row += 1) {
    for (let column = 0; column < board[row].length; column += 1) {
      const coordinate = { row, column };
      const color = board[row][column];
      const neighbor = getNeighbors(board, coordinate).find(
        (candidate) => board[candidate.row][candidate.column] === color,
      );
      if (neighbor) return [coordinate, neighbor];
    }
  }

  return [];
}

export function ensureBoardHasMove(
  source: DotBoard,
  random: RandomSource = Math.random,
) {
  const board = source.map((row) => [...row]);
  if (hasAvailableDotMove(board)) return board;
  if (board.length === 0 || (board[0]?.length ?? 0) < 2) return board;

  const color =
    DOT_CONNECT_COLORS[Math.floor(random() * DOT_CONNECT_COLORS.length)];
  board[0][0] = color;
  board[0][1] = color;
  return board;
}

function chooseReplacementColor(current: DotColor, random: RandomSource) {
  const alternatives = DOT_CONNECT_COLORS.filter((color) => color !== current);
  return alternatives[Math.floor(random() * alternatives.length)];
}

export function recolorDotPath(
  source: DotBoard,
  path: DotCoordinate[],
  random: RandomSource = Math.random,
) {
  const board = source.map((row) => [...row]);

  path.forEach(({ row, column }) => {
    const current = board[row]?.[column];
    if (current) board[row][column] = chooseReplacementColor(current, random);
  });

  return ensureBoardHasMove(board, random);
}

function collectColorComponents(board: DotBoard) {
  const visited = new Set<string>();
  const components: DotCoordinate[][] = [];

  for (let row = 0; row < board.length; row += 1) {
    for (let column = 0; column < board[row].length; column += 1) {
      const start = { row, column };
      const startKey = coordinateKey(start);
      if (visited.has(startKey)) continue;

      const color = board[row][column];
      const queue = [start];
      const component: DotCoordinate[] = [];
      visited.add(startKey);

      while (queue.length > 0) {
        const current = queue.shift()!;
        component.push(current);

        getNeighbors(board, current).forEach((neighbor) => {
          const key = coordinateKey(neighbor);
          if (
            !visited.has(key) &&
            board[neighbor.row][neighbor.column] === color
          ) {
            visited.add(key);
            queue.push(neighbor);
          }
        });
      }

      if (component.length >= 2) components.push(component);
    }
  }

  return components.sort((left, right) => right.length - left.length);
}

function remainingDegree(
  board: DotBoard,
  coordinate: DotCoordinate,
  allowed: Set<string>,
  selected: Set<string>,
) {
  return getNeighbors(board, coordinate).filter((neighbor) => {
    const key = coordinateKey(neighbor);
    return allowed.has(key) && !selected.has(key);
  }).length;
}

/**
 * Bounded path search for the computer player. It deliberately stops after a
 * small node budget instead of solving the exponential longest-simple-path
 * problem used by the original game.
 */
export function chooseDotConnectAiPath(
  board: DotBoard,
  options: {
    nodeBudget?: number;
    startBudget?: number;
    maxPathLength?: number;
  } = {},
) {
  const nodeBudget = Math.max(50, options.nodeBudget ?? 2400);
  const startBudget = Math.max(1, options.startBudget ?? 12);
  const maxPathLength = Math.max(
    2,
    options.maxPathLength ?? Number.POSITIVE_INFINITY,
  );
  const components = collectColorComponents(board);
  let remainingNodes = nodeBudget;
  let best = findAvailableDotPair(board);

  for (const component of components) {
    if (remainingNodes <= 0) break;
    if (component.length <= best.length) continue;

    const allowed = new Set(component.map(coordinateKey));
    const starts = [...component]
      .sort(
        (left, right) =>
          remainingDegree(board, left, allowed, new Set()) -
          remainingDegree(board, right, allowed, new Set()),
      )
      .slice(0, startBudget);

    for (const start of starts) {
      if (remainingNodes <= 0) break;

      const path = [start];
      const selected = new Set([coordinateKey(start)]);

      const visit = (current: DotCoordinate) => {
        remainingNodes -= 1;
        if (path.length > best.length) best = [...path];
        if (
          remainingNodes <= 0 ||
          best.length === component.length ||
          best.length >= maxPathLength
        ) {
          return;
        }

        const neighbors = getNeighbors(board, current)
          .filter((neighbor) => {
            const key = coordinateKey(neighbor);
            return allowed.has(key) && !selected.has(key);
          })
          .sort(
            (left, right) =>
              remainingDegree(board, left, allowed, selected) -
              remainingDegree(board, right, allowed, selected),
          );

        for (const neighbor of neighbors) {
          if (
            remainingNodes <= 0 ||
            best.length === component.length ||
            best.length >= maxPathLength
          ) {
            break;
          }
          const key = coordinateKey(neighbor);
          selected.add(key);
          path.push(neighbor);
          visit(neighbor);
          path.pop();
          selected.delete(key);
        }
      };

      visit(start);
      if (
        best.length === component.length ||
        best.length >= maxPathLength
      ) {
        break;
      }
    }
  }

  return best.slice(0, maxPathLength);
}
