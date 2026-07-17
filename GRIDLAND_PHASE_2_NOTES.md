# Gridland Phase 2 — Darma polish and runtime bridge

Phase 2 keeps Gridland's original runtime intact while improving the Darma-owned experience around it.

## Added

- Versioned same-origin Gridland → Darma status bridge.
- Runtime readiness, started/paused state, day/night phase, and day-number reporting.
- Darma loading layer while the isolated runtime initializes.
- Live status badge in the game toolbar.
- Gridland-specific immersive shell styling and responsive mobile actions.
- Authentic Gridland badge artwork in Games cards and the detail hero.
- Unit tests for bridge parsing and integration integrity.

## Intentionally unchanged

- Match-3 rules and legal-move behavior.
- Day/night timing and progression.
- Combat, enemies, loot, magic, resources, and buildings.
- Original CSS sprites and animation timing.
- Music, sound effects, volume behavior, and audio files.
- Save payload format and import/export compatibility.

## Bridge boundary

The bridge is read-only for Phase 2. Darma requests the current state and displays it, but it does not control gameplay or inject UI into the game document.
