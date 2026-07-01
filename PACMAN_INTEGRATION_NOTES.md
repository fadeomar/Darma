# Pacman Canvas Darma Integration

## What changed

- Added a production Darma playable at `src/features/games/playables/pacman-canvas/PacmanCanvasGame.tsx`.
- Added `src/features/games/playables/pacman-canvas/index.ts`.
- Registered the game in `src/features/games/registry/index.ts` with slug `/games/pacman-canvas`.
- Wired the playable into `src/features/games/components/GamePlayerShell.tsx`.
- Added local Pacman assets under `public/games/pacman`:
  - original ghost SVG assets
  - original Pacman icon / heart / audio icons
  - original MP3 sound effects
  - original MIT license text

## Product behavior

- Keeps the original mini Pacman maze size: `540 × 390` internal canvas.
- Keeps the original ghost SVG assets and arcade sound files.
- Removes the old demo/debug shell completely.
- Adds Darma UI shell: score, best score, level, lives, pellets, pause, restart, mute, focus mode.
- Adds keyboard controls: arrows / WASD, Space/Enter start, P/Esc pause.
- Adds mobile support: swipe on canvas and D-pad controls.
- Adds local best score only via browser localStorage.
- Adds win and game-over overlays.

## Notes

- This is a direct Darma integration, not an iframe and not the old monorepo demo.
- No external packages were added.
- `.env.local` and `.env.local.bak` should not be distributed in generated handoff archives.
