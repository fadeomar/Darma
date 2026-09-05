import type { CompressionPreset, OutputFormat } from "./types";

// ─── Compression quality presets ───────────────────────────────────────────

export type PresetConfig = {
  id: CompressionPreset;
  label: string;
  quality: number;
  description: string;
};

export const COMPRESSION_PRESETS: PresetConfig[] = [
  { id: "best", label: "Best quality", quality: 0.92, description: "Minimal compression, highest fidelity" },
  { id: "balanced", label: "Balanced", quality: 0.78, description: "Good quality with solid savings" },
  { id: "small", label: "Small file", quality: 0.62, description: "Smaller file, visible compression" },
  { id: "tiny", label: "Tiny size", quality: 0.45, description: "Maximum compression, smallest output" },
];

// ─── Quick use-case presets ─────────────────────────────────────────────────

export type QuickPresetSettings = {
  quality?: number;
  outputFormat?: OutputFormat;
  targetWidth?: string;
  targetHeight?: string;
  keepAspectRatio?: boolean;
  doNotEnlarge?: boolean;
  targetFileSizeEnabled?: boolean;
  targetFileSizeKB?: string;
};

export type QuickPresetConfig = {
  id: string;
  label: string;
  description: string;
  note?: string;
  settings: QuickPresetSettings;
};

export const QUICK_PRESETS: QuickPresetConfig[] = [
  {
    id: "document-upload",
    label: "Document upload",
    description: "Under 500 KB for forms, email, and portals",
    settings: { targetFileSizeEnabled: true, targetFileSizeKB: "500", outputFormat: "image/webp", targetWidth: "1600", targetHeight: "", keepAspectRatio: true, quality: 0.78 },
  },
  {
    id: "chat-sharing",
    label: "Chat sharing",
    description: "Fast 1200px WebP for WhatsApp/DM previews",
    settings: { targetWidth: "1200", targetHeight: "", keepAspectRatio: true, outputFormat: "image/webp", quality: 0.72, targetFileSizeEnabled: true, targetFileSizeKB: "300" },
  },
  {
    id: "web-image",
    label: "Web image",
    description: "1600px wide WebP for fast landing pages",
    settings: { targetWidth: "1600", targetHeight: "", keepAspectRatio: true, outputFormat: "image/webp", quality: 0.78, targetFileSizeEnabled: false },
  },
  {
    id: "blog-cover",
    label: "Blog cover",
    description: "1200 × 675 JPEG for articles and previews",
    note: "Exact resize; use a prepared 16:9 source to avoid distortion.",
    settings: { targetWidth: "1200", targetHeight: "675", keepAspectRatio: false, outputFormat: "image/jpeg", quality: 0.82, targetFileSizeEnabled: false },
  },
  {
    id: "youtube-thumbnail",
    label: "YouTube thumbnail",
    description: "1280 × 720 optimized video thumbnail",
    note: "Exact resize; use a prepared 16:9 source to avoid distortion.",
    settings: { targetWidth: "1280", targetHeight: "720", keepAspectRatio: false, outputFormat: "image/jpeg", quality: 0.82, targetFileSizeEnabled: false },
  },
  {
    id: "instagram-square",
    label: "Instagram square",
    description: "1080 × 1080 social post export",
    note: "Exact resize; start from a square crop for best results.",
    settings: { targetWidth: "1080", targetHeight: "1080", keepAspectRatio: false, outputFormat: "image/jpeg", quality: 0.82, targetFileSizeEnabled: false },
  },
  {
    id: "profile-picture",
    label: "Profile picture",
    description: "512 × 512 avatar export",
    note: "Exact resize; crop the subject first when needed.",
    settings: { targetWidth: "512", targetHeight: "512", keepAspectRatio: false, outputFormat: "image/webp", quality: 0.85, targetFileSizeEnabled: false },
  },
  {
    id: "product-card",
    label: "Product card",
    description: "900px WebP for ecommerce cards and catalogs",
    settings: { targetWidth: "900", targetHeight: "", keepAspectRatio: true, outputFormat: "image/webp", quality: 0.8, targetFileSizeEnabled: true, targetFileSizeKB: "250" },
  },
  {
    id: "support-ticket",
    label: "Support ticket",
    description: "Readable screenshot under 1 MB for help desks",
    settings: { targetWidth: "1600", targetHeight: "", keepAspectRatio: true, outputFormat: "image/jpeg", quality: 0.8, targetFileSizeEnabled: true, targetFileSizeKB: "1024" },
  },
  {
    id: "email-attachment",
    label: "Email attachment",
    description: "1200px JPEG under 750 KB for reliable sending",
    settings: { targetWidth: "1200", targetHeight: "", keepAspectRatio: true, outputFormat: "image/jpeg", quality: 0.76, targetFileSizeEnabled: true, targetFileSizeKB: "750" },
  },
  {
    id: "portfolio-full",
    label: "Portfolio image",
    description: "1920px WebP with higher visual quality",
    settings: { targetWidth: "1920", targetHeight: "", keepAspectRatio: true, outputFormat: "image/webp", quality: 0.86, targetFileSizeEnabled: false },
  },
  {
    id: "mobile-web",
    label: "Mobile web",
    description: "960px WebP tuned for smaller screens",
    settings: { targetWidth: "960", targetHeight: "", keepAspectRatio: true, outputFormat: "image/webp", quality: 0.72, targetFileSizeEnabled: true, targetFileSizeKB: "220" },
  },
  {
    id: "og-card",
    label: "Open Graph card",
    description: "1200 × 630 JPEG for shared links",
    note: "Exact resize; prepare the composition at 1.91:1 when possible.",
    settings: { targetWidth: "1200", targetHeight: "630", keepAspectRatio: false, outputFormat: "image/jpeg", quality: 0.84, targetFileSizeEnabled: false },
  },
  {
    id: "story-cover",
    label: "Story cover",
    description: "1080 × 1920 portrait social export",
    note: "Exact resize; start from a portrait crop.",
    settings: { targetWidth: "1080", targetHeight: "1920", keepAspectRatio: false, outputFormat: "image/jpeg", quality: 0.82, targetFileSizeEnabled: false },
  },
  {
    id: "cms-thumbnail",
    label: "CMS thumbnail",
    description: "640px WebP for admin lists and media libraries",
    settings: { targetWidth: "640", targetHeight: "", keepAspectRatio: true, outputFormat: "image/webp", quality: 0.74, targetFileSizeEnabled: true, targetFileSizeKB: "150" },
  },
  {
    id: "archive-quality",
    label: "Archive quality",
    description: "Keep dimensions with minimal JPEG compression",
    settings: { targetWidth: "", targetHeight: "", keepAspectRatio: true, outputFormat: "image/jpeg", quality: 0.92, targetFileSizeEnabled: false },
  },
  {
    id: "tiny-preview",
    label: "Tiny preview",
    description: "480px WebP for placeholders and compact previews",
    settings: { targetWidth: "480", targetHeight: "", keepAspectRatio: true, outputFormat: "image/webp", quality: 0.62, targetFileSizeEnabled: true, targetFileSizeKB: "100" },
  },
  {
    id: "form-200kb",
    label: "Strict 200 KB form",
    description: "Aggressive WebP target for constrained portals",
    settings: { targetWidth: "1200", targetHeight: "", keepAspectRatio: true, outputFormat: "image/webp", quality: 0.7, targetFileSizeEnabled: true, targetFileSizeKB: "200" },
  },
];
