export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>Draw and annotate without uploading your files</h2>
      <p>
        Paint &amp; Annotate is a browser-only drawing and screenshot markup workspace. Add an image from your device,
        drag one into the workspace, or paste a screenshot from the clipboard. The source image and every edit stay on
        your device.
      </p>

      <h2>Editable drawing objects</h2>
      <p>
        Brush strokes, highlights, lines, arrows, rectangles, circles, triangles, text, imported images, and privacy
        regions remain editable canvas objects. Switch to <strong>Select</strong> to move, resize, rotate, duplicate,
        delete, filter, or change stacking order instead of flattening every action into one bitmap.
      </p>

      <h2>Screenshot privacy tools</h2>
      <p>
        Drag a <strong>Blur region</strong> or <strong>Pixelate</strong> region over any visible part of the canvas to
        hide an email address, account number, name, API value, or other sensitive detail before sharing. You can also
        blur or pixelate an imported image directly from the selection panel. These effects are applied locally in the
        browser.
      </p>

      <h2>Highlight and explain visual details</h2>
      <p>
        Use the semi-transparent highlighter, arrows, text, and shapes to call out a UI bug, explain a workflow, review a
        design, or prepare a support image. Undo and redo preserve recent document states while keyboard shortcuts speed
        up repetitive edits.
      </p>

      <h2>Local autosave and editable project files</h2>
      <p>
        Darma keeps the current workspace in this browser with local IndexedDB autosave, so a refresh can recover the
        last drawing without creating an account. Use <strong>Save project</strong> to download an editable Darma JSON
        file and <strong>Open project</strong> to continue it later on the same or another device.
      </p>

      <h2>Object list and canvas presets</h2>
      <p>
        The Objects panel lets you rename, hide, lock, select, and reorder drawing elements without flattening them.
        Start from common HD, square, portrait, story, or presentation sizes, or apply a custom artboard size up to
        4096 pixels per side.
      </p>


      <h2>Multi-select, groups, and precise layout</h2>
      <p>
        Select several editable objects directly on the canvas or build a selection from the Objects panel, which is
        especially useful on touch devices. Group related annotations so they move and transform as one unit, then
        ungroup them whenever you need to edit the individual parts again. Alignment and distribution controls help
        clean up callouts, labels, and repeated shapes without manually eyeballing every position.
      </p>

      <h2>Smoother brushes and stylus pressure</h2>
      <p>
        Choose Pen, Fineliner, Marker, or Brush depending on the kind of stroke you need. A stabilizer can reduce hand
        jitter while dynamic width uses real pressure from a compatible pen or stylus when the browser exposes it. Mouse
        and touch input use movement-based pressure so expressive strokes still feel natural without special hardware.
      </p>

      <h2>Touch-friendly transforms and keyboard nudging</h2>
      <p>
        Selection handles use larger touch targets, rotation snaps near 15-degree increments, and selected objects can be
        nudged one pixel at a time with the arrow keys or ten pixels with Shift plus an arrow key. Flip controls work on
        a single object or a group so multi-object transformations stay predictable.
      </p>

      <h2>Zoom, transparent backgrounds, and export</h2>
      <p>
        Fit the canvas into the workspace or zoom between close-up editing and a full-page view. Choose a solid canvas
        color or a transparent background, then download PNG, JPEG, or WebP. JPEG exports use a solid background because
        the format does not preserve transparency.
      </p>

      <h2>Mouse, touch, and pen input</h2>
      <p>
        The editor uses pointer-aware canvas interactions, so drawing and object controls work with a mouse, touchscreen,
        or compatible stylus. Freehand strokes remain part of the editable document when you switch back to Select.
      </p>

      <h2>Privacy</h2>
      <p>
        There is no account, cloud project, or server upload in the editing flow. Image import, annotation, privacy
        effects, and export all happen locally in your browser.
      </p>
    </article>
  );
}
