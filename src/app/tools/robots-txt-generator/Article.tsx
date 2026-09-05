export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <p>
        A <strong>robots.txt</strong> file publishes crawl preferences for automated clients. It belongs at the root of the exact origin it controls, for example <code>https://example.com/robots.txt</code>, and is normally built from <code>User-agent</code>, <code>Allow</code>, <code>Disallow</code>, and <code>Sitemap</code> fields.
      </p>

      <h3>How crawler groups work</h3>
      <p>
        One group can contain one or more <code>User-agent</code> product tokens followed by shared rules. A wildcard token (<code>*</code>) provides a general fallback, while a more specific crawler group can define a narrower policy. Keeping repeated agents in one auditable group reduces accidental conflicts.
      </p>

      <h3>Path matching and specificity</h3>
      <p>
        Allow and Disallow values are URL paths, not full URLs. Common crawler implementations select the most specific matching path; an Allow rule commonly wins when equally specific Allow and Disallow rules both match. Wildcards and an ending <code>$</code> can express more focused patterns, but critical behavior should still be verified with the target crawler and production logs.
      </p>

      <h3>Empty rules and block-all rules</h3>
      <p>
        An empty <code>Disallow:</code> value allows crawling because it matches no path. In contrast, <code>Disallow: /</code> blocks the entire site for the matching crawler group. Treat block-all policies as deployment-sensitive, especially when moving configuration from staging to production.
      </p>

      <h3>Sitemaps and file size</h3>
      <p>
        Sitemap directives should use complete HTTP or HTTPS URLs. More than one sitemap can be listed. Keep the file compact and review it before it approaches 500 KiB, because crawlers may ignore content beyond their processing limit.
      </p>

      <h3>Unsupported directives</h3>
      <p>
        Fields such as <code>crawl-delay</code>, <code>noindex</code>, and <code>nofollow</code> are not part of the core generated policy here and are not supported by Google&apos;s robots parser. Use search-engine-specific controls, page-level robots metadata, HTTP headers, or server configuration for those requirements.
      </p>

      <h3>Robots.txt is not security</h3>
      <p>
        The protocol is advisory and does not authorize access. A blocked path remains directly reachable unless your application protects it with authentication and server-side authorization. Avoid treating robots rules as a substitute for access control.
      </p>

      <h3>Next.js deployment</h3>
      <p>
        Next.js App Router projects can deploy a static <code>app/robots.txt</code> file or generate the policy from <code>app/robots.ts</code> using <code>MetadataRoute.Robots</code>. The generated starter in this tool mirrors the editable crawler groups and sitemap references.
      </p>

      <h3>Start from the deployment scenario</h3>
      <p>
        The presets now cover public sites, staging hosts, WordPress, commerce, documentation, SaaS applications, blogs, local businesses,
        search-heavy catalogs, media sites, multilingual sites, and API documentation. Pick the closest deployment shape, then review every
        generated path against your real routes before publishing. Presets intentionally use example domains and cannot know which private or
        duplicate paths exist in your application.
      </p>

      <h3>Review destructive presets before launch</h3>
      <p>
        Block-all preview and staging policies are useful while a host should stay out of discovery, but they are dangerous when copied to a
        production origin. Make robots.txt part of the release checklist so a staging rule cannot silently survive a domain or environment change.
      </p>

      <h3>Browser-only privacy</h3>
      <p>
        Generation, import parsing, route testing, and exports run locally in your browser. The tool does not fetch your website or submit rules to a remote validation service.
      </p>
    </article>
  );
}
