import Image from "next/image";
import type { GameAccent, GameDefinition } from "../domain/game";
import { cn } from "@/lib/cn";

const accentClass: Record<GameAccent, string> = {
  violet: "gthumb-violet",
  blue: "gthumb-blue",
  emerald: "gthumb-emerald",
  amber: "gthumb-amber",
  rose: "gthumb-rose",
  cyan: "gthumb-cyan",
  indigo: "gthumb-indigo",
  orange: "gthumb-orange",
  fuchsia: "gthumb-fuchsia",
  sky: "gthumb-sky",
  lime: "gthumb-lime",
  teal: "gthumb-teal",
};

type GameThumbnailProps = {
  game: GameDefinition;
  /** Aspect ratio of the tile. Cards use 16:9; the player shell uses a taller box. */
  aspect?: "16/9" | "4/3";
  size?: "md" | "lg";
  className?: string;
  priority?: boolean;
};

/**
 * Renders a game's thumbnail in one of three modes. Falls back to a generated
 * gradient tile so the card never breaks when an image is missing.
 */
export function GameThumbnail({ game, aspect = "16/9", size = "md", className, priority }: GameThumbnailProps) {
  const aspectClass = aspect === "4/3" ? "aspect-[4/3]" : "aspect-[16/9]";
  const motifSize = size === "lg" ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl";

  if (game.thumbnailType === "image" && game.thumbnail) {
    return (
      <div className={cn("relative w-full overflow-hidden", aspectClass, className)}>
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

  const accent = accentClass[game.accent ?? "violet"];

  return (
    <div
      aria-hidden
      className={cn(
        "gthumb relative flex w-full items-center justify-center overflow-hidden",
        accent,
        aspectClass,
        className,
      )}
    >
      <div className="gthumb-texture pointer-events-none absolute inset-0 opacity-70" />
      <div className="game-thumbnail-shine pointer-events-none absolute inset-0" />
      <span className={cn("relative select-none drop-shadow-sm transition duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100", motifSize)}>{game.thumbnail}</span>
    </div>
  );
}
