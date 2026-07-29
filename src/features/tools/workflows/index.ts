import type { ToolId } from "@/features/tools/domain/tool";

export type ToolWorkflowStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  toolId?: ToolId;
  handoff?: string;
};

export type ToolWorkflow = {
  id: string;
  title: string;
  description: string;
  useCase: string;
  outcome: string;
  estimatedTime?: string;
  audience?: string[];
  steps: ToolWorkflowStep[];
  relatedWorkflowIds?: string[];
};

export const toolWorkflows: ToolWorkflow[] = [
  {
    id: "color-system-studio",
    title: "Darma Color System Studio",
    description: "Turn one brand color into a checked palette, shade scale, gradient direction, and production-ready component colors.",
    useCase: "Use this workflow when a project has a logo color or rough visual direction but still needs consistent UI tokens and accessible component decisions.",
    outcome: "A reusable color direction with conversions, palette tokens, shades, gradients, and button styles that share the same browser-local workflow context.",
    estimatedTime: "15–30 min",
    audience: ["Designer", "Developer", "Creator"],
    steps: [
      {
        id: "normalize-color",
        title: "Normalize the source color",
        description: "Convert the starting value, inspect modern color spaces, and check the safest text color.",
        href: "/tools/color-converter",
        toolId: "color-converter",
        handoff: "The normalized HEX value is saved locally for the next color tools.",
      },
      {
        id: "build-palette",
        title: "Build the brand palette",
        description: "Choose a harmony, lock useful colors, and inspect practical contrast pairs.",
        href: "/tools/color-palette-generator",
        toolId: "color-palette-generator",
        handoff: "The active palette becomes the source for shades, gradients, and components.",
      },
      {
        id: "create-scale",
        title: "Create a semantic shade scale",
        description: "Generate light-to-dark shades and export CSS, Tailwind, JSON, and accessibility notes.",
        href: "/tools/color-shades",
        toolId: "color-shades",
        handoff: "The generated scale updates the shared palette context.",
      },
      {
        id: "design-gradient",
        title: "Create a supporting gradient",
        description: "Start with the saved palette and refine a hero, background, or accent gradient.",
        href: "/tools/css-gradient-generator",
        toolId: "css-gradient-generator",
        handoff: "Palette colors seed the initial gradient automatically.",
      },
      {
        id: "apply-components",
        title: "Apply colors to a real component",
        description: "Validate contrast, tap targets, states, and exports on a production button.",
        href: "/tools/buttons-css-generator",
        toolId: "buttons-css-generator",
        handoff: "Primary and secondary colors seed the button configuration.",
      },
    ],
    relatedWorkflowIds: ["responsive-layout-builder", "web-image-production"],
  },
  {
    id: "web-image-production",
    title: "Website Image Production",
    description: "Prepare one visual direction for efficient web delivery, responsive markup, social sharing, and application icons.",
    useCase: "Use this workflow for landing-page artwork, product screenshots, article images, campaign assets, or a new website identity.",
    outcome: "A practical image-delivery checklist covering format, file weight, dimensions, responsive markup, social previews, and icons.",
    estimatedTime: "20–40 min",
    audience: ["Creator", "Designer", "Developer"],
    steps: [
      {
        id: "convert-source",
        title: "Choose the delivery format",
        description: "Convert the source image to the most appropriate browser format.",
        href: "/tools/image-converter",
        toolId: "image-converter",
      },
      {
        id: "compress-resize",
        title: "Compress and resize",
        description: "Reduce file weight and prepare the dimensions needed by the page.",
        href: "/tools/image-compressor-resizer",
        toolId: "image-compressor-resizer",
      },
      {
        id: "confirm-ratio",
        title: "Confirm the aspect ratio",
        description: "Calculate consistent crops for cards, heroes, videos, or app screenshots.",
        href: "/tools/aspect-ratio-calculator",
        toolId: "aspect-ratio-calculator",
      },
      {
        id: "responsive-markup",
        title: "Generate responsive image markup",
        description: "Create srcset, sizes, picture markup, and production notes for the final asset.",
        href: "/tools/responsive-image-srcset-generator",
        toolId: "responsive-image-srcset-generator",
      },
      {
        id: "social-preview",
        title: "Create the social preview",
        description: "Build and validate an Open Graph image for link sharing.",
        href: "/tools/og-image-generator",
        toolId: "og-image-generator",
      },
      {
        id: "app-icons",
        title: "Package favicons and app icons",
        description: "Generate the icon set, manifest snippets, and downloadable production package.",
        href: "/tools/favicon-app-icon-generator",
        toolId: "favicon-app-icon-generator",
      },
    ],
    relatedWorkflowIds: ["website-launch", "color-system-studio"],
  },
  {
    id: "responsive-layout-builder",
    title: "Responsive Layout Builder",
    description: "Move from a page structure to component-level responsiveness, fluid sizing, and a runnable browser prototype.",
    useCase: "Use this workflow when building a dashboard, app shell, gallery, card collection, pricing section, or reusable responsive component.",
    outcome: "A tested layout direction with Grid or Flexbox structure, container behavior, fluid values, and a runnable HTML/CSS prototype.",
    estimatedTime: "20–45 min",
    audience: ["Developer", "Designer"],
    steps: [
      {
        id: "page-structure",
        title: "Build the page structure",
        description: "Start from a bento, dashboard, sidebar, gallery, or app-shell Grid preset.",
        href: "/tools/css-grid-generator?preset=bento-grid",
        toolId: "css-grid-generator",
      },
      {
        id: "component-alignment",
        title: "Solve component alignment",
        description: "Use Flexbox for navigation, actions, media objects, and one-dimensional component layout.",
        href: "/tools/flexbox-generator?preset=navbar",
        toolId: "flexbox-generator",
      },
      {
        id: "component-responsiveness",
        title: "Add container-aware behavior",
        description: "Make reusable modules respond to their own available space instead of only the viewport.",
        href: "/tools/container-query-generator?preset=dashboard-widget",
        toolId: "container-query-generator",
      },
      {
        id: "fluid-scale",
        title: "Generate fluid spacing and type",
        description: "Create clamp values for typography, gaps, padding, and component dimensions.",
        href: "/tools/css-clamp-generator",
        toolId: "css-clamp-generator",
      },
      {
        id: "browser-prototype",
        title: "Test the combined prototype",
        description: "Run the final HTML, CSS, and JavaScript in the production-focused Code Preview studio.",
        href: "/tools/code-preview-tool",
        toolId: "code-preview-tool",
      },
    ],
    relatedWorkflowIds: ["color-system-studio", "explorer-code-preview"],
  },
  {
    id: "explorer-code-preview",
    title: "Explorer to Production Preview",
    description: "Open an Explorer element, customize its source, and transfer the current code into the stronger Code Preview production studio.",
    useCase: "Use this workflow when an Explorer snippet is a good starting point but needs responsive testing, console checks, source audits, or a downloadable project package.",
    outcome: "An editable Explorer project transferred locally into Code Preview without copying large HTML, CSS, or JavaScript strings through the URL.",
    estimatedTime: "10–25 min",
    audience: ["Developer", "Learner", "Creator"],
    steps: [
      {
        id: "choose-element",
        title: "Choose and edit an Explorer element",
        description: "Browse Explorer, open an element, and make any first-pass HTML, CSS, or JavaScript changes.",
        href: "/explore?workflow=explorer-code-preview",
      },
      {
        id: "transfer-preview",
        title: "Open the current source in Code Preview",
        description: "Use the new local handoff action from the element preview to continue with the exact edited source.",
        href: "/tools/code-preview-tool?workflow=explorer-code-preview",
        toolId: "code-preview-tool",
        handoff: "The source is stored briefly in browser local storage and removed after import.",
      },
    ],
    relatedWorkflowIds: ["responsive-layout-builder", "developer-debugging"],
  },
  {
    id: "website-launch",
    title: "Website Launch",
    description: "Prepare URLs, metadata, crawler files, and a verified social preview before publishing.",
    useCase: "Use this workflow before launching a portfolio, content site, landing page, or product microsite.",
    outcome: "A launch-ready collection of clean slugs, metadata, robots.txt, sitemap.xml, and a social preview image.",
    estimatedTime: "15–30 min",
    audience: ["Creator", "Developer", "Business"],
    steps: [
      { id: "slugs", title: "Normalize page URLs", description: "Create clear, readable slugs for public pages.", href: "/tools/slug-generator", toolId: "slug-generator" },
      { id: "metadata", title: "Generate metadata", description: "Prepare title, description, social, and search metadata.", href: "/tools/meta-tag-generator", toolId: "meta-tag-generator" },
      { id: "robots", title: "Prepare crawler rules", description: "Generate and review robots.txt rules.", href: "/tools/robots-txt-generator", toolId: "robots-txt-generator" },
      { id: "sitemap", title: "Build the sitemap", description: "Create sitemap.xml entries for public URLs.", href: "/tools/sitemap-xml-generator", toolId: "sitemap-xml-generator" },
      { id: "social-preview", title: "Verify the social preview", description: "Create the Open Graph image that accompanies the final metadata when links are shared.", href: "/tools/og-image-generator", toolId: "og-image-generator" },
    ],
    relatedWorkflowIds: ["web-image-production", "content-cleanup"],
  },
  {
    id: "content-cleanup",
    title: "Content Cleanup",
    description: "Turn rough copy into clean public content, a usable URL, metadata, and a shareable QR destination.",
    useCase: "Use this workflow for pasted PDF text, notes, captions, event copy, listings, or a new article draft.",
    outcome: "Clean copy plus the basic publishing assets needed to place it on a public page.",
    estimatedTime: "10–20 min",
    audience: ["Creator", "Student", "General"],
    steps: [
      { id: "clean", title: "Clean the source text", description: "Normalize whitespace, punctuation, and copied formatting.", href: "/tools/text-cleaner", toolId: "text-cleaner" },
      { id: "slug", title: "Create the URL slug", description: "Generate a readable URL-safe identifier.", href: "/tools/slug-generator", toolId: "slug-generator" },
      { id: "meta", title: "Prepare metadata", description: "Generate page and social preview tags.", href: "/tools/meta-tag-generator", toolId: "meta-tag-generator" },
      { id: "share", title: "Create a QR destination", description: "Generate a QR code for print or quick sharing.", href: "/tools/qr-code", toolId: "qr-code" },
    ],
    relatedWorkflowIds: ["website-launch", "web-image-production"],
  },
  {
    id: "developer-debugging",
    title: "Developer Debugging",
    description: "Inspect JSON, types, patterns, tokens, encoded values, timestamps, and final runnable source locally.",
    useCase: "Use this workflow when debugging an API response, webhook, authentication flow, browser integration, or copied code sample.",
    outcome: "A validated payload and a clearer picture of the data, token, pattern, and browser behavior involved.",
    estimatedTime: "10–30 min",
    audience: ["Developer"],
    steps: [
      { id: "json", title: "Format the payload", description: "Format and validate the JSON response.", href: "/tools/json-formatter", toolId: "json-formatter" },
      { id: "types", title: "Generate TypeScript models", description: "Convert the payload shape into starter interfaces.", href: "/tools/json-to-typescript", toolId: "json-to-typescript" },
      { id: "tokens", title: "Inspect authentication data", description: "Decode JWT, Base64, URL values, and timestamps as needed.", href: "/tools/jwt-decoder", toolId: "jwt-decoder" },
      { id: "patterns", title: "Test extraction rules", description: "Validate regular expressions against representative input.", href: "/tools/regex-tester", toolId: "regex-tester" },
      { id: "preview", title: "Reproduce browser behavior", description: "Run the relevant HTML, CSS, and JavaScript in Code Preview.", href: "/tools/code-preview-tool", toolId: "code-preview-tool" },
    ],
    relatedWorkflowIds: ["explorer-code-preview", "website-launch"],
  },
];

const workflowAliases: Record<string, string> = {
  "image-optimization": "web-image-production",
  "image-optimization-toolkit": "web-image-production",
  "color-and-branding-toolkit": "color-system-studio",
  "frontend-css-toolkit": "responsive-layout-builder",
  "developer-utility-belt": "developer-debugging",
  "json-api-toolkit": "developer-debugging",
  "seo-launch-checklist": "website-launch",
};

export function getToolWorkflow(id: string) {
  const resolvedId = workflowAliases[id] ?? id;
  return toolWorkflows.find((workflow) => workflow.id === resolvedId) ?? null;
}

export function getWorkflowToolIds(workflow: ToolWorkflow): ToolId[] {
  return workflow.steps.flatMap((step) => (step.toolId ? [step.toolId] : []));
}

export function appendWorkflowContext(href: string, workflowId: string) {
  const [pathAndQuery, hash = ""] = href.split("#", 2);
  const [pathname, query = ""] = pathAndQuery.split("?", 2);
  const params = new URLSearchParams(query);
  params.set("workflow", workflowId);
  const next = `${pathname}?${params.toString()}`;
  return hash ? `${next}#${hash}` : next;
}
