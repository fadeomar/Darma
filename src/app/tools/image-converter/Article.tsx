export default function ImageConverterArticle() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>About the Image Converter</h2>
      <p>
        Darma Image Converter uses the browser canvas API to convert common web
        images without uploading the original file to a server. It is useful for
        quick format changes, lightweight compression, and resizing assets before
        adding them to a website or design file.
      </p>
      <h3>Supported output formats</h3>
      <p>
        Export to PNG for lossless UI assets, JPEG for photos with smaller file
        sizes, or WebP for modern web delivery. JPEG and WebP include a quality
        slider, while PNG keeps lossless output.
      </p>
      <h3>Privacy note</h3>
      <p>
        Conversion runs locally in the browser. The selected image is read with a
        temporary object URL, drawn to canvas, and exported as a downloadable
        image blob.
      </p>
      <h3>Start with the destination, not the codec</h3>
      <p>
        The preset library is organized around common destinations such as a YouTube thumbnail,
        product catalog image, Open Graph card, documentation screenshot, email banner, mobile card,
        or transparent UI asset. Pick the closest destination first, then adjust dimensions, fit mode,
        format, and quality only when the publishing surface has a stricter requirement.
      </p>
      <h3>Cover, contain, and stretch</h3>
      <p>
        Cover fills exact dimensions and can crop the source, contain keeps the whole image and may
        leave unused space when both dimensions are fixed, while stretch forces the requested width
        and height and can distort the image. For prepared social artwork, cover is usually the most
        useful starting point. For product imagery, screenshots, and UI assets, contain is safer.
      </p>
      <h3>Choose dimensions before lowering quality aggressively</h3>
      <p>
        Large dimensions often have a bigger impact on file size than a small quality adjustment.
        For web delivery, first choose an appropriate pixel width for the actual placement, then tune
        JPEG or WebP quality. Keep PNG for transparency, screenshots, and graphics that require
        lossless output rather than using it as the default format for photographs.
      </p>
    </article>
  );
}
