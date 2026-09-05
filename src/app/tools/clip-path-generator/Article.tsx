export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What is a CSS clip-path polygon?</h2>
      <p>
        The CSS <code>clip-path</code> property hides everything outside a shape you define. The{" "}
        <code>polygon()</code> function draws that shape from a list of points, each written as an{" "}
        <code>x% y%</code> pair measured from the top-left corner of the element. Because the coordinates are
        percentages, the same shape scales with the element on any screen size.
      </p>

      <h2>How to use this generator</h2>
      <p>
        Pick a preset or drag the vertices on the canvas to design your shape. Click any edge to insert a new
        point, select a point and nudge it with the arrow keys for precise control, and copy the generated CSS
        when you are happy with the result. Preview the clip on a solid block, one of the built-in sample
        backgrounds, an image you upload or drag in from your device, or any image you paste in by URL.
      </p>

      <h2>Does clip-path crop my image?</h2>
      <p>
        No. <code>clip-path</code> only hides pixels visually — the underlying image file keeps its original
        dimensions and data. If you need a smaller file, use an image cropper or the Image Converter instead.
        This tool is for producing the CSS shape, not for exporting a cut-out file.
      </p>

      <h2>Ready-made shapes and practical use cases</h2>
      <p>
        The preset library is intentionally broader than a list of regular polygons. Alongside triangles, diamonds, pentagons, hexagons,
        and stars, you can start from hero diagonals, slanted image frames, arrows, bookmarks, price tags, shields, tickets, speech bubbles,
        cut-corner cards, and other UI-oriented shapes. Pick the closest visual intent and then move individual points.
      </p>

      <h2>Good places to use clip-path</h2>
      <p>
        Clip-path works well for marketing hero media, decorative section edges, avatar or product-image masks, badges, labels, directional
        callouts, coupon shapes, and editorial image treatments. Avoid using a complex clipped shape when a normal border radius would communicate
        the same thing more clearly.
      </p>

      <h2>Browser support and the -webkit- fallback</h2>
      <p>
        Modern browsers support <code>clip-path: polygon()</code>. Older Safari versions need the{" "}
        <code>-webkit-clip-path</code> prefix, so this tool can emit both. Keep the fallback on if you support
        legacy Safari, and turn it off for a cleaner rule when you do not.
      </p>

      <h2>Convex vs concave shapes</h2>
      <p>
        Convex polygons (like regular hexagons) clip predictably. Concave shapes such as stars, arrows, and
        crosses are fully supported by <code>clip-path</code>, but avoid self-intersecting point orders, which
        can render in surprising ways.
      </p>

      <h2>Clip-path vs SVG paths</h2>
      <p>
        Use <code>clip-path: polygon()</code> for straight-edged shapes driven by CSS. When you need curves,
        complex silhouettes, or reusable vector artwork, reach for the SVG Path Editor instead.
      </p>

      <h2>Privacy</h2>
      <p>
        Everything runs in your browser. Images you load are decoded locally and never uploaded, and exported
        JSON shape files contain only the polygon coordinates and class name — never the image itself.
      </p>
    </article>
  );
}
