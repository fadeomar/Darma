# Darma Motion System

## Purpose

Motion in Darma clarifies hierarchy, progress, navigation, and relationships. It must never delay access to content or become the only way information is communicated.

## Technical approach

- GSAP is loaded only inside client-side motion components.
- ScrollTrigger powers scroll-linked storytelling and gentle parallax.
- Animations primarily use `transform` and `opacity`.
- Desktop pinning is disabled on smaller screens.
- `prefers-reduced-motion: reduce` disables non-essential movement.
- Every GSAP animation is scoped through `gsap.context()` and reverted during React cleanup.
- The site does not use premium plugins or external animation assets.

## Motion roles

### Route motion
A subtle opacity and vertical transition confirms navigation without blocking interaction.

### Section reveal
Sections enter when they approach the viewport. The content remains in the server-rendered HTML and motion is progressive enhancement.

### Split text reveal
Headings animate word-by-word without relying on the premium SplitText plugin. The complete title remains available through `aria-label`.

### Hero scene
Local SVG illustrations enter with controlled scale and parallax. Floating labels reinforce the subject rather than acting as decoration only.

### Scroll story
The About page demonstrates Darma's research-to-action flow. Desktop users receive a pinned visual; mobile users receive the same information as a normal readable sequence.

### Navigation
The Atlas mega menu and mobile drawer use short transitions and staggered links. Keyboard Escape, route changes, outside clicks, and body scroll locking are handled explicitly.

## Performance rules

1. Never import GSAP in server components.
2. Do not animate width, height, top, or left for continuous effects.
3. Avoid simultaneous animations across large result lists.
4. Do not pin sections on small screens.
5. Keep hero illustrations local, optimized SVG files.
6. Every new motion surface must pass `npm run ui:motion:audit`.
7. Test the experience with reduced motion enabled.
