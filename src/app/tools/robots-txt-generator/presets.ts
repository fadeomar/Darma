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
];

export const CRAWLER_TEST_PRESETS = ["Googlebot", "Bingbot", "Googlebot-Image", "*", "CustomBot"] as const;
