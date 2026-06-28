import { createCoreRegistryIndex, type CoreEntity, type CoreRegistry } from "@/core";
import { DEVICE_LABELS, DIFFICULTY_LABELS, INPUT_LABELS, PLAY_TIME_MINUTES, type GameDefinition } from "../domain/game";

export type GameCoreEntity = CoreEntity & {
  kind: "game";
  metadata: NonNullable<CoreEntity["metadata"]> & {
    playTime: GameDefinition["playTime"];
    playTimeMinutes: number;
    difficulty: GameDefinition["difficulty"];
    input: GameDefinition["input"];
    devices: GameDefinition["devices"];
    privacyNote: string;
  };
};

const toTitleCase = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export function toGameCoreEntity(game: GameDefinition): GameCoreEntity {
  const primaryInput = game.input[0];
  const primaryDevice = game.devices[0];

  return {
    id: game.id,
    slug: game.slug,
    kind: "game",
    title: game.title,
    description: game.description,
    href: game.href,
    status: game.visibility === "public" ? "live" : "experimental",
    categories: game.categories,
    tags: game.tags,
    keywords: [
      game.title,
      game.description,
      ...game.categories,
      ...game.tags,
      game.difficulty,
      game.playTime,
      ...game.input,
      ...game.devices,
    ],
    featured: game.featured,
    popular: game.popular,
    isNew: game.isNew,
    createdAt: game.createdAt,
    accent: game.accent,
    thumbnail: game.thumbnail,
    primaryAction: {
      label: "Play now",
      href: game.href,
      variant: "primary",
    },
    metrics: [
      {
        label: "Play time",
        value: game.playTime,
        helper: `${PLAY_TIME_MINUTES[game.playTime]} minutes`,
      },
      {
        label: "Difficulty",
        value: DIFFICULTY_LABELS[game.difficulty],
      },
      primaryInput
        ? {
            label: "Input",
            value: INPUT_LABELS[primaryInput],
          }
        : undefined,
      primaryDevice
        ? {
            label: "Best on",
            value: DEVICE_LABELS[primaryDevice],
          }
        : undefined,
    ].filter(Boolean) as NonNullable<CoreEntity["metrics"]>,
    metadata: {
      playTime: game.playTime,
      playTimeMinutes: PLAY_TIME_MINUTES[game.playTime],
      difficulty: game.difficulty,
      input: game.input,
      devices: game.devices,
      privacyNote: game.privacyNote,
      thumbnailType: game.thumbnailType,
      controls: game.controls,
      longDescription: game.longDescription,
      seoTitle: game.seoTitle,
      seoDescription: game.seoDescription,
    },
  };
}

export function toGameCoreEntities(games: readonly GameDefinition[]): GameCoreEntity[] {
  return games.map(toGameCoreEntity);
}

export function createGameCoreRegistry(games: readonly GameDefinition[]): CoreRegistry<GameCoreEntity> {
  return {
    id: "games",
    title: "Darma Games",
    description: "CoreEntity registry adapter for Darma browser games.",
    items: toGameCoreEntities(games),
  };
}

export function createGameCoreIndex(games: readonly GameDefinition[]) {
  return createCoreRegistryIndex([createGameCoreRegistry(games)]);
}

export function getGameCoreBridgeStats(games: readonly GameDefinition[]) {
  const entities = toGameCoreEntities(games);
  const categories = new Set(entities.flatMap((entity) => entity.categories ?? []));
  const tags = new Set(entities.flatMap((entity) => entity.tags ?? []));
  const inputs = new Set(games.flatMap((game) => game.input));
  const devices = new Set(games.flatMap((game) => game.devices));
  const featured = entities.filter((entity) => entity.featured).length;
  const popular = entities.filter((entity) => entity.popular).length;
  const newest = entities.filter((entity) => entity.isNew).length;

  return {
    entities: entities.length,
    categories: categories.size,
    tags: tags.size,
    inputs: inputs.size,
    devices: devices.size,
    featured,
    popular,
    newest,
    coverage: [
      ["Core entities", entities.length],
      ["Categories", categories.size],
      ["Tags", tags.size],
      ["Input modes", inputs.size],
      ["Device targets", devices.size],
      ["Featured", featured],
      ["Popular", popular],
      ["New", newest],
    ].map(([label, value]) => ({ label: String(label), value: String(value) })),
    topCategories: [...categories].slice(0, 8).map(toTitleCase),
  };
}
