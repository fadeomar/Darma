# Interactive Challenge UI Kit

This folder contains reusable components for Darma tools that behave more like playful challenges than standard utility forms.

Use it for tools such as:

- Mouse Scroll Test
- Click Speed Test
- Spacebar Counter
- Reaction Time Test
- Keyboard Test
- Double Click Test

## Pattern

Keep the Darma page shell calm and familiar, then put the energetic UI inside the challenge area. The goal is to create a fun interaction without making the wider product feel off-brand.

Typical structure:

1. `ToolPage` for SEO, header, related content, and article.
2. `ToolLayoutInteractiveChallenge` for the arena/controls/stats/history layout.
3. `ChallengeArenaChrome` for the shared polished frame around the live arena.
4. Challenge components from this folder for shared cards, mode selectors, stat tiles, history, tips, and localStorage helpers.

## Phase 8 UI layer

Phase 8 focuses on polish rather than new tools:

- Shared arena chrome with Darma-friendly glow, border, and depth.
- More tactile cards, mode buttons, stat tiles, and history panels.
- A stronger `/tools/fun` landing page with a challenge console and CTA flow.
- No global scroll locking; all input capture remains inside the arena.

## Local history

Use `loadChallengeHistoryWithFallback` and `saveChallengeHistory` for browser-only attempts. Keep storage keys versioned, for example:

```ts
const HISTORY_KEY = "darma:click-speed-test:history:v1";
```

History should remain optional. If localStorage is blocked, the tool should still work.

## UI rules

- Use `motion-safe` for decorative animations.
- Keep controls disabled during active tests when changing them would corrupt scoring.
- Store only small local attempt data.
- Avoid global scroll locking; capture input only inside the arena.
- Keep result language friendly and comparative rather than pretending to be certified hardware testing.

## Discovery surface

Phase 7 added `ChallengeLandingPage` for `/tools/fun` and a Fun Tools spotlight inside the main tools directory. Keep future challenge tools registered with `layoutType: "interactive-challenge"` and `toolCategory: "fun-tools"` so they appear in the hub automatically.

## Phase 9 UI polish

Phase 9 adds shared feedback components for the challenge experience:

- `ChallengeProgressRail` — accessible progress rail with active tones and consistent motion.
- `ChallengeStatusPill` — unified live/ready/finished/false-start state chip.
- `ChallengeResultHighlight` — compact result summary that appears after a completed challenge.

Use these pieces when a tool needs moment-to-moment feedback without rebuilding custom visual states per page.

## Phase 10 hub polish

Phase 10 improves the Fun Tools discovery layer rather than adding another tool:

- Stronger `/tools/fun` hero with a quick-start grid for repeat visitors.
- Featured challenge card that explains score type, local history, and setup friction.
- Richer challenge cards that communicate rhythm, best-use case, and score unit.
- Main `/tools` spotlight upgraded to a compact arcade shelf with featured challenge and quick cards.
- Small cleanup in the tools directory challenge filter flow.

## Phase 11 reward polish

Phase 11 improves completed-run feedback inside each challenge page:

- `ChallengeResultHighlight` now supports compact score badges and a gentle celebration layer.
- `ChallengeEmptyState` gives personal-best and history cards a reusable first-run state.
- Completed challenges can show the primary score plus secondary proof points such as burst, consistency, distance, false starts, or ignored repeats.
- Celebration effects stay decorative, local, and `motion-safe` friendly so the tools feel rewarding without leaving Darma’s calm visual system.
