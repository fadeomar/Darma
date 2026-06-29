# Darma Games Engine

Sprint 21 extracted a small, reusable game foundation from the Reaction Timer Pro work.

The goal is not to create a heavy framework. The goal is to prevent every new Darma game from rebuilding the same basics:

- fullscreen-safe shell patterns
- Canvas resize and requestAnimationFrame cleanup
- local-only storage adapters
- QA checklist for mobile, fullscreen, timing, accessibility, sharing, and storage
- shared vocabulary for game modes and browser capabilities

## Available primitives

```ts
import {
  GameCanvasStageBase,
  GameFullscreenShell,
  createLocalJsonStore,
  DARMA_GAME_QA_CHECKLIST,
} from "@/features/games/engine";
```

### GameCanvasStageBase

Use this for lightweight Canvas 2D gameplay. It handles:

- `devicePixelRatio`
- resize to rendered size
- `requestAnimationFrame`
- cleanup on unmount
- reduced-motion friendly single-frame rendering

Important UI text should not be drawn only on Canvas. Keep instructions, HUD, results, buttons, and accessibility text in React/HTML overlays.

### GameFullscreenShell

Use this as a visual shell for future playable games. It provides stable data attributes and a top-controls slot that stops pointer/click propagation.

The shell does not request fullscreen itself. Each game should own fullscreen behavior so it can handle browser failures, interruption, and focus correctly.

### createLocalJsonStore

A small local JSON storage adapter for future games. It handles unavailable storage, parse failures, write failures, reset, defaults, and optional migration.

Reaction Timer Pro still keeps its own storage implementation because its schema is large and battle-tested.

### DARMA_GAME_QA_CHECKLIST

A starter QA checklist for any future playable game. It covers:

- route load
- `performance.now()` timing
- pointerdown input
- controls not triggering gameplay
- mobile touch safety
- fullscreen resize
- storage fallback
- HTML accessibility text
- keyboard UI
- reduced motion
- share fallback
- RAF cleanup

## Recommended folder structure for a new game

```txt
src/features/games/playables/<game-slug>/
  <GameName>Player.tsx
  <GameName>Stage.tsx
  <GameName>ModeSelect.tsx
  <GameName>Result.tsx
  <GameName>Stats.tsx
  <gameName>Types.ts
  <gameName>Scoring.ts
  <gameName>Storage.ts
  <gameName>Audio.ts
  <gameName>Achievements.ts
  index.ts
```

## New game checklist

1. Define the game mode model.
2. Keep timing-sensitive scoring on `performance.now()`.
3. Use `pointerdown` for active gameplay where latency matters.
4. Stop propagation on controls inside the player.
5. Keep important UI and results in HTML.
6. Support mobile touch targets.
7. Support fullscreen enter/exit and resize.
8. Add local-only storage with migration.
9. Add reset confirmation for local progress.
10. Add reduced motion behavior.
11. Add share/copy fallbacks if sharing exists.
12. Add an accessibility note when keyboard parity is limited.
13. Run typecheck, lint, build, and manual mobile QA.
