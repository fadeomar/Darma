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
    description: "Under 500 KB — great for emails and forms",
    settings: {
      targetFileSizeEnabled: true,
      targetFileSizeKB: "500",
      outputFormat: "image/webp",
      targetWidth: "1600",
      targetHeight: "",
      keepAspectRatio: true,
      quality: 0.78,
    },
  },
  {
    id: "youtube-thumbnail",
    label: "YouTube thumbnail",
    description: "1280 × 720, optimized for video",
    note: "This preset resizes the image. Cropping will be added in a later phase.",
    settings: {
      targetWidth: "1280",
      targetHeight: "720",
      keepAspectRatio: false,
      outputFormat: "image/jpeg",
      quality: 0.82,
      targetFileSizeEnabled: false,
    },
  },
  {
    id: "instagram-square",
    label: "Instagram square",
    description: "1080 × 1080 social post",
    note: "This preset resizes the image. Cropping will be added in a later phase.",
    settings: {
      targetWidth: "1080",
      targetHeight: "1080",
      keepAspectRatio: false,
      outputFormat: "image/jpeg",
      quality: 0.82,
      targetFileSizeEnabled: false,
    },
  },
  {
    id: "profile-picture",
    label: "Profile picture",
    description: "512 × 512 avatar export",
    note: "This preset resizes the image. Cropping will be added in a later phase.",
    settings: {
      targetWidth: "512",
      targetHeight: "512",
      keepAspectRatio: false,
      outputFormat: "image/webp",
      quality: 0.85,
      targetFileSizeEnabled: false,
    },
  },
  {
    id: "web-image",
    label: "Web image",
    description: "1600 px wide, WebP for fast pages",
    settings: {
      targetWidth: "1600",
      targetHeight: "",
      keepAspectRatio: true,
      outputFormat: "image/webp",
      quality: 0.78,
      targetFileSizeEnabled: false,
    },
  },
];
