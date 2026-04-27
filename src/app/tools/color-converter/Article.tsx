export default function ColorConverterArticle() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What is a color converter?</h2>
      <p>
        A color converter changes the same visual color between formats used in
        CSS and design tools. The most common formats are HEX, RGB, and HSL.
        They describe the same color in different ways, so converting between
        them makes it easier to use a color across code, mockups, and design
        systems.
      </p>

      <h2>HEX vs RGB vs HSL</h2>
      <p>
        HEX is compact and popular in CSS, for example <code>#3b82f6</code>.
        RGB describes red, green, and blue channel values, for example
        <code>rgb(59, 130, 246)</code>. HSL describes hue, saturation, and
        lightness, which is often easier when you want to create lighter or
        darker variations of a color.
      </p>

      <h2>When to use each format</h2>
      <p>
        Use HEX when you want a short color token. Use RGB when you need channel
        values or modern CSS opacity patterns. Use HSL when you want to adjust
        hue, saturation, or lightness in a predictable way.
      </p>

      <h2>Shades and palette building</h2>
      <p>
        The shade preview uses the color&apos;s HSL lightness value to create quick
        lighter and darker variations. These are helpful starting points for
        hover states, borders, backgrounds, and simple UI palettes.
      </p>

      <h2>Contrast note</h2>
      <p>
        The contrast values compare your color against black and white text.
        Higher values are easier to read. This is a helpful quick check, but a
        dedicated accessibility review is still recommended for production UI.
      </p>

      <h2>Privacy</h2>
      <p>
        Color conversion happens fully in your browser. The color you type is
        not uploaded or sent to a server.
      </p>
    </article>
  );
}
