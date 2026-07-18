# Gridland — Preservation-First Darma Integration

## Delivered

- Registered `/games/gridland` in Darma's existing Games registry.
- Wired the game through the existing `StaticGameEmbed` isolation shell.
- Added the optimized Gridland v1.1 runtime at `public/darma-games/gridland/`.
- Added an unminified maintenance mirror at `vendor/gridland-source/`.
- Preserved the original gameplay engine, rendering, sprites, animations, audio files, and save payload format.
- Localized all runtime sprite, audio, and jQuery loading.
- Disabled legacy Universal Analytics and obsolete in-game social/donation widgets.
- Namespaced storage under `darma:games:gridland:v1:` to prevent collisions with Darma or other games.
- Retained original credits and MPL 2.0 license files.

## Important behavior

- Darma's Restart button reloads only the iframe. It does not erase saved progress.
- Fullscreen expands the Darma static-game shell while keeping the Gridland runtime isolated.
- Gridland's own menu remains responsible for music/effects volume and save export/import.
- The external studio logo link remains as original attribution, but the runtime performs no external media or analytics requests during normal loading.

## Files changed

- `src/features/games/registry/index.ts`
- `src/features/games/components/GamePlayerShell.tsx`
- `package-lock.json` (repairs the pre-existing missing `yaml@2.9.0` lock entry so clean installs are reproducible)
- `public/darma-games/SOUND_SOURCES.md`

## Files added

- `public/darma-games/gridland/**`
- `vendor/gridland-source/**`
- `GRIDLAND_INTEGRATION_NOTES.md`
- `src/features/games/playables/static-embed/gridlandIntegration.test.ts`

## QA focus

1. Open `/games/gridland` and verify the title/save-slot screen.
2. Start a game and confirm tile swaps, cascades, resources, building, day/night transition, combat, pause, and menu behavior.
3. Confirm day/night/boss music and effects; browser autoplay may require the first user gesture.
4. Refresh and reload the iframe to verify progress persists.
5. Test save export/import.
6. Test desktop, tablet, mobile, and fullscreen.
