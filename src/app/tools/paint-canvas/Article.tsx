export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>A simple browser drawing canvas</h2>
      <p>
        Sketch freehand or draw straight lines, rectangles, circles, and triangles on an HTML canvas. Pick a
        color and brush size, toggle fill for shapes, and erase mistakes. Everything happens in your browser.
      </p>

      <h2>Tools</h2>
      <p>
        The brush and eraser draw freehand as you move the pointer. The line, rectangle, circle, and triangle
        tools draw between where you press and where you release, with a live preview while you drag. Enable
        <strong> Fill</strong> to draw solid shapes instead of outlines.
      </p>

      <h2>Touch and pen support</h2>
      <p>
        The canvas uses pointer events, so it works with a mouse, a touchscreen, or a stylus. Undo and redo let
        you step back and forth through recent changes.
      </p>

      <h2>Exporting your drawing</h2>
      <p>
        Download your artwork as a PNG (lossless) or JPEG (smaller). The canvas has a white background, so JPEG
        exports look the same as the on-screen drawing.
      </p>

      <h2>Privacy</h2>
      <p>Your drawing never leaves your device — there is no upload and no account.</p>
    </article>
  );
}
