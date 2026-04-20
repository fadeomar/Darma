import type { Preset } from "./types";

export const DESIGN_PRESETS: Preset[] = [
  {
    id: "hero-section",
    label: "Hero section",
    icon: "🏔",
    config: {
      mode: "structured",
      structuredBlock: "hero",
      outputFormat: "html",
      amount: 1,
    },
  },
  {
    id: "feature-cards",
    label: "Feature cards",
    icon: "🃏",
    config: {
      mode: "structured",
      structuredBlock: "card",
      outputFormat: "html",
      amount: 3,
    },
  },
  {
    id: "testimonials",
    label: "Testimonials",
    icon: "💬",
    config: {
      mode: "structured",
      structuredBlock: "testimonial",
      outputFormat: "html",
      amount: 3,
    },
  },
  {
    id: "faq-block",
    label: "FAQ",
    icon: "❓",
    config: {
      mode: "structured",
      structuredBlock: "faq",
      outputFormat: "html",
      amount: 4,
    },
  },
  {
    id: "product-listing",
    label: "Product listing",
    icon: "🛍",
    config: {
      mode: "structured",
      structuredBlock: "product",
      outputFormat: "html",
      amount: 2,
    },
  },
  {
    id: "about-bio",
    label: "About / Bio",
    icon: "👤",
    config: {
      mode: "structured",
      structuredBlock: "about",
      outputFormat: "plain",
      amount: 1,
    },
  },
  {
    id: "onboarding-steps",
    label: "Onboarding steps",
    icon: "🪜",
    config: {
      mode: "structured",
      structuredBlock: "onboarding",
      outputFormat: "html",
      amount: 4,
    },
  },
  {
    id: "pricing-table",
    label: "Pricing table",
    icon: "💳",
    config: {
      mode: "structured",
      structuredBlock: "pricing",
      outputFormat: "html",
      amount: 3,
    },
  },
];

export const LENGTH_PRESETS: Preset[] = [
  {
    id: "snippet",
    label: "Snippet",
    icon: "·",
    config: { mode: "sentences", amount: 2, blockLength: "short" },
  },
  {
    id: "short",
    label: "Short",
    icon: "·",
    config: { mode: "paragraphs", amount: 1, blockLength: "short" },
  },
  {
    id: "medium",
    label: "Medium",
    icon: "·",
    config: { mode: "paragraphs", amount: 3, blockLength: "medium" },
  },
  {
    id: "long",
    label: "Long",
    icon: "·",
    config: { mode: "paragraphs", amount: 5, blockLength: "medium" },
  },
  {
    id: "article",
    label: "Article",
    icon: "·",
    config: {
      mode: "paragraphs",
      amount: 8,
      blockLength: "long",
      includeHeadings: true,
    },
  },
];
