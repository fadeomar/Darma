# Gridland source mirror for Darma

This is the unminified Gridland v1.1 source retained for maintenance. Darma serves the optimized runtime from `public/darma-games/gridland/`.

The source mirror includes the original JavaScript, CSS, HTML, build profile, README, and MPL 2.0 license. Binary sprites and audio are not duplicated here; they are stored in the public runtime under `public/darma-games/gridland/img/` and `public/darma-games/gridland/audio/`.

Darma host adaptations are intentionally narrow:

- local media base paths;
- local jQuery;
- no-op legacy analytics, share, and donation modules;
- namespaced storage (`darma:games:gridland:v1:*`).

Do not modernize or rewrite gameplay code in the same change as a behavior fix. Rebuild and compare against the preserved runtime after every engine change.

## Phase 2 host bridge

The maintenance mirror includes `www/js/darma-bridge.js`, loaded separately from the original AMD game bundle. It only exposes runtime readiness and lifecycle state to the same-origin Darma parent frame. It is intentionally excluded from gameplay, save, audio, and rendering logic.
