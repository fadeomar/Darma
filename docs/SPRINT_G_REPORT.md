# Sprint G Report

## Summary

Sprint G focused on Darma product polish and regression hardening after the shared UI and tool-page refactor sprints. The work improved the tools directory, hardened registry metadata, added root workflow journeys, improved category discovery, surfaced related tools on tool pages, handled the Next.js 16 middleware/proxy cleanup, and documented remaining release-candidate risks.

## Files changed

Key changed areas:

- `src/features/tools/registry/index.ts`
- `src/features/tools/registry/validate.ts`
- `src/features/tools/infra/inMemory/toolRegistry.memory.ts`
- `scripts/check-tools-registry.ts`
- `package.json`
- `src/features/tools/layouts/ToolLayoutDirectory.tsx`
- `src/features/tools/layouts/ToolPage.tsx`
- `src/app/categories/page.tsx`
- `src/app/workflows/page.tsx`
- `src/app/workflows/[slug]/page.tsx`
- `src/features/tools/workflows/index.ts`
- Removed deprecated duplicate `src/middleware.ts`; `src/proxy.ts` remains the active Next.js 16 proxy file.

## Build results

The extracted sandbox did not retain a complete dependency installation. Running `npm install --ignore-scripts --no-audit --no-fund` was attempted, but the container terminated the install. Because `node_modules/.bin` was unavailable, `npm run check:tools`, `npm run typecheck`, and `npm run build` could not be fully executed inside this environment.

Focused static checks completed:

- All `src/app/tools/*/page.tsx` tool route folders are represented in the registry.
- All public registry entries have matching tool route folders.
- No duplicate registry IDs were found.
- No invalid related tool IDs were found.
- No self-referencing related tool IDs were found.

Recommended verification in the real project environment:

```bash
npm install
npx prisma generate
npm run check:tools
npm run typecheck
npm run build
```

## Directory/navigation changes

The tools directory now supports a fuller discovery model:

- Search across title, description, tags, audiences, categories, layout type, tool category, privacy, and keywords.
- Audience chips with accessible selected state.
- Tool type filter.
- Category filter.
- Sort control for featured, recent, A–Z, and category sorting.
- Clear filters button.
- Accurate result count.
- Less noisy tool cards with fewer badges and clearer metadata hierarchy.
- Link from the directory hero to `/workflows`.

## Workflow/category changes

Workflow pages were added at:

- `/workflows`
- `/workflows/[slug]`

Existing `/tools/workflows` pages remain for backward compatibility.

Workflow pages use the existing static workflow data and registry lookups, so only public tools are displayed. Each detail page shows an ordered step-by-step journey, structured data, related workflows, and direct links to tool pages.

The `/categories` page now also includes a registry-backed tool category section so users can discover Darma browser tools by practical category, in addition to the existing element/project category cards.

## Registry validation results

Registry hardening included:

- Added registry entries for every public tool route folder.
- Added consistent `privacy`, `keywords`, and `relatedTools` metadata to registry entries.
- Improved in-memory registry search to include all important discovery metadata.
- Replaced the registry check script with stronger validation for duplicate IDs/hrefs, route matching, required metadata, layout/privacy values, and related tool integrity.
- Added `npm run check:tools` to `package.json`.

## Accessibility checks

Implemented accessibility-oriented improvements:

- Directory search retains an accessible label.
- Audience filters expose selected state with `aria-pressed`.
- Filter controls use real `select` elements.
- Clear filters button has clear text and icon support.
- Workflow cards and step cards are full links with meaningful text.
- Related tools use real links and concise text metadata.
- Directory chips are horizontally scrollable on small screens to avoid overflow.

Manual checks still recommended at 320px, 375px, 430px, tablet, and desktop widths.

## Remaining known risks

- Full build/typecheck still needs to run in a dependency-installed environment.
- Some legacy tool-specific CSS remains intentionally for visual/canvas/fullscreen tools.
- Older shared components outside the tools area still need a future low-risk migration review:
  - `src/components/ConfigurationRow`
  - `src/components/ConfigurationRow1.tsx`
  - `src/components/CTAButton`
  - `src/components/RainbowButton`
  - `src/components/TestCard`
  - `src/components/ToggleSwitch`
  - `src/components/VariantSelector`
  - `src/features/elements/ui/components/ElementCard/ElementCard.tsx`
  - `src/features/elements/ui/home/SelectPanelSection.tsx`
- Category detail pages are still primarily element/project category pages. Tool-specific category filtering is currently concentrated in `/tools`.
- Workflow IDs should be kept stable because root workflow URLs now use them as public slugs.

## Recommended next sprint

Sprint H — Release Candidate QA:

- No new features.
- Full route smoke test.
- Mobile and dark-mode screenshots.
- Production deploy preview check.
- Accessibility pass.
- Core Web Vitals quick review.
- Final bug list before publishing or starting new tool expansion.
