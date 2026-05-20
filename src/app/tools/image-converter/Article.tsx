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
    </article>
  );
}
