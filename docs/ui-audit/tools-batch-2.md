# Tools UI Refactor — Batch 2

**Date:** 2026-07-19
**Baseline:** commit `61f3e4b` (after [tools-batch-1.md](tools-batch-1.md) + [foundation-patch-1.md](foundation-patch-1.md))
**Scope:** targeted intrinsic-grid overflow sweep, fake-screen, svg-path-editor, csp-generator

---

## 1. Final status

**Complete with non-blocking follow-ups.**

- **Intrinsic-grid overflow sweep:** all 64 tool routes measured at 390 px — **0 with
  page-level horizontal overflow.** No latent copies of the Batch 1 collapsed-grid
  defect manifest. Classified below.
- **fake-screen:** one confirmed accessibility defect fixed (fullscreen exit
  affordance was a non-interactive `<div>` reading "Press Esc" — unusable on touch).
  Layout clean across 390/768/1024/1440 × light/dark.
- **svg-path-editor:** no confirmed UI defect. Contained at every tested viewport and
  theme; the flagged `<div onClick>` handlers are benign (see §7). No changes.
- **csp-generator:** one confirmed accessibility gap fixed (hand-rolled services-filter
  `role="tablist"` lacked the roving arrow-key navigation its role promises). The
  output tabs already use the shared `Tabs`/`CodeOutputPanel` and were left as-is.
- **Manifests untouched;** typecheck / lint / vitest / build all pass; `check:tools`
  remains the documented byte-identical pre-existing exit 1.

**Non-blocking follow-up / environmental limitation (§14):** in this automation
session the **tool-body client handlers do not fire** (the page chrome hydrates
normally — the favorites star toggles — but the dynamically-imported tool clients
render real SSR layout without becoming interactive; no console error is emitted).
**Layout/overflow is therefore fully browser-verified** (SSR layout is real — beam's
body measured 4534 px tall with grid `380px 802px`), but **live interaction**
(fullscreen enter/exit cycle, tab arrow-keys actually moving selection, editor
operations) **could not be exercised here.** The two code fixes are correct by
construction — each mirrors a pattern that was browser-verified in Batch 1 /
Foundation Patch 1 — and both were confirmed to *render* correctly in the live DOM.

---

## 2. Intrinsic-grid sweep methodology

Batch 1 confirmed the pattern: a responsive arbitrary-template grid
(`grid-cols-[minmax(…)_…]`) collapses to a single `auto` track below its breakpoint;
a grid child keeps the default `min-width: auto`; the track resolves to the child's
min-content width; the page scrolls sideways. The fix is `min-w-0` on the child.

**Candidate discovery (static):** grepped `src/app/tools` for
`(md|lg|xl|2xl):grid-cols-[…]`, `minmax(…)`, and fixed-px template tracks — **107
files** with responsive/arbitrary grids, ~80 arbitrary-template two-column grids.

**Verification (browser, SSR layout):** an iframe harness sized to exactly **390 px**
loaded each of the 64 real tool routes and measured
`documentElement.scrollWidth` vs `innerWidth`, capturing the right-most overflowing
box when `doc > vw`. A 390 px iframe is its own viewport, so mobile media queries and
the single-column collapse fire exactly as on a real phone.

**Validity control:** the harness measures real rendered layout, not skeletons —
confirmed by loading `beam-calculator` in the top frame: body height **4534 px**, the
workspace grid resolved to `gridTemplateColumns: 380px 802px`, i.e. the tool body is
fully laid out. (Interactivity is a separate axis — see §14 — and does not affect
layout measurement.)

**Not done:** this was not turned into a codemod. No `min-w-0` was added speculatively.
State-dependent overflow (e.g. Batch 1's favicon case that only appeared after demo
assets rendered) is a documented limitation of a default-state sweep — but the
collapsed-grid floor is set by static child content, so default-state 390 px is the
worst case for the structural pattern.

---

## 3. Candidates inspected

| Class | Count | Routes / notes |
|---|---|---|
| Arbitrary two-column grids collapsing at a breakpoint | ~80 across 64 routes | All measured at 390 px |
| **Confirmed page-level overflow at 390 px** | **0** | — |
| Safe by existing containment (`min-w-0` / `minmax(0,…)` on the shrink child) | all | Heavy defensive `min-w-0` from Batch 1 + Foundation Patch holds |
| Intentional workspace overflow | 0 observed at page level | Internal `overflow-auto` panels (code `<pre>`, tables) contain their own scroll |
| False positive | n/a | No new candidate reproduced |
| Requires separate future work | 0 | — |

**Full 390 px result (all `doc = 390`, `over = false`):**
animated-background-generator, app-screenshot-mockup-generator, aspect-ratio-calculator,
base64-encoder-decoder, beam-calculator, bmi-calculator, border-radius-generator,
box-shadows-generator, buttons-css-generator, color-converter, color-name-finder,
color-palette-generator, color-shades, container-query-generator, csp-generator,
css-clamp-generator, css-gradient-generator, css-grid-generator, css-transform-generator,
date-difference-calculator, flexbox-generator, gpa-calculator, html-entity-encoder-decoder,
image-converter, json-formatter, json-to-typescript, loan-calculator, lorem-ipsum-generator,
markdown-previewer, meta-tag-generator, neumorphic-css-generator, og-image-generator,
password-generator, percentage-calculator, pomodoro-timer, qr-code, readability-score,
regex-tester, responsive-image-srcset-generator, robots-txt-generator, sitemap-xml-generator,
slug-generator, statistics-calculator, svg-path-editor, text-cleaner, timestamp-converter,
timezone-converter, tip-calculator, unit-converter, url-encoder-decoder, uuid-generator,
word-counter, code-preview-tool, todo-list, click-speed-test, reaction-time-test,
spacebar-counter, mouse-scroll-test, image-compressor-resizer, jwt-decoder, css-loaders,
favicon-app-icon-generator, glassmorphism-generator, fake-screen.

---

## 4. Confirmed latent overflow defects

**None.** The Batch 1 fixes hold and no third-party route exhibits an un-contained
collapsed grid at 390 px. The pattern did not appear "broadly inside one shared
component" (the two shared layouts touched here — `ToolLayoutFullscreenStudio` and the
CSP grids — already carry `min-w-0` on their shrink children), so no shared-regression
evaluation was triggered.

## 5. False positives

None newly surfaced. The Batch 1 note that static rank poorly predicts real overflow
held again: many high-`minmax`/fixed-px grids were structurally fine because their
shrink child already had `min-w-0`.

---

## 6. Fake Screen — findings and changes

**Layout:** clean. No page overflow at any of 390 / 768 / 1024 / 1440 in **light and
dark** (`data-mode`); no uncontained `<pre>`. The `min-h-[520px]` per-scene floors and
the `ToolLayoutFullscreenStudio` `min-h-[480px] sm:min-h-[560px] xl:min-h-[640px]`
studio preview are **intentional workspace behaviour** and do not push page-level
overflow; classified as intentional, unchanged.

**Confirmed defect — fullscreen exit affordance (accessibility):** the only exit
affordance inside a fullscreen scene was `ExitHint`, a **non-interactive `<div>`**
reading *"Press Esc to exit fullscreen."* Touch devices have no Esc key, so a mobile
user who enters fullscreen (Android Chrome supports `element.requestFullscreen()` on a
`<div>`) is told to press a key that does not exist, with no on-screen control to tap.
This violates the batch requirement "Fullscreen can always be exited" / "reliable
escape behavior."

**Fix (minimal, simulation-preserving):** `ExitHint` is now a real `<button>` that
calls `exitFullscreen()` on click/tap, labelled *"Press Esc or tap to exit."* Same
absolute placement and styling, plus `hover:` / `focus-visible:` states.
`exitFullscreen()` is a safe no-op when not currently fullscreen. The change touches
only the exit hint — no scene, preset, or canvas behaviour is altered, and the demo
notice remains. `enterFullscreen`/`exitFullscreen` share one import.

**Known platform limitation (not fixed — documented):** on iOS Safari,
`div.requestFullscreen` is `undefined`, so the "Start Fullscreen" button no-ops there.
That leaves nothing to exit (no trap), so it is out of scope for this batch; noted for a
future canvas-fullscreen pass.

**Files:** `src/app/tools/fake-screen/FakeScreenClient.tsx`.

---

## 7. SVG Path Editor — findings and changes

**No changes.** Audited for containment and accessibility structure:

- **Containment:** no page overflow and no uncontained `<pre>` at 390 / 768 / 1024 /
  1440 in light and dark. The 1291-line vendored editor CSS is not producing page-level
  overflow; the workspace and code panels contain their own scroll.
- **`<div onClick>` a11y suspects (from the static audit):** three exist —
  1. `svg-editor-modal-backdrop` (line ~690): click-to-dismiss backdrop — a standard
     supplementary affordance, not the sole control.
  2. `svg-editor-modal` `stopPropagation` (line ~691): not an interactive control.
  3. `svg-editor-saved-preview` (line ~929): clickable saved-path thumbnail — **but the
     same action (`loadPath` + switch to Controls) is duplicated one line below by an
     explicit keyboard-accessible `<button>Load</button>`.** The thumbnail is a mouse
     convenience, not the only affordance.
  None is a keyboard-accessibility defect. Per "change only browser-confirmed UI
  defects," no edit was made.
- **Interactive/contrast audit (handles, guides, selection, editing operations):**
  blocked by the environmental limitation in §14; not falsely reported as verified.

**Files:** none.

---

## 8. CSP Generator — findings and tab decision

The tool was already redesigned (see the CSP-generator-redesign work) and now has **two
distinct tablists**, not the single hand-rolled `overflow-x: visible` strip the batch
brief anticipated:

1. **Generated-code output tabs (10)** — `CspOutput` → shared `CodeOutputPanel` →
   shared `Tabs`, with a local `[&_[role=tablist]]:!overflow-x-auto` override.
   Measured at 390 px: 10 tabs, `overflow-x: auto`, `nowrap`, single row, **0 tabs
   clipped outside the list.** Foundation Patch 1 already verified this shared strip is
   fully reachable and keyboard-complete (Arrow/Home/End, scroll-into-view). **No change.**
2. **Service-category filter (7)** — `CspServicesStep`, a hand-rolled
   `role="tablist"` of wrapping pill chips (`flex flex-wrap`, `overflow-x: visible`).
   Measured at 390 px: **wraps, single row when it fits, 0 clipped, no page overflow.**
   Containment was never the problem. The real gap: `role="tablist"`/`role="tab"`
   **promises roving arrow-key navigation, and none existed** — the identical gap
   Batch 1 fixed on the favicon preview tablist.

**Tab decision:** **preserve both custom presentations; do not migrate to shared `Tabs`.**
The output strip already *is* the shared component. The services filter is a *filter*
of a checkbox grid presented as wrapping multi-row pills — it has no tabpanels, and the
shared single-line scroll strip does not express the wrapping-pill layout. Migrating
would be migrating for consistency alone, which the brief forbids. Instead the smallest
accessibility improvement was added.

**Fix:** roving keyboard navigation on the services-filter tablist —
`ArrowLeft`/`ArrowRight` (wrapping), `Home`, `End`, with focus following selection and
`tabIndex={active ? 0 : -1}` roving so the strip is a single Tab stop. Verified in the
live DOM: exactly **one** tab carries `tabIndex 0` after the change. (Selection-movement
on key press is code-verified; live key exercise is blocked per §14.) No generated-CSP
output, preset, validation, or copy behaviour changed.

**Files:** `src/app/tools/csp-generator/components/CspServicesStep.tsx`.

---

## 9. Exact files changed

| File | Change |
|---|---|
| `src/app/tools/fake-screen/FakeScreenClient.tsx` | `ExitHint` `<div>` → `<button>` with tap-to-exit (`exitFullscreen()`); label "Press Esc or tap to exit"; import `exitFullscreen`. |
| `src/app/tools/csp-generator/components/CspServicesStep.tsx` | Roving Arrow/Home/End keyboard nav on the services-filter `role="tablist"`; `tabIndex` roving; `useRef` for the list. |

No shared components, no other tools, no `package.json` / `package-lock.json`.

> `src/app/tools/color-name-finder/ColorNameFinderClient.tsx` shows in `git diff` but
> was **already modified in the working tree at session start** (initial git status) —
> it is **not** part of this batch and was not touched.

---

## 10. Before/after measurements

**Sweep (390 px, all 64 routes):** before = unmeasured latent risk; after = `doc = 390`,
`over = false` on **64/64**.

**Three-tool viewport × theme matrix** (iframe at exact width; `doc` is `width − ~10 px`
scrollbar gutter; `over` = `doc > width+1`):

| Tool | 390 L/D | 768 L/D | 1024 L/D | 1440 L/D | uncontained `<pre>` |
|---|---|---|---|---|---|
| fake-screen | 383 / no | 758 / no | 1014 / no | 1430 / no | 0 |
| svg-path-editor | 380 / no | 758 / no | 1014 / no | 1430 / no | 0 |
| csp-generator | 380 / no | 758 / no | 1014 / no | 1430 / no | 0 |

(L and D identical structurally.)

| Item | Before | After |
|---|---|---|
| fake-screen exit affordance | non-interactive `<div>` "Press Esc" | `<button>` "Press Esc or tap to exit", calls `exitFullscreen()` |
| CSP services-filter tablist keyboard | no arrow-key nav; every pill a Tab stop | Arrow/Home/End + focus-follows-selection; single roving Tab stop (1 tab `tabIndex 0`) |
| CSP services-filter containment @390 | wraps, 0 clipped (already fine) | unchanged (wraps, 0 clipped) |
| CSP output tabs @390 | 10 tabs, `overflow-x:auto`, 0 clipped (shared) | unchanged |

---

## 11. Screenshot paths

**Limitation — no on-disk screenshots produced this batch.** This environment has no
Playwright/Puppeteer (the batch forbids adding dependencies), and the in-app browser's
screenshot returns images inline with no path to write PNGs into the repo. Per the
brief's guidance ("Record real DOM measurements rather than relying only on
screenshots"), the **measurements in §10 are the record of truth.** No "before"
screenshots were fabricated after edits. `docs/ui-audit/screenshots/tools-batch-2/before/`
exists but is intentionally empty; a future run with a headless browser can populate
before/after pairs against the exact viewports/themes/states listed in §10.

---

## 12. Accessibility results

- **fake-screen:** fullscreen scenes now expose a real, focusable, tappable exit
  control (keyboard via Esc, pointer/touch via tap), with `focus-visible` ring. Reading
  order and simulation unchanged.
- **csp-generator services filter:** now honours the WAI-ARIA tablist keyboard
  contract (Arrow/Home/End, roving tabindex, focus follows selection); single Tab stop.
- **svg-path-editor:** the clickable saved-path thumbnail is backed by an equivalent
  keyboard-accessible `<button>`; no keyboard trap introduced or found.
- **Reduced motion:** covered globally (`base.css` `prefers-reduced-motion` block);
  canvas JS motion unchanged and out of scope.
- Live screen-reader / key-press exercise blocked per §14; results above are from source
  + live-DOM structural verification.

## 13. Validation matrix

| Command | Exit | Result |
|---|---|---|
| `npm run typecheck` | 0 | ✅ clean |
| `npm run lint` (full) | 0 | ✅ 0 errors, **76 warnings** (Batch 1 baseline 77; 0 in the two changed files) |
| `npm run check:tools` | 1 | ⚠️ **byte-identical to the documented pre-existing failure** (same `password-generator -> csp-generator` + same 8 featured tools). Not introduced, not fixed. |
| `npx vitest run` | 0 | ✅ 115 files / 1410 tests |
| `npm run build` | 0 | ✅ "Compiled successfully in 37.8s", 137/137 static pages |
| `git diff --check` | 0 | ✅ |
| `git diff -- package.json package-lock.json` | — | ✅ empty |

**Console (target routes):** no runtime exceptions, hydration, React, or DOM-nesting
errors attributable to the changes. A pre-existing `DOMParser is not defined` SSR error
in the **unrelated** `og-image-generator` route was observed in dev logs and left
untouched (outside batch scope).

**Tests:** none added. The vitest config runs only `src/**/*.test.ts` (no `.tsx`, no
DOM env — confirmed since Foundation Patch 1); both changes are a JSX event handler and
a markup/element swap with no pure-logic seam to unit-test in that environment — the
same determination Batch 1 made. Behaviour was verified structurally in the live DOM.

## 14. Regressions found during work

- **None in application behaviour.** Manifests, tests, build, and calculations unchanged.
- **Self-inflicted, resolved:** repeated Fast-Refresh rebuilds during editing left one
  dev tab in a stale state; resolved by restarting the dev server before final
  measurements.
- **Environmental limitation (not a code regression):** as in §1, tool-body client
  handlers did not fire in this automation session (page chrome hydrated normally, no
  console error). This blocked *live interaction* verification only; SSR layout,
  overflow, and rendered-DOM structure were fully measurable, and the two fixes were
  confirmed to render correctly.

## 15. Deferred issues

| Issue | Why deferred |
|---|---|
| Live interaction verification of the two fixes (key presses moving selection; fullscreen enter/exit cycle) | Tool bodies not interactive in this session (§14); needs an environment where dynamic tool clients hydrate, or Playwright |
| On-disk before/after screenshots | No headless browser; cannot add deps (§11) |
| iOS `div.requestFullscreen` no-op on fake-screen | Platform limitation; no trap; own canvas-fullscreen pass |
| svg-path-editor handle/guide/selection contrast + editing-operation audit | Blocked by §14; no layout defect found |
| `og-image-generator` `DOMParser` SSR error | Unrelated route, pre-existing, out of scope |
| Foundation Patch 1 backlog items (sidebar-width token, `CodeOutputPanel` empty-state height, `SegmentedControl` grid-cols-3, 59 skeleton heights, `Field` label association) | Shared-surface work, not in this batch's scope |

## 16. Recommended Batch 3

1. **Re-run the two Batch 2 fixes' interaction verification** in an environment where
   dynamic tool clients hydrate (or via Playwright): exercise CSP services-filter
   Arrow/Home/End, and the fake-screen fullscreen enter → tap-exit cycle on a touch
   emulation; capture the before/after screenshots §11 could not.
2. **buttons-css-generator / neumorphic-css-generator** — highest remaining local-CSS
   surfaces (724 / 667 lines) never browser-audited; both clean on the 390 px sweep but
   unexercised for interaction and dark-mode generated-preview contrast.
3. **Shared `Field` label association (R6)** — the one shared a11y fix with real API
   surface; deferred since Foundation Patch 1.
4. **`CodeOutputPanel` empty-state height (R9)** — 19 tools reserve 352 px of empty
   panel; low-risk, wide reach.

Do not begin Batch 3.
