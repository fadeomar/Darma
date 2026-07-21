# Static UI Foundation Audit — Darma

**Date:** 2026-07-18
**Method:** Static source inspection only. No browser, no dev server, no runtime verification.
**Scanner:** [scripts/ui-audit-static.mjs](../../scripts/ui-audit-static.mjs) (Node built-ins only, read-only)
**Machine inventory:** [docs/ui-audit/tool-layout-inventory.json](tool-layout-inventory.json)

Every finding below is tagged:

- **[CONFIRMED]** — read directly from source; the code definitively does this.
- **[STATIC-RISK]** — high-confidence inference from code, but the visual consequence is not proven.
- **[NEEDS-BROWSER]** — suspected only; must be measured in a real viewport.

> ### Corrections issued 2026-07-18 (during Foundation Patch 1)
>
> Two claims in this document were wrong and are corrected here. The original
> text is left in place below for traceability; treat these corrections as
> authoritative.
>
> 1. **`/tools/css-gradient-generator` does NOT use `CodeOutputPanel` or
>    `Tabs`.** It renders a local `CodeBlock` component with a bare `<pre>`
>    ([CssGradientGeneratorClient.tsx:2126](../../src/app/tools/css-gradient-generator/CssGradientGeneratorClient.tsx)).
>    It was named as the #1 Tier-1 route for validating the tab-clipping defect
>    (R5); that was an unverified assumption. The real 7+ tab `CodeOutputPanel`
>    consumers are `animated-background-generator`, `csp-generator`,
>    `container-query-generator` (9), `glassmorphism-generator` (8), and
>    `border-radius-generator`.
>
> 2. **R4's impact was overstated.** §5.1 states the profile aside renders
>    near-empty on "52 tool pages". In fact all 64 `<ToolPage>` call sites pass
>    `tool={tool}`, and every registered tool has at least one audience and one
>    secondary category — so the aside always has content today. R4 is a
>    correctness guard against the documented `title`/`description`-only API
>    path and future thin-metadata tools, **not** a visible defect on any
>    current route. The reserved-grid-track criticism stands only for that same
>    hypothetical case.

No application source file was modified by this audit.

---

## 1. Executive summary

Darma has a genuinely good design-token foundation (`src/styles/tokens.css` + `themes.css`, 100% semantic-variable driven) and a well-factored shared component library (`src/components/ui`, `src/features/tools/components`). The problems are **not** scattered per-tool CSS. They concentrate in five shared root causes that reach nearly every one of the 64 registered tools:

1. **`* { word-break: break-word }` in [src/styles/base.css:26](../../src/styles/base.css)** — a global universal-selector rule. In modern engines `word-break: break-word` is the deprecated alias that computes to `overflow-wrap: anywhere`, which — unlike `break-word` — **participates in intrinsic min-content sizing**. Applied to `*`, every flex and grid item's min-content width collapses to one character. This is the single most likely cause of "text renders in a 3-character-wide column" defects sitewide. **[CONFIRMED as present; visual consequence STATIC-RISK]**

2. **The declared `layoutType` is metadata, not enforced structure.** 37 of 64 tools declare a layout family in the registry but never import the corresponding `ToolLayout*` component. `ToolLayoutTextWorkbench` is used by **3 of 25** declared text-workbench tools. The real de-facto layout is `ToolPage` → `ToolContentCard` → an ad-hoc client component. Shared layout fixes therefore have far less reach than the registry implies. **[CONFIRMED]**

3. **`ToolPage` always renders a "Tool profile" sidebar column** ([ToolPage.tsx:132-153](../../src/features/tools/layouts/ToolPage.tsx)) in a hard `lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]` grid, with no check for whether the tool has any audiences, categories, or tags. A tool with one audience and no tags reserves up to 360px of desktop width for two badges. **[CONFIRMED]**

4. **Two shared layouts render a literal empty placeholder column** — `<div className="hidden lg:block" />` in [ToolLayoutSingleUtility.tsx:38](../../src/features/tools/layouts/ToolLayoutSingleUtility.tsx) and [ToolLayoutTextWorkbench.tsx:30](../../src/features/tools/layouts/ToolLayoutTextWorkbench.tsx). When `infoSlot`/`statsSlot` is present but `controlsSlot`/`optionsSlot` is not, the layout paints a two-column grid whose left column is deliberately empty. **[CONFIRMED]**

5. **The global focus ring is effectively invisible in light mode.** `--focus-ring: 0 0 0 3px var(--color-primary-soft)` where `--color-primary-soft` is `rgba(240, 90, 40, 0.11)`. Blended against `--color-surface-base`, the ring measures **~1.14:1** against its own adjacent surface — WCAG 2.2 SC 1.4.11 requires 3:1. This is the *only* focus affordance, because `base.css` sets `outline: none` on all interactive elements. **[CONFIRMED by computation]**

Two token-level contrast failures compound this: `--color-text-tertiary` (#7a7368) hits **4.01:1** on `--color-surface-subtle` and **4.27:1** on the page background — below AA — and it is the color used for essentially every `Field` label, `ControlSection` heading, and helper paragraph at 10–11px. Light-mode primary buttons (`#ffffff` on `#f05a28`) measure **3.39:1**, also below AA. Dark mode passes both.

**Recommended sequence:** Batch A (global tokens + the `word-break` rule) before any per-tool work. Nearly every per-tool "narrow text column" or "invisible label" ticket is likely to be a symptom of items 1 and 5.

---

## 2. Registered tool count

| Metric | Value |
|---|---|
| Registered tools (`TOOL_DEFINITIONS`, [registry/index.ts:7-70](../../src/features/tools/registry/index.ts)) | **64** |
| Route directories under `src/app/tools` matching a registered tool | 64 |
| Directories excluded as non-tool | 6 — `_shared`, `audience`, `category`, `fun`, `privacy`, `workflows` |
| Orphan route dirs (route without registry entry) | **0** |
| Layout families declared | 6 |

Registry ↔ filesystem are in perfect 1:1 alignment. **[CONFIRMED]**

### Layout family distribution

| `layoutType` | Tools | Actually import the matching `ToolLayout*` |
|---|---|---|
| `text-workbench` | 25 | **3** |
| `visual-generator` | 24 | **15** |
| `single-utility` | 7 | **4** |
| `interactive-challenge` | 4 | **4** |
| `fullscreen-studio` | 3 | **1** |
| `directory` | 1 | **0** |
| **Total** | **64** | **27** |

---

## 3. Tool / layout inventory

Full per-tool records — route, layout family, shared components, local CSS, LOC, pattern flags, risk score and breakdown — are in [tool-layout-inventory.json](tool-layout-inventory.json). Regenerate with:

```
node scripts/ui-audit-static.mjs --write
```

### Shared UI usage frequency (tools importing each)

| Component | Tools | Notes |
|---|---|---|
| `ToolContentCard` | 59 | de-facto page wrapper |
| `ToolPage` | 56 | de-facto page shell |
| `ControlSection` | 23 | |
| `WarningPanel` | 23 | |
| `SegmentedControl` | 22 | |
| `ToolControlPanel` | 20 | |
| `CodeOutputPanel` | 19 | highest-leverage output component |
| `ControlGrid` | 18 | |
| `ToolLayoutVisualGenerator` | 15 | |
| `PresetGallery` / `PreviewToolbar` | 11 each | |
| `Tabs` | 8 | |
| `ToolPageShell` | 7 | wraps `ToolPage` with a *second* sidebar grid |
| `ToolLayoutSingleUtility` / `ToolLayoutInteractiveChallenge` | 4 each | |
| `ToolLayoutTextWorkbench` | 3 | |
| `ResultPanel` / `EditorPanel` | 2 each | near-unused |
| `ToolLayoutFullscreenStudio` | 1 | near-unused |

### Local CSS inventory (tool-scoped only)

| File | LOC | Assessment |
|---|---|---|
| [src/app/tools/css-loaders/styles.css](../../src/app/tools/css-loaders/styles.css) | 2001 | Mostly loader keyframes — **legitimate generated output**, not app chrome |
| [src/app/tools/svg-path-editor/style.css](../../src/app/tools/svg-path-editor/style.css) | 1291 | Vendored editor (see `LICENSE.yqnn-svg-path-editor`) — app chrome mixed with canvas styling |
| [src/app/tools/buttons-css-generator/style.css](../../src/app/tools/buttons-css-generator/style.css) | 723 | Generated button previews — mostly legitimate output |
| [src/app/tools/neumorphic-css-generator/style.css](../../src/app/tools/neumorphic-css-generator/style.css) | 666 | Generated output + legacy `:root` vars leaking into `globals.css` |
| [src/app/tools/style.css](../../src/app/tools/style.css) | 63 | `.rainbow-border` — raw hex gradient, decorative, acceptable |
| [src/app/tools/box-shadows-generator/styles.css](../../src/app/tools/box-shadows-generator/styles.css) | 33 | |
| [src/app/tools/password-generator/PasswordCharacterLegend.module.css](../../src/app/tools/password-generator/PasswordCharacterLegend.module.css) | 40 | only CSS Module in the tools tree |
| [src/app/tools/animated-background-generator/style.css](../../src/app/tools/animated-background-generator/style.css) | 15 | |

**Only 8 of 64 tools carry local CSS at all.** Tool-specific CSS is *not* a systemic problem; the volume is concentrated in generated-preview CSS which is legitimate. **[CONFIRMED]**

---

## 4. Global CSS findings

### 4.1 The universal `word-break` rule — highest priority

**[CONFIRMED present]** — [src/styles/base.css:26-29](../../src/styles/base.css)

```css
* {
  box-sizing: border-box;
  word-break: break-word;
}
```

The rule the brief asked about **still exists**.

Why it matters beyond aesthetics: `word-break: break-word` is a deprecated alias. Per CSS Text 3, it computes to `word-break: normal` + `overflow-wrap: anywhere`. The distinction between `overflow-wrap: break-word` and `overflow-wrap: anywhere` is precisely that **`anywhere` affects intrinsic min-content sizing and `break-word` does not**. Applied via `*`, every element in the app reports a min-content width of roughly one character.

Consequences, in order of confidence:

- **[STATIC-RISK]** Any flex/grid child that would otherwise be protected by its natural min-content width can now be squeezed to a sliver. The codebase compensates defensively — `min-w-0` appears on nearly every layout child, and `minmax(0,1fr)` on nearly every grid — which is itself evidence the team has been fighting this symptom.
- **[STATIC-RISK]** Normal prose (tool descriptions, article bodies, `HelpText`) can break mid-word at narrow widths rather than wrapping at spaces, because `anywhere` permits breaks at any character when the line would otherwise overflow.
- **[STATIC-RISK]** `SegmentedControl` explicitly counteracts it per-button with `whitespace-nowrap break-keep` ([SegmentedControl.tsx:59](../../src/features/tools/components/SegmentedControl.tsx)) — another local workaround for a global cause.

**Recommended direction (do not implement yet):** replace the universal rule with a scoped `overflow-wrap: break-word` on prose and a targeted `overflow-wrap: anywhere` on the specific containers that hold unbroken tokens (code output, URLs, hashes, base64). Candidate targets already exist as classes: `.darma-code-output-pre`, `.favicon-code-pre`.

**Regression risk: HIGH-BREADTH but LOW-SEVERITY.** Removing it will *widen* previously-collapsed elements. Any layout that has been silently relying on aggressive breaking to fit long tokens (JWT, base64, UUID, hashed URLs) may begin to overflow. The 13 tools that already use an explicit `break-all` class (`url-encoder-decoder`, `jwt-decoder`, `uuid-generator`, `date-difference-calculator`, `slug-generator`, and 8 others) are already protected locally and are the safest evidence that scoped handling works.

### 4.2 Focus ring is below the non-text contrast threshold

**[CONFIRMED by computation]** — [tokens.css:157](../../src/styles/tokens.css), [base.css:69-72](../../src/styles/base.css)

```css
--focus-ring: 0 0 0 3px var(--color-primary-soft);   /* rgba(240, 90, 40, 0.11) */

:where(a, button, input, textarea, select, summary):focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
```

Blended at 11% alpha over `--color-surface-base` (#fffdf8), the ring resolves to roughly #f8ece5 — **1.14:1 against the surface it sits on**. WCAG 2.2 SC 1.4.11 requires 3:1 for focus indicators. Because `outline: none` removes the UA default, this is the *only* keyboard-focus affordance in the entire application.

The same token is used by `Button`, `Input`, `Select`, `Textarea`, and the `ToolPage` back-link, so a single token change fixes it everywhere. Dark mode uses `rgba(255, 106, 61, 0.14)` — marginally better, still far below 3:1.

Note: the 19 `focus:outline-none` occurrences the scanner flagged across shared components are **not** independent defects — each is paired with a `focus-visible:shadow-[var(--focus-ring)]` or an explicit `ring-2`. They are all downstream of this one token.

### 4.3 Token contrast failures (light mode only)

**[CONFIRMED by computation]** — sRGB relative-luminance ratios:

| Token pair | Ratio | AA (4.5) | Where it's used |
|---|---|---|---|
| `--color-text-tertiary` #7a7368 on `--color-surface-subtle` #f1ede4 | **4.01** | ✗ | every `Field` label, `ControlSection` title, `Card` helper text |
| `--color-text-tertiary` on `--color-app-bg` #f7f4ed | **4.27** | ✗ | page-level helper text |
| `--color-text-tertiary` on `--color-surface-base` #fffdf8 | **4.61** | ✓ (marginal) | panel body text |
| `--color-primary-text` #ffffff on `--color-primary` #f05a28 | **3.39** | ✗ | **every primary button label** |
| `--color-text-secondary` #34312d on `--color-app-bg` | 11.78 | ✓ | prose |
| `--color-text-tertiary` dark #918a7d on `--color-surface-raised` | 4.92 | ✓ | |
| `--color-primary-text` dark #111110 on `--color-primary` #ff6a3d | 6.64 | ✓ | |

The tertiary failure is aggravated by size: `Field` renders labels at `text-[10px]`/`text-[11px]` ([Field.tsx:48-53](../../src/components/ui/Field.tsx)), and `ControlSection` at `text-[11px]` — well below the 18.66px threshold that would allow the 3:1 large-text exemption.

**This is a two-token fix** (`--color-text-tertiary`, `--color-primary-text`) with app-wide reach and near-zero structural regression risk.

### 4.4 Legacy neumorphic variables in the global root

**[CONFIRMED]** — [globals.css:11-30](../../src/app/globals.css) defines `--blur`, `--darkColor`, `--lightColor`, `--size`, `--radius`, `--angle` etc. on `:root`, with a comment acknowledging they belong to one tool. `--radius: 30px` and `--size: 150px` are generic enough names to collide with any future utility that reasonably expects them to be design tokens. Low impact today, real trap later. **[STATIC-RISK]**

### 4.5 Reduced motion — handled globally

**[CONFIRMED, no defect]** — [base.css:96-105](../../src/styles/base.css) has a global `@media (prefers-reduced-motion: reduce)` block that neutralizes all animations, transitions and smooth scrolling with `!important`. Tool-local `@keyframes` (e.g. the 2001-line css-loaders sheet) are covered by this. Do not file per-tool reduced-motion tickets.

Caveat **[NEEDS-BROWSER]**: canvas-driven motion (`fake-screen`, `og-image-generator`, `app-screenshot-mockup-generator`, `favicon-app-icon-generator`, `image-compressor-resizer`) is JS-driven and is *not* covered by a CSS media query. Verify whether those honor `matchMedia("(prefers-reduced-motion: reduce)")`.

---

## 5. Shared layout findings

### 5.1 `ToolPage` — the always-on "Tool profile" aside

**[CONFIRMED]** — [ToolPage.tsx:80-153](../../src/features/tools/layouts/ToolPage.tsx)

```tsx
<div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-end">
  ...
  {headerAlign !== "center" ? (
    <aside className="...">
      <p>Tool profile</p>
      {(tool?.audiences ?? []).map(...)}
      {(tool?.secondaryCategory ?? []).slice(0, 3).map(...)}
      {tool?.tags?.length ? <p className="line-clamp-2">...</p> : null}
    </aside>
  ) : null}
</div>
```

Three distinct defects in one block:

- The aside's render condition is `headerAlign !== "center"` — it does **not** test whether there is any content. If `tool` is undefined (the `title`/`description`-only call signature the component explicitly supports), it renders a card containing nothing but the words "Tool profile". Only 4 of 56 `ToolPage` callers use `headerAlign="center"`, so **52 tool pages** hit this path.
- The grid column is unconditional. Even when the aside is omitted, `lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]` still reserves the track, so the `<h1>` is confined to ~70% of the container with dead space beside it. **[STATIC-RISK]** — needs a browser measurement to quantify.
- `lg:items-end` bottom-aligns the aside to the header. For a short title the aside floats; for a long wrapped title it is pushed down. Visually unstable across tools.

**Recommended direction:** compute a `hasProfileContent` boolean and switch the grid to `lg:grid-cols-1` when false. Fixes all three at once.

### 5.2 `ToolPage` header consumes very large above-the-fold height

**[STATIC-RISK — needs browser measurement]** — [ToolPage.tsx:70-159](../../src/features/tools/layouts/ToolPage.tsx)

Stacked in order before any tool UI appears: outer `py-7 sm:py-9`, header `py-5 sm:py-7 lg:py-8`, a "Back to tools" pill, a badge row (`mt-4`), an `<h1>` at `text-4xl sm:text-5xl lg:text-6xl`, a description at `text-base sm:text-lg` (`mt-3`), an optional `intro` block (`mt-5`), then `<main className="mt-7 sm:mt-8">`.

Then the near-universal next element is `ToolContentCard`, which adds **its own** eyebrow ("Tool section"), `<h2>` at `text-xl`, a description paragraph, a bottom border, and `mb-5 pb-4` — inside a `SurfaceCard` that already has `p-6`, further overridden to `p-5 sm:p-6`.

Concretely, [word-counter/page.tsx](../../src/app/tools/word-counter/page.tsx) presents the user with four near-duplicate pieces of copy before the tool: registry title "Word Counter", registry description, a hand-written `intro` paragraph, then `ToolContentCard title="Word Counter Studio"` with yet another description. `regex-tester` follows the identical shape. This pattern repeats across the 59 tools using `ToolContentCard`.

**[CONFIRMED]** the duplication exists in source. **[NEEDS-BROWSER]** the exact pixel height and whether the tool is below the fold at 390×844 and 1440×900.

### 5.3 Empty placeholder columns in two shared layouts

**[CONFIRMED]**

- [ToolLayoutSingleUtility.tsx:36-41](../../src/features/tools/layouts/ToolLayoutSingleUtility.tsx)
- [ToolLayoutTextWorkbench.tsx:28-33](../../src/features/tools/layouts/ToolLayoutTextWorkbench.tsx)

```tsx
{(controlsSlot || infoSlot) ? (
  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">
    {controlsSlot ? <section className="min-w-0">{controlsSlot}</section> : <div className="hidden lg:block" />}
    {infoSlot ? <aside className="min-w-0 space-y-5 lg:sticky lg:top-24">{infoSlot}</aside> : null}
  </div>
) : null}
```

When only `infoSlot` is supplied, the grid renders with a deliberately empty left column and pushes a sidebar-width panel to the right of ~380px of nothing. The fix is a slot-count-aware grid class rather than a placeholder element.

Blast radius is currently small — 4 + 3 = 7 tools use these layouts — but it is the exact anti-pattern the shared-layout normalization batch should eliminate before adoption is broadened.

### 5.4 `ToolPageShell` duplicates the sidebar grid

**[CONFIRMED]** — [ToolPageShell.tsx:18-25](../../src/features/tools/ui/ToolPageShell.tsx)

`ToolPageShell` wraps `ToolPage` and then defines *its own* `xl:grid-cols-[minmax(0,1fr)_320px]` sidebar grid. So 7 tools nest a second sidebar grid inside a page that already reserved a 280–360px header aside track. This is a third, independent sidebar width (320px) alongside the 340px, 380px and 420px used by the other layouts. **No shared token governs sidebar width.**

### 5.5 Fixed preview minimums stack on top of the token

**[CONFIRMED, classified as intentional-but-unguarded]**

`PreviewFrame` already applies `min-h-[var(--tool-preview-min-height)]` = **420px** ([PreviewFrame.tsx:28](../../src/components/ui/PreviewFrame.tsx), [tokens.css:143](../../src/styles/tokens.css)). Both consuming layouts then override it with a larger hard-coded ladder:

| Layout | Override | Effective floor |
|---|---|---|
| [ToolLayoutVisualGenerator.tsx:30](../../src/features/tools/layouts/ToolLayoutVisualGenerator.tsx) | `min-h-[360px] sm:min-h-[460px] xl:min-h-[540px]` | 360px mobile |
| [ToolLayoutFullscreenStudio.tsx:24](../../src/features/tools/layouts/ToolLayoutFullscreenStudio.tsx) | `min-h-[480px] sm:min-h-[560px] xl:min-h-[640px]` | **480px mobile** |

**Classification:** *intentional workspace behavior* for a generator preview. **[STATIC-RISK]** at 390×844: a 480px preview consumes 57% of viewport height, stacked *below* the tall `ToolPage` header — so on the one `fullscreen-studio` tool that uses this layout (`fake-screen`), the controls may sit two full screens down. The `--tool-preview-min-height` token exists precisely to make this responsive and is being bypassed.

### 5.6 Sticky offsets are hard-coded and unaudited

**[STATIC-RISK]** — `lg:top-24` / `xl:top-24` (6rem = 96px) appears in `ToolLayoutSingleUtility`, `ToolLayoutTextWorkbench`, `ToolLayoutVisualGenerator`, `ToolLayoutFullscreenStudio`, `ToolLayoutInteractiveChallenge`, `ToolPageShell`, and `ToolControlPanel` — seven places, all literal, none derived from an actual header-height token. If the site header is not exactly 96px, every sticky panel is misaligned by the difference. **[NEEDS-BROWSER]** to measure the real header height.

Additionally [ToolLayoutVisualGenerator.tsx:42](../../src/features/tools/layouts/ToolLayoutVisualGenerator.tsx) uses `xl:max-h-[calc(100vh-7rem)]` — **7rem = 112px, inconsistent with the 6rem sticky offset used one line earlier**. One of the two is wrong. **[CONFIRMED inconsistency; NEEDS-BROWSER for which]**

### 5.7 `ToolLayoutInteractiveChallenge` — decorative absolute layer

**[CONFIRMED, classified as intentional]** — [ToolLayoutInteractiveChallenge.tsx:20](../../src/features/tools/layouts/ToolLayoutInteractiveChallenge.tsx) has a `pointer-events-none absolute inset-x-4 top-8 -z-10 h-72` radial glow with a hard-coded `rgba(255,166,74,0.16)`. It is `pointer-events-none` and `-z-10`, so it is not a layout defect. The raw rgba is a minor token bypass. **[STATIC-RISK]** — a `-z-10` element on a `relative` parent can be occluded if any ancestor creates a stacking context; worth one browser glance in dark mode.

---

## 6. Shared component findings

### 6.1 `Field` — labels are not programmatically associated

**[CONFIRMED]** — [Field.tsx:44-56, 62-70](../../src/components/ui/Field.tsx)

Two defects in the most-reused form primitive:

```tsx
const descriptionId = useId();
const errorId = useId();
...
<div className="font-mono text-[10px] ...">{label}</div>   {/* a <div>, not a <label> */}
...
<p id={descriptionId}>{description}</p>                     {/* id set, never referenced */}
<p id={errorId}>{error}</p>                                 {/* id set, never referenced */}
```

- The label renders as a `<div>` with no `htmlFor` and no `id`, so it is never announced when the control receives focus.
- `descriptionId` and `errorId` are generated and applied, but `aria-describedby` is **never wired to the child control** — `children` is rendered opaquely. The accessibility plumbing is half-built.

`Field` is imported by 26 tools. **[CONFIRMED]** as a code defect; **[NEEDS-BROWSER]** to confirm the screen-reader consequence, though the outcome is not really in doubt.

Mitigating context: the tools tree contains 357 `aria-label` occurrences and 60 files using native `<label>`, so many tools have compensated locally. That is itself the duplication signal (see §7).

### 6.2 `Tabs` — `overflow-hidden` clips instead of scrolls

**[CONFIRMED]** — [Tabs.tsx:25-30](../../src/components/ui/Tabs.tsx)

```tsx
className="inline-flex overflow-hidden rounded-[var(--radius-full)] border ..."
```

No `flex-wrap`, no `overflow-x-auto`. With more tabs than fit, the overflowing tabs are **clipped and unreachable** — there is no scroll affordance. Each tab is `min-h-[38px] px-3` with `text-[11px]` uppercase labels.

This is consumed by `CodeOutputPanel` ([CodeOutputPanel.tsx:65-71](../../src/features/tools/components/CodeOutputPanel.tsx)) for generated-code tabs — and the generator tools ship 4–6 tabs (HTML / CSS / React / Tailwind / tokens / config). `CodeOutputPanel` is used by **19 tools**. At 390px this is the highest-confidence mobile functional defect in the audit. **[STATIC-RISK → verify first]**

### 6.3 `CodeOutputPanel` — code output interacts badly with the global word-break

**[CONFIRMED]** — [CodeOutputPanel.tsx:77-79](../../src/features/tools/components/CodeOutputPanel.tsx)

```tsx
<pre className="darma-code-output-pre favicon-code-pre min-h-[22rem] max-h-[32rem] overflow-auto whitespace-pre-wrap ...">
```

- `whitespace-pre-wrap` **plus** the inherited global `word-break: break-word` means generated CSS/JS wraps at arbitrary characters mid-identifier. Code output is exactly the case where breaking should be opt-in and controlled, not universal.
- `min-h-[22rem]` (352px) is applied to **both** the populated `<pre>` and the empty-state `<div>` — so a tool with no output yet still reserves 352px of empty panel. On mobile that is ~40% of the viewport showing "Nothing generated yet."
- Positive: the panel *does* have `overflow-auto` and a `max-h-[32rem]` cap, so code scrolls inside the panel rather than the page. This is the correct pattern and should be the model for the shared treatment.

The header row is well-built — `flex-col gap-3 ... sm:flex-row` with `min-w-0` on the text side and `shrink-0 flex-wrap` on the actions side. No action-bar defect here.

### 6.4 `SegmentedControl` — fixed 3-column grid regardless of option count

**[CONFIRMED]** — [SegmentedControl.tsx:46](../../src/features/tools/components/SegmentedControl.tsx)

```tsx
layout === "grid" ? "grid w-full grid-cols-3 rounded-[var(--radius-md)]" : "inline-flex flex-wrap rounded-[var(--radius-full)]"
```

`grid-cols-3` is hard-coded. With 4 options the fourth wraps to a lone row occupying one third of the width; with 2 options a third of the control is empty. Used by 22 tools. Buttons carry `whitespace-nowrap break-keep` (a local workaround for §4.1), so long labels in a `grid-cols-3` cell will overflow their cell rather than wrap. **[STATIC-RISK → verify]**

The `wrap` layout variant is well-behaved (`inline-flex flex-wrap`). Only the `grid` variant is at risk.

### 6.5 Control sizes below the recommended touch target

**[CONFIRMED]** — `Input`, `Select`, `SegmentedControl` `sm` size all resolve to `min-h-8` = **32px**; `md` to `min-h-[38px]`. `Tabs` buttons are `min-h-[38px]`. WCAG 2.5.8 (AA) requires 24px minimum — these pass — but the 44px iOS / 48px Material guidance is not met by any size below `lg`.

**Classification: requires visual verification.** A dense generator control panel legitimately trades target size for density. Flag for judgment, not automatic remediation.

### 6.6 Well-built components — no action needed

Recording these so the visual agent does not re-derive them:

- **`Button`** ([Button.tsx](../../src/components/ui/Button.tsx)) — `size="icon"` correctly renders `children` inside `<span className="sr-only">`, so icon-only buttons are labeled by construction. Good.
- **`ActionBar`** — `flex flex-wrap items-center gap-2`. Wraps correctly. No fixed widths.
- **`ControlGrid`** — deliberately caps at `sm:grid-cols-2` even when `columns` is 3 or 4. Conservative and safe.
- **`WarningPanel`** — uses semantic status tokens for all four severities, and pairs color with a **text label** ("Warning", "Danger"), so status is not conveyed by color alone. Has `aria-live="polite"`. Genuinely good.
- **`ResultPanel`**, **`ControlSection`**, **`ToolControlPanel`** — all apply `min-w-0` on text sides and `shrink-0` on action sides correctly.

### 6.7 Heading-level inconsistency across shared components

**[STATIC-RISK]** — `ToolPage` emits `<h1>`; `ToolContentCard`, `ResultPanel`, `CodeOutputPanel`, `ToolControlPanel` and `WarningPanel` all emit `<h2>`; `ControlSection` and `WarningPanel`'s items emit `<h3>`. Because `WarningPanel` renders both an `<h2>` title and `<h3>` items, placing it inside a `ControlSection` (which is itself an `<h3>` context) inverts the hierarchy. Needs an axe/heading-order run rather than more static reading.

---

## 7. Duplicated UI patterns

Only patterns appearing in **two or more tools** are listed. No abstraction was created.

| # | Pattern | Occurrences | Evidence | Candidate abstraction |
|---|---|---|---|---|
| 1 | **Scrollable data table with `min-w-[Nrem]`** | **17 tools** | `loan-calculator` (`min-w-[72rem]`), `sitemap-xml-generator` (`850px`), `slug-generator` (`760px`), `timezone-converter` (`760px`), `timestamp-converter` (`760px`/`560px`), `pomodoro-timer` (`700px`), `html-entity-encoder-decoder` (`680px`), `percentage-calculator`, `tip-calculator`, `unit-converter`, `gpa-calculator`, `date-difference-calculator`, `readability-score`, `beam-calculator`, `jwt-decoder`, `statistics-calculator`, `json-formatter` | **Shared `<DataTable>`** with built-in `overflow-x-auto` wrapper, sticky header, and max-height. The wrapper is hand-rolled 17 times and **`beam-calculator` gets it wrong** (see §8) |
| 2 | **Fixed-height `dynamic()` loading skeleton** | **59 tools** | `h-[760px]` ×9, `h-[720px]` ×6, `h-[680px]` ×3, `h-[640px]`, `h-[620px]` ×4, `h-[560px]`, `h-[540px]`, `h-[520px]`, `h-[420px]` ×2 … | **Shared `<ToolSkeleton>`** using an aspect/min-height token instead of 10 different magic numbers. Every one of these is a guaranteed layout-shift on hydration if the real content differs |
| 3 | **Long-token break treatment** | 13 tools | `url-encoder-decoder` ×3, `jwt-decoder` ×3, `uuid-generator` ×3, `date-difference-calculator` ×2, `slug-generator` ×2, `favicon-app-icon-generator`, `regex-tester`, `og-image-generator` … | **Shared `.darma-token-break` utility** — the correct scoped replacement for the global `*` rule in §4.1 |
| 4 | **Sidebar column width** | 4 distinct values | `320px` (ToolPageShell), `340px` (VisualGenerator), `minmax(280px,360px)` (ToolPage), `minmax(300px,380px)` (SingleUtility), `minmax(320px,420px)` (FullscreenStudio, InteractiveChallenge) | **`--tool-sidebar-width` token** — five widths for one visual role |
| 5 | **Sticky offset `top-24`** | 7 shared files | §5.6 | **`--tool-sticky-offset` token** derived from real header height |
| 6 | **Local `<label>` / `aria-label` compensation for `Field`** | 60 files use native `<label>`; 357 `aria-label` occurrences | §6.1 | Fix `Field` upstream rather than proliferate local labels |
| 7 | **`ToolPage` + `ToolContentCard` + duplicated title/description** | 59 tools | §5.2 | **Slot-aware page header** that suppresses the second title when it restates the first |
| 8 | **Hard-coded white/black in canvas/export tools** | 17 tools; `fake-screen` ×28, `animated-background-generator` ×16, `favicon-app-icon-generator` ×6 | scanner `hardcoded-white-black-text` | **Legitimate — do not abstract.** These are canvas draw colors and generated-output colors, not app chrome. Classified as false positive; recorded so it is not re-flagged |

---

## 8. Shared-root-cause matrix

Ranked by (broad impact × confidence × low regression risk × ease of browser validation).

### R1 — Universal `word-break: break-word`

| | |
|---|---|
| **Source** | [src/styles/base.css:26-29](../../src/styles/base.css) |
| **Selector** | `*` |
| **Behavior** | Computes to `overflow-wrap: anywhere`; alters intrinsic min-content sizing for every element |
| **Affected layouts** | All |
| **Likely affected tools** | All 64 |
| **Impact** | Very high — most probable cause of collapsed text columns and mid-word prose breaks |
| **Regression risk** | **Medium-high breadth, low severity.** Long unbroken tokens in 13 tools may start overflowing; 51 tools have no local protection |
| **Validation viewports** | 390×844, 768×1024, 1440×900, 2560×1440 |
| **Fix strategy** | Remove from `*`; add scoped `overflow-wrap: break-word` for prose and `overflow-wrap: anywhere` on a `.darma-token-break` utility applied to code/URL/hash containers |
| **Fix before individual tools?** | **Yes — first.** Per-tool text tickets filed before this lands will mostly be re-work |

### R2 — Focus ring below 3:1

| | |
|---|---|
| **Source** | [tokens.css:157](../../src/styles/tokens.css) + [base.css:69-72](../../src/styles/base.css) |
| **Selector** | `--focus-ring`; `:where(a, button, input, textarea, select, summary):focus-visible` |
| **Behavior** | 11% alpha ring (~1.14:1) is the sole focus affordance; UA outline removed |
| **Affected layouts** | All |
| **Likely affected tools** | All 64 |
| **Impact** | Very high (accessibility-blocking) |
| **Regression risk** | **Very low** — one token, no layout effect |
| **Validation viewports** | Any; both color schemes |
| **Fix strategy** | Raise `--focus-ring` to a ≥3:1 solid ring (e.g. `0 0 0 2px var(--color-surface-base), 0 0 0 4px var(--color-primary)`) |
| **Fix before individual tools?** | **Yes** |

### R3 — `--color-text-tertiary` and `--color-primary-text` below AA (light mode)

| | |
|---|---|
| **Source** | [tokens.css:16, 26](../../src/styles/tokens.css) |
| **Selector** | `--color-text-tertiary` (#7a7368), `--color-primary-text` (#ffffff on #f05a28) |
| **Behavior** | 4.01–4.27:1 and 3.39:1 respectively, at 10–11px |
| **Affected layouts** | All |
| **Likely affected tools** | All 64 (every `Field`, `ControlSection`, primary button) |
| **Impact** | Very high |
| **Regression risk** | **Very low** — darkening tertiary and switching primary-text to a dark ink has no layout effect. Confirm the dark-theme override is not accidentally darkened too |
| **Validation viewports** | Any; **both** color schemes mandatory |
| **Fix strategy** | Darken `--color-text-tertiary` to ≥4.5:1 against `--color-surface-subtle`; give primary buttons a dark label or darken `--color-primary` |
| **Fix before individual tools?** | **Yes** |

### R4 — `ToolPage` unconditional profile aside + reserved grid track

| | |
|---|---|
| **Source** | [ToolPage.tsx:80-153](../../src/features/tools/layouts/ToolPage.tsx) |
| **Selector** | `.grid.lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]` > `aside` |
| **Behavior** | Aside renders on content-independent condition; grid track reserved regardless |
| **Affected layouts** | `ToolPage` → every layout family |
| **Likely affected tools** | **52** (all `ToolPage` users except the 4 with `headerAlign="center"`) |
| **Impact** | High — dead desktop space on every tool header |
| **Regression risk** | **Low** — additive condition; visual-only |
| **Validation viewports** | 1440×900, 1920×1080, 2560×1440 |
| **Fix strategy** | Derive `hasProfileContent` from audiences/categories/tags; collapse to `lg:grid-cols-1` when empty |
| **Fix before individual tools?** | **Yes** |

### R5 — `Tabs` clips overflowing tabs

| | |
|---|---|
| **Source** | [Tabs.tsx:25-30](../../src/components/ui/Tabs.tsx) |
| **Selector** | `[role="tablist"].inline-flex.overflow-hidden` |
| **Behavior** | No wrap, no scroll; overflowing tabs are unreachable |
| **Affected layouts** | Any using `CodeOutputPanel` |
| **Likely affected tools** | 19 (`CodeOutputPanel`) + 8 direct `Tabs` users |
| **Impact** | High — **functional** loss on mobile, not cosmetic |
| **Regression risk** | **Low** — `overflow-x-auto` + `flex-nowrap` with scroll-snap is additive |
| **Validation viewports** | 390×844 primary; 768×1024 secondary |
| **Fix strategy** | `overflow-x-auto` with hidden scrollbar and edge fade; or wrap to multiple rows |
| **Fix before individual tools?** | **Yes** |

### R6 — `Field` labels not associated

| | |
|---|---|
| **Source** | [Field.tsx:44-70](../../src/components/ui/Field.tsx) |
| **Selector** | `Field > div > div` (label), `p#:r*` (description/error) |
| **Behavior** | `<div>` label with no `htmlFor`; `aria-describedby` never wired |
| **Affected layouts** | All |
| **Likely affected tools** | 26 |
| **Impact** | High (accessibility) |
| **Regression risk** | **Medium** — requires either a render-prop/`cloneElement` change or a `Field`-provided context. Touches an API used 26 times |
| **Validation viewports** | Any; axe + screen-reader |
| **Fix strategy** | Render `<label htmlFor>` and expose `controlId`/`describedById` via context for children to consume |
| **Fix before individual tools?** | Yes, but **after** R1–R5 — it is the only shared fix with real API surface |

### R7 — Empty placeholder columns in shared layouts

| | |
|---|---|
| **Source** | [ToolLayoutSingleUtility.tsx:38](../../src/features/tools/layouts/ToolLayoutSingleUtility.tsx), [ToolLayoutTextWorkbench.tsx:30](../../src/features/tools/layouts/ToolLayoutTextWorkbench.tsx) |
| **Selector** | `div.hidden.lg:block` |
| **Behavior** | Renders an empty grid cell to preserve a two-column shape |
| **Affected layouts** | SingleUtility, TextWorkbench |
| **Likely affected tools** | 7 (only when the paired slot is absent) |
| **Impact** | Medium — narrow blast radius today, but blocks broader layout adoption |
| **Regression risk** | **Low** |
| **Validation viewports** | 1440×900 |
| **Fix strategy** | Slot-count-aware grid class; drop the placeholder element |
| **Fix before individual tools?** | Yes — part of Batch B |

### R8 — Five sidebar widths, seven hard-coded sticky offsets

| | |
|---|---|
| **Source** | 7 layout/shell files (§5.4, §5.6) |
| **Selector** | `xl:grid-cols-[...320px]`, `[...340px]`, `minmax(280px,360px)`, `minmax(300px,380px)`, `minmax(320px,420px)`; `lg:top-24`/`xl:top-24`; `xl:max-h-[calc(100vh-7rem)]` |
| **Behavior** | Same visual role, five widths; sticky offsets not derived from header height, and internally inconsistent (6rem vs 7rem in one file) |
| **Affected layouts** | All shared layouts + `ToolPageShell` + `ToolControlPanel` |
| **Likely affected tools** | 27 (layout users) + 20 (`ToolControlPanel`) |
| **Impact** | Medium — inconsistency rather than breakage |
| **Regression risk** | **Low-medium** — normalizing widths shifts every sidebar |
| **Validation viewports** | 1280×800, 1440×900, 1920×1080 |
| **Fix strategy** | `--tool-sidebar-width` and `--tool-sticky-offset` tokens; resolve the 6rem/7rem conflict |
| **Fix before individual tools?** | Batch B |

### R9 — `CodeOutputPanel` 352px empty state

| | |
|---|---|
| **Source** | [CodeOutputPanel.tsx:82-84](../../src/features/tools/components/CodeOutputPanel.tsx) |
| **Selector** | `div.min-h-\[22rem\].border-dashed` |
| **Behavior** | Empty state reserves the same 352px as populated output |
| **Affected layouts** | Any using `CodeOutputPanel` |
| **Likely affected tools** | 19 |
| **Impact** | Medium |
| **Regression risk** | **Low** |
| **Validation viewports** | 390×844 |
| **Fix strategy** | Distinct, smaller `min-h` for the empty branch |
| **Fix before individual tools?** | Batch B |

### R10 — `SegmentedControl` fixed `grid-cols-3`

| | |
|---|---|
| **Source** | [SegmentedControl.tsx:46](../../src/features/tools/components/SegmentedControl.tsx) |
| **Selector** | `[role="radiogroup"].grid.grid-cols-3` |
| **Behavior** | Column count independent of option count |
| **Affected layouts** | All |
| **Likely affected tools** | ≤22 (only `layout="grid"` call sites — **count not yet established**) |
| **Impact** | Medium |
| **Regression risk** | **Low** |
| **Validation viewports** | 390×844, 768×1024 |
| **Fix strategy** | Derive columns from `options.length`, or use `grid-cols-[repeat(auto-fit,minmax(Xch,1fr))]` |
| **Fix before individual tools?** | Batch B |

### R11 — 59 fixed-height hydration skeletons

| | |
|---|---|
| **Source** | 59 `page.tsx` files under `src/app/tools/*` |
| **Selector** | `div.animate-pulse.h-\[NNNpx\]` |
| **Behavior** | 10 distinct magic heights approximating real content |
| **Affected layouts** | All |
| **Likely affected tools** | 59 |
| **Impact** | Medium — CLS on every tool load |
| **Regression risk** | **Low** individually, but **59 files** — mechanical and wide |
| **Validation viewports** | 390×844, 1440×900; measure CLS |
| **Fix strategy** | Shared `<ToolSkeleton variant>` with a small set of tokenized heights |
| **Fix before individual tools?** | No — defer; low user-visible value per unit of churn |

---

## 9. Per-tool static risk ranking

Scores from `scripts/ui-audit-static.mjs`. Weighting: custom layout complexity 20, responsive/fixed-size 20, text overflow 15, local CSS complexity 15, spacing imbalance 15, theme/contrast 10, accessibility 5.

**This is a static-risk proxy, not a visual score.** It rewards size and pattern density; a large, carefully-built tool can score high and be visually fine. Final tool selection must come from the browser audit.

| Rank | Tool | Layout | Score | LOC | Local CSS | Canvas/editor |
|---|---|---|---|---|---|---|
| 1 | css-loaders | directory | **70** | 6525 | 2002 | – |
| 2 | svg-path-editor | visual-generator | **68** | 4233 | 1292 | – |
| 3 | buttons-css-generator | visual-generator | **63** | 2934 | 724 | – |
| 4 | neumorphic-css-generator | visual-generator | **56** | 1896 | 667 | – |
| 5 | fake-screen | fullscreen-studio | **53** | 2424 | 0 | ✓ |
| 6 | css-gradient-generator | visual-generator | **51** | 3411 | 0 | – |
| 7 | animated-background-generator | visual-generator | **47** | 1942 | 15 | – |
| 8 | favicon-app-icon-generator | visual-generator | **46** | 4712 | 0 | ✓ |
| 9 | regex-tester | text-workbench | **44** | 1896 | 0 | – |
| 10 | app-screenshot-mockup-generator | visual-generator | **42** | 2778 | 0 | ✓ |
| 11 | og-image-generator | visual-generator | **41** | 2656 | 0 | ✓ |
| 12 | box-shadows-generator | visual-generator | **40** | 1539 | 34 | – |
| 13 | password-generator | single-utility | **40** | 2623 | 41 | – |
| 14 | markdown-previewer | text-workbench | **39** | 1481 | 0 | – |
| 15 | timestamp-converter | text-workbench | **38** | 1782 | 0 | – |
| 16 | image-compressor-resizer | single-utility | **38** | 2668 | 0 | ✓ |
| 17 | json-formatter | text-workbench | 36 | 3487 | 0 | – |
| 18 | click-speed-test | interactive-challenge | 36 | 2578 | 0 | – |
| 19 | spacebar-counter | interactive-challenge | 36 | 2730 | 0 | – |
| 20 | reaction-time-test | interactive-challenge | 36 | 2934 | 0 | – |
| 21 | lorem-ipsum-generator | text-workbench | 35 | 2093 | 0 | – |
| 22 | mouse-scroll-test | interactive-challenge | 35 | 2551 | 0 | – |
| 23 | color-name-finder | visual-generator | 34 | 1208 | 0 | – |
| 24 | glassmorphism-generator | visual-generator | 34 | 1111 | 0 | – |
| 25 | qr-code | visual-generator | 34 | 1660 | 0 | – |
| 26 | url-encoder-decoder | text-workbench | 34 | 1493 | 0 | – |
| 27 | color-palette-generator | visual-generator | 33 | 1168 | 0 | – |
| 28 | timezone-converter | single-utility | 33 | 1750 | 0 | – |
| 29 | beam-calculator | visual-generator | 32 | 5143 | 0 | – |
| 30 | color-converter | visual-generator | 31 | 1520 | 0 | – |
| 31 | pomodoro-timer | fullscreen-studio | 30 | 1489 | 0 | – |
| 32–48 | border-radius-generator, css-grid-generator, tip-calculator, container-query-generator, gpa-calculator, percentage-calculator, flexbox-generator, unit-converter, aspect-ratio-calculator, bmi-calculator, css-transform-generator, date-difference-calculator, html-entity-encoder-decoder, slug-generator, color-shades, jwt-decoder, responsive-image-srcset-generator | mixed | 24–29 | | | |
| 49–64 | csp-generator, loan-calculator, meta-tag-generator, readability-score, robots-txt-generator, word-counter, base64-encoder-decoder, text-cleaner, uuid-generator, image-converter, css-clamp-generator, sitemap-xml-generator, statistics-calculator, json-to-typescript, todo-list, code-preview-tool | mixed | 1–23 | | | |

Notable score caveats:

- **css-loaders (70)** and **buttons-css-generator (63)** are inflated by generated-preview CSS that is legitimate output. Their *chrome* risk is lower than the score suggests.
- **beam-calculator (32)** scores mid despite 5143 LOC — but it contains the one confirmed unwrapped wide table (§8, pattern 1). Score alone would under-prioritize it.
- **todo-list (8)** and **code-preview-tool (1)** score low because the UI lives outside `src/app/tools/*` (`src/features/todo` is 2119 lines of CSS on its own). **The scanner does not see it.** Do not read these as low-risk.

---

## 10. Visual Audit Handoff

Inspect in this order once Chromium is available.

### Tier 1 — validate the shared root causes (do these first; they change everything downstream)

| # | Route | Viewport | Why | Inspect | Suspected cause |
|---|---|---|---|---|---|
| 1 | `/tools/css-gradient-generator` | **390×844** | 4–6 code tabs in `CodeOutputPanel`; heaviest generator using `Tabs` | Is any tab clipped and unreachable? Does the tablist scroll? | **R5** |
| 2 | `/tools/box-shadows-generator` | 390×844 | Second `CodeOutputPanel` sample; confirms R5 is shared not local | Same as above | **R5** |
| 3 | `/tools/word-counter` | 1440×900 | `maxWidth="full"` + `ToolContentCard`; duplicated title/description | Pixel height from viewport top to first interactive control | **R4, §5.2** |
| 4 | `/tools/uuid-generator` | 1440×900 | Minimal tool — profile aside will be nearly empty | Does the "Tool profile" aside render with ≤2 badges beside dead space? | **R4** |
| 5 | `/tools/jwt-decoder` | 390×844 | Long unbroken tokens; 3 `break-all` sites | Does the JWT break sanely? Does *prose* also break mid-word? | **R1** |
| 6 | Any route, keyboard `Tab` | 1440×900, **both schemes** | Focus ring is 1.14:1 | Is the focused control visibly distinguishable? | **R2** |
| 7 | `/tools/password-generator` | 1440×900, **light** | Dense `Field` labels at 10–11px in tertiary | Are labels legible? Screenshot for contrast measurement | **R3** |

### Tier 2 — highest-risk individual routes

| # | Route | Viewport | Why | Inspect | Suspected cause |
|---|---|---|---|---|---|
| 8 | `/tools/css-loaders` | 390×844 | Highest score; only `directory` layout; 632-line `ToolLayoutDirectory`; modal **and** drawer | Filter toolbar wrapping; modal height vs viewport; gallery grid | R1, R10, local |
| 9 | `/tools/svg-path-editor` | 768×1024 | Vendored editor, 1291 CSS lines, 3 `onClick`-on-`div`, 7 `whitespace-nowrap`, 2 `min-w-[Npx]` | Canvas/controls split at tablet; horizontal overflow; keyboard reachability of div-handlers | local + R1 |
| 10 | `/tools/fake-screen` | 390×844 | 25 fixed `min-h`, 27 fixed `h`, 28 hard-coded white/black, `min-h-[480px]` studio preview | Total scroll depth to reach controls; dark-mode chrome vs canvas colors | §5.5, R1 |
| 11 | `/tools/beam-calculator` | **390×844** | **Confirmed** `min-w-[28rem]` table inside `overflow-y-auto` only — no x-scroll | Does the page scroll horizontally? | §8 pattern 1 |
| 12 | `/tools/neumorphic-css-generator` | 390×844 | 8 `min-w-[Npx]` — the highest count in the codebase; legacy `:root` vars | Controls overflowing at 390px | R1, local |
| 13 | `/tools/loan-calculator` | 390×844 | `min-w-[72rem]` (1152px) table — the widest in the app | Table scrolls in its container, not the page | §8 pattern 1 |
| 14 | `/tools/regex-tester` | 1440×900 | `maxWidth="full"`, `h-[760px]` skeleton, 8 fixed heights | CLS on hydration; prose line length at full width | R11, §5.2 |
| 15 | `/tools/favicon-app-icon-generator` | 390×844 | 4712 LOC, canvas, `role="dialog"`, 6 hard-coded white/black | Dialog height vs viewport; canvas colors in dark mode | R1, canvas |
| 16 | `/tools/todo-list` | 1440×900 | Scored 8 but its UI is 2119 CSS lines in `src/features/todo` — **scanner-blind** | Treat as un-audited; full sweep | unknown |
| 17 | `/tools/animated-background-generator` | 390×844 | 12 fixed `min-h`, 10 fixed `h`, one `100vh`, 16 hard-coded colors | `100vh` on mobile (browser chrome overlap) | §5.5, R1 |

### Screenshots needed

- `/tools/word-counter` and `/tools/uuid-generator` at 1440×900 — full page, light **and** dark (header height + empty aside).
- `/tools/css-gradient-generator` at 390×844 — the `CodeOutputPanel` tablist, cropped.
- Keyboard-focused primary button at 1440×900, light — cropped, for focus-ring measurement.
- `/tools/password-generator` control panel at 1440×900, light — cropped, for label contrast.
- `/tools/fake-screen` and `/tools/css-loaders` at 390×844 — full page.

### Browser assertions worth running

Per route:

1. `document.documentElement.scrollWidth <= window.innerWidth` — no page-level horizontal overflow.
2. No visible element containing normal prose has `getBoundingClientRect().width < 120px` — catches R1 collapse.
3. No `<aside>` or grid child has a non-zero rendered width with zero visible text content — catches R4/R7 empty columns.
4. At 390px, every element matching `[role="tablist"] > button` is within its parent's scrollable extent (`offsetLeft + offsetWidth <= parent.scrollWidth`) **and** the parent has `overflow-x` ≠ `hidden` — catches R5.
5. At 390px, the primary action (Generate/Copy/Convert) is within the first `2 × window.innerHeight` of scroll.
6. Every `<pre>` with content taller than its container has `overflow` ≠ `visible` on an ancestor within 2 levels — code scrolls in-panel, not page.
7. Distance from viewport top to the first `<input>`, `<select>` or `<button>` inside `<main>` is `< 0.9 × window.innerHeight` at 1440×900 — header does not consume the fold.
8. Every `[role="dialog"]` has `getBoundingClientRect().height <= window.innerHeight`.
9. Computed contrast of every text node against its effective background ≥ 4.5:1 (≥3:1 at ≥18.66px) — in **both** schemes.
10. Focused element's ring color contrasts ≥3:1 against its adjacent background.
11. Every `<table>` with `min-width` > 360px has an ancestor with `overflow-x: auto|scroll`.
12. axe-core `heading-order`, `label`, `color-contrast`, `aria-*` rules per route.

---

## 11. Proposed bounded change batches

**None of these were implemented.** They are proposals.

### Batch A — Global / shared foundation

High confidence, broad impact, low regression risk.

| | |
|---|---|
| **Files likely to change** | `src/styles/base.css` (remove `*` word-break; add scoped utilities), `src/styles/tokens.css` (`--focus-ring`, `--color-text-tertiary`, `--color-primary-text`), `src/styles/themes.css` (verify dark overrides) |
| **Contents** | R1 (scoped word-break), R2 (focus ring), R3 (two contrast tokens) |
| **Expected affected tools** | **All 64** |
| **Regression surface** | R1 is the real one: previously-collapsed elements widen; unbroken tokens in the 51 tools without local `break-all` may overflow. R2/R3 are visual-only with no layout effect |
| **Browser checks required** | Assertions 1, 2, 6, 9, 10 across ≥10 routes spanning all 6 layout families; both schemes; 390/768/1440/2560 |
| **Independent?** | **Yes.** No component API changes. Should land alone and be validated before anything else |

### Batch B — Shared layout normalization

| | |
|---|---|
| **Files likely to change** | `ToolPage.tsx`, `ToolLayoutSingleUtility.tsx`, `ToolLayoutTextWorkbench.tsx`, `ToolLayoutVisualGenerator.tsx`, `ToolLayoutFullscreenStudio.tsx`, `ToolPageShell.tsx`, `Tabs.tsx`, `SegmentedControl.tsx`, `CodeOutputPanel.tsx`, `tokens.css` (sidebar/sticky tokens) |
| **Contents** | R4 (conditional aside + grid), R5 (`Tabs` scroll), R7 (drop placeholder columns), R8 (sidebar/sticky tokens; resolve 6rem vs 7rem), R9 (`CodeOutputPanel` empty state), R10 (`SegmentedControl` columns) |
| **Expected affected tools** | 56 via `ToolPage`; 19 via `CodeOutputPanel`; 22 via `SegmentedControl`; 27 via layouts |
| **Regression surface** | Every tool header re-flows; every sidebar shifts width; `Tabs` visual treatment changes on 27 tools |
| **Browser checks required** | Assertions 3, 4, 5, 7, 8 + before/after screenshots for the 6 layout families |
| **Independent?** | **Partially.** R5, R9, R10 are independently shippable. R4/R7/R8 should land together — they all touch grid structure and would otherwise conflict |

### Batch C — First individual tool batch

**Provisional.** Final selection must come from the browser audit *after* Batch A, because several of these will likely be resolved by R1 alone.

Proposed 4, chosen for score × distinct-layout coverage × confirmed defects:

| Tool | Layout | Score | Why |
|---|---|---|---|
| **beam-calculator** | visual-generator | 32 | Only **confirmed** unwrapped wide table; concrete and testable |
| **css-loaders** | directory | 70 | Highest score; sole `directory` layout so it exercises the 632-line `ToolLayoutDirectory` no other tool touches; has both a modal and a drawer |
| **fake-screen** | fullscreen-studio | 53 | Worst fixed-sizing profile (25 `min-h` + 27 `h`); only real user of `ToolLayoutFullscreenStudio` |
| **svg-path-editor** | visual-generator | 68 | Vendored code with 1291 local CSS lines; 3 `onClick`-on-`div` a11y defects; least likely to benefit from shared fixes |

| | |
|---|---|
| **Files likely to change** | `src/app/tools/{beam-calculator,css-loaders,fake-screen,svg-path-editor}/**` and `src/features/tools/layouts/ToolLayoutDirectory.tsx` |
| **Regression surface** | Tool-local. `ToolLayoutDirectory` currently has exactly one consumer, so changes there are effectively local too |
| **Browser checks required** | Full per-tool sweep at 390/768/1440, both schemes, plus assertions 1, 5, 8, 11 |
| **Independent?** | **Yes** — each tool independently, but **only after Batch A** |

---

## 12. Unknowns requiring browser confirmation

Explicitly not established by this audit:

1. Whether removing the `*` word-break rule fixes or worsens any given layout. The *rule* is confirmed; the *consequence* is inference.
2. Actual above-the-fold height of the `ToolPage` header at each breakpoint.
3. The real site header height — needed to settle the `top-24` (6rem) vs `calc(100vh-7rem)` conflict in `ToolLayoutVisualGenerator`.
4. Whether `Tabs` overflow actually occurs at 390px, and at what tab count. Depends on rendered label widths.
5. How many of the 22 `SegmentedControl` consumers pass `layout="grid"` (the only at-risk variant) — not extracted.
6. Whether canvas tools honor `prefers-reduced-motion` in JS. The CSS media query does not reach them.
7. Real rendered contrast where `--color-surface-overlay` (`rgba(255,253,248,0.92)`) composites over the body's radial gradients — my computations used solid backgrounds, so real ratios may be *slightly worse* than reported.
8. Whether the `-z-10` glow in `ToolLayoutInteractiveChallenge` is occluded by an ancestor stacking context.
9. Everything about **`todo-list`** and **`pomodoro-timer`** — their UI lives in `src/features/todo` (2119 CSS lines), outside the scanner's tool-directory scope. Their scores of 8 and 30 are **not trustworthy**.
10. Whether the 59 fixed-height skeletons actually cause measurable CLS.
11. Actual touch-target sizes in dense control panels, and whether 32px `sm` controls are a real problem in use.
12. Modal/drawer height behavior in `css-loaders` and `favicon-app-icon-generator` at 390×844.

---

## 13. Files inspected

**Read in full:** `src/features/tools/registry/index.ts`, `src/features/tools/layouts/{ToolPage,ToolLayoutSingleUtility,ToolLayoutTextWorkbench,ToolLayoutVisualGenerator,ToolLayoutFullscreenStudio,ToolLayoutInteractiveChallenge}.tsx`, `src/features/tools/ui/{ToolPageShell,ToolContentCard}.tsx`, `src/features/tools/components/{CodeOutputPanel,ResultPanel,ControlSection,ControlGrid,SegmentedControl,ToolControlPanel,WarningPanel}.tsx`, `src/components/ui/{Button,Card,SurfaceCard,ActionBar,Tabs,EmptyState,PreviewFrame,Field,Input,Select}.tsx`, `src/styles/{base,tokens,themes}.css`, `src/app/globals.css`, `src/app/tools/style.css`, `src/app/tools/{word-counter,regex-tester}/page.tsx`, `src/app/tools/beam-calculator/components/BeamResults.tsx`.

**Pattern-scanned:** all `.ts`/`.tsx`/`.css` under `src/app/tools/**` (64 tool directories), `src/features/tools/{layouts,components,ui}/**`, `src/components/ui/**`, `src/styles/**`.

**Enumerated, not analyzed:** `src/features/tools/layouts/ToolLayoutDirectory.tsx` (632 lines — flagged for the visual pass), `src/features/{games,todo}/styles/*.css` (12159 lines — out of scope per the brief).

## 14. Files created

| File | Purpose |
|---|---|
| [docs/ui-audit/static-ui-foundation-audit.md](static-ui-foundation-audit.md) | This report |
| [docs/ui-audit/tool-layout-inventory.json](tool-layout-inventory.json) | Machine-readable inventory: 64 tools with routes, layouts, shared components, local CSS, pattern flags, risk scores |
| [scripts/ui-audit-static.mjs](../../scripts/ui-audit-static.mjs) | Read-only scanner. Node built-ins only, zero dependencies, catches its own errors and never exits non-zero for findings |

## 15. Statement on source modifications

**No application source file was modified during this audit.** The only files written are the three listed in §14 — two documents under `docs/ui-audit/` and one standalone scanner under `scripts/`. `package.json`, lockfiles, configuration, and all files under `src/` are untouched. `git status` before this report showed only the new untracked scanner. The scanner performs no writes outside `docs/ui-audit/` (and only with an explicit `--write` flag), is not wired into any build step, and is not imported by any application code.

---

## First actions for the visual agent

The moment Chromium is ready, in this order:

**Read these 5 files first** (they explain most of what you will see):
1. [src/styles/base.css](../../src/styles/base.css) — lines 26-29 and 69-72
2. [src/styles/tokens.css](../../src/styles/tokens.css) — lines 14-17, 26, 157
3. [src/features/tools/layouts/ToolPage.tsx](../../src/features/tools/layouts/ToolPage.tsx) — lines 80-153
4. [src/components/ui/Tabs.tsx](../../src/components/ui/Tabs.tsx) — lines 25-30
5. [src/features/tools/components/CodeOutputPanel.tsx](../../src/features/tools/components/CodeOutputPanel.tsx) — lines 65-88

**Then load these 6 routes:**

| Order | Route | Viewport | Single question to answer |
|---|---|---|---|
| 1 | `/tools/css-gradient-generator` | 390×844 | Are code tabs clipped and unreachable? (**R5**) |
| 2 | `/tools/uuid-generator` | 1440×900 | Does the "Tool profile" aside render nearly empty beside dead space? (**R4**) |
| 3 | `/tools/jwt-decoder` | 390×844 | Does prose break mid-word, and do tokens overflow? (**R1**) |
| 4 | `/tools/beam-calculator` | 390×844 | Does the page scroll horizontally from the `min-w-[28rem]` table? (**confirmed defect**) |
| 5 | `/tools/word-counter` | 1440×900 | How many pixels before the first interactive control? (**§5.2**) |
| 6 | Any route, `Tab` key, light mode | 1440×900 | Is the focus ring visible at all? (**R2**) |

Answering those six settles the four highest-leverage shared root causes and determines whether Batch A should ship before any per-tool work.
