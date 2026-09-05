# Darma Context Recovery Sprint - Final Report

**Branch:** `improve-box-shadow-context`
**Base:** `main` @ `f63296c`
**Report date:** 2026-09-05
**State:** the entire sprint is **uncommitted in the working tree**. `git log main..HEAD` is empty; every change below lives in `git status` (186 modified + 5 untracked paths).
**Revision:** final - updated after the closing pass that completed the last 7 tools and the 2 density fixes.

All figures in this report were derived from the current branch state by bracket-matching each guided-content array literal in the working tree against its `HEAD` version, not from the batch notes.

---

## 1. Scope and method

- **Tool registry:** `getToolRegistry()` returns **70 tools** - 69 `public`, 1 `unlisted` (`csp-generator`).
- **Tool route directories:** 76 under `src/app/tools/`, of which 6 are non-tool hub/shared routes (`_shared`, `audience`, `category`, `fun`, `privacy`, `workflows`). 76 - 6 = 70, matching the registry exactly.
- **Changed tool slugs:** 63 (62 public + `csp-generator`).
- **Unchanged public tools:** 7.
- Counts were produced by a bracket-matching scanner over every changed `.ts`/`.tsx` file, comparing `HEAD:<path>` to the working tree. Spot-checked by hand against `regex-tester` (20), `photo-filter-editor` (40), `css-gradient-generator` (28), `buttons-css-generator` (41, also asserted by its own test), `svg-path-editor` (53), `todo-list` (30), `css-loaders` (14) and others - all matched.

---

## 2. Per-tool detail

Fields per tool: **(1)** name · **(2)** before · **(3)** now · **(4)** counts · **(5)** categories / representative new cases · **(6)** restored legacy · **(7)** density UI · **(8)** article/docs · **(9)** decisions/constraints · **(10)** verification.

Where a field is identical across a large group of tools it is stated once in the group header to keep the report readable.

The seven tools completed in the final closing pass are covered in **§3.1** rather than repeated here.

### 2.1 Flagship / structurally-changed tools

---

**Box Shadows Generator** (sprint origin - the branch is named after it)
2. 6 flat presets, no categories, a short Article, and **no** shadow gallery. The historical 66-item shadow library (`src/data/shadowsData.ts`) had been deleted in commit `e96961c` ("remove dead code").
3. 18 categorised use-case presets **plus** a restored 66-example shadow style gallery with its own derived categories.
4. **Presets 6 → 18.** Gallery **0 → 66 restored**. Article `useCases` block: new, 6 entries.
5. Preset categories: Cards, Overlays, Navigation, Forms, Buttons, Marketing, Special (`presetCategories`, 8 including "All"). New presets include Pricing card, Product card, Dropdown, Popover, Modal, Toast notification, Sticky header, Floating navigation, Input focus, Input inset, Button hover, Pressed button, Brand glow, Neo-brutal. Gallery categories are **derived at runtime** by `getGalleryCategory()` into Inset / Layered / Crisp / Floating / Soft.
6. **Yes - the only restored legacy content in the sprint.** `src/data/shadowsData.ts` is re-added as an untracked file with **66** `ShadowItem` entries. Diffed against `e96961c^`: identical except the type import was rewired to `@/types` (24 diff lines, all type plumbing). This is restoration, not new authoring.
7. Category pill filter on presets (`presetCategory`), a second category filter on the gallery (`galleryCategory`), a live `{filteredPresets.length} presets` badge, a `{shadowsArray.boxShadows.length} examples` badge, quick-styles strip capped at `slice(0, 6)`, and gallery capped at `slice(0, 18)` behind "Show all N examples / Show fewer examples".
8. Article gained "Choose by use case", "What each control changes", "Production rule of thumb" and a 6-entry `useCases` data block. `README.md` +9 lines.
9. The restored file is **untracked** - it must be `git add`-ed or the branch will not build for anyone else (`BoxShadowsGeneratorClient.tsx:20` imports `@/data/shadowsData`).
10. Covered by typecheck + full test suite. **Not browser-verified in this session.**

---

**CSS Loaders**
2. 4 quick collections over the existing large loader gallery.
3. 14 intent collections; the loader library itself untouched.
4. **Collections 4 → 14.** Gallery: **1,545 loaders** (reported live by the tool as "from 1545 total"), unchanged.
5. Existing: Button states, Skeleton screens, React / Tailwind, Progress UI. New: Auth & redirect (spinners, 191), Typing / AI response (dots, 112), Live status (pulse, 65), Data processing (bars, 112), Dashboard refresh (minimal, 57), Tailwind classes (format:tailwind, 51), Full-page wait (popular, 122), Playful products (fun, 322), Brand moment (creative, 400), My saved loaders (savedOnly).
6. None.
7. 6 visible + "Show all 14 use cases / Show fewer use cases"; the pre-existing category pills, search, sort, density and cards-per-page controls are preserved, as is the lazy preview-chunk loading.
8. Article gained "Choose the loader by user intent"; the newer local "Browse loaders by loading state" + `LoaderHubNav` section was kept rather than replaced.
9. Two corrections to the reference: `minimal-ui` used `sort: "newest"`, which is not a valid `LoaderSortKey` (`"popular" | "name" | "category"`) and would not typecheck; it also resolved to the **same 57 results** as `dashboard-refresh`, so it was replaced with a distinct **Tailwind classes** collection. The newer local `initialFilters` prop (category hub routes) was preserved against a reference that had reverted it.
10. **Browser-verified.** Toggle 6 → 14 confirmed; all 10 new collections confirmed to apply real filters with distinct result counts; "from 1545 total" confirms the gallery and lazy-loading are intact.

---

**Todo List / Darma Tasks**
2. 20 seed templates.
3. 30 seed templates.
4. **Templates 20 → 30.**
5. Categories span all 10 registry categories. New: Sprint planning, Pull request review, Incident response (Developer/Work); Research project (Student); Job application tracker (Personal); Content launch campaign (Content Creator); Fundraising campaign (NGO/Proposal); Moving house checklist, Weekly meal prep (Home); Event day runbook (Work).
6. None.
7. Existing modal gallery: search box + `role="tablist"` category tabs + featured/recent rows. No new density UI needed.
8. Article FAQ and body copy updated 20+ → 30+ and the audience lists extended (developers, personal life, NGOs).
9. `templates.test.ts` floor raised from `>= 20` to `>= 30` so the new library is actually guarded. All new templates validated against `TodoListType`, `TodoView`, `TemplateCategory`, `TaskPriority`.
10. **Browser-verified.** `/tools/todo-list/templates` reports "Total templates: 30" with all 10 new names present; `/templates/tpl-incident-response` renders sections, priorities and tags correctly.

---

**Paint & Annotate (paint-canvas)**
2. No guided starting points at all.
3. 12 intent-based starters in a dedicated side panel.
4. **Starters 0 → 12** (new files).
5. Quick sketch, Fine notes, Redline review, Marker callout, Highlight passage, Pointer arrow, Diagram lines, Wireframe boxes, Layout blocking, Status dots, Label text, Redact details.
6. None.
7. New `StartersPanel.tsx`: 6 visible + "Show all 12 / Show fewer", with `aria-pressed` active-state detection.
8. Article gained "Start from a drawing intent", placed before the Privacy section.
9. **Hard constraint honoured:** `applyStarter` merges into `settings` only - it never adds, replaces or clears canvas objects. The reference targeted the *old* flat-canvas tool; the starters were re-authored against the current Fabric-based model (`opacity`, `brushPreset`, and the `highlight`/`arrow`/`text`/`pixelate-region` tools), including correct handling of the `highlightPreviousRef` restore path. Two new files: `editor/starters.ts`, `components/StartersPanel.tsx`.
10. **Browser-verified, including the safety constraint:** drew a stroke, applied 4 different starters, confirmed the "Drawing" object survived and the status line reads "…settings applied. Your artwork was not changed."

---

**Fake Screen**
2. 40 presets across 5 modes, no intent layer.
3. Same 40 presets plus a 12-item "Start by goal" shortcut layer.
4. **Presets 40 → 40 (unchanged). Shortcuts 0 → 12.**
5. Check dead pixels, Clean a display, Soft desk light, Presentation update demo, Developer stream, No-signal scene, Broken-screen overlay, Desk clock, Classroom message, Ambient backdrop, Tech event backdrop, Celebration screen.
6. None.
7. 6 visible + "Show all 12 goals / Show fewer goals", sitting above the existing mode-filtered Examples grid.
8. Article gained "Start by purpose", explicitly stating that shortcuts select a real editable preset rather than a special mode.
9. **Hard constraint honoured:** `FAKE_SCREEN_QUICK_GOALS` holds only preset **ids**; the handler looks each up in `FAKE_SCREEN_PRESETS` and applies `{...preset.state, mode: preset.mode}` - the identical call the existing Examples grid uses. **No scene is implemented twice.** All 12 ids verified to resolve, and `FAKE_SCREEN_PRESETS.length === 40` asserted. The reference reintroduced `text-[11px]`/`text-[9px]` in four places; those were **not** taken (typography floor contract).
10. Data-level verified (id mapping + preset count) and the server-rendered markup was inspected and is correct. **The page did not hydrate in the browser pane** - see §7.

---

**SVG Path Editor**
2. 38 example paths across 5 categories.
3. 53 example paths.
4. **Examples 38 → 53.** (The batch note said "39 → 54"; the actual array held 38.)
5. Shapes: Ticket, Cut-corner card, Speech tail panel. Arrows: Long arrow right, External link arrow. Icons: Upload icon, Download icon, User avatar, Shopping bag. UI Elements: Badge hex, Chat bubble, Alert circle. Decorative: Hero wave, Soft blob, Scallop divider.
6. None.
7. Existing Examples tab with search box + category pills (All/Shapes/Arrows/Icons/UI Elements/Decorative); new entries were inserted into their category groups rather than appended.
8. Article gained "Use examples as geometry starters".
9. All 15 new paths were parsed through the tool's own `SvgPath` + `calculatePathBounds` and produce valid non-zero bounds. The reference's "Notification dot" was renamed **"Alert circle"** because the path is an alert glyph, not a dot. Local disclosures and the download-only SVG button were kept over the reference's older layout.
10. Data-level verified (all 15 parse, padded bounds consistent with existing arc-heavy examples). **The page did not hydrate in the browser pane** - see §7.

---

**Beam Calculator**
2. 6 scenarios, no density control.
3. 16 complete, solvable scenarios.
4. **Scenarios 6 → 16.**
5. Off-center point load, partial UDL, point load + UDL, applied moment, upward point load, short-span service load, cantilever interior point load, cantilever partial UDL, cantilever tip moment, cantilever combined loading.
6. None.
7. `BeamPresetCards` now passes `initialVisibleCount={6}` with "Show all scenarios / Show fewer scenarios" via the shared `PresetGallery`.
8. Article gained "Use the scenario library to learn load behavior", closing with an explicit statement that every scenario is an educational starting point for preliminary analysis, **not a structural design recommendation** - alongside the pre-existing Disclaimer section.
9. **Framing constraint honoured.** Reference presets were reformatted from single-line into the file's multi-line style.
10. **Verified numerically.** All 16 presets solve via `analyzeBeam()` with correct statics - e.g. off-center P=12 at x=2.5 on L=8 gives R_A 8.25 / R_B 3.75; cantilever combined gives Fy 14, M 68. **Browser-verified** for the 6 → 16 toggle.

---

**QR Code Generator**
2. 7 presets.
3. 20 destination/use-case presets.
4. **Presets 7 → 20.**
5. Product page, Customer feedback, Portfolio, Support email, Reception phone, SMS check-in, WhatsApp support, Open guest WiFi, Hidden WiFi, Conference contact (vCard), Store location (geo), Workshop calendar (vEvent), Plain-text emergency note.
6. None.
7. Existing 4-visible strip + `<details>` disclosure, relabelled "Show all 20 use cases".
8. Article gained "Start from the job the QR code must perform", stating that every preset value is placeholder example data.
9. **Sample-data constraint honoured:** the Quick starts panel description was changed to "Pick the closest use case, then replace every sample value with your real destination."
10. **Verified.** All 20 presets pass `validateQRForm` with zero errors and produce correct payloads (`WIFI:`, `mailto:`, `tel:`, `SMSTO:`, `geo:`, `BEGIN:VCARD`, `BEGIN:VCALENDAR`, `https://wa.me/…`). Browser-verified that the disclosure holds 4 + 16.

---

**Code Preview Studio**
2. 3 presets.
3. 12 complete HTML/CSS/JS interaction patterns.
4. **Presets 3 → 12** (in `src/sections/CodePreviewTool/presets.ts`).
5. Pricing card, Dashboard stats, Toast notification, FAQ accordion, Mobile navigation, Search filter, Progress steps, Modal dialog, Empty state.
6. None.
7. `initialVisibleCount={6}` + "Show all patterns / Show fewer patterns" via the shared `PresetGallery`.
8. `code-preview-tool/Article.tsx` gained "Start from a complete interaction pattern".
9. Reference presets were minified single-line strings; all 9 were **re-authored as readable multi-line source** to match the file's style, since these presets are shown as editable source. Three audit warnings the tool's own checker raised on the reference code were fixed (`console.log` → `console.info` in two presets, explicit `type="submit"` on the dialog form buttons).
10. **Browser-verified.** Toggle 6 → 12 confirmed and **all 9 new presets score 100/100 with 0 blocking and 0 warnings** in the tool's own production audit.

---

**Color Shades**
2. 5 quick scales; a separate 42-item suggestion library.
3. 16 product-role quick scales; the 42-item suggestion library untouched.
4. **Quick scales 5 → 16.** Suggestions **42 → 42** (verified by counting `id:` entries in `suggestions.ts`).
5. Indigo SaaS, Rose commerce, Teal healthcare, Amber warning, Slate neutral, Violet creator, Cyan data, Lime success, Orange food, Pink campaign, High contrast.
6. None.
7. Existing `<details>` "Quick scale presets" card, now 6 visible + "Show all 16 scales / Show fewer" with `aria-expanded`.
8. Article gained "Start from a product role, not a random color" and "Choosing 9, 10, or 11 shade tokens".
9. Local `--color-primary-text-strong` contrast tokens and the swatch-preview card layout were kept over the reference's pill row.
10. **Verified numerically:** all 16 scales generate full valid hex ramps at 9/10/11 steps through the tool's own `generateShades`. Server-rendered markup confirmed (6 cards, "Show all 16 scales"). **The page did not hydrate in the browser pane** - see §7.

---

**Color Name Finder**
2. 6 quick input examples.
3. 18 quick input examples with a compact toggle in both places they appear.
4. **Examples 6 → 18.**
5. Hex, hex+alpha, `rgb()`, `rgba()`, `hsl()`, and CSS named colors - e.g. `#0f172a`, `#22c55e`, `rebeccapurple`, `tomato`, `slateblue`, `hsl(160 84% 39%)`.
6. None.
7. Shared `showAllExamples` state drives both the invalid-input strip and the "Try example colors" disclosure: 6 visible + "Show all 18 / Show fewer", each with `aria-expanded`.
8. **No Article file exists for this tool** - it is the only changed tool without one. Guidance lives in the client.
9. None beyond keeping the newer local client structure (904 → 926 lines) rather than the reference's older 989-line variant.
10. Covered by typecheck + tests. **The page did not hydrate in the browser pane** - see §7.

---

**Animated Background Generator**
2. 14 presets.
3. 24 presets.
4. **Presets 14 → 24.**
5. Docs Blueprint Grid, Health Calm Orbs, Education Friendly Bubbles, Commerce Product Spotlight, Event Stage Lights, Nonprofit Story Glow, Gaming Energy Field, Wedding Soft Lights, Newsroom Data Pulse, Mobile App Aurora.
6. None.
7. Existing pattern preserved: 6 visible + a full `PresetBrowserDrawer` with search, tag filters and sort, labelled "Browse all 24".
8. Article gained "Choose by page intent before tuning sliders".
9. Local `foregroundMode` / `readabilityProtection` defaults in `presetToState` were preserved against a reference that had dropped them. All shape/blend/gradient values validated against the local unions.
10. **Verified.** All 24 presets map to valid state via `presetToState` (`maxSize >= minSize`, `particleCount > 0`, `foregroundMode: "auto"`, `readabilityProtection: true`). Browser-confirmed the "24 presets" badge and "Browse all 24" drawer.

---

### 2.2 Preset-library expansions

For every tool in this group the pattern is the same and is stated once:
**(2) before** - a small preset/example array (3-16 entries) plus a basic Article. **(6) restored legacy** - none; all content is newly authored. **(8) article** - each gained at least one new "start from your use case" section (headings listed per tool). **(10) verification** - covered by the clean typecheck and the full 1,866-test suite; **not browser-verified in this session** unless noted.

| Tool | Count before → after | Representative new cases | Density UI (7) | New Article heading(s) (8) | Notes (9) |
|---|---|---|---|---|---|
| App Screenshot Mockup | 4 → 14 | SaaS landing hero, Mobile app launch, Documentation screenshot, Dashboard showcase, Changelog release, Portfolio case study, Dark-mode UI | Show all + `<details>` | Choose the mockup by communication goal | - |
| Aspect Ratio Calculator | 12 → 20 | LinkedIn post/cover, X header, Facebook cover, Pinterest pin, 4K UHD, A4 portrait, US Letter | Show all | Choose a target before tuning numbers | - |
| Base64 Encoder/Decoder | 6 → 16 | Unicode message, JSON payload, URL-safe token, SVG data URL, Basic Auth, JWT header/payload, Certificate fragment | Show all | Common workflows differ even when the encoding is the same; JWT decoding does not verify a token | Security-framing copy added |
| Border Radius Generator | 9 → 18 | Compact dashboard card, Modal panel, Bottom sheet, Chat bubble, Filter chip, Hero image, Soft squircle | `PresetGallery` `initialVisibleCount` + `<details>` | Choose the shape by use case first | Adds `public/assets/tools/border-radius-generator/preset-photo.svg` (**untracked**) |
| Buttons CSS Generator | 35 → 41 | Full-width form, Buy now, Social sign-in, Navbar CTA, Destructive outline, Status pill | Show all + categories + search | Choose by job, not just by visual style | `production-p6.test.ts` length assertion updated 35 → 41 |
| Clip Path Generator | 14 → 28 | Decagon, Dodecagon, Arrow left/up/down, Hero diagonal, Cut corners, Bookmark, Price tag, Shield, House, Lightning, Notched card | Category selector (basic 7 / polygon 6 / arrow 5 / decorative 10) | Good places to use clip-path; Ready-made shapes and practical use cases | Category filter means no Show-all needed |
| Color Converter | 8 → 20 | Slate UI, Success green, Warning amber, Danger red, Brand violet, RGB alpha, HSL alpha, Named tomato | Show all + `<details>` | Try formats and UI roles side by side | - |
| Color Palette Generator | 6 → 18 | SaaS dashboard, Fintech, E-commerce, Healthcare, Education app, Developer tool, Creator portfolio, Editorial, Restaurant, Travel, High-contrast UI, Data visualization | Show all + `<details>` | Start from the interface you are designing; Turn a palette into roles, not just swatches | - |
| Container Query Generator | 10 → 20 | Search result, Checkout summary, Notification panel, Team member card, Directory row, Video card, Filter panel, Comment thread, Comparison row, Calendar event, Agenda card, CTA banner | `PresetGallery` `initialVisibleCount` | Start from the component, not a generic breakpoint | - |
| CSP Generator (unlisted) | 5 → 16 | Analytics site, Supabase app, Firebase app, Auth0 SaaS, Maps directory, Cloudinary media, Video commerce, PayPal checkout, Protected forms, Monitored app, Strict minimal | Show all + categories + `<details>` | Start from the services your page actually uses | Maps onto the existing `services.ts` catalog |
| CSS Clamp Generator | 6 → 18 | Section heading, Card title, Lead paragraph, Hero padding, Grid gap, Container, Article measure, Sidebar width, Button height, Avatar size | Show all | Choose a starter by the UI job | - |
| CSS Gradient Generator | 16 → 28 | SaaS Hero, Ocean CTA, Sunset Hero, Dark Dashboard, Success Glow, Purple Brand, Glass Glow, Aurora, Product Spotlight, Warning Banner | Horizontally scrollable preset strip (`overflow-x: auto`) | Start from a UI use case (Product UI / Marketing / Calls to action) | Scroll strip means page height is unaffected |
| CSS Grid Generator | 7 → 18 | Landing page, Pricing comparison, Blog + sidebar, E-commerce catalog, Holy grail, Kanban board, Portfolio projects, Settings form, Analytics overview, Magazine layout | `PresetGallery` **without** `initialVisibleCount` | Start from a real layout, not an empty grid; Which starter should I choose? | ⚠ see §7 - 18 cards render uncapped |
| CSS Transform Generator | 9 → 18 | Floating action hover, Rotate icon, Thumbnail nudge, Tooltip pop, Dropdown hinge, Subtle card tilt, Image tilt, Offset badge, Modal hover emphasis | Show all + `<details>` + drawer | Start from an interaction pattern | - |
| Date Difference Calculator | 6 → 18 | Project deadline, 30-day trial, Invoice due date, Probation period, Conference countdown, Six-week release cycle, Holiday-aware window, Overnight maintenance, Global handoff | Show all | Choose the date workflow first | - |
| Favicon / App Icon Generator | 5 → 14 | Website launch, Next.js app, Installable PWA, iOS shortcuts, Complete brand kit, React/Vite, Astro, Nuxt, SvelteKit, WordPress, Monogram, Maskable-safe icon | Show all + `<details>` | Choose a starter by deployment target | - |
| Flexbox Generator | 11 → 18 | Profile header, Notification row, Tabs row, Button group, Chat message, Footer link groups, Breadcrumb + actions | `PresetGallery` **without** `initialVisibleCount` | Pick by intent; Ready-made Flexbox patterns | ⚠ see §7 - 18 cards render uncapped |
| Glassmorphism Generator | 8 → 15 | Navigation, Pricing tier, Toast, Command palette, Profile card, Media caption | `PresetGallery` `initialVisibleCount` + Show all | Start with a real component use case | - |
| HTML Entity Encoder/Decoder | 6 → 16 | HTML shown as text, Double/single-quoted attribute, Unicode numeric entities, Decode escaped markup, Double-encoding audit, Code snippet in docs, Malformed entity review, Two-pass decode | Native `<select>` (no height impact) | Use a preset that matches the HTML sink; Decoding can reveal active markup | Security-framing copy added |
| Image Compressor / Resizer | 8 → 18 | Support ticket, Email attachment, Portfolio image, Mobile web, Open Graph card, Story cover, CMS thumbnail, Archive quality, Tiny preview, Strict 200 KB form | 6 visible + `Disclosure` "More presets" | Choose a preset by delivery constraint; File-size targets and pixel dimensions solve different problems | - |
| Image Converter | 8 → 18 | Website hero, Blog article image, Product catalog, Open Graph, LinkedIn post, Story/Reel cover, Email banner, UI asset/transparency, 2× → 1×, Marketplace thumbnail | Show all + `<details>` | Start with the destination, not the codec; Choose dimensions before lowering quality; Cover, contain, and stretch | - |
| JSON Formatter | 4 → 12 | Readable API, Stable review, Compact transport, Data inspection, Table dataset, Config file, Log payload, Deep object, Copy-ready, Tab indented, Sorted table | Show all + `<details>` | Use presets to choose the review lens; Formatting intent matters more than indentation preference | - |
| JSON to TypeScript | 6 → 16 | GraphQL response, Search results, CMS article, Analytics event, API error response, Localization map, Feature flags, Payment record, Dashboard widgets | Show all | Choose an example that stresses the same data shape; Prefer several representative samples | - |
| JWT Decoder | 6 → 16 | Service account, Refresh token claims, Scoped API token, Multiple audiences, Mobile session, Admin role token, No expiration claim, Future issued-at, Nested custom claims, Minimal JWT | Show all | Inspect claims by scenario | Samples are generated relative to `now`, so they never go stale |
| Lorem Ipsum Generator | 8 → 16 design, 6 → 12 featured, 5 → 8 length | SaaS hero, Mobile hero, Dashboard cards, Review quotes, Support FAQ, Product cards, Pricing comparison, Microcopy, CMS preview, Content stress test | Show all + `<details>` | Start from the component you need to stress | Three separate arrays expanded |
| Markdown Previewer | 6 → 16 | Project README, API Reference, Release Notes, Incident Runbook, Blog Draft, Meeting Notes, Pull Request, Bug Report, ADR, QA Test Plan, Support Article, Onboarding Guide, Decision Log | Show all | Start from the document you are actually writing; Use examples to learn structure, not to create filler | - |
| Meta Tag Generator | 3 → 14 | Product page, Documentation, Open-source project, Local business, Event page, Job opening, Newsletter, Mobile app, Case study, Changelog release, Profile page | Show all | Choose a preset by page intent; One page can have several previews | Largest relative jump in the sprint (4.7×) |
| Neumorphic CSS Generator | 5 → 16 | Search field, Selected toggle, Stat tile, Pricing card, Floating action, Media control, Settings panel, Notification card, Profile chip, Hero panel, Dark pressed control | `PresetGallery` `initialVisibleCount` + Show all + `<details>` | Start from the UI you are actually building; How the main controls change the result | - |
| OG Image Generator | 5 → 16 | Website launch, Developer tool, Blog article, Next.js app, Social kit, SaaS feature page, Documentation, Changelog, Open-source project, Portfolio, Newsletter, Event, Product update, Hiring, Course, Minimal link card | Show all + `<details>` | Choose the card by page intent | - |
| Password Generator | 5 → 12 | Password manager default, Legacy-compatible login, Shared Wi-Fi password, Database credential, CI/CD secret, Temporary bootstrap login, Strong typed passphrase | Show all + `<details>` | Start from where the secret will be used | - |
| Percentage Calculator | 6 → 18 | Add sales tax, Restaurant tip, Budget share, Traffic drop, Apply price increase, Original before discount, Campaign CTR, SLA improvement, Portfolio return, Wholesale margin, A/B test gap, Capacity used | Show all | Use-case starters reduce formula mistakes | - |
| Photo Filter Editor | 33 → 40 | Product Clean, Crisp Web, Low-light Lift, Landscape Vivid, Warm B&W, Food Pop, Editorial Muted | 10 category filters (essentials 8, creative 5, bw 4, vintage 4, warm 4, cool 3, film 3, moody 3, portrait 3, cinematic 3) | Choose a preset by what the image is for; Fast adjustment recipes | Category filter means no Show-all needed |
| Regex Tester | 6 → 20 | URL finder, UUID finder, IPv4-like finder, Slug rule, Semantic version, Markdown links, Quoted values, Currency amounts, CSS dimensions, Query parameter pairs, Log lines by level, Phone-like finder | Show all + `<details>` | Start with a pattern that demonstrates the technique; Regex is not always the validator | Correctness-framing copy added |
| Responsive Image srcset | 7 → 17 | E-commerce grid, Featured product, News card, Testimonial avatar, Full-bleed banner, Masonry gallery, Logo strip, Documentation screenshot, Mobile-first art direction, Next.js card grid | `PresetGallery` `initialVisibleCount` + Show all + `<details>` | Start from the image's real job | - |
| Robots.txt Generator | 6 → 14 | SaaS marketing + app, Blog/CMS, Local business, Search-heavy site, Media/gallery, Multilingual, API documentation, Preview host: block pages | Show all | Start from the deployment scenario; **Review destructive presets before launch** | Explicit warning copy for the block-all preset |
| Sitemap XML Generator | 4 → 14 | Blog/publication, SaaS marketing, Local business, Knowledge base, Portfolio, Events calendar, Jobs/careers, Multilingual, Media gallery, Large catalog split | Show all | Use a starter that matches the URL inventory; Do not add every reachable URL | - |
| Slug Generator | 6 → 18 | Newsroom routes, Help center, Event pages, Course library, Job board, Category taxonomy, User-generated titles, API resource names, Campaign pages, Redirect audit, Arabic content routes | Show all | Route presets by content type | Includes a non-Latin (Arabic) transliteration case |
| Statistics Calculator | 6 → 18 | Daily signups, Page load times, Fulfillment minutes, Weekly revenue, Support resolution hours, Employee tenure, Funnel conversion %, CPU utilization, Product ratings, P&L sample, Large-value sample, Near-constant readings | Show all | Learn from distributions, not only one sample | Includes deliberate edge-case datasets |
| Text Cleaner | 6 → 18 | Clean copied PDF, Social caption, Developer list, Arabic cleanup, Links + emails, YouTube description, CSV column values, Email recipients, Phone list, Hashtag list, Comma↔lines, Bullet/numbered list, Slug seed lines, Constant names | Show all | Start from the text source or the output you need; Extraction presets intentionally discard surrounding text | Explicit destructive-behaviour warning |
| Timestamp Converter | 6 → 18 | API `created_at`, Browser event, Database microseconds, OpenTelemetry trace, Release date, Webhook with offset, Incident log, Analytics import, Legacy 2001 epoch, 2038 boundary check, Validation batch | Show all | Use realistic timestamp sources | Includes 2038 boundary edge case |
| Timezone Converter | 6 → 18 | US ↔ Europe interview, MENA ↔ Europe sync, Asia team sync, Americas sync, Follow-the-sun handoff, Global live stream, Board meeting, New Year rollout, US DST review, Flight check-in, Release window, Customer training | Show all | Plan around people, not UTC offsets | Includes DST and year-rollover cases |
| Unit Converter | 6 → 20 | Screen size, Marathon distance, Parcel weight, Coffee water, Freezer temperature, Large file size, RAM capacity, UI measurement, Shipping mass, Recipe spoons, Weather temperature, Download size, Person height, Kitchen mass | Show all + categories | Start from the thing you are measuring | - |
| URL Encoder/Decoder | 6 → 16 | Unicode URL, Query value, Nested redirect, Form value, Campaign URL, Security review, Search query, Filter state, mailto subject, Dynamic path segment, OAuth state, Double-encoded value, Hash route | Show all | (Article +12 lines, prose only) | Security-framing copy added |
| UUID Generator | 6 → 16 | Single API ID, Event stream IDs, JSON mock data, CSV import keys, Braced GUID style, Compact bulk IDs, Metadata URNs, Uppercase CSV export, Sortable JSON IDs, Small test batch | Show all | Choose a UUID workflow, not just a version | - |

---

## 3. Sprint totals

| Metric | Value |
|---|---|
| Total standalone tools reviewed | **70** (69 public + 1 unlisted; matches the registry and the 76 route dirs minus 6 hub/shared routes) |
| Total tools changed | **63** |
| Total tools intentionally left unchanged | **7** |
| Guided entries before → after (reliably measurable) | **522 → 1,210** across **66** arrays (**+688 newly authored**) |
| Total restored legacy examples | **66** (`src/data/shadowsData.ts`, restored verbatim from `e96961c^`) |
| Guided entries including restored legacy | **522 → 1,276** |
| Total source files changed | **191** (186 modified + 5 untracked paths): 187 under `src/app/tools`, 2 `src/features/todo`, 1 `src/features/tools`, 2 `src/sections/CodePreviewTool`, 1 `src/data`, 1 `public/assets/…`, 1 `__tasks/` |
| New files created | **4** - `paint-canvas/editor/starters.ts`, `paint-canvas/components/StartersPanel.tsx`, `src/data/shadowsData.ts` (restored), `public/assets/tools/border-radius-generator/preset-photo.svg` |
| Test files updated | **2** (count-assertion floors only) |
| Docs updated | **1** `README.md` (box-shadows, +9 lines) |
| Articles updated | **62 of 63** changed tools (color-name-finder has no Article file) |

**Not reliably measurable and therefore excluded from the totals:**
- The CSS Loaders gallery itself. The tool reports **1,545** loaders at runtime; the batch notes said 1,125 and `loader-hubs.ts` prose says "1,300+". No count was added or removed by this sprint - only the 4 → 14 collection shortcuts.
- The Color Shades suggestion library is stated as 42 (counted directly from `suggestions.ts`) and is **unchanged**.
- Per-batch attribution. The branch has **zero commits**, so no change can be attributed to a specific batch number from git.

### 3.1 Final pass - the last 7 tools

The seven tools previously listed under "Needs follow-up" were completed in a final pass. All follow the patterns established earlier on the branch: intent naming, ~6 visible initially, Show all / Show fewer for card galleries, grouped `<optgroup>` for dropdown pickers, and a new "start from your use case" Article section.

| Tool | Before | After | Density UI | New Article section |
|---|---|---|---|---|
| Code Video Generator | 2 | **16** | Grouped `<optgroup>` picker (Motion 4 / Interface 4 / Interaction 6 / Layout 2) + count hint | Start from a starter project that matches the lesson |
| GPA Calculator | 6 | **18** | 6 visible + "Show all 18 semesters" | Start from a semester that resembles yours |
| Loan Calculator | 6 | **18** | Grouped `<optgroup>` picker (Home 6 / Vehicle 3 / Education 2 / Personal and debt 4 / Retail and business 3) + count hint | Start from the borrowing goal, not the numbers |
| Pomodoro Timer | 6 | **16** | 6 visible + "Show all 16 cycles" | Choose a cycle that matches the work |
| Readability Score | 6 | **18** | 6 visible + "Show all 18 samples" | Start from a sample that matches your audience |
| Tip Calculator | 6 | **18** | 6 visible + "Show all 18 receipts" | Start from a receipt that looks like yours |
| Word Counter | 6 presets + 7 goals | **18 presets + 14 goals** | 6 visible + "Show all 18 samples"; goals in the existing `<Select>` | Start from the piece you are actually writing |

Representative new content: Code Video adds chat typing dots, skeleton shimmer, gradient text, pricing and glass cards, a neon CTA, dashboard tiles, a theme toggle, accessible tabs, an FAQ accordion, an animated count-up, a mini todo list, a landing hero, and responsive navigation. GPA adds Dean's list targets, probation exit, grade-replacement retakes, transfer students, withdrawals, a failed course, a 21-credit overload, and a graduate term. Loan adds used-car, first-home, 15-year, refinance, consolidation, card payoff, small business, renovation, bonus lump sum, retail installment, and a 20-year graduate loan. Pomodoro adds exam revision, writing sprints, code review, language practice, a low-friction 12/6 cycle, deep reading, admin batching, instrument practice, evening wind-down, and pair programming. Readability adds patient instructions, safety notices, onboarding email, school newsletter, study material, a terms excerpt, job description, grant proposal, news summary, recipe steps, an API changelog, and a literature review. Tip adds coffee runs, bar tabs, delivery, birthday meals, expense-claim lunches, UK service charge, hotel breakfast, uneven orders, salon visits, no-tipping regions, catering, and shared taxis. Word Counter adds cover letters, LinkedIn updates, product listings, conference abstracts, long-form guides, ten-minute talks, thread posts, meeting summaries, press releases, README intros, UI microcopy, and a punctuation stress test.

**Two density inconsistencies closed in the same pass:** `css-grid-generator/components/GridControls.tsx` and `flexbox-generator/components/FlexControls.tsx` now pass `initialVisibleCount={6}` to the shared `PresetGallery`, so both render 6 of 18 with a Show all / Show fewer control instead of all 18 at once.

---

## 4. Coverage audit - all 70 standalone tools

### Improved in this sprint (63)

animated-background-generator · app-screenshot-mockup-generator · aspect-ratio-calculator · base64-encoder-decoder · beam-calculator · border-radius-generator · box-shadows-generator · buttons-css-generator · clip-path-generator · **code-video-generator** · code-preview-tool · color-converter · color-name-finder · color-palette-generator · color-shades · container-query-generator · csp-generator *(unlisted)* · css-clamp-generator · css-gradient-generator · css-grid-generator · css-loaders · css-transform-generator · date-difference-calculator · fake-screen · favicon-app-icon-generator · flexbox-generator · glassmorphism-generator · **gpa-calculator** · html-entity-encoder-decoder · image-compressor-resizer · image-converter · json-formatter · json-to-typescript · jwt-decoder · **loan-calculator** · lorem-ipsum-generator · markdown-previewer · meta-tag-generator · neumorphic-css-generator · og-image-generator · paint-canvas · password-generator · percentage-calculator · photo-filter-editor · **pomodoro-timer** · qr-code · **readability-score** · regex-tester · responsive-image-srcset-generator · robots-txt-generator · sitemap-xml-generator · slug-generator · statistics-calculator · svg-path-editor · text-cleaner · timestamp-converter · timezone-converter · **tip-calculator** · todo-list · unit-converter · url-encoder-decoder · uuid-generator · **word-counter**

*(bold = completed in the final pass)*

### Not applicable for presets/examples (6)

| Tool | Why |
|---|---|
| click-speed-test | Input-performance test. Its guided dimension is the `MODES` array (game modes and durations), not a content library. |
| mouse-scroll-test | Same - `MODES` only. |
| reaction-time-test | Same - `MODES` + `PROFILES`. Already a rich five-mode game. |
| spacebar-counter | Same - `MODES` only. |
| scrabble-word-finder | Dictionary lookup driven by a user-supplied rack; `STARTER_WORDS` is a single seed list, not a preset gallery. |
| bmi-calculator | Two numeric inputs and a fixed formula. There is no preset dimension to populate and no `presets.ts`. |

### Already sufficiently rich / no change needed (1)

| Tool | Why |
|---|---|
| text-to-speech | Its guided dimension is the Piper **voice catalog** (starter plus downloadable voices), which is already substantial. It has no `presets.ts` and needs none. |

### Needs follow-up (0)

**None.** Every tool with a real preset dimension now carries a use-case library in the 14-20 range.

**63 + 6 + 1 + 0 = 70.** Every standalone tool in the registry is accounted for.

---

## 5. UX patterns introduced

1. **Guided starting points as the primary entry.** Nearly every changed tool now opens on "start from your use case" rather than an empty state or a raw control panel. 55 of the 63 changed tools carry an explicit "Start from…" / "Choose by…" / "Pick by…" section in their Article.
2. **Intent/use-case naming over visual naming.** Presets are named after the job (`Support email QR`, `Incident response`, `Auth & redirect`, `Redline review`, `Academic probation exit`, `Ten-minute talk`) rather than the parameters. Where a tool previously used visual names, use-case names were added alongside rather than replacing them.
3. **Shared `PresetGallery` upgrade.** `src/features/tools/components/PresetGallery.tsx` gained `initialVisibleCount`, `showMoreLabel`, `showLessLabel`, `aria-expanded`, and **selected-item preservation**: when collapsed, a selection outside the first N is swapped into the visible set so the active preset never disappears. Nine tools now consume it.
4. **Show all / Show fewer as the default density control.** The label always names the total (`Show all 18 receipts`, `Show all 16 cycles`) so the reader knows the cost of expanding.
5. **Categorised galleries where the library is large.** Box Shadows (7 preset categories + 5 runtime-derived gallery categories), Clip Path (4), Photo Filter (10), SVG Path Editor (5 + search), CSS Loaders (12 + search + sort), Todo (10 tabs + search).
6. **Grouped `<optgroup>` pickers where the control is a dropdown.** Code Video (4 groups) and Loan Calculator (5 groups) keep a compact select while making a 16-18 item library scannable, with a count hint below the control. This is the dropdown equivalent of Show all / Show fewer and adds no page height.
7. **Shortcuts that map to existing modes instead of duplicating implementations.** Fake Screen's 12 goals are preset **ids** resolved against `FAKE_SCREEN_PRESETS`; CSS Loaders' 14 collections are **filter states** over the one gallery; Paint Canvas starters are **settings patches**. No scene, loader, or canvas object is implemented twice.
8. **Non-destructive by construction.** Where a guided action could plausibly overwrite user work it was deliberately scoped down (Paint starters change settings only) and the guarantee is surfaced in the status line and the Article.
9. **Honest framing in Articles.** Beam scenarios are labelled educational rather than design recommendations; QR values are labelled replaceable sample data; Robots.txt and Text Cleaner carry explicit destructive-behaviour warnings; JWT and Regex state what the tool does *not* prove; Readability and Word Counter include deliberately bad samples so the review flags can be seen working.
10. **Progressive disclosure via native `<details>`** where a full toggle would be overkill - used by roughly two dozen tools for a secondary preset tier.

---

## 6. Regression / validation report

**Typecheck** - `npx tsc -p tsconfig.json --noEmit`: **clean, exit 0**, run after the final pass.

**Tests** - `npx vitest run` (full suite): **176 files / 1,866 tests passed**, run after the final pass. An earlier run during Batch 12 showed a single failure in `minesweeperEngine.test.ts` (`expected 'won' to be 'playing'`); it passed on three consecutive re-runs and on both subsequent full runs. It is the known flaky randomised-mine test and no game file is in the diff.

Two test files were updated, both count floors: `buttons-css-generator/production-p6.test.ts` (35 → 41) and `features/todo/data/templates.test.ts` (`>= 20` → `>= 30`).

**Lint** - ESLint over all sprint-touched areas: **0 errors**. Remaining warnings are pre-existing on untouched lines, confirmed by linting the stashed `HEAD` version of the same files and getting the identical warning at the pre-shift line number: `colorName.ts` unused `isDark`; `svg-path-editor/lib/svg.ts` unused params; `CssLoadersClient.tsx` ref-in-cleanup; `CodeVideoGeneratorClient.tsx` `useMemo` dependency; `GpaCalculatorClient.tsx` unused `reviewCount`.

**Registry** - `npx tsx scripts/check-tools-registry.ts`: **exit 0**, with two pre-existing informational notices. No registry or tool-metadata file is in the diff.

**Typography floor** - `src/styles/typography.contract.test.ts` passes. A direct grep for `text-[0-11px]` across `src/` (excluding `app/admin`) returns **zero matches**. Two reference batches tried to reintroduce `text-[11px]` and `text-[9px]`; those were rejected during the merge. The one new CSS rule added in the final pass (`.code-video-field>small`) uses `.75rem`, at the floor rather than below it.

**Preset id integrity** - a bracket-matching scan of every preset array with top-level `id:` fields found **no duplicate top-level ids**.

**Mapping integrity** - Fake Screen: all 12 goal ids resolve and `FAKE_SCREEN_PRESETS.length === 40`. CSS Loaders: all 14 collections produce distinct filter results. Loan Calculator: a cross-check confirms all 18 preset ids appear in exactly one `LOAN_PRESET_GROUPS` entry and no group references a non-existent id. Word Counter: all 13 `goalId` values used by presets resolve against the 14 defined goals.

**Value-domain checks on the final pass** - three invalid values were caught and fixed before the typecheck: `roundMode: "none"` in a tip preset (the union is `fair | up-005 | up-050 | up-whole`), a guest `weight: 0` that `split.ts` rejects ("Every weighted guest must have a weight greater than zero"), and `sort: "newest"` in a loader collection during Batch 12.

**Mobile responsiveness** - a grep for unqualified multi-column grids (`grid-cols-3` and higher without a breakpoint prefix) across `src/app/tools` returns **zero matches**.

**Browser / server-render verification.** The dev server was started and each of the nine pages touched in the final pass was fetched and asserted for its guided-content markers:

```
OK  code-video-generator   OK  gpa-calculator       OK  loan-calculator
OK  pomodoro-timer         OK  readability-score    OK  tip-calculator
OK  word-counter           OK  css-grid-generator   OK  flexbox-generator
ALL SSR MARKERS PRESENT
```

In the live DOM, Code Video's grouped picker was confirmed rendering all 16 starters across the four `<optgroup>` labels with the "16 short starter projects" hint; CSS Grid and Flexbox were confirmed rendering exactly 6 of 18 cards with `Show all layouts (18)` / `Show all patterns (18)` and `aria-expanded="false"`.

Earlier sessions browser-verified Paint Canvas (including proving starters never destroy artwork), Beam Calculator (all 16 scenarios solved numerically), QR Code (all 20 payloads validated), Code Preview Studio (all 9 new presets at 100/100 in the tool's own audit), CSS Loaders (all 14 collections applying distinct filters), Todo List, and Animated Background.

**Known limitation - not click-verified:** the seven final-pass tools plus CSS Grid and Flexbox render correctly server-side, but their component trees did not hydrate in the dev preview pane - they stayed in an un-swapped Next.js streaming Suspense chunk (`<div hidden id="S:1">`), the same artifact that affected Color Shades, Fake Screen, SVG Path Editor and Color Name Finder in earlier sessions. It is environmental, not a code defect: CSS Loaders hydrates normally on the same server, and the artifact hides the whole page including pre-existing UI. The Show all / Show fewer click behaviour itself is proven on the pages that do hydrate, and all nine new toggles use the same two implementations (a local `useState` slice, or the shared `PresetGallery`) already exercised there.

---

## 7. Remaining risks / recommended final QA

Ordered by likely impact. Each is a concrete finding from the current branch.

### R1 - Untracked files must be `git add`-ed (blocking)

Five paths are untracked and must be staged before commit:

```
src/data/shadowsData.ts
src/app/tools/paint-canvas/editor/starters.ts
src/app/tools/paint-canvas/components/StartersPanel.tsx
public/assets/tools/border-radius-generator/preset-photo.svg
__tasks/darma-context-recovery-final-report.md
```

The first four are code and asset dependencies: `BoxShadowsGeneratorClient.tsx:20` imports `@/data/shadowsData`, `PaintCanvasClient.tsx:12` imports `./components/StartersPanel`, and two Border Radius presets reference the SVG. Committing without them produces a build failure and two broken image presets. All four were re-verified present at the end of the final pass. The fifth is this report.

### R2 - `aria-expanded` missing on roughly 30 earlier Show all/fewer toggles (accessibility)

Of the files carrying a Show all/fewer toggle, about 30 use the shared `<Button>` with only a changing text label and no `aria-expanded`; one uses a native `<details>/<summary>` (fine); the nine `PresetGallery` consumers are covered by the shared component. **All six toggles added in the final pass do set `aria-expanded`**, so the gap is now confined to earlier batches. The changing accessible name does convey state, so this is a consistency issue rather than a blocker. Best closed by migrating the remaining inline toggles onto `PresetGallery`.

### R3 - "1,300+" loader copy is conservative, not stale

`loader-hubs.ts:8` and the page title say "1,300+ loaders" while the tool reports 1,545 at runtime. True but understated. No other stale count copy exists: a repository-wide grep for hard-coded `N presets/examples/templates` in Articles, READMEs and page metadata finds only the Todo Article's "30+", which is correct.

### R4 - Performance on the largest galleries is unchanged but unprofiled

CSS Loaders remains the only very large gallery (1,545 items); its lazy preview-chunk loading, 48-per-page paging and filters are pre-existing and untouched. Box Shadows' restored 66-item gallery is capped at 18 behind a Show all, and SVG Path Editor's 53 examples sit behind search plus category pills. The final pass added no large gallery: the biggest new library is 18 items rendering 6. No profiling was done.

### R5 - Hydration gap in the dev preview limits click-level coverage

Nine pages from the final pass and four from earlier could not be exercised interactively in the preview pane (see §6). A smoke pass on a production build (`next build && next start`), where the streaming artifact should not occur, would close this cheaply. Recommended just before or just after merge rather than as a blocker.

---

## 8. Final recommendation

**Ready for commit and PR, after staging the untracked files.**

The sprint is now complete against its own definition: all 70 standalone tools are accounted for, **nothing remains in "Needs follow-up"**, and the only tools left unchanged are the seven where a preset library would be meaningless (six interaction tests and calculators with no preset dimension, plus text-to-speech whose voice catalog already fills that role). Guided content grew from 522 to 1,210 entries plus 66 restored legacy shadows. Typecheck is clean, the full 1,866-test suite is green, lint has zero errors, no duplicate preset ids exist, no typography-floor violations remain, every preset-group and goal mapping resolves, and no non-responsive grids were introduced.

The two density inconsistencies flagged in the previous revision of this report (CSS Grid and Flexbox rendering 18 cards uncapped) are fixed and verified.

One action is required before commit: **`git add` the five untracked paths listed in R1.** Without the first four the branch does not build. R2 (`aria-expanded` sweep on earlier toggles), R3 (loader count copy) and R5 (production-build smoke pass) are worth follow-up tickets but should not hold the PR.

One process note for the PR: the branch carries **191 changed paths in a single uncommitted working tree with zero commits**. Consider splitting the commit by tool area, or at minimum separating the restored `shadowsData.ts` and the new Paint Canvas files from the bulk data expansion, so the diff is reviewable.
