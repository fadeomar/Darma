import type { MockupDevice, MockupExportPack, MockupInput } from "./types";

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export const DEFAULT_MOCKUP_INPUT: MockupInput = {
  screenshotDataUrl: "",
  screenshotName: "",
  screenshotWidth: 0,
  screenshotHeight: 0,
  backgroundImageDataUrl: "",
  device: "phone",
  orientation: "portrait",
  exportPackId: "landing",
  backgroundMode: "gradient",
  backgroundColor: "#0f172a",
  gradientFrom: "#111827",
  gradientTo: "#7c3aed",
  gradientAngle: 135,
  foregroundColor: "#ffffff",
  mutedColor: "#cbd5e1",
  accentColor: "#38bdf8",
  title: "Showcase your product in seconds",
  subtitle: "Upload a screenshot, choose a device frame, and export polished mockups for landing pages, social posts, and documentation.",
  badge: "New launch",
  footer: "Generated locally with Darma",
  showText: true,
  showBadge: true,
  showFooter: true,
  showDeviceChrome: true,
  showReflection: true,
  showSafeArea: false,
  fitMode: "cover",
  shadow: "float",
  alignment: "center",
  canvasWidth: 1600,
  canvasHeight: 1200,
  padding: 96,
  frameRadius: 34,
  deviceScale: 86,
  rotate: -3,
  browserUrl: "https://example.com/app",
  filePrefix: "app-mockup",
};

export const DEVICE_OPTIONS: Array<{ value: MockupDevice; label: string; description: string }> = [
  { value: "phone", label: "Phone", description: "Mobile app screenshots and hero sections" },
  { value: "tablet", label: "Tablet", description: "Tablet UI, dashboards, and responsive previews" },
  { value: "laptop", label: "Laptop", description: "SaaS landing pages and desktop products" },
  { value: "desktop", label: "Desktop", description: "Large app screenshots and dashboard previews" },
  { value: "browser", label: "Browser", description: "Website screenshots with browser chrome" },
  { value: "card", label: "Clean card", description: "No device frame, just a polished image card" },
];

export const EXPORT_PACKS: MockupExportPack[] = [
  {
    id: "landing",
    title: "Landing Page Pack",
    description: "Wide hero images for website sections and marketing pages.",
    sizes: [
      { id: "hero-wide", label: "Hero wide", filename: "hero-wide.png", width: 1600, height: 1200, description: "Large website hero image" },
      { id: "hero-16-9", label: "Hero 16:9", filename: "hero-16x9.png", width: 1920, height: 1080, description: "Presentation and landing page hero" },
      { id: "feature-card", label: "Feature card", filename: "feature-card.png", width: 1200, height: 900, description: "Feature block and docs hero" },
    ],
  },
  {
    id: "social",
    title: "Social Promo Pack",
    description: "Square, story, and social-card mockups for product announcements.",
    sizes: [
      { id: "social-square", label: "Social square", filename: "social-square.png", width: 1080, height: 1080, description: "Instagram/LinkedIn square post" },
      { id: "social-story", label: "Story", filename: "social-story.png", width: 1080, height: 1920, description: "Story/Reel cover" },
      { id: "social-og", label: "Social card", filename: "social-card.png", width: 1200, height: 630, description: "Open Graph style promo" },
    ],
  },
  {
    id: "app-store",
    title: "App Store Preview Pack",
    description: "Phone-first screenshots useful as a starting point for app listings.",
    sizes: [
      { id: "app-phone-portrait", label: "Phone portrait", filename: "app-phone-portrait.png", width: 1290, height: 2796, description: "Tall phone marketing screenshot" },
      { id: "app-phone-landscape", label: "Phone landscape", filename: "app-phone-landscape.png", width: 2796, height: 1290, description: "Wide phone marketing screenshot" },
      { id: "app-tablet", label: "Tablet", filename: "app-tablet.png", width: 2048, height: 2732, description: "Tablet marketing screenshot" },
    ],
  },
  {
    id: "documentation",
    title: "Documentation Pack",
    description: "Clean screenshots for docs, changelogs, guides, and README files.",
    sizes: [
      { id: "docs-wide", label: "Docs wide", filename: "docs-wide.png", width: 1440, height: 900, description: "README and documentation hero" },
      { id: "docs-card", label: "Docs card", filename: "docs-card.png", width: 1200, height: 800, description: "Inline docs illustration" },
      { id: "docs-thumbnail", label: "Thumbnail", filename: "docs-thumbnail.png", width: 800, height: 600, description: "Small guide thumbnail" },
    ],
  },
  {
    id: "complete",
    title: "Complete Mockup Kit",
    description: "Every marketing, social, app listing, and documentation output in one ZIP.",
    sizes: [
      { id: "hero-wide", label: "Hero wide", filename: "hero-wide.png", width: 1600, height: 1200, description: "Large website hero image" },
      { id: "hero-16-9", label: "Hero 16:9", filename: "hero-16x9.png", width: 1920, height: 1080, description: "Presentation and landing page hero" },
      { id: "social-square", label: "Social square", filename: "social-square.png", width: 1080, height: 1080, description: "Instagram/LinkedIn square post" },
      { id: "social-story", label: "Story", filename: "social-story.png", width: 1080, height: 1920, description: "Story/Reel cover" },
      { id: "social-og", label: "Social card", filename: "social-card.png", width: 1200, height: 630, description: "Open Graph style promo" },
      { id: "docs-wide", label: "Docs wide", filename: "docs-wide.png", width: 1440, height: 900, description: "README and documentation hero" },
      { id: "app-phone-portrait", label: "Phone portrait", filename: "app-phone-portrait.png", width: 1290, height: 2796, description: "Tall phone marketing screenshot" },
      { id: "app-tablet", label: "Tablet", filename: "app-tablet.png", width: 2048, height: 2732, description: "Tablet marketing screenshot" },
    ],
  },
];

export const QUICK_PRESETS: Array<{ id: string; title: string; description: string; patch: Partial<MockupInput> }> = [
  {
    id: "saas-hero",
    title: "SaaS landing hero",
    description: "Large laptop/browser mockup with bold launch copy.",
    patch: { device: "laptop", orientation: "landscape", exportPackId: "landing", backgroundMode: "gradient", gradientFrom: "#020617", gradientTo: "#2563eb", accentColor: "#60a5fa", title: "A cleaner way to launch your product", subtitle: "Turn raw app screenshots into polished landing-page mockups without leaving the browser.", rotate: -2, deviceScale: 88, alignment: "center" },
  },
  {
    id: "mobile-app",
    title: "Mobile app launch",
    description: "Phone-first preview for app promos and store-style screenshots.",
    patch: { device: "phone", orientation: "portrait", exportPackId: "app-store", backgroundMode: "mesh", backgroundColor: "#111827", gradientFrom: "#0f172a", gradientTo: "#ec4899", accentColor: "#f472b6", title: "Your app, ready to present", subtitle: "Create tall, clean, phone-focused screenshots for marketing and app listing drafts.", rotate: -5, deviceScale: 82, alignment: "center" },
  },
  {
    id: "docs-clean",
    title: "Documentation screenshot",
    description: "Clean browser/card frame for README and product guides.",
    patch: { device: "browser", orientation: "landscape", exportPackId: "documentation", backgroundMode: "solid", backgroundColor: "#f8fafc", foregroundColor: "#0f172a", mutedColor: "#475569", accentColor: "#2563eb", title: "Explain features with cleaner screenshots", subtitle: "Export crisp images for docs, changelogs, support articles, and README files.", rotate: 0, deviceScale: 84, showReflection: false },
  },
  {
    id: "social-announcement",
    title: "Social announcement",
    description: "Square and story outputs with stronger type and phone mockup.",
    patch: { device: "phone", orientation: "portrait", exportPackId: "social", backgroundMode: "gradient", gradientFrom: "#581c87", gradientTo: "#f97316", foregroundColor: "#ffffff", mutedColor: "#ffedd5", accentColor: "#fde047", title: "New feature is live", subtitle: "Create social cards, stories, and launch posts from one uploaded screenshot.", rotate: 4, deviceScale: 78, alignment: "center" },
  },
];

export function getSelectedExportPack(id: MockupInput["exportPackId"]): MockupExportPack {
  return EXPORT_PACKS.find((pack) => pack.id === id) ?? EXPORT_PACKS[0];
}
