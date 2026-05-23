export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <p>
        A sitemap is a machine-readable XML file that lists the important URLs on a website. Search engines can use it to discover pages and understand optional metadata about when pages changed and how frequently they may update.
      </p>

      <h3>Required and optional fields</h3>
      <p>
        Each sitemap URL entry needs a <code>&lt;loc&gt;</code> value. Optional fields include <code>&lt;lastmod&gt;</code> for the last modified date, <code>&lt;changefreq&gt;</code> for a crawl hint, and <code>&lt;priority&gt;</code> for a relative importance hint from <code>0.0</code> to <code>1.0</code>.
      </p>

      <h3>Uploading sitemap.xml</h3>
      <p>
        Save the generated output as <code>sitemap.xml</code> and upload it to the site root, for example <code>https://example.com/sitemap.xml</code>. You can also reference it from your <code>robots.txt</code> file with a <code>Sitemap:</code> directive.
      </p>

      <h3>XML escaping and privacy</h3>
      <p>
        Sitemap XML values must be escaped and the file should be UTF-8 encoded. This generator escapes URL values before export and runs entirely in your browser; it does not crawl your website, fetch remote pages, or submit anything to search engines.
      </p>
    </article>
  );
}
