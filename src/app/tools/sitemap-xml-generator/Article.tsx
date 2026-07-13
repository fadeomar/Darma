export default function Article() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <p>
        An XML sitemap lists canonical, indexable URLs that you want search engines to discover. This studio accepts plain URL lists or CSV rows, lets you edit metadata per URL, validates production constraints, and can split large sets into multiple sitemap files with an index.
      </p>
      <h3>Input formats</h3>
      <p>
        Paste one absolute HTTP(S) URL per line, or use CSV columns in the order <code>loc,lastmod,changefreq,priority</code>. The URL is required. The other fields are optional and can inherit the defaults configured in the controls.
      </p>
      <h3>Protocol limits and host consistency</h3>
      <p>
        A standard sitemap file supports up to 50,000 URLs and 50 MB uncompressed. URLs in one sitemap should normally belong to the same host. The production checks highlight invalid dates, priorities, mixed hosts, duplicate URLs, oversized values, and output splitting requirements.
      </p>
      <h3>Publishing the generated files</h3>
      <p>
        Upload <code>sitemap.xml</code>, or the generated sitemap files and <code>sitemap-index.xml</code>, to publicly accessible URLs. Reference the sitemap or index from <code>robots.txt</code>, then submit it through the relevant search-engine webmaster tools.
      </p>
      <h3>Metadata is a hint, not a command</h3>
      <p>
        Use <code>lastmod</code> only when it reflects a meaningful page change. Search engines may ignore <code>changefreq</code> and <code>priority</code>, so accurate canonical URLs and useful content remain more important than aggressive values.
      </p>
    </article>
  );
}
