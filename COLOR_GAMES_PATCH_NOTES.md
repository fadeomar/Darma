# Dharma Color Games Patch

This patch adds two complete playable games and wires them into the existing Darma Games player shell.

## Added games

1. `Color Brain Rush` at `/games/color-brain-rush`
   - Stroop-style English colors game.
   - Kids Learning and Classic Challenge modes.
   - Beginner / Intermediate / Advanced levels.
   - Start screen, instructions, scoring, pause, win, game over, final stats.
   - Web Audio API sounds, background loop, mute toggle, success/fail particles.

2. `Color Orbit Switch` at existing `/games/color-switch`
   - Original canvas-based color matching arcade game.
   - 10 levels plus Endless mode.
   - Start, instructions, level select, pause, level complete, game over.
   - Stars, color switch items, streak multiplier, score, local high score.
   - Web Audio API sounds, background loop, mute toggle, success/fail/switch/star effects.

## How to apply

Copy the included `src/` folder over the project `src/` folder, preserving paths.

## Notes

No external assets were added. All effects and sounds are generated in-browser.
