export default function Article() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <p>
        Meta tags describe a page to search engines, browsers, and social platforms. A standard SEO setup usually includes a
        <code>&lt;title&gt;</code>, a meta description, and a canonical URL. Open Graph and Twitter/X tags add the structured title,
        description, image, and URL that apps use when someone shares a link.
      </p>

      <h3>SEO tags vs Open Graph tags</h3>
      <p>
        SEO tags help shape how a page can appear in search results. Open Graph tags such as <code>og:title</code>,
        <code>og:description</code>, <code>og:image</code>, <code>og:url</code>, and <code>og:type</code> are designed for link preview cards in
        social networks, messaging apps, and collaboration tools. Twitter/X card tags provide a similar preview model for X cards.
      </p>

      <h3>Required Open Graph fields</h3>
      <p>
        A practical Open Graph block should include a title, description, URL, type, and image. The image is especially important
        because many platforms use it as the largest visual area of the preview card. Add descriptive image alt text when possible so
        the shared image has accessible context.
      </p>

      <h3>Using the generated tags</h3>
      <p>
        Copy the generated snippet into the <code>&lt;head&gt;</code> of your page or map the fields to your framework metadata API. After
        publishing, test real URLs with platform-specific preview tools because every platform may cache, crop, or truncate cards a
        little differently.
      </p>
    </div>
  );
}
