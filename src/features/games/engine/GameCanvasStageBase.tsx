"use client";

import { useEffect, useRef, type CanvasHTMLAttributes, type MutableRefObject } from "react";
import { cn } from "@/lib/cn";

export type GameCanvasDrawContext = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  now: number;
};

type GameCanvasStageBaseProps = Omit<CanvasHTMLAttributes<HTMLCanvasElement>, "children"> & {
  reducedMotion?: boolean;
  draw: (context: GameCanvasDrawContext) => void;
  onReady?: (canvas: HTMLCanvasElement) => void;
};

function resizeCanvas(canvas: HTMLCanvasElement): { width: number; height: number; dpr: number } {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const nextWidth = Math.floor(width * dpr);
  const nextHeight = Math.floor(height * dpr);
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }
  return { width, height, dpr };
}

/**
 * Minimal reusable canvas stage.
 *
 * Future games can start here instead of rewriting devicePixelRatio resize and
 * RAF cleanup. Important text should still live in HTML overlays.
 */
export function GameCanvasStageBase({ reducedMotion, draw, onReady, className, ...props }: GameCanvasStageBaseProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef: MutableRefObject<GameCanvasStageBaseProps["draw"]> = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    onReady?.(canvas);

    let raf = 0;
    let alive = true;

    const frame = (now: number) => {
      if (!alive) return;
      const { width, height, dpr } = resizeCanvas(canvas);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRef.current({ canvas, ctx, width, height, dpr, now });
      if (!reducedMotion) raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);
    return () => {
      alive = false;
      window.cancelAnimationFrame(raf);
    };
  }, [onReady, reducedMotion]);

  return <canvas ref={canvasRef} className={cn("darma-game-canvas", className)} aria-hidden="true" {...props} />;
}
