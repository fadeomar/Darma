# Gridland runtime in Darma

This directory contains Gridland v1.1's optimized browser runtime, integrated into Darma as an isolated same-origin iframe.

Host-only changes:

- all sprites and audio load from this local directory;
- Google Universal Analytics was disabled;
- obsolete share and donation widgets were disabled;
- localStorage keys use the `darma:games:gridland:v1:` namespace;
- the original game engine, rules, rendering, animations, audio files, and save payload format remain unchanged.

The unminified maintenance mirror is in `vendor/gridland-source/`. Original authorship and licensing are preserved in `LICENSE`, `README-ORIGINAL.md`, and the HTML credits comment.
