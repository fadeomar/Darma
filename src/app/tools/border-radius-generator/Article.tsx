export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What does border-radius do?</h2>
      <p>
        CSS <code>border-radius</code> rounds the outer border edge of an element. It is commonly used for cards, buttons, inputs, avatars, app icons, media masks, and decorative shapes.
      </p>

      <h2>Simple rounded corners</h2>
      <p>
        A single value rounds all corners equally, while four values target the corners in clockwise order: top-left, top-right, bottom-right, and bottom-left. This is the best mode for practical UI work.
      </p>

      <h2>Elliptical border-radius syntax</h2>
      <p>
        Advanced border radius can use a slash. Values before the slash control horizontal radii, and values after the slash control vertical radii. This makes it possible to create asymmetric and organic-looking shapes with pure CSS.
      </p>

      <h2>How CSS blob shapes work</h2>
      <p>
        CSS blobs are usually made with percentage-based elliptical radii, such as <code>30% 70% 70% 30% / 30% 30% 70% 70%</code>. The element size affects the final look, so a blob can feel different as a square, tall rectangle, or wide hero decoration.
      </p>

      <h2>Using border-radius for images and avatars</h2>
      <p>
        Border radius is a lightweight way to mask images into circles, soft cards, rounded product images, or organic profile shapes. Use meaningful alt text for real images, and reserve empty alt text only for decorative images.
      </p>

      <h2>Animated blob shapes</h2>
      <p>
        Animated blobs morph between multiple border-radius states with CSS keyframes. Keep animations slow and subtle, and include a <code>prefers-reduced-motion</code> rule so users who prefer less motion are respected.
      </p>

      <h2>Border-radius vs SVG shapes</h2>
      <p>
        Border radius is fast, CSS-only, and perfect for many UI shapes. Use SVG when you need precise paths, complex silhouettes, custom waves, or shape details that border-radius cannot express.
      </p>

      <h2>Privacy note</h2>
      <p>
        This generator runs in your browser. It does not upload your shape settings, image URL, or generated CSS to a server.
      </p>

      <h2>FAQ</h2>
      <h3>Can I use these values in Tailwind?</h3>
      <p>
        Yes. The Tailwind-style output uses arbitrary values, but complex slash syntax may need escaping or formatting depending on your Tailwind setup.
      </p>
      <h3>Why does my percentage radius look different on another element?</h3>
      <p>
        Percentage radii are based on the element dimensions. A 50% radius on a square creates a circle, while the same percentage on a rectangle creates an oval-like curve.
      </p>
    </article>
  );
}
