import type {
  SnakeDifficulty,
  SnakeDirection,
  SnakePoint,
  SnakeSettings,
  SnakeState,
} from "./snakeTypes";

export const SNAKE_SPEED_MS: Record<SnakeDifficulty, number> = {
  chill: 230,
  normal: 178,
  fast: 132,
  insane: 96,
};

const DELTA: Record<SnakeDirection, SnakePoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function seededRandom(seed: number): () => number {
  let value = seed || 1;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export function samePoint(a: SnakePoint, b: SnakePoint): boolean {
  return a.x === b.x && a.y === b.y;
}

export function isOpposite(a: SnakeDirection, b: SnakeDirection): boolean {
  return (
    (a === "up" && b === "down") ||
    (a === "down" && b === "up") ||
    (a === "left" && b === "right") ||
    (a === "right" && b === "left")
  );
}

export function queueDirection(
  state: SnakeState,
  direction: SnakeDirection,
): SnakeState {
  if (state.status === "ready") {
    const head = state.snake[0];
    const delta = DELTA[direction];
    return {
      ...state,
      direction,
      queuedDirection: direction,
      snake: [
        head,
        { x: head.x - delta.x, y: head.y - delta.y },
        { x: head.x - delta.x * 2, y: head.y - delta.y * 2 },
      ],
    };
  }
  if (isOpposite(state.direction, direction)) return state;
  return { ...state, queuedDirection: direction };
}

function pointKey(point: SnakePoint): string {
  return `${point.x}:${point.y}`;
}

function createMazeObstacles(size: number): SnakePoint[] {
  const mid = Math.floor(size / 2);
  const safeGap = new Set([
    mid - 3,
    mid - 2,
    mid - 1,
    mid,
    mid + 1,
    mid + 2,
    mid + 3,
  ]);
  const obstacles: SnakePoint[] = [];
  for (let i = 3; i < size - 3; i += 1) {
    // Keep a generous plus-shaped spawn lane so Maze Runner never ends on tick one.
    if (!safeGap.has(i)) {
      obstacles.push({ x: mid, y: i });
      if (size > 15) obstacles.push({ x: i, y: mid });
    }
  }
  return obstacles;
}

export function placeFood(
  size: number,
  occupied: SnakePoint[],
  seed = Date.now(),
): SnakePoint {
  const random = seededRandom(seed);
  const blocked = new Set(occupied.map(pointKey));
  const free: SnakePoint[] = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const point = { x, y };
      if (!blocked.has(pointKey(point))) free.push(point);
    }
  }
  if (!free.length) return { x: 0, y: 0 };
  return free[Math.floor(random() * free.length)];
}

export function createInitialSnakeState(
  settings: Partial<SnakeSettings> = {},
): SnakeState {
  const size = settings.size ?? 16;
  const mode = settings.mode ?? "classic";
  const difficulty = settings.difficulty ?? "normal";
  const seed = settings.seed ?? Date.now();
  const center = Math.floor(size / 2);
  const snake = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center },
  ];
  const obstacles = mode === "maze" ? createMazeObstacles(size) : [];
  const food = placeFood(size, [...snake, ...obstacles], seed);
  return {
    settings: { size, mode, difficulty, seed },
    snake,
    direction: "right",
    queuedDirection: "right",
    food,
    goldenFood: null,
    obstacles,
    score: 0,
    apples: 0,
    level: 1,
    streak: 0,
    ticks: 0,
    status: "ready",
    message: "Press start or use the keyboard to begin.",
    event: "none",
  };
}

/** Shared by the game loop and the renderer so movement timing and visual interpolation never disagree. */
export function snakeStepIntervalMs(
  difficulty: SnakeDifficulty,
  level: number,
): number {
  return Math.max(42, SNAKE_SPEED_MS[difficulty] - (level - 1) * 5);
}

function wrapPoint(point: SnakePoint, size: number): SnakePoint {
  return { x: (point.x + size) % size, y: (point.y + size) % size };
}

export function nextHead(
  head: SnakePoint,
  direction: SnakeDirection,
  size: number,
  wrap: boolean,
): SnakePoint {
  const delta = DELTA[direction];
  const next = { x: head.x + delta.x, y: head.y + delta.y };
  return wrap ? wrapPoint(next, size) : next;
}

export function isOutside(point: SnakePoint, size: number): boolean {
  return point.x < 0 || point.y < 0 || point.x >= size || point.y >= size;
}

export function stepSnake(state: SnakeState): SnakeState {
  if (state.status !== "running") return state;

  const { size, mode, seed = 1 } = state.settings;
  const direction = state.queuedDirection;
  const head = nextHead(state.snake[0], direction, size, mode === "wrap");
  const eatsFood = samePoint(head, state.food);
  const eatsGolden = state.goldenFood
    ? samePoint(head, state.goldenFood)
    : false;
  const nextBody =
    eatsFood || eatsGolden ? [...state.snake] : state.snake.slice(0, -1);

  if (mode !== "wrap" && isOutside(head, size)) {
    return {
      ...state,
      direction,
      queuedDirection: direction,
      status: "game-over",
      message: "Wall crash. Try a cleaner turn rhythm.",
      event: "crash-wall",
    };
  }
  if (nextBody.some((part) => samePoint(part, head))) {
    return {
      ...state,
      direction,
      queuedDirection: direction,
      status: "game-over",
      message: "Self collision. Keep more escape space open.",
      event: "crash-self",
    };
  }
  if (state.obstacles.some((part) => samePoint(part, head))) {
    return {
      ...state,
      direction,
      queuedDirection: direction,
      status: "game-over",
      message: "Maze block hit. Use the lanes to plan ahead.",
      event: "crash-obstacle",
    };
  }

  const snake = [head, ...nextBody];
  const ticks = state.ticks + 1;
  const scoreGain = eatsGolden ? 50 : eatsFood ? 10 + state.level * 2 : 0;
  const apples = state.apples + (eatsFood ? 1 : 0) + (eatsGolden ? 1 : 0);
  const streak = eatsFood || eatsGolden ? state.streak + 1 : state.streak;
  const level = Math.max(1, Math.floor(apples / 5) + 1);
  const occupied = [...snake, ...state.obstacles];
  const food = eatsFood
    ? placeFood(size, occupied, seed + ticks + apples * 13)
    : state.food;
  const shouldSpawnGolden = eatsFood && apples > 0 && apples % 5 === 0;
  const goldenFood = eatsGolden
    ? null
    : shouldSpawnGolden
      ? placeFood(size, [...occupied, food], seed + ticks + apples * 31)
      : state.goldenFood && ticks % 45 !== 0
        ? state.goldenFood
        : null;

  return {
    ...state,
    snake,
    direction,
    queuedDirection: direction,
    food,
    goldenFood,
    score: state.score + scoreGain,
    apples,
    level,
    streak,
    ticks,
    message: eatsGolden
      ? "Golden bite! Big bonus."
      : eatsFood
        ? "Nice bite. Keep the chain clean."
        : state.message,
    event: eatsGolden ? "golden" : eatsFood ? "eat" : "none",
  };
}

export function boardFillPercent(state: SnakeState): number {
  const playable =
    state.settings.size * state.settings.size - state.obstacles.length;
  return Math.round((state.snake.length / playable) * 1000) / 10;
}
