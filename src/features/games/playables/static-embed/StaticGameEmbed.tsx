"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Maximize2, Minimize2, RefreshCcw, ShieldCheck } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameDefinition } from "../../domain/game";

export function StaticGameEmbed({
  game,
  src,
  minHeight = 720,
  focusHint = "Click inside the game first, then use its keyboard or touch controls.",
  className,
}: {
  game: GameDefinition;
  src: string;
  minHeight?: number;
  focusHint?: string;
  className?: string;
}) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    };

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const target = shellRef.current;
    if (!target) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (target.requestFullscreen) {
        await target.requestFullscreen();
      }
    } catch {
      // Browser may deny fullscreen until the next direct user gesture.
    }
  }, []);

  return (
    <section
      ref={shellRef}
      className={cn(
        "static-game-embed overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="static-game-toolbar flex flex-col gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Darma playable
          </p>
          <h2 className="truncate text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
            {game.title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft">Local assets</Badge>
          <Badge variant="outline">Browser game</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReloadKey((key) => key + 1)}
            leftIcon={<RefreshCcw className="h-3.5 w-3.5" aria-hidden />}
          >
            Restart
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            leftIcon={
              isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              )
            }
          >
            {isFullscreen ? "Exit full screen" : "Full screen"}
          </Button>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-8 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-transparent px-3 text-xs font-semibold leading-none text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-control-hover)] focus:outline-none focus-visible:shadow-[var(--focus-ring)]"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Open
          </a>
        </div>
      </div>

      <div className="static-game-frame relative bg-black" style={{ minHeight }}>
        <iframe
          key={reloadKey}
          src={src}
          title={`${game.title} playable`}
          className="absolute inset-0 h-full w-full border-0"
          allow="fullscreen; autoplay"
          allowFullScreen
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="static-game-footer grid gap-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] sm:grid-cols-3 sm:px-5">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          Runs locally in browser
        </span>
        <span className="sm:col-span-2">{focusHint}</span>
      </div>
    </section>
  );
}
