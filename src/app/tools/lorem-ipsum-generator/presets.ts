import type { Preset } from "./types";

export const DESIGN_PRESETS: Preset[] = [
  {
    id: "hero-section",
    label: "Hero section",
    icon: "🏔",
    description: "Landing-page headline, supporting copy, and CTA labels.",
    config: { mode: "structured", structuredBlock: "hero", outputFormat: "html", amount: 1, seed: "hero-launch" },
  },
  {
    id: "feature-cards",
    label: "Feature cards",
    icon: "🃏",
    description: "Three concise feature cards for a product grid.",
    config: { mode: "structured", structuredBlock: "card", outputFormat: "html", amount: 3, seed: "feature-grid" },
  },
  {
    id: "testimonials",
    label: "Testimonials",
    icon: "💬",
    description: "Social-proof quotes with names and roles.",
    config: { mode: "structured", structuredBlock: "testimonial", outputFormat: "html", amount: 3, seed: "customer-proof" },
  },
  {
    id: "faq-block",
    label: "FAQ",
    icon: "❓",
    description: "Question-and-answer content for accordion layouts.",
    config: { mode: "structured", structuredBlock: "faq", outputFormat: "html", amount: 4, seed: "faq-content" },
  },
  {
    id: "product-listing",
    label: "Product listing",
    icon: "🛍",
    description: "Product names, prices, descriptions, and features.",
    config: { mode: "structured", structuredBlock: "product", outputFormat: "html", amount: 2, seed: "catalog-cards" },
  },
  {
    id: "about-bio",
    label: "About / Bio",
    icon: "👤",
    description: "Profile and about-page copy in readable prose.",
    config: { mode: "structured", structuredBlock: "about", outputFormat: "plain", amount: 1, seed: "profile-bio" },
  },
  {
    id: "onboarding-steps",
    label: "Onboarding steps",
    icon: "🪜",
    description: "Ordered product setup steps for onboarding screens.",
    config: { mode: "structured", structuredBlock: "onboarding", outputFormat: "html", amount: 4, seed: "onboarding-flow" },
  },
  {
    id: "pricing-table",
    label: "Pricing table",
    icon: "💳",
    description: "Tier names, pricing, benefits, and CTA labels.",
    config: { mode: "structured", structuredBlock: "pricing", outputFormat: "html", amount: 3, seed: "pricing-tiers" },
  },
];

export const LENGTH_PRESETS: Preset[] = [
  {
    id: "snippet",
    label: "Snippet",
    icon: "·",
    description: "Two short sentences for compact components.",
    config: { mode: "sentences", amount: 2, blockLength: "short", seed: "short-snippet" },
  },
  {
    id: "short",
    label: "Short",
    icon: "·",
    description: "One short paragraph for cards and empty states.",
    config: { mode: "paragraphs", amount: 1, blockLength: "short", seed: "short-paragraph" },
  },
  {
    id: "medium",
    label: "Medium",
    icon: "·",
    description: "Three balanced paragraphs for standard layouts.",
    config: { mode: "paragraphs", amount: 3, blockLength: "medium", seed: "medium-copy" },
  },
  {
    id: "long",
    label: "Long",
    icon: "·",
    description: "Five paragraphs for long-form content testing.",
    config: { mode: "paragraphs", amount: 5, blockLength: "medium", seed: "long-copy" },
  },
  {
    id: "article",
    label: "Article",
    icon: "·",
    description: "Eight long paragraphs with section headings.",
    config: { mode: "paragraphs", amount: 8, blockLength: "long", includeHeadings: true, seed: "article-layout" },
  },
];

export const FEATURED_PRESETS = [
  DESIGN_PRESETS[0],
  DESIGN_PRESETS[1],
  DESIGN_PRESETS[3],
  DESIGN_PRESETS[4],
  LENGTH_PRESETS[2],
  LENGTH_PRESETS[4],
];
