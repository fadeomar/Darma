# Gridland runtime in Darma

This directory contains Gridland v1.1's optimized browser runtime, integrated into Darma as an isolated same-origin iframe.

Host-only changes:

- all sprites and audio load from this local directory;
- Google Universal Analytics was disabled;
- obsolete share and donation widgets were disabled;
- localStorage keys use the `darma:games:gridland:v1:` namespace;
- the original game engine, rules, rendering, animations, audio files, and save payload format remain unchanged.

The unminified maintenance mirror is in `vendor/gridland-source/`. Original authorship and licensing are preserved in `LICENSE`, `README-ORIGINAL.md`, and the HTML credits comment.

## Phase 2 host bridge

`js/darma-bridge.js` is a deliberately small, versioned adapter between the isolated Gridland runtime and the Darma game shell. It is read-only from the gameplay perspective: it reports runtime readiness, current day/night phase, day number, pause state, and major lifecycle events. It does not alter board logic, combat, resources, audio, saves, or rendering.

Protocol identifiers:

- runtime source: `darma-gridland-runtime`
- host source: `darma-static-game-host`
- game id: `gridland`
- protocol version: `1`
