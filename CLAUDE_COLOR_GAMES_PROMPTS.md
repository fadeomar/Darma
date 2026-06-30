# Prompt 1 — QA and polish Color Brain Rush

Audit and polish the newly added `/games/color-brain-rush` playable.

Check these files:
- `src/features/games/playables/color-brain-rush/ColorBrainRushGame.tsx`
- `src/features/games/playables/color-brain-rush/index.ts`
- `src/features/games/components/GamePlayerShell.tsx`
- `src/features/games/registry/index.ts`

Acceptance criteria:
- The game opens from `/games/color-brain-rush`.
- Start screen has title, instructions, scoring, mode entry, sound toggle, and back-to-games action.
- Kids Learning mode and Classic Challenge mode both work.
- Beginner uses exactly 3 colors: Red, Blue, Yellow.
- Intermediate uses exactly 5 colors: Red, Blue, Yellow, Green, Orange.
- Advanced uses exactly 8 known colors: Red, Blue, Yellow, Green, Orange, Purple, Pink, Black.
- Correct answer is the visible text color, not the word meaning.
- Timer, score, streak, multiplier, question progress, accuracy, and average reaction time work.
- Correct, wrong, timeout, start, win, and lose interactions work.
- Web Audio API sounds work only after user interaction and respect mute.
- Kids voice feedback does not crash browsers that block speech synthesis.
- Pause/resume works without timer bugs.
- Win and game over screens appear based on accuracy thresholds.
- Layout has no horizontal or internal game scroll on desktop/mobile.
- No copyrighted UI, branding, text, or assets are copied from any external website.

Fix any TypeScript, hydration, or mobile layout issues you find. Do not reduce the game to a prototype.

# Prompt 2 — QA and polish Color Orbit Switch

Audit and polish the newly added `/games/color-switch` playable.

Check these files:
- `src/features/games/playables/color-switch/ColorSwitchGame.tsx`
- `src/features/games/playables/color-switch/index.ts`
- `src/features/games/components/GamePlayerShell.tsx`
- `src/features/games/registry/index.ts`

Acceptance criteria:
- The existing `/games/color-switch` placeholder now mounts the real canvas game.
- Start screen, instructions, scoring, level select, gameplay, pause, level complete, game over, retry, next level, and back/menu flows exist.
- There are at least 10 handcrafted levels.
- Endless mode exists and gradually extends the run.
- Tap/click/Space/ArrowUp/W jump controls work.
- P/Esc pause works.
- The orb can safely pass only through matching color obstacle segments.
- Wrong color collision triggers game over.
- Passing obstacles scores points and builds streak multipliers.
- Star collectibles and color switch items work.
- Sounds exist for start, jump, pass, star, switch, fail, win, and background loop.
- Mute toggle stops both one-shot sounds and background audio.
- Success trail, fail trail, star effect, switch effect, and win celebration appear.
- Level complete screen appears in Level Mode.
- Game over screen appears on wrong collision/fall.
- Canvas resizes correctly on mobile/desktop and the game area does not create scroll.
- High score remains localStorage only.
- Do not copy copyrighted Color Switch assets, branding, exact UI, sounds, or level design.

Fix any TypeScript, collision fairness, mobile sizing, or sound lifecycle issues. Preserve the original Dharma visual style.
