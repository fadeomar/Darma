import type { OgImageInput, OgTemplateId } from "./types";

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image."));
    image.src = src;
  });
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "").trim();
  const full = normalized.length === 3 ? normalized.split("").map((char) => char + char).join("") : normalized.padEnd(6, "0").slice(0, 6);
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawImageCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (image.naturalWidth - sw) / 2;
  const sy = (image.naturalHeight - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function drawPattern(ctx: CanvasRenderingContext2D, input: OgImageInput, width: number, height: number) {
  const alpha = Math.min(Math.max(input.patternIntensity, 0), 100) / 100;
  ctx.save();
  ctx.strokeStyle = hexToRgba(input.accentColor, alpha * 0.34);
  ctx.lineWidth = 2;
  const gap = 42;
  for (let x = -height; x < width + height; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, height + 20);
    ctx.lineTo(x + height, -20);
    ctx.stroke();
  }
  ctx.fillStyle = hexToRgba(input.foregroundColor, alpha * 0.08);
  for (let x = 70; x < width; x += 170) {
    for (let y = 80; y < height; y += 130) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D, input: OgImageInput, width: number, height: number, backgroundImage?: HTMLImageElement) {
  if (input.backgroundMode === "gradient") {
    const radians = (input.gradientAngle * Math.PI) / 180;
    const x = Math.cos(radians) * width;
    const y = Math.sin(radians) * height;
    const gradient = ctx.createLinearGradient(width / 2 - x / 2, height / 2 - y / 2, width / 2 + x / 2, height / 2 + y / 2);
    gradient.addColorStop(0, input.gradientFrom);
    gradient.addColorStop(1, input.gradientTo);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  ctx.fillStyle = input.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  if (input.backgroundMode === "image" && backgroundImage) {
    drawImageCover(ctx, backgroundImage, 0, 0, width, height);
    ctx.fillStyle = hexToRgba(input.backgroundColor, Math.min(Math.max(input.imageOverlay, 0), 95) / 100);
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (input.backgroundMode === "pattern") drawPattern(ctx, input, width, height);
}

function resolveTextBox(input: OgImageInput, width: number, height: number) {
  const marginX = Math.max(72, Math.round(width * 0.075));
  const marginY = Math.max(60, Math.round(height * 0.1));
  const centered = input.textAlign === "center";
  const isSquare = width === height;
  const boxWidth = centered ? width - marginX * 2 : Math.round(width * (isSquare ? 0.78 : 0.68));
  return {
    x: centered ? marginX : marginX,
    y: marginY,
    width: boxWidth,
    centerX: width / 2,
  };
}

function lineHeight(fontSize: number) {
  return Math.round(fontSize * 1.12);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
      return;
    }
    lines.push(current);
    current = word;
  });
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  const last = visible[visible.length - 1] ?? "";
  visible[visible.length - 1] = last.length > 3 ? `${last.replace(/[,.!?:;—-]+$/, "")}…` : last;
  return visible;
}

function setFont(ctx: CanvasRenderingContext2D, size: number, weight = 800) {
  ctx.font = `${weight} ${size}px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
}

function drawBadge(ctx: CanvasRenderingContext2D, input: OgImageInput, x: number, y: number, maxWidth: number, align: CanvasTextAlign): number {
  if (!input.badge.trim()) return y;
  setFont(ctx, input.badgeSize, 800);
  const text = input.badge.trim().toUpperCase();
  const metrics = ctx.measureText(text);
  const paddingX = 22;
  const height = Math.round(input.badgeSize * 1.95);
  const width = Math.min(metrics.width + paddingX * 2, maxWidth);
  const bx = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
  roundedRect(ctx, bx, y, width, height, height / 2);
  ctx.fillStyle = hexToRgba(input.accentColor, 0.18);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(input.accentColor, 0.8);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = input.foregroundColor;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + height / 2 + 1, width - paddingX * 2);
  return y + height + 28;
}

function drawFooter(ctx: CanvasRenderingContext2D, input: OgImageInput, width: number, height: number) {
  const footer = [input.domain.trim(), input.author.trim(), input.callToAction.trim()].filter(Boolean).join("  •  ");
  if (!footer) return;
  setFont(ctx, Math.max(22, Math.round(height * 0.038)), 700);
  ctx.fillStyle = input.mutedColor;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = input.textAlign === "right" ? "right" : input.textAlign === "center" ? "center" : "left";
  const x = input.textAlign === "right" ? width - 80 : input.textAlign === "center" ? width / 2 : 80;
  ctx.fillText(footer, x, height - 62, width - 160);
}

function drawLogo(ctx: CanvasRenderingContext2D, input: OgImageInput, width: number, height: number, logo?: HTMLImageElement) {
  if (!logo || input.logoPosition === "none") return;
  const size = Math.max(64, Math.round(Math.min(width, height) * 0.12));
  const margin = Math.max(52, Math.round(Math.min(width, height) * 0.07));
  const x = input.logoPosition.includes("right") ? width - margin - size : margin;
  const y = input.logoPosition.includes("bottom") ? height - margin - size : margin;
  ctx.save();
  roundedRect(ctx, x, y, size, size, Math.round(size * 0.26));
  ctx.fillStyle = hexToRgba(input.foregroundColor, 0.1);
  ctx.fill();
  ctx.clip();
  drawImageCover(ctx, logo, x, y, size, size);
  ctx.restore();
}

function templateDecor(ctx: CanvasRenderingContext2D, input: OgImageInput, width: number, height: number, templateId: OgTemplateId) {
  ctx.save();
  if (templateId === "terminal") {
    const x = Math.round(width * 0.07);
    const y = Math.round(height * 0.12);
    const w = Math.round(width * 0.86);
    const h = Math.round(height * 0.76);
    roundedRect(ctx, x, y, w, h, 28);
    ctx.fillStyle = hexToRgba("#020617", 0.72);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(input.accentColor, 0.32);
    ctx.stroke();
    [0, 1, 2].forEach((index) => {
      ctx.beginPath();
      ctx.fillStyle = index === 0 ? "#fb7185" : index === 1 ? "#facc15" : "#34d399";
      ctx.arc(x + 35 + index * 28, y + 34, 8, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (templateId === "minimal-saas" || templateId === "documentation") {
    ctx.fillStyle = hexToRgba(input.accentColor, 0.18);
    ctx.beginPath();
    ctx.arc(width * 0.9, height * 0.18, width * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexToRgba(input.foregroundColor, 0.05);
    roundedRect(ctx, width * 0.58, height * 0.18, width * 0.34, height * 0.52, 34);
    ctx.fill();
  }

  if (templateId === "announcement" || templateId === "product-launch") {
    ctx.strokeStyle = hexToRgba(input.accentColor, 0.36);
    ctx.lineWidth = 8;
    roundedRect(ctx, 38, 38, width - 76, height - 76, input.frameRadius);
    ctx.stroke();
  }

  if (templateId === "portfolio") {
    ctx.fillStyle = hexToRgba(input.accentColor, 0.2);
    roundedRect(ctx, width * 0.62, height * 0.16, width * 0.25, height * 0.58, 42);
    ctx.fill();
  }
  ctx.restore();
}

export async function renderOgImagePng(input: OgImageInput, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");

  const [backgroundImage, logo] = await Promise.all([
    input.backgroundImageDataUrl ? loadImage(input.backgroundImageDataUrl).catch(() => undefined) : Promise.resolve(undefined),
    input.logoDataUrl ? loadImage(input.logoDataUrl).catch(() => undefined) : Promise.resolve(undefined),
  ]);

  drawBackground(ctx, input, width, height, backgroundImage);
  templateDecor(ctx, input, width, height, input.templateId);
  drawLogo(ctx, input, width, height, logo);

  const textBox = resolveTextBox(input, width, height);
  const align: CanvasTextAlign = input.textAlign === "right" ? "right" : input.textAlign === "center" ? "center" : "left";
  const textX = align === "center" ? width / 2 : align === "right" ? width - textBox.x : textBox.x;
  let y = textBox.y + (input.templateId === "terminal" ? 78 : input.logoPosition.includes("top") && input.logoPosition !== "none" ? 112 : 22);
  y = drawBadge(ctx, input, textX, y, textBox.width, align);

  setFont(ctx, input.titleSize, 900);
  ctx.fillStyle = input.foregroundColor;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  const titleLines = wrapText(ctx, input.title || "Your social preview title", textBox.width, width === height ? 4 : 3);
  titleLines.forEach((line) => {
    ctx.fillText(line, textX, y, textBox.width);
    y += lineHeight(input.titleSize);
  });

  if (input.subtitle.trim()) {
    y += 18;
    setFont(ctx, input.subtitleSize, 600);
    ctx.fillStyle = input.mutedColor;
    wrapText(ctx, input.subtitle, textBox.width, width === height ? 4 : 3).forEach((line) => {
      ctx.fillText(line, textX, y, textBox.width);
      y += lineHeight(input.subtitleSize);
    });
  }

  if (input.safeArea) {
    ctx.save();
    ctx.strokeStyle = hexToRgba(input.foregroundColor, 0.16);
    ctx.setLineDash([14, 12]);
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 44, width - 120, height - 88);
    ctx.restore();
  }

  drawFooter(ctx, input, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Unable to export PNG."));
    }, "image/png", 0.94);
  });
}
