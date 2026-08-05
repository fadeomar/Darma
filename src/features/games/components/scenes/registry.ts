import type { ComponentType } from "react";
import {
  Scene2048,
  SceneChessMini,
  SceneColorBrainRush,
  SceneColorSwitch,
  SceneConnectFour,
  SceneDotConnect,
  SceneEndlessRunner,
  SceneFloppyBird,
  SceneHextris,
  SceneMathSprint,
  SceneMemoryCards,
  SceneMinesweeper,
  SceneNeonCoreDefense,
  ScenePacman,
  SceneReactionTimer,
  SceneSnake,
  SceneSudokuMini,
  SceneTetris,
  SceneTicTacToe,
  SceneTypingSpeed,
  SceneWordMatch,
} from "./gameScenes";

/**
 * Game slug -> scene.
 *
 * Gridland is deliberately absent: it ships its own pixel badge artwork, which
 * is a stronger and more faithful visual than anything rebuilt here, so
 * GameThumbnail keeps rendering it as an image on the shared tile.
 */
export const GAME_SCENES: Record<string, ComponentType> = {
  "2048": Scene2048,
  "chess-mini": SceneChessMini,
  "color-brain-rush": SceneColorBrainRush,
  "color-switch": SceneColorSwitch,
  "connect-four": SceneConnectFour,
  "dot-connect": SceneDotConnect,
  "endless-runner": SceneEndlessRunner,
  "floppy-bird": SceneFloppyBird,
  hextris: SceneHextris,
  "math-sprint": SceneMathSprint,
  "memory-cards": SceneMemoryCards,
  minesweeper: SceneMinesweeper,
  "neon-core-defense": SceneNeonCoreDefense,
  "pacman-canvas": ScenePacman,
  "reaction-timer": SceneReactionTimer,
  snake: SceneSnake,
  "sudoku-mini": SceneSudokuMini,
  tetris: SceneTetris,
  "tic-tac-toe": SceneTicTacToe,
  "typing-speed": SceneTypingSpeed,
  "word-match": SceneWordMatch,
};

/** Games that render their own artwork instead of a generated scene. */
export const GAMES_WITH_OWN_ARTWORK = ["gridland"];

export function getGameScene(slug: string): ComponentType | null {
  return GAME_SCENES[slug] ?? null;
}
