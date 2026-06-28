import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildGameMetadata,
  GameDetail,
  getGameBySlug,
  getGames,
  getGameSlugs,
} from "@/features/games";
import "@/features/games/styles/games-theme.css";

type GamePageParams = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getGameSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: GamePageParams): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return {};
  return buildGameMetadata(game);
}

export default async function GamePage({ params }: GamePageParams) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game || (game.visibility ?? "public") !== "public") notFound();

  return <GameDetail game={game} allGames={getGames()} />;
}
