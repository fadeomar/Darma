# CSS Button Generator / Button Studio

Design production-ready buttons visually, start from curated live examples, tune real interaction states, compare variants, and export reusable front-end code.

## Current studio capabilities

- Live examples gallery with browser-local favorites and Inspire me.
- Style, shape, size, gradient, border, shadow, typography, searchable icons/custom symbols, and loading controls.
- Independent hover and active state overrides plus focus-ring controls.
- Default, hover, active, focus, disabled, and loading previews.
- Normal and reduced-motion simulation.
- Desktop, tablet, and mobile preview frames, including an optional mobile-only full-width rule.
- Mouse, touch, and keyboard input simulation mapped to hover, active, and focus-visible states.
- A/B compare mode: freeze a baseline, edit the current version, then keep A or B.
- Undo/redo history for visual edits, with Ctrl/⌘ Z and Shift+Ctrl/⌘ Z / Ctrl+Y shortcuts outside form fields.
- Canvas, landing, form, pricing, and checkout contexts.
- Button Family Generator for primary, secondary, outline, ghost, success, and danger roles.
- Automatic light/dark theme pair generation with dark-surface contrast adjustments.
- Versioned shareable configuration links that restore the button, preview surface, context, device, input simulation, and motion preview locally; version 1 links migrate safely to version 2.
- CSS import for common button properties plus hover, active, and focus-visible rules.
- Scoped custom CSS declarations for advanced overrides without global selectors or remote URL rules.
- Learn mode with live CSS explanations and Inspect mode with current sizing, selector, state, viewport, and contrast details.
- Accessibility and production checks for contrast, touch height, effects, focus treatment, and motion.
- CSS, CSS variables, HTML, JSX, React-style starter, Tailwind starter, token JSON, family CSS/HTML, and theme CSS/HTML output. CSS remains the source of truth for advanced states/effects and scoped overrides.

## Privacy

`client-only` — generation, favorites, history, and preview state stay in the browser. Favorites use localStorage and no account is required.

## Files

| File | Role |
|---|---|
| `page.tsx` | Server component — metadata and tool page shell |
| `ButtonsCssGeneratorClient.tsx` | Main Button Studio state, controls, compare/history, preview, and export orchestration |
| `ButtonExamplesGallery.tsx` | Live examples, categories, copy actions, favorites, and Inspire me |
| `ButtonPreviewElement.tsx` | Shared semantic preview button and forced visual states |
| `presets.ts` | Curated button presets and default configuration |
| `generators.ts` | CSS/HTML/React/Tailwind/token generators plus accessibility helpers |
| `systems.ts` | Semantic button-family generation, dark-mode derivation, and family/theme exports |
| `systems.test.ts` | Regression tests for family/theme generation and dark-surface contrast |
| `studio-tools.ts` | Versioned/migrating share-state serialization, untrusted share normalization, CSS import, scoped override sanitization, and Learn-mode notes |
| `studio-tools.test.ts` | Regression tests for share migration, CSS import, and scoped custom CSS |
| `production-p4.test.ts` | P4 regression tests for responsive width, export parity, semantics, and share hardening |
| `production-p5.test.ts` | P5 regression tests for loading semantics, contrast helpers, JSX safety, and class-name hardening |
| `production-p6.test.ts` | Final preset-quality regressions for contrast, focus visibility, touch-height defaults, and output integrity |
| `types.ts` | Studio configuration and preset types |
