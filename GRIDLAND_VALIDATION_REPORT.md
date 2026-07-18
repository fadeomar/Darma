# Gridland Darma Integration — Validation Report

Date: 2026-07-16

## Confirmed checks

- Gridland is registered at `/games/gridland`.
- The existing Darma `StaticGameEmbed` isolation shell is used.
- Optimized Gridland runtime is present under `public/darma-games/gridland/`.
- Original maintainable source mirror is present under `vendor/gridland-source/`.
- Runtime JavaScript files pass `node --check` syntax validation.
- Runtime uses local sprite, audio, RequireJS, and jQuery assets.
- Legacy Universal Analytics identifiers and external media CDN references are absent from the runtime.
- Gridland saves and options use the `darma:games:gridland:v1:` local-storage namespace.
- Original save payload/import-export behavior is preserved.
- Original MPL 2.0 license and project credits are retained.

## Automated tests

Command:

```bash
npm test
```

Result:

- Test files: **108 passed**
- Tests: **1,263 passed**
- Gridland-specific integration tests: **4 passed**

The Gridland tests verify:

1. Registry and public route metadata.
2. Required local runtime files.
3. Removal of external media/analytics dependencies.
4. Namespaced saves and settings.

## Runtime syntax checks

Validated:

```bash
node --check public/darma-games/gridland/js/app.js
node --check public/darma-games/gridland/js/lib/require.js
node --check public/darma-games/gridland/js/lib/jquery-2.0.3.min.js
```

Result: **passed**.

## Package-lock repair

The supplied project lockfile was missing the nested optional `yaml@2.9.0` entry used by Vitest. The lockfile now contains that entry, preventing the original `npm ci` missing-lock-entry error.

## Manual browser QA still required after merge

Automated checks cannot fully validate audio autoplay policy, visual pixel parity, or long gameplay sessions. Test locally:

1. `npm install`
2. `npm run dev`
3. Open `/games/gridland`
4. Verify save-slot selection, tile swapping, cascades, resources, construction, day/night transition, combat, pause, menus, audio, fullscreen, restart, persistence, and save import/export.
5. Repeat on desktop and mobile viewport sizes.

## Environment limitation

A complete clean dependency installation did not finish reliably inside this container. The registry process left several dependency directories and the generated Prisma client incomplete. Consequently, the project-wide `typecheck`, `lint`, and production `build` could not be certified here: TypeScript reported missing installed modules such as `@monaco-editor/react`, Tiptap packages, and generated Prisma exports rather than errors in the Gridland changes. Run the commands above after a normal local `npm install`/`npm ci` and `prisma generate`.
