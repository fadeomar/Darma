import Image from "next/image";
import type { GameDefinition } from "../domain/game";
import { cn } from "@/lib/cn";
import { getGameScene } from "./scenes/registry";

type GameThumbnailProps = {
  game: GameDefinition;
  /** Aspect ratio of the tile. Cards use 16:9; the player shell uses a taller box. */
  aspect?: "16/9" | "4/3";
  size?: "md" | "lg";
  className?: string;
  priority?: boolean;
};

/**
 * The single game thumbnail surface: catalog, featured rails, landing rail, and
 * related-game strips all render this, so there is one thumbnail system.
 *
 * Every game gets a local scene showing a real moment of play. Gridland keeps
 * its own pixel badge, which is stronger than a rebuilt scene would be. The
 * emoji-on-gradient tile is gone; a game without a scene falls back to its
 * accent tile rather than to a symbol.
 */
export function GameThumbnail({
  game,
  aspect = "16/9",
  size = "md",
  className,
  priority,
}: GameThumbnailProps) {
  const aspectClass = aspect === "4/3" ? "aspect-[4/3]" : "aspect-[16/9]";
  const Scene = getGameScene(game.slug);

  if (game.slug === "gridland") {
    return (
      <div
        className={cn(
          "gridland-thumbnail relative w-full overflow-hidden bg-[#eee9dc]",
          aspectClass,
          className,
        )}
      >
        <div className="gridland-thumbnail-grid pointer-events-none absolute inset-0" aria-hidden />
        <Image
          src={game.thumbnail}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-[12%] transition duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          style={{ imageRendering: "pixelated" }}
          priority={priority}
        />
      </div>
    );
  }

  if (Scene) {
    return (
      <div
        aria-hidden
        className={cn(
          "gscene relative w-full overflow-hidden",
          aspectClass,
          size === "lg" && "gscene-lg",
          className,
        )}
      >
        <Scene />
      </div>
    );
  }

  if (game.thumbnailType === "image" && game.thumbnail) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden",
          aspectClass,
          className,
        )}
      >
        <Image
          src={game.thumbnail}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          priority={priority}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={cn("gscene gscene-fallback relative w-full overflow-hidden", aspectClass, className)}
    >
      <span className="gscene-fallback-grid" />
      <span className="gscene-fallback-orb" />
    </div>
  );
}
