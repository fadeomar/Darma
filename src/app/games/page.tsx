import type { Metadata } from "next";
import { PortalHero } from "@/components/portals";
import { buildGamesDirectoryMetadata, GamesDirectory, getGames } from "@/features/games";
import type { GameFilter } from "@/features/games/components/GameCategoryChips";
import "@/features/games/styles/games-theme.css";
import "@/features/collections/styles/collections-theme.css";

export const metadata: Metadata = buildGamesDirectoryMetadata();

type PageProps = { searchParams: Promise<{ filter?: string | string[] }> };
const GAME_FILTERS: readonly GameFilter[] = ["all", "featured", "popular", "new", "puzzle", "arcade", "classic", "casual", "brain", "quick-break", "mobile-friendly", "2-players"];

export default async function GamesPage({ searchParams }: PageProps) {
  const games = getGames();
  const params = await searchParams;
  const rawFilter = Array.isArray(params.filter) ? params.filter[0] : params.filter;
  const initialFilter: GameFilter = rawFilter && GAME_FILTERS.includes(rawFilter as GameFilter) ? rawFilter as GameFilter : "all";
  const featuredCount = games.filter((game) => game.featured || game.popular).length;
  const mobileCount = games.filter((game) => game.devices.includes("mobile")).length;
  const quickCount = games.filter((game) => game.playTime === "1 min" || game.categories.includes("quick-break")).length;

  return (
    <>
      <PortalHero
        variant="games"
        eyebrow="The Darma browser arcade"
        badges={["Free games", "Quick to open"]}
        title="Play for a minute, reset your attention, and return without leaving Darma."
        description="Lightweight games for speed, puzzles, strategy, and short breaks — each one opens straight into play."
        actions={[
          { href: "#games-search", label: "Choose a game", icon: "games", tone: "primary" },
          { href: "/games?filter=quick-break#games-search", label: "Find a quick break", icon: "sparkles", tone: "secondary" },
          { href: "/tools/fun", label: "Open tool challenges", icon: "tools", tone: "quiet" },
        ]}
        metrics={[
          { value: games.length, label: "browser games" },
          { value: featuredCount, label: "featured picks" },
          { value: mobileCount, label: "mobile-friendly" },
          { value: quickCount, label: "quick-break games" },
        ]}
        signals={[
          { label: "Access", value: "No signup" },
          { label: "Input", value: "Keyboard, mouse, touch" },
          { label: "Progress", value: "Local when supported" },
          { label: "Mood", value: "Puzzle to arcade" },
        ]}
      />
      <GamesDirectory games={games} showHero={false} initialFilter={initialFilter} />
    </>
  );
}
