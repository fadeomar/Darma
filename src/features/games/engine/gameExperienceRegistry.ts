import type { GameDefinition } from "../domain/game";
import type { GameExperienceManifest } from "./gameExperienceTypes";

const OVERRIDES: Record<string, Partial<GameExperienceManifest>> = {
  "reaction-timer": {
    nativeOnboarding: true,
    intro: "Reaction Timer Pro already includes a guided first-run flow. The shared Darma shell adds consistent preferences, fullscreen, and session controls around it.",
    accessibilityNote: "Keyboard, pointer, touch, reduced effects, contrast, sound, and haptic options are available inside the game.",
  },
  "neon-core-defense": {
    nativeOnboarding: true,
    intro: "Choose a loadout, defend the core, and use the shared toolbar for fullscreen, accessibility preferences, pause, resume, and replay.",
    accessibilityNote: "The game supports reduced effects, particle limits, sound controls, pause, keyboard shortcuts, and touch aiming.",
  },
  gridland: {
    importedRuntime: true,
    intro: "This preserved third-party game runs inside an isolated frame. Its original menu controls saves, audio, import, and export.",
    accessibilityNote: "The Darma shell can enlarge the surrounding controls, but the preserved runtime keeps its original internal accessibility behavior.",
  },
  "2048": {
    importedRuntime: true,
    accessibilityNote: "Use arrow keys or swipe inside the embedded board. Shared Darma preferences do not rewrite the preserved runtime.",
  },
  hextris: {
    importedRuntime: true,
    accessibilityNote: "Use keyboard or touch controls inside the embedded game. The original runtime keeps its own visual and audio behavior.",
  },
};

export function getGameExperienceManifest(game: GameDefinition): GameExperienceManifest {
  const inputs = game.input.map((item) => item === "keyboard" ? "keyboard" : item === "touch" ? "touch" : "pointer");
  const fallback: GameExperienceManifest = {
    title: `Before you play ${game.title}`,
    intro: game.description,
    controls: game.controls,
    tips: (game.tips ?? []).slice(0, 3),
    accessibilityNote: `Playable with ${Array.from(new Set(inputs)).join(", ")}. Shared preferences can reduce motion, increase contrast, enlarge controls, and remember sound choices on this device.`,
  };

  return { ...fallback, ...OVERRIDES[game.slug] };
}
