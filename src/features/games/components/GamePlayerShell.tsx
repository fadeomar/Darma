import { CheckCircle2, Expand, Gamepad2, Play, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui";
import type { GameDefinition } from "../domain/game";
import { GameThumbnail } from "./GameThumbnail";
import { ReactionTimerPro } from "../playables/reaction-timer";
import { TetrisGame } from "../playables/tetris";

/**
 * Polished player area. Real game components can be lazy-loaded later and passed
 * as `children`; until then this shell still feels intentional and useful.
 */
export function GamePlayerShell({
  game,
  children,
}: {
  game: GameDefinition;
  children?: React.ReactNode;
}) {
  if (game.slug === "reaction-timer") {
    return <ReactionTimerPro game={game} />;
  }

  if (game.slug === "tetris") {
    return <TetrisGame game={game} />;
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Browser player
          </p>
          <h2 className="truncate text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
            {game.title}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft">No signup</Badge>
          <Badge variant="outline">Browser-only</Badge>
        </div>
      </div>

      {children ? (
        children
      ) : (
        <div className="relative">
          <GameThumbnail game={game} aspect="4/3" size="lg" className="min-h-[320px] opacity-95 sm:min-h-[420px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/35 to-black/65" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-[var(--radius-full)] border border-white/35 bg-white/20 text-white shadow-2xl backdrop-blur-md">
              <Gamepad2 className="h-8 w-8" aria-hidden />
            </span>
            <div className="mt-4 max-w-md">
              <p className="text-2xl font-black tracking-[-0.03em] text-white">Ready for the playable build</p>
              <p className="mt-2 text-sm leading-6 text-white/85">
                This dedicated player shell is prepared for a lazy-loaded game component. The catalog stays fast while the playable version can be mounted here later.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                <Play className="h-3.5 w-3.5" aria-hidden />
                Play area
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Privacy-first
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                <Expand className="h-3.5 w-3.5" aria-hidden />
                Responsive shell
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] sm:grid-cols-3 sm:px-5">
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          No account required
        </span>
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          Lightweight by default
        </span>
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          Playable shell ready
        </span>
      </div>
    </div>
  );
}
