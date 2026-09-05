export default function ColorConverterArticle() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What is a color converter?</h2>
      <p>
        A color converter changes one visual color between formats used by CSS,
        design tools, design systems, and production UI. The same color can be
        represented as HEX, RGB, HSL, HWB, CMYK, LAB, or OKLCH depending on the
        context.
      </p>

      <h2>HEX, RGB, HSL, and alpha</h2>
      <p>
        HEX is compact and common in design tokens. RGB is useful for channel
        values and modern CSS opacity syntax. HSL is easier to adjust by hue,
        saturation, and lightness. Alpha values add transparency and are shown in
        alpha-aware CSS outputs while solid conversions still use the base RGB
        color.
      </p>

      <h2>Why include LAB and OKLCH?</h2>
      <p>
        LAB and OKLCH are useful when working with perceptual color workflows.
        OKLCH is especially helpful for modern CSS and for creating more
        predictable color systems because its lightness, chroma, and hue map more
        closely to how colors are perceived.
      </p>

      <h2>Accessibility and contrast</h2>
      <p>
        The tool compares the selected color against black and white text. This
        gives a fast readability check before using a color as a background,
        button, badge, or brand accent. Final production UI should still be
        reviewed with the actual font size, font weight, and neighboring colors.
      </p>

      <h2>Shade scales and exports</h2>
      <p>
        The generated shade scale provides Tailwind-style color steps that can be
        used as a starting point for backgrounds, borders, hover states, and UI
        tokens. You can copy CSS variables, Tailwind config snippets, JSON
        tokens, or SCSS maps directly from the export tab.
      </p>


      <h2>Try formats and UI roles side by side</h2>
      <p>
        The example library now mixes HEX, alpha HEX, modern RGB, modern HSL, and CSS color names with familiar UI roles such as success, warning, danger, slate, violet, and translucent brand colors. Use the examples to learn format syntax and to see how the same parsed color behaves in contrast, scale, relationship, and export views.
      </p>

      <h2>Privacy</h2>
      <p>
        Color conversion happens fully in your browser. The color you type is not
        uploaded or sent to a server.
      </p>
    </article>
  );
}
