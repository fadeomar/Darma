# Darma Games sound notes

The imported 2048 and Hextris source bundles did not include original audio assets. This integration therefore ships local Web Audio sound effects that are generated in the browser and mapped to real game events: move, merge, invalid move, rotate, block settle, clear, win/lose, restart, pause, and theme switch.

Recommended CC0 replacement packs for a future asset pass:

- Kenney UI Audio — 50 interface/button/switch/click files, Creative Commons CC0.
- Kenney Interface Sounds — 100 interface/click/button files, Creative Commons CC0.
- OpenGameArt CC0 sound effect collections, including 100 CC0 SFX packs.

If downloaded later, keep the selected OGG/WAV files under `public/darma-games/shared-audio/` and replace the Web Audio calls in:

- `public/darma-games/2048/js/darma_audio_ui.js`
- `public/darma-games/hextris/js/darma_audio_theme.js`
