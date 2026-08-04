import { Badge } from "@/components/ui";
import { DarmaSymbol, type DarmaSymbolName } from "@/components/visuals";
import { Sparkles } from "lucide-react";

const HERO_BADGES = ["Games", "Free", "No signup", "Browser-only"];

const FLOAT_TILES: Array<{ symbol: DarmaSymbolName; label: string; accent: string; className: string }> = [
  { symbol: "speed", label: "Speed", accent: "gthumb-amber", className: "left-2 top-4 rotate-[-8deg]" },
  { symbol: "route", label: "Arcade", accent: "gthumb-emerald", className: "right-6 top-2 rotate-[6deg]" },
  { symbol: "puzzle", label: "Puzzle", accent: "gthumb-blue", className: "left-10 bottom-6 rotate-[5deg]" },
  { symbol: "color", label: "Creative", accent: "gthumb-fuchsia", className: "right-2 bottom-2 rotate-[-6deg]" },
  { symbol: "strategy", label: "Strategy", accent: "gthumb-teal", className: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[3deg]" },
];

export function GameHero() {
  return (
    <div className="game-hero-grid relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center">
      <div className="relative min-w-0">
        <div className="game-soft-orb game-soft-orb-a" aria-hidden />
        <div className="flex flex-wrap items-center gap-2">
          {HERO_BADGES.map((badge, index) => (
            <Badge key={badge} variant={index === 0 ? "soft" : index === 1 ? "accent" : "outline"}>
              {badge}
            </Badge>
          ))}
        </div>
        <h1 className="relative mt-4 max-w-3xl text-4xl font-black leading-[var(--leading-tight)] tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-5xl">
          Play quick free games without signup
        </h1>
        <p className="relative mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
          Discover lightweight browser games for quick breaks, puzzles, classics, and casual fun. Every experience stays inside Darma.
        </p>
      </div>

      <div
        aria-hidden
        className="game-hero-visual game-identity-stage relative hidden h-60 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/60 lg:block"
      >
        <div className="game-hero-glow" />
        <div className="game-pixel-sparkles" aria-hidden />
        <div className="game-hero-vector-orbit"><span /><span /><span /></div>
        <Sparkles className="absolute right-5 top-5 h-5 w-5 text-[var(--color-primary-text-strong)] opacity-70" />
        {FLOAT_TILES.map((tile) => (
          <div
            key={tile.label}
            className={`gthumb game-float-tile game-float-symbol ${tile.accent} absolute flex h-[72px] w-[72px] items-center justify-center rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] ${tile.className}`}
          >
            <DarmaSymbol name={tile.symbol} className="h-8 w-8" />
            <span>{tile.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
