import type { Metadata } from "next";
import { absoluteUrl } from "@/features/tools/seo";
import { CATEGORY_LABELS, type GameDefinition } from "../domain/game";

export const GAMES_TITLE = "Browser Games | puzzle, arcade, and quick focus breaks | Darma";
export const GAMES_DESCRIPTION =
  "Open free browser games for puzzles, arcade play, strategy, and short focus breaks. No signup or download, progress stays on your device, and every game sits beside the wider Darma workspace.";

export function buildGamesDirectoryMetadata(): Metadata {
  const url = absoluteUrl("/games");
  return {
    title: GAMES_TITLE,
    description: GAMES_DESCRIPTION,
    alternates: { canonical: "/games" },
    openGraph: {
      title: GAMES_TITLE,
      description: GAMES_DESCRIPTION,
      url,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: GAMES_TITLE,
      description: GAMES_DESCRIPTION,
    },
  };
}

export function buildGameMetadata(game: GameDefinition): Metadata {
  const url = absoluteUrl(game.href);
  const keywords = Array.from(
    new Set([
      ...game.tags,
      ...game.categories.map((category) => CATEGORY_LABELS[category]),
      game.title,
      "browser game",
      "free online game",
    ]),
  );

  return {
    title: game.seoTitle,
    description: game.seoDescription,
    keywords,
    alternates: { canonical: game.href },
    openGraph: {
      title: game.seoTitle,
      description: game.seoDescription,
      url,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: game.seoTitle,
      description: game.seoDescription,
    },
  };
}
