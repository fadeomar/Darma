# Darma Games Engine

Sprint 21 extracted a small, reusable game foundation from the Reaction Timer Pro work.

The goal is not to create a heavy framework. The goal is to prevent every new Darma game from rebuilding the same basics:

- fullscreen-safe shell patterns
- Canvas resize and requestAnimationFrame cleanup
- local-only storage adapters
- QA checklist for mobile, fullscreen, timing, accessibility, sharing, and storage
- shared vocabulary for game modes and browser capabilities
- first-run onboarding and truthful shared controls
- cross-game accessibility preferences
- local session summaries and replay hooks

## Available primitives

```ts
import {
  GameCanvasStageBase,
  GameExperienceFrame,
  GameFullscreenShell,
  createLocalJsonStore,
  useGameExperience,
  useGameExperienceControls,
  DARMA_GAME_QA_CHECKLIST,
} from "@/features/games/engine";
```


### GameExperienceFrame

Every public game route is now wrapped by one shared experience layer. It adds:

- a compact instructions and preferences toolbar
- first-run onboarding for games that do not already own an onboarding flow
- fullscreen on the outer player without changing game internals
- shared mute, reduced-motion, high-contrast, large-control, and auto-pause preferences
- local-only session counts, duration, last result, and eligible best scores
- an ARIA live region for start, pause, resume, and completion updates

Preserved third-party runtimes remain isolated. The shell never claims it can rewrite their internal audio, controls, or accessibility behavior.

### useGameExperience / useGameExperienceControls

Native games can opt into deeper integration without adopting a heavy framework:

```tsx
const { startSession, completeSession, preferences } = useGameExperience();

useGameExperienceControls({
  pause,
  resume,
  restart,
  canPause: phase === "playing",
  canResume: phase === "paused",
  canRestart: phase === "over",
});
```

Call `startSession()` only when gameplay genuinely begins. Call `completeSession()` once with a concise result. Use `trackBestScore: true` only when a larger numeric score is objectively better; reaction times and other lower-is-better metrics should use `scoreLabel` instead.

Phase 3 integrates the deeper lifecycle with Math Sprint, Reaction Timer Pro classic/practice, and Neon Core Defense. Other games still receive the universal onboarding, preferences, fullscreen, and accessibility shell, and can register lifecycle controls incrementally.

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
