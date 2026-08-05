# Direct Claude Prompt — Apply Darma UI P0–P2 Package

Apply the supplied Darma UI P0–P2 files directly on top of the current local branch.

## Source of truth

- The package was generated from the same `src(5).zip` version used during localhost UI testing.
- Copy the included `src/` tree over the local project `src/` tree, preserving all paths.
- Do not redesign unrelated pages or replace the implementation with a different architecture.
- Do not revert existing database, JSON adapter, admin, Explorer, tools, games, Atlas, or content work.

## Required result

1. Keep the About story visual bounded inside its own section. It must never overlap the next section.
2. Keep the visual sticky on desktop only. Do not restore GSAP pinning or `pinSpacing: false`.
3. Keep `Games` visible in desktop and mobile navigation.
4. Keep the search shortcut visible on suitable desktop widths and functional through `Ctrl/Cmd + K` and `/`.
5. Preserve the new accordion styling and native `<details>` semantics.
6. Preserve the new Lucide arrows, larger click targets, audience-tool deduplication, editorial heading width, recent-tool flex layout, and responsive resource filters.
7. Preserve semantic color tokens and verify all changed content in light and dark mode.
8. Do not introduce hard-coded black/white text colors where semantic tokens already exist.

## Validation

Run only these focused checks first:

```bash
npm run typecheck
npm run lint
npm run build
```

Then run localhost and manually verify:

- `/about` at 1440px, 1024px, 768px, and 390px.
- Light and dark themes.
- Scroll through the full About story and confirm there is no overlap.
- Desktop navbar includes Games.
- Search shows `Ctrl K` or `⌘ K` on wide desktop and opens from keyboard.
- Audience and coverage arrows are visible and aligned at the far edge.
- One recent tool renders as a normal fixed-width card without a large empty grid.
- A guide or comparison FAQ clearly looks expandable and opens correctly.
- `/resources` categories wrap on desktop and scroll cleanly on mobile.
- Resource filters render as 2 columns on medium, 3 on laptop, and 6 only on very wide screens.

Fix only errors caused by this package. Do not spend tokens on broad refactors or unrelated tests. Return a concise summary of changed files, command results, and any remaining visual issue.
