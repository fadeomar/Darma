import type { MetaTagInput, MetaTagPreset, OgType, TwitterCardType } from "./types";

export const TITLE_LIMIT = 120;
export const DESCRIPTION_LIMIT = 300;
export const URL_LIMIT = 500;
export const TEXT_LIMIT = 200;

export const DEFAULT_META_INPUT: MetaTagInput = {
  title: "Darma Tools — Fast browser utilities for developers",
  description: "Generate, format, preview, and convert common developer assets with private browser-only utilities.",
  canonicalUrl: "https://darma.tools/tools/meta-tag-generator",
  siteName: "Darma Tools",
  ogType: "website",
  imageUrl: "https://darma.tools/og/tools.png",
  imageAlt: "Darma Tools social preview image",
  locale: "en_US",
  twitterCard: "summary_large_image",
  twitterSite: "@darmatools",
  twitterCreator: "@darmatools",
};

export const EMPTY_META_INPUT: MetaTagInput = {
  title: "",
  description: "",
  canonicalUrl: "",
  siteName: "",
  ogType: "website",
  imageUrl: "",
  imageAlt: "",
  locale: "en_US",
  twitterCard: "summary_large_image",
  twitterSite: "",
  twitterCreator: "",
};

export const OG_TYPE_OPTIONS: Array<{ value: OgType; label: string }> = [
  { value: "website", label: "Website" },
  { value: "article", label: "Article" },
  { value: "product", label: "Product" },
  { value: "profile", label: "Profile" },
];

export const TWITTER_CARD_OPTIONS: Array<{ value: TwitterCardType; label: string }> = [
  { value: "summary", label: "Summary" },
  { value: "summary_large_image", label: "Summary large image" },
];

export const META_PRESETS: MetaTagPreset[] = [
  {
    label: "SaaS page",
    description: "Product landing page with large social image.",
    input: DEFAULT_META_INPUT,
  },
  {
    label: "Article",
    description: "Blog article with article Open Graph type.",
    input: {
      ...DEFAULT_META_INPUT,
      title: "How to build better browser-only developer tools",
      description: "A practical guide to building fast, privacy-friendly tools that process user input locally in the browser.",
      canonicalUrl: "https://darma.tools/blog/browser-only-developer-tools",
      ogType: "article",
      imageUrl: "https://darma.tools/og/blog-browser-tools.png",
      imageAlt: "Illustration of browser-only developer tools",
    },
  },
  {
    label: "Creator link",
    description: "Portfolio or creator profile with compact summary card.",
    input: {
      ...DEFAULT_META_INPUT,
      title: "Aya Studio — Design portfolio and visual experiments",
      description: "Explore recent branding, social graphics, and web design experiments from Aya Studio.",
      canonicalUrl: "https://example.com/portfolio",
      siteName: "Aya Studio",
      ogType: "profile",
      imageUrl: "https://example.com/social-card.jpg",
      imageAlt: "Aya Studio portfolio preview",
      twitterCard: "summary",
      twitterSite: "@ayastudio",
      twitterCreator: "@ayastudio",
    },
  },
];
