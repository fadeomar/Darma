# Click Speed Test & Session Studio

Browser-local CPS challenge with per-click evidence, quality checks, reusable backups, and production exports.

## Core behavior

- Modes: 5, 10, 30, 60 seconds, and manual stop.
- Primary pointer events only: mouse, touch, and pen.
- Metrics: total clicks, CPS, best rolling one-second burst, average gap, fastest gap, and consistency.
- History: up to ten attempts in `localStorage` under `darma:click-speed-test:history:v1`.
- Legacy aggregate-only attempts remain readable and are labeled clearly.

## Phase 35 additions

- Stores relative timestamp and pointer source for every click in new runs.
- Throttles timer-driven UI statistics to avoid recalculating the complete sample set on every animation frame.
- Resets the live result when timer mode changes, while preserving saved history.
- Adds four result-quality summary cards and severity-based production checks.
- Adds versioned JSON import/export with a 1 MB import limit and duplicate-ID rejection.
- Adds Markdown, per-click CSV, and ZIP production exports.

## Backup schema

```json
{
  "schema": "darma.click-speed-session",
  "version": 1,
  "exportedAt": "ISO-8601 timestamp",
  "settings": { "mode": 10 },
  "attempts": []
}
```

## ZIP production pack

- `click-session.json`
- `click-report.md`
- `click-events.csv`
- `README.md`

## Verification

```bash
npm exec vitest run \
  src/app/tools/click-speed-test/clickMetrics.test.ts \
  src/app/tools/click-speed-test/studio.test.ts
```

The result is intended for entertainment, browser-input checks, and same-device comparison. It is not a certified hardware, accessibility, or medical assessment.
