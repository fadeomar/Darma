export default function CssGradientGeneratorArticle() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What is a CSS gradient generator?</h2>
      <p>
        A CSS gradient generator helps you visually create backgrounds made from
        two or more colors. Instead of writing gradient syntax by hand, you can
        adjust colors, positions, angle, and type, then copy the generated CSS.
      </p>

      <h2>Linear gradients vs radial gradients</h2>
      <p>
        A linear gradient blends colors along a straight direction, such as 90deg
        or 135deg. A radial gradient spreads from a center point outward, which
        is useful for glows, soft hero backgrounds, and spotlight effects.
      </p>

      <h2>Color stops</h2>
      <p>
        Color stops control which color appears at each percentage of the
        gradient. A stop at 0% starts the gradient, a stop at 100% ends it, and
        middle stops create richer transitions.
      </p>

      <h2>When to use CSS gradients</h2>
      <p>
        Gradients are useful for landing pages, cards, buttons, banners,
        dashboards, and decorative UI sections. They are CSS-based, so they can
        scale cleanly without image files.
      </p>

      <h2>Common gradient mistakes</h2>
      <p>
        Avoid using too many stops unless you need them. Keep contrast in mind
        when text appears on top of a gradient, and test the result on mobile so
        the background does not distract from the content.
      </p>

      <h2>Privacy</h2>
      <p>
        This tool runs fully in your browser. The colors and CSS you generate are
        not uploaded to a server.
      </p>
    </article>
  );
}
