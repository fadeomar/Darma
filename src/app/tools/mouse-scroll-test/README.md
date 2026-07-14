# Mouse Scroll Test & Session Studio

Browser-local wheel and touch scrolling challenge with per-event evidence, quality checks, reusable backups, and production exports.

## Core behavior

- Modes: 5, 10, 30, 60 seconds, and manual stop.
- Inputs: normalized wheel events and touch movement inside the challenge arena.
- Metrics: total distance, average pixels per second, events per second, best rolling half-second burst, smoothness, direction, and input method.
- History: up to ten attempts in `localStorage` under `darma:mouse-scroll-test:history:v2`.
- Legacy aggregate-only attempts remain readable and are labeled clearly.

## Phase 36 additions

- Stores relative timestamp, dx, dy, and input source for every new scroll event.
- Throttles live statistics to avoid recalculating the complete sample set on every animation frame and high-frequency event.
- Releases the global wheel lock immediately when the run ends.
- Resets the live result when timer mode changes while preserving saved history.
- Adds four result-quality summary cards and severity-based production checks.
- Adds versioned JSON import/export with a 1 MB import limit and duplicate-ID rejection.
- Adds Markdown, per-event CSV, and ZIP production exports.
- Includes long pauses in smoothness calculations rather than silently excluding them.

## Backup schema

```json
{
  "schema": "darma.mouse-scroll-session",
  "version": 1,
  "exportedAt": "ISO-8601 timestamp",
  "settings": { "mode": 10 },
  "attempts": []
}
```

## ZIP production pack

- `scroll-session.json`
- `scroll-report.md`
- `scroll-events.csv`
- `README.md`

## Verification

```bash
npm exec vitest run \
  src/app/tools/mouse-scroll-test/scrollMetrics.test.ts \
  src/app/tools/mouse-scroll-test/studio.test.ts
```

Pixel-based results depend heavily on browser, device, wheel step, touchpad acceleration, and operating-system settings. The tool is intended for entertainment, browser-input diagnostics, and same-device comparison, not certified hardware, accessibility, or medical assessment.
