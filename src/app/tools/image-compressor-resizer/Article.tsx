export default function ImageCompressorArticle() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>Compress one image or many images at once</h2>
      <p>
        Upload a single image for a detailed before/after comparison, or add up to 20 images at
        once for batch processing. All compression, resizing, and conversion happens in your
        browser — nothing is sent to a server. Your files stay private and the results download
        instantly.
      </p>

      <h3>Resize multiple images at once</h3>
      <p>
        Set a target width, height, or both, then click "Optimize all images" to apply the same
        resize settings to every image in the queue. Each image is processed independently, so
        aspect ratio and "do not enlarge" rules apply per image. This makes it easy to resize a
        whole batch of photos to the same maximum width — for example, 1200 px wide — without
        stretching or upscaling any of them.
      </p>

      <h3>Download optimized images as ZIP</h3>
      <p>
        After processing, click "Download all as ZIP" to get every successfully optimized image
        in a single file. The ZIP is assembled in your browser — no server upload is required.
        If one image fails to process, the others are still included. You can also download
        images individually using the download button next to each file in the batch queue.
      </p>

      <h3>Rename output files</h3>
      <p>
        Use the "Output filename" section to control how downloaded files are named. The default
        adds an "-optimized" suffix so the original file is never overwritten. You can keep the
        original name, use the "-optimized" suffix, or enter a custom suffix. Invalid filename
        characters are removed automatically.
      </p>

      <h3>Compress images to a target file size</h3>
      <p>
        Enable "Compress to target size" and enter a limit in KB — for example, 500 KB. The tool
        automatically reduces quality in steps until the output is under your target. This works
        for both single images and batch processing. If the target cannot be reached (most likely
        with PNG, which is lossless), you will see a note suggesting smaller dimensions or WebP.
      </p>

      <h3>Resize images for YouTube, documents, and profile pictures</h3>
      <p>
        The quick preset buttons apply common settings in one click. "YouTube thumbnail" sets
        1280 × 720 in JPEG. "Instagram square" sets 1080 × 1080. "Document upload" enables
        target size mode at 500 KB. "Profile picture" outputs a 512 × 512 WebP. Click the preset,
        then click compress or "Optimize all images" to apply. Cropping is not included — these
        presets resize to the target dimensions.
      </p>

      <h3>Paste images from clipboard</h3>
      <p>
        Press Ctrl+V on Windows or ⌘V on Mac to paste an image from your clipboard. This works
        with screenshots, images copied from a browser, and content from design tools. In single
        mode, the pasted image replaces the current one. In batch mode, it is added to the queue.
      </p>

      <h3>Best settings for JPG, PNG, and WebP</h3>
      <p>
        WebP gives the smallest file for most photos and web images. Use it as the default output
        for websites and social media. JPEG is close in size and has wider support in older
        software — good for email attachments and form uploads. PNG is lossless and suits icons,
        UI screenshots, and graphics with flat colors or transparency. Note that JPEG does not
        support transparency: if your source has a transparent background and you export as JPEG,
        those areas become solid white.
      </p>

      <h3>How to reduce images for upload forms</h3>
      <p>
        Many forms have a strict file size limit of 500 KB, 1 MB, or 2 MB. Use the "Document
        upload" quick preset to automatically compress to 500 KB in WebP. For a different limit,
        enable "Compress to target size" in the settings, enter your limit in KB, and choose JPEG
        or WebP. If the target cannot be reached, reduce the image dimensions first.
      </p>

      <h3>Privacy — images stay in your browser</h3>
      <p>
        Every step happens on your device. The tool reads your files using the browser File API,
        draws them on an HTML Canvas, exports the result, and lets you download it — all without
        any network request. Canvas export also strips most EXIF metadata (GPS location, camera
        model, etc.) from JPEG and WebP outputs, which reduces file sizes as a side effect.
      </p>

      <h2>Frequently asked questions</h2>

      <h3>Can I compress multiple images at once?</h3>
      <p>
        Yes. You can upload up to 20 JPG, PNG, or WebP images at once by clicking "Choose
        images" or dragging a selection into the upload area. The batch queue shows every image
        with its status, original size, and compression result. Click "Optimize all images" to
        process them all with your current settings.
      </p>

      <h3>Can I download all optimized images as a ZIP?</h3>
      <p>
        Yes. Once at least one image is processed, the "Download all as ZIP" button becomes
        active. The ZIP is created in your browser and contains all successfully compressed
        images with the correct file extension. Failed images are not included. The default ZIP
        filename is "darma-optimized-images.zip."
      </p>

      <h3>Are my images uploaded to a server?</h3>
      <p>
        No. All processing happens in your browser using the Canvas API. Nothing is sent to any
        server, and no account is required. The tool works entirely offline once the page is
        loaded.
      </p>

      <h3>What is the best format for smaller images?</h3>
      <p>
        WebP is the best choice for most images — it produces smaller files than JPEG at the
        same visual quality and is supported in all modern browsers. For photos that need to open
        in older software, use JPEG. For images with transparency or flat graphic colors (logos,
        icons), use PNG.
      </p>

      <h3>Why are PNG files sometimes larger than JPEG or WebP?</h3>
      <p>
        PNG is lossless — it stores every pixel exactly without discarding any information. This
        produces large files for photos with many colors. JPEG and WebP are lossy and discard
        details the eye cannot easily see, which is why they are much smaller for photographs.
        Use PNG only when you need exact pixel output, such as for transparent icons or
        screenshots.
      </p>

      <h3>Can I make images smaller for online forms?</h3>
      <p>
        Yes. Enable "Compress to target size" and enter the form's file size limit in KB. The
        tool automatically reduces quality until the file fits. For forms that require JPEG
        specifically, set the output format to JPEG. If the limit is very low (under 100 KB),
        also reduce the image dimensions using the resize fields.
      </p>

      <h3>How do I make an image under 500 KB?</h3>
      <p>
        Enable "Compress to target size", enter 500 in the KB field, and choose JPEG or WebP as
        the output format. Click "Compress image" (or "Optimize all images" for a batch) and the
        tool reduces quality automatically until the file is under 500 KB.
      </p>

      <h3>Can I paste an image from my clipboard?</h3>
      <p>
        Yes. Press Ctrl+V (Windows) or ⌘V (Mac) while on this page to load a clipboard image.
        Works with screenshots, images copied from a browser, and content from Figma or Canva.
      </p>

      <h3>Why did some images not reach the target size?</h3>
      <p>
        Every image has a quality floor — compressing below roughly 25% quality produces
        artifacts without meaningful size savings. If the target size cannot be reached, try
        switching to WebP, reducing the image dimensions, or raising the target KB limit.
      </p>

      <h3>Does this tool add a watermark?</h3>
      <p>
        No. Output images have no watermarks, branding, or metadata added by this tool.
      </p>

      <h3>Does this tool crop images?</h3>
      <p>
        Not in this version. The tool compresses, resizes, and converts images. When a preset
        like "Instagram square" sets 1080 × 1080 with "Keep aspect ratio" off, it resizes to
        those dimensions without cropping. Cropping will be added in a later update.
      </p>
    </article>
  );
}
