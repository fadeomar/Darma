import type { MetaTagInput, MetaTagSection, MetaTagValidation, SocialPreviewModel } from "./types";

const TITLE_WARNING_LENGTH = 60;
const DESCRIPTION_WARNING_LENGTH = 160;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function normalizeHandle(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function isValidAbsoluteUrl(value: string): boolean {
  if (!value.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getDomain(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "example.com";
  }
}

function tag(name: string, content: string): string {
  return `<meta name="${name}" content="${escapeHtml(content)}">`;
}

function propertyTag(property: string, content: string): string {
  return `<meta property="${property}" content="${escapeHtml(content)}">`;
}

function linkTag(rel: string, href: string): string {
  return `<link rel="${rel}" href="${escapeHtml(href)}">`;
}

export function generateMetaTags(input: MetaTagInput, section: MetaTagSection = "all"): string {
  const lines: string[] = [];
  const title = input.title.trim();
  const description = input.description.trim();
  const canonicalUrl = input.canonicalUrl.trim();
  const siteName = input.siteName.trim();
  const imageUrl = input.imageUrl.trim();
  const imageAlt = input.imageAlt.trim();
  const locale = input.locale.trim();
  const twitterSite = normalizeHandle(input.twitterSite);
  const twitterCreator = normalizeHandle(input.twitterCreator);

  if (section === "all" || section === "seo") {
    if (title) lines.push(`<title>${escapeHtml(title)}</title>`);
    if (description) lines.push(tag("description", description));
    if (canonicalUrl) lines.push(linkTag("canonical", canonicalUrl));
  }

  if (section === "all" || section === "openGraph") {
    if (title) lines.push(propertyTag("og:title", title));
    if (description) lines.push(propertyTag("og:description", description));
    if (canonicalUrl) lines.push(propertyTag("og:url", canonicalUrl));
    lines.push(propertyTag("og:type", input.ogType));
    if (siteName) lines.push(propertyTag("og:site_name", siteName));
    if (locale) lines.push(propertyTag("og:locale", locale));
    if (imageUrl) lines.push(propertyTag("og:image", imageUrl));
    if (imageAlt) lines.push(propertyTag("og:image:alt", imageAlt));
  }

  if (section === "all" || section === "twitter") {
    lines.push(tag("twitter:card", input.twitterCard));
    if (title) lines.push(tag("twitter:title", title));
    if (description) lines.push(tag("twitter:description", description));
    if (imageUrl) lines.push(tag("twitter:image", imageUrl));
    if (imageAlt) lines.push(tag("twitter:image:alt", imageAlt));
    if (twitterSite) lines.push(tag("twitter:site", twitterSite));
    if (twitterCreator) lines.push(tag("twitter:creator", twitterCreator));
  }

  return lines.join("\n");
}

export function validateMetaTagInput(input: MetaTagInput): MetaTagValidation[] {
  const validations: MetaTagValidation[] = [];
  const title = input.title.trim();
  const description = input.description.trim();
  const canonicalUrl = input.canonicalUrl.trim();
  const imageUrl = input.imageUrl.trim();

  if (!title) validations.push({ level: "error", field: "title", message: "Page title is required for SEO and social previews." });
  if (title.length > TITLE_WARNING_LENGTH) validations.push({ level: "warning", field: "title", message: `Title is ${title.length} characters. Search results often truncate titles above about ${TITLE_WARNING_LENGTH} characters.` });

  if (!description) validations.push({ level: "warning", field: "description", message: "Add a meta description for better search snippets and social cards." });
  if (description.length > DESCRIPTION_WARNING_LENGTH) validations.push({ level: "warning", field: "description", message: `Description is ${description.length} characters. Search snippets often truncate above about ${DESCRIPTION_WARNING_LENGTH} characters.` });

  if (!canonicalUrl) validations.push({ level: "error", field: "canonicalUrl", message: "Canonical URL is required for og:url and rel=canonical." });
  else if (!isValidAbsoluteUrl(canonicalUrl)) validations.push({ level: "error", field: "canonicalUrl", message: "Use an absolute http or https URL." });

  if (!imageUrl) validations.push({ level: "warning", field: "imageUrl", message: "Add an image URL for richer Open Graph and Twitter/X cards." });
  else if (!isValidAbsoluteUrl(imageUrl)) validations.push({ level: "error", field: "imageUrl", message: "Image URL should be an absolute http or https URL." });

  if (imageUrl && !input.imageAlt.trim()) validations.push({ level: "warning", field: "imageAlt", message: "Add image alt text so social images have accessible context." });

  if (input.twitterSite.trim() && !normalizeHandle(input.twitterSite).startsWith("@")) {
    validations.push({ level: "info", field: "twitterSite", message: "Twitter/X handles are normalized with @ in the generated tags." });
  }

  return validations;
}

export function getPreviewModel(input: MetaTagInput): SocialPreviewModel {
  const title = input.title.trim() || "Untitled page";
  const description = input.description.trim() || "Add a meta description to preview the card copy.";
  const url = input.canonicalUrl.trim() || "https://example.com/page";

  return {
    title,
    description,
    url,
    domain: getDomain(url),
    siteName: input.siteName.trim() || getDomain(url),
    imageUrl: input.imageUrl.trim(),
    imageAlt: input.imageAlt.trim(),
    twitterCard: input.twitterCard,
  };
}
