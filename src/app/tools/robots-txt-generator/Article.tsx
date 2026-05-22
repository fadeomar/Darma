export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <p>
        A <strong>robots.txt</strong> file is a plain text file that gives web crawlers instructions about which parts of a site they may crawl. It normally lives at the root of a site, such as <code>https://example.com/robots.txt</code>, and uses directives like <code>User-agent</code>, <code>Allow</code>, <code>Disallow</code>, and <code>Sitemap</code>.
      </p>

      <h3>What robots.txt does</h3>
      <p>
        Robots rules help well-behaved crawlers understand your crawl preferences. A common file starts with <code>User-agent: *</code> to target all crawlers, then adds one or more <code>Disallow</code> or <code>Allow</code> rules. You can also add a <code>Sitemap</code> directive so search engines can discover your sitemap XML file.
      </p>

      <h3>Allow vs Disallow</h3>
      <p>
        <code>Disallow: /admin/</code> tells matching crawlers not to crawl the <code>/admin/</code> path. <code>Allow</code> can be used to permit a narrower path inside a broader blocked area. For example, some sites disallow a whole folder but allow a specific public file inside it.
      </p>

      <h3>Where to upload it</h3>
      <p>
        The file should be named exactly <code>robots.txt</code> and uploaded to the root of the exact host it controls. Rules for <code>https://example.com/robots.txt</code> do not automatically control <code>https://blog.example.com/</code> or a different protocol or port.
      </p>

      <h3>Important security warning</h3>
      <p>
        Robots.txt is not a security mechanism. It can reduce crawling by compliant bots, but it does not block access to private URLs. Sensitive admin pages, user data, staging areas, and API endpoints should be protected with authentication and server-side authorization.
      </p>

      <h3>Browser-only privacy</h3>
      <p>
        This generator runs locally in your browser. It does not fetch your site, validate remote URLs, or send your rules to a server.
      </p>
    </article>
  );
}
