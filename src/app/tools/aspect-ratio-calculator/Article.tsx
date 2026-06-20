export default function AspectRatioCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What does this calculator do?
        </h2>
        <p>
          Choose an aspect ratio — or type your own — then enter a width or a height and the missing
          dimension is solved to keep the proportions correct. It also reduces any width × height
          pair to its simplest ratio, like turning 1920 × 1080 into 16:9.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Why aspect ratio matters
        </h2>
        <p>
          Keeping a consistent ratio stops images and videos from being stretched or cropped when
          they are resized. Different platforms expect different ratios: 16:9 for landscape video,
          9:16 for Reels and Stories, 1:1 for square posts, and 4:3 or 3:2 for many photos.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          How the math works
        </h2>
        <p>
          For a ratio of W:H, the height for a given width is width × H ÷ W, and the width for a
          given height is height × W ÷ H. To simplify a pixel size into a ratio, both numbers are
          divided by their greatest common divisor — that is how 1920 × 1080 reduces to 16:9.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Common uses
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Resize a video frame while keeping it 16:9.</li>
          <li>Find the height for a full-width hero image.</li>
          <li>Match a thumbnail to a platform&apos;s required ratio.</li>
          <li>Check what ratio an existing image actually uses.</li>
        </ul>
      </section>
    </div>
  );
}
