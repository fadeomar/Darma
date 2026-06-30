"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Mini Floppy Bird scene used as the catalog card preview. It crops the real
 * sprite atlas (`/games/floppy-bird/atlas.png`) — sky, ground, a green pipe, and
 * the yellow bird — so the card shows the actual game art, not a placeholder.
 */

const ATLAS_SRC = "/games/floppy-bird/atlas.png";

type Rect = { x: number; y: number; w: number; h: number };

const SKY: Rect = { x: 0, y: 0, w: 288, h: 400 };
const PLATFORM: Rect = { x: 584, y: 0, w: 336, h: 112 };
const PIPE_TOP: Rect = { x: 112, y: 646, w: 52, h: 320 };
const PIPE_BOTTOM: Rect = { x: 168, y: 646, w: 52, h: 320 };
const BIRD_MID: Rect = { x: 62, y: 982, w: 34, h: 24 };

const W = 288;
const H = 162;

function drawRect(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement, r: Rect, dx: number, dy: number, dw: number, dh: number) {
  ctx.drawImage(atlas, r.x, r.y, r.w, r.h, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
}

export function FloppyBirdCardPreview({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (!canvas || !ctx) return;

    let cancelled = false;
    const atlas = new Image();
    atlas.src = ATLAS_SRC;

    const draw = () => {
      if (cancelled) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, W, H);

      // Sky + city silhouette from the real background sprite.
      drawRect(ctx, atlas, SKY, 0, 0, W, H);

      // Ground strip along the bottom.
      const groundH = 26;
      const groundY = H - groundH;
      for (let x = 0; x < W + PLATFORM.w; x += PLATFORM.w) {
        drawRect(ctx, atlas, PLATFORM, x, groundY, PLATFORM.w, groundH);
      }

      // A green pipe pair with a gap on the right side.
      const pipeW = 46;
      const pipeX = 178;
      const gapTop = 46;
      const gapH = 56;
      const gapBottom = gapTop + gapH;
      drawRect(ctx, atlas, PIPE_TOP, pipeX, gapTop - 120, pipeW, 120);
      drawRect(ctx, atlas, PIPE_BOTTOM, pipeX, gapBottom, pipeW, groundY - gapBottom);

      // The real yellow bird sprite, slightly enlarged for the preview.
      const birdW = 50;
      const birdH = 35;
      drawRect(ctx, atlas, BIRD_MID, 70, 60, birdW, birdH);
    };

    if (atlas.complete && atlas.naturalWidth > 0) draw();
    else atlas.onload = draw;

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className={cn("dfb-card-preview", className)}
      aria-hidden
    />
  );
}
