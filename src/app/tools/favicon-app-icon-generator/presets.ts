import type { ExportPackId, FaviconInput, IconShape, ManifestDisplayMode, ManifestOrientation, ProjectProfileId } from "./types";

export const DEFAULT_FAVICON_INPUT: FaviconInput = {
  sourceMode: "text",
  imageDataUrl: "",
  imageMeta: null,
  svgText: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0f172a"/>
  <path d="M136 358V154h118c74 0 124 39 124 102s-50 102-124 102H136Zm66-55h46c39 0 63-17 63-47s-24-47-63-47h-46v94Z" fill="#ffffff"/>
</svg>`,
  text: "D",
  emoji: "✨",
  backgroundColor: "#0f172a",
  foregroundColor: "#ffffff",
  transparentBackground: false,
  padding: 18,
  scale: 100,
  borderRadius: 22,
  shape: "rounded",
  cropMode: "contain",
  sourceTransform: { zoom: 100, offsetX: 0, offsetY: 0, rotation: 0, fitMode: "contain" },
  fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  fontWeight: 800,
  pathPrefix: "/",
  siteName: "Darma Tools",
  shortName: "Darma",
  themeColor: "#0f172a",
  manifestBackgroundColor: "#0f172a",
  display: "standalone",
  orientation: "any",
  exportPack: "complete",
  projectProfile: "plain-html",
  includeMaskable: true,
  includeMonochrome: false,
};

export const SOURCE_MODE_OPTIONS = [
  { value: "image", label: "Image" },
  { value: "svg", label: "SVG" },
  { value: "text", label: "Text" },
  { value: "emoji", label: "Emoji" },
] as const;

export const SHAPE_OPTIONS: Array<{ value: IconShape; label: string }> = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "circle", label: "Circle" },
  { value: "squircle", label: "Squircle" },
];

export const DISPLAY_MODE_OPTIONS: Array<{ value: ManifestDisplayMode; label: string }> = [
  { value: "browser", label: "Browser" },
  { value: "minimal-ui", label: "Minimal UI" },
  { value: "standalone", label: "Standalone" },
  { value: "fullscreen", label: "Fullscreen" },
];

export const ORIENTATION_OPTIONS: Array<{ value: ManifestOrientation; label: string }> = [
  { value: "any", label: "Any" },
  { value: "natural", label: "Natural" },
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];

export const FONT_OPTIONS = [
  { label: "System / Inter", value: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times", value: "Times New Roman, Times, serif" },
  { label: "Mono", value: "SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace" },
] as const;

export const EXPORT_PACKS: Array<{ id: ExportPackId; title: string; description: string }> = [
  { id: "modern", title: "Modern Web", description: "Lean favicon, Apple icon, PWA icons, manifest, and snippets." },
  { id: "nextjs", title: "Next.js App Router", description: "Files arranged for src/app metadata conventions plus public manifest." },
  { id: "pwa", title: "PWA Complete", description: "Multiple PWA icon sizes, maskable assets, and manifest." },
  { id: "legacy", title: "Legacy Full", description: "Extra Apple, Microsoft tile, browserconfig, and favicon sizes." },
  { id: "complete", title: "Complete Studio", description: "Everything from modern, PWA, legacy, validator notes, and install docs." },
];

export const PROJECT_PROFILES: Array<{
  id: ProjectProfileId;
  title: string;
  shortLabel: string;
  description: string;
  recommendedPack: ExportPackId;
  targetFolder: string;
}> = [
  { id: "plain-html", title: "Plain HTML", shortLabel: "HTML", description: "Copy files to a public web root and paste link tags in the document head.", recommendedPack: "modern", targetFolder: "/" },
  { id: "next-app", title: "Next.js App Router", shortLabel: "Next App", description: "Use app/favicon.ico, app/icon.png, app/apple-icon.png, and a public manifest.", recommendedPack: "nextjs", targetFolder: "src/app + public" },
  { id: "next-pages", title: "Next.js Pages Router", shortLabel: "Next Pages", description: "Place files in public and add links through next/head or _document.", recommendedPack: "modern", targetFolder: "public" },
  { id: "vite-react", title: "React / Vite", shortLabel: "Vite", description: "Place files in public and link them from index.html.", recommendedPack: "modern", targetFolder: "public" },
  { id: "astro", title: "Astro", shortLabel: "Astro", description: "Place assets in public and add links in the base layout/head component.", recommendedPack: "modern", targetFolder: "public" },
  { id: "nuxt", title: "Nuxt", shortLabel: "Nuxt", description: "Place assets in public and register head links through app.vue, useHead, or nuxt config.", recommendedPack: "modern", targetFolder: "public" },
  { id: "sveltekit", title: "SvelteKit", shortLabel: "SvelteKit", description: "Place assets in static and reference them from app.html.", recommendedPack: "modern", targetFolder: "static" },
  { id: "wordpress", title: "WordPress", shortLabel: "WP", description: "Use the Customizer/Site Icon when possible, or add safe theme header links.", recommendedPack: "legacy", targetFolder: "theme or media library" },
  { id: "pwa-complete", title: "PWA complete", shortLabel: "PWA", description: "Generate a manifest-first install package with 192, 512, and maskable icons.", recommendedPack: "pwa", targetFolder: "public/icons" },
  { id: "legacy-full", title: "Legacy full support", shortLabel: "Legacy", description: "Add Apple fallback sizes, browserconfig, Microsoft tile, and classic favicon files.", recommendedPack: "legacy", targetFolder: "/" },
];


export const MODERN_WEB_SIZES = [16, 32, 48, 180, 192, 512] as const;
export const PWA_ICON_SIZES = [48, 72, 96, 128, 144, 152, 192, 384, 512] as const;
export const APPLE_ICON_SIZES = [152, 167, 180] as const;
export const ICO_SIZES = [16, 32, 48] as const;

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const FAVICON_QUICK_PRESETS: Array<{ id: string; title: string; description: string; patch: Partial<FaviconInput> }> = [
  {
    id: "website-launch",
    title: "Website launch",
    description: "Lean modern favicon package for a normal marketing or content website.",
    patch: { exportPack: "modern", projectProfile: "plain-html", includeMaskable: true, includeMonochrome: false, display: "browser", orientation: "any", pathPrefix: "/" },
  },
  {
    id: "nextjs-app",
    title: "Next.js app",
    description: "Routes files into app and public paths for App Router projects.",
    patch: { exportPack: "nextjs", projectProfile: "next-app", includeMaskable: true, includeMonochrome: false, display: "standalone", orientation: "any", pathPrefix: "/" },
  },
  {
    id: "installable-pwa",
    title: "Installable PWA",
    description: "Full install prompt coverage with maskable icons and manifest-first output.",
    patch: { exportPack: "pwa", projectProfile: "pwa-complete", includeMaskable: true, includeMonochrome: true, display: "standalone", orientation: "any", pathPrefix: "/icons/" },
  },
  {
    id: "ios-heavy",
    title: "iOS shortcuts",
    description: "Legacy Apple sizes plus favicon fallbacks for home-screen shortcuts.",
    patch: { exportPack: "legacy", projectProfile: "legacy-full", includeMaskable: false, includeMonochrome: false, display: "browser", orientation: "any", pathPrefix: "/" },
  },
  {
    id: "brand-kit",
    title: "Complete brand kit",
    description: "Everything enabled for audits, handoff, QA, and broad platform coverage.",
    patch: { exportPack: "complete", projectProfile: "plain-html", includeMaskable: true, includeMonochrome: true, display: "standalone", orientation: "any", pathPrefix: "/" },
  },
];
