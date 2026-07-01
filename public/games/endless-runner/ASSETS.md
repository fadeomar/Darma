# Endless Runner assets

## Background layers

- `images/layer1.jpg`, `images/layer2.jpg` — parallax forest backgrounds.
  License: see `LICENSE` in this folder.
- If either file is missing or fails to load, the game automatically falls
  back to a generated gradient/hill background (see `drawBackgroundFallback`
  in `src/features/games/playables/endless-runner/runnerScene.ts`), so a
  missing asset never breaks the game.

## Hero character sprites

- `images/hero-idle.png`, `hero-walk1.png`, `hero-walk2.png`, `hero-jump.png`,
  `hero-fall.png`, `hero-slide.png`, `hero-hurt.png` — one real, individually
  posed sprite per animation state (idle, run x2, jump, fall, slide, hurt).
- Source: Kenney "Platformer Characters" pack (Player character), CC0. See
  `images/HERO-LICENSE.txt` for the full notice.
- Each file is 80x110px with a transparent background, character anchored
  with feet near the bottom of the frame.
- If any of these files is missing or fails to load, the game generates a
  procedurally-drawn placeholder of the same size under the same texture key
  automatically (see `drawHeroPoseFallback` in `runnerScene.ts`), so a missing
  asset never breaks the game — it just looks simpler.

### Swapping in different character art

Replace any of the seven files above with a same-named, same-size (80x110)
PNG and it's picked up automatically — no code changes needed. If you want a
different frame size, update `HERO_NATIVE_W` / `HERO_NATIVE_H` / `HERO_SCALE`
and the hitbox numbers in `setPlayerBody()` in `runnerScene.ts` to match, and
include a LICENSE file for the new asset (CC0/OFL/MIT preferred).
