export default function Article() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What CSS transform does</h2>
      <p>
        CSS transforms visually move, rotate, scale, skew, and project elements without forcing the surrounding document flow to re-layout. They are ideal for interaction states, hover effects, entrance motion, and lightweight UI depth.
      </p>

      <h2>2D transforms: translate, rotate, scale, and skew</h2>
      <p>
        The most common transform functions are <code>translate()</code>, <code>rotate()</code>, <code>scale()</code>, and <code>skew()</code>. Use them for card lifts, button presses, ribbons, image zooms, and small interface feedback.
      </p>

      <h2>3D transforms and perspective</h2>
      <p>
        3D transforms such as <code>rotateX()</code>, <code>rotateY()</code>, and <code>translateZ()</code> become easier to understand when paired with <code>perspective()</code>. Lower perspective values create stronger depth; higher values make the effect flatter.
      </p>

      <h2>Understanding transform-origin</h2>
      <p>
        <code>transform-origin</code> controls the point around which rotation and scaling happen. A top-left origin makes the element rotate from the top-left corner, while center center rotates around the middle.
      </p>

      <h2>Transform order matters</h2>
      <p>
        Transform functions are order-sensitive. Rotating and then translating can produce a different result than translating and then rotating. Use the order controls when the final visual position feels unexpected.
      </p>

      <h2>Hover effects and transitions</h2>
      <p>
        Transforms work especially well with <code>transition</code> because the browser can animate them smoothly. Keep hover effects subtle for production UI: small movement, light scale, and clear focus states usually feel best.
      </p>

      <h2>Reduced motion best practices</h2>
      <p>
        Large movement, zooming, or 3D rotation can be uncomfortable for some users. Include a <code>prefers-reduced-motion</code> fallback for entrance animations or strong hover effects.
      </p>

      <h2>Transform vs layout positioning</h2>
      <p>
        Transforms affect the visual rendering of an element, but they do not move nearby layout boxes. Use layout tools such as grid, flexbox, margins, or positioning when surrounding content needs to move too.
      </p>

      <h2>Privacy note</h2>
      <p>
        This generator runs in your browser. The transform values you create are not sent to a server.
      </p>

      <h2>FAQ</h2>
      <h3>Should I use transform for layout?</h3>
      <p>Use transform for visual effects and interaction states. Use CSS Grid, Flexbox, or normal layout properties for page structure.</p>
      <h3>Why does perspective look extreme?</h3>
      <p>Very low perspective values create dramatic distortion. Increase perspective for a more subtle 3D effect.</p>
      <h3>Can I use Tailwind with arbitrary transforms?</h3>
      <p>Yes, but complex transform strings often need arbitrary value classes. The Tailwind tab gives you a practical starter rather than a perfect conversion.</p>
    </div>
  );
}
