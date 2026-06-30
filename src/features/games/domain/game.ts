export type GameId = string;
export type GameSlug = string;

export type GameVisibility = "public" | "unlisted" | "private";

export type GameCategory =
  | "puzzle"
  | "arcade"
  | "classic"
  | "casual"
  | "brain"
  | "quick-break"
  | "mobile-friendly"
  | "2-players";

export type GameDifficulty = "easy" | "medium" | "hard";

export type GamePlayTime = "1 min" | "5 min" | "10 min" | "15 min";

export type GameInput = "keyboard" | "mouse" | "touch";

export type GameDevice = "desktop" | "tablet" | "mobile";

export type GameThumbnailType = "svg" | "image" | "gradient";

/**
 * Visual accent used to colour generated gradient/SVG thumbnails. Each value maps
 * to a `.gthumb-*` class defined in `styles/games-theme.css` (light + dark).
 */
export type GameAccent =
  | "violet"
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "cyan"
  | "indigo"
  | "orange"
  | "fuchsia"
  | "sky"
  | "lime"
  | "teal";

export type GameDefinition = {
  id: GameId;
  slug: GameSlug;
  title: string;
  description: string;
  longDescription: string;
  href: string;
  categories: GameCategory[];
  tags: string[];
  /**
   * For `thumbnailType: "image"` this is the asset `src`. For `"gradient"` and
   * `"svg"` it is the motif (emoji or short glyph) rendered inside the tile.
   */
  thumbnail: string;
  thumbnailType: GameThumbnailType;
  /** Accent colour for generated gradient/SVG thumbnails. */
  accent?: GameAccent;
  featured?: boolean;
  popular?: boolean;
  isNew?: boolean;
  difficulty: GameDifficulty;
  playTime: GamePlayTime;
  input: GameInput[];
  devices: GameDevice[];
  controls: string;
  privacyNote: string;
  seoTitle: string;
  seoDescription: string;
  visibility?: GameVisibility;
  /** Lower numbers surface first within "featured first" sorting. */
  pinned?: number;
  createdAt?: string;
};

export const PLAY_TIME_MINUTES: Record<GamePlayTime, number> = {
  "1 min": 1,
  "5 min": 5,
  "10 min": 10,
  "15 min": 15,
};

export const DIFFICULTY_ORDER: Record<GameDifficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  puzzle: "Puzzle",
  arcade: "Arcade",
  classic: "Classic",
  casual: "Casual",
  brain: "Brain",
  "quick-break": "Quick Break",
  "mobile-friendly": "Mobile Friendly",
  "2-players": "2 Players",
};

export const DIFFICULTY_LABELS: Record<GameDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const INPUT_LABELS: Record<GameInput, string> = {
  keyboard: "Keyboard",
  mouse: "Mouse",
  touch: "Touch",
};

export const DEVICE_LABELS: Record<GameDevice, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};
