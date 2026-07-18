# Apply the Gridland Phase 2 patch

This patch is designed to be overlaid on the completed Gridland Phase 1 Darma codebase.

1. Back up the current project.
2. Extract the patch ZIP at the project root.
3. Allow matching files to be replaced.
4. Install dependencies and regenerate Prisma if required.
5. Run the validation commands below.

```bash
npm install
npx prisma generate
npm test
npm run typecheck
npm run lint
npm run build
```

The patch does not delete files and does not modify Gridland gameplay, audio, save payloads, or the optimized game bundle.
