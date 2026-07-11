export default function AspectRatioCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What does this aspect ratio studio do?
        </h2>
        <p>
          It solves missing dimensions, reduces pixel sizes to clean ratios, previews safe zones,
          calculates contain and cover fits, estimates centered crop loss, and generates production
          snippets for CSS, HTML, React, and design tokens.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Built for creator and product workflows
        </h2>
        <p>
          Use quick targets for social posts, vertical video, open graph images, banners, app cards,
          and print crops. The tool keeps the important numbers visible at the top so designers can
          move from target size to export without scrolling through long notes.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Crop, contain, cover, and safe zones
        </h2>
        <p>
          Contain keeps the full asset visible inside a target box. Cover fills the target box and
          may crop edges. The crop preview and crop-loss check help you decide whether the selected
          ratio is safe before exporting a final image or video frame.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Production exports
        </h2>
        <p>
          The export panel includes modern aspect-ratio CSS, a legacy padding fallback, HTML markup,
          a small React component, and JSON tokens. This makes the tool useful for both visual design
          and developer handoff.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Privacy
        </h2>
        <p>
          All calculations happen locally in your browser. The tool does not upload your dimensions,
          images, or design data.
        </p>
      </section>
    </div>
  );
}
