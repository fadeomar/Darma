# Animated Background Generator

Generate animated particle backgrounds — pick a preset, tune speed, colors, size, and blend mode, then copy the ready-to-use CSS + HTML.

## Privacy

`local-only` — all CSS and HTML is generated in the browser from configuration state. No data is sent anywhere.

## Logic

The generator is composed of three layers:

### 1. `lib/seededRandom.ts`

```ts
createSeededRandom(seed: number): () => number
randomBetween(random, min, max): number
```

A simple 32-bit linear congruential PRNG (Park-Miller). Given the same seed it always produces the same sequence — making particle layouts deterministic and reproducible.

### 2. `lib/generateParticleData.ts`

```ts
generateParticleData(state: AnimatedBackgroundState): ParticleData[]
```

Produces an array of particle descriptors using the seeded RNG. Count is clamped to [1, 44].  
Each `ParticleData` has: `id`, `x`, `y`, `size`, `delay`, `duration`, `driftX`, `driftY`, `rotate`, `color`, `opacity`.

- **Colors** cycle through `state.colors` using `index % colors.length`
- **Size** is drawn from [`state.minSize`, `state.maxSize`]
- **Duration** scales inversely with `state.speed` — higher speed = shorter duration
- **Drift** range scales with `state.intensity`
- **Opacity** is capped at 0.95

### 3. `lib/generateCss.ts`

```ts
generateCss(state: AnimatedBackgroundState, particles: ParticleData[], options?: { paused?: boolean }): string
```

Produces a complete CSS block targeting `.darma-animated-bg`:

- **Background layers** — `radial-gradient` mesh/linear/radial pattern from the state's colors, with optional grid lines for cyber/matrix presets
- **Per-particle CSS** — `nth-child(n)` rules with position, size, opacity, blur, glow (`drop-shadow`), blend mode, animation duration, and drift CSS variables
- **`@keyframes darma-float`** — translates by `--drift-x`/`--drift-y` and scales 0.92 → 1.08
- **Preset extras** — special `::after` animations for neon-waves, cyber-grid, matrix-rain, starlight-drift, sunset-ribbons, and neural-glow presets
- **`prefers-reduced-motion`** — disables all animations when the user has requested reduced motion

#### Shape rendering

| `state.shape` | CSS |
|---|---|
| `"circle"` | `border-radius: 999px` |
| `"soft-square"` | `border-radius: <borderRadius>%` |
| `"diamond"` | `border-radius: <borderRadius>%; transform: rotate(45deg)` |

### 4. `lib/generateHtml.ts`

Generates the matching HTML scaffold (`<div class="darma-animated-bg">` with `<span>` children for each particle).

### 5. `lib/presets.ts`

Defines the preset library — each preset is a partial `AnimatedBackgroundState` merged over sensible defaults.

## Tests

`lib/generateParticleData.test.ts` — 21 tests covering:
- `generateParticleData`: count, clamping, determinism, different seeds, sequential IDs, color cycling, size bounds, opacity cap
- `generateCss`: non-empty output, `.darma-animated-bg` selector, `animation-play-state`, `@keyframes darma-float`, `prefers-reduced-motion`, nth-child per particle, shape CSS, blend mode
