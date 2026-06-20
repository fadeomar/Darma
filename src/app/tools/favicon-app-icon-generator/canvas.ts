import type { FaviconInput, SourceImageMeta } from "./types";

const SVG_EVENT_HANDLER_PATTERN = /\son[a-z]+\s*=/i;
const SCRIPT_TAG_PATTERN = /<\s*script[\s>]/i;

export function isSafeSvgMarkup(svg: string): boolean {
  const trimmed = svg.trim();
  return trimmed.startsWith("<svg") && !SCRIPT_TAG_PATTERN.test(trimmed) && !SVG_EVENT_HANDLER_PATTERN.test(trimmed) && !/javascript:/i.test(trimmed);
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function normalizeHexColor(color: string, fallback = "#000000") {
  const value = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

export async function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image source."));
    image.decoding = "async";
    image.src = dataUrl;
  });
}

export async function readSourceImageMeta(dataUrl: string, file?: File): Promise<SourceImageMeta> {
  const image = await loadImageFromDataUrl(dataUrl);
  return {
    width: image.naturalWidth,
    height: image.naturalHeight,
    type: file?.type || "image",
    name: file?.name,
  };
}

function withIconClip(ctx: CanvasRenderingContext2D, size: number, input: FaviconInput) {
  if (input.shape === "square") {
    ctx.rect(0, 0, size, size);
    return;
  }

  if (input.shape === "circle") {
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    return;
  }

  const radiusPercent = input.shape === "squircle" ? 34 : input.borderRadius;
  const radius = Math.max(0, Math.min(size / 2, (size * radiusPercent) / 100));
  roundedRect(ctx, 0, 0, size, size, radius);
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const normalizedRadius = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + normalizedRadius, y);
  ctx.lineTo(x + width - normalizedRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + normalizedRadius);
  ctx.lineTo(x + width, y + height - normalizedRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - normalizedRadius, y + height);
  ctx.lineTo(x + normalizedRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - normalizedRadius);
  ctx.lineTo(x, y + normalizedRadius);
  ctx.quadraticCurveTo(x, y, x + normalizedRadius, y);
}

function drawCheckerboard(ctx: CanvasRenderingContext2D, size: number) {
  const tile = Math.max(8, Math.round(size / 16));
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#e2e8f0";
  for (let y = 0; y < size; y += tile) {
    for (let x = 0; x < size; x += tile) {
      if ((x / tile + y / tile) % 2 === 0) ctx.fillRect(x, y, tile, tile);
    }
  }
}

function fitImage(image: HTMLImageElement, target: { x: number; y: number; width: number; height: number }, mode: FaviconInput["cropMode"]) {
  const sourceWidth = image.naturalWidth || image.width || 1;
  const sourceHeight = image.naturalHeight || image.height || 1;
  const imageRatio = sourceWidth / sourceHeight;
  const targetRatio = target.width / target.height;

  let drawWidth = target.width;
  let drawHeight = target.height;

  if (mode === "contain") {
    if (imageRatio > targetRatio) {
      drawHeight = target.width / imageRatio;
    } else {
      drawWidth = target.height * imageRatio;
    }
  } else if (imageRatio > targetRatio) {
    drawWidth = target.height * imageRatio;
  } else {
    drawHeight = target.width / imageRatio;
  }

  return {
    x: target.x + (target.width - drawWidth) / 2,
    y: target.y + (target.height - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  };
}

function fitTextFontSize(ctx: CanvasRenderingContext2D, text: string, input: FaviconInput, maxWidth: number, maxHeight: number) {
  let size = maxHeight * 0.78 * (input.scale / 100);
  const fontWeight = input.fontWeight || 800;

  for (let i = 0; i < 24; i += 1) {
    ctx.font = `${fontWeight} ${size}px ${input.fontFamily}`;
    const metrics = ctx.measureText(text);
    if (metrics.width <= maxWidth && size <= maxHeight) return size;
    size *= 0.9;
  }

  return Math.max(8, size);
}

export async function renderIconPng(input: FaviconInput, size: number, options?: { checkerboard?: boolean; maskablePadding?: boolean; monochrome?: boolean }): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  ctx.clearRect(0, 0, size, size);
  if (options?.checkerboard) drawCheckerboard(ctx, size);

  ctx.save();
  ctx.beginPath();
  withIconClip(ctx, size, input);
  ctx.closePath();

  if (!input.transparentBackground || options?.monochrome) {
    ctx.fillStyle = options?.monochrome ? "#000000" : normalizeHexColor(input.backgroundColor, "#0f172a");
    ctx.fill();
  }

  ctx.clip();

  const safeExtra = options?.maskablePadding ? 10 : 0;
  const padding = Math.max(0, Math.min(45, input.padding + safeExtra));
  const inset = (size * padding) / 100;
  const contentBox = {
    x: inset,
    y: inset,
    width: Math.max(1, size - inset * 2),
    height: Math.max(1, size - inset * 2),
  };

  if (input.sourceMode === "image" && input.imageDataUrl) {
    const image = await loadImageFromDataUrl(input.imageDataUrl);
    const rect = fitImage(image, contentBox, input.cropMode);
    const centeredScale = input.scale / 100;
    const scaled = {
      width: rect.width * centeredScale,
      height: rect.height * centeredScale,
    };
    ctx.drawImage(image, rect.x + (rect.width - scaled.width) / 2, rect.y + (rect.height - scaled.height) / 2, scaled.width, scaled.height);
  } else if (input.sourceMode === "svg" && isSafeSvgMarkup(input.svgText)) {
    const image = await loadImageFromDataUrl(svgToDataUrl(input.svgText));
    const rect = fitImage(image, contentBox, input.cropMode);
    const centeredScale = input.scale / 100;
    const scaled = { width: rect.width * centeredScale, height: rect.height * centeredScale };
    ctx.drawImage(image, rect.x + (rect.width - scaled.width) / 2, rect.y + (rect.height - scaled.height) / 2, scaled.width, scaled.height);
  } else {
    const value = input.sourceMode === "emoji" ? input.emoji || "✨" : input.text || "D";
    ctx.fillStyle = options?.monochrome ? "#ffffff" : normalizeHexColor(input.foregroundColor, "#ffffff");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fontSize = fitTextFontSize(ctx, value, input, contentBox.width, contentBox.height);
    ctx.font = `${input.fontWeight || 800} ${fontSize}px ${input.fontFamily}`;
    ctx.fillText(value, size / 2, size / 2 + fontSize * 0.025);
  }

  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not export PNG."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

export async function renderIconDataUrl(input: FaviconInput, size: number, options?: { checkerboard?: boolean; maskablePadding?: boolean; monochrome?: boolean }): Promise<string> {
  const blob = await renderIconPng(input, size, options);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read generated PNG."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(blob);
  });
}

export function createPreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
