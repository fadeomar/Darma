/**
 * Math Sprint — engine.
 *
 * A faithful TypeScript port of the original "math-game" math utilities
 * (MIT, paulgreg/math-game) plus the scoring, difficulty grouping, question
 * generation, and a couple of Darma additions (next-question picker that avoids
 * immediate repeats, and a difficulty recommendation for the Sprint summary).
 *
 * Everything here is pure and unit-tested; randomness is injectable via the
 * `rnd` argument of `getRandomInt` so tests stay deterministic.
 */

import { DIFFICULTIES, type Difficulty, type DifficultyMap, type Operator, type OperationGroup, type Question } from "./mathSprintTypes";

/* ----------------------------------------------------------------------- */
/* Random number helpers (preserved from the original)                      */
/* ----------------------------------------------------------------------- */

export const getRandomInt = (min: number, max: number, rnd: number = Math.random()): number =>
  Math.round(rnd * (max - min) + min);

export const getRandomSimpleFloat = (power: number = getRandomInt(1, 3)): number => 1 / Math.pow(10, power);

export const getRandomFloat = (
  n1: number = getRandomInt(1, 999),
  n2: number = getRandomInt(10, 999),
  power: number = getRandomInt(1, 3),
): number => n1 + n2 / Math.pow(10, power);

/* ----------------------------------------------------------------------- */
/* Number generation per difficulty (preserved)                             */
/* ----------------------------------------------------------------------- */

export function generateNumbers(difficulty: Difficulty): [number, number] {
  switch (difficulty) {
    case "MULTIPLY_SIMPLE_FLOAT_NUMBER":
      return [getRandomSimpleFloat(), getRandomFloat()];
    case "DIVIDE_SIMPLE_FLOAT_NUMBER":
      return [getRandomFloat(), getRandomSimpleFloat()];
    case "DIVIDE_INT_2_NUMBER": {
      const x = getRandomInt(2, 10);
      return [getRandomInt(2, 9) * x, x];
    }
    case "MULTIPLY_INT_2_NUMBER":
    case "ADD_INT_2_NUMBER":
      return [getRandomInt(10, 100), getRandomInt(2, 10)];
    case "ADD_INT_3_NUMBER":
      return [getRandomInt(100, 1000), getRandomInt(2, 10)];
    case "ADD_INT_SIMPLE_NUMBER":
      return [getRandomInt(0, 5), getRandomInt(1, 5)];
    case "MULTIPLY_INT_1_NUMBER":
    case "ADD_INT_1_NUMBER":
      return [getRandomInt(2, 10), getRandomInt(2, 10)];
    case "ADD_INT_10_NUMBER":
      return [getRandomInt(10, 40), 10 * getRandomInt(1, 5)];
    case "ADD_INT_20_NUMBER":
      return [getRandomInt(10, 50), 10 * getRandomInt(1, 9)];
    case "MULTIPLY_INT_TENS_NUMBER":
      return [getRandomInt(2, 100), Math.pow(10, getRandomInt(1, 4))];
    case "DIVIDE_INT_TENS_NUMBER":
      return [getRandomInt(100, 9999), Math.pow(10, getRandomInt(1, 4))];
    case "SUBTRACT_INT_1_NUMBER":
      return [getRandomInt(5, 10), getRandomInt(1, 5)];
    case "SUBTRACT_INT_FROM_TEN_NUMBER":
      return [10, getRandomInt(1, 10)];
    case "SUBTRACT_INT_2_NUMBER":
      return [getRandomInt(50, 99), getRandomInt(1, 50)];
    case "SUBTRACT_INT_3_NUMBER":
      return [getRandomInt(100, 999), getRandomInt(1, 100)];
    case "SUBTRACT_NEGATIVE_INT_1_NUMBER":
      return [getRandomInt(1, 10), getRandomInt(5, 10)];
    case "SUBTRACT_NEGATIVE_INT_2_NUMBER":
      return [getRandomInt(1, 50), getRandomInt(50, 100)];
    default:
      throw new Error(`difficulty is not set: ${difficulty as string}`);
  }
}

/* ----------------------------------------------------------------------- */
/* Operation, computation, and answer checking (preserved)                  */
/* ----------------------------------------------------------------------- */

export function getOperation(difficulty: Difficulty): Operator {
  switch (difficulty) {
    case "DIVIDE_INT_2_NUMBER":
    case "DIVIDE_SIMPLE_FLOAT_NUMBER":
    case "DIVIDE_INT_TENS_NUMBER":
      return "÷";
    case "MULTIPLY_INT_1_NUMBER":
    case "MULTIPLY_INT_2_NUMBER":
    case "MULTIPLY_SIMPLE_FLOAT_NUMBER":
    case "MULTIPLY_INT_TENS_NUMBER":
      return "×";
    case "SUBTRACT_INT_1_NUMBER":
    case "SUBTRACT_INT_FROM_TEN_NUMBER":
    case "SUBTRACT_INT_2_NUMBER":
    case "SUBTRACT_INT_3_NUMBER":
    case "SUBTRACT_NEGATIVE_INT_1_NUMBER":
    case "SUBTRACT_NEGATIVE_INT_2_NUMBER":
      return "-";
    default:
      return "+";
  }
}

export function compute({ difficulty, x, y }: { difficulty: Difficulty; x: number; y: number }): number {
  switch (getOperation(difficulty)) {
    case "×":
      return x * y;
    case "÷":
      return x / y;
    case "+":
      return x + y;
    case "-":
      return x - y;
    default:
      throw new Error("difficulty is not set");
  }
}

/** Result tolerance for decimals is preserved from the original (1e-9). */
export const RESULT_TOLERANCE = 0.000000001;

export function checkResult({
  difficulty,
  x,
  y,
  result,
}: {
  difficulty: Difficulty;
  x: number;
  y: number;
  result: string;
}): boolean {
  const parsedResult = parseFloat((result || "").replace(",", "."));
  if (Number.isNaN(parsedResult)) return false;
  const computedResult = compute({ difficulty, x, y });
  return Math.abs(parsedResult - computedResult) < RESULT_TOLERANCE;
}

/* ----------------------------------------------------------------------- */
/* Scoring (preserved)                                                      */
/* ----------------------------------------------------------------------- */

const POINTS: Partial<Record<Difficulty, number>> = {
  ADD_INT_1_NUMBER: 1,
  MULTIPLY_INT_TENS_NUMBER: 2,
  SUBTRACT_INT_1_NUMBER: 2,
  ADD_INT_10_NUMBER: 2,
  DIVIDE_INT_TENS_NUMBER: 3,
  ADD_INT_2_NUMBER: 3,
  SUBTRACT_NEGATIVE_INT_1_NUMBER: 3,
  ADD_INT_20_NUMBER: 3,
  ADD_INT_3_NUMBER: 4,
  SUBTRACT_INT_2_NUMBER: 4,
  MULTIPLY_SIMPLE_FLOAT_NUMBER: 4,
  DIVIDE_SIMPLE_FLOAT_NUMBER: 4,
  MULTIPLY_INT_1_NUMBER: 5,
  SUBTRACT_NEGATIVE_INT_2_NUMBER: 5,
  SUBTRACT_INT_3_NUMBER: 5,
  DIVIDE_INT_2_NUMBER: 5,
  MULTIPLY_INT_2_NUMBER: 6,
};

export function getPoints(difficulty: Difficulty): number {
  return POINTS[difficulty] ?? 1;
}

/* ----------------------------------------------------------------------- */
/* Difficulty selection + grouping                                          */
/* ----------------------------------------------------------------------- */

export function checkAtLeastOneValue(options: DifficultyMap): boolean {
  return Object.values(options).some((value) => value === true);
}

export function enabledDifficulties(difficulties: DifficultyMap): Difficulty[] {
  return DIFFICULTIES.filter((key) => difficulties[key]);
}

/** Pick a random enabled difficulty (preserved). Returns null when none are enabled. */
export function pickRandomDifficulty(difficulties: DifficultyMap, rnd: number = Math.random()): Difficulty | null {
  const available = enabledDifficulties(difficulties);
  if (available.length === 0) return null;
  return available[getRandomInt(0, available.length - 1, rnd)];
}

export const OPERATION_GROUPS: Record<OperationGroup, Difficulty[]> = {
  addition: ["ADD_INT_SIMPLE_NUMBER", "ADD_INT_1_NUMBER", "ADD_INT_10_NUMBER", "ADD_INT_20_NUMBER", "ADD_INT_2_NUMBER", "ADD_INT_3_NUMBER"],
  subtraction: [
    "SUBTRACT_INT_1_NUMBER",
    "SUBTRACT_INT_FROM_TEN_NUMBER",
    "SUBTRACT_INT_2_NUMBER",
    "SUBTRACT_INT_3_NUMBER",
    "SUBTRACT_NEGATIVE_INT_1_NUMBER",
    "SUBTRACT_NEGATIVE_INT_2_NUMBER",
  ],
  multiplication: ["MULTIPLY_INT_1_NUMBER", "MULTIPLY_INT_2_NUMBER", "MULTIPLY_INT_TENS_NUMBER"],
  division: ["DIVIDE_INT_2_NUMBER", "DIVIDE_INT_TENS_NUMBER"],
  advanced: ["MULTIPLY_SIMPLE_FLOAT_NUMBER", "DIVIDE_SIMPLE_FLOAT_NUMBER"],
};

export const GROUP_LABELS: Record<OperationGroup, string> = {
  addition: "Addition",
  subtraction: "Subtraction",
  multiplication: "Multiplication",
  division: "Division",
  advanced: "Decimals",
};

export const GROUP_EXAMPLES: Record<OperationGroup, string> = {
  addition: "6 + 9, 53 + 9",
  subtraction: "45 − 12, 4 − 6",
  multiplication: "2 × 5, 32 × 3",
  division: "30 ÷ 5, ÷ 10/100",
  advanced: "23.1 × 0.01, ÷ decimals",
};

/** All difficulties off — the base map the storage layer merges saved values into. */
export function emptyDifficultyMap(): DifficultyMap {
  return DIFFICULTIES.reduce((map, key) => {
    map[key] = false;
    return map;
  }, {} as DifficultyMap);
}

/** The default preset: classic multiplication on (matches the original default). */
export function getDefaultDifficulties(): DifficultyMap {
  return { ...emptyDifficultyMap(), MULTIPLY_INT_1_NUMBER: true };
}

/** Difficulties enabled for kid-friendly mode (simple addition + multiplication). */
export const KIDS_DIFFICULTIES: Difficulty[] = ["ADD_INT_SIMPLE_NUMBER", "ADD_INT_1_NUMBER", "MULTIPLY_INT_1_NUMBER"];

export function kidsDifficultyMap(): DifficultyMap {
  const map = emptyDifficultyMap();
  for (const key of KIDS_DIFFICULTIES) map[key] = true;
  return map;
}

/** True when every difficulty in a group is enabled. */
export function isGroupEnabled(difficulties: DifficultyMap, group: OperationGroup): boolean {
  return OPERATION_GROUPS[group].every((key) => difficulties[key]);
}

/** True when at least one difficulty in a group is enabled. */
export function isGroupPartiallyEnabled(difficulties: DifficultyMap, group: OperationGroup): boolean {
  return OPERATION_GROUPS[group].some((key) => difficulties[key]);
}

/** Toggle every difficulty in a group on/off, never leaving zero groups enabled. */
export function setGroup(difficulties: DifficultyMap, group: OperationGroup, enabled: boolean): DifficultyMap {
  const next: DifficultyMap = { ...difficulties };
  for (const key of OPERATION_GROUPS[group]) next[key] = enabled;
  // Guard the invariant: at least one difficulty must stay enabled.
  if (!checkAtLeastOneValue(next)) return difficulties;
  return next;
}

/* ----------------------------------------------------------------------- */
/* Question building + recommendation                                       */
/* ----------------------------------------------------------------------- */

export function buildQuestion(difficulty: Difficulty): Question {
  const [x, y] = generateNumbers(difficulty);
  return {
    difficulty,
    x,
    y,
    operator: getOperation(difficulty),
    answer: compute({ difficulty, x, y }),
    points: getPoints(difficulty),
  };
}

/** Pick the next question, avoiding an immediate exact repeat (preserved behaviour). */
export function nextQuestion(difficulties: DifficultyMap, previous?: Question | null): Question | null {
  const difficulty = pickRandomDifficulty(difficulties);
  if (!difficulty) return null;
  let question = buildQuestion(difficulty);
  // Avoid the exact same prompt twice in a row (a handful of retries is plenty).
  for (let i = 0; i < 8 && previous && question.x === previous.x && question.y === previous.y && question.difficulty === previous.difficulty; i += 1) {
    question = buildQuestion(pickRandomDifficulty(difficulties) ?? difficulty);
  }
  return question;
}

export const SPRINT_SECONDS = 60;

/** Reveal the exact answer after this many wrong attempts on a single question. */
export const MAX_ATTEMPTS = 3;

/**
 * Suggest where to go next after a Sprint, based on accuracy and speed. Pure so it
 * can be unit-tested. Returns a short, friendly recommendation string.
 */
export function recommendNextDifficulty(stats: { correct: number; wrong: number; averageTime: number | null }): string {
  const total = stats.correct + stats.wrong;
  if (total === 0) return "Pick a few operations and give it a go!";
  const accuracy = stats.correct / total;
  const avg = stats.averageTime ?? 99;

  if (accuracy >= 0.9 && avg <= 3) return "Sharp and fast — add a harder group like Division or Decimals.";
  if (accuracy >= 0.85) return "Great accuracy — try mixing in one more operation group.";
  if (accuracy >= 0.6) return "Solid — keep this set and aim for a faster average.";
  return "Warming up — try fewer or simpler operations to build confidence.";
}
