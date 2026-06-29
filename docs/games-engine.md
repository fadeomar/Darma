# Darma Games Engine Guide

Reaction Timer Pro is now the reference implementation for Darma Games. Future games should reuse its architecture instead of starting from scratch.

## Architecture rule

Use the hybrid pattern:

- React/HTML for readable UI, buttons, settings, HUD, results, education, and accessibility.
- Canvas 2D for dynamic gameplay visuals, targets, particles, movement, hit/miss effects.
- SVG/icons for badges, progress indicators, and lightweight visual symbols.
- Local storage for progress, stats, achievements, settings, and leaderboards.
- No backend unless a future product decision explicitly requires it.

## Timing rule

Gameplay timing must use `performance.now()`.

Do not use CSS animation timing as the source of truth for scores. Canvas animation can render visuals, but score timing should be calculated from recorded timestamps.

## Input rule

Use `pointerdown` for active gameplay when speed matters. Use keyboard for UI and simple start/confirm flows. If a mode is pointer-heavy, be honest in the UI and provide clear text that pointer/touch is recommended.

Controls inside the game player must stop propagation so settings, share, fullscreen, pause, and quit buttons never count as hits, misses, or reactions.

## Storage rule

All current Darma games should be local-first:

- no account required
- no login required
- no global leaderboard claim
- safe localStorage migration
- graceful fallback if localStorage is blocked or corrupted

## Accessibility rule

Canvas is not accessible by itself. Always provide HTML text for:

- instructions
- current state
- HUD values
- pass/fail state
- final results
- score/rank interpretation
- settings and action buttons

Avoid color-only cues. Support reduced motion. Keep high-contrast options available without locking them behind progress.

## QA checklist before shipping a new game

- Route loads without console errors.
- Active timing uses `performance.now()`.
- Gameplay controls use `pointerdown` where needed.
- Player controls never trigger gameplay input.
- Fullscreen enter/exit works.
- Canvas coordinates are correct after resize/orientation change.
- Mobile does not scroll/select text during active play.
- Touch targets are large enough.
- localStorage unavailable/corrupted cases are safe.
- Copy/share/download failures do not crash.
- Keyboard navigation works for UI.
- Important values are not canvas-only.
- Reduced motion works.
- Dark mode and high contrast are readable.
- RAF/timers clean up on unmount and mode switch.
- Typecheck, lint, and build pass.
