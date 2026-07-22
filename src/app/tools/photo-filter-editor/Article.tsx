export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>Fast local photo adjustments</h2>
      <p>
        The studio decodes and edits your image in the browser. You can adjust light, color, and effects, compare the original with the edited result, apply a non-destructive crop, rotate or flip the composition, and choose final export dimensions.
      </p>

      <h2>CSS-compatible and raster-only controls</h2>
      <p>
        Brightness, contrast, saturation, grayscale, sepia, hue, invert, blur, and opacity can be represented with standard CSS filters. Exposure, temperature, highlights, and shadows require pixel processing, so they are included in downloaded images but intentionally excluded from CSS output.
      </p>

      <h2>Preview and export consistency</h2>
      <p>
        The interactive preview and full-resolution export use the same rendering calculations for crop, rotation, flips, filters, and pixel adjustments. Export rendering uses the original decoded image when it is safe, while a smaller working preview may be created for smooth editing of large photos.
      </p>

      <h2>Crop, resize, and formats</h2>
      <p>
        Crop coordinates remain normalized instead of repeatedly rasterizing the source. PNG preserves transparency, JPEG fills transparent areas with your selected color, and WebP provides quality-controlled output where the browser supports it. Output dimensions are limited by a safe pixel budget, and upscaling is disabled by default.
      </p>

      <h2>Projects and privacy</h2>
      <p>
        Project JSON files and saved custom presets contain settings only. They never contain the uploaded image or a data URL. Replacing, removing, or resetting the image releases its temporary browser URL, and no server upload is used.
      </p>
    </article>
  );
}
