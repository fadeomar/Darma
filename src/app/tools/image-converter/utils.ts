import type { ImageExportFormat, ImageFitMode, ImageOutputFormat, ImageWorkbenchPreset } from "./types";

export const OUTPUT_FORMATS: Array<{
  label: string;
  value: ImageOutputFormat;
  extension: string;
}> = [
  { label: "PNG", value: "image/png", extension: "png" },
  { label: "JPEG", value: "image/jpeg", extension: "jpg" },
  { label: "WebP", value: "image/webp", extension: "webp" },
];

export function getExtension(format: ImageOutputFormat): string {
  return OUTPUT_FORMATS.find((item) => item.value === format)?.extension ?? "png";
}

export function resolveOutputFormat(format: ImageExportFormat, originalType: string): ImageOutputFormat {
  if (format !== "original") return format;
  if (originalType === "image/png" || originalType === "image/jpeg" || originalType === "image/webp") return originalType;
  return "image/webp";
}

export function replaceExtension(filename: string, extension: string): string {
  const cleaned = filename.trim() || "converted-image";
  return cleaned.replace(/\.[^.]+$/, "") + `.${extension}`;
}

export function buildOutputFilename(filename: string, format: ImageExportFormat, originalType: string): string {
  return replaceExtension(filename, getExtension(resolveOutputFormat(format, originalType)));
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function savingsPercent(originalBytes: number, outputBytes: number): number {
  if (!Number.isFinite(originalBytes) || originalBytes <= 0 || !Number.isFinite(outputBytes)) return 0;
  return Math.round(((originalBytes - outputBytes) / originalBytes) * 100);
}

export function clampDimension(value: number, fallback: number) {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(1, Math.min(Math.round(value), 12000));
}

export function calculateResizeDimensions({
  originalWidth,
  originalHeight,
  width,
  height,
  keepAspectRatio,
  scalePercent,
}: {
  originalWidth: number;
  originalHeight: number;
  width?: number;
  height?: number;
  keepAspectRatio: boolean;
  scalePercent: number;
}) {
  const ratio = originalWidth / originalHeight || 1;
  const scaledWidth = clampDimension(originalWidth * (scalePercent / 100), originalWidth);
  const scaledHeight = clampDimension(originalHeight * (scalePercent / 100), originalHeight);
  const requestedWidth = Number(width ?? 0);
  const requestedHeight = Number(height ?? 0);

  if (requestedWidth > 0 && requestedHeight > 0) {
    if (!keepAspectRatio) {
      return {
        width: clampDimension(requestedWidth, originalWidth),
        height: clampDimension(requestedHeight, originalHeight),
      };
    }

    return {
      width: clampDimension(requestedWidth, originalWidth),
      height: clampDimension(requestedWidth / ratio, originalHeight),
    };
  }

  if (requestedWidth > 0) {
    return {
      width: clampDimension(requestedWidth, originalWidth),
      height: keepAspectRatio ? clampDimension(requestedWidth / ratio, originalHeight) : scaledHeight,
    };
  }

  if (requestedHeight > 0) {
    return {
      width: keepAspectRatio ? clampDimension(requestedHeight * ratio, originalWidth) : scaledWidth,
      height: clampDimension(requestedHeight, originalHeight),
    };
  }

  return { width: scaledWidth, height: scaledHeight };
}

export function calculateDrawRect({
  sourceWidth,
  sourceHeight,
  targetWidth,
  targetHeight,
  fitMode,
}: {
  sourceWidth: number;
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  fitMode: ImageFitMode;
}) {
  if (fitMode === "stretch") {
    return { dx: 0, dy: 0, dw: targetWidth, dh: targetHeight };
  }

  const scale = fitMode === "cover"
    ? Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
    : Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const dw = sourceWidth * scale;
  const dh = sourceHeight * scale;

  return {
    dx: (targetWidth - dw) / 2,
    dy: (targetHeight - dh) / 2,
    dw,
    dh,
  };
}

export const IMAGE_CONVERTER_PRESETS: ImageWorkbenchPreset[] = [
  {
    id: "youtube-thumbnail",
    title: "YouTube thumbnail",
    description: "1280 × 720 JPEG for video thumbnails.",
    width: 1280,
    height: 720,
    fitMode: "cover",
    format: "image/jpeg",
    quality: 0.9,
  },
  {
    id: "instagram-square",
    title: "Instagram square",
    description: "1080 × 1080 square social post.",
    width: 1080,
    height: 1080,
    fitMode: "cover",
    format: "image/jpeg",
    quality: 0.9,
  },
  {
    id: "website-hero",
    title: "Website hero",
    description: "1920 × 1080 WebP for wide landing-page imagery.",
    width: 1920,
    height: 1080,
    fitMode: "cover",
    format: "image/webp",
    quality: 0.84,
  },
  {
    id: "blog-image",
    title: "Blog article image",
    description: "1200 px wide WebP that keeps the source ratio.",
    width: 1200,
    scalePercent: 100,
    fitMode: "contain",
    format: "image/webp",
    quality: 0.82,
  },
  {
    id: "product-image",
    title: "Product catalog image",
    description: "1200 × 1200 WebP for ecommerce cards and galleries.",
    width: 1200,
    height: 1200,
    fitMode: "contain",
    format: "image/webp",
    quality: 0.88,
  },
  {
    id: "profile-picture",
    title: "Profile picture",
    description: "512 × 512 JPEG avatar export.",
    width: 512,
    height: 512,
    fitMode: "cover",
    format: "image/jpeg",
    quality: 0.9,
  },
  {
    id: "og-social-card",
    title: "Open Graph image",
    description: "1200 × 630 JPEG for link previews and social cards.",
    width: 1200,
    height: 630,
    fitMode: "cover",
    format: "image/jpeg",
    quality: 0.88,
  },
  {
    id: "linkedin-post",
    title: "LinkedIn post",
    description: "1200 × 627 JPEG for feed graphics and announcements.",
    width: 1200,
    height: 627,
    fitMode: "cover",
    format: "image/jpeg",
    quality: 0.88,
  },
  {
    id: "story-portrait",
    title: "Story / Reel cover",
    description: "1080 × 1920 portrait export for story-style content.",
    width: 1080,
    height: 1920,
    fitMode: "cover",
    format: "image/jpeg",
    quality: 0.88,
  },
  {
    id: "email-banner",
    title: "Email banner",
    description: "1200 × 600 lightweight JPEG for newsletters.",
    width: 1200,
    height: 600,
    fitMode: "cover",
    format: "image/jpeg",
    quality: 0.76,
  },
  {
    id: "docs-screenshot",
    title: "Documentation screenshot",
    description: "1440 px wide lossless PNG for product and API docs.",
    width: 1440,
    fitMode: "contain",
    format: "image/png",
  },
  {
    id: "ui-asset-png",
    title: "UI asset / transparency",
    description: "Keep dimensions and export lossless PNG with transparency.",
    scalePercent: 100,
    fitMode: "contain",
    format: "image/png",
  },
  {
    id: "retina-half-size",
    title: "2× asset to 1×",
    description: "Scale a retina screenshot or design export down to 50%.",
    scalePercent: 50,
    fitMode: "contain",
    format: "image/webp",
    quality: 0.88,
  },
  {
    id: "mobile-card",
    title: "Mobile card image",
    description: "720 px wide WebP for mobile-first card layouts.",
    width: 720,
    fitMode: "contain",
    format: "image/webp",
    quality: 0.8,
  },
  {
    id: "marketplace-thumbnail",
    title: "Marketplace thumbnail",
    description: "800 × 800 WebP for compact listing grids.",
    width: 800,
    height: 800,
    fitMode: "contain",
    format: "image/webp",
    quality: 0.84,
  },
  {
    id: "compress-website",
    title: "Compress for website",
    description: "Keep dimensions and export efficient WebP.",
    scalePercent: 100,
    fitMode: "contain",
    format: "image/webp",
    quality: 0.74,
  },
  {
    id: "small-email",
    title: "Small email attachment",
    description: "800 px wide lightweight JPEG for email and support tickets.",
    width: 800,
    fitMode: "contain",
    format: "image/jpeg",
    quality: 0.72,
  },
  {
    id: "legacy-jpeg",
    title: "Compatibility JPEG",
    description: "Keep dimensions and export a broadly compatible JPEG.",
    scalePercent: 100,
    fitMode: "contain",
    format: "image/jpeg",
    quality: 0.86,
  },
];
