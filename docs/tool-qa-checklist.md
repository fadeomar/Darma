# Darma Tool QA Checklist

Use this checklist before merging any new or upgraded tool.

## Build and routing

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] The tool route loads directly and from `/tools`.
- [ ] No reserved Next.js filenames are used for helper files under `src/app/**`.
- [ ] No server route is added unless the tool genuinely requires server-side processing.

## Mobile-first UX

- [ ] The main workflow works on a narrow mobile viewport.
- [ ] Tool controls do not overflow horizontally.
- [ ] Preview areas have sensible max heights and scroll behavior.
- [ ] Empty state is clear before user input.
- [ ] Error state is friendly and actionable.

## Inputs and browser safety

- [ ] Input size limits are documented in the UI or enforced safely.
- [ ] Invalid input does not crash the tool.
- [ ] Reset/clear action works.
- [ ] Copy buttons work for every output mode.
- [ ] File tools reject unsupported files gracefully.
- [ ] Browser-only tools do not send user data to an API.
- [ ] Sensitive data is not stored unless absolutely required and clearly explained.

## Shared Darma patterns

- [ ] `page.tsx` is thin.
- [ ] The page uses `getToolRegistry().getById("<tool-slug>")`.
- [ ] The page uses shared SEO helpers where the project pattern supports it.
- [ ] The page renders with `ToolPage`, `ToolContentCard`, or the current shared Darma layout.
- [ ] The tool uses shared UI primitives from `src/components/ui` where practical.
- [ ] Reusable logic lives in pure local files such as `types.ts`, `utils.ts`, `presets.ts`, or `generators.ts`.
- [ ] No direct union-typed React state setter is passed to `Tabs` if the tab value may be widened to `string`.

## SEO and catalog metadata

- [ ] `Article.tsx` exists for SEO/help content when the tool is public.
- [ ] Registry metadata exists.
- [ ] Registry `privacy` is accurate.
- [ ] Registry `keywords` include common user search terms.
- [ ] Registry `relatedTools` contains valid existing tool ids and does not reference itself.
- [ ] The tool appears correctly in `/tools` search and filters.

## Final manual checks

- [ ] Try default input.
- [ ] Try empty input.
- [ ] Try invalid input.
- [ ] Try maximum supported input.
- [ ] Try copy/download/export actions.
- [ ] Try reset/randomize actions when available.
- [ ] Check light and dark mode if the page supports both.

## Tools platform personalization

- [ ] Favorite and unfavorite a tool from `/tools`, reload, and confirm the state persists.
- [ ] Open two tool pages, return to `/tools`, and confirm Recently used appears with updated counts.
- [ ] Paste text in Text Cleaner Pro, switch to Format, set custom prefix/suffix text, and confirm single actions and pipelines use those values.
