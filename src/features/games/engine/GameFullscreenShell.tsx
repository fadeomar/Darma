"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Generic visual shell for playable games.
 *
 * It does not request fullscreen by itself; that remains the game owner's job so
 * every game can decide how to handle browser failures, focus, and interrupts.
 */
export function GameFullscreenShell({
  isFullscreen,
  activeGameplay,
  className,
  topControls,
  children,
}: {
  isFullscreen?: boolean;
  activeGameplay?: boolean;
  className?: string;
  topControls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className={cn("darma-game-shell", isFullscreen && "darma-game-shell--fullscreen", activeGameplay && "darma-game-shell--active", className)}
      data-darma-game-shell="true"
      data-darma-game-fullscreen={isFullscreen ? "true" : undefined}
      data-darma-game-active={activeGameplay ? "true" : undefined}
    >
      {topControls ? (
        <div
          className="darma-game-shell__top"
          data-darma-game-control="true"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {topControls}
        </div>
      ) : null}
      {children}
    </section>
  );
}
