export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>Responsive images are a delivery contract</h2>
      <p>
        A responsive image combines source assets, layout information, and loading hints. The <code>srcset</code> candidates describe the files that exist, while <code>sizes</code> describes the width of the rendered slot. Browsers use both values, together with device pixel ratio and their own network heuristics, to choose a resource.
      </p>

      <h2>Plan useful width candidates</h2>
      <p>
        Width descriptors such as <code>400w</code>, <code>800w</code>, and <code>1200w</code> represent intrinsic file widths. A practical set should cover the smallest real slot and the largest high-DPR requirement without creating dozens of nearly identical assets. Duplicate width descriptors are ambiguous and should be removed.
      </p>

      <h2>Keep sizes aligned with CSS</h2>
      <p>
        The <code>sizes</code> attribute is not a list of file sizes. It is a media-condition map for the image&apos;s rendered width. If a card is full width on mobile, half width on tablet, and one third on desktop, the sizes rules should express that same layout. An inaccurate value can make the browser download an image that is much larger than the visible slot.
      </p>

      <h2>Use picture for format fallback or art direction</h2>
      <p>
        A normal <code>&lt;img&gt;</code> with <code>srcset</code> is enough for most fluid layouts. Use <code>&lt;picture&gt;</code> when you need AVIF or WebP sources before a fallback, or when mobile and desktop need different crops. Every source still needs a valid candidate set and, when appropriate, its own media condition.
      </p>

      <h2>Loading and layout stability</h2>
      <ul>
        <li>Provide intrinsic width and height so the browser can reserve the correct aspect ratio.</li>
        <li>Use lazy loading for most below-the-fold images.</li>
        <li>Use eager loading and high fetch priority only for an important above-the-fold image.</li>
        <li>Write useful alternative text for meaningful content; use an empty value only for decorative images.</li>
      </ul>

      <h2>Next.js Image behavior</h2>
      <p>
        Next.js generates its own optimized candidate URLs, so the exported component does not copy the manual <code>srcset</code>. The important handoff is the source image, intrinsic dimensions, loading hints, and an accurate <code>sizes</code> value that matches the component&apos;s real layout.
      </p>

      <h2>Start from the image's real job</h2>
      <p>
        A hero, product thumbnail, testimonial avatar, documentation screenshot, gallery item, logo strip, and full-bleed campaign image should not share the same candidate widths or <code>sizes</code> strategy. Use the scenario presets as a delivery starting point, then replace the example URLs and match the slot widths to your actual CSS.
      </p>
      <p>
        The art-direction starters demonstrate when <code>&lt;picture&gt;</code> is justified, while the Next.js starters focus on accurate <code>sizes</code> values rather than hand-authored framework <code>srcset</code> URLs.
      </p>

      <h2>Production verification</h2>
      <p>
        Treat the analyzer as a planning estimate. Before shipping, serve real files, inspect network requests at several viewports, test at high device pixel ratio, disable cache, and verify the fallback when a modern format is unavailable. The production report records candidate coverage, syntax warnings, accessibility checks, and the current readiness state.
      </p>

      <h2>Private, reopenable projects</h2>
      <p>
        Project JSON stores URLs, candidate widths, sizes rules, attributes, picture sources, preview settings, and export preferences. It does not fetch or upload image files. Import is validated and limited to 1 MB, and all generation remains in the browser.
      </p>
    </article>
  );
}
