# Darma UI Refactor Follow-ups

## Remaining visual tools for future refactors

- CSS Grid Generator
- Flexbox Generator
- Container Query Generator
- CSS Transform Generator
- Responsive Image Srcset Generator
- Animated Background Generator
- CSS Gradient Generator
- Color tools if needed

## Technical debt to keep watching

- Some older generator files remain in tool folders for reference and can be removed after route QA confirms they are unused.
- Legacy local CSS files should only be deleted after import/reference searches confirm they are unused.
- Large client components should be split into preview, controls, and output components in future cleanup passes.
- Add automated route smoke tests for each tool page.
- Continue checking mobile overflow at 375px, 430px, 768px, 1024px, and xl desktop widths.
