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
  {
    label: "Product page",
    description: "Store product page with product Open Graph type and large share image.",
    input: { ...DEFAULT_META_INPUT, title: "Arc Desk Lamp — North Studio", description: "A dimmable task lamp with warm light, compact footprint, and a two-year warranty.", canonicalUrl: "https://shop.example.com/products/arc-desk-lamp", siteName: "North Studio", ogType: "product", imageUrl: "https://shop.example.com/social/arc-desk-lamp.jpg", imageAlt: "Arc desk lamp on a wooden desk", twitterSite: "@northstudio", twitterCreator: "@northstudio" },
  },
  {
    label: "Documentation",
    description: "Developer documentation page with concise technical search copy.",
    input: { ...DEFAULT_META_INPUT, title: "Authentication API — Acme Docs", description: "Configure API keys, bearer tokens, token rotation, and request authentication for the Acme API.", canonicalUrl: "https://docs.example.com/api/authentication", siteName: "Acme Docs", imageUrl: "https://docs.example.com/og/authentication.png", imageAlt: "Authentication API documentation preview", twitterSite: "@acmedev", twitterCreator: "@acmedev" },
  },
  {
    label: "Open-source project",
    description: "Repository or project homepage emphasizing what the software does.",
    input: { ...DEFAULT_META_INPUT, title: "TinyQueue — lightweight background jobs for Node.js", description: "A small open-source queue for retries, scheduled jobs, and local development without a hosted control plane.", canonicalUrl: "https://example.dev/tinyqueue", siteName: "TinyQueue", imageUrl: "https://example.dev/tinyqueue/og.png", imageAlt: "TinyQueue project card", twitterSite: "@tinyqueue", twitterCreator: "@tinyqueue" },
  },
  {
    label: "Local business",
    description: "Location-focused service page for a real-world business.",
    input: { ...DEFAULT_META_INPUT, title: "Harbor Coffee — Downtown breakfast and coffee", description: "Coffee, breakfast, and fresh pastries served daily in downtown. View the menu, opening hours, and directions.", canonicalUrl: "https://harbor.example.com/downtown", siteName: "Harbor Coffee", imageUrl: "https://harbor.example.com/social/downtown.jpg", imageAlt: "Harbor Coffee downtown interior", twitterSite: "@harborcoffee", twitterCreator: "@harborcoffee" },
  },
  {
    label: "Event page",
    description: "Conference, meetup, workshop, or launch event share card.",
    input: { ...DEFAULT_META_INPUT, title: "Frontend Systems Day 2026 — October 18", description: "A one-day event for engineers and designers working on web performance, accessibility, and design systems.", canonicalUrl: "https://events.example.com/frontend-systems-day", siteName: "Frontend Systems Day", imageUrl: "https://events.example.com/og/2026.jpg", imageAlt: "Frontend Systems Day 2026 event card", twitterSite: "@fesystemsday", twitterCreator: "@fesystemsday" },
  },
  {
    label: "Job opening",
    description: "Hiring page with role, team, and location in the main preview copy.",
    input: { ...DEFAULT_META_INPUT, title: "Senior Frontend Engineer — Remote", description: "Join the product engineering team to build accessible, fast interfaces for teams working across the web.", canonicalUrl: "https://jobs.example.com/senior-frontend-engineer", siteName: "Example Careers", imageUrl: "https://jobs.example.com/og/frontend-role.jpg", imageAlt: "Senior Frontend Engineer role preview", twitterSite: "@examplecareers", twitterCreator: "@examplecareers" },
  },
  {
    label: "Newsletter",
    description: "Newsletter homepage or subscription landing page.",
    input: { ...DEFAULT_META_INPUT, title: "The Practical Web — weekly engineering notes", description: "A concise weekly email about frontend architecture, browser APIs, accessibility, and useful developer workflows.", canonicalUrl: "https://newsletter.example.com", siteName: "The Practical Web", imageUrl: "https://newsletter.example.com/og/home.jpg", imageAlt: "The Practical Web newsletter preview", twitterSite: "@practicalweb", twitterCreator: "@practicalweb" },
  },
  {
    label: "Mobile app",
    description: "App landing page with a benefit-led headline and product screenshot.",
    input: { ...DEFAULT_META_INPUT, title: "Focuslist — simple daily planning for iOS and Android", description: "Plan today, keep a short task list, and stay focused without turning productivity into another project.", canonicalUrl: "https://focuslist.example.com", siteName: "Focuslist", imageUrl: "https://focuslist.example.com/og/app.jpg", imageAlt: "Focuslist mobile app screens", twitterSite: "@focuslistapp", twitterCreator: "@focuslistapp" },
  },
  {
    label: "Case study",
    description: "Portfolio case study with clear project outcome in the snippet.",
    input: { ...DEFAULT_META_INPUT, title: "Case study: simplifying checkout for North Market", description: "How we redesigned a mobile checkout flow to reduce friction, clarify delivery choices, and improve completion.", canonicalUrl: "https://studio.example.com/work/north-market", siteName: "Studio Example", ogType: "article", imageUrl: "https://studio.example.com/og/north-market.jpg", imageAlt: "North Market checkout case study", twitterSite: "@studioexample", twitterCreator: "@studioexample" },
  },
  {
    label: "Changelog release",
    description: "Release note or changelog entry with version and major change.",
    input: { ...DEFAULT_META_INPUT, title: "Version 3.2 — saved views and faster search", description: "This release adds reusable saved views, faster result filtering, and a redesigned export flow.", canonicalUrl: "https://app.example.com/changelog/3-2", siteName: "Example App", ogType: "article", imageUrl: "https://app.example.com/og/changelog-3-2.png", imageAlt: "Version 3.2 release preview", twitterSite: "@exampleapp", twitterCreator: "@exampleapp" },
  },
  {
    label: "Profile page",
    description: "Public person or team profile using the profile Open Graph type.",
    input: { ...DEFAULT_META_INPUT, title: "Maya Chen — Product designer", description: "Product designer focused on design systems, complex workflows, and accessible web products.", canonicalUrl: "https://people.example.com/maya-chen", siteName: "People Directory", ogType: "profile", imageUrl: "https://people.example.com/og/maya-chen.jpg", imageAlt: "Maya Chen profile preview", twitterCard: "summary", twitterSite: "@peopledirectory", twitterCreator: "@mayachen" },
  },
];
