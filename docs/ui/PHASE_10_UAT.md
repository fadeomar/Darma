# Phase 10 Visual Experience UAT

## Desktop

- Open `/`, `/about`, `/tech-atlas`, `/guides`, `/comparisons`, `/tech-careers`, `/ways-of-working`, and `/career-pathfinder`.
- Confirm the Atlas mega menu opens, closes outside, closes with Escape, and follows keyboard focus.
- Confirm hero visuals load locally with no broken images.
- Scroll the About story and verify the pinned visual releases cleanly.
- Complete all six Career Pathfinder questions and open each suggested career.
- Refresh and confirm Pathfinder answers remain local.
- Copy a Pathfinder result link and confirm it contains only role slugs, not private answers.
- Open dynamic Open Graph routes through the deployed social-preview debugger.

## Mobile and tablet

- Open and close the full-screen navigation drawer.
- Confirm the page behind the drawer does not scroll.
- Confirm no horizontal overflow on long labels and comparison content.
- Verify the About story becomes a normal stack and does not pin.
- Complete Career Pathfinder at 320px, 375px, 768px, and landscape widths.
- Confirm touch targets remain at least 44px high.

## Accessibility

- Enable reduced motion at the operating-system level.
- Confirm content appears immediately and no required interaction depends on movement.
- Navigate the menu and Career Pathfinder using only a keyboard.
- Verify focus indicators remain visible.
- Confirm headings retain readable accessible names.

## Performance

- Check homepage, About, Career Pathfinder, and a long guide in Lighthouse mobile mode.
- Confirm local SVGs are cached and do not trigger remote image requests.
- Inspect the initial JavaScript route bundle and verify GSAP is loaded only on pages using motion.
- Watch for layout shifts, long tasks, hydration warnings, and repeated ScrollTrigger creation.
