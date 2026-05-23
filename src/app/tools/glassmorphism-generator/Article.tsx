export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What is glassmorphism?</h2>
      <p>
        Glassmorphism is a UI style that combines translucent layers, backdrop blur, soft borders, shadows, and rich backgrounds to create a frosted-glass effect. It works best when the glass panel sits over visible color, imagery, or motion.
      </p>

      <h2>How backdrop-filter creates frosted glass</h2>
      <p>
        The key CSS property is <code>backdrop-filter</code>. It applies visual effects to the pixels behind an element, so the element itself needs a transparent or semi-transparent background. A fully opaque background will hide the blur.
      </p>

      <h2>Why transparency is required</h2>
      <p>
        A typical glass card uses <code>background: rgb(255 255 255 / 0.16)</code>, a subtle border, and <code>backdrop-filter: blur(...)</code>. The alpha value controls how much of the background remains visible through the panel.
      </p>

      <h2>Choosing blur, opacity, border, and shadow</h2>
      <p>
        Use stronger opacity for readability and stronger blur for a softer frosted look. Borders help define the glass edge, while shadows add depth. Very high blur values can be expensive on complex backgrounds, so test them on real devices.
      </p>

      <h2>Text contrast and readability</h2>
      <p>
        Glass UI can fail when text sits over a bright or busy area. Increase the tint opacity, use a stronger text color, add a darker overlay, or reduce background complexity when content is important.
      </p>

      <h2>Browser fallback and -webkit-backdrop-filter</h2>
      <p>
        Include <code>-webkit-backdrop-filter</code> for better Safari compatibility and provide a solid fallback background for environments where blur is unsupported or disabled.
      </p>

      <h2>Performance tips</h2>
      <p>
        Avoid stacking many large blurred layers on one page. Animated scenes behind large glass surfaces can look great, but they should be tested on low-power devices and paired with reduced-motion fallbacks.
      </p>

      <h2>Privacy note</h2>
      <p>
        This tool runs in your browser. It generates CSS, HTML, and React snippets locally and does not need a server route.
      </p>

      <h2>FAQ</h2>
      <h3>Why does my glass effect not show?</h3>
      <p>The element probably has an opaque background or there is not enough visual detail behind it. Use a partially transparent background and place it over a visible scene.</p>
      <h3>Should I always use glassmorphism?</h3>
      <p>No. Use it when it supports the visual design. For dense dashboards or long text, simple solid panels may be more readable.</p>
      <h3>Can Tailwind do this?</h3>
      <p>Yes, Tailwind has backdrop utilities. Complex fallback, noise, and exact color opacity values may still be easier to manage with custom CSS.</p>
    </article>
  );
}
