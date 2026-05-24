import type { ToolId } from "@/features/tools/domain/tool";

export type ToolWorkflow = {
  id: string;
  title: string;
  description: string;
  useCase: string;
  toolIds: ToolId[];
  relatedWorkflowIds?: string[];
};

export const toolWorkflows: ToolWorkflow[] = [
  {
    id: "frontend-css-toolkit",
    title: "Frontend CSS Toolkit",
    description: "Design buttons, gradients, shadows, responsive clamp values, and animated backgrounds for modern UI work.",
    useCase: "Use this workflow when you are polishing a landing page, dashboard, component library, or design-system prototype.",
    toolIds: ["color-palette-generator", "css-gradient-generator", "buttons-css-generator", "box-shadows-generator", "css-clamp-generator", "animated-background-generator"],
    relatedWorkflowIds: ["color-and-branding-toolkit", "image-optimization-toolkit"],
  },
  {
    id: "seo-launch-checklist",
    title: "SEO Launch Checklist",
    description: "Generate clean URLs, meta tags, robots.txt, and sitemap.xml before launching a website.",
    useCase: "Use this workflow before publishing a marketing page, portfolio, content site, or product microsite.",
    toolIds: ["slug-generator", "meta-tag-generator", "robots-txt-generator", "sitemap-xml-generator", "html-entity-encoder-decoder"],
    relatedWorkflowIds: ["json-api-toolkit", "frontend-css-toolkit"],
  },
  {
    id: "json-api-toolkit",
    title: "JSON API Toolkit",
    description: "Format JSON, decode tokens, generate TypeScript models, and convert API support text safely in the browser.",
    useCase: "Use this workflow when inspecting API responses, debugging authentication, or preparing typed frontend integrations.",
    toolIds: ["json-formatter", "json-to-typescript", "jwt-decoder", "base64-encoder-decoder", "timestamp-converter", "url-encoder-decoder"],
    relatedWorkflowIds: ["developer-utility-belt", "seo-launch-checklist"],
  },
  {
    id: "color-and-branding-toolkit",
    title: "Color and Branding Toolkit",
    description: "Build palettes, shades, gradients, and accessible color combinations for brand and UI systems.",
    useCase: "Use this workflow when starting a visual identity, choosing UI colors, or improving contrast and token exports.",
    toolIds: ["color-palette-generator", "color-converter", "color-shades", "css-gradient-generator", "buttons-css-generator"],
    relatedWorkflowIds: ["frontend-css-toolkit", "image-optimization-toolkit"],
  },
  {
    id: "image-optimization-toolkit",
    title: "Image Optimization Toolkit",
    description: "Convert images, prepare QR assets, edit SVG paths, and reuse colors for lightweight web visuals.",
    useCase: "Use this workflow when preparing product screenshots, landing-page visuals, QR codes, or optimized images.",
    toolIds: ["image-converter", "qr-code", "svg-path-editor", "color-palette-generator", "css-gradient-generator"],
    relatedWorkflowIds: ["color-and-branding-toolkit", "frontend-css-toolkit"],
  },
  {
    id: "developer-utility-belt",
    title: "Developer Utility Belt",
    description: "Common everyday utilities for IDs, timestamps, URLs, regex, markdown, Base64, and code previews.",
    useCase: "Use this workflow for quick debugging tasks that should stay local and fast.",
    toolIds: ["uuid-generator", "timestamp-converter", "url-encoder-decoder", "regex-tester", "markdown-previewer", "code-preview-tool"],
    relatedWorkflowIds: ["json-api-toolkit", "frontend-css-toolkit"],
  },
];

export function getToolWorkflow(id: string) {
  return toolWorkflows.find((workflow) => workflow.id === id) ?? null;
}
