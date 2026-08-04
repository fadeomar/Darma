# Darma PR #37 — Phase 2 Implementation Report

**Phase 2 — Visual Foundations and Responsive Layout System**

---

## Baseline

| Item | Value |
| --- | --- |
| Branch | `new-loaders` |
| Starting commit | `e4ef7e81fd8af8ad066cd9e46610f0594d549174` (`e4ef7e8`) — matches the expected Phase 1 final commit |
| Final Phase 2 commit | see [Commits](#commits) |
| Node / npm | v24.13.0 / 11.12.1 |
| Loader stash | `stash@{0}` = `f8a65c43bcdbda30028dc8eacbf6e8ca41324fb7` — *"preserve css-loader batch-14 before phase-2"* |
| Reports used | `docs/qa/PR37_PHASE_0_BASELINE_AUDIT.md`, `docs/qa/PR37_PHASE_1_IMPLEMENTATION_REPORT.md` |

### Loader work protected

`git status --short` at the start listed **62 changes, all under
`src/app/tools/css-loaders/`** — 11 modified generated/index files and 51 new
batch-14 loader JSON files plus the `darma-research-batch-14` source directory.
No unexpected non-Loader change was present. They were stashed with
`--include-untracked` and the working tree was confirmed clean before any
application file was touched. **No commit in this phase stages a
`css-loaders` path**; each commit was checked with
`git diff --cached --name-only | grep -c css-loaders` → `0`.

### Design system found in place

| Area | State at `e4ef7e8` |
| --- | --- |
| Tokens | `src/styles/tokens.css` (light) + `src/styles/themes.css` (`[data-mode="dark"]`); semantic colour, spacing (`--space-1..16`), radii, shadow, focus-ring tokens already present |
| Typography tokens | `--text-xs..5xl`, `--leading-tight/normal/relaxed`. `--text-xs` was already `0.75rem`, but almost nothing used it — sizes were hard-coded arbitrary values |
| Breakpoints | Tailwind defaults; `sm:640 md:768 lg:1024 xl:1280 2xl:1536`. `darkMode: ["selector", '[data-mode="dark"]']` |
| Shared UI primitives | `src/components/ui/` — `Card` (5 variants × 4 paddings), `Badge` (8 variants), `Button` (6 × 4), `Input`, `Select`, `PageIntro`, `SectionHeading`, `SurfaceCard`, `PageSection` |
| Hero primitives | `src/components/portals/PortalHero.tsx` + `PortalHeroScene.tsx`, used by 8 directory routes; `.landing-hero` and `.detail-hero` in `experience.css` |
| Card variants | No documented families — `Card` supplied the surface, each caller invented its own regions |
| Footer variants | **None.** One `SiteFooter` on every route, gated only for `/admin` and `/login` |

### Measurement method

All numbers in this report are DOM measurements from a Chrome DevTools Protocol
harness driving the dev server, not estimates. Where a probe could be fooled it
was hardened first and the hardening is stated:

- **Contrast** resolves the composited backdrop by walking ancestors, and flags
  any chain containing a gradient or background image as *unreliable*. Only
  solid-backdrop failures are counted, which removed ~13 false positives per
  route (text on ink sections that the naive probe read as light-on-light).
- **Sub-12px text** uses the *rendered* size, so SVG text is multiplied by its
  viewBox scale. It excludes `.sr-only` and separates text inside
  `[aria-hidden="true"]` (decorative) from reader-facing text.
- **Overflow** ignores elements that an ancestor clips or scrolls, so data
  tables and chip rails inside their own `overflow-x` container are not counted
  as defects.
- **Grid orphans** read the laid-out last row rather than dividing item count by
  column count, so a card that spans the remaining columns is not miscounted.

"Before" values are from the Phase 0 audit where it recorded one, and otherwise
from a baseline run of the same harness against `e4ef7e8` + Phase 1.

---

## Slice A — Learning Paths overflow

**Commit** `2f8680e fix(learning): contain tablet path controls`

### Root cause

`LearningPathExplorer`'s filter grid used
`md:grid-cols-[minmax(260px,1.5fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto]`.
The three fixed track minimums (260 + 180 + 180 = 620px) plus three 12px gaps
plus the `auto` Reset column left a **748px minimum inside a card with ~646px of
content width** at 768px. The Reset `<button>` sits in the `auto` track and, as
a grid item, defaults to `min-width: auto`, so it could not shrink. It was laid
out at `left: 713, width: 92`, pushing the document to 805px.

This is `min-width: auto` **plus** fixed track minimums — not padding, and not a
wrapping failure. Confirmed independently of Phase 1's changes.

### Files changed

- `src/features/learning-paths/components/LearningPathExplorer.tsx`

### Width measurements

| Viewport | Before `scrollWidth` / `clientWidth` | Overflow | After | Overflow |
| --- | --- | --- | --- | --- |
| 320 | 310 / 310 | 0 | 310 / 310 | **0** |
| 375 | 365 / 365 | 0 | 365 / 365 | **0** |
| **720** | 710 / 710 | 0 | 710 / 710 | **0** |
| **768** | **805 / 758** | **+47** | 758 / 758 | **0** |
| **820** | 810 / 810 | 0 | 810 / 810 | **0** |
| **1024** | 1014 / 1014 | 0 | 1014 / 1014 | **0** |
| 1440 | 1430 / 1430 | 0 | 1430 / 1430 | **0** |

(The +47 measured inside the harness iframe is the same defect Phase 1 recorded
as 37px against a 768px window; the difference is the scrollbar the iframe
reserves.)

### Result

Tablet keeps the three filters on one row with `minmax(0, …)` tracks and drops
Reset onto its own row, left-aligned; the four-track layout starts at `lg` where
it fits. Grid children get `min-w-0` so a `<select>`'s widest-option intrinsic
width cannot force overflow either.

Reset keeps a **44px** touch target at every width (measured 44px at
320/375/720/768/820/1024/1440). No text is clipped, no control overlaps another,
and the mobile full-width and desktop inline placements are byte-identical to
before. Fixed on the real component — no page-level overflow clipping was added.

---

## Slice B — Typography and contrast

**Commits** `308e4c5 fix(ui): establish readable typography and contrast`,
`2a9f7b8 fix(ui): keep in-scene labels above the readable floor`

Fixes **F-18**, **F-19**, **F-21**.

### Text-role inventory (as found)

| Role | Found | Target | Action |
| --- | --- | --- | --- |
| Display | `clamp(2.9rem…6.35rem)` | — | unchanged |
| Hero title | `clamp(2.65rem…5.6rem)` | — | reduced in Slice D |
| Section title | 1.5–1.875rem | — | unchanged |
| Card title | 1.05–1.25rem | — | unchanged |
| Body | 1rem | 15–16px | already compliant |
| Supporting body | 0.875rem | ≥14px | already compliant |
| Metadata | **0.62–0.72rem (9.9–11.5px)** | ≥12px | raised |
| Badge | **11px** | ≥12px | raised (single component, 686 nodes) |
| Navigation | 0.875rem | 13–15px | already compliant |
| CTA | 0.82–0.875rem | ≥14px | already compliant |
| Diagram label | **7–11px user units, 4.5–11.5px rendered** | ≥12px rendered | raised per breakpoint |

### Typography rules applied

`src/styles/typography.css` (new) documents the scale and the floor, and adds
`--text-floor`, `--text-meta`, `--text-badge`, `--text-eyebrow` (all `0.75rem`)
plus `.darma-eyebrow`, `.darma-metadata` and `.darma-diagram-label`.

- **Badge** 11px → 12px, tracking `0.07em → 0.04em`, `leading-none → leading-4`.
  One component change removed **686 of 1543** sub-12px nodes.
- **855** `text-[9|10|11px]` utilities across **200** files → `text-xs`.
- **147** sub-`0.75rem` `font-size` declarations in the shared stylesheets →
  `0.75rem`.
- Micro-labels that stay uppercase no longer stack all four penalties: the
  eyebrow utility is 12px at `0.1em` tracking with a text-safe colour, replacing
  the `10px / 0.18em / tertiary` pattern.

### Text size before → after

| Route (1440×900) | Reader-facing text < 12px before | After |
| --- | --- | --- |
| `/` | 141 | **0** |
| `/tech-atlas` | 89 | **0** |
| `/tools` | 154 | **0** |
| `/games` | 173 | **0** |
| `/resources` | 241 | **0** |
| `/learning-paths` | 57 | **0** |
| `/tech-careers` | 45 | **0** |
| `/tech-glossary` | 237 | **0** |
| `/collections` | 95 | **0** |
| `/search` | 142 | **0** |
| 18 audited routes, total | **1543** | **0** |
| 18 routes × 8 viewports, light | — | **0** |
| 18 routes × 8 viewports, dark | — | **0** |

Landing specifically: Phase 0 counted **94** nodes below 12px including 5 at
7.7px; the harness counts 141 reader-facing nodes on `/` (it also measures SVG
at rendered size). Both are now 0.

### Contrast before → after

The bright brand values are tuned for the 3:1 non-text threshold and cannot
colour glyphs. Two dedicated text tokens now carry that job, leaving fills,
borders and focus rings untouched:

| Token | Light | Dark | Replaces |
| --- | --- | --- | --- |
| `--color-primary-text-strong` | `#a8380e` | `#ff9a78` | `--color-primary` `#cc4715` at 3.43–4.27:1 |
| `--color-accent-text` | `#0a6c62` | `#5eead4` | `--color-accent` `#13b8a6` at 1.94–2.49:1 |
| `--color-on-ink-primary` / `-accent` / `-warning` | `#ff9a78` / `#5eead4` / `#f7c948` | same | light-surface tokens used on ink at 3.05–3.85:1 |

**476** `text-[var(--color-primary|accent)]` usages were remapped, plus the
`Badge` soft/accent variants and the `Button` soft variant.

Confirmed failures resolved:

| Finding | Measured before | After |
| --- | --- | --- |
| F-19 — teal badge text on white (`Browser-only`, `Darma framework`, 4 routes) | **2.49:1** (1.94:1 on mint) | **6.0:1** |
| Primary as glyph on `--color-primary-soft` (`Open source` badge, 14 routes) | **3.64:1** | **4.8:1** |
| Primary as glyph on `--color-app-bg` (eyebrows, 5 routes) | **4.27:1** | **5.9:1** |
| F-21 — dark footer legal line, 18 routes, **both** themes | **4.34:1** | **5.22:1** (`#817b72 → #8f897f`) |
| `portal-principle-index` ornament, 3 routes | 1.78:1 light / 1.88:1 dark (need 3) | **5.9:1 / 7.0:1** |
| Game card thumbnail play-time label | 2.44:1 | **7.2:1** (`bg-black/35 → /65`) |
| Game detail preview overlay | 2.03–2.48:1 | **4.9–7.2:1** |
| Pre-play game modal body copy | 1.33:1 | opaque surface, **≥7:1** |
| JSON editor placeholder, both themes | 3.75:1 | **6.96:1** |
| Radar panel / route-lost console on ink | 3.05–3.85:1 | on-ink tokens, **≥4.5:1** |

| Solid contrast failures @1440 | Before | After |
| --- | --- | --- |
| Light, worst route | 26 (`/games/2048`) | **0** |
| Light, 18 routes total | ~150 | **0** |
| Dark, worst route | 7 (`/tools/json-formatter`) | **0** |
| Dark, 18 routes total | ~57 | **0** |

### SVG text decisions

SVG text scales with its viewBox, so a fixed user-unit size only renders at a
fixed pixel size while the container width is fixed. Two consequences:

1. **Initial raise** (Slice B): radar and search-constellation labels 7–8px →
   13px; `portal-scene-*` 10–11px → 12px; `detail-scene-*` → 13px; footer art
   → 13px; the connected-atlas node label 10 → 11. **No SVG height changed.**
2. **Regression from Slice D** (fixed in `2a9f7b8`): narrowing the hero scene
   column and capping it at 17rem on mobile changed the portal scene's viewBox
   scale from ~1.0 to between **0.38 and 0.87**, pushing 39 labels back below
   12px — down to **4.5px at 320px**. Measured scales for the 720-unit viewBox:

   | Viewport band | Scale | User units used | Rendered |
   | --- | --- | --- | --- |
   | ≤ 767px | 0.38 | *text hidden* | — |
   | 768–1023 | 0.57 | *text hidden* | — |
   | 1024–1279 | 0.65 | 19px | 12.4px |
   | 1280–1439 | 0.79 | 16px | 12.6px |
   | ≥ 1440 | 0.87 | 14px | 12.2px |

   Below 1024px no size clears 12px without the labels swamping a 272px
   illustration, so the in-SVG text is dropped there and the scene reads as
   artwork. Nothing is lost: the hero copy states the same thing, and the metric
   strip beneath the SVG is **HTML**, so it stays readable and scales with
   browser text settings. The landing connected-atlas map gets the same policy
   (15px / 12px above 1024, hidden below) and keeps its wrapper `aria-label`.

**Decorative exception.** Simulated app chrome inside `aria-hidden` preview
artwork — fake JSON lines, fake toolbars, a fake `−87%` badge — keeps its small
type. 182 such nodes remain below 12px by design; they are non-semantic marks
not intended to be read, which is the documented exception. No nonessential tiny
*sentences* remain in any SVG.

### Files changed

`src/styles/typography.css` (new), `src/styles/tokens.css`,
`src/styles/themes.css`, `src/app/globals.css`, `src/components/ui/Badge.tsx`,
`src/components/ui/Button.tsx`, `src/styles/experience.css`,
`src/styles/tool-workspace.css`, `src/features/games/styles/games-theme.css`,
`src/components/landing/ConnectedAtlasVisual.tsx`,
`src/features/games/components/GameDetail.tsx`,
`src/app/tools/json-formatter/JsonCodeEditor.tsx`,
`src/features/search/components/UnifiedSearchClient.tsx`,
`src/styles/typography.contract.test.ts` (new) — **255 files total** for the
sweep, plus 2 for the follow-up.

### Tests

`src/styles/typography.contract.test.ts` (7 tests): the floor tokens exist; the
shared `Badge` uses `text-[length:var(--text-badge)]` and contains no sub-12px
literal; shared CTA sizes stay ≥14px; **no `text-[8|9|10|11px]` remains anywhere
in public source**; the text-safe tokens exist in both themes; the confirmed
failing values (`text-[var(--color-accent)]` in `Badge`, `#817b72` in
`experience.css`) are gone; ink blocks use on-ink tokens. It asserts component
and token contracts, not arbitrary numeric CSS values.

---

## Slice C — Card foundations

**Commit** `5ac63af refactor(ui): standardize catalog card foundations`

Fixes **F-09** and **F-12**. No artwork was created.

### Card families

`src/components/ui/CARD_FAMILIES.md` documents seven families and, for each,
the title / description / metadata / visual / action regions, line budgets,
padding, gap, hover, focus, mobile behaviour and desktop alignment: **Tool
catalog, Game catalog, Resource, Learning-path, Editorial guide/comparison,
Atlas doorway, Featured**. They deliberately do not share one layout — they
share the `Card` primitive plus the region contract that every region reserves
its height.

### Tool card changes

The 62px CTA drift was **not** caused by copy length. `ToolCardLink` rendered a
bare `<Link>`, which is `display: inline` and severs the card's flex column, so
the `mt-auto` CTA never reached the card's bottom edge. The link now accepts a
`className` and the card passes `flex flex-1 flex-col`. On top of that:

- Title: `line-clamp-2 min-h-[2.5rem]` (`sm:min-h-[3.5rem]`) — fixed two-line region.
- Description: `line-clamp-3 min-h-[4.5rem]`.
- Use cases: always two rows (`min-h-[2.5rem] content-start`), present or not.
- Tag/category row: `min-h-8 content-start`.
- Preview panel: unchanged fixed aspect, ready for bespoke artwork without a
  dimension change.
- Full title stays available via the link's accessible name **and** a `title`
  attribute, so the clamp is presentational only.

No `Studio` title was renamed.

### Game card changes

- Play time stated **once** (thumbnail badge); the meta-row duplicate is gone.
- `funLevel` removed — it produced "Quick hit" beside the "Quick break"
  category label.
- Mobile/Desktop chip removed — it restated "Touch ready".
- Secondary category removed to hold the four-fact budget: play time, category,
  difficulty, input method.
- **Interaction model B**: the card is the navigation target via the stretched
  title link; Favourite stays a real sibling `<button>` (verified functional);
  the second "Play now" link, which duplicated the card's own action, is removed.
- Thumbnail scrim `bg-black/35 → /65` so the white label clears 4.5:1.

### Resource card preservation

The Phase 1 monogram policy is untouched — no remote third-party logo request
was restored, and `resourceIconPolicy` is unchanged. The identity panel keeps
its aspect ratio so a future local logo drops in without layout shift. Its two
**text** labels were removed: they printed the resource type and first category,
which the card body restates a few rows below, so every card said "reference"
and its pillar name twice. Type now reads through the panel's symbol and accent.

### Editorial cards

Untouched — the Phase 1 long-keyword wrapping fix (`.darma-break-token`) is
preserved.

### Measured card metrics

| Metric | Before | After |
| --- | --- | --- |
| Tool CTA baseline spread @1440 | **62px** | **0px** |
| Tool CTA baseline spread @768 | **110px** | **0px** |
| Tool CTA baseline spread @1024 | 62px | **0px** |
| Tool CTA baseline spread @375 | 0px | 0px |
| Tool card row height spread @1440 (grid stretch) | 0px | 0px |
| Game card height @1440 | **554px** | **422px** (target 380–430) |
| Game card height @1024 | 488px | **389px** |
| Game card height @768 | 512px | **379px** |
| Game card height @375 | 499px | **366px** |
| Game cards with a repeated fact | **24 / 24** | **0 / 24** |
| Resource cards with a repeated fact | **24 / 24** | **0 / 24** |
| Game card max interactive targets | **3** | **2** |
| Nested anchor/button violations | 0 | **0** |
| Card titles over two visual lines | — | **0** |
| Horizontal overflow, card routes × 5 widths | 0 | **0 / 30** |

Evidence: `tools-aligned-cards-desktop.webp` shows three CTAs on a shared
baseline across a two-line title and three different description lengths;
`games-simplified-cards-desktop.webp` shows one play-time badge, three metadata
chips and one favourite control per card.

### Tests

`src/components/ui/cardFoundations.contract.test.ts` (13 tests): `game.playTime`
appears exactly once; `Quick hit`, `funLevel` and the devices chip are gone;
`GamePlayLink` is gone while the stretched link and `FavoriteGameButton` remain;
the two-line clamp and reserved description height are present; the thumbnail
scrim is `/65`; every tool-card region reserves its height; the body link is a
growable flex column and `ToolCardLink` forwards `className`; the full title is
preserved for assistive tech; the resource panel no longer prints its duplicated
labels and stays `aria-hidden`; and neither card file nests a `Link`/`button`
inside another.

---

## Slice D — Portal heroes

**Commit** `1524f9d refactor(ui): reduce portal hero depth`

Fixes **F-13**.

### Root cause

The dominant contributor was **type scale, not copy volume**. The title used
`clamp(2.65rem, 5.7vw, 5.6rem)`, which resolves to **82px at 1440px**, inside a
copy column only **576px** wide. That one element wrapped to **seven lines** and
measured **551px of the 1189px hero**. Full breakdown of `/resources` at 1440
before the change: eyebrow 25 + badges 28 + **title 551** + description 98 +
actions 108 + signals 67 + margins, plus 208px of `padding-block` — the scene
(575px) was never the binding constraint.

### Routes changed

`/tech-atlas`, `/tools`, `/games`, `/resources`, `/learning-paths`,
`/tech-careers`, `/guides`, `/comparisons` — all eight `PortalHero` callers.
`/ways-of-working` (657px), `/tech-teams` (514px), `/tech-glossary` (452px) and
`/collections` (278px) were already inside target and were left alone; hero
content was **not** made identical across routes.

### What changed

`PortalHero` now caps the hierarchy itself rather than trusting each route: one
eyebrow, **≤2** context badges, one title, one paragraph, **one primary CTA plus
≤1 secondary**, one proof strip. Extra actions a route passes are dropped, so
the third button cannot be reintroduced. CSS: title
`clamp(2.1rem, 3.4vw, 3.5rem)`, `padding-block` max `6.5rem → 3.6rem`, gap max
`4.5rem → 3.25rem`, tighter description leading, and the copy column takes the
larger share of the grid.

### Copy removed or moved

Descriptions went from 130–210-character multi-clause sentences to one concise
statement. Claims stated two or three times on the same page are now stated
once:

| Route | Removed duplicate | Kept |
| --- | --- | --- |
| `/guides` | badge *Primary references* (also a signal) | signal *Evidence — Primary references* |
| `/games` | badge *No signup* (also signal *Access — No account required*) | signal, reworded to *No signup* |
| `/tools` | signal *Privacy — Visible per tool* (restated *No signup*) | badge *No signup* |
| `/comparisons` | badge *Reviewed comparisons* (also a metric) | metric *reviewed comparisons* |
| `/resources` | badge *Connected to paths* | badges *Official sources*, *Visible review status* |
| `/tech-atlas` | badge *Learning and work reference* | *Open reference*, *No account required* |
| `/learning-paths` | badge *Official sources* (signal *Sources — Cataloged references*) | signal |
| `/tech-careers` | badge *Scope and evidence* | *Role guides*, *Team context* |

**No governance or trust signal was removed** — every proof strip keeps all four
cells, including `/resources`' *"N of N verified"*.

### Heights before → after

**1440×900**

| Route | Hero before | Hero after | First content before | After | In first viewport |
| --- | --- | --- | --- | --- | --- |
| `/tech-atlas` | **1110** | **617** | 1461 | 984 | no (68px below) |
| `/tools` | 893 | **617** | 1018 | 762 | **yes** |
| `/games` | **1143** | **617** | 1252 | 746 | **yes** |
| `/resources` | **1189** | **617** | 1302 | 754 | **yes** |
| `/learning-paths` | **1110** | **617** | 1223 | 754 | **yes** |
| `/tech-careers` | **1189** | **617** | 1302 | 754 | **yes** |
| `/guides` | **1110** | **617** | 1241 | 754 | **yes** |
| `/comparisons` | **1267** | **617** | 1390 | 746 | **yes** |
| `/ways-of-working` | 657 | 657 | 730 | 730 | yes |
| `/tech-teams` | 514 | 514 | 872 | 888 | yes |
| `/tech-glossary` | 452 | 452 | 525 | 525 | yes |
| `/collections` | 278 | 230 | 479 | 479 | yes |
| **First content row visible without scrolling** | **4 / 12** | | | | **11 / 12** |

Every primary portal hero lands at **617px**, inside the 520–680px target.
Hero copy dropped from 588–720 to 467–598 characters.

**375×812**

| Route | Hero before | Hero after | Primary CTA top | Next section | Viewports |
| --- | --- | --- | --- | --- | --- |
| `/tech-atlas` | 1314 | **933** | 478 | 1308 | 1.61 |
| `/tools` | 1213 | **867** | 411 | 992 | **1.22** |
| `/games` | 1335 | **900** | 444 | 1009 | **1.24** |
| `/resources` | 1323 | **900** | 444 | 1021 | **1.26** |
| `/learning-paths` | 1342 | **900** | 444 | 1021 | **1.26** |
| `/tech-careers` | 1389 | **900** | 444 | 1021 | **1.26** |
| `/guides` | 1342 | **873** | 418 | 1012 | **1.25** |
| `/comparisons` | 1389 | **900** | 444 | 1031 | **1.27** |
| **Next section within ~1.3 viewports** | **0 / 8** | | | | **7 / 8** |

The primary action is reachable within the first viewport on **all eight**
portals (411–478px). On mobile the artwork stacks below the copy, so its height
adds to the hero rather than sharing it: the scene is capped at 17rem and the
proof strip becomes one horizontally scrollable row instead of a 2×2 block,
which costs one row of height while keeping every cell.

### Mobile result and exceptions

`/tech-atlas` is the documented exception at both sizes: its first *card* sits
68px below the desktop fold and its next section at 1.61 viewports on mobile.
Its hero bottom is 690px at 1440, so the **CTA group and the start of the
following section are both above the fold**, which is that route's stated
criterion. The remaining depth is the section's own heading block, not the hero.

Hero artwork is preserved throughout — resized and re-presented, never
redesigned. **Reduced motion still renders every hero fully** (0 nodes stuck at
`opacity: 0` across the eight routes), so the Phase 1 GSAP fail-safe is intact.

---

## Slice E — Footer

**Commit** `e2877d3 refactor(layout): introduce focused footer variants`

Fixes **F-14** and the remaining footer contrast issue.

### Variants

Both presentations are built from one dataset, `src/components/layout/footerLinks.ts`.

| | Full | Compact |
| --- | --- | --- |
| Routes | `/`, `/about`, `/tech-atlas` | every other public route |
| Contents | compact brand statement, 3 nav groups, contribution CTA, legal row | brand mark + name, 3 nav groups, legal row |
| Network diagram | removed | none |
| Metric cards | removed | none |
| Large CTA panel | replaced by the contribution CTA | none |
| Links | 20 | 13 |

`SiteFooter` resolves hidden / full / compact from the pathname itself, so the
hide rule for `/admin` and `/login` sits beside the variant rule.
`SiteFooterGate` remains a passthrough, so `layout.tsx` is unchanged.

### Duplicate links removed

Each href has exactly one owner, which makes the fix structural rather than a
one-off cleanup: the contribution CTA owns `/contribute` and the GitHub URL, the
legal row owns `/editorial-policy`, and every other link lives in one nav group.
`#main-content` is a same-page fragment, not a route, so it never collides.

| Duplicated href (before) | Appeared in | Now |
| --- | --- | --- |
| `/tools` | *Work* group + promo panel | *Use Darma* group only |
| `/search` | *Work* group + promo panel | *Use Darma* group only |
| `/editorial-policy` | *Decide and learn* group + legal row | legal row only |
| `/contribute` | *Project* group + legal row | contribution CTA only (full) |
| `https://github.com/fadeomar/Darma` | *Project* group + legal row | contribution CTA only (full) |

The 620×430 diagram and the four metric cards were removed rather than shrunk:
they restated counts the portal pages already show, and between them they were
most of the old height.

### Height before → after

| Measurement (1440×900) | Before | After |
| --- | --- | --- |
| Footer height, product/detail routes | **1145px** (1.27 viewports) | **399px** (target 300–460) |
| Footer height, storytelling routes | 1145px | **587px** (target ≤ 620) |
| Links per footer | 25 | 13 compact / 20 full |
| Duplicate hrefs within one footer | **5** | **0** |
| Footer text nodes below 12px | **5** | **0** |
| Footer contrast failures, light | 1 | **0** |
| Footer contrast failures, dark | 1 (4.34:1) | **0** |
| Horizontal overflow from the footer | 0 | **0 / 32** |

Verified across 18 routes in both themes: correct variant on every route, 0
duplicates, 0 sub-12px text, 0 contrast failures. `/admin` and `/login` render
no footer.

### Accessibility and responsive

Semantic `<nav aria-label>` per group with `<h3>` headings retained. Focus is
preserved and visible. On mobile the groups stack into two columns — not one
uninterrupted list — and footer links become **44px** touch targets instead of
24px text rows (measured 44px at 375px, 24px from 768px up where pointer input
is assumed). No essential legal or contribution link is hidden at any width.

### Tests

`src/components/layout/footerLinks.contract.test.ts` (11 tests):
`hrefsForVariant()` enumerates what each variant renders and asserts **no
repeats**; the compact footer is capped at three groups and stays smaller than
the full one; `/editorial-policy` is reachable from every route and
`/contribute` + GitHub from the full footer; external links are marked; every
essential route stays reachable from the compact footer; variant routing is
correct for storytelling, product and hidden routes (including that
`/administrators` is *not* treated as admin).

---

## Slice F — Spacing and grids

**Commit** `f500928 refactor(layout): normalize responsive spacing and grids`

### Tokens and utilities added

`tokens.css` documents the 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px scale
(Tailwind already maps onto it) and adds five semantic steps for CSS that cannot
use Tailwind utilities: `--space-section-sm|md|lg`, `--space-card`,
`--space-grid`. `typography.css` adds `.darma-section-sm|md|lg` and
`.darma-grid-balance`. Nothing else — no token sprawl.

### Outliers corrected

Measured section gaps were **32–48px at 375px *and* at 1440px**: a flat `py-12`
gave a phone and a desktop identical spacing. The directory content sections
adopted `py-12 lg:py-16`, a convention `/tech-teams` already used, and the two
tightest shells came up to the mobile floor.

| Section gap (median) | Before @375 | After @375 | Before @1440 | After @1440 |
| --- | --- | --- | --- | --- |
| `/tech-atlas` | 68 | 68 | 48 | **84** |
| `/tools` | **32** | **40** | **32** | **56** |
| `/games` | **32** | 36 | 36 | **56** |
| `/resources` | 40 | **48** | 40 | **64** |
| `/learning-paths` | 40 | **48** | 40 | **64** |
| `/guides` | 58 | 66 | 40 | **64** |
| `/comparisons` | 50 | 58 | 32 | **56** |
| `/collections` | 40 | 40 | 40 | **56** |
| `/tech-teams` | 113 | 113 | 113 | 129 |
| Routes inside the mobile 48–64 band | 6 / 9 | **7 / 9** | | |

Desktop lands at **56–84px** rather than the suggested 80–112px. That is a
deliberate density call, stated rather than glossed: these pages already run
3200–7500px at desktop and 12000–19000px on mobile, and Slice D had just spent
effort getting the first product row above the fold. `/tech-teams` keeps one
128px boundary — the only place in the system where two padded sections meet.

Mobile page heights fell as a side effect: `/tools` 17288 → 16040, `/games`
14151 → 12811, `/resources` 20773 → 19445, `/tech-atlas` 8360 → 7590.

### Grid rules

`.darma-grid-balance` lets the final card stretch across the columns it would
otherwise leave empty. Because the rule is count-driven CSS
(`:last-child:nth-child(3n+1)` → `span 3`) it stays correct as filters change
the item count.

| Orphan card grids @1440 | Before | After |
| --- | --- | --- |
| `/tech-atlas` (10 doorways, 3/3/3/**1**) | 1 | **0** |
| `/ways-of-working` (10 methods) | 1 | **0** |
| `/collections` (live + planned, 3/**1**) | 2 | **0** |
| Total | **4** | **0** |

Deliberately **not** applied to the large filtered catalogues: their count moves
with the active filter, so an orphan there is not an avoidable column choice,
and one full-width card among 24 uniform ones would read as a bug. Atlas
taxonomy was not restructured — only grid balance.

Also: `.darma-grid-balance > *` gets `min-width: 0` so grid children can shrink,
and `.landing-intent-counts` drops a hard `min-width: 460px` that could not fit
a 320px viewport.

### Responsive behaviour

All major directories were reviewed at 375 / 768 / 1024 / 1440px. Tablet layouts
are deliberate rather than accidental desktop wrapping — the learning-paths
filter row (Slice A) and the footer's three-column grid both have explicit
tablet arrangements. **0 horizontal overflow across 18 routes × 8 widths.** No
card touches another, and no unusually large empty gap remains apart from the
`/tech-teams` boundary noted above.

---

## Slice G — Public copy

**Commit** `91dd3e3 fix(content): replace internal product vocabulary`

Fixes **F-22**.

### Internal vocabulary removed

| Was | Now |
| --- | --- |
| *One discovery layer across tools, games, resources, learning paths, careers, workflows, and collections. The shared **CoreEntity registry** powers the complete discovery layer.* (`/search` hero) | *Search tools, games, resources, learning paths, careers, workflows, and collections from one place.* |
| ***Batch 10** introduces shared UI primitives that future Darma sections can use without rebuilding the same discovery patterns again.* (`/collections`) | *Explore the sections available today and see what is planned next.* |
| *A shared client-side browser for **CoreEntity** data with search, category chips, ranked results, and a polished empty state.* | *Search every live collection at once, then narrow the results by category.* |
| *Games are now mapped into **Darma Core*** | *Find a game by name, category, or how long it takes* |
| *Tools are now available as shared **Core entities***; *A **migration-safe** rail rendered with shared **Core UI primitives*** | *Every tool is reachable from site-wide search*; *A good place to start if you are not sure which tool you need.* |
| *Powered by **Darma Core unified registry**.* (search overlay) | *Searches tools, games, resources, paths, and careers.* |
| ***Sprint 19** adds an honest accessibility contract…*; ***Sprint 20** adds non-blocking fallbacks…* | same content, sprint number dropped |

Also replaced: the `Darma Core` / `Unified search` badge pair and the
*Core migration* panel heading on `/search`; *Core entity browser* and
*Darma framework* on `/collections`; `Darma Core` in the shared browser header;
*Darma Core 2.0* / *Non-breaking migration* / *Tools bridge* badges on `/tools`;
*Core migration bridge* and *Core-powered game rail* on `/games`; and a
game-detail sentence about the *"game identity layer"*.

### Areas inspected

`/search`, `/collections`, `/`, `/tech-atlas`, `/about`, `/guides`, plus page
metadata. Identifiers, types and comments are untouched — `CoreEntity` is a fine
type name, it just must not reach a page. Developer-education content keeps its
technical vocabulary; only Darma's own implementation language was rewritten.
The CSS-loader provenance data still names its upstream research batches, which
is source attribution rather than product copy, and is excluded explicitly.

### Result

**0 hits for 20 internal terms across 19 rendered routes**, in body text and in
page metadata. No hero grew — every replacement is the same length or shorter.
`/search` and `/collections` now state user value directly.

### Tests

`src/features/search/publicCopy.contract.test.ts` (4 tests) extracts JSX text
nodes and the copy-carrying props (`title`, `description`, `label`, `eyebrow`,
`placeholder`, `summary`, `ctaLabel`, `actionLabel`, `aria-label`) from every
source file, strips comments, and asserts none contains a banned term. It also
pins the two headline rewrites.

---

## Validation

| Check | Result | Notes |
| --- | --- | --- |
| `npm run typecheck` | **Pass** | 0 errors |
| `npm run lint` | **Pass** | 0 errors, 89 warnings — all pre-existing (unused vars, hook deps); count unchanged from baseline |
| `npm test` | **Pass** | **146 files, 1724 tests**, including 35 new Phase 2 contract tests |
| `npm run build` | **Pass** | `prisma generate` + `next build` clean |
| `npm run resources:audit` | **Pass with warnings** | 400 records, **0 errors**, 709 review warnings (unchanged — F-03 territory, out of scope) |
| `npm run learning-paths:audit` | **Pass** | 6 paths, 36 stages, 26 unique resources, **0 errors**, 18 review warnings |
| `npm run tech-atlas:audit` | **Pass** | 20 careers, 10 ways, 74 terms, 6 team models, 9 delivery stages |
| `npm run atlas:governance` | **Pass** | 0 errors, 0 warnings |
| `npm run editorial:audit` | **Pass** | 16 pages, 0 errors, 0 warnings |
| `npm run seo:audit` | **Pass** | 0 errors, 0 warnings |
| `npm run ui:motion:audit` | **Pass** | 0 errors, 0 warnings |
| `npm run atlas:quality` | **Pass** | aggregate of the above |
| Internal link crawl | **Pass** | 141 unique internal hrefs from 20 seed pages, **0 dead** |
| Fragment crawl | **Pass** | **0 broken fragments** |
| Light mode | **Pass** | 18 routes × 8 viewports: 0 overflow, 0 sub-12px, 0 contrast failures |
| Dark mode | **Pass** | same matrix: 0 / 0 / 0 |
| Reduced motion | **Pass** | same matrix: 0 / 0 / 0; every hero renders fully |
| Keyboard navigation | **Pass** | 8 routes, 14 tab stops each: skip link first, **14/14 with a visible focus ring**, no positive `tabindex`, card links reachable |
| 200% zoom | **Pass** | 12 routes at 1280×800 and 1440×900 equivalent: 0 unusable, 0 overflow |
| 320px layout | **Pass** | 18 routes, 0 overflow |
| 768px tablet layout | **Pass** | 18 routes, 0 overflow |

The internal-href count (141) is not directly comparable with Phase 1's 250: the
footer now exposes 13 links per product route instead of 25, and this crawl is
single-level from 20 seeds. What matters is unchanged — **zero dead internal
links and zero broken fragments.**

### Viewports reviewed

320×812, 375×812, 720×900, 768×1024, 820×1180, 1024×768, 1280×800, 1440×900.

### Routes reviewed

`/`, `/tech-atlas`, `/tools`, `/games`, `/resources`, `/learning-paths`,
`/tech-careers`, `/ways-of-working`, `/tech-teams`, `/tech-glossary`, `/guides`,
`/comparisons`, `/collections`, `/search`, `/tools/json-formatter` (tool
detail), `/games/2048` (game detail), `/tech-careers/frontend-developer` (career
detail), `/guides/choose-a-css-approach` (guide detail). Plus `/about`,
`/contribute`, `/editorial-policy` for the copy and footer sweeps, and 12
representative tool workspaces for the typography-sweep regression check.

---

## Visual metrics

| Metric | Before | After |
| --- | --- | --- |
| `/learning-paths` horizontal overflow @768 | **37px** | **0** |
| Portal hero height @1440, `/tech-atlas` | **1110px** | **617px** |
| Portal hero height @1440, `/resources` | **1189px** | **617px** |
| Portal hero height @1440, `/games` | **1143px** | **617px** |
| Portal hero height @1440, `/comparisons` | **1267px** | **617px** |
| Portal hero height @375 (range) | 1213–1389px | **867–933px** |
| First product row in first viewport @1440 | **4 / 12 routes** | **11 / 12 routes** |
| Next section within 1.3 viewports @375 | **0 / 8 routes** | **7 / 8 routes** |
| Footer height, product routes | **1145px** | **399px** |
| Footer height, storytelling routes | **1145px** | **587px** |
| Footer links / duplicate hrefs | **25 / 5** | **13 or 20 / 0** |
| Tool card CTA baseline spread @1440 | **62px** | **0px** |
| Tool card CTA baseline spread @768 | **110px** | **0px** |
| Game card height @1440 | **554px** | **422px** |
| Cards with a duplicated fact (games / resources) | **24 / 24 · 24 / 24** | **0 / 24 · 0 / 24** |
| Game card interactive targets | **3** | **2** |
| Reader-facing text below 12px, 18 routes @1440 | **1543** | **0** |
| Reader-facing text below 12px, 18 routes × 8 viewports | — | **0** (light and dark) |
| Solid contrast failures @1440, light | **~150** (worst route 26) | **0** |
| Solid contrast failures @1440, dark | **~57** (worst route 7) | **0** |
| Footer text below 12px | **5** | **0** |
| Section gap @1440 (median range) | **32–48px** | **56–84px** |
| Orphan card grids @1440 | **4** | **0** |
| Internal-vocabulary hits, 19 routes | **≥8 strings** | **0** |
| Horizontal overflow, 18 routes × 8 viewports | 1 (`/learning-paths` @768) | **0 / 144** |
| Dead internal links / broken fragments | 0 / 0 | **0 / 0** |

Decorative sub-12px marks inside `aria-hidden` preview artwork: 321 → 182,
retained by design as the documented exception.

---

## Screenshot evidence

`docs/qa/pr37-phase-2/screenshots/` — **18 WebP images, 760 KB total** (limit
~8 MB). Captured through CDP at exact viewport sizes; no raw screenshots,
secrets, local paths, private browser data or environment values are included.

| File | Route | Size | Shows |
| --- | --- | --- | --- |
| `learning-paths-tablet-contained.webp` | `/learning-paths` | 768×900 | Slice A: filters on one row, Reset on its own row, no overflow |
| `landing-mobile-typography.webp` | `/` | 375×812 | Slice B: 12px floor on mobile |
| `atlas-readable-labels.webp` | `/tech-atlas` | 1440×900 | Slice B: in-scene labels above the floor |
| `tools-aligned-cards-desktop.webp` | `/tools` | 1440×900 | Slice C: three CTAs on a shared baseline despite differing title/description lengths |
| `tools-card-mobile.webp` | `/tools` | 375×812 | Slice C: tool card at mobile |
| `games-simplified-cards-desktop.webp` | `/games` | 1440×900 | Slice C: one play time, three chips, two targets |
| `games-simplified-card-mobile.webp` | `/games` | 375×812 | Slice C: same at mobile |
| `resources-light-contrast.webp` | `/resources` | 1440×900 | Slice B: light-mode badges pass AA |
| `resources-dark-contrast.webp` | `/resources` | 1440×900 dark | Slice B: dark-mode parity |
| `atlas-reduced-hero-desktop.webp` | `/tech-atlas` | 1440×900 | Slice D: 617px hero, CTAs above the fold |
| `games-reduced-hero-desktop.webp` | `/games` | 1440×900 | Slice D: first game visible without scrolling |
| `resources-reduced-hero-desktop.webp` | `/resources` | 1440×900 | Slice D: search controls in the first viewport |
| `compact-footer-product-route.webp` | `/tools` | 1440×460 | Slice E: 399px compact footer |
| `full-footer-landing.webp` | `/` | 1440×640 | Slice E: 587px full footer with contribution CTA |
| `footer-dark-compact.webp` | `/games` | 1440×460 dark | Slice E: dark-mode footer contrast |
| `collections-balanced-grid.webp` | `/collections` | 1440×900 | Slice F: no orphan card in the final row |
| `search-public-copy.webp` | `/search` | 1440×760 | Slice G: user-value copy |
| `comparisons-mobile-contained.webp` | `/comparisons` | 375×812 | Slice F: contained at mobile |

---

## Remaining findings

Explicitly carried forward, untouched by this phase:

| Item | Status |
| --- | --- |
| **Tool preview artwork system** (F-07) | 10 templates cover 26 cards. Containers and dimensions are now stable — the preview panel keeps a fixed aspect ratio, so bespoke artwork can drop in without changing card height. |
| **Game thumbnail artwork** (F-08) | 19/24 still emoji-on-gradient. Thumbnail aspect and the badge overlay positions are fixed, so replacements need no layout change. |
| **Atlas semantic illustration redesign** (F-10) | 10 of 12 large SVGs still share one two-path structure. Label sizing is now correct; the motifs are not. |
| **`Studio` naming cleanup** (F-11) | 133 occurrences, 73 unique titles. Untouched by instruction. The two-line title region already absorbs the length. |
| **Search ranking** (F-16) | Untouched by instruction. |
| **Duplicate search results** (F-17) | The *Featured matches* strip still repeats items from the ranked list. Untouched by instruction; only its description copy changed. |
| **Static prerendering** (F-15) | Still 0 static content routes — `await cookies()` in the root layout. Untouched by instruction. |
| **First-paint theme** (F-24) | Unchanged. |
| **Resource editorial review programme** (F-03) | 709 review warnings across 400 records; statuses untouched by instruction. |
| **Learning-path content expansion** (F-02 remainder) | 6 paths, 36 stages. No content added. |

### New findings from this phase

1. **`/tools/gpa-calculator` overflows by 108px at 320px and 53px at 375px**, and
   **`/tools/color-name-finder` by 14px at 320px**. Both pre-date Phase 2 — the
   `min-w-[390px]` course table exists at `e4ef7e8` — and both are tool
   workspace routes outside this phase's audited set. The overflow leaks through
   a chain of shrink-blocked children rather than one oversized element, so it
   needs a small restructure of those two panels.
2. **`/tech-teams` has one 128px section boundary** at desktop, the only place
   where two padded sections meet. A "sections own their top padding only"
   convention would fix it systematically; that is a wider refactor than this
   phase's remit.
3. **`/tech-atlas` mobile depth**: the next section sits at 1.61 viewports
   because of the section's own heading block, not the hero. Trimming that block
   is a content decision.

---

## Release status

**Phase 2 complete, artwork sprint required.**

Every Phase 2 objective is met and measured: the tablet overflow is fixed on the
real component; there is a documented 12px readable floor with zero reader-facing
violations across 18 routes × 8 viewports in both themes; zero solid contrast
failures in both themes; card families are documented with CTA baselines aligned
to 0px and no duplicated facts; portal heroes are 617px with the first product
row in the opening viewport on 11 of 12 routes; the footer is 399px on product
routes with zero self-duplicated links; spacing scales with the viewport and no
avoidable grid orphan remains; and no internal implementation vocabulary reaches
a page.

Phase 1's work is intact — GSAP fail-safes still render every hero under reduced
motion, the resource monogram policy is unchanged, and the editorial wrapping fix
is preserved. 35 new contract tests pin the foundations so they cannot regress
silently.

What remains before this looks finished is **artwork, not layout**: 68 tool
previews, 24 game thumbnails and 8 Atlas pillar diagrams. This phase leaves
stable containers and fixed dimensions for all three, so Phase 3 assets can be
created once and dropped in without moving anything.
