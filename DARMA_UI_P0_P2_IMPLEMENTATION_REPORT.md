# Darma UI P0–P2 Implementation Report

## Scope

This package is built on top of the uploaded `src(5).zip` source tree. It targets the UI and content regressions discovered during localhost testing, with explicit attention to readable content in both light and dark modes.

## P0 fixes

- Replaced the GSAP-pinned About-page story visual with a bounded CSS `position: sticky` layout.
- Removed `pin`, `pinSpacing: false`, and the layout-breaking scroll behavior.
- Kept GSAP only for active-step, orbit-node, and progress animation.
- Reduced the story visual size and step height, and added a mobile-safe non-sticky layout.
- Restored `Games` to the desktop primary navigation.
- Restored the visible search shortcut (`Ctrl K` / `⌘ K`) at suitable desktop widths while keeping the shortcut active everywhere.
- Redesigned editorial FAQs so they clearly look and behave like accordions, including a chevron, open state, hover state, focus state, and answer divider.

## P1 fixes

- Rewrote the main About-page story copy to remove robotic “not only” and em-dash phrasing.
- Cleaned similar high-visibility copy on the home page, search page, career overview, and ways-of-working pages.
- Replaced tiny text arrows in audience cards, coverage links, editorial-policy links, and Tech Atlas cards with consistent Lucide icons.
- Increased arrow size, spacing, hover movement, and focus visibility.
- Added curated, deduplicated audience tool groups so the same popular tools are not repeated across every audience card.
- Reworked the recent-tools layout so one or two cards no longer leave a broken five-column grid.
- Increased editorial section-title width and improved heading wrapping.
- Changed the resource-category row to wrap on desktop and scroll cleanly on mobile without a native scrollbar.
- Changed the resource filters to two columns on medium screens, three columns on laptop screens, and the full six-control layout only on very wide screens.

## P2 polish

- Added stronger visual identity to About-page help, audience, and Tech Atlas cards.
- Made Tech Atlas preview cards fully clickable instead of relying on a small footer link.
- Centered the final two audience cards in the six-column desktop grid.
- Improved card affordance, minimum click target sizes, focus states, and hover feedback.
- Added dark-mode-specific treatment for animated background highlights.
- Kept all new text and surfaces on semantic design tokens rather than fixed light-mode colors.

## Light and dark mode readability

The principal token pairs used by the changed components were checked for WCAG contrast:

| Pair | Contrast |
|---|---:|
| Light primary text / page | 16.14:1 |
| Light secondary text / page | 11.78:1 |
| Light tertiary text / raised surface | 5.86:1 |
| Light orange link / raised surface | 4.69:1 |
| White text / light primary button | 4.69:1 |
| Dark primary text / page | 16.75:1 |
| Dark secondary text / raised surface | 11.19:1 |
| Dark tertiary text / raised surface | 4.92:1 |
| Dark orange link / raised surface | 5.92:1 |
| Dark primary-button text / orange | 6.64:1 |

All listed pairs meet the 4.5:1 normal-text threshold.

## Validation performed

- Parsed every changed TypeScript and TSX file with the TypeScript compiler API: passed.
- Checked CSS brace balance: passed (`99` opening and `99` closing braces).
- Confirmed no GSAP `pin` or `pinSpacing` remains in `AtlasScrollStory`.
- Confirmed `Games` exists in both desktop and mobile navigation data.
- Confirmed the search button renders the shortcut label at desktop widths.
- Confirmed the FAQ includes visible accordion state and a chevron.
- Confirmed the About-page user-facing copy no longer contains text-arrow characters or the reported em-dash phrasing.

## Build limitation

A full `npm ci`, typecheck, lint, and Next.js build could not run in this environment because the configured internal npm registry returned `404` for required packages (`@types/node` peer resolution and `zod-validation-error`). This is an environment/package-registry limitation, not a discovered source error.

Run locally after applying:

```bash
npm run typecheck
npm run lint
npm run build
```

Then manually inspect `/about`, a guide/comparison FAQ page, `/resources`, the header at desktop/tablet/mobile widths, and both themes.
