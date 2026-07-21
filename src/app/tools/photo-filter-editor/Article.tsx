export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What this photo editor does</h2>
      <p>
        This tool applies CSS <code>filter</code> adjustments — brightness, contrast, saturation, grayscale,
        sepia, hue rotation, invert, blur, and opacity — to an image entirely in your browser. You can preview
        the result live, rotate or flip the image, and export a real, filtered image file.
      </p>

      <h2>CSS filters vs a baked export</h2>
      <p>
        In the preview, filters are applied with live CSS, which never changes the underlying pixels. When you
        click <strong>Download image</strong>, the tool re-draws your photo onto an HTML canvas with the same
        filters and orientation applied, so the exported PNG, JPEG, or WebP contains the adjustments baked in.
      </p>

      <h2>Choosing an export format</h2>
      <p>
        PNG and WebP keep transparency and are lossless or near-lossless. JPEG produces smaller files but has no
        transparency, so reduced opacity is flattened onto a white background. WebP usually gives the best size
        for the quality on modern browsers.
      </p>

      <h2>Presets and fine-tuning</h2>
      <p>
        Start from a preset such as Grayscale, Sepia, Vintage, or Noir, then fine-tune individual sliders. Any
        manual change switches the preset selector to “Custom” so you always know whether you are on a preset or
        your own settings.
      </p>

      <h2>Privacy</h2>
      <p>
        Your image is decoded with a local object URL and processed on a canvas in your browser. Nothing is
        uploaded to a server, and the object URL is released when you replace or remove the image.
      </p>
    </article>
  );
}
