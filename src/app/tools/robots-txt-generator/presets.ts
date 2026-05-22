import type { RobotsPreset } from "./types";

export const DEFAULT_ROBOTS_CONFIG = {
  siteUrl: "https://example.com",
  sitemapUrl: "https://example.com/sitemap.xml",
  groups: [
    {
      id: "group-default",
      userAgent: "*",
      rules: [{ id: "rule-allow-all", directive: "Disallow" as const, path: "" }],
    },
  ],
};

export const ROBOTS_PRESETS: RobotsPreset[] = [
  {
    id: "allow-all",
    label: "Allow all",
    description: "Allow all crawlers to access the whole site and include a sitemap reference.",
    config: DEFAULT_ROBOTS_CONFIG,
  },
  {
    id: "block-all",
    label: "Block all",
    description: "Block all compliant crawlers from crawling every path. Use carefully.",
    destructive: true,
    config: {
      siteUrl: "https://example.com",
      sitemapUrl: "https://example.com/sitemap.xml",
      groups: [{ id: "group-block-all", userAgent: "*", rules: [{ id: "rule-block-all", directive: "Disallow", path: "/" }] }],
    },
  },
  {
    id: "block-private",
    label: "Block admin/private paths",
    description: "Allow the public site, but disallow common private and dashboard paths.",
    config: {
      siteUrl: "https://example.com",
      sitemapUrl: "https://example.com/sitemap.xml",
      groups: [
        {
          id: "group-private",
          userAgent: "*",
          rules: [
            { id: "rule-admin", directive: "Disallow", path: "/admin/" },
            { id: "rule-dashboard", directive: "Disallow", path: "/dashboard/" },
            { id: "rule-account", directive: "Disallow", path: "/account/" },
            { id: "rule-api", directive: "Disallow", path: "/api/" },
            { id: "rule-allow-public", directive: "Allow", path: "/" },
          ],
        },
      ],
    },
  },
  {
    id: "wordpress",
    label: "WordPress-style starter",
    description: "A common starter that blocks WordPress admin pages while allowing admin AJAX.",
    config: {
      siteUrl: "https://example.com",
      sitemapUrl: "https://example.com/sitemap.xml",
      groups: [
        {
          id: "group-wordpress",
          userAgent: "*",
          rules: [
            { id: "rule-wp-admin", directive: "Disallow", path: "/wp-admin/" },
            { id: "rule-wp-admin-ajax", directive: "Allow", path: "/wp-admin/admin-ajax.php" },
          ],
        },
      ],
    },
  },
  {
    id: "custom",
    label: "Custom",
    description: "Start with a simple editable group and build your own crawler rules.",
    config: DEFAULT_ROBOTS_CONFIG,
  },
];

export const DIRECTIVE_OPTIONS = ["Allow", "Disallow"] as const;
