export default function AspectRatioCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What does this aspect ratio studio do?
        </h2>
        <p>
          It solves missing dimensions, reduces any pixel size to its simplest ratio, previews the
          shape, finds nearby creator presets, calculates fit and cover sizes, estimates centered
          crops, and generates CSS you can paste into a website or design handoff.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Why it is useful for creators
        </h2>
        <p>
          Social, video, web, and print formats all expect different shapes. A 16:9 YouTube frame,
          a 9:16 short, a 4:5 feed post, a 1:1 avatar, and a 21:9 hero banner all need correct
          proportions before you export. This tool helps you avoid stretched images, bad crops, and
          inconsistent responsive sizes.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Crop, contain, and cover
        </h2>
        <p>
          Contain keeps the whole image visible inside a target box. Cover fills the target box and
          may crop some edges. The centered crop result shows the safe crop area needed to convert an
          existing image into the selected ratio.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          How the math works
        </h2>
        <p>
          For a ratio of W:H, the height for a given width is width × H ÷ W, and the width for a
          given height is height × W ÷ H. To simplify a pixel size into a ratio, both numbers are
          divided by their greatest common divisor. The CSS output uses the modern aspect-ratio
          property with a padding-top fallback for older layout patterns.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Privacy
        </h2>
        <p>
          All calculations happen in your browser. The tool does not upload your dimensions, images,
          or design data.
        </p>
      </section>
    </div>
  );
}
