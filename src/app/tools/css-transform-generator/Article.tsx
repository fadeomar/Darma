export default function Article() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What CSS transform does</h2>
      <p>
        CSS transforms visually move, rotate, scale, skew, and project elements without changing the surrounding document flow. They are ideal for hover states, entrance motion, card tilt effects, image zooms, and small interaction feedback.
      </p>

      <h2>Production transform workflow</h2>
      <p>
        Start with a small base transform, test the hover or active state, then check motion safety. The generator now shows summary cards, production checks, and export tabs so you can see whether the effect is ready for UI use before copying code.
      </p>

      <h2>2D transforms: translate, rotate, scale, and skew</h2>
      <p>
        The common transform functions are <code>translate()</code>, <code>rotate()</code>, <code>scale()</code>, and <code>skew()</code>. For interface components, subtle values usually feel more professional than dramatic movement. Keep card lifts, button presses, and image zooms controlled.
      </p>

      <h2>Transform order matters</h2>
      <p>
        Transform functions are order-sensitive. Rotating and then translating can produce a different result than translating and then rotating. Use the order chips to reorder transform functions when the visual position feels unexpected.
      </p>

      <h2>3D transforms and perspective</h2>
      <p>
        3D transforms such as <code>rotateX()</code>, <code>rotateY()</code>, and <code>translateZ()</code> need perspective to show depth. Lower perspective values create stronger distortion, while higher values create flatter, safer depth.
      </p>

      <h2>Understanding transform-origin</h2>
      <p>
        <code>transform-origin</code> controls the point around which rotation and scaling happen. A top-left origin makes an element rotate from that corner, while center center rotates around the middle. Use a custom origin for menus, badges, drawers, and hinge-like effects.
      </p>

      <h2>Hover effects, transitions, and reduced motion</h2>
      <p>
        Transforms animate smoothly because browsers can handle them efficiently. Strong movement, zooming, or 3D rotation can still be uncomfortable for some users, so production exports should include a <code>prefers-reduced-motion</code> fallback.
      </p>

      <h2>Transform vs layout positioning</h2>
      <p>
        Transforms affect visual rendering only. They do not move nearby layout boxes. Use CSS Grid, Flexbox, margins, or positioning when surrounding content needs to move too.
      </p>

      <h2>Export options</h2>
      <p>
        The generator can export regular CSS, CSS variables, HTML, React JSX, a React style object, Tailwind starter classes, token JSON, and keyframes. This makes the same transform easier to move into design systems or production components.
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
