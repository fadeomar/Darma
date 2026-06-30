# Tetris (Darma playable)

A native Darma Games port of a classic Tetris implementation.

## Origin & attribution

The game logic (collision, rotation, ghost piece, line clears, scoring) was
ported from an open-source CodeSandbox React-hooks Tetris prototype. The source
ZIP shipped **without a LICENSE file or explicit copyright notice**, so no
licence terms could be preserved verbatim.

Because the original licence is unconfirmed, this integration should be treated
as internal until the upstream licence is verified. If you can identify the
original author/repository, add the appropriate attribution and licence here.

Tetris® is a registered trademark of The Tetris Company. This is an educational
clone of the gameplay mechanics and is not affiliated with or endorsed by them.

## What changed during the port

- Rewritten in TypeScript with explicit types (`tetrisTypes.ts`).
- Merged the formerly circular `Board` ⇄ `PlayerController` modules into a single
  pure engine (`tetrisEngine.ts`).
- All CSS scoped under the `.dt-` namespace in `games-theme.css` — no global
  class names, no global reset, no CRA/react-scripts artefacts.
- Fixed the original React key bug (`x * columns + x` → `` `${y}-${x}` ``).
- Keyboard handling scoped to the mounted game with proper listener cleanup and
  scroll-prevention for arrows/space; added on-screen touch controls.
- High score persisted to `localStorage` only.
