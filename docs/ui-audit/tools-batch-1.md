# Tools UI Refactor — Batch 1

**Date:** 2026-07-19
**Baseline:** commit `9b77a9c` (Foundation Patch 1 — see [foundation-patch-1.md](foundation-patch-1.md))
**Tools:** beam-calculator, css-clamp-generator, favicon-app-icon-generator, css-loaders

---

## 1. Final status

**Complete with non-blocking follow-ups.**

All confirmed defects in the four selected tools are fixed and browser-verified at
390×844, 768×1024, 1024×768 and 1440×900 in light and dark (`data-mode`) themes:
**0 of 32 post-change checks show page overflow, narrow prose, or tab issues.**
No shared component was modified. No functionality, output, preset, copy/download
or SEO behavior changed. Manifests untouched.

## 2. Baseline defects (browser-measured before any edit)

32 baseline screenshots: `docs/ui-audit/screenshots/tools-batch-1/before/`
(4 tools × 4 viewports × 2 themes). Raw measurements: scratchpad
`out/batch1-before.json`.

| Tool | Defect | Measured |
|---|---|---|
| beam-calculator | Page overflow @390 | doc **500** vs vw 390, both themes |
| beam-calculator | "Loads" description prose collapsed | **62px** @390, **80px** @1024/1440 |
| css-clamp-generator | Page overflow @390 | doc **420** vs vw 390 |
| favicon-app-icon-generator | Page overflow @390 (state-dependent, appears once generated demo assets render) | doc **412** vs vw 390 |
| favicon-app-icon-generator | `role="tablist"` without arrow-key navigation | ArrowRight left selection unchanged |
| css-loaders | Detail modal cut off at bottom @390 | panel top=24, bottom=**868** vs vh 844 |
| css-loaders (non-defects) | No page overflow at any viewport; search/filters/empty-state fine; reduced motion works (animation-duration 1e-06s) | — |

Not defects, verified as such:
- The css-loaders "card height spread 197–2504px" from the earlier probe was the
  page's how-to `<article>` matching a loose selector. Actual loader cards span
  **197–271px** — normal content variation. No equal-height defect.
- A decorative `<path>` in the `uiverse-delivery-truck` loader extends 59px past
  its SVG at 390 but is invisible (SVG clips; page doc stayed 390). It lives in
  **generated loader preview content**, which this batch is prohibited from
  editing. Documented only.

## 3. Root-cause analysis

### beam-calculator @390 and css-clamp-generator @390 — same CSS pattern, separate local code

Both tools declare a two-column workspace grid that collapses to a single
column below its breakpoint:

- beam: `grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]`
  ([BeamCalculatorClient.tsx:825](../../src/app/tools/beam-calculator/BeamCalculatorClient.tsx))
- clamp: `grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]`
  ([CssClampClient.tsx:277](../../src/app/tools/css-clamp-generator/CssClampClient.tsx))

Below the breakpoint the columns are gone, so the `minmax(0,…)` guards no longer
apply; the implicit single track is `auto`, and grid items default to
`min-width: auto`. The track therefore resolved to the children's **min-content**
width (measured live: beam track **484px** in a 358px container; clamp track
**383px** in 316px) and the page scrolled sideways.

Diagnosis note for future work: two plausible-looking instruments gave wrong
answers first (a top-down rect walk saw "no child exceeds viewport" because the
overflowing boxes start at x=16 and the *scroll* extent, not any single rect,
exceeds the viewport; a forced-width squeeze test measured the wrong quantity).
The decisive probe was reading `gridTemplateColumns`/`scrollWidth` off the grid
itself.

### Shared vs local decision

**Two local implementation problems with the same pattern — no shared fix.**
Both grids are hand-written in tool-local files; neither goes through a shared
layout component (registry `layoutType` notwithstanding — see the Foundation
Patch 1 consumer counts). The identical `min-w-0` fix was applied to each file
individually. A third and fourth occurrence of the same pattern surfaced later
in favicon (below), reinforcing that this is a *pattern* to watch in review, not
a shared component to build: the faulty grids share nothing but idiom.

### beam-calculator desktop prose collapse — local, not `ControlSection`

The description in the "Loads" `ControlSection` rendered at 62–80px because the
header's `action` slot held a **~254px three-button toolbar** (`shrink-0` by
design) inside a ~380px controls column. Survey of all 8 route-reachable
`ControlSection`+`action` consumers at 390 and 1440:
**only beam-calculator squeezed (1 of 8)** — every other consumer passes a
compact action. Per the batch rule, the shared component is untouched; the fix
is local: the toolbar moved from the header `action` slot into the section body
as a full-width wrapping row, in both
[BeamLoadEditor.tsx](../../src/app/tools/beam-calculator/components/BeamLoadEditor.tsx)
and [BeamSupportEditor.tsx](../../src/app/tools/beam-calculator/components/BeamSupportEditor.tsx)
(the support editor has the identical structure; it escaped the survey only
because its buttons render in custom-supports mode).

### favicon-app-icon-generator @390 — third occurrence of the grid pattern

`FileChecklist`'s `grid gap-4 lg:grid-cols-2`
([FaviconAppIconClient.tsx](../../src/app/tools/favicon-app-icon-generator/FaviconAppIconClient.tsx))
resolved its collapsed track to **375.25px** in a 316px container — sections had
`min-width: auto`. Same fix: `min-w-0` on both section children.

### css-loaders modal @390 — `space-y` margin on a fixed overlay

`.css-loaders-modal-root` is `position: fixed; inset: 0` but is rendered inline
inside a `space-y-6` wrapper. Tailwind's sibling selector applies
`margin-top: 24px`, and **fixed-position boxes still honor margins**, so the
root sat at y=24 with height 820, while the mobile panel is `100dvh` (844px) —
its bottom 24px (including part of the footer action bar) fell below the
viewport. Fixed with `margin: 0 !important` on the root in
[styles.css](../../src/app/tools/css-loaders/styles.css) (`!important` because
the space-y sibling selector out-specifies a single class; a margin on a
full-viewport fixed overlay is never intended). Panel now measures exactly
0→844.

## 4. Favicon tab decision

**Kept custom; not migrated to shared `Tabs`.** The preview-mode tabs are
two-line cards (bold label + detail line such as "tab, search, small sizes",
left-aligned, wrapping). The shared `Tabs` renders single-line uppercase mono
pills in a horizontal scroll strip — expressing the label+detail presentation
would mean overriding most of the shared styling, i.e. duplicating a component
to defeat it. The baseline concern ("unreachable tabs") did **not** reproduce:
the strip wraps to two rows and never clips.

The one real gap was keyboard behavior: `role="tablist"` promises arrow-key
navigation and none existed. The smallest correction was applied — an
`onKeyDown` handler (ArrowLeft/ArrowRight/Home/End, wrapping, focus follows
selection) mirroring the shared `Tabs` semantics. Verified in-browser:
ArrowRight → tab 2 selected+focused, End → tab 3, Home → tab 1.

## 5. css-loaders audit result

Beyond the modal-margin fix, **audited — no material UI defect requiring code
changes in this batch**:

- Default directory, search with many matches ("spin" → 48), search with no
  matches (empty state shown), category filter: all clean, no overflow.
- Loader cards 197–271px — consistent density, names/tags don't collapse.
- Modal: opens at all viewports, Escape dismisses, body scroll locked, 9 copy
  buttons + close reachable, code `<pre>` scrolls inside its panel,
  fits viewport at 1440 (1280×860) and — after the fix — at 390 (390×844).
- Reduced motion: loader animations measure `animation-duration: 1e-06s` under
  `prefers-reduced-motion` (both the global rule and the tool's own
  `@media` block at styles.css:1505 apply).
- `LoaderDetailDrawer.tsx` is **dead code** — never imported, and its
  `css-loaders-drawer-*` classes have no CSS anywhere. The modal is the only
  detail view at every width. Left in place (deleting it is cleanup outside this
  batch's UI scope); flagged for removal.

## 6. Files changed

| File | Change |
|---|---|
| `src/app/tools/beam-calculator/BeamCalculatorClient.tsx` | `min-w-0` on both workspace-grid children + comment |
| `src/app/tools/beam-calculator/components/BeamLoadEditor.tsx` | Add-load toolbar moved from `ControlSection` `action` slot to body row |
| `src/app/tools/beam-calculator/components/BeamSupportEditor.tsx` | Same for add-support toolbar |
| `src/app/tools/css-clamp-generator/CssClampClient.tsx` | `min-w-0` on both workspace-grid children + comment |
| `src/app/tools/favicon-app-icon-generator/FaviconAppIconClient.tsx` | `min-w-0` on the two `FileChecklist` sections; arrow/Home/End keyboard nav on the preview-mode tablist |
| `src/app/tools/css-loaders/styles.css` | `margin: 0 !important` on `.css-loaders-modal-root` + comment |

No shared components, no other tools, no `package.json`/`package-lock.json`.

## 7. Before/after measurements

| Measurement | Before | After |
|---|---|---|
| beam doc width @390 | 500 | **390** |
| beam workspace track @390 | 484px | **358px** (container width) |
| beam "Loads" prose @390 / @1440 | 62px / 80px | **328px / 346px** (full column) |
| beam add-load buttons | beside header, squeezing it | full-width row; Point 76px, UDL 71px, Moment 95px, all visible |
| clamp doc width @390 | 420 | **390** |
| clamp workspace track @390 | 383px | **316px** |
| favicon doc width @390 (generated state) | 412 | **390** |
| favicon `FileChecklist` track @390 | 375.25px | container width |
| favicon tablist ArrowRight | no-op | selection+focus advance; End/Home work |
| css-loaders modal box @390 | top 24 → bottom 868 (24px cut) | **top 0 → bottom 844** (exact fit) |
| Page overflow, all 4 tools × 4 viewports × 2 themes | 3 tools failing @390 | **0 / 32 failures** |
| Narrow prose (excluding generated previews) | beam ×3 viewports | **none** |

## 8. Screenshot paths

- Before: `docs/ui-audit/screenshots/tools-batch-1/before/` — 32 full-page
  (`{tool}__{w}x{h}__{theme}__before.png`)
- After: `docs/ui-audit/screenshots/tools-batch-1/after/` — 32 full-page, same
  naming, same routes/viewports/themes, plus focused crops:
  - `focus__beam-loads-prose__1440__light__after.png`
  - `focus__favicon-preview-tabs__390__light__after.png`
  - `focus__css-loaders-modal__390__light__after.png`

The modal-open state has an after screenshot only; its before state is captured
numerically (top=24/bottom=868) rather than as an image, since the fix landed
before an open-modal baseline image was taken. No fabricated "before" images.

## 9. Accessibility results

- favicon preview-mode tablist now supports ArrowLeft/ArrowRight/Home/End with
  focus following selection (verified: sel/focus indices via real key presses).
  All tabs keep natural tab stops. Wrapping unchanged; no clipping.
- beam add-load/support buttons keep their `aria-label`s; moving them into the
  body places them after the description in DOM/focus order (previously between
  title and description content) — reading order now matches visual order.
- css-loaders modal: `aria-modal`, Escape dismissal, and body scroll lock were
  already correct; the fix restored full visibility of the bottom action bar at
  390. Focus-visible outline on the panel unchanged.
- No suppressed outlines, no color-only state introduced.

### Testing note

No new unit tests: the vitest config includes only `src/**/*.test.ts` (no
`.tsx`, no DOM environment — confirmed in Foundation Patch 1), and every change
in this batch is markup/CSS-level or a JSX event handler. The keyboard behavior,
modal fit, and overflow fixes were verified behaviorally in the browser (real
key presses, measured geometry) as documented above. All 115 existing test
files (1410 tests, including beam-calculator's 7 suites) pass unchanged.

## 10. Static validation matrix

| Command | Exit | Result |
|---|---|---|
| `npm run typecheck` | 0 | ✅ clean |
| `npm run lint` | 0 | ✅ 0 errors, 77 warnings — same count as baseline; the 4 warnings in touched files (`<img>` ×3, one ref-cleanup) are on **untouched lines**, pre-existing |
| `npm run check:tools` | 1 | ⚠️ **byte-identical** to the verified pre-existing baseline failure (diff-confirmed) — not introduced, not fixed, not a pass |
| `npx vitest run` | 0 | ✅ 115 files / 1410 tests |
| `npm run build` | 0 | ✅ compiled, 137/137 pages |
| `git diff --check` | 0 | ✅ |
| `git diff -- package.json package-lock.json` | — | ✅ empty |

## 11. Browser validation matrix

4 tools × 4 viewports (390×844, 768×1024, 1024×768, 1440×900) × 2 themes
(via `data-mode`, per the corrected methodology):

- Page overflow: **0/32**
- Uncontained elements: 0 everywhere (the delivery-truck SVG path is inside the
  SVG's own clip and contributes nothing to page scroll)
- Narrow prose: 0
- Tablists: all reachable, none outside viewport, no vertical label collapse
- Console: no new errors. Remaining entries are (a) the pre-existing
  css-clamp hydration attribute warning (present in the before-baseline) and
  (b) dark-mode attribute warnings caused by the test harness itself setting
  `data-mode` after server render — an artifact, not an application bug
  (same as documented in Foundation Patch 1).

## 12. Regressions found during implementation

One, self-inflicted and fixed within the session: the first favicon edit placed
a JSX comment before the component's root element (parse error, page failed to
compile). Caught by the page-error listener on the next verification run, moved
to a JS comment above `return`. No other regressions; beam calculations, clamp
output, favicon generation and loader outputs untouched.

## 13. Issues deliberately not changed

| Issue | Why |
|---|---|
| `uiverse-delivery-truck` SVG path extends past its viewBox | Generated loader preview content — batch rules prohibit editing loader sources; invisible at page level |
| `LoaderDetailDrawer.tsx` dead code + orphaned CSS classes | Deletion is cleanup, not a UI defect; flagged for a housekeeping pass |
| css-loaders modal internal sticky-header transparency (section headings faintly visible behind the "Customize" card while scrolling) | Cosmetic, internal to the modal's scroll design; needs its own pass, not a quick patch |
| css-clamp hydration attribute warning | Pre-existing, present in baseline; outside batch scope |
| jwt-decoder hydration mismatch | Explicitly out of batch scope |
| `<img>`/ref-cleanup lint warnings in touched files | Pre-existing lines, unrelated to this batch's changes |

## 14. Recommended Batch 2

Ordered by evidence strength; final selection should follow the same
verify-first discipline:

1. **Sitewide `min-width: auto` sweep** (not a tool — a targeted check): four
   occurrences of the identical collapsed-grid pattern were found in three
   tools in this batch alone. A one-off scan of `grid-cols-[…]` usages whose
   children lack `min-w-0`, verified per-route in the browser, would likely
   clear several latent 390px overflows cheaply. Candidates surface in
   `scripts/ui-audit-static.mjs` output.
2. **fake-screen** — only real `ToolLayoutFullscreenStudio` consumer; its 25+
   fixed heights were classified "intentional workspace, needs judgment" and
   have never had a design pass; mobile scroll-depth to controls unmeasured.
3. **svg-path-editor** — static rank 2, 1291 lines of vendored CSS, 3
   click-handlers-on-divs (real keyboard a11y suspects), never browser-audited.
4. **csp-generator** — hand-rolled `overflow-x: visible` tablist (7 tabs)
   flagged in Foundation Patch 1 §14 and still unaddressed; small,
   well-bounded.

`container-query-generator` remains excluded (its only prior finding was a
false positive).
