export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>Free photo editing without an account</h2>
      <p>
        Darma&apos;s Photo Filter Editor is designed for quick, practical photo work: visual presets, exposure and
        color adjustments, selective HSL, tone curves, standard 3D <code>.cube</code> LUTs, crop ratios,
        before-and-after comparison, local background removal, Spot Heal cleanup, batch processing, and high-quality
        PNG, JPEG, or WebP export. There is no signup, paid export tier, per-image credit system, or Darma watermark.
      </p>

      <h2>Your image stays on your device</h2>
      <p>
        The editor decodes your image with a local object URL and renders previews and exports with browser canvas
        APIs. The image is not uploaded to Darma. Replacing or removing the image releases the local object URL,
        and canvas export naturally creates a new file without carrying over the original embedded metadata.
      </p>

      <h2>Local background removal and Spot Heal</h2>
      <p>
        Background removal uses the MIT-licensed BiRefNet Lite model through Transformers.js. The model downloads
        only when you explicitly run the feature; the photo itself stays in your browser. WebGPU-capable browsers
        can use the smaller FP16 model path, while a CPU/WASM fallback is available when WebGPU cannot run it.
        Spot Heal is a lighter deterministic cleanup brush for dust, blemishes, scratches, and small distractions.
        It samples nearby pixels locally rather than pretending to be cloud generative fill.
      </p>

      <h2>Presets plus full manual control</h2>
      <p>
        Start with a visual preset from categories such as portrait, film, cinematic, vintage, black and white,
        warm, cool, and creative. Every preset has an intensity control, and you can continue with exposure,
        highlights, shadows, whites, blacks, saturation, vibrance, temperature, tint, hue, fade, vignette, grain,
        blur, grayscale, sepia, invert, and opacity.
      </p>

      <h2>Choose a preset by what the image is for</h2>
      <p>
        The preset library includes purpose-driven starting points for portraits, product photos, food, landscapes, low-light images, web
        screenshots, editorial images, golden-hour scenes, cinematic looks, matte finishes, soft focus, black and white, and vintage
        treatments. Similar presets are kept when they solve different user intents, because choosing &ldquo;Product Clean&rdquo; is easier
        than guessing which three sliders create a clean marketplace image.
      </p>

      <h2>Fast adjustment recipes</h2>
      <p>
        For product imagery, start with brightness and moderate contrast. For food and landscapes, saturation can help but should be checked
        against skin tones and brand colors. For low-light photos, raise brightness before increasing contrast. For a softer editorial look,
        reduce contrast and saturation slightly instead of relying on blur alone.
      </p>


      <h2>Advanced controls without a Pro paywall</h2>
      <p>
        Use selective HSL for individual color ranges, RGB and per-channel tone curves, import a standard 3D
        <code>.cube</code> LUT, combine multiple filter looks in a non-destructive stack, and add local creative
        overlays such as light leaks or film dust. These controls run in the same browser rendering pipeline used
        by the preview and final export.
      </p>

      <h2>Save, share, and batch the same look</h2>
      <p>
        Save custom looks in your browser or export a small Darma preset JSON file to share them without an
        account. The Batch editor applies the current crop, filters, HSL, curves, LUT, overlays, and export
        settings to multiple images sequentially and packages the results into one ZIP download. You can also
        opt into per-image local background removal for the batch: the segmentation model runs separately for
        each image, without cloud credits or a paid batch limit.
      </p>

      <h2>Crop, compare, undo, and export</h2>
      <p>
        Common crop ratios include square, classic photo, widescreen, and vertical story formats, with horizontal
        and vertical positioning plus a free crop mode. Use undo and redo while experimenting, switch between the
        original and edited image, or use the split comparison view before exporting. Hold the Original control
        (or the O key while the editor is focused) for a quick temporary comparison; Ctrl/Cmd+Z, redo shortcuts,
        and keyboard zoom controls make repeated desktop editing faster.
      </p>

      <h2>Choosing PNG, JPEG, or WebP</h2>
      <p>
        PNG is best when you need lossless output or transparency. JPEG is useful for photographs and lets you
        trade file size for quality. WebP often produces a smaller file while retaining strong image quality and
        transparency support. Darma lets you keep the crop&apos;s original resolution or choose custom output
        dimensions. Very large outputs show a working-memory warning before export so you can make an informed
        choice instead of discovering a browser canvas limit after a long edit.
      </p>

      <h2>CSS-compatible filters for developers</h2>
      <p>
        Brightness, contrast, saturation, grayscale, sepia, hue rotation, invert, blur, and opacity can also be
        copied as a CSS <code>filter</code> declaration. Advanced tone and local canvas adjustments are baked into
        image exports because they cannot be represented accurately by CSS filters alone.
      </p>
    </article>
  );
}
