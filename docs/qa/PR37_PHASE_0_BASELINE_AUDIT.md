# Darma PR #37 — Phase 0 Baseline Audit

Read-only inspection baseline captured before the planned Darma visual quality sprint.
No application source, content, config, dependency, or generated build file was modified.

---

## 1. Executive summary

**Overall baseline condition: healthy engineering baseline, unfinished product surface.**

The branch is in good technical shape. Type checking, lint, the production build, and all seven
content/governance audit scripts pass. The defects found are concentrated in the *presentation and
trust layer*: collection routing that advertises pages that do not exist, a data-quality claim the
governance data does not substantiate, card visual systems that cannot distinguish one item from
another, and portal heroes that push the actual product below the fold on every major route.

- **Does the branch build?** Yes. `npm run build` exits 0 in 80 s.
- **Is it production-ready?** No — release candidate requiring P1 fixes. Nothing here corrupts data
  or breaks a core flow, but a public release would ship four dead links and an unsubstantiated
  trust claim.

**Finding counts (confirmed only):** P0 — 0 · P1 — 6 · P2 — 13 · P3 — 5

### Five most important findings

1. **F-01 — Four dead internal links on `/collections`.** `/templates`, `/components`, `/ai`, and
   `/learning` are linked from a live page and all return 404. These are the only dead internal
   links in the entire site (4 of 254 unique internal hrefs).
2. **F-02 — The Collections Registry contradicts the live site.** `resources` and `learning` are
   marked `status: "planned"` while `/resources` ships 400 records and `/learning-paths` ships 6
   paths. `/collections` therefore lists two shipped products under "Planned collections".
3. **F-03 — "400 reviewed references" is not supported by the governance data.** The catalog audit
   reports 709 review warnings across 356 of the 400 records (89%) for unset `pricing` /
   `publisherType`. The number 400 is real; the word "reviewed" is not yet earned.
4. **F-04 — No fail-safe on GSAP-hidden content.** Seven components set `opacity: 0` before an
   un-`catch`ed dynamic `import("gsap")`, and `loadGsap()` memoises a *rejected* promise, so one
   failed chunk load hides that content permanently for the rest of the session.
5. **F-13 — Every portal hero exceeds the viewport.** At 1440×900 the hero measures 1108 px on
   `/tech-atlas`, 1187 px on `/resources`, and ~1200 px on `/games`, so the first screen of each
   section contains no product content.

### Recommendation for starting Phase 1

Proceed. The Phase 1 scope named in the sprint plan (trust messaging, collection routes/statuses,
contribution anchors, GSAP fail-safe, dead actions) is confirmed correct except for
**contribution anchors, which are already working and need no work** (see §9). Substitute the
remote-logo fallback (F-05) into that slot.

---

## 2. Audit scope and limitations

| Item | Value |
| --- | --- |
| Branch | `new-loaders` |
| PR | [#37](https://github.com/fadeomar/Darma/pull/37) |
| Baseline commit inspected | `e324fd706c3c94466b7535a10d38ef64e43a297a` |
| Latest commit message | `add new loaders` |
| Node | v24.13.0 |
| Package manager | npm 11.12.1 |
| Lockfile | `package-lock.json` (npm) |
| OS | Windows 11 Home 10.0.26200 (win32) |
| Next.js | 16.1.4 (Turbopack dev) |
| Audit date | 2026-08-03 |
| Local URL | `http://localhost:3000` |

### Pre-existing uncommitted changes

The working tree was **already dirty at the start of the audit** — 62 entries, all belonging to the
CSS-loader batch-14 work and unrelated to this audit (11 modified generated loader files,
50 new `darma-b14-*.json` loaders, 1 untracked source directory). This was reported before any
work began and the user approved proceeding with an audit-only commit. Those files remain
uncommitted and untouched.

### Environment notes

- **`.env.local` is present**; no environment variables had to be invented. No secrets appear in
  this report or in any screenshot.
- **Content source is JSON, not the database.** Explorer content is read from `content/explorer/*`
  (wired through `outputFileTracingIncludes` in `next.config.ts`). No audited page required
  database access. Prisma is only needed for `prisma generate` during `build`, and for
  `/admin/*` + `/api/*` routes, which were **excluded** from this audit as authenticated surfaces.
- Explorer, tools, games, and Atlas data all load successfully.

### Viewports reviewed

375×812 (mobile), 768×1024 (tablet), 1440×900 (desktop), 320×1200 (narrow stress),
720×450 (= 1440×900 at 200 % browser zoom).

### Limitations

1. **The dev server initially failed to start.** The first `next dev` panicked in Turbopack
   (`Failed to write app endpoint /page`, PostCSS worker connection closed, os error 10054) and
   served HTTP 500 on `/`. Clearing the gitignored `.next` cache fixed it permanently. This is a
   local setup artifact, not a branch defect — recorded because it cost the first run.
2. **No browser-automation or accessibility tooling exists in the repo** (no Playwright, Cypress,
   Puppeteer, axe, or visual-regression harness) and installing one was out of scope. Screenshots
   were produced with the **already-installed system Chrome** in `--headless=new` mode; WebP
   encoding used the **system Python PIL 12.3.0**. Neither touched `package.json` or the lockfile.
3. **Two rendering surfaces disagreed, and only headless Chrome was treated as visual proof.** The
   in-app automation browser does not composite frames, so `ScrollTrigger` never fires there and
   *every* `MotionSection` and split-heading measures `opacity: 0`. Two candidate findings were
   traced to this artifact and **discarded rather than reported**: (a) an apparently missing site
   header (the query had matched a `<header>` inside the hidden Next dev-overlay portal — the real
   header renders correctly, see `landing-desktop-baseline.webp`), and (b) apparently permanently
   invisible hero headings. Where the two surfaces disagreed, the headless render is cited.
4. **Dark-mode screenshots could not be captured.** The theme is a server-read `theme` cookie and
   headless Chrome offers no flag to seed it. Dark mode was instead verified by computed-style
   contrast measurement in a live browser (§5).
5. **The mobile navigation drawer could not be opened** in a compositing browser, so its density
   was assessed from source only. Concern 18 is left as *needs further manual verification*.
6. **Screenshots of content-heavy pages were captured with `--force-prefers-reduced-motion`** so
   that entrance animations are complete and layout findings are not confused with mid-animation
   frames. Screenshots used as motion evidence are explicitly labelled.
7. **External link health was not checked.** `atlas:links` performs live third-party network
   requests; it was deliberately not run to keep the audit offline and side-effect free.
8. `/admin/*`, `/login`, `/api/*`, `/element/*`, `/elements/*`, `/tooltip*`, and `/articles/*` were
   not reviewed (authenticated, legacy, or non-product surfaces).

---

## 3. Automated checks

All commands are pre-existing repository scripts. Each was run once unless noted.

| Check | Command | Result | Notes |
| --- | --- | --- | --- |
| Type check | `npm run typecheck` | **Pass** (51 s) | `tsc --noEmit`, 0 errors. |
| Lint | `npm run lint` | **Pass** (65 s) | 89 problems: **0 errors, 89 warnings**. Mostly `no-unused-vars` and `react-hooks/exhaustive-deps`; 1 `jsx-a11y/role-supports-aria-props` (`aria-pressed` on `role=listitem`, `ReactionThemePanel.tsx:50`); 1 `@next/next/no-img-element`. |
| Unit tests | `npm test` (vitest) | **Fail — environment** (90 s) | **1503 / 1504 tests passed**, 123 / 126 files. The single failure is `[vitest-pool]: Failed to start forks worker … spawn UNKNOWN (errno -4094)` — a Windows worker-spawn failure, plus 4 "Timeout terminating forks worker" notices. Confirmed **not** a code failure: `npx vitest run …/memoryCardsEngine.test.ts` passes 4/4 in isolation. |
| Production build | `npm run build` | **Pass** (80 s) | First attempt failed setup-only: `prisma generate` hit `EPERM … query_engine-windows.dll.node` because the dev server held the DLL. Passed after stopping the dev server. |
| Tech Atlas audit | `npm run tech-atlas:audit` | **Pass** | 20 careers, 10 ways, 74 terms, 6 team models, 9 delivery stages. |
| Resource governance | `npm run resources:audit` | **Pass with warnings** | 400 records, **0 errors, 709 review warnings** → see F-03. |
| Learning-path audit | `npm run learning-paths:audit` | **Pass with warnings** | 6 paths, 36 stages, 26 unique resources, 0 errors, 18 review warnings. |
| Atlas governance | `npm run atlas:governance` | **Pass** | 0 errors, 0 warnings. |
| Editorial content | `npm run editorial:audit` | **Pass** | 16 pages, 0 errors, 0 warnings. |
| SEO authority | `npm run seo:audit` | **Pass** | 0 errors, 0 warnings. |
| Visual experience | `npm run ui:motion:audit` | **Pass** | 0 errors, 0 warnings. Static source analysis — it did **not** catch F-04. |
| Combined quality gate | `npm run atlas:quality` | **Pass** (12 s) | Chains the six audits above. |
| Internal links + fragments | *(none in repo)* | **Custom, pass/fail mixed** | No link checker exists. A throwaway crawler (scratchpad only, not committed) covered 20 seed pages / **254 unique internal hrefs**: **4 dead links, 0 broken fragments**. |

### Available but deliberately not run

| Check | Command | Why |
| --- | --- | --- |
| External link health | `npm run atlas:links` / `:sample` | Live third-party network requests; kept offline. |
| CSS-loader duplicate audit | `npm run audit:css-loaders` | Would analyse the uncommitted batch-14 work, out of scope. |
| Design refactor audit | `npm run audit:design` | Refactor-tracking tool, not a release gate. |
| Tools registry check | `npm run check:tools` | Not a release gate for this phase. |
| Favicon URL check | `npm run favicon:check` | Live network requests. |
| Explorer content suite | `content:*` (10 scripts) | DB/GitHub-source comparison tooling; content source is JSON and unchanged. |

### Checks that do not exist in the repository

Browser/E2E testing (Playwright, Cypress), visual-regression or screenshot baselines,
automated accessibility testing (axe / pa11y / Lighthouse CI), internal-link validation,
fragment/anchor validation, image-asset validation, and bundle-size budgets.

> **Note on tracked audit outputs:** the audit scripts overwrite 14 git-tracked
> `*_AUDIT.{md,json}` files at the repo root. They were snapshotted before running; the only diff
> produced was the `Generated:` timestamp, confirming the committed results reproduce exactly. All
> 12 touched files were restored with `git restore`, so no tracked file is left modified.

---

## 4. Route matrix

Discovered from source (`src/app/**/page.tsx`): **113 page routes**. Every route below was opened
and inspected, not merely confirmed to exist. "Console" counts product-code errors only, excluding
Next dev-overlay and Fast Refresh noise.

| Route | Purpose | Exists | HTTP | Console | Failed req. | Broken img | Layout | Interaction | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Landing | Yes | 200 | 0 | 0 | 0 | OK | OK | `landing-desktop-baseline`, `landing-mobile-hero-fold`, `landing-tablet-baseline` | Hero 727 px; page 10 226 px tall; 94 text nodes < 12 px (F-18) |
| `/tech-atlas` | Atlas hub | Yes | 200 | 4 warns | 0 | 0 | **Hero overflows fold** | OK | `atlas-desktop-hero-overflow`, `atlas-reduced-motion`, `atlas-repeated-svg-system`, `atlas-mobile-card-grid` | Hero 1108 px (F-13); 1 SVG template ×10 (F-10); GSAP target warnings (F-23) |
| `/tools` | Tools directory | Yes | 200 | 0 | 0 | 0 | **Row misalignment** | OK | `tools-icon-only-cards-desktop`, `tools-long-title-studio-mobile`, `tools-320-stress` | 62 px row height spread (F-12); 10 preview templates / 26 cards (F-07) |
| `/tools/json-formatter` | Tool detail (representative) | Yes | 200 | 0 | 0 | 0 | OK | OK | — | Meaningful preview (real JSON) — the good case for F-07 |
| `/tools/lorem-ipsum-generator` | Longest tool title (40 ch) | Yes | 200 | 0 | 0 | 0 | Title wraps 2 lines | OK | `tools-long-title-studio-mobile` | "Lorem Ipsum & Placeholder Content Studio" (F-11, F-12) |
| `/tools/app-screenshot-mockup-generator` | Generic preview case | Yes | 200 | 0 | 0 | 0 | OK | OK | `tools-icon-only-cards-desktop` | Shares the ×10 repeated preview template (F-07) |
| `/games` | Games directory | Yes | 200 | 0 | 0 | 0 | **Hero overflows fold** | OK | `games-emoji-thumbnails-desktop`, `games-card-duplicate-playtime-mobile` | Hero ~1200 px; grid starts ≈1700 px (F-13); 19/24 emoji (F-08) |
| `/games/2048` | Game detail (representative) | Yes | 200 | 0 | 0 | 0 | OK | OK | — | **5 play controls** on one page (F-09) |
| `/games/reaction-timer` | Emoji/gradient thumbnail | Yes | 200 | 0 | 0 | 0 | OK | OK | `games-emoji-thumbnails-desktop` | ⚡ on flat green gradient (F-08) |
| `/games/gridland` | Custom visual | Yes | 200 | 0 | 0 | 0 | OK | OK | `games-emoji-thumbnails-desktop` | **Only** game with a real image asset (1/24) |
| `/resources` | Resource library | Yes | 200 | 0 | 0 | 0 | **Hero overflows fold** | OK | `resources-remote-logos-desktop` | Hero 1187 px (F-13); 24 remote logos / 12 hosts (F-05) |
| `/resources/javascript` | Resource category | Yes | 200 | 0 | 0 | 0 | OK | OK | — | 5 category hubs verified |
| `/learning-paths` | Learning paths | Yes | 200 | 0 | 0 | 0 | OK | OK | `learning-paths-desktop` | Live with 6 paths, yet "planned" in registry (F-02) |
| `/learning-paths/web-foundations` | Path detail | Yes | 200 | 0 | 0 | 0 | OK | OK | — | 6 real slugs confirmed |
| `/career-pathfinder` | Career finder | Yes | 200 | 0 | 0 | 0 | OK | OK | — | — |
| `/tech-careers` | Careers index | Yes | 200 | 0 | 0 | 0 | OK | OK | — | 20 careers |
| `/tech-careers/frontend-developer` | Career detail | Yes | 200 | 0 | 0 | 0 | OK | OK | — | Uses "N reviewed references" per career (F-03) |
| `/ways-of-working` | Ways of working | Yes | 200 | 0 | 0 | 0 | OK | OK | — | 10 methods |
| `/ways-of-working/agile` | Method detail | Yes | 200 | 0 | 0 | 0 | OK | OK | — | — |
| `/tech-teams` | Teams & delivery | Yes | 200 | 0 | 0 | 0 | OK | OK | — | 6 team models, 9 delivery stages |
| `/tech-glossary` | Glossary | Yes | 200 | 0 | 0 | 0 | OK | OK | — | 74 terms |
| `/guides` | Practical guides | Yes | 200 | 0 | 0 | 0 | **9 px overflow @320** | OK | — | Decorative footer aurora (F-20) |
| `/guides/frontend-developer-roadmap` | Guide detail | Yes | 200 | 0 | 0 | 0 | OK | OK | — | — |
| `/comparisons` | Comparisons | Yes | 200 | 0 | 0 | 0 | **36 px overflow @320** | OK | — | Card min-width 340 px (F-06) |
| `/comparisons/devops-vs-sre` | Comparison detail | Yes | 200 | 0 | 0 | 0 | OK | OK | — | — |
| `/contribute` | Contribute | Yes | 200 | 0 | 0 | 0 | OK | OK | `contribute-anchor-targets` | `#learning-paths` + `#resources` **both present** (§9) |
| `/about` | About | Yes | 200 | 0 | 0 | 0 | OK | OK | — | — |
| `/search` | Unified search | Yes | 200 | 0 | 0 | 0 | OK | OK | — | `?q=` works; ranking weak (F-16), results duplicated (F-17) |
| `/collections` | Collections registry | Yes | 200 | 0 | 0 | 0 | OK | **4 dead links** | `collections-planned-state-desktop` | F-01, F-02 |
| `/explore` | Explorer | Yes | 200 | 0 | 0 | 0 | OK | OK | — | Hides unreviewed projects by design |
| `/workflows` | Workflows | Yes | 200 | 0 | 0 | 0 | OK | OK | — | — |
| `/editorial-policy` | Editorial policy | Yes | 200 | 0 | 0 | 0 | OK | OK | `footer-desktop-density` | Short page — used as footer evidence |
| Header / mobile menu | Navigation | Yes | — | 0 | 0 | 0 | OK | OK | `landing-*` | 44×44 target, focus trap, Escape, focus return all present |
| Footer | Global footer | Yes | — | 0 | 0 | 0 | **1.27× viewport** | OK | `footer-desktop-density` | 1145 px, 25 links, 5 duplicate hrefs (F-14) |
| `/this-route-does-not-exist` | Genuine 404 | Yes | **404** | 0 | 0 | 0 | OK | OK | `not-found-404-desktop` | `not-found.tsx` renders correctly |
| `/templates` | Planned collection | **No** | **404** | — | — | — | — | **Linked from `/collections`** | `collections-planned-state-desktop` | F-01 |
| `/components` | Planned collection | **No** | **404** | — | — | — | — | **Linked from `/collections`** | `collections-planned-state-desktop` | F-01 |
| `/ai` | Planned collection | **No** | **404** | — | — | — | — | **Linked from `/collections`** | `collections-planned-state-desktop` | F-01 |
| `/learning` | Registry route | **No** | **404** | — | — | — | — | **Linked from `/collections`** | `collections-planned-state-desktop` | F-01 — real route is `/learning-paths` |

### Route mapping corrections

| Prompt expectation | Actual path in code | Status |
| --- | --- | --- |
| `/learning` | `/learning-paths` | Registry still points at `/learning` (404) |
| Resources | `/resources` + `/resources/[category]` | Live, but registry says "planned" |
| Tech Careers | `/tech-careers` + `/tech-careers/[slug]` | Live |
| Ways of Working | `/ways-of-working` + `/[slug]` | Live |
| Teams and Delivery | `/tech-teams` | Live |
| Technology Comparisons | `/comparisons` + `/[slug]` | Live |
| Practical Guides | `/guides` + `/[slug]` | Live |

---

## 5. Console, network, and asset findings

- **Console errors: none.** Zero product-code errors across every audited route. Only Next dev
  noise (Fast Refresh, HMR, React DevTools hint) plus the GSAP warnings below.
- **GSAP warnings (F-23):** `/tech-atlas` repeatedly logs
  `GSAP target [object NodeList] not found` and `GSAP target not found`. Traced to
  `AtlasHeroScene.tsx:30`, where `root.querySelectorAll("[data-hero-chip]")` returns an **empty
  NodeList** when the optional `labels` prop is empty (default `[]`), and that empty list is passed
  straight to `gsap.fromTo`. Harmless to rendering; pure console noise.
- **Failed network requests: none.** All 24 third-party logo requests succeeded during the audit.
- **Broken images: none** in the current state — but see the fallback gap below.
- **Remote asset problems (F-05):** `/resources` loads **24 remote images from 12+ third-party
  hosts** (`cdn.simpleicons.org`, `agilemanifesto.org`, `dora.dev`, `owasp.org`, `web.dev`,
  `teamtopologies.com`, `basecamp.com`, `sfia-online.org`, `lean.org`, `gitlab.com`,
  `designcouncil.org.uk`, `onetonline.org`). **Zero** are routed through `/_next/image` —
  `next.config.ts` whitelists only `assets.justinmind.com`, so these are raw `<img>` tags. Two
  consequences: every page view discloses the visitor's IP and referrer to 12+ third parties, and a
  host outage degrades silently (below).
- **Missing image fallback (F-05):** simulating a host failure at runtime (overriding one `src` in
  the live DOM, no source change) leaves the `<img>` in place with `naturalWidth: 0`, rendering an
  **empty 34×34 box** inside its 48×48 bordered container. There is no `onerror` handler, no
  fallback glyph, and no initial letter. The wrapper is `aria-hidden="true"`, so assistive tech is
  unaffected; sighted users see a blank tile.
- **Hydration warnings: none observed.**
- **Performance warnings:** no runtime warnings, but see F-15 — only **5 routes are statically
  prerendered** (`/robots.txt`, `/sitemap.xml`, `/favicon.ico`, `/opengraph-image`,
  `/_global-error`). Zero content pages are static.
- **Dark mode (measured, not screenshotted):** `data-mode="dark"` applies correctly; surfaces
  switch to `rgb(25,25,23)` and body text to `rgb(244,241,234)`. Of **370 text nodes measured on
  `/resources` in dark mode, exactly 1 falls below WCAG AA** (F-21). Dark mode is in good shape.
  *An earlier sweep suggesting 114 failures was a flaw in my own background-resolution logic — it
  resolved transparent backgrounds to black and included non-rendered `<option>` nodes. Discarded.*
- **Keyboard focus is correctly implemented.** Under real `Tab` input the focused element matches
  `:focus-visible` and paints a 1.6 px outline plus a box-shadow ring; `focus-visible` styling
  appears 78× in CSS and 103× in components. *An earlier programmatic-`.focus()` sweep reporting
  27/40 elements with no ring was a false positive — programmatic focus does not trigger
  `:focus-visible`. Discarded.*
- **200 % browser zoom is clean.** At a 720×450 layout viewport (= 1440×900 at 200 %),
  **0 of 14 major routes** overflow horizontally.

---

## 6. UI/UX findings

Severity: **P0** release blocker · **P1** must fix before production · **P2** high-value
improvement · **P3** later polish.

### P0 — release blocker

None. No audited defect corrupts data, blocks a core task, or breaks a page outright.

### P1 — must fix before production

---

**F-01 · Interaction · `/collections` (`collectionRegistry.ts:61,82,103,145`)**

**Problem.** `/collections` renders four anchors to routes that do not exist: `href="/templates"`,
`href="/components"`, `href="/ai"`, `href="/learning"`. All four return HTTP 404. They reach the DOM
through `coreCollectionRegistry.ts:8`, which maps **all** `COLLECTIONS` — including
`status: "planned"` entries — into the "Live core entries" rail.
**User impact.** A user browsing the collections page can click into a dead end from a page that
frames these as part of the product. These are the only 4 dead internal links out of 254 unique
internal hrefs sitewide.
**Evidence.** `collections-planned-state-desktop.webp`; crawler output: 20 seed pages, 254 unique
hrefs, 4 dead, 0 broken fragments.
**Recommended direction.** Do not link planned collections. Either render them as non-interactive
cards (as the "Planned collections" grid above already does correctly), or filter
`status !== "live"` out of the core-entries rail.
**Acceptance criteria.** A crawl of all internal hrefs from every live page returns **0** responses
≥ 400.

---

**F-02 · Content / Interaction · `collectionRegistry.ts:120-161`**

**Problem.** The registry marks `resources` and `learning` as `status: "planned"` with
`primaryAction: { label: "Coming soon" }`, but `/resources` is live with 400 records and 5 category
hubs, and `/learning-paths` is live with 6 paths and 36 stages. `/collections` consequently shows
"Live collections — 2 LIVE" and lists **Resources** and **Learning** under "Planned collections —
5 PLANNED".
**User impact.** Two shipped products are advertised as unavailable, suppressing traffic to real
content and making the roadmap look less complete than it is.
**Evidence.** `collections-planned-state-desktop.webp`; `/resources` → 200 with 400 records;
`/learning-paths` → 200 with 6 paths.
**Recommended direction.** Set `resources` to `status: "live"` pointing at `/resources`. Repoint
`learning` at `/learning-paths` and mark it live, or remove the duplicate `learning` entry if
`/learning-paths` is meant to live under the Atlas rather than as a collection.
**Acceptance criteria.** Every registry entry with `status: "live"` resolves to HTTP 200, and no
route returning 200 with real content is labelled "planned" or "Coming soon".

---

**F-03 · Content · `/tech-atlas` (`tech-atlas/page.tsx:63`), `/learning-paths:26,94`, `/resources:112`, `tech-careers/[slug]:54`, `SiteFooter.tsx:71`**

**Problem.** `/tech-atlas` renders `{ value: resources.length, label: "reviewed references" }`,
displayed as "✦ 400 reviewed references". The governance audit reports **709 review warnings across
356 of those 400 records (89 %)** — every one of them an unset `pricing` or `publisherType` field
(`audit-resource-catalog.mjs:23-24`). The count of 400 is accurate; the claim that they are
*reviewed* is not substantiated by the repository's own review data. The same framing repeats in
five other places ("Trusted starting sources", "Sources: Reviewed references", "Darma reviewed
resource network", "N reviewed references" per career, and the footer).
**User impact.** This is the site's central trust claim. A visitor who checks a few entries and
finds unset provenance metadata has reason to distrust the whole Atlas.
**Evidence.** `npm run resources:audit` → `400 records / 0 errors / 709 review warnings`;
356 distinct resources carry ≥ 1 warning; visible in `atlas-reduced-motion.webp`.
**Recommended direction.** Either soften the label to what the data supports
(e.g. "400 curated references") or add a real reviewed flag and display the reviewed subset count.
Do not raise the number without raising the review coverage.
**Acceptance criteria.** Any user-facing count labelled "reviewed" equals the number of records
that pass the governance review check with zero warnings; `resources:audit` review warnings and the
displayed figure are derived from the same field.

---

**F-04 · Motion · `MotionSection.tsx:33`, `SplitTextReveal.tsx:25`, `gsap-loader.ts:12`, + 5 more**

**Problem.** Seven GSAP components set `opacity: 0` (or `autoAlpha: 0`) on their content
*synchronously in `useLayoutEffect`*, then clear it inside `loadGsap().then(...)`. **None of the
seven has a `.catch()`** (verified: 0 catch handlers across all 7 files). Worse,
`gsap-loader.ts:12` memoises `loadingPromise` **including on rejection**, so a single failed
`import("gsap")` chunk load — offline, a cache-busted deploy, a blocked CDN, a chunk 404 — leaves
every animated block on every subsequent route permanently invisible for the rest of the session,
with no retry and no fallback.
**User impact.** Worst case is a blank-looking page whose text is present in the DOM but invisible.
The SSR HTML is clean (0 occurrences of `opacity: 0` in server output across 17 routes), so this is
strictly a post-hydration regression: content ships visible, then disappears.
**Reproducible condition.** The permanent-invisibility failure was **not reproduced against a real
GSAP load failure** (that would require blocking the chunk, i.e. modifying source or network
policy — out of scope for Phase 0). What *is* confirmed: the code path exists with no error
handling; the rejected promise is cached; and any environment where the tween never runs leaves
content at `opacity: 0` — observed directly in the non-compositing automation browser, where all 15
`MotionSection`s and all 12 heading words stayed at `opacity: 0` indefinitely.
**Good news that bounds the severity.** The **reduced-motion path is correct**: both components
`return` *before* setting `opacity: 0`, so `prefers-reduced-motion` users always get fully visible
content. Confirmed visually — `atlas-reduced-motion.webp` renders the complete hero, heading, and
diagram.
**Evidence.** `atlas-desktop-hero-overflow.webp` (animated, mid-reveal) vs
`atlas-reduced-motion.webp` (complete) — the same route, same viewport.
**Recommended direction.** Add `.catch()` to every `loadGsap()` consumer that clears the pre-set
inline styles; stop memoising rejected promises in `loadGsap()`; and add a belt-and-braces timeout
that restores visibility if the tween has not run within ~1 s.
**Acceptance criteria.** With the GSAP chunk request blocked, every route renders all text and
imagery at full opacity, and no element remains at `opacity: 0` more than 1 s after hydration.

---

**F-05 · Images · `/resources`, `/tech-atlas` resource cards**

**Problem.** 24 third-party logos load as raw `<img>` from 12+ external hosts with no
`next/image` proxying and **no `onerror` fallback**. A failing host renders an empty 34×34 box in a
48×48 bordered tile.
**User impact.** Two distinct harms. (1) Reliability: the resource library's visual identity
depends on 12 domains Darma does not control; any outage silently degrades the page. (2) Privacy:
each page view discloses the visitor's IP address and referrer to all 12 third parties, which sits
awkwardly beside the site's own "Browser-only / Local only / no personal tracking" claims.
**Evidence.** `resources-remote-logos-desktop.webp`; 24 remote images, 0 via `/_next/image`;
runtime failure simulation produced an empty tile with no fallback.
**Recommended direction.** Route logos through `next/image` with the hosts added to
`images.remotePatterns` (gaining caching + optimisation), or self-host the icon set. Add a letter
or monogram fallback on error.
**Acceptance criteria.** With all external hosts blocked, every resource card shows a
non-empty identity tile, and no user-facing request goes to a third-party host without being
proxied or documented in the privacy copy.

---

**F-06 · Layout · `/comparisons` at 320 px**

**Problem.** `/comparisons` overflows horizontally by **36 px** at a 320 px viewport. The offender
is the comparison card link (`A.group block h-full rounded-…`) rendering at **340 px** inside a
`DIV.motion-section`, i.e. a min-width or fixed padding that cannot compress below 340 px.
**User impact.** Horizontal page scrolling on small phones (iPhone SE and similar) — the page
rocks sideways while reading.
**Reproducible condition.** Load `/comparisons` at exactly 320 px width; `scrollWidth` = 356.
Clean at 375 px and above; clean at 200 % zoom.
**Evidence.** Overflow sweep across 17 routes × 2 widths — `/comparisons` is the only content
overflow.
**Recommended direction.** Allow the comparison card to shrink below 340 px (`min-width: 0`, reduce
horizontal padding at the smallest breakpoint).
**Acceptance criteria.** `document.documentElement.scrollWidth <= 320` on every route at a 320 px
viewport.

---

### P2 — high-value improvement

---

**F-07 · Visual system · `/tools` card previews**

**Problem.** All 26 tool cards on `/tools` have a preview panel, but there are only **10 distinct
preview structures**, and a single template — `DIV,DIV,SPAN,SPAN,SPAN,DIV,I,I,I,SPAN,SPAN,SPAN,svg,path`
— is reused **10 times**, with a second height variant of the same structure on 4 more cards
(14 of 26 cards sharing one shape). The strongest previews are the exceptions: JSON Formatter shows
real JSON, and its preview genuinely communicates the tool.
**User impact.** Cards do not communicate their destination before the click. Users must read every
title because the imagery is interchangeable, which slows scanning of a 67-tool catalogue.
**Evidence.** `tools-icon-only-cards-desktop.webp` — the abstract wireframe-bar and circle previews
adjacent to the meaningful JSON preview.
**Recommended direction.** Give each tool a preview that shows its actual output (as JSON Formatter
does). Where that is impractical, differentiate by category rather than reusing one template.
**Acceptance criteria.** No preview template structure is used by more than 3 cards on `/tools`,
and a user shown only the preview can name the tool's output category for the 20 featured tools.

---

**F-08 · Visual system · `/games` thumbnails**

**Problem.** Of 24 game cards: **19 use a single emoji as the primary visual** (🎯 ⚡ ➗ 🔢 🐍 🌈 🏃 ⬢ …),
**23 of 24 sit on a flat CSS gradient**, only **1 (Gridland) has a real image asset**, and **0** have
a custom illustration ≥ 80 px.
**User impact.** The arcade reads as placeholder art. Emoji render differently per OS/browser and
carry no product identity, so the games catalogue looks unfinished next to the tools catalogue.
**Evidence.** `games-emoji-thumbnails-desktop.webp` — Gridland's pixel art beside 🔢 and 🐍 on flat
gradients.
**Recommended direction.** Commission or generate a per-game thumbnail (a real gameplay frame is
cheapest and most informative — Gridland demonstrates the target quality).
**Acceptance criteria.** Every game card uses a bespoke raster or vector thumbnail; 0 cards rely on
an emoji glyph as the primary visual.

---

**F-09 · Cards · `/games` card metadata and actions**

**Problem.** Every one of the 24 game cards prints its play time **twice** — a "5 MIN" badge
overlaid on the thumbnail *and* a "5 min" chip in the meta row (measured: 2 occurrences on 24/24
cards). Cards also duplicate meaning across labels ("QUICK BREAK" badge + "Quick hit" chip;
"Touch ready" chip + "Mobile" chip), totalling 3 badges + 4 meta chips = **7 metadata items per
card**. Each card additionally exposes **3 competing interactive targets**: the whole-card title
link, a heart/favourite button, and a "Play now" button. On `/games/2048` there are **5 play
controls** on a single page.
**User impact.** Card height inflates to 553 px, only ~3 cards fit a desktop screen, and the
duplicated chips add no information. Nested actions inside a card-level link are also a common
mis-tap and screen-reader confusion source.
**Evidence.** `games-emoji-thumbnails-desktop.webp`, `games-card-duplicate-playtime-mobile.webp`.
**Recommended direction.** Show play time once, collapse synonym chips to one, and reduce to one
primary action plus the favourite control.
**Acceptance criteria.** No game card renders the same fact twice; each card has ≤ 4 metadata items
and ≤ 2 interactive targets; card height ≤ 420 px at 1440 px.

---

**F-10 · Visual system · `/tech-atlas` section illustrations**

**Problem.** 10 of the 12 large SVGs on `/tech-atlas` share the **exact same structure** — viewBox
`0 0 430 176` containing precisely two `path` elements. Only 3 distinct large-SVG structures exist
on the page.
**User impact.** The six Atlas doorways (Resources, Learning Paths, Careers, Teams, Methods,
Language) are visually interchangeable, so the illustrations decorate without helping users choose.
**Evidence.** `atlas-repeated-svg-system.webp` — the Resource Explorer and Learning Paths cards
carry the same curve-plus-dots motif.
**Recommended direction.** Give each Atlas section a distinct motif keyed to its content.
**Acceptance criteria.** No SVG structural signature repeats more than twice on `/tech-atlas`.

---

**F-11 · Content · tool naming, sitewide**

**Problem.** "Studio" appears **133 times** across `src/`, spanning **73 unique "…Studio" titles**:
"Lorem Ipsum & Placeholder Content Studio", "JSON Formatter Production Studio", "Beam Calculator
Production Studio", "Spacebar Counter & Session Studio", "Word Counter Studio", "BMI Screening
Studio", "Click Speed Test & Session Studio", and so on. "Production Studio" is applied to a JSON
formatter and a beam calculator alike.
**User impact.** The word carries no information because it never varies, while inflating titles
past the two-line card budget (F-12) and diluting SEO value against the searched term
("json formatter", not "json formatter production studio").
**Evidence.** 133 `\bStudio\b` matches; 73 unique titles; visible in
`tools-long-title-studio-mobile.webp`.
**Recommended direction.** Reserve "Studio" for genuinely multi-panel workspaces; name the rest for
what the user searches for.
**Acceptance criteria.** ≤ 10 tools use "Studio"; no title uses "Production Studio"; no tool card
title exceeds 32 characters.

---

**F-12 · Cards / Layout · `/tools` grid row alignment**

**Problem.** At 1440 px, **7 of 16 multi-column rows** on `/tools` have a card-height spread > 8 px,
worst case **62 px** ("Fake Screen Studio" 230 px, "Beam Calculator Production Studio" 254 px,
"CSS Grid Generator" 192 px in the same row). Titles run to 40 characters and wrap to a second
line, and the description length varies freely, so CTA rows do not share a baseline.
**User impact.** Ragged card bottoms and misaligned CTAs across every row make the catalogue look
unfinished and make scanning harder.
**Reproducible condition.** `/tools` at 1440 px, 3-up grid. At 375 px the grid is single-column, so
the misalignment does not appear — this is a desktop/tablet finding.
**Evidence.** `tools-icon-only-cards-desktop.webp`; measured spreads 52 / 62 / 52 px.
**Recommended direction.** Fix the title area to two lines and clamp descriptions to a fixed line
count so the CTA row sits at a constant offset.
**Acceptance criteria.** All cards in the same grid row align at the CTA baseline (height spread
≤ 8 px) at 375 px and above.

---

**F-13 · Heroes · `/tech-atlas`, `/resources`, `/games`, `/tools`**

**Problem.** Every portal hero is taller than the viewport it opens in. Measured at 1440×900:
`/resources` **1187 px**, `/tech-atlas` **1108 px**, `/games` ~1200 px (card grid does not begin
until ≈1700 px). Atlas hero text alone is 611 characters, `/resources` 707 characters, each with
3 CTAs plus a badge row and a 4-cell stat strip.
**User impact.** The first screen of every section is entirely editorial: a user arriving at
`/games` to play something must scroll roughly two full screens before seeing a game. The Atlas
hero's own CTAs are cut off at the fold.
**Evidence.** `atlas-desktop-hero-overflow.webp`, `atlas-reduced-motion.webp` (CTAs clipped at
y≈890), `games-emoji-thumbnails-desktop.webp` (grid cropped from y=1650).
**Recommended direction.** Cut hero copy to one sentence, reduce to one primary CTA, and move the
stat strip below the first product row.
**Acceptance criteria.** On every portal route at 1440×900, the first product card is at least
partially visible without scrolling (hero height ≤ 620 px).

---

**F-14 · Footer · global (`SiteFooter.tsx`)**

**Problem.** The footer is **1145 px tall — 1.27× the 900 px viewport** — with 25 links, 5 heading
blocks, 944 characters, and 5 hrefs duplicated *within the same footer* (`/tools`, `/search`,
`/editorial-policy`, `/contribute`, and the GitHub URL each appear twice). It also contains 5 text
nodes at 10 px.
**User impact.** Users scroll more than a full screen of low-value navigation on every page, and
duplicated links make the footer harder to scan than a shorter one would be.
**Evidence.** `footer-desktop-density.webp`.
**Recommended direction.** Consolidate to 3 columns, deduplicate the 5 repeated links, and raise
the 10 px text to 12 px minimum.
**Acceptance criteria.** Footer height ≤ 520 px at 1440×900; no href appears more than once; no
footer text below 12 px.

---

**F-15 · Performance · `src/app/layout.tsx:61`**

**Problem.** `await cookies()` in the **root layout** (reading the `theme` cookie) opts the entire
route tree into dynamic rendering. The production build statically prerenders only **5 routes**, all
of them assets or metadata (`/robots.txt`, `/sitemap.xml`, `/favicon.ico`, `/opengraph-image`,
`/_global-error`). **Zero content pages are static** — all 113 are marked `ƒ (Dynamic)`.
**User impact.** Every visit to every page, including entirely static content like
`/tech-glossary` and `/editorial-policy`, costs a server render. Slower TTFB and higher hosting
cost than the content requires, and no CDN edge caching.
**Evidence.** `.next/prerender-manifest.json` lists 5 routes; build output marks every page `ƒ`.
**Recommended direction.** Move theme resolution out of the server render — resolve
`prefers-color-scheme` in CSS plus a tiny inline script for the cookie override — so content routes
can be static or ISR.
**Acceptance criteria.** Content routes with no per-request data (glossary, policy, guides,
comparisons) build as `○ (Static)` or ISR.

---

**F-16 · Interaction · `/search` result ranking**

**Problem.** `/search?q=json` returns 43 matching items, but the two highest-ranked results are
**"Lorem Ipsum & Placeholder Content Studio"** and **"Password Generator & Policy Studio"** —
neither matches the query. The exact match, "JSON Formatter Production Studio", ranks third, and
other true matches ("JSON Contract Studio", "JSONPlaceholder", "JWT Decoder") appear ~1400 px
further down the page.
**User impact.** The top of the result list is occupied by items unrelated to the query, so search
does not feel trustworthy for a catalogue of 645 entities.
**Evidence.** Section-attributed result ordering under the "Results for "json"" heading;
2 of the top 3 results contain no query token in title or href.
**Recommended direction.** Weight exact title matches above featured/curation boosts, or clearly
separate a small "Featured" strip from ranked results.
**Acceptance criteria.** For a query exactly matching a tool title, that tool ranks first, and
every result above the fold contains the query token in its title, tags, or description.

---

**F-17 · Content · `/search` duplicated result set**

**Problem.** After ~20 results, `/search` renders a **"Featured matches"** section that repeats the
same top six items in the same order already shown under "Results for …" — Lorem Ipsum, Password
Generator, JSON Formatter, Fake Screen, Beam Calculator, Mouse Scroll Test.
**User impact.** Users scroll past a screen of results only to meet the identical six items under a
new heading, which reads as a bug and lengthens the page for no gain.
**Evidence.** Heading offsets: "Results for "json"" at y=865 with those six items at y=997–1339;
"Featured matches" at y=2984 repeating the same six at y=3115–3458.
**Recommended direction.** Either exclude already-listed items from "Featured matches" or move the
featured strip above the ranked results and de-duplicate.
**Acceptance criteria.** No entity appears more than once on a single search results page.

---

**F-18 · Typography · sitewide, worst on `/`**

**Problem.** The landing page renders **94 text nodes below 12 px**, including **5 nodes at 7.7 px**
and 7 at 8.0 px. SVG text is also small: 5 nodes at 8 px and 9 at 10 px on `/`, and 5 at 10 px plus
6 at 11 px on `/tech-atlas` — the Atlas hero labels (RESOURCES, METHODS, PATHS, ROLES, TEAMS,
LANGUAGE) are 10–11 px uppercase with wide letter-spacing.
**User impact.** Sub-8 px text is effectively unreadable for most users and unusable for anyone
with reduced vision. Because it is inside SVG, it does not always scale with browser text settings.
**Evidence.** `atlas-reduced-motion.webp` (hero diagram labels),
`atlas-repeated-svg-system.webp` (RESOURCE EXPLORER / LEARNING PATHS in-SVG labels).
**Recommended direction.** Set a 12 px floor for all body and metadata text; convert in-SVG labels
to real HTML so they scale and reflow.
**Acceptance criteria.** No rendered text node below 12 px on any audited route; no text inside an
SVG below 12 px at default zoom.

---

**F-19 · Typography / Dark mode · light-theme metadata badges**

**Problem.** In light mode on `/tools`, badge text `rgb(19,184,166)` (teal) on white at 11 px
measures **2.49:1** — WCAG AA requires 4.5:1 for text this size. Affects repeated labels including
"Browser-only" and "Local storage". 13 of 232 measured light-mode text nodes fall below AA.
**User impact.** Privacy and capability labels — exactly the metadata the product uses to build
trust — are the least legible text on the card.
**Evidence.** Computed-style contrast sweep, 232 nodes measured on `/tools` in light mode.
**Recommended direction.** Darken the teal token for text use (keep the bright value for
borders/fills) and raise badge text to 12 px.
**Acceptance criteria.** All text meets WCAG AA (4.5:1 normal, 3:1 large) in both themes.

---

### P3 — later polish

---

**F-20 · Layout · `/guides` at 320 px.** 9 px horizontal overflow caused by decorative
`DIV.darma-footer-aurora` elements rendering at 544 px and 480 px inside a 320 px viewport.
Purely decorative, but it produces a horizontal scrollbar.
**Evidence.** Overflow sweep, 17 routes × 2 widths.
**Recommended direction.** Add `overflow: hidden` to the aurora container.
**Acceptance criteria.** `scrollWidth <= 320` on `/guides` at 320 px.

---

**F-21 · Dark mode · footer copyright.** `rgb(129,123,114)` on `rgb(16,23,21)` at 12 px measures
**4.34:1** against a 4.5:1 requirement — the single dark-mode AA failure out of 370 nodes measured.
**Recommended direction.** Lighten the muted-text token one step in dark mode.
**Acceptance criteria.** Footer legal text ≥ 4.5:1 in dark mode.

---

**F-22 · Content · internal vocabulary in user-facing copy.** `/search` tells users
"The shared **CoreEntity registry** powers the complete discovery layer" under headings
"DARMA CORE" and "UNIFIED SEARCH"; `/collections` opens a section with
"**Batch 10** introduces shared UI primitives that future Darma sections can use without rebuilding
the same discovery patterns again."
**User impact.** Internal architecture names and sprint numbers describe the system rather than the
user's benefit, and mean nothing to a general visitor.
**Evidence.** `collections-planned-state-desktop.webp`; `/search` hero copy.
**Recommended direction.** Rewrite in terms of what the user gets. Remove `CoreEntity`,
`DARMA CORE`, and `Batch 10` from user-facing text.
**Acceptance criteria.** No user-facing copy contains internal type names, registry names, or
batch/sprint numbers.

---

**F-23 · Motion · `AtlasHeroScene.tsx:30`.** `root.querySelectorAll("[data-hero-chip]")` returns an
empty NodeList when the optional `labels` prop is empty (its default), and the empty list is passed
to `gsap.fromTo`, logging `GSAP target [object NodeList] not found` repeatedly on `/tech-atlas`.
**Recommended direction.** Guard the tween on `chips.length > 0`.
**Acceptance criteria.** Zero GSAP warnings in the console on every audited route.

---

**F-24 · Dark mode · `src/app/layout.tsx:62`.** The theme resolves from a `theme` cookie defaulting
to `"light"`, with no `prefers-color-scheme` fallback, so a visitor whose OS is set to dark gets a
light first paint and must toggle manually.
**Recommended direction.** Default to `prefers-color-scheme` when the cookie is absent (pairs
naturally with the F-15 fix).
**Acceptance criteria.** A first-time visitor with an OS dark preference receives dark mode on
first paint with no flash.

---

## 7. Visual-system findings

**Tool previews.** All 26 cards have a preview panel, but only 10 distinct structures exist and one
template covers 14 cards (F-07). The best previews render real output (JSON Formatter shows actual
JSON) and prove the pattern works; the majority are interchangeable abstract shapes.

**Game thumbnails.** 19/24 emoji, 23/24 flat gradient, 1/24 a real asset, 0/24 a custom
illustration (F-08). Gridland's pixel art sets the quality bar the other 23 do not meet.

**Atlas illustrations.** One two-path `0 0 430 176` template reused 10 times across 12 large SVGs
(F-10). The hero diagram is the exception — a genuine, distinct illustration
(`atlas-reduced-motion.webp`).

**Typography.** 94 sub-12 px nodes on the landing page, floor at 7.7 px; in-SVG labels at 8–11 px
(F-18). Wide-tracked uppercase micro-labels (`OPEN SOURCE`, `NO ACCOUNT REQUIRED`, `EXPLORE THE MAP`)
are a recurring motif at 10–11 px. Long headings behave well otherwise: no clipped or truncated
titles were found, and the 40-character maximum tool title wraps cleanly to two lines rather than
being cut off.

**Cards.** Game cards are uniform in height (553 px, spread 0) but overloaded — 7 metadata items,
3 interactive targets, duplicated play time (F-09). Tool cards are the inverse: varied metadata but
inconsistent heights, up to 62 px spread per row (F-12). Mobile tap targets are adequate
throughout (the menu toggle is 44×44). Hover and keyboard focus states are present and correct.

**Heroes.** Every portal hero exceeds its viewport: 1108–1200 px in a 900 px window, 611–707
characters, 3 CTAs each (F-13). Atlas hero CTAs are clipped at the fold.

**Header.** Renders correctly at all widths (`landing-desktop-baseline.webp`). Good accessibility
fundamentals: 44×44 mobile toggle, focus trap with Tab cycling, Escape to close, focus returned to
the trigger on close, `aria-expanded` maintained. No issues found.

**Footer.** 1145 px = 1.27× viewport, 25 links, 5 self-duplicated hrefs, 5 nodes at 10 px (F-14).

**Dark mode.** Strong. Tokens switch correctly and only 1 of 370 measured nodes misses AA (F-21).
Light mode is actually the weaker theme (13 of 232 nodes below AA, F-19). Not screenshotted — see
§2 limitation 4.

**Mobile.** No horizontal overflow at 375 px on any route. At 320 px, two overflows (F-06 36 px on
`/comparisons`, F-20 9 px on `/guides`). Pages are very long on mobile — `/tools` reaches 15 942 px
(≈19.6 viewports) at 375 px.

**Motion.** No fail-safe on 7 GSAP components (F-04); reduced-motion path verified correct;
console warnings from an empty tween target (F-23). No excessive replay, jank, or layout thrash
observed; scroll-triggered reveals use `once: true`. The Atlas hero glow runs a continuous
`repeat: -1` yoyo tween, but it is a single element, not per-card ambient animation inside a grid.

---

## 8. Content findings

**Reviewed-reference messaging.** The "400 reviewed references" claim appears in 6 places and is
unsupported by the governance data for 356 of 400 records (F-03). This is the single most important
content issue because it is the product's core trust proposition.

**Redundant copy.** Play time printed twice on all 24 game cards; synonym chip pairs
("QUICK BREAK"/"Quick hit", "Touch ready"/"Mobile") (F-09). The `/search` page renders its top six
results twice under different headings (F-17). The footer repeats 5 of its own links (F-14).

**Weak or missing copy.** No missing titles or descriptions were found — every tool, game,
resource, path, career, and guide has both. The weakness is uniformity, not absence: "Production
Studio" is applied indiscriminately (F-11).

**Long titles.** Maximum tool title is 40 characters ("Lorem Ipsum & Placeholder Content Studio");
several exceed 32 and wrap to two lines, driving the row misalignment in F-12. No title is clipped
or truncated without a way to read it.

**Generic CTAs.** Mostly good — Darma uses specific verbs ("Open browser tools", "Search trusted
resources", "Choose a learning route", "Find a resource", "Browse lane"). The exceptions are the
five planned-collection buttons labelled **"Coming soon"** that point at 404 routes (F-01) and
generic "Open collection" on live cards.

**Repeated terminology.** "Studio" ×133 across 73 titles (F-11). "Workspace" and "connected system"
also recur across every portal hero.

**Internal/product-team language.** "CoreEntity registry", "DARMA CORE", "UNIFIED SEARCH",
"Batch 10 introduces shared UI primitives" (F-22).

**Repeated hero information.** Each portal hero restates the same three claims (open source, no
account required, browser-first) already present in the header, the footer, and the landing page.

**Sections that delay primary content.** All four portal heroes (F-13); `/games` needs ~1700 px of
scrolling before the first game.

**Content gaps.** Five collections are defined with sections and search placeholders but have no
routes (F-01/F-02) — two of them (Resources, Learning) are actually built and just mislabelled.

---

## 9. Broken and risky interactions

**Dead routes.** 4 — `/templates`, `/components`, `/ai`, `/learning`, all linked from
`/collections` (F-01). These are the only dead internal links among 254 unique internal hrefs.

**Broken fragments.** **None.** All fragment links resolve. Specifically, the two suspected
anchors are **working**: `/contribute` renders both `id="learning-paths"` and `id="resources"`
(alongside `contribution-options`, `review-process`, `atlas-content`, `broken-links`,
`main-content`), so `/contribute#learning-paths` (from `/learning-paths`) and `/contribute#resources`
(2 links from `/resources`) both land correctly. Evidence: `contribute-anchor-targets.webp` and the
rendered id list. *An early source-only grep suggested these were missing; the rendered DOM
disproves it, because the ids come from child components.*

**Dead buttons.** None found. Every button inspected performs an action.

**Misleading planned-state interactions.** The five planned collections carry
`primaryAction: { label: "Coming soon" }`. On the `/collections` "Planned collections" grid these
render correctly as **non-interactive** cards (no CTA, just a clock icon) — good. The leak is the
separate "Live core entries" rail lower on the same page, which maps all collections including
planned ones and does emit clickable 404 links (F-01).

**Silent failures.** One: a failed remote logo host leaves an empty tile with no fallback (F-05).

**Keyboard/focus issues.** None found. Real Tab navigation paints a visible ring
(1.6 px outline + box-shadow), `focus-visible` is used 181× across CSS and components, and the
mobile drawer implements a focus trap, Escape-to-close, and focus return to the trigger.

**Loading and empty states.** The zero-result search state is well handled:
`/search?q=zzzzqqqnope123` renders "0 matching items", "No Darma results found", and
"Try a different keyword, choose another kind, or reset the category filter." No
`loading.tsx`/`error.tsx` boundaries exist anywhere in `src/app` (only `not-found.tsx`) — so a
server error would fall back to the framework default rather than a Darma-branded page. Noted as an
observation; not reproduced as a user-facing failure.

**External links.** Third-party resource links carry appropriate attributes; live external link
health was not checked (§2 limitation 7).

---

## 10. Screenshot evidence index

18 WebP files in `docs/qa/pr37-phase-0/screenshots/`, **1.03 MB total**. Captured with system
Chrome `--headless=new` at DPR 1. Files marked *(reduced motion)* used
`--force-prefers-reduced-motion` so entrance animations are complete and layout is measured rather
than mid-animation. Full-height PNG originals remain local only (scratchpad, not committed).

| Filename | Route | Viewport | Demonstrates |
| --- | --- | --- | --- |
| `landing-desktop-baseline.webp` | `/` | 1440×900 | Baseline landing render; header renders correctly (disproves the automation-browser artifact); hero fills the fold |
| `landing-mobile-hero-fold.webp` | `/` | 375×812 | Mobile hero occupying the entire first screen |
| `landing-tablet-baseline.webp` | `/` | 768×1024 | Tablet baseline; no overflow |
| `atlas-desktop-hero-overflow.webp` | `/tech-atlas` | 1440×900 | **Motion evidence (animated).** Hero mid-reveal: heading incomplete, illustration unresolved, CTAs clipped at the fold (F-04, F-13) |
| `atlas-reduced-motion.webp` | `/tech-atlas` | 1440×900 | *(reduced motion)* Same route fully rendered — proves the reduced-motion fallback is correct (F-04); shows "400 reviewed references" (F-03) and 10–11 px in-SVG labels (F-18) |
| `atlas-repeated-svg-system.webp` | `/tech-atlas` | 1440×2000 | *(reduced motion)* One two-path SVG template reused across section cards (F-10); tiny in-SVG labels (F-18) |
| `atlas-mobile-card-grid.webp` | `/tech-atlas` | 375×1500 | *(reduced motion)* Atlas card grid at mobile width |
| `tools-icon-only-cards-desktop.webp` | `/tools` | 1440×1700 | *(reduced motion)* Repeated abstract preview templates beside the meaningful JSON preview (F-07); hero depth (F-13) |
| `tools-long-title-studio-mobile.webp` | `/tools` | 375×1300 | *(reduced motion)* 40-character "…Studio" titles wrapping to two lines (F-11, F-12) |
| `tools-320-stress.webp` | `/tools` | 320×1200 | *(reduced motion)* 320 px stress test — `/tools` itself does not overflow |
| `games-emoji-thumbnails-desktop.webp` | `/games` | 1440×1650 crop | *(reduced motion)* Emoji-on-gradient thumbnails, Gridland's real art for contrast (F-08); "5 MIN" badge + "5 min" chip duplication and card/heart/"Play now" targets (F-09) |
| `games-card-duplicate-playtime-mobile.webp` | `/games` | 375×1550 crop | *(reduced motion)* Same duplication and card overload at mobile width (F-09) |
| `resources-remote-logos-desktop.webp` | `/resources` | 1440×1700 | *(reduced motion)* Third-party logo tiles from 12+ external hosts (F-05); hero density (F-13) |
| `collections-planned-state-desktop.webp` | `/collections` | 1440×1900 | *(reduced motion)* "2 LIVE / 5 PLANNED" with live Resources and Learning listed as planned (F-02); planned cards feeding the 404 links (F-01); "Batch 10" copy (F-22) |
| `learning-paths-desktop.webp` | `/learning-paths` | 1440×1500 | *(reduced motion)* Live learning paths — the product the registry calls "planned" (F-02) |
| `not-found-404-desktop.webp` | `/this-route-does-not-exist` | 1440×900 | Genuine 404 rendering via `not-found.tsx` |
| `footer-desktop-density.webp` | `/editorial-policy` | 1440×1400 | *(reduced motion)* Footer at 1.27× viewport with duplicated links and 10 px text (F-14) |
| `contribute-anchor-targets.webp` | `/contribute` | 1440×1200 | *(reduced motion)* Contribution sections whose ids make `#learning-paths` and `#resources` **work** (§9 — not-reproduced concerns) |

---

## 11. Phase 1 recommended scope

Confirmed scope only, in dependency order:

1. **Collection routes and statuses (F-01, F-02).** Remove the four dead links; set Resources live;
   repoint or retire `learning` → `/learning-paths`. Smallest change with the clearest user benefit.
2. **Trust messaging (F-03).** Reconcile "400 reviewed references" with the governance data across
   all 6 occurrences — either soften the wording or add a real reviewed flag.
3. **GSAP fail-safe (F-04).** Add `.catch()` to all 7 consumers, stop caching rejected promises in
   `loadGsap()`, add a visibility timeout. Include the F-23 empty-target guard here.
4. **Dead and risky actions (F-05).** The remaining confirmed silent failure is the remote-logo
   fallback. Add an `onerror` monogram fallback and decide on proxying vs self-hosting.
5. **320 px overflow (F-06, F-20).** Two small, isolated CSS fixes.

**Removed from the planned Phase 1 scope:** *contribution anchors*. `/contribute#learning-paths`
and `/contribute#resources` both already resolve to real ids (§9). No work required.

Everything else (F-07 through F-19, F-21, F-22, F-24) belongs to the visual-quality sprint proper —
the card, hero, thumbnail, typography, and footer systems — and should be scoped after Phase 1
lands.

---

## 12. Release recommendation

**Release candidate requiring P1 fixes.**

The engineering baseline is sound: the production build passes, type checking is clean, lint has
zero errors, 1503 of 1504 tests pass (the one failure is a Windows worker-spawn artifact that
passes in isolation), all seven content and governance audits pass, and there are no console
errors, failed requests, broken images, hydration warnings, or 200 %-zoom overflows anywhere.
Keyboard accessibility, focus management, the reduced-motion path, dark-mode contrast, the 404
page, and the empty-search state are all in genuinely good shape.

It is not ready to ship as-is for two reasons, both narrow and both fixable inside Phase 1: the
site links users to four routes that do not exist, and its central trust claim ("400 reviewed
references") is not supported by its own governance data. Both are P1 correctness-of-claim issues
rather than functional breakage, which is why this is a release *candidate* and not a "not ready".

The larger body of P2 findings — interchangeable card visuals, emoji game thumbnails, oversized
heroes and footer, "Studio" everywhere, no static prerendering — is exactly the material the visual
quality sprint exists to address. None of it blocks a release; all of it currently makes a
technically solid product look less finished than it is.
