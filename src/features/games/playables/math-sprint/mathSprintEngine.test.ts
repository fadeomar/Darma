import { describe, expect, it, test } from "vitest";
import {
  buildQuestion,
  checkAtLeastOneValue,
  checkResult,
  emptyDifficultyMap,
  enabledDifficulties,
  generateNumbers,
  getDefaultDifficulties,
  getOperation,
  getPoints,
  getRandomFloat,
  getRandomInt,
  getRandomSimpleFloat,
  isGroupEnabled,
  nextQuestion,
  pickRandomDifficulty,
  recommendNextDifficulty,
  setGroup,
} from "./mathSprintEngine";
import { DIFFICULTIES, type DifficultyMap } from "./mathSprintTypes";

describe("getRandomInt", () => {
  it.each([
    { min: 0, max: 10, rnd: 0, output: 0 },
    { min: 1, max: 10, rnd: 0.12345, output: 2 },
    { min: 1, max: 10, rnd: 0.567, output: 6 },
    { min: 1, max: 10, rnd: 0, output: 1 },
    { min: 1, max: 10, rnd: 1, output: 10 },
    { min: 100, max: 1000, rnd: 0.5, output: 550 },
  ])("returns $output for round($rnd * ($max - $min) + $min)", ({ min, max, rnd, output }) => {
    expect(getRandomInt(min, max, rnd)).toEqual(output);
  });

  it("stays within the requested bounds", () => {
    for (let i = 0; i < 200; i += 1) {
      const n = getRandomInt(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
    }
  });
});

describe("getRandomSimpleFloat", () => {
  it.each([
    { input: 1, output: 0.1 },
    { input: 2, output: 0.01 },
    { input: 3, output: 0.001 },
  ])("returns $output for 1 / 10^$input", ({ input, output }) => {
    expect(getRandomSimpleFloat(input)).toEqual(output);
  });

  it("returns a value of 0.1 or smaller", () => {
    expect(getRandomSimpleFloat()).toBeLessThanOrEqual(0.1);
  });
});

describe("getRandomFloat", () => {
  it.each([
    { n1: 1, n2: 10, power: 1, output: 2 },
    { n1: 1, n2: 10, power: 2, output: 1.1 },
    { n1: 10, n2: 10, power: 1, output: 11 },
    { n1: 10, n2: 123, power: 1, output: 22.3 },
    { n1: 123, n2: 12, power: 2, output: 123.12 },
    { n1: 444, n2: 555, power: 3, output: 444.555 },
    { n1: 999, n2: 999, power: 1, output: 1098.9 },
    { n1: 999, n2: 999, power: 3, output: 999.999 },
  ])("returns $output for $n1 + $n2 / 10^$power", ({ n1, n2, power, output }) => {
    expect(getRandomFloat(n1, n2, power)).toBeCloseTo(output, 9);
  });

  it("returns a value within the default range", () => {
    for (let i = 0; i < 50; i += 1) {
      const n = getRandomFloat();
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThan(1100);
    }
  });
});

describe("getOperation", () => {
  it.each([
    { difficulty: "ADD_INT_1_NUMBER", op: "+" },
    { difficulty: "SUBTRACT_INT_2_NUMBER", op: "-" },
    { difficulty: "SUBTRACT_NEGATIVE_INT_1_NUMBER", op: "-" },
    { difficulty: "MULTIPLY_INT_2_NUMBER", op: "×" },
    { difficulty: "MULTIPLY_SIMPLE_FLOAT_NUMBER", op: "×" },
    { difficulty: "DIVIDE_INT_2_NUMBER", op: "÷" },
    { difficulty: "DIVIDE_SIMPLE_FLOAT_NUMBER", op: "÷" },
  ] as const)("maps $difficulty to $op", ({ difficulty, op }) => {
    expect(getOperation(difficulty)).toBe(op);
  });
});

describe("checkResult (decimal tolerance preserved)", () => {
  it.each([
    { difficulty: "ADD_INT_1_NUMBER", x: 1, y: 1, result: "2", expected: true },
    { difficulty: "ADD_INT_1_NUMBER", x: 1, y: 1, result: "1", expected: false },
    { difficulty: "ADD_INT_10_NUMBER", x: 14, y: 10, result: "24", expected: true },
    { difficulty: "ADD_INT_10_NUMBER", x: 14, y: 10, result: "25", expected: false },
    { difficulty: "MULTIPLY_INT_1_NUMBER", x: 2, y: 2, result: "4", expected: true },
    { difficulty: "MULTIPLY_INT_1_NUMBER", x: 2, y: 2, result: "5", expected: false },
    { difficulty: "MULTIPLY_INT_1_NUMBER", x: 2, y: 10, result: "20", expected: true },
    { difficulty: "MULTIPLY_SIMPLE_FLOAT_NUMBER", x: 3, y: 0.1, result: "0.3", expected: true },
    { difficulty: "MULTIPLY_SIMPLE_FLOAT_NUMBER", x: 3, y: 0.1, result: "0,3", expected: true },
    { difficulty: "MULTIPLY_SIMPLE_FLOAT_NUMBER", x: 3, y: 0.01, result: "0.03", expected: true },
    { difficulty: "MULTIPLY_SIMPLE_FLOAT_NUMBER", x: 3, y: 0.001, result: "0.003", expected: true },
    { difficulty: "DIVIDE_INT_2_NUMBER", x: 30, y: 5, result: "6", expected: true },
    { difficulty: "DIVIDE_INT_2_NUMBER", x: 30, y: 5, result: "1", expected: false },
    { difficulty: "SUBTRACT_INT_1_NUMBER", x: 10, y: 6, result: "4", expected: true },
    { difficulty: "SUBTRACT_INT_FROM_TEN_NUMBER", x: 10, y: 5, result: "5", expected: true },
    { difficulty: "SUBTRACT_INT_2_NUMBER", x: 20, y: 5, result: "15", expected: true },
    { difficulty: "SUBTRACT_INT_3_NUMBER", x: 200, y: 100, result: "100", expected: true },
    { difficulty: "SUBTRACT_NEGATIVE_INT_1_NUMBER", x: 5, y: 6, result: "-1", expected: true },
    { difficulty: "SUBTRACT_NEGATIVE_INT_1_NUMBER", x: 5, y: 6, result: "0", expected: false },
  ] as const)("$x $difficulty $y === $result -> $expected", ({ difficulty, x, y, result, expected }) => {
    expect(checkResult({ difficulty, x, y, result })).toBe(expected);
  });

  it("rejects empty / non-numeric answers", () => {
    expect(checkResult({ difficulty: "ADD_INT_1_NUMBER", x: 1, y: 1, result: "" })).toBe(false);
    expect(checkResult({ difficulty: "ADD_INT_1_NUMBER", x: 1, y: 1, result: "abc" })).toBe(false);
  });
});

describe("generateNumbers ranges", () => {
  it("keeps simple addition operands small", () => {
    for (let i = 0; i < 100; i += 1) {
      const [x, y] = generateNumbers("ADD_INT_SIMPLE_NUMBER");
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(5);
      expect(y).toBeGreaterThanOrEqual(1);
      expect(y).toBeLessThanOrEqual(5);
    }
  });

  it("produces evenly divisible operands for DIVIDE_INT_2_NUMBER", () => {
    for (let i = 0; i < 100; i += 1) {
      const [x, y] = generateNumbers("DIVIDE_INT_2_NUMBER");
      expect(Number.isInteger(x / y)).toBe(true);
    }
  });

  it("uses a power of ten as the second operand for tens multiplication", () => {
    for (let i = 0; i < 100; i += 1) {
      const [, y] = generateNumbers("MULTIPLY_INT_TENS_NUMBER");
      expect([10, 100, 1000, 10000]).toContain(y);
    }
  });
});

describe("scoring", () => {
  it("matches the preserved point table", () => {
    expect(getPoints("ADD_INT_1_NUMBER")).toBe(1);
    expect(getPoints("MULTIPLY_INT_2_NUMBER")).toBe(6);
    expect(getPoints("DIVIDE_INT_2_NUMBER")).toBe(5);
  });

  it("falls back to 1 point for unmapped difficulties", () => {
    expect(getPoints("ADD_INT_SIMPLE_NUMBER")).toBe(1);
  });

  it("gives every difficulty a positive point value", () => {
    for (const difficulty of DIFFICULTIES) {
      expect(getPoints(difficulty)).toBeGreaterThan(0);
    }
  });
});

describe("difficulty selection + the at-least-one invariant", () => {
  it("only picks enabled difficulties", () => {
    const map = { ...emptyDifficultyMap(), ADD_INT_1_NUMBER: true, MULTIPLY_INT_1_NUMBER: true };
    for (let i = 0; i < 100; i += 1) {
      const picked = pickRandomDifficulty(map);
      expect(picked === "ADD_INT_1_NUMBER" || picked === "MULTIPLY_INT_1_NUMBER").toBe(true);
    }
  });

  it("returns null when nothing is enabled", () => {
    expect(pickRandomDifficulty(emptyDifficultyMap())).toBeNull();
  });

  it("default preset enables exactly classic multiplication", () => {
    const defaults = getDefaultDifficulties();
    expect(checkAtLeastOneValue(defaults)).toBe(true);
    expect(enabledDifficulties(defaults)).toEqual(["MULTIPLY_INT_1_NUMBER"]);
  });

  it("never lets the last enabled group be turned off", () => {
    let map: DifficultyMap = setGroup(emptyDifficultyMap(), "addition", true);
    expect(isGroupEnabled(map, "addition")).toBe(true);
    // Turning the only enabled group off is rejected (state unchanged).
    map = setGroup(map, "addition", false);
    expect(checkAtLeastOneValue(map)).toBe(true);
    expect(isGroupEnabled(map, "addition")).toBe(true);
  });

  it("toggles whole groups on", () => {
    const map = setGroup(emptyDifficultyMap(), "division", true);
    expect(map.DIVIDE_INT_2_NUMBER).toBe(true);
    expect(map.DIVIDE_INT_TENS_NUMBER).toBe(true);
    expect(isGroupEnabled(map, "division")).toBe(true);
  });
});

describe("question building", () => {
  it("builds a consistent question (computed answer matches the operator)", () => {
    for (const difficulty of DIFFICULTIES) {
      const q = buildQuestion(difficulty);
      expect(q.operator).toBe(getOperation(difficulty));
      expect(checkResult({ difficulty, x: q.x, y: q.y, result: String(q.answer) })).toBe(true);
      expect(q.points).toBe(getPoints(difficulty));
    }
  });

  it("returns null from nextQuestion when nothing is enabled", () => {
    expect(nextQuestion(emptyDifficultyMap())).toBeNull();
  });
});

describe("recommendNextDifficulty", () => {
  test("encourages a harder set when fast and accurate", () => {
    expect(recommendNextDifficulty({ correct: 19, wrong: 1, averageTime: 2.4 })).toMatch(/harder|more/i);
  });
  test("suggests easing off when struggling", () => {
    expect(recommendNextDifficulty({ correct: 2, wrong: 8, averageTime: 9 })).toMatch(/simpler|fewer|confidence/i);
  });
  test("handles an empty session", () => {
    expect(recommendNextDifficulty({ correct: 0, wrong: 0, averageTime: null })).toMatch(/go/i);
  });
});
