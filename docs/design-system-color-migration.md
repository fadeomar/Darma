# Darma Design-System Color Migration (Sprint B)

Tracking doc for the app-wide semantic color-token refactor. The goal was to move
Darma from a small pastel token set to a professional semantic design-token system
(neutral slate base, indigo primary, cyan accent, strong light/dark mode) without
breaking existing pages.

## Token foundation

New semantic tokens live in `src/styles/tokens.css` (light) and `src/styles/themes.css`
(dark), grouped as: app/page backgrounds, surfaces, text, borders, primary, accent,
status (success/warning/danger/info), controls, preview, and code.

Legacy tokens (`--color-bg`, `--color-surface`, `--color-text`, `--background`,
`--textColor`, `--baseColor`, etc.) are **kept and remapped** to the new semantic
tokens — older tools that reference them continue to work. Do not delete these.

Tailwind aliases for the new tokens were added in `tailwind.config.ts`
(`surface.*`, `tx.*`, `border.*`, `action.*`, `control.*`, `preview.*`, `code.*`)
alongside the preserved legacy aliases.

## Migrated

### Shared UI primitives
- `Button` (added `outline` variant; `soft` now uses action tokens), `Badge`
  (semantic status tokens + `info`), `Card`, `PreviewFrame` (added `default | studio |
  checkerboard | code | transparent` variants), `Tabs`, `Input`, `Select`, `Textarea`,
  `SurfaceCard`, `EmptyState`, `PageIntro`, `PageSection`, `SectionHeading`.
- `src/components/ui` has **zero** hardcoded `bg-white` / `text-slate-*` /
  `border-black/10` / `bg-black/[0.03]` matches.

### Shared tool components & layouts
- `SegmentedControl`, `CodeOutputPanel` (code surfaces use `--color-code-*`),
  `WarningPanel` (semantic status tokens), `ToolLayoutFullscreenStudio`
  (`bg-slate-950` → `PreviewFrame variant="studio"`), `ToolPage` (less glassy header).

### Navigation / shell / footer
- `SiteHeader`, `SiteFooter`, `ThemeToggle` (legacy neumorphic `soft-shadow` →
  `Button variant="secondary"`), `RootLayout` wrapper.
- `Loaders` nav item and longest-match active-route logic preserved.

### Public pages (Phase 7 P1)
- `app/page.tsx` (landing), `app/categories/page.tsx`,
  `app/categories/[slug]/CategoryClient.tsx`, `app/explore/page.tsx`,
  `app/about/page.tsx` (standalone hardcoded-dark page made theme-aware:
  gray-900→app, gray-800→surface, gray-700→inset).

### High-priority tools (Phase 7 P2)
- `color-shades/*`, `animated-background-generator/*` (ControlPanel, CodeOutput,
  PresetGallery, Configuration, client, page), `buttons-css-generator`,
  `box-shadows-generator`, `code-preview-tool`.

## Intentionally custom / hardcoded (left as-is)

These are **content/preview colors**, not app UI chrome — do not blanket-replace them.

- `animated-background-generator/components/PreviewPanel.tsx` — `bg-white/10`,
  `text-white/80` etc. are UI mockups rendered *over* the user's generated animated
  background (intentional white-on-dark contrast). Left untouched entirely.
- Color swatches, palette chips, preset thumbnails, and box-shadow preview swatches —
  rendered from inline `style` values or generated CSS.
- Generated/copyable code strings (template literals producing user output).
- Functional accent buttons (cyan / fuchsia) used as intentional color-coding.
- `Configuration.tsx` legacy gray-based controls (outside the slate/white mapping).
- The decorative gradient callout on the About page (self-contained accent that reads
  the same in both modes).

## Known follow-up (not done this sprint)

The hardcoded-color grep still returns matches in the long tail (~80 files). Most are
content or low-traffic pages. Recommended follow-up order if continuing:

- Remaining tool article pages and tool internals (`*/Article.tsx`, JSON/URL/text
  utilities, css-gradient, fake-screen, etc.).
- Older non-tool pages: `src/components/element/*`, `src/app/elements/*`,
  `src/app/element/*`, `src/app/not-found.tsx`, `src/app/tooltip/*`.
- Admin (`src/app/admin/*`, `src/components/admin/*`) — separate sprint unless visually
  broken.
- `css-loaders` local variable follow-up (Phase 8 of the plan): remap
  `--css-loaders-*` locals to `preview`/`surface` semantic tokens.

## Verification

```bash
npm run typecheck   # pre-existing errors only: lorem-ipsum test regex flag (es2018)
npm run build       # compiles successfully (Prisma DB errors expected without a DB)
npm run check:tools
npm run generate:css-loaders   # should produce no unexpected diff
```

Dark mode confirmed on a real SSR load: `body`, headings, inputs, panels, and borders
all resolve correct dark tokens. (A transient `getComputedStyle` reading anomaly seen
when toggling `data-mode` via JS in a headless browser was a tooling cache quirk, not a
CSS bug — verified by reloading with the `theme=dark` cookie.)

## Audit command

```bash
grep -RIn "bg-white\|text-slate\|border-black/10\|bg-black/\[0\.03\]\|bg-green-100\|bg-amber-100\|bg-red-100" src/app src/components src/features
```

Remaining matches should be intentional content/preview colors or the known follow-up
files above — shared UI and the main app shell must stay clean.
