# Foundation Patch 1 — shared UI foundation

**Date:** 2026-07-19
**Predecessor:** [static-ui-foundation-audit.md](static-ui-foundation-audit.md)

---

## 1. Final status

**Complete with non-blocking follow-ups.**

Six scoped shared-foundation fixes implemented, plus **one regression fix
discovered and resolved during browser validation** (`SiteHeader`) and **one
accessibility regression fix** (clipped tab focus ring). All static commands
pass except `check:tools`, which is a **verified pre-existing failure**
(byte-identical output and exit code on the clean baseline).

Corrected browser sweep complete across 20 routes × 3 viewports × 2 themes.
Page-level horizontal overflow is now **zero on every route tested except two
pre-existing cases** that are documented, not fixed, and handed to the backlog.

---

## 2. Scope completed

| # | Change | Audit ref | Outcome |
|---|---|---|---|
| 1 | Remove aggressive global word-breaking; add scoped opt-in utility | R1 | ✅ Done — **exposed one latent regression, fixed (§6)** |
| 2 | Correct focus-ring, tertiary-text, primary-button contrast tokens | R2, R3 | ✅ Done, visually confirmed both themes |
| 3 | Make `ToolPage` profile aside content-aware | R4 | ✅ Done — **correctness guard, no visible delta today (§7.6)** |
| 4 | Remove literal empty grid columns from two shared layouts | R7 | ✅ Done, one live case fixed |
| 5 | Make `Tabs`/`CodeOutputPanel` reachable on narrow viewports | R5 | ✅ Done — **plus focus-ring clipping fix (§7)** |
| 6 | Contain the `BeamResults` table horizontally | §8 pattern 1 | ✅ Done, confirmed in browser |

---

## 3. Exact files changed

| File | Change |
|---|---|
| `src/styles/base.css` | Removed `word-break` from `*` (kept `box-sizing`); added inherited `body { overflow-wrap: break-word }`, `.darma-break-token`, and `.darma-tab-strip` / `.darma-scroll-strip` scrollbar suppression |
| `src/styles/tokens.css` | `--color-text-tertiary`, `--color-primary`, `--color-primary-hover`, `--color-primary-soft`, `--color-primary-border`, `--focus-ring`; added `--tool-profile-width` |
| `src/features/tools/layouts/ToolPage.tsx` | Content-aware profile aside + conditional grid track; label/format helpers extracted |
| `src/features/tools/layouts/toolProfile.ts` | **New.** Pure `resolveToolProfile` / `formatCategory` / `audienceLabel` |
| `src/features/tools/layouts/toolProfile.test.ts` | **New.** 10 unit tests |
| `src/features/tools/layouts/ToolLayoutSingleUtility.tsx` | Slot-aware grid; placeholder column removed; sticky only when paired |
| `src/features/tools/layouts/ToolLayoutTextWorkbench.tsx` | Same |
| `src/components/ui/Tabs.tsx` | Scrollable strip, `"use client"`, arrow-key/Home/End nav, scroll-into-view, `p-1` inset so the focus ring is not clipped, rounded tabs |
| `src/components/navigation/SiteHeader.tsx` | **Added during browser validation.** `min-w-0` on the left cluster, internally-scrolling nav, `shrink-0` on nav items and the search/theme cluster |
| `src/app/tools/beam-calculator/components/BeamResults.tsx` | `overflow-y-auto` → `overflow-auto`; focusable scroll region |

`package.json` / `package-lock.json`: **not modified** (`git diff` empty).

---

## 4. Exact real consumer counts

Counted from real imports, not registry `layoutType`.

| Component | Real consumers | Notes |
|---|---|---|
| `Tabs` | **10** — 9 tool files + `CodeOutputPanel` | |
| `CodeOutputPanel` | **19** | |
| → combined Tabs blast radius | **27 tools** | |
| `ToolLayoutSingleUtility` | **4** | only `image-compressor-resizer` had a single-slot case |
| `ToolLayoutTextWorkbench` | **3** | only `aspect-ratio-calculator` hit the empty-column path |
| `ToolPage` | **64 call sites**, all passing `tool=` | |
| `SiteHeader` | **every route, site-wide** | |
| Token changes | **all 64 tools** + all non-tool pages | |

Registry `layoutType` claims 25 text-workbench and 7 single-utility tools; only
**3** and **4** actually import those layouts.

---

## 5. Static fixes (pre-browser)

As implemented in §2 items 1–6. Key detail on R1: `word-break: break-word` is a
deprecated alias computing to `overflow-wrap: anywhere`, which participates in
intrinsic min-content sizing. Replaced with inherited `body { overflow-wrap:
break-word }` — same last-resort breaking, but **no** min-content effect, so
flex/grid children keep their natural minimum width.

All 13 `break-all` sites were audited and **kept** (UUIDs, JWTs, ISO timestamps,
URLs, filenames, shadow values, code) — they become more necessary after the
global rule is removed, not obsolete. The single `break-keep` in
`SegmentedControl` sits beside `whitespace-nowrap` and was redundant both before
and after, so it was left alone. No `overflow-x: hidden` was added anywhere.

---

## 6. Browser-discovered regressions

### 6.1 768px page overflow — **patch regression, FIXED**

**Attribution method:** re-injected the pre-patch rule (`* { word-break:
break-word }`) into the live page and re-measured — isolating the single
variable.

| Route | Patched `doc` | Old rule re-injected | Verdict |
|---|---|---|---|
| `/` (homepage, untouched by patch) | 1082 | **768** | **Patch-attributable** |
| `/tools/qr-code` | 1082 | **768** | **Patch-attributable** |

**Root cause:** `SiteHeader` renders 9 nav items (~1086px of content) plus a
search button and theme toggle, and the desktop nav activates at `md` (768px).
Neither flex child had `min-w-0`, so neither could shrink. The old global rule
was collapsing their min-content width to hide it — squeezing header text into
unreadably narrow columns. Removing the rule exposed a header that **never
actually fit at 768px**.

**Fix:** `min-w-0` on the left cluster, `overflow-x-auto` on the desktop nav so
it scrolls internally, `shrink-0` + `whitespace-nowrap` on nav items, `shrink-0`
on the search/theme cluster. Same containment principle as the `Tabs` fix. No
`overflow-x: hidden`, no breakpoint change, no functionality removed.

**Verified:** all 20 routes now report `doc = 768, uncontained = 0` at 768px,
including the untouched homepage.

### 6.2 Tab focus ring clipped — **patch regression, FIXED**

`overflow-x: auto` forces `overflow-y` to a scrolling value, so the strip
clipped the 4px focus ring: strip height 40, tab height 38, **1px of room**.

**Fix:** `p-1` on the strip (4px inset) and `rounded-full` on tabs, matching
`SegmentedControl`'s existing pattern. Post-fix: strip 48, tab 38, **5px room
top and bottom**, ring fits in both themes. Confirmed visually
([screenshot](screenshots/foundation-patch-1/focus-ring-on-tab__1440x900__light__after.png)).

A first attempt also added `gap-1`; that widened strips and pushed
`css-clamp-generator` from 412→440px. `gap-1` was reverted (cosmetic only);
`p-1` retained (required for the ring). Net residual widening on that one
already-overflowing route: +8px.

---

## 7. Additional fixes made during browser validation

1. `SiteHeader` containment (§6.1).
2. `Tabs` `p-1` focus-ring room (§6.2).
3. `.darma-scroll-strip` utility generalised from `.darma-tab-strip`.

**No other UI changes were made.** The two remaining overflow findings were
proven pre-existing and deliberately left untouched.

---

## 8. Contrast before/after

Computed from sRGB relative luminance; token values read back from the live DOM.

| Pair | Before | After | Target | Result |
|---|---|---|---|---|
| Focus ring vs adjacent surface (light) | **1.14** | **3.77 – 4.61** | ≥3 | ✅ |
| Focus ring vs `--color-surface-inset` (worst light) | 1.14 | **3.77** | ≥3 | ✅ |
| `--color-text-tertiary` on `--color-surface-subtle` | **4.01** | **5.02** | ≥4.5 | ✅ |
| `--color-text-tertiary` on `--color-app-bg` | 4.27 | **5.34** | ≥4.5 | ✅ |
| `--color-text-tertiary` on `--color-surface-base` | 4.61 | **5.77** | ≥4.5 | ✅ |
| `--color-text-tertiary` on `--color-surface-inset` | 3.77 | **4.71** | ≥4.5 | ✅ |
| `--color-primary-text` on `--color-primary` (buttons) | **3.39** | **4.69** | ≥4.5 | ✅ |
| Dark: `--color-primary-text` on `--color-primary` | 6.64 | 6.64 | ≥4.5 | ✅ unchanged |
| Dark: focus ring vs darkest surface | ~1.5 | **5.66 – 6.64** | ≥3 | ✅ |
| Dark: `--color-text-tertiary` on `--color-surface-raised` | 4.92 | 4.92 | ≥4.5 | ✅ unchanged |

Token values: `--color-text-tertiary` `#7a7368` → `#6b6456`; `--color-primary`
`#f05a28` → `#cc4715`; `--color-primary-hover` `#d9461d` → `#b23c10`.

**Live DOM readback confirms correct per-theme resolution:**

- light: `--focus-ring: 0 0 0 2px #fffdf8, 0 0 0 4px #cc4715`
- dark: `--focus-ring: 0 0 0 2px #191917, 0 0 0 4px #ff6a3d`

Dark mode inherits correctly through `var()` at use time — no duplicate
definition needed, and dark was **not degraded**.

**Disabled states:** `Button` retains `disabled:opacity-45`, unchanged. The
deeper base colour marginally increases disabled contrast. Disabled controls
remain visually distinct from enabled ones.

---

## 9. Browser routes, viewports and themes

**Methodology correction (important):** Darma switches theme via
`<html data-mode>` ([ThemeProvider.tsx:12](../../src/components/ThemeProvider.tsx)),
**not** `prefers-color-scheme`. An initial sweep using Playwright's
`colorScheme: "dark"` returned **identical light-mode tokens for both passes** —
those dark results were invalid. The corrected sweep sets `data-mode` explicitly
via an init script. Dark-mode results below come only from the corrected run.

**Tab reachability was also re-measured.** The earlier metric used `offsetLeft`,
which is relative to `offsetParent` rather than the tablist, producing
impossible readings. The corrected metric computes each tab's position within
the scroll content (`rect.left − listRect.left + scrollLeft`) and adds a
behavioural check that scrolls the strip to its end.

### Routes (20)

`/tools/container-query-generator`, `/tools/glassmorphism-generator`,
`/tools/jwt-decoder`, `/tools/aspect-ratio-calculator`, `/tools/beam-calculator`,
`/tools/favicon-app-icon-generator`, `/tools/css-loaders`, `/tools/fake-screen`,
`/tools/css-clamp-generator` (metadata-lightest, 4),
`/tools/app-screenshot-mockup-generator` (metadata-heaviest, 11),
`/tools/animated-background-generator`, `/tools/csp-generator`,
`/tools/border-radius-generator`, `/tools/uuid-generator`, `/tools/color-shades`,
`/tools/text-cleaner`, `/tools/qr-code`, `/tools/image-compressor-resizer`,
`/` and `/tools` (non-tool overflow controls).

That covers 9 `CodeOutputPanel` consumers, both live layout-consumer categories,
both metadata extremes, and two untouched control routes.

Viewports: **390×844, 768×1024, 1440×900**. Themes: **light and dark**.

### Results by viewport

**390×844** — page-level overflow on 2 of 20 routes, both **pre-existing**:
`beam-calculator` (doc 500) and `css-clamp-generator` (doc 420). All 18 others
`doc = 390`, clean. All tab strips reachable.

**768×1024** — **0 of 20 routes** with page-level overflow after the
`SiteHeader` fix (was 20 of 20 before it). Every route `doc = 768,
uncontained = 0`.

**1440×900** — 0 of 20 routes with page-level overflow. Full nav visible,
profile asides balanced at both metadata extremes.

**Light and dark** — identical structural results. Dark tokens verified applying
correctly. No dark-only defects found.

### Tab reachability (390px, corrected metric)

| Route | Tabs | scrollWidth | clientWidth | maxScroll | Unreachable | Last visible at end |
|---|---|---|---|---|---|---|
| csp-generator | **10** | 649 | 280 | 369 | **0** | ✅ |
| color-shades | **10** | 1253 | 314 | 939 | **0** | ✅ |
| container-query-generator | 9 | 585 | 280 | 305 | **0** | ✅ |
| glassmorphism-generator | 8 | 574 | 280 | 294 | **0** | ✅ |
| animated-background-generator | 7 | 557 | 322 | 235 | **0** | ✅ |
| border-radius-generator | 7 | 477 | 280 | 197 | **0** | ✅ |
| jwt-decoder | 5 | 362 | 288 | 74 | **0** | ✅ |
| app-screenshot-mockup-generator | 6 | 386 | 280 | 106 | **0** | ✅ |

**Zero unreachable tabs across every shared strip.** No label collapsed
vertically (max tab height 38px everywhere). No strip pushed page-level
overflow.

### Keyboard navigation (10 strips)

`ArrowRight` advanced selection **and** focus on all 10; `ArrowLeft` returned;
`End` jumped to the last tab and scrolled it into view (e.g. csp-generator
`scrollLeft = 369`); `Home` returned to index 0 with `scrollLeft = 0`.
**Active tab visible after `End`: true on all 10.** Existing Tab-key stops
unchanged (roving tabindex deliberately not introduced).

### Focus-ring visibility

Measured with real keyboard focus (`element.focus()` does not set
`:focus-visible` in Chromium):

- light: `rgb(255,253,248) 0 0 0 2px, rgb(204,71,21) 0 0 0 4px`
- dark: `rgb(25,25,23) 0 0 0 2px, rgb(255,106,61) 0 0 0 4px`

Both render fully, unclipped, after the `p-1` fix.

### BeamResults containment

`overflow-auto` wrapper confirmed. **Zero** `TABLE-NO-SCROLL` findings across all
routes and viewports — the `min-w-[28rem]` table scrolls inside its own wrapper.
(The route still has a *separate* pre-existing 390px overflow — §12 — which is
not the table.)

### Slot-aware layouts

**Zero** empty reserved columns across all routes/viewports.
`aspect-ratio-calculator` (the one live case) renders a real single column. All
4 `SingleUtility` and 3 `TextWorkbench` consumers render correctly; mobile
ordering unchanged (DOM order preserved).

### ToolPage

Profile aside renders correctly at both metadata extremes — `css-clamp-generator`
(4 values) and `app-screenshot-mockup-generator` (11). No empty aside anywhere.
See §14 for the accurate characterisation.

### Browser console errors

| Error | Routes | Assessment |
|---|---|---|
| Hydration text mismatch | `/tools/jwt-decoder` | **Pre-existing** — present in the very first sweep before the `SiteHeader`/`Tabs` changes |
| Hydration attribute mismatch | `css-clamp-generator`, `container-query-generator`, `glassmorphism-generator` (dark pass) | Artefact of the test harness setting `data-mode` post-render; not reproducible in normal use |
| 404 resource | `/tools/border-radius-generator` | **Pre-existing**, unrelated to this patch |

**No console errors attributable to `Tabs` becoming a client component.**

---

## 10. Screenshot paths

All under `docs/ui-audit/screenshots/foundation-patch-1/`. **Post-fix only** — no
legitimate pre-patch source state was captured, so these are labelled `after`
and no before/after comparison is claimed.

| File | Shows |
|---|---|
| `container-query-generator__390x844__light__after.png` | 390px, incl. the generated preview that produced the false positive |
| `aspect-ratio-calculator__1440x900__light__after.png` | Slot-aware layout, no empty column |
| `beam-calculator__390x844__light__after.png` | Table containment + the pre-existing 390px overflow |
| `csp-generator-10tabs__390x844__light__after.png` | Highest tab count (10) at 390px |
| `focus-ring-on-tab__1440x900__light__after.png` | Focus ring unclipped on a tab |
| `border-radius-generator__1440x900__dark__after.png` | Representative dark-mode route |
| `csp-generator__768x1024__light__after-header-fix.png` | 768px header fits after the fix |

---

## 11. Validation command matrix

| Command | Exit | Result |
|---|---|---|
| `npx prisma generate` | 0 | ✅ Client regenerated (v6.5.0) |
| `npm run typecheck` | 0 | ✅ Pass, clean |
| `npm run lint` | 0 | ✅ 0 errors, 77 warnings — **all pre-existing**, zero in any changed file (grep-verified) |
| `npm run check:tools` | **1** | ⚠️ **Verified pre-existing failure** — see §12 |
| `npx vitest run` | 0 | ✅ 115 files, 1410 tests |
| `npm run build` | 0 | ✅ "Compiled successfully in 69s", 137/137 static pages |
| `git diff --check` | 0 | ✅ No whitespace/conflict errors |
| `git diff -- package.json package-lock.json` | 0 | ✅ **Empty — no dependency or lockfile changes** |
| `git status --short` | — | 8 modified, 4 untracked; all expected |

`npm run build` emits `prisma:error … Can't reach database server at
ep-lucky-wildflower-…neon.tech:5432` during static generation. This is
**environmental** (no database reachable from this machine), non-fatal, exit 0,
and unrelated to this patch.

---

## 12. Pre-existing failures (not introduced, not fixed here)

### `check:tools` — exit 1

Exact output, identical on both the patched tree and the clean baseline:

```
Related tools that are not public:
- password-generator -> csp-generator

Featured tools without pinned sorting:
- aspect-ratio-calculator
- base64-encoder-decoder
- code-preview-tool
- jwt-decoder
- markdown-previewer
- qr-code
- regex-tester
- text-cleaner
```

**Verification:** the patch was stashed, `check:tools` re-run on the clean tree,
and the output `diff`'d — **byte-identical, same exit code 1**. This patch
touches no registry file. **Verified pre-existing; not introduced by this patch.
This is NOT a pass.**

### `beam-calculator` — 390px page overflow (doc 500 vs vw 390)

Persists identically with the old global rule re-injected → **pre-existing**.
Offender is `div.space-y-5` (`min-width: auto`) at width 484; the leaf nodes are
ordinary text inheriting that width. **Not** the results table (which is now
correctly contained).

### `css-clamp-generator` — 390px page overflow (doc 420 vs vw 390)

Persists identically with the old rule re-injected → **pre-existing** (baseline
412). Same `div.space-y-5` pattern. This patch contributes +8px via the required
`Tabs` `p-1`.

### `beam-calculator` — narrow prose at 1440px

`ControlSection` description compressed to 80px because the flex `action`
sibling (a 254px `SegmentedControl`) squeezes the text side. **Identical with the
old rule re-injected → pre-existing.**

### Others

- `/tools/jwt-decoder` hydration text mismatch.
- `/tools/border-radius-generator` 404 resource.

---

## 13. False-positive findings

### The "44px paragraph" on `container-query-generator`

**Not a defect.** Traced to `grid-template-columns: 140px 1fr` originating at
[containerQuery.ts:99](../../src/app/tools/container-query-generator/containerQuery.ts) —
a **CSS rule the tool itself generates** as its live container-query preview. The
measured element is inside the tool's own demo card, correctly demonstrating what
a `140px 1fr` grid does in a narrow container. This is generated preview output,
not application chrome. **The validation selector was at fault, not the UI.**

### Earlier `TAB-UNREACHABLE` readings

The first sweep's `offsetLeft`-based metric reported e.g. 5 of 5 tabs unreachable
on `jwt-decoder` while `scrollWidth === clientWidth` (nothing scrollable).
**Faulty test measurement**, corrected in §9.

### Narrow "prose" on `uuid-generator` and `/tools`

`"10 value(s) · JSON"` (86px) and `"63 of 63 tools"` (88px) are short metadata
labels sized to their content inside wrapping flex rows, not collapsed prose.
Selector over-matching.

---

## 14. Known remaining UI issues / backlog

| # | Issue | Route(s) | Viewport | Status |
|---|---|---|---|---|
| 1 | Page overflow, `div.space-y-5` `min-width:auto` | `beam-calculator` | 390px | **Backlog** — pre-existing |
| 2 | Page overflow, same pattern | `css-clamp-generator` | 390px | **Backlog** — pre-existing (+8px from this patch) |
| 3 | Medium-width `SiteHeader` nav UX — nav scrolls correctly but the active item can sit partially out of view at 768–1023px | site-wide | 768px | **Backlog, non-blocking** — strictly better than the prior page overflow; wants active-item scroll-into-view or a breakpoint review |
| 4 | `ControlSection` header text squeezed by a wide `action` sibling | `beam-calculator` +others | 1440px | **Backlog** — pre-existing, likely shared |
| 5 | `Field` label association (R6) | shared | — | Deferred |
| 6 | Sidebar-width / sticky-offset tokens (R8), incl. 6rem vs 7rem conflict | shared | — | Deferred |
| 7 | `CodeOutputPanel` 352px empty state (R9) | 19 tools | — | Deferred |
| 8 | `SegmentedControl` fixed `grid-cols-3` (R10) | ≤22 tools | — | Deferred |
| 9 | 59 fixed-height hydration skeletons (R11) | 59 tools | — | Deferred |
| 10 | `Input` weak invalid-state ring (10% alpha) | shared | — | Deferred |
| 11 | Hand-rolled `role="tablist"` with `overflow-x: visible` | `csp-generator`, `favicon-app-icon-generator` | 390px | Deferred |
| 12 | `ToolPage` header height / title duplication (§5.2 of audit) | 59 tools | — | Deferred |
| 13 | `jwt-decoder` hydration mismatch | 1 route | — | Backlog, pre-existing |

---

## 15. Post-fix ranking

Based on **browser evidence**, not static score. Static ranks shown for contrast.

| Rank | Tool | Static rank | Browser evidence | Severity |
|---|---|---|---|---|
| 1 | **beam-calculator** | 29 | Confirmed 390px page overflow (doc 500 vs 390) **and** confirmed 1440px prose collapse to 80px | High |
| 2 | **css-clamp-generator** | 59 | Confirmed 390px page overflow (doc 420 vs 390) | High |
| 3 | **favicon-app-icon-generator** | 8 | 390px overflow resolved by the header fix, but retains a hand-rolled `overflow-x: visible` tablist + dialog | Medium |
| 4 | **css-loaders** | 1 | No page overflow found; sole `directory`-layout consumer with modal + drawer, still unexercised | Medium |
| — | container-query-generator | 34 | **Demoted** — its only finding was a false positive | Low |
| — | fake-screen | 5 | **Demoted** — no page overflow at any viewport; fixed sizing is intentional workspace behaviour | Low |
| — | svg-path-editor | 2 | Not browser-tested; static rank alone is insufficient | Unknown |

Note how weakly static rank predicted real defects: the two worst confirmed
routes ranked **29th and 59th**, while the top two static scorers produced no
confirmed page-level defect.

---

## 16. Recommended first per-tool batch

### 1. `beam-calculator` — **highest priority**

- **Problem:** page-level horizontal overflow (doc 500 vs viewport 390); separately, `ControlSection` description prose collapses to 80px at 1440px.
- **Viewport:** 390×844 (overflow), 1440×900 (prose).
- **Severity:** High — the whole page scrolls sideways on mobile.
- **Root cause:** `div.space-y-5` resolving `min-width: auto` at 484px; a descendant sets a floor the container cannot shrink below. The prose issue is a wide flex `action` sibling starving the text column.
- **Local or shared:** overflow is **local**; the `ControlSection` header squeeze is likely **shared** and should be confirmed across other consumers before fixing.
- **Why Batch 1:** the only route with a confirmed, reproducible, high-severity mobile defect, and the pre-existing baseline is already measured.

### 2. `css-clamp-generator`

- **Problem:** page-level horizontal overflow (doc 420 vs viewport 390).
- **Viewport:** 390×844.
- **Severity:** High.
- **Root cause:** same `div.space-y-5` / `min-width: auto` pattern as beam-calculator.
- **Local or shared:** likely **shared** — two independent tools exhibiting one pattern is the abstraction threshold from the original audit. Diagnose together with #1.
- **Why Batch 1:** pairing it with beam-calculator is what determines whether this is one shared root cause or two local ones. Also removes this patch's +8px residual.

### 3. `favicon-app-icon-generator`

- **Problem:** hand-rolled `role="tablist"` with `overflow-x: visible` that the shared `Tabs` fix does not reach; plus a `role="dialog"` never height-tested against the viewport.
- **Viewport:** 390×844.
- **Severity:** Medium — tab clipping is functional, not cosmetic.
- **Root cause:** local tablist bypassing the shared component.
- **Local or shared:** **local** — migrate it onto the now-correct shared `Tabs`.
- **Why Batch 1:** directly completes the R5 work; the shared fix is already proven, so this is low-risk adoption.

### 4. `css-loaders`

- **Problem:** no page overflow found, but it is the sole consumer of the 632-line `ToolLayoutDirectory` and the only tool with both a modal and a drawer — neither exercised by this sweep.
- **Viewport:** 390×844 primarily.
- **Severity:** Medium (unknown-risk rather than confirmed defect).
- **Root cause:** unexercised bespoke layout surface.
- **Local or shared:** effectively **local** (one consumer).
- **Why Batch 1:** the largest remaining un-validated UI surface; include it to close the coverage gap, not because of its static score.

**Deliberately excluded:** `container-query-generator` (finding was a false
positive) and `fake-screen` (no confirmed defect; its fixed sizing is intentional
workspace behaviour). Neither should be picked up on static score alone.
