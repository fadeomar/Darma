import { describe, expect, it } from "vitest";
import { boardFillPercent, createInitialSnakeState, isOpposite, placeFood, queueDirection, samePoint, stepSnake } from "./snakeEngine";

describe("snakeEngine", () => {
  it("creates a playable initial state", () => {
    const state = createInitialSnakeState({ size: 16, seed: 1 });
    expect(state.snake).toHaveLength(3);
    expect(state.food).toBeDefined();
    expect(state.status).toBe("ready");
  });

  it("does not place food on occupied cells", () => {
    const food = placeFood(4, [{ x: 0, y: 0 }, { x: 1, y: 0 }], 1);
    expect(samePoint(food, { x: 0, y: 0 })).toBe(false);
    expect(samePoint(food, { x: 1, y: 0 })).toBe(false);
  });

  it("blocks direct reverse turns", () => {
    const state = createInitialSnakeState({ seed: 1 });
    expect(isOpposite("right", "left")).toBe(true);
    expect(queueDirection(state, "left").queuedDirection).toBe("right");
    expect(queueDirection(state, "down").queuedDirection).toBe("down");
  });

  it("moves the snake one cell while running", () => {
    const state = { ...createInitialSnakeState({ seed: 1 }), status: "running" as const };
    const next = stepSnake(state);
    expect(next.snake[0].x).toBe(state.snake[0].x + 1);
  });

  it("grows and scores when eating food", () => {
    const state = createInitialSnakeState({ seed: 1 });
    const running = { ...state, status: "running" as const, food: { x: state.snake[0].x + 1, y: state.snake[0].y } };
    const next = stepSnake(running);
    expect(next.snake).toHaveLength(state.snake.length + 1);
    expect(next.score).toBeGreaterThan(0);
    expect(next.apples).toBe(1);
  });

  it("reports board fill percentage", () => {
    const state = createInitialSnakeState({ size: 10, seed: 1 });
    expect(boardFillPercent(state)).toBe(3);
  });
});
