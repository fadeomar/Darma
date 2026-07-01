"use client";

import { useEffect, useRef } from "react";
import { snakeStepIntervalMs } from "./snakeEngine";
import type { SnakePoint, SnakeState } from "./snakeTypes";
import {
  drawArenaBackground,
  drawFood,
  drawObstacle,
  drawParticles,
  drawSnakeBody,
  drawSnakeHead,
  foodEmojiFor,
  interpolateHead,
  spawnBurst,
  updateParticles,
  SNAKE_GOLDEN_EMOJI,
  type SnakeParticle,
} from "./snakeRenderer";

type SpawnMarker = { key: string; start: number };

const TONGUE_CYCLE_S = 2.4;
const TONGUE_OUT_S = 0.3;
const BLINK_CYCLE_S = 3.6;
const BLINK_S = 0.15;
const SHAKE_DURATION_MS = 380;
const SHAKE_MAGNITUDE_PX = 6;
const SPAWN_POP_MS = 260;

export function SnakeBoard({
  state,
  showGrid,
}: {
  state: SnakeState;
  showGrid: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  const showGridRef = useRef(showGrid);
  const prevSnakeRef = useRef<SnakePoint[]>(state.snake);
  const tickStartRef = useRef(0);
  const foodSpawnRef = useRef<SpawnMarker>({
    key: `${state.food.x}:${state.food.y}`,
    start: 0,
  });
  const goldenSpawnRef = useRef<SpawnMarker | null>(null);
  const shakeStartRef = useRef<number | null>(null);
  const particlesRef = useRef<SnakeParticle[]>([]);
  const cellPxRef = useRef(20);
  const mountTimeRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    showGridRef.current = showGrid;
  }, [showGrid]);

  // Diff the incoming state against the previous frame to trigger one-shot visual
  // events (head interpolation start, food pop-in, eat burst, crash shake) without
  // the draw loop itself needing to know about React state transitions.
  useEffect(() => {
    const prev = stateRef.current;
    if (prev.snake !== state.snake) {
      prevSnakeRef.current = prev.snake;
      tickStartRef.current = performance.now();
    }

    const nextFoodKey = `${state.food.x}:${state.food.y}`;
    if (foodSpawnRef.current.key !== nextFoodKey) {
      foodSpawnRef.current = { key: nextFoodKey, start: performance.now() };
    }

    if (
      state.goldenFood &&
      (!prev.goldenFood ||
        prev.goldenFood.x !== state.goldenFood.x ||
        prev.goldenFood.y !== state.goldenFood.y)
    ) {
      goldenSpawnRef.current = {
        key: `${state.goldenFood.x}:${state.goldenFood.y}`,
        start: performance.now(),
      };
    }

    if (state.event === "eat" || state.event === "golden") {
      const point = state.event === "golden" ? prev.goldenFood : prev.food;
      if (point) {
        spawnBurst(
          particlesRef.current,
          (point.x + 0.5) * cellPxRef.current,
          (point.y + 0.5) * cellPxRef.current,
          state.event === "golden" ? "#f59e0b" : "#ef4444",
        );
      }
    }

    if (state.status === "game-over" && prev.status !== "game-over") {
      shakeStartRef.current = performance.now();
    }

    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const frame = (time: number) => {
      if (mountTimeRef.current === null) mountTimeRef.current = time;
      const elapsed = (time - mountTimeRef.current) / 1000;
      const dt =
        lastFrameTimeRef.current === null
          ? 1 / 60
          : Math.min(0.05, (time - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = time;

      const current = stateRef.current;
      const size = current.settings.size;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssSize = Math.max(
        40,
        Math.round(canvas.clientWidth || canvas.parentElement?.clientWidth || 320),
      );
      const targetPx = Math.round(cssSize * dpr);
      if (canvas.width !== targetPx || canvas.height !== targetPx) {
        canvas.width = targetPx;
        canvas.height = targetPx;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cell = cssSize / size;
      cellPxRef.current = cell;

      let shakeX = 0;
      let shakeY = 0;
      if (shakeStartRef.current !== null) {
        const t = (time - shakeStartRef.current) / SHAKE_DURATION_MS;
        if (t < 1) {
          const magnitude = SHAKE_MAGNITUDE_PX * (1 - t);
          shakeX = Math.sin(time * 0.09) * magnitude;
          shakeY = Math.cos(time * 0.11) * magnitude;
        } else {
          shakeStartRef.current = null;
        }
      }

      ctx.clearRect(0, 0, cssSize, cssSize);
      ctx.save();
      ctx.translate(shakeX, shakeY);

      drawArenaBackground(ctx, cssSize, size, showGridRef.current);

      for (const obstacle of current.obstacles) {
        drawObstacle(ctx, (obstacle.x + 0.5) * cell, (obstacle.y + 0.5) * cell, cell);
      }

      const foodPulse = elapsed * 2.4;
      const foodProgress = Math.min(
        1,
        (time - foodSpawnRef.current.start) / SPAWN_POP_MS,
      );
      drawFood(
        ctx,
        (current.food.x + 0.5) * cell,
        (current.food.y + 0.5) * cell,
        cell,
        foodEmojiFor(current.food.x * 31 + current.food.y * 17 + current.apples),
        foodProgress,
        foodPulse,
        false,
      );

      if (current.goldenFood) {
        const goldenSpawn = goldenSpawnRef.current;
        const goldenProgress = goldenSpawn
          ? Math.min(1, (time - goldenSpawn.start) / SPAWN_POP_MS)
          : 1;
        drawFood(
          ctx,
          (current.goldenFood.x + 0.5) * cell,
          (current.goldenFood.y + 0.5) * cell,
          cell,
          SNAKE_GOLDEN_EMOJI,
          goldenProgress,
          elapsed * 4,
          true,
        );
      }

      const progress =
        current.status === "running"
          ? Math.min(
              1,
              (time - tickStartRef.current) /
                snakeStepIntervalMs(current.settings.difficulty, current.level),
            )
          : 1;
      const prevSnake = prevSnakeRef.current.length ? prevSnakeRef.current : current.snake;
      const interpolatedHead = interpolateHead(
        prevSnake[0] ?? current.snake[0],
        current.snake[0],
        size,
        current.settings.mode === "wrap",
        progress,
      );
      const bodyPoints = [interpolatedHead, ...current.snake.slice(1)];
      const alive = current.status !== "game-over";
      drawSnakeBody(ctx, bodyPoints, cell, { alive });

      const tongueCycle = elapsed % TONGUE_CYCLE_S;
      const tonguePhase =
        alive && tongueCycle < TONGUE_OUT_S
          ? Math.sin((tongueCycle / TONGUE_OUT_S) * Math.PI)
          : 0;
      const blinkCycle = elapsed % BLINK_CYCLE_S;
      const blink = alive && blinkCycle > BLINK_CYCLE_S - BLINK_S;
      drawSnakeHead(
        ctx,
        { x: (interpolatedHead.x + 0.5) * cell, y: (interpolatedHead.y + 0.5) * cell },
        current.direction,
        cell,
        { alive, tonguePhase, blink },
      );

      updateParticles(particlesRef.current, dt);
      drawParticles(ctx, particlesRef.current);

      ctx.restore();

      rafRef.current = window.requestAnimationFrame(frame);
    };

    rafRef.current = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafRef.current);
  }, []);

  return <canvas ref={canvasRef} className="dsnk-canvas" role="img" aria-label="Snake game board" />;
}
