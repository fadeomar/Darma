# Reaction Time Test

Phase 34 upgrades the existing reaction challenge into a browser-local result and handoff studio without changing its tool ID or route.

## Route

- ID: `reaction-time-test`
- href: `/tools/reaction-time-test`
- privacy: local storage plus explicit file downloads

## Main behavior

- 1, 3, 5, or 10 valid reaction rounds
- Quick, Standard, and Focus random-delay profiles
- Pointer, touch, pen, Space, and Enter input
- False-start protection
- Average, median, best, slowest, spread, consistency, and input-method statistics
- Ten-run local history with legacy aggregate compatibility

## Result-quality audit

Checks use `error`, `warning`, `info`, and `pass` severities. They cover completeness, sample size, sub-100 ms anticipation flags, above-1,500 ms interruption flags, false starts, mixed input methods, consistency, device latency, privacy, and the non-medical limitation.

## Import and exports

- Versioned JSON session backup and restore
- Markdown report
- Per-round CSV
- ZIP pack containing JSON, Markdown, CSV, and README
- 1 MB JSON import limit
- Duplicate attempt IDs rejected
- Imported statistics recomputed from valid round evidence

## Compatibility fixes

- Existing `darma:reaction-time-test:history:v1` storage is retained.
- Older aggregate-only attempts remain visible instead of being discarded.
- The old animation-frame wait-progress loop was removed. The progress rail now reflects round completion and does not reveal the hidden signal delay.
- Changing the mode resets the live arena instead of relabeling a completed result with a different round count.

## Verification

Run the focused checks:

```bash
npm exec vitest run \
  src/app/tools/reaction-time-test/reactionMetrics.test.ts \
  src/app/tools/reaction-time-test/studio.test.ts

npm run typecheck
npm run lint
npm run build
```
