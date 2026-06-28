import { Gamepad2 } from "lucide-react";
import { Badge } from "@/components/ui";
import type { GameDefinition } from "../domain/game";
import { GameThumbnail } from "./GameThumbnail";

/**
 * Polished placeholder player area. When a real playable component exists it can
 * be passed as `children` and rendered in place of the preview tile.
 */
export function GamePlayerShell({
  game,
  children,
}: {
  game: GameDefinition;
  children?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]">
      {children ? (
        children
      ) : (
        <div className="relative">
          <GameThumbnail game={game} aspect="4/3" size="lg" className="opacity-90" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/35 p-6 text-center backdrop-blur-[1px]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-full)] border border-white/40 bg-white/15 text-white">
              <Gamepad2 className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-black tracking-[-0.02em] text-white">Game preview</p>
              <p className="mt-1 text-sm text-white/85">Playable version coming soon</p>
            </div>
            <Badge variant="soft">No signup • Browser-only</Badge>
          </div>
        </div>
      )}
    </div>
  );
}
