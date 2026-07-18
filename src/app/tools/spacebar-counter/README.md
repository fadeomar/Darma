# Spacebar Counter & Session Studio

Browser-local keyboard challenge with per-press evidence, hold-repeat detection, comparison-quality checks, reusable backups, and production exports.

## Core behavior

- Modes: 5, 10, 30, 60 seconds, and manual stop.
- Inputs: physical keyboard plus touch or mouse fallback on the SPACE card.
- Metrics: total presses, PPS, rolling one-second burst, average gap, fastest gap, consistency, and ignored browser auto-repeats.
- History: up to ten attempts in `localStorage` under `darma:spacebar-counter:history:v1`.
- Legacy aggregate-only attempts remain readable and are labeled clearly.

## Phase 37 additions

- Stores a relative timestamp and input source for every counted press in new runs.
- Prevents browser space-scroll only while the countdown or test is active.
- Throttles timer-driven UI statistics to avoid recalculating the complete sample set on every animation frame.
- Resets the live result when timer mode changes while preserving saved history.
- Adds four result-quality cards and severity-based production checks.
- Adds versioned JSON import/export with a 1 MB import limit and duplicate-ID rejection.
- Adds Markdown, per-press CSV, and ZIP production exports.

## Backup schema

```json
{
  "schema": "darma.spacebar-counter-session",
  "version": 1,
  "exportedAt": "ISO-8601 timestamp",
  "settings": { "mode": 10 },
  "attempts": []
}
```

## ZIP production pack

- `spacebar-session.json`
- `spacebar-report.md`
- `spacebar-presses.csv`
- `README.md`

## Verification

```bash
npm exec vitest run \
  src/app/tools/spacebar-counter/spacebarMetrics.test.ts \
  src/app/tools/spacebar-counter/studio.test.ts
```

The result is intended for entertainment, browser-input checks, and same-device comparison. It is not a certified hardware, accessibility, or medical assessment.
