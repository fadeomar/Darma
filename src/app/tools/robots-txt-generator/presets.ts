import type { RobotsConfig, RobotsPreset } from "./types";

export const DEFAULT_ROBOTS_CONFIG: RobotsConfig = {
  siteUrl: "https://example.com",
  sitemapUrls: ["https://example.com/sitemap.xml"],
  groups: [
    {
      id: "group-default",
      userAgents: ["*"],
      rules: [{ id: "rule-allow-all", directive: "Disallow", path: "" }],
    },
  ],
};

export const ROBOTS_PRESETS: RobotsPreset[] = [
  {
    id: "public-site",
    label: "Public website",
    description: "Allow compliant crawlers and publish the primary sitemap.",
    config: DEFAULT_ROBOTS_CONFIG,
  },
  {
    id: "staging-block",
    label: "Staging: block all",
    description: "Block compliant crawlers while a staging or preview host is not ready for discovery.",
    destructive: true,
    config: {
      siteUrl: "https://staging.example.com",
      sitemapUrls: [],
      groups: [
        {
          id: "group-staging",
          userAgents: ["*"],
          rules: [{ id: "rule-staging-block", directive: "Disallow", path: "/" }],
        },
      ],
    },
  },
  {
    id: "wordpress",
    label: "WordPress starter",
    description: "Keep wp-admin out of crawl paths while allowing the AJAX endpoint.",
    config: {
      siteUrl: "https://example.com",
      sitemapUrls: ["https://example.com/wp-sitemap.xml"],
      groups: [
        {
          id: "group-wordpress",
          userAgents: ["*"],
          rules: [
            { id: "rule-wp-admin", directive: "Disallow", path: "/wp-admin/" },
            { id: "rule-wp-ajax", directive: "Allow", path: "/wp-admin/admin-ajax.php" },
          ],
        },
      ],
    },
  },
  {
    id: "ecommerce",
    label: "E-commerce filters",
    description: "Reduce common cart, account, search, and faceted-navigation crawl paths.",
    config: {
      siteUrl: "https://shop.example.com",
      sitemapUrls: ["https://shop.example.com/sitemap-index.xml"],
      groups: [
        {
          id: "group-commerce",
          userAgents: ["*"],
          rules: [
            { id: "rule-cart", directive: "Disallow", path: "/cart/" },
            { id: "rule-checkout", directive: "Disallow", path: "/checkout/" },
            { id: "rule-account", directive: "Disallow", path: "/account/" },
            { id: "rule-search", directive: "Disallow", path: "/search" },
            { id: "rule-sort", directive: "Disallow", path: "/*?*sort=" },
            { id: "rule-filter", directive: "Disallow", path: "/*?*filter=" },
          ],
        },
      ],
    },
  },
  {
    id: "documentation",
    label: "Documentation site",
    description: "Allow public docs while excluding internal previews and generated search endpoints.",
    config: {
      siteUrl: "https://docs.example.com",
      sitemapUrls: ["https://docs.example.com/sitemap.xml"],
      groups: [
        {
          id: "group-docs",
          userAgents: ["*"],
          rules: [
            { id: "rule-preview", directive: "Disallow", path: "/preview/" },
            { id: "rule-internal", directive: "Disallow", path: "/internal/" },
            { id: "rule-doc-search", directive: "Disallow", path: "/api/search" },
          ],
        },
      ],
    },
  },
  {
    id: "crawler-split",
    label: "Separate crawler policy",
    description: "Use one public policy plus a narrower image-crawler rule set.",
    config: {
      siteUrl: "https://example.com",
      sitemapUrls: ["https://example.com/sitemap.xml"],
      groups: [
        {
          id: "group-general",
          userAgents: ["*"],
          rules: [
            { id: "rule-general-admin", directive: "Disallow", path: "/admin/" },
            { id: "rule-general-preview", directive: "Disallow", path: "/preview/" },
          ],
        },
        {
          id: "group-images",
          userAgents: ["Googlebot-Image"],
          rules: [{ id: "rule-image-private", directive: "Disallow", path: "/private-media/" }],
        },
      ],
    },
  },
  {
    id: "saas-app",
    label: "SaaS marketing + app",
    description: "Keep public marketing pages crawlable while excluding signed-in application and internal API paths.",
    config: { siteUrl: "https://app.example.com", sitemapUrls: ["https://app.example.com/sitemap.xml"], groups: [{ id: "group-saas", userAgents: ["*"], rules: [{ id: "rule-saas-app", directive: "Disallow", path: "/app/" }, { id: "rule-saas-account", directive: "Disallow", path: "/account/" }, { id: "rule-saas-api", directive: "Disallow", path: "/api/" }, { id: "rule-saas-preview", directive: "Disallow", path: "/preview/" }] }] },
  },
  {
    id: "blog-cms",
    label: "Blog / CMS",
    description: "Allow articles and archives while excluding authoring, preview, and internal search paths.",
    config: { siteUrl: "https://blog.example.com", sitemapUrls: ["https://blog.example.com/sitemap.xml"], groups: [{ id: "group-blog", userAgents: ["*"], rules: [{ id: "rule-blog-admin", directive: "Disallow", path: "/admin/" }, { id: "rule-blog-preview", directive: "Disallow", path: "/preview/" }, { id: "rule-blog-search", directive: "Disallow", path: "/search" }] }] },
  },
  {
    id: "local-business",
    label: "Local business site",
    description: "Simple public crawl policy for service, location, menu, and contact pages.",
    config: { siteUrl: "https://local.example.com", sitemapUrls: ["https://local.example.com/sitemap.xml"], groups: [{ id: "group-local", userAgents: ["*"], rules: [{ id: "rule-local-admin", directive: "Disallow", path: "/admin/" }, { id: "rule-local-form", directive: "Disallow", path: "/form-success/" }] }] },
  },
  {
    id: "search-site",
    label: "Search-heavy site",
    description: "Reduce crawl expansion from internal search results, sorting, and repeated filter parameters.",
    config: { siteUrl: "https://catalog.example.com", sitemapUrls: ["https://catalog.example.com/sitemap-index.xml"], groups: [{ id: "group-search", userAgents: ["*"], rules: [{ id: "rule-search-page", directive: "Disallow", path: "/search" }, { id: "rule-search-query", directive: "Disallow", path: "/*?*q=" }, { id: "rule-search-sort", directive: "Disallow", path: "/*?*sort=" }, { id: "rule-search-page-param", directive: "Disallow", path: "/*?*page=" }] }] },
  },
  {
    id: "media-site",
    label: "Media / gallery site",
    description: "Keep public galleries available while excluding original private uploads and account areas.",
    config: { siteUrl: "https://media.example.com", sitemapUrls: ["https://media.example.com/sitemap.xml"], groups: [{ id: "group-media", userAgents: ["*"], rules: [{ id: "rule-media-account", directive: "Disallow", path: "/account/" }, { id: "rule-media-originals", directive: "Disallow", path: "/private-originals/" }] }, { id: "group-media-images", userAgents: ["Googlebot-Image"], rules: [{ id: "rule-image-private-assets", directive: "Disallow", path: "/private-originals/" }] }] },
  },
  {
    id: "multilingual",
    label: "Multilingual website",
    description: "Public language directories with shared exclusions for account and preview routes.",
    config: { siteUrl: "https://example.com", sitemapUrls: ["https://example.com/sitemap-index.xml"], groups: [{ id: "group-l10n", userAgents: ["*"], rules: [{ id: "rule-l10n-account", directive: "Disallow", path: "/account/" }, { id: "rule-l10n-preview", directive: "Disallow", path: "/preview/" }] }] },
  },
  {
    id: "api-docs",
    label: "API documentation",
    description: "Allow documentation pages while excluding interactive sandbox callbacks and internal endpoints.",
    config: { siteUrl: "https://docs.example.com", sitemapUrls: ["https://docs.example.com/sitemap.xml"], groups: [{ id: "group-api-docs", userAgents: ["*"], rules: [{ id: "rule-docs-internal", directive: "Disallow", path: "/internal/" }, { id: "rule-docs-sandbox", directive: "Disallow", path: "/sandbox/callback" }, { id: "rule-docs-api", directive: "Disallow", path: "/api/" }] }] },
  },
  {
    id: "preview-with-assets",
    label: "Preview host: block pages",
    description: "Block a preview origin from compliant crawlers while documenting the intent clearly before launch.",
    destructive: true,
    config: { siteUrl: "https://preview.example.com", sitemapUrls: [], groups: [{ id: "group-preview-host", userAgents: ["*"], rules: [{ id: "rule-preview-host", directive: "Disallow", path: "/" }] }] },
  },
];

export const CRAWLER_TEST_PRESETS = ["Googlebot", "Bingbot", "Googlebot-Image", "*", "CustomBot"] as const;
