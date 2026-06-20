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
    description: "1280 x 720 export for video thumbnails.",
    width: 1280,
    height: 720,
    fitMode: "cover",
    format: "image/jpeg",
    quality: 0.9,
  },
  {
    id: "instagram-square",
    title: "Instagram square",
    description: "1080 x 1080 square post.",
    width: 1080,
    height: 1080,
    fitMode: "cover",
    format: "image/jpeg",
    quality: 0.9,
  },
  {
    id: "website-hero",
    title: "Website hero image",
    description: "Wide 1920 x 1080 hero image.",
    width: 1920,
    height: 1080,
    fitMode: "cover",
    format: "image/webp",
    quality: 0.84,
  },
  {
    id: "blog-image",
    title: "Blog image",
    description: "1200 px wide article image.",
    width: 1200,
    scalePercent: 100,
    fitMode: "contain",
    format: "image/webp",
    quality: 0.82,
  },
  {
    id: "product-image",
    title: "Product image",
    description: "1200 x 1200 product catalog image.",
    width: 1200,
    height: 1200,
    fitMode: "contain",
    format: "image/webp",
    quality: 0.88,
  },
  {
    id: "profile-picture",
    title: "Profile picture",
    description: "512 x 512 avatar export.",
    width: 512,
    height: 512,
    fitMode: "cover",
    format: "image/jpeg",
    quality: 0.9,
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
    title: "Small image for email",
    description: "800 px wide lightweight JPEG.",
    width: 800,
    fitMode: "contain",
    format: "image/jpeg",
    quality: 0.72,
  },
];
