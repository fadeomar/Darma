# Applying the Gridland Integration Patch

This patch is based on the complete Darma codebase supplied as `src(5).zip`.

## Preferred method

Extract the patch ZIP directly into the root of the matching Darma repository and allow it to overwrite the listed modified files. The patch contains only Gridland-related additions and the small set of modified Darma files.

## Files modified

- `package-lock.json`
- `public/darma-games/SOUND_SOURCES.md`
- `src/features/games/components/GamePlayerShell.tsx`
- `src/features/games/registry/index.ts`

## Files/directories added

- `public/darma-games/gridland/`
- `vendor/gridland-source/`
- `src/features/games/playables/static-embed/gridlandIntegration.test.ts`
- `GRIDLAND_INTEGRATION_NOTES.md`
- `GRIDLAND_VALIDATION_REPORT.md`

## Validation after applying

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

Then open `/games/gridland` and complete the manual QA checklist in `GRIDLAND_VALIDATION_REPORT.md`.
