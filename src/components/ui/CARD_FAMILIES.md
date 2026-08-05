# Card families

Darma has seven card families. They deliberately do **not** share one universal
layout — a tool needs a preview panel, a resource needs an identity panel, a
glossary term needs neither. What they do share is the `Card` primitive
(`src/components/ui/Card.tsx`) for surface, radius, border and hover, plus the
region contract below: every family reserves height for each region so cards in
the same grid row end their content at the same offset.

`Card` supplies `variant` (surface + hover) and `padding`. Everything else here
is the family's own contract.

## Shared rules

- Cards are grid items and must keep `min-width: 0` so they can shrink.
- Titles clamp to **two visual lines**. The full title stays reachable through
  the link's accessible name and a `title` attribute — clamping is presentational
  only and never hides the name from assistive technology.
- Descriptions clamp to a fixed line count **and** reserve that height, so a
  short description does not pull the action row up past its neighbours.
- Focus: the card's own focusable child shows `--focus-ring`; cards that use a
  stretched link add `focus-within:shadow-[var(--focus-ring)]`.
- No fact appears twice on the same card.
- No interactive element nests inside another interactive element.

## Tool catalog card — `ToolCard` in `features/tools/layouts/ToolLayoutDirectory.tsx`

| region | contract |
| --- | --- |
| Visual | `ToolPreviewArtwork` in a fixed-aspect panel. Future bespoke artwork drops in without changing card height. |
| Title | 2 lines, `min-h-[2.5rem]` (`sm:min-h-[3.5rem]`) |
| Description | 3 lines, `min-h-[4.5rem]` |
| Metadata | use cases: 2 rows, `min-h-[2.5rem]`; tag/category row `min-h-8` |
| Action | "Open tool", pinned with `mt-auto pt-5` |
| Targets | artwork link, body link, favourite button |

The body link must carry `flex flex-1 flex-col`; a bare `<Link>` is
`display: inline` and severs the flex column, which is what let CTA baselines
drift by up to 62px.

## Game catalog card — `features/games/components/GameCard.tsx`

Interaction model **B**: the card is the navigation target via a stretched link
on the title; Favourite is a sibling control raised above it. There is no second
"Play now" link — it duplicated the card's own action.

| region | contract |
| --- | --- |
| Visual | `GameThumbnail`, fixed aspect. Status flags top-left, play time bottom-left, play affordance bottom-right (a `span`, not a link). |
| Title | 2 lines, `line-clamp-2` |
| Description | 2 lines, `min-h-[3rem]` |
| Metadata | exactly 4 facts, each once: play time (on the thumbnail), category, difficulty, input method. Pinned with `mt-auto`. |
| Targets | 2 — card link + favourite |

## Resource card — `features/resources/components/ResourceExplorer.tsx`

| region | contract |
| --- | --- |
| Visual | `ResourceCardArtwork`, fixed aspect, `aria-hidden`, carries type through symbol + accent only. Monogram fallback per the Phase 1 policy (`lib/resourceIconPolicy.ts`) — never a remote third-party logo. |
| Title | `truncate`, host shown beneath |
| Metadata | type, cost, level badges + pillar chips, each stated once |
| Action | outbound source link |

## Learning-path card — `features/learning-paths/components/LearningPathCard.tsx`

Stage count and duration are the metadata; the whole card links to the path.

## Editorial guide/comparison card — `features/editorial/components/EditorialCard.tsx`

Keeps the Phase 1 long-keyword wrapping fix (`.darma-break-token` on technical
strings). Do not add `word-break: break-word` to the card container — it
collapses min-content width.

## Atlas doorway card — `tech-atlas` sections

Carries `AtlasCardArtwork`. Artwork redesign is deferred to the visual asset
sprint; the container dimensions here are the stable target for it.

## Featured card

A tool or game card rendered at a larger size. It reuses its family's regions
rather than defining new ones.
