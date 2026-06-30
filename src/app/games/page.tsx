import type { Metadata } from "next";
import { buildGamesDirectoryMetadata, GamesDirectory, getGames } from "@/features/games";
import "@/features/games/styles/games-theme.css";
import "@/features/collections/styles/collections-theme.css";

export const metadata: Metadata = buildGamesDirectoryMetadata();

export default function GamesPage() {
  const games = getGames();
  return <GamesDirectory games={games} />;
}
