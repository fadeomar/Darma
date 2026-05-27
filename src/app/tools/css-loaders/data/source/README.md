# CSS Loaders source catalog

This directory contains hand-normalized source loader JSON files. Do not edit `data/generated/*` directly; run `npm run generate:css-loaders` after adding or changing source JSON.

Source groups:

- `loading-io/` — adapted from loading.io Pure CSS Spinner examples; source metadata marks CC0.
- `cssloaders-github/` — adapted from the MIT-licensed cssloaders.github.io collection.
- `loaders-css/` — adapted from the MIT-licensed loaders.css project by Connor Atherton.
- `uiverse/` — selected community loading patterns. Verify the individual Uiverse component page before mass-importing more snippets.
- `darma/` — Darma original seed loaders from earlier sprints.

The generator rejects global selectors, external assets, scripts, unscoped fixed overlays, unsafe universal selectors, duplicate IDs, and invalid JSON. It scopes classes and keyframes before writing generated files.
