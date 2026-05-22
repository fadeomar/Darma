export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>Generate palettes for design systems and UI work</h2>
      <p>
        A color palette generator helps turn one base color into a usable set of related colors for interfaces, landing pages, dashboards,
        illustrations, and brand explorations. Instead of manually guessing every swatch, you can start from a harmony mode and then refine
        the colors that feel right for your project.
      </p>

      <h3>Color harmony modes</h3>
      <p>
        Harmony modes are simple color-wheel relationships. Monochromatic palettes stay on one hue and vary lightness. Analogous palettes use
        neighboring hues for a calm look. Complementary and split-complementary palettes add contrast by pairing the base color with opposite
        or near-opposite hues. Triadic and tetradic palettes create richer sets with multiple balanced accents.
      </p>

      <h3>Accessibility and contrast</h3>
      <p>
        Good palettes need more than attractive swatches. Text, buttons, cards, and muted surfaces must remain readable. The contrast panel checks
        common foreground and background pairs and labels them as Fail, AA, or AAA so you can quickly spot colors that need adjustment.
      </p>

      <h3>Export CSS variables and design tokens</h3>
      <p>
        The export panel turns your palette into a HEX list, CSS variables, a Tailwind-like object, or JSON tokens. CSS variables are useful for
        quick prototypes, while JSON tokens can be adapted into a larger design-token workflow.
      </p>

      <h3>Pairs well with Darma color tools</h3>
      <p>
        Use this generator to create a starting palette, then use Color Shades to build smoother ramps from key colors. You can also combine the
        resulting swatches with the CSS Gradient Generator or Animated Background Generator when you want a more visual UI treatment.
      </p>

      <h3>Privacy</h3>
      <p>
        Palette generation, contrast checks, and exports run in your browser. No server route is used for this tool, and your colors are not sent
        to Darma for processing.
      </p>
    </article>
  );
}
