import type { ToolId } from "@/features/tools/domain/tool";

export type ToolWorkflow = {
  id: string;
  title: string;
  description: string;
  useCase: string;
  audience?: string[];
  toolIds: ToolId[];
  steps?: string[];
  relatedWorkflowIds?: string[];
};

export const toolWorkflows: ToolWorkflow[] = [
  {
    id: "content-cleanup",
    title: "Content Cleanup",
    description: "Clean rough copy, turn it into SEO-ready assets, and create a QR code for sharing.",
    useCase: "Use this workflow when turning notes, pasted PDF text, captions, or page copy into clean public content.",
    audience: ["Creator", "Student", "General"],
    toolIds: ["text-cleaner", "slug-generator", "meta-tag-generator", "qr-code"],
    steps: [
      "Clean and normalize the text.",
      "Create a readable URL slug.",
      "Generate page and social metadata.",
      "Make a QR code for easy sharing.",
    ],
    relatedWorkflowIds: ["website-launch", "image-optimization"],
  },
  {
    id: "website-launch",
    title: "Website Launch",
    description: "Prepare URLs, metadata, crawl rules, sitemap files, and security headers before publishing.",
    useCase: "Use this workflow before launching a portfolio, content site, landing page, or product microsite.",
    audience: ["Creator", "Developer", "Business"],
    toolIds: ["slug-generator", "meta-tag-generator", "robots-txt-generator", "sitemap-xml-generator", "csp-generator"],
    steps: [
      "Normalize page names into clean slugs.",
      "Generate SEO and social preview tags.",
      "Create robots.txt and sitemap.xml files.",
      "Draft a Content Security Policy when needed.",
    ],
    relatedWorkflowIds: ["content-cleanup", "developer-debugging"],
  },
  {
    id: "image-optimization",
    title: "Image Optimization",
    description: "Resize and convert visuals, pick supporting colors, prepare responsive image markup, and add QR assets.",
    useCase: "Use this workflow when preparing thumbnails, product images, blog graphics, landing-page visuals, or QR campaign assets.",
    audience: ["Creator", "Designer", "Developer"],
    toolIds: ["image-converter", "color-palette-generator", "responsive-image-srcset-generator", "qr-code"],
    steps: [
      "Convert, compress, or resize image files.",
      "Pick an accessible color palette.",
      "Generate responsive srcset candidates.",
      "Create QR codes for print or sharing.",
    ],
    relatedWorkflowIds: ["content-cleanup", "frontend-css-toolkit"],
  },
  {
    id: "developer-debugging",
    title: "Developer Debugging",
    description: "Format JSON, test patterns, decode encoded data, inspect URLs, and check JWT payloads locally.",
    useCase: "Use this workflow when debugging API responses, auth tokens, logs, webhooks, encoded request data, or extraction rules.",
    audience: ["Developer"],
    toolIds: ["json-formatter", "regex-tester", "base64-encoder-decoder", "url-encoder-decoder", "jwt-decoder"],
    steps: [
      "Format and validate JSON payloads.",
      "Test regex extraction rules.",
      "Decode Base64 and URL-encoded values.",
      "Inspect JWT header and payload data.",
    ],
    relatedWorkflowIds: ["website-launch", "developer-utility-belt"],
  },
  {
    id: "frontend-css-toolkit",
    title: "Frontend CSS Toolkit",
    description: "Design buttons, gradients, shadows, responsive clamp values, and animated backgrounds for modern UI work.",
    useCase: "Use this workflow when you are polishing a landing page, dashboard, component library, or design-system prototype.",
    audience: ["Developer", "Designer"],
    toolIds: ["color-palette-generator", "css-gradient-generator", "buttons-css-generator", "box-shadows-generator", "css-clamp-generator", "animated-background-generator"],
    steps: ["Choose palette tokens.", "Generate gradients and button styles.", "Tune shadows and responsive values.", "Add motion or background polish."],
    relatedWorkflowIds: ["color-and-branding-toolkit", "image-optimization"],
  },
  {
    id: "seo-launch-checklist",
    title: "SEO Launch Checklist",
    description: "Generate clean URLs, meta tags, robots.txt, and sitemap.xml before launching a website.",
    useCase: "Use this workflow before publishing a marketing page, portfolio, content site, or product microsite.",
    audience: ["Developer", "Creator"],
    toolIds: ["slug-generator", "meta-tag-generator", "robots-txt-generator", "sitemap-xml-generator", "html-entity-encoder-decoder"],
    steps: ["Create slugs.", "Generate metadata.", "Prepare crawler files.", "Encode snippets when needed."],
    relatedWorkflowIds: ["website-launch", "frontend-css-toolkit"],
  },
  {
    id: "json-api-toolkit",
    title: "JSON API Toolkit",
    description: "Format JSON, decode tokens, generate TypeScript models, and convert API support text safely in the browser.",
    useCase: "Use this workflow when inspecting API responses, debugging authentication, or preparing typed frontend integrations.",
    audience: ["Developer"],
    toolIds: ["json-formatter", "json-to-typescript", "jwt-decoder", "base64-encoder-decoder", "timestamp-converter", "url-encoder-decoder"],
    steps: ["Format payloads.", "Generate TypeScript types.", "Decode tokens.", "Inspect encoded values and timestamps."],
    relatedWorkflowIds: ["developer-debugging", "website-launch"],
  },
  {
    id: "color-and-branding-toolkit",
    title: "Color and Branding Toolkit",
    description: "Build palettes, shades, gradients, and accessible color combinations for brand and UI systems.",
    useCase: "Use this workflow when starting a visual identity, choosing UI colors, or improving contrast and token exports.",
    audience: ["Designer", "Developer"],
    toolIds: ["color-palette-generator", "color-converter", "color-shades", "css-gradient-generator", "buttons-css-generator"],
    steps: ["Build a palette.", "Convert and expand colors.", "Create gradients.", "Apply colors to buttons."],
    relatedWorkflowIds: ["frontend-css-toolkit", "image-optimization"],
  },
  {
    id: "image-optimization-toolkit",
    title: "Image Optimization Toolkit",
    description: "Convert images, prepare QR assets, edit SVG paths, and reuse colors for lightweight web visuals.",
    useCase: "Use this workflow when preparing product screenshots, landing-page visuals, QR codes, or optimized images.",
    audience: ["Creator", "Developer"],
    toolIds: ["image-converter", "qr-code", "svg-path-editor", "color-palette-generator", "css-gradient-generator"],
    steps: ["Convert and optimize images.", "Generate QR assets.", "Edit SVG paths.", "Reuse palette and gradient decisions."],
    relatedWorkflowIds: ["image-optimization", "frontend-css-toolkit"],
  },
  {
    id: "developer-utility-belt",
    title: "Developer Utility Belt",
    description: "Common everyday utilities for IDs, timestamps, URLs, regex, markdown, Base64, and code previews.",
    useCase: "Use this workflow for quick debugging tasks that should stay local and fast.",
    audience: ["Developer", "General"],
    toolIds: ["uuid-generator", "timestamp-converter", "url-encoder-decoder", "regex-tester", "markdown-previewer", "code-preview-tool"],
    steps: ["Generate identifiers.", "Convert timestamps and URLs.", "Test regex patterns.", "Preview notes and snippets."],
    relatedWorkflowIds: ["developer-debugging", "frontend-css-toolkit"],
  },
];

export function getToolWorkflow(id: string) {
  return toolWorkflows.find((workflow) => workflow.id === id) ?? null;
}
