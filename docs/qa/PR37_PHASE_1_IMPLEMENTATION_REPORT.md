# Darma PR #37 — Phase 1 Implementation Report

Product correctness, trust, and runtime resilience. Scope was limited to the five confirmed P1
findings from the Phase 0 baseline audit; no part of the visual sprint was started.

---

## Baseline

| Item | Value |
| --- | --- |
| Branch | `new-loaders` |
| Starting commit | `32f147a76a84309873f24a6b0bc2c47bb3be6e9a` (Phase 0 audit commit) |
| Phase 0 report used | [PR37_PHASE_0_BASELINE_AUDIT.md](PR37_PHASE_0_BASELINE_AUDIT.md) |
| Loader stash reference | `stash@{0}` = `f762521345ef7aa883984af1d63feb4265dc4ecf` — *"preserve css-loader batch-14 before phase-1"* |
| Node / npm | v24.13.0 / 11.12.1 |
| Environment | Windows 11, Next.js 16.1.4 (Turbopack dev) |

### Loader work protection

`git status --short` before implementation showed **exactly** the 62 known CSS-loader batch-14
entries (11 modified generated files, 50 new `darma-b14-*.json` loaders, 1 untracked source
directory) and nothing else. No unexpected files were present. The batch was stashed with
`git stash push --include-untracked`, the tree was verified clean (0 entries), and every Phase 1
commit was staged with explicit paths and checked for loader files before committing. No loader file
appears in any Phase 1 commit.

### Commits

Seven fix commits plus this report. Slices A–E landed as specified; two follow-up commits were
needed after validation surfaced gaps in Slices B and C. Because those slice commits were already
in history and rebasing is not permitted, the fixes landed as their own commits rather than amends.

| # | Commit | Slice |
| --- | --- | --- |
| 1 | `6a9c6b6` fix(collections): align live routes and planned states | A |
| 2 | `224e623` fix(resources): align trust claims with governance data | B |
| 3 | `afc898f` fix(motion): keep content visible when gsap fails | C |
| 4 | `3bb1bdb` fix(resources): add resilient logo fallbacks | D |
| 5 | `3d07cc3` fix(layout): remove narrow viewport overflow | E |
| 6 | `7526556` fix(motion): reveal stranded content when a trigger never fires | C follow-up |
| 7 | `9ff6a34` fix(content): finish the cataloged-reference wording pass | B follow-up |

---

## Slice A — Collections

**Files changed**

- `src/features/collections/domain/collection.ts`
- `src/features/collections/registry/collectionRegistry.ts`
- `src/features/collections/registry/collectionRegistry.test.ts` *(new)*
- `src/features/collections/lib/coreCollectionRegistry.ts`
- `src/features/collections/components/CollectionFrameworkBanner.tsx`
- `src/app/collections/page.tsx`

**Root cause.** Two independent problems shared one origin.

`coreCollectionRegistry.ts` mapped **every** entry in `COLLECTIONS` into a `CoreEntity`. A
`CoreEntity` has a *required* `href`, so every consumer treats it as navigable. Planned collections
therefore became clickable cards pointing at `/templates`, `/components`, `/ai`, and `/learning` —
none of which exist. The `/collections` page had already worked around this for one rail
(`status === "live"` filter, line 18) but passed the unfiltered list to `CoreEntityBrowser`.

Phase 0 attributed the dead links to `/collections` alone. In fact the same mapping also feeds
`src/features/search/lib/unifiedSearchRegistry.ts:28`, so planned collections were clickable
results in unified search too — a second surface the Phase 0 crawler could not see because search
results are client-rendered. Fixing the mapping boundary fixed both at once.

Separately, `resources` and `learning` were marked `status: "planned"` while `/resources` ships 400
records with 5 category hubs and `/learning-paths` ships 6 paths with 36 stages.

**Implementation**

- `resources` → `status: "live"`, `href: "/resources"`, CTA *"Explore resources"*.
- `learning` → `status: "live"`, `href: "/learning-paths"`, CTA *"Explore learning paths"*, title and
  nav label *"Learning Paths"*. The registry **key** stayed `learning`; nothing outside the registry
  referenced it (`getCollectionById` has no callers), so no redirect or duplicate page was created.
- `CollectionDefinition.primaryAction` became **optional** and was removed from Templates,
  Components, and AI. The data itself now carries no dead href.
- `coreCollectionRegistry` filters to live entries at the mapping boundary via an exported
  `isNavigableCollection` predicate, with a comment explaining why. This is a structural rule, not a
  per-route exception: a newly added planned collection cannot become a dead link.
- `CollectionFrameworkBanner` guards the now-optional `primaryAction`.
- The `/collections` hero sentence was corrected — it described Resources and Learning as future
  sections.

Planned cards were already non-interactive and remain so: they render a bare `<Card>` (whose
default variant has no hover, unlike `variant="interactive"`), with a clock icon and no CTA.

**Tests.** `collectionRegistry.test.ts`, 10 cases: Resources live at `/resources`; Learning Paths
live at `/learning-paths`; Templates/Components/AI still planned; planned entries expose no
`primaryAction` or `secondaryAction`; live hrefs restricted to routes that exist; planned entries
absent from core entities; one navigable entity per live collection; no entity href matches an
unbuilt route; `isNavigableCollection` tracks status; every entity href is a usable path.

**Result.** Live collections 2 → 4, planned 5 → 3. Internal-link crawl over 20 seed pages:
**254 unique hrefs / 4 dead → 250 unique hrefs / 0 dead**, 0 broken fragments. No visual redesign.

---

## Slice B — Trust messaging

**Real governance fields used.** The catalog defines an explicit review state in
`src/features/resources/schema.ts:41-45`:

```ts
review: { status: "verified" | "review-needed" | "archived", lastChecked: string | null, notes?: string }
```

Counts are derived from `review.status` only. Per the brief, review state is **not** inferred from
`pricing: "unknown"` or `publisherType: "unknown"` — those drive the audit's 709 review warnings but
are metadata completeness, not editorial verification. A test asserts the two numbers stay distinct
so the old conflation cannot return.

**Derived counts** (from the merged 400-record catalog: `resources.catalog.json` 361 +
`curated-resources.json`, deduplicated by URL):

| Field | Value |
| --- | --- |
| `total` | **400** |
| `verified` | **39** |
| `needsReview` | **361** |
| `archived` | **0** |

**Wording changed.** `getResourceGovernanceSummary` is the single derivation point; no count is
hardcoded.

| Surface | Before | After |
| --- | --- | --- |
| `/tech-atlas` hero metric | `400 reviewed references` | `400 cataloged references` |
| `/resources` eyebrow | `Darma reviewed resource network` | `Darma resource catalog` |
| `/resources` metric | `400 unique resources` | `400 cataloged references` |
| `/resources` signal | `Trust — Review state visible` | `Review — 39 of 400 verified` |
| `/resources/[category]` heading | `Trusted references for …` | `Cataloged references for …` |
| `/learning-paths` signal | `Sources — Reviewed references` | `Sources — Cataloged references` |
| `/learning-paths` pillar | `Trusted starting sources` + *"clearly reviewed references"* | `Official starting sources` + *"show each source's review state"* |
| Career detail evidence | `N reviewed references` | `N cited sources` |
| Site footer | `reviewed references` | `cataloged references` |
| Header nav | `Trusted references and official documentation` | `Cataloged references and …` |
| Landing navigator | `Reviewed references` | `Cataloged references` |
| Atlas OG image | `Reviewed references` | `Cataloged references` |
| Root SEO metadata (3 strings) | `trusted developer resources`, `reviewed learning paths` | `cataloged developer resources`, `structured learning paths` |
| Learning path timeline | `Trusted starting resources` | `Starting resources` |
| Resource hubs (2 summaries) | `Trusted references for …`, `Trusted JavaScript …` | `Cataloged …` |

`/resources` already displayed an accurate `verified entries` count from the real field; it is now
sourced from the shared helper. The total stays primary and the breakdown secondary, with no new
section, no added hero height, and no text below 12px.

Career references were checked directly: they are `{ name, url }` with **no review field at all**,
so `reviewed references` was unsupportable there in any form — hence *cited sources*.

**Deliberately left unchanged**: `/about` and `/contribute` process wording ("every contribution is
reviewed before publication", "suggest a trustworthy resource") describes a real process; the
per-card `Reviewed source` / `Curated source` label is driven by each record's own `review.status`;
the CSP generator's "Trusted Types" is unrelated security terminology; a glossary definition
mentioning "trusted system boundaries" is unrelated domain content. `curated` was kept where it
describes selection rather than verification.

**Files changed.** `src/features/resources/governance.ts` *(new)*, `governance.test.ts` *(new)*,
`src/features/resources/index.ts`, `src/app/tech-atlas/page.tsx`, `src/app/resources/page.tsx`,
`src/app/resources/[category]/page.tsx`, `src/app/learning-paths/page.tsx`,
`src/app/learning-paths/[slug]/opengraph-image.tsx`, `src/app/tech-careers/[slug]/page.tsx`,
`src/app/layout.tsx`, `src/app/about/page.tsx`, `src/app/guides/page.tsx`,
`src/components/layout/SiteFooter.tsx`, `src/components/navigation/SiteHeader.tsx`,
`src/components/landing/LandingIntentNavigator.tsx`,
`src/components/landing/LandingWorkbenchDemo.tsx`,
`src/components/landing/ConnectedAtlasVisual.tsx`,
`src/features/learning-paths/components/LearningPathTimeline.tsx`,
`src/features/editorial/resource-hubs.ts`, `src/features/editorial/editorial-pages.json`,
`src/features/visuals/og/createAtlasOgImage.tsx`.

**Tests.** `governance.test.ts`, 26 cases: total equals record count; the three status counts sum to
the total; `verified` counts only verified records; `needsReview` is not equal to the unknown-pricing
count; per-status tallies; empty-catalog zeros; breakdown formatting including archived and the null
case; the catalog is not fully verified; the Atlas metric is labelled by catalog size; and a
source-level guard across **15** surfaces forbidding `reviewed references?`, `reviewed resource`, and
`trusted`. That guard caught four occurrences I had missed by hand, including two hub summaries.

**No resource record was modified.** `resources:audit` still reports 400 records, 0 errors,
709 review warnings — review coverage is unchanged, as required.

---

## Slice C — GSAP resilience

**Files changed.** `src/core/motion/gsap-loader.ts`, `gsap-loader.test.ts` *(new)*, and the 15
consumers: `MotionSection`, `SplitTextReveal`, `AtlasHeroScene`, `AtlasScrollStory`, `RouteMotion`,
`DetailHeroScene`, `DarmaHeroExperience`, `LandingIntentNavigator`, `LandingProofWorkflow`,
`LandingSectionRail`, `LandingWorkbenchDemo`, `ModernWebRadar`, `SiteHeader`, `PortalHeroScene`,
`CareerPathfinder`.

**Scope correction to Phase 0.** Phase 0 reported "7 components set `opacity: 0` before an
un-`catch`ed dynamic import". The accurate picture, from inspecting every consumer:

- **15** components call `loadGsap()`, and **none** handled rejection.
- Only **2** pre-hide content synchronously before awaiting GSAP: `MotionSection`
  (`element.style.opacity = "0"`) and `SplitTextReveal` (per-word spans). These were the real
  fail-closed risk.
- The other **13** set their from-state *inside* `.then()` via `gsap.fromTo(...)`, so a failed
  import means the tween never runs and content stays at its natural CSS opacity — visible. They
  still produced unhandled promise rejections.

The blast radius is smaller than stated but still severe, because the two affected components are
the most widely used: `MotionSection` wraps 11–15 sections per page and `SplitTextReveal` renders
every portal `<h1>`.

**Loader change.** `loadGsap` now caches only successful loads. On rejection it nulls
`loadingPromise` before rethrowing, so the next mount retries instead of every later caller
inheriting a permanently rejected promise. `registerPlugin` is called once behind a
`pluginRegistered` flag. `userPrefersReducedMotion` still guards on `typeof window`, so nothing runs
during SSR. Added: `restoreInlineStyles`, `armVisibilityFailsafe`, `reportMotionFailure`, a
`withGsap` wrapper, and `resetGsapLoaderForTests`.

**Consumers updated.** The 13 fail-visible consumers were routed through `withGsap(setup)`, which is
shape-compatible with `loadGsap().then(setup)` — a one-token change per file rather than restructuring
promise chains — and swallows failures via `reportMotionFailure` (dev-only `console.debug`, no noisy
production logging). The two pre-hiding consumers keep explicit chains so they can restore
visibility.

**Failure behaviour.** On rejection, `MotionSection` and `SplitTextReveal` clear the inline
`opacity`, `transform`, `visibility`, `filter`, and `clipPath` they set, so content falls back to the
stylesheet. Cleanup is idempotent, guarded by a `cancelled` flag, and safe on unmount.

**The failsafe, and why it changed.** The first implementation armed a 1s timer and cleared it as
soon as `loadGsap()` resolved. Browser validation showed that missed the case actually occurring:
GSAP loaded fine, but the `ScrollTrigger` never fired, leaving all 12 `<h1>` words on `/tech-atlas`
at `opacity: 0` indefinitely. `armVisibilityFailsafe` now stays armed past a successful load and
after 1s restores only elements that are **both** inside the viewport **and** still at inline opacity
exactly `"0"`. Consequences:

- in-viewport content no animation claimed is revealed;
- below-fold content stays hidden, so scroll reveals are preserved;
- an element GSAP has begun tweening has a fractional opacity, so a running animation is never
  interrupted;
- the timer is cancelled on unmount.

**Empty target guard.** `AtlasHeroScene` rendered `data-hero-chip` nodes only from an optional
`labels` prop, so the collection was usually empty and `gsap.fromTo(chips, …)` logged
`GSAP target [object NodeList] not found` repeatedly on `/tech-atlas`. The image, chip, and glow
queries are now all guarded (`if (image)`, `chips.length > 0`, `if (glow)`), which covers both warning
shapes observed. `SplitTextReveal` also returns early when it finds no word targets.

**Reduced motion.** Unchanged and still correct: both pre-hiding components `return` *before*
setting any inline style, so reduced-motion users always get fully visible content and no GSAP
import is triggered. A test asserts the reduced-motion guard precedes the hide in both files.

**Tests.** `gsap-loader.test.ts`, 23 cases with mocked `gsap` / `gsap/ScrollTrigger` modules and fake
timers: successful load cached and `registerPlugin` called once; a rejected import clears the cache;
a later call retries and errors propagate; `withGsap` runs setup on success and resolves on failure;
`restoreInlineStyles` clears all five properties, tolerates repeats, empty lists, and holes;
`armVisibilityFailsafe` reveals in-viewport stranded content, leaves below-fold content hidden, does
not touch a mid-tween element, does nothing after cancel, and no-ops on an empty list; the shared
failure path leaves content visible; reduced motion reported from `matchMedia` and false during SSR;
plus source-level guards that every one of the 15 consumers handles rejection.

**Limitation.** jsdom is not a project dependency and adding one was out of scope, so React
components could not be rendered in tests. Component behaviour is asserted at the source-contract
level and verified in a real browser (below).

---

## Slice D — Resource logos

**Previous external behaviour.** `ResourceLogo` built a candidate list from
`[icon.localPath, icon.logoUrl, icon.faviconUrl]` and rendered the first as a raw `<img>`.
`resource-icons.json` is `{}` and **all 400** records are `icon.status: "remote-candidate"` with
**0** `localPath`, so every tile hit a third party. `/resources` measured **24 images across 12
hosts** (`cdn.simpleicons.org`, `agilemanifesto.org`, `dora.dev`, `owasp.org`, `web.dev`,
`teamtopologies.com`, `basecamp.com`, `sfia-online.org`, `lean.org`, `gitlab.com`,
`designcouncil.org.uk`, `onetonline.org`, `kanbanguides.org`), **0** proxied through `next/image`.

**Scope correction to Phase 0.** Phase 0 said there was "no `onerror` handler, no fallback glyph".
That was wrong on both counts: the component already had an `onError` candidate chain ending in
initials. The false reading came from inspecting the DOM `onerror` **property** — always `null` for a
React-attached handler — on an image that was still loading. Verified this time: React is hydrated
and the `<img>` does carry an `onError` prop.

The genuine defects, both confirmed by measurement, are narrower:

1. **Policy was ignored.** The schema encodes an approval state
   (`local | remote-candidate | fallback-only | review-needed`) that the renderer never consulted, so
   400 unreviewed third-party requests were issued while the product advertises browser-local
   behaviour — a privacy and reliability exposure, not just a cosmetic one.
2. **Pending requests showed an empty tile.** The monogram appeared only after an `error` event, so a
   slow or hanging host rendered a blank bordered box for as long as the request stayed pending
   (observed: `complete: false`, `naturalWidth: 0`, empty tile).

**New policy** (`src/features/resources/lib/resourceIconPolicy.ts`): an icon may be requested only
when `status === "local"` **and** a `localPath` exists — i.e. it has been fetched, checked, and
self-hosted. Every other state resolves to a monogram with **no network request**. No
`remotePatterns` were added and no wildcard host was introduced; approved icons are same-origin so
`next/image` needs no host allowlist. `npm run resources:sync-icons` remains the migration path: it
self-hosts icons and promotes records to `local`, after which they render automatically. No logos
were downloaded or committed in this phase.

**Fallback behaviour.** `resourceMonogram` derives one or two letters from the title, splitting on
whitespace, dots, and dashes (`web.dev` → `WD`, `CSS-Tricks` → `CT`), ignoring punctuation and
falling back to `?`. It is pure and input-only, so server and client agree and there is no hydration
mismatch. Tiles keep fixed dimensions in every state (36 / 48 / 64px), monogram text is
`text-xs`/`text-sm`/`text-base` (12 / 14 / 16px — never below 12px), colours come from existing
tokens so light and dark both work, and the tile stays `aria-hidden` because the adjacent resource
title already provides the accessible name. An approved image that fails at runtime swaps to the
monogram.

**Files changed.** `src/features/resources/lib/resourceIconPolicy.ts` *(new)*,
`resourceIconPolicy.test.ts` *(new)*, `src/features/resources/components/ResourceLogo.tsx`,
`src/features/resources/index.ts`. `ResourceLogo` is the only render path for resource icons — no
other component reads `logoUrl` or `faviconUrl`.

**Tests.** `resourceIconPolicy.test.ts`, 21 cases: monogram from two words, one word, dotted and
dashed names, punctuation, never empty, deterministic, and 1–2 characters for **all 400** real
records; approved local icon renders an image; `remote-candidate`, `fallback-only`,
`review-needed`, missing icon, and `local` without a path all fall back; a resolved image src is
never remote; every one of the 400 records resolves to a non-empty identity tile; no unapproved icon
can produce a request; and component-contract guards for the `onError` swap, `aria-hidden`, `alt=""`,
fixed dimensions, and the 12px floor.

**Result, measured on `/resources`.** Third-party image hosts **12 → 0**, images **24 → 0**,
**24 identity tiles with 0 empty**, 0 broken images, tiles at 48×48 with 14px monograms.

---

## Slice E — Narrow layouts

**Files changed.** `src/styles/experience.css`,
`src/features/editorial/components/EditorialCard.tsx`.

**Root causes.** Both failures share one cause, and it is **not** what Phase 0 recorded.

Phase 0 attributed `/guides` to the decorative footer aurora. `.darma-footer` already sets
`overflow: hidden`, so the aurora is clipped and contributes nothing to document width — it merely
*measures* wide. The real cause on both pages is the card grid item: `MotionSection` wraps each card
and, as a grid item, defaults to `min-width: auto`, so it refused to shrink below the card's
intrinsic width (340px on `/comparisons`, 313px on `/guides`) inside a 288px track. `.motion-section`
had no CSS rule at all.

**CSS changes.**

1. `.motion-section { min-width: 0; }` — lets card grid items shrink. Documented with a comment
   explaining the grid-item minimum-size rule. Card min-content is 217px, well inside the 288px
   track, so content fits rather than being clipped.
2. `EditorialCard` keyword badges now use `max-w-full whitespace-normal text-center leading-tight`.
   `Badge` is `whitespace-nowrap` and `shrink-0` by design; once the card could shrink, a long phrase
   such as *"product management vs project management"* (298px) was clipped by the card at 288px. Only
   this call site changed, so every other badge keeps its appearance — the global primitive was not
   touched.

No `overflow-x: hidden` hack was added to `html` or `body`, and none pre-existed.

**Width verification.** `document.documentElement.scrollWidth <= clientWidth` for `/`,
`/tech-atlas`, `/tools`, `/games`, `/resources`, `/learning-paths`, `/comparisons`, `/guides`:

| Width | Result |
| --- | --- |
| 320px | 8/8 pass — `/comparisons` 36px → **0**, `/guides` 9px → **0** |
| 375px | 8/8 pass |
| 768px | 7/8 pass — see below |
| 1440px | 8/8 pass |

Re-checked for newly clipped content at 320/375px: none.

**One pre-existing overflow found outside this slice's scope.** `/learning-paths` overflows by
**37px at 768px**, caused by a `<button>` at `left: 713, width: 92` (`min-width: auto` in a flex row)
— unrelated to `MotionSection` or badges. Phase 0 tested 320/375/720px and never covered 768px.
Confirmed pre-existing by neutralising both Phase 1 CSS changes in the page and re-measuring:
**37px with the fix, 37px without it**. Slice E was scoped to F-06 and F-20 only, so this is recorded
as a new finding rather than fixed.

---

## Validation

Each check run once after implementation.

| Check | Result | Notes |
| --- | --- | --- |
| `npm run typecheck` | **Pass** | 0 errors. |
| `npm run lint` | **Pass** | 0 errors, 89 warnings — identical count to the Phase 0 baseline, so no new warnings were introduced. |
| `npm test` | **Pass** | **142 files, 1689 tests, 0 failures.** Phase 0's single failure was a Windows vitest worker-spawn error; it did not recur, and 3 files that failed to collect then now run. 80 new tests added this phase. |
| `npm run build` | **Pass** (221 s) | `prisma generate && next build`, exit 0. |
| `npm run resources:audit` | **Pass** | 400 records, 0 errors, **709 review warnings — unchanged**, confirming no record was silently promoted. |
| `npm run learning-paths:audit` | **Pass** | 6 paths, 36 stages, 26 unique resources, 0 errors, 18 review warnings. |
| `npm run tech-atlas:audit` | **Pass** | 20 careers, 10 ways, 74 terms, 6 team models, 9 delivery stages. |
| `npm run atlas:governance` | **Pass** | 0 errors, 0 warnings. |
| `npm run editorial:audit` | **Pass** | 16 pages, 0 errors, 0 warnings (after the one editorial string change). |
| `npm run seo:audit` | **Pass** | 0 errors, 0 warnings. |
| `npm run ui:motion:audit` | **Pass** | 0 errors, 0 warnings. |
| `npm run atlas:quality` | **Pass** | Chains the six audits above. |
| Internal link + fragment crawl | **Pass** | 20 seed pages, **250 unique internal hrefs, 0 dead, 0 broken fragments** (was 254 / 4 dead). |

> The audit scripts overwrite 14 git-tracked `*_AUDIT.{md,json}` files at the repo root. Diffs were
> inspected each time — only the `Generated:` timestamp changed — and all touched files were restored
> with `git restore`, so no generated output is left modified.

### Focused route validation

| Route | Verified |
| --- | --- |
| `/collections` | 4 LIVE (Tools, Games, Resources, Learning Paths) with CTAs; 3 PLANNED with clock icons and no CTA; **0** links to `/templates`, `/components`, `/ai`, `/learning` |
| `/resources` | `Darma resource catalog`, `400 cataloged references`, `39 of 400 verified`; 0 third-party image hosts; 24 monogram tiles, 0 empty |
| `/tech-atlas` | `✦ 400 cataloged references`; **zero** `GSAP target not found` warnings; `<h1>` 12/12 words visible with inline opacity cleared, while 11 below-fold sections stay correctly hidden |
| `/learning-paths` | `Cataloged references`, `Official starting sources`; live and reachable |
| `/tech-careers/frontend-developer` | `N cited sources` (no review claim); 200 |
| `/contribute` | `#learning-paths` and `#resources` still resolve — untouched, as instructed |
| `/comparisons` @ 320px | `scrollWidth <= clientWidth`; card contained |
| `/guides` @ 320px | `scrollWidth <= clientWidth`; card contained |

Console across audited routes: **no errors**, and no GSAP warnings.

### Simulated GSAP failure

Rejection is covered by unit tests (cached rejection cleared, retry succeeds, inline styles
restored). The "loaded but trigger never fired" case was reproduced live in a non-compositing
renderer and is now recovered by `armVisibilityFailsafe` — `/tech-atlas` heading words went from
**0/12 → 12/12 visible** after the change, with below-fold scroll reveals preserved. Blocking the
GSAP chunk at the network layer would require modifying source or network policy and was not done.

### Evidence

Five WebP screenshots (**0.29 MB** total) in `docs/qa/pr37-phase-1/screenshots/`, captured with
system Chrome `--headless=new --force-prefers-reduced-motion` at DPR 1:

| File | Shows |
| --- | --- |
| `collections-live-and-planned.webp` | 4 LIVE / 3 PLANNED, planned cards with no CTA, corrected hero sentence |
| `atlas-cataloged-references.webp` | `400 cataloged references` on the Atlas hero |
| `resources-monogram-fallback.webp` | Monogram identity tiles on every resource card, no empty or broken tiles |
| `comparisons-320-contained.webp` | `/comparisons` contained at 320px |
| `guides-320-contained.webp` | `/guides` contained at 320px |

---

## Remaining known findings

Not implemented; carried forward from the Phase 0 audit. **The following remain for the visual
sprint:**

- **Tool preview system** (F-07) — 26 cards, 10 distinct preview structures, one template on 14 cards.
- **Game thumbnails** (F-08) — 19/24 emoji, 23/24 flat gradient, 1 real asset.
- **Atlas illustrations** (F-10) — one two-path `0 0 430 176` template reused 10 times.
- **Hero height** (F-13) — portal heroes 1108–1200px inside a 900px viewport.
- **Footer density** (F-14) — 1145px (1.27× viewport), 25 links, 5 self-duplicated hrefs.
- **Tool Card alignment** (F-12) — 7 of 16 rows on `/tools` with height spread up to 62px at 1440px.
- **Game Card simplification** (F-09) — play time printed twice on all 24 cards, 7 metadata items,
  3 interactive targets per card.
- **Tiny typography** (F-18) — 94 sub-12px nodes on the landing page, floor 7.7px; in-SVG labels 8–11px.
- **Light-mode contrast** (F-19) — teal badge text 2.49:1 at 11px; 13 of 232 nodes below AA.
- **`Studio` naming** (F-11) — 133 occurrences across 73 unique titles.
- **Search ranking and duplicate results** (F-16, F-17) — unrelated items outrank exact title
  matches; "Featured matches" repeats the top six results.
- **Static rendering and first-paint theme** (F-15, F-24) — `await cookies()` in the root layout makes
  all 113 routes dynamic (only 5 asset routes prerender); theme ignores `prefers-color-scheme` on
  first visit.

Also outstanding: **F-20's sibling** — `/guides` aurora needs no change, but F-21 (footer copyright
4.34:1 in dark mode) and F-22 (internal vocabulary: `CoreEntity registry`, `DARMA CORE`, `Batch 10`)
remain.

**New finding from this phase:** `/learning-paths` overflows horizontally by **37px at 768px** due to
a `min-width: auto` button in a flex row. Pre-existing and confirmed independent of Phase 1 changes;
not covered by the Phase 0 viewport matrix.

---

## Release status

**Phase 1 complete, visual sprint required.**

All five confirmed P1 findings are fixed, verified in a browser, and covered by 80 new tests. The
two P1 issues that made Phase 0 a release candidate rather than shippable — four dead internal links
and an unsubstantiated trust claim — are resolved: the site now has zero dead internal links across
250 hrefs, and every user-facing count is derived from the catalog's real `review.status`. Resource
cards no longer contact any third-party host, GSAP can no longer strand readable content, and both
320px overflows are contained.

Nothing from the visual sprint was started, and the surface still looks less finished than its
engineering baseline: interchangeable card visuals, emoji game thumbnails, oversized heroes and
footer, and "Studio" naming are all untouched by design. Those are the P2 body of work the visual
sprint exists to address.
