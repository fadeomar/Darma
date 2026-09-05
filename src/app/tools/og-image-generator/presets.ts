import type { OgExportPackId, OgExportSize, OgImageInput, OgQuickPreset, OgTemplateId } from "./types";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const DEFAULT_OG_INPUT: OgImageInput = {
  templateId: "developer-tool",
  title: "Build faster with Darma Tools",
  subtitle: "Free browser-based utilities for developers, designers, creators, and launch teams.",
  badge: "New tool",
  domain: "darma.tools",
  author: "Darma",
  callToAction: "Try it free",
  backgroundMode: "gradient",
  backgroundColor: "#0f172a",
  foregroundColor: "#f8fafc",
  mutedColor: "#cbd5e1",
  accentColor: "#38bdf8",
  gradientFrom: "#0f172a",
  gradientTo: "#2563eb",
  gradientAngle: 135,
  patternIntensity: 18,
  imageOverlay: 42,
  backgroundImageDataUrl: "",
  logoDataUrl: "",
  logoPosition: "top-left",
  textAlign: "left",
  titleSize: 74,
  subtitleSize: 30,
  badgeSize: 22,
  frameRadius: 36,
  safeArea: true,
  siteUrl: "https://darma.tools",
  altText: "Darma Tools social preview image",
  twitterCard: "summary_large_image",
  exportPack: "basic",
};

export const TEMPLATE_OPTIONS: Array<{ value: OgTemplateId; label: string }> = [
  { value: "minimal-saas", label: "Minimal SaaS" },
  { value: "developer-tool", label: "Developer Tool" },
  { value: "blog-article", label: "Blog Article" },
  { value: "product-launch", label: "Product Launch" },
  { value: "terminal", label: "Terminal" },
  { value: "documentation", label: "Documentation" },
  { value: "portfolio", label: "Portfolio" },
  { value: "announcement", label: "Announcement" },
];

export const BACKGROUND_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
  { value: "image", label: "Image" },
  { value: "pattern", label: "Pattern" },
] as const;

export const TEXT_ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
] as const;

export const LOGO_POSITION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
] as const;

export const EXPORT_PACKS: Array<{ id: OgExportPackId; label: string; description: string }> = [
  { id: "basic", label: "Basic Web", description: "1200×630 OG image, Twitter image, HTML tags, and README." },
  { id: "nextjs", label: "Next.js App Router", description: "app/opengraph-image.png, app/twitter-image.png, metadata snippet, and install guide." },
  { id: "social", label: "Social Platforms", description: "OG, LinkedIn, X/Twitter, Facebook, Discord/Slack, and square preview images." },
  { id: "article", label: "Blog / Article", description: "Article image, author metadata, structured snippets, and sharing checklist." },
  { id: "complete", label: "Complete Launch", description: "All images, snippets, Next.js guide, HTML preview, checklist, and README." },
];

export const QUICK_PRESETS: OgQuickPreset[] = [
  { id: "website-launch", title: "Website launch", description: "Clean launch card with domain, badge, title, and CTA.", patch: { templateId: "product-launch", badge: "Launching now", callToAction: "Visit website", exportPack: "complete", backgroundMode: "gradient", titleSize: 78 } },
  { id: "developer-tool", title: "Developer tool", description: "Technical layout with strong title, terminal-style accents, and code-like details.", patch: { templateId: "developer-tool", badge: "Free tool", callToAction: "Use in browser", exportPack: "basic", backgroundMode: "gradient", textAlign: "left" } },
  { id: "blog-post", title: "Blog article", description: "Editorial style for tutorials, changelogs, and SEO articles.", patch: { templateId: "blog-article", badge: "Article", callToAction: "Read more", exportPack: "article", titleSize: 68, subtitleSize: 28 } },
  { id: "nextjs-app", title: "Next.js app", description: "Files and snippets aligned with App Router metadata conventions.", patch: { templateId: "minimal-saas", exportPack: "nextjs", badge: "Next.js", callToAction: "Open app", backgroundMode: "gradient" } },
  { id: "social-kit", title: "Social kit", description: "Multiple platform image sizes for sharing across social and chat apps.", patch: { templateId: "announcement", exportPack: "social", badge: "Announcement", callToAction: "Share now", textAlign: "center" } },
  { id: "saas-feature", title: "SaaS feature page", description: "Product-focused preview for a feature or solution landing page.", patch: { templateId: "minimal-saas", badge: "Product feature", callToAction: "Explore feature", exportPack: "complete", backgroundMode: "gradient", textAlign: "left", titleSize: 72 } },
  { id: "docs-page", title: "Documentation page", description: "Restrained technical card for guides, API docs, and reference pages.", patch: { templateId: "documentation", badge: "Documentation", callToAction: "Read docs", exportPack: "basic", backgroundMode: "solid", backgroundColor: "#0f172a", textAlign: "left", titleSize: 64 } },
  { id: "changelog", title: "Changelog release", description: "Release-note card with version badge and concise update copy.", patch: { templateId: "announcement", badge: "Version 2.4", callToAction: "See what changed", exportPack: "article", backgroundMode: "gradient", textAlign: "left", titleSize: 66 } },
  { id: "open-source", title: "Open-source project", description: "Developer-friendly social card for repositories, libraries, and releases.", patch: { templateId: "terminal", badge: "Open source", callToAction: "View repository", exportPack: "social", backgroundMode: "pattern", textAlign: "left", titleSize: 66 } },
  { id: "portfolio-project", title: "Portfolio project", description: "Editorial project card for case studies and personal websites.", patch: { templateId: "portfolio", badge: "Case study", callToAction: "View project", exportPack: "social", backgroundMode: "gradient", textAlign: "left", titleSize: 70 } },
  { id: "newsletter", title: "Newsletter issue", description: "Readable editorial preview for newsletters and recurring publications.", patch: { templateId: "blog-article", badge: "Newsletter", callToAction: "Read issue", exportPack: "article", backgroundMode: "solid", backgroundColor: "#faf7f2", foregroundColor: "#1f2937", mutedColor: "#6b7280", accentColor: "#b45309", titleSize: 64 } },
  { id: "event-announcement", title: "Event announcement", description: "Centered high-energy preview for webinars, launches, and community events.", patch: { templateId: "announcement", badge: "Live event", callToAction: "Save your spot", exportPack: "social", backgroundMode: "gradient", gradientFrom: "#4c1d95", gradientTo: "#db2777", textAlign: "center", titleSize: 72 } },
  { id: "product-update", title: "Product update", description: "Compact announcement card for shipped features and product news.", patch: { templateId: "product-launch", badge: "New update", callToAction: "Try it now", exportPack: "social", backgroundMode: "gradient", textAlign: "left", titleSize: 70 } },
  { id: "job-listing", title: "Hiring announcement", description: "Clear brand card for open roles and team-growth announcements.", patch: { templateId: "announcement", badge: "We are hiring", callToAction: "View open roles", exportPack: "social", backgroundMode: "solid", backgroundColor: "#111827", textAlign: "center", titleSize: 70 } },
  { id: "course-resource", title: "Course or guide", description: "Educational preview for tutorials, downloadable guides, and learning resources.", patch: { templateId: "documentation", badge: "Free guide", callToAction: "Start learning", exportPack: "article", backgroundMode: "gradient", textAlign: "left", titleSize: 68 } },
  { id: "minimal-link", title: "Minimal link card", description: "Low-noise title-and-domain preview when the brand should stay understated.", patch: { templateId: "minimal-saas", badge: "", callToAction: "", exportPack: "basic", backgroundMode: "solid", backgroundColor: "#f8fafc", foregroundColor: "#0f172a", mutedColor: "#64748b", accentColor: "#2563eb", textAlign: "left", titleSize: 64 } },
];

export function getExportSizes(packId: OgExportPackId): OgExportSize[] {
  const base: OgExportSize[] = [
    { filename: "opengraph-image.png", width: 1200, height: 630, label: "Open Graph 1200×630" },
    { filename: "twitter-image.png", width: 1200, height: 630, label: "Twitter/X 1200×630" },
  ];

  if (packId === "basic") return [...base, { filename: "og-image.png", width: 1200, height: 630, label: "Generic OG image" }];
  if (packId === "nextjs") {
    return [
      { filename: "src/app/opengraph-image.png", width: 1200, height: 630, label: "Next.js Open Graph" },
      { filename: "src/app/twitter-image.png", width: 1200, height: 630, label: "Next.js Twitter" },
    ];
  }
  if (packId === "article") {
    return [
      ...base,
      { filename: "article-cover.png", width: 1200, height: 630, label: "Article cover" },
      { filename: "article-square-preview.png", width: 1080, height: 1080, label: "Article square" },
    ];
  }
  if (packId === "social") {
    return [
      ...base,
      { filename: "linkedin-preview.png", width: 1200, height: 627, label: "LinkedIn 1.91:1" },
      { filename: "facebook-preview.png", width: 1200, height: 630, label: "Facebook preview" },
      { filename: "discord-slack-preview.png", width: 1200, height: 630, label: "Discord / Slack" },
      { filename: "square-social-preview.png", width: 1080, height: 1080, label: "Square social" },
    ];
  }
  return [
    ...base,
    { filename: "og-image.png", width: 1200, height: 630, label: "Generic OG image" },
    { filename: "linkedin-preview.png", width: 1200, height: 627, label: "LinkedIn 1.91:1" },
    { filename: "facebook-preview.png", width: 1200, height: 630, label: "Facebook preview" },
    { filename: "discord-slack-preview.png", width: 1200, height: 630, label: "Discord / Slack" },
    { filename: "square-social-preview.png", width: 1080, height: 1080, label: "Square social" },
    { filename: "wide-banner-preview.png", width: 1600, height: 900, label: "Wide banner" },
  ];
}
