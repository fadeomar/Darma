# Static game embeds

This folder contains the Darma player wrapper for legacy/static browser games.
The actual imported game files are served from `public/darma-games/*` so their
original HTML/CSS/JS asset paths keep working without a rewrite.

Imported in this update:

- `/public/darma-games/2048` — original 2048 browser game, locally embedded.
- `/public/darma-games/hextris` — Hextris browser game, locally embedded with external analytics/ads removed.
