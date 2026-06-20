import type { MockupDevice, MockupInput, MockupShadowStyle } from "./types";

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export async function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image."));
    image.crossOrigin = "anonymous";
    image.src = dataUrl;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace(/^#/, "");
  const full = normalized.length === 3 ? normalized.split("").map((char) => `${char}${char}`).join("") : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function colorWithAlpha(hex: string, alpha: number) {
  const rgb = hexToRgb(hex) ?? { r: 15, g: 23, b: 42 };
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function drawCoverImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number, fitMode: "cover" | "contain", fill = "#0f172a") {
  const scale = fitMode === "cover" ? Math.max(width / image.width, height / image.height) : Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  if (fitMode === "contain") {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, width, height);
  }
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawBackground(ctx: CanvasRenderingContext2D, input: MockupInput, width: number, height: number, backgroundImage?: HTMLImageElement) {
  if (input.backgroundMode === "solid") {
    ctx.fillStyle = input.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (input.backgroundMode === "image" && backgroundImage) {
    drawCoverImage(ctx, backgroundImage, 0, 0, width, height, "cover");
    ctx.fillStyle = "rgba(2, 6, 23, 0.36)";
    ctx.fillRect(0, 0, width, height);
    return;
  }

  const radians = (input.gradientAngle * Math.PI) / 180;
  const cx = width / 2;
  const cy = height / 2;
  const length = Math.sqrt(width * width + height * height);
  const x0 = cx - Math.cos(radians) * length / 2;
  const y0 = cy - Math.sin(radians) * length / 2;
  const x1 = cx + Math.cos(radians) * length / 2;
  const y1 = cy + Math.sin(radians) * length / 2;
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  gradient.addColorStop(0, input.gradientFrom);
  gradient.addColorStop(1, input.gradientTo);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  if (input.backgroundMode === "mesh") {
    const blobs = [
      { x: width * 0.2, y: height * 0.22, r: Math.max(width, height) * 0.32, color: input.accentColor, alpha: 0.38 },
      { x: width * 0.82, y: height * 0.18, r: Math.max(width, height) * 0.22, color: input.foregroundColor, alpha: 0.13 },
      { x: width * 0.74, y: height * 0.82, r: Math.max(width, height) * 0.36, color: input.gradientTo, alpha: 0.44 },
    ];
    for (const blob of blobs) {
      const radial = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
      radial.addColorStop(0, colorWithAlpha(blob.color, blob.alpha));
      radial.addColorStop(1, colorWithAlpha(blob.color, 0));
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);
    }
  }
}

function getAspect(device: MockupDevice, orientation: MockupInput["orientation"]) {
  const portrait: Record<MockupDevice, number> = {
    phone: 9 / 19.5,
    tablet: 3 / 4,
    laptop: 16 / 10,
    desktop: 16 / 10,
    browser: 16 / 10,
    card: 16 / 10,
  };
  const aspect = portrait[device];
  return orientation === "landscape" ? 1 / aspect : aspect;
}

function getFrameRadius(device: MockupDevice, base: number) {
  if (device === "phone") return Math.max(base, 44);
  if (device === "tablet") return Math.max(base, 30);
  if (device === "laptop" || device === "desktop" || device === "browser") return Math.max(base, 22);
  return base;
}

function getChromeSizes(device: MockupDevice, frameWidth: number) {
  if (device === "phone") return { top: Math.max(32, frameWidth * 0.08), bezel: Math.max(12, frameWidth * 0.035), bottom: Math.max(10, frameWidth * 0.035) };
  if (device === "tablet") return { top: Math.max(24, frameWidth * 0.04), bezel: Math.max(16, frameWidth * 0.035), bottom: Math.max(16, frameWidth * 0.035) };
  if (device === "browser") return { top: Math.max(42, frameWidth * 0.055), bezel: Math.max(10, frameWidth * 0.015), bottom: Math.max(10, frameWidth * 0.015) };
  if (device === "laptop") return { top: Math.max(44, frameWidth * 0.04), bezel: Math.max(12, frameWidth * 0.015), bottom: Math.max(36, frameWidth * 0.04) };
  if (device === "desktop") return { top: Math.max(46, frameWidth * 0.04), bezel: Math.max(14, frameWidth * 0.016), bottom: Math.max(24, frameWidth * 0.026) };
  return { top: 0, bezel: 0, bottom: 0 };
}

function setShadow(ctx: CanvasRenderingContext2D, shadow: MockupShadowStyle, width: number) {
  if (shadow === "none") {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    return;
  }
  ctx.shadowColor = "rgba(2, 6, 23, 0.35)";
  ctx.shadowBlur = shadow === "soft" ? width * 0.03 : shadow === "deep" ? width * 0.055 : width * 0.075;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = shadow === "soft" ? width * 0.015 : shadow === "deep" ? width * 0.03 : width * 0.045;
}

function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function calculateFrame(input: MockupInput, width: number, height: number) {
  const topText = input.showText ? height * 0.23 : height * 0.08;
  const footerSpace = input.showFooter ? height * 0.08 : height * 0.04;
  const availableWidth = width - input.padding * 2;
  const availableHeight = height - topText - footerSpace - input.padding * 0.5;
  const aspect = getAspect(input.device, input.orientation);
  const scale = clamp(input.deviceScale, 35, 115) / 100;
  let frameWidth = availableWidth * scale;
  let frameHeight = frameWidth / aspect;
  if (frameHeight > availableHeight * scale) {
    frameHeight = availableHeight * scale;
    frameWidth = frameHeight * aspect;
  }
  const maxWidth = width - input.padding * 1.25;
  if (frameWidth > maxWidth) {
    frameWidth = maxWidth;
    frameHeight = frameWidth / aspect;
  }
  const alignmentOffset = input.alignment === "left" ? -availableWidth * 0.18 : input.alignment === "right" ? availableWidth * 0.18 : 0;
  const x = width / 2 - frameWidth / 2 + alignmentOffset;
  const y = topText + (availableHeight - frameHeight) / 2;
  return { x, y, width: frameWidth, height: frameHeight };
}

function drawDeviceChrome(ctx: CanvasRenderingContext2D, input: MockupInput, frame: { x: number; y: number; width: number; height: number }) {
  if (!input.showDeviceChrome || input.device === "card") return;
  const radius = getFrameRadius(input.device, input.frameRadius);
  const chrome = getChromeSizes(input.device, frame.width);

  if (input.device === "phone" || input.device === "tablet") {
    ctx.fillStyle = "#0b1220";
    roundedRect(ctx, frame.x, frame.y, frame.width, frame.height, radius);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundedRect(ctx, frame.x + 5, frame.y + 5, frame.width - 10, frame.height - 10, Math.max(8, radius - 5));
    ctx.fill();
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    const notchWidth = input.device === "phone" ? frame.width * 0.32 : frame.width * 0.12;
    const notchHeight = input.device === "phone" ? chrome.top * 0.36 : chrome.top * 0.32;
    roundedRect(ctx, frame.x + frame.width / 2 - notchWidth / 2, frame.y + chrome.top * 0.28, notchWidth, notchHeight, notchHeight / 2);
    ctx.fill();
    return;
  }

  ctx.fillStyle = "rgba(15, 23, 42, 0.98)";
  roundedRect(ctx, frame.x, frame.y, frame.width, frame.height, radius);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundedRect(ctx, frame.x + 4, frame.y + 4, frame.width - 8, chrome.top + chrome.bezel, Math.max(10, radius - 8));
  ctx.fill();

  const dotY = frame.y + chrome.top * 0.48;
  ["#ef4444", "#f59e0b", "#22c55e"].forEach((color, index) => {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(frame.x + chrome.bezel + 18 + index * 22, dotY, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  if (input.device === "browser" && input.browserUrl) {
    const addressX = frame.x + chrome.bezel + 92;
    const addressW = Math.max(90, frame.width - chrome.bezel * 2 - 116);
    const addressH = Math.max(22, chrome.top * 0.46);
    ctx.fillStyle = "rgba(255,255,255,0.11)";
    roundedRect(ctx, addressX, frame.y + chrome.top * 0.25, addressW, addressH, addressH / 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `${Math.max(10, Math.min(15, frame.width * 0.016))}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.textBaseline = "middle";
    ctx.fillText(input.browserUrl.replace(/^https?:\/\//, ""), addressX + 14, frame.y + chrome.top * 0.48, addressW - 24);
  }
}

function getScreenRect(input: MockupInput, frame: { x: number; y: number; width: number; height: number }) {
  if (!input.showDeviceChrome || input.device === "card") {
    const inset = input.device === "card" ? 0 : Math.max(8, frame.width * 0.015);
    return { x: frame.x + inset, y: frame.y + inset, width: frame.width - inset * 2, height: frame.height - inset * 2, radius: input.frameRadius };
  }
  const chrome = getChromeSizes(input.device, frame.width);
  const inset = chrome.bezel;
  if (input.device === "phone" || input.device === "tablet") {
    return { x: frame.x + inset, y: frame.y + chrome.top, width: frame.width - inset * 2, height: frame.height - chrome.top - chrome.bottom, radius: Math.max(16, getFrameRadius(input.device, input.frameRadius) - inset) };
  }
  return { x: frame.x + inset, y: frame.y + chrome.top + inset, width: frame.width - inset * 2, height: frame.height - chrome.top - chrome.bottom - inset * 1.5, radius: Math.max(8, input.frameRadius * 0.55) };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function drawTextLayer(ctx: CanvasRenderingContext2D, input: MockupInput, width: number, height: number) {
  if (!input.showText) return;
  const maxWidth = width - input.padding * 2;
  const titleSize = Math.max(28, Math.min(74, width * 0.048));
  const subtitleSize = Math.max(16, Math.min(28, width * 0.019));
  const top = input.padding * 0.62;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  if (input.showBadge && input.badge.trim()) {
    ctx.font = `700 ${Math.max(11, width * 0.01)}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    const badge = input.badge.trim().toUpperCase();
    const badgeWidth = Math.min(maxWidth, ctx.measureText(badge).width + 34);
    const badgeHeight = Math.max(28, width * 0.024);
    ctx.fillStyle = colorWithAlpha(input.accentColor, 0.18);
    roundedRect(ctx, width / 2 - badgeWidth / 2, top, badgeWidth, badgeHeight, badgeHeight / 2);
    ctx.fill();
    ctx.strokeStyle = colorWithAlpha(input.accentColor, 0.5);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = input.foregroundColor;
    ctx.textBaseline = "middle";
    ctx.fillText(badge, width / 2, top + badgeHeight / 2 + 0.5);
  }

  const titleY = top + (input.showBadge && input.badge.trim() ? Math.max(44, width * 0.045) : 0);
  ctx.textBaseline = "top";
  ctx.font = `900 ${titleSize}px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillStyle = input.foregroundColor;
  const titleLines = wrapText(ctx, input.title.trim(), maxWidth * 0.88);
  titleLines.forEach((line, index) => ctx.fillText(line, width / 2, titleY + index * titleSize * 1.06));

  if (input.subtitle.trim()) {
    ctx.font = `500 ${subtitleSize}px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillStyle = input.mutedColor;
    const subtitleLines = wrapText(ctx, input.subtitle.trim(), maxWidth * 0.78).slice(0, 2);
    const subtitleY = titleY + titleLines.length * titleSize * 1.08 + Math.max(12, width * 0.012);
    subtitleLines.forEach((line, index) => ctx.fillText(line, width / 2, subtitleY + index * subtitleSize * 1.35));
  }
}

function drawFooter(ctx: CanvasRenderingContext2D, input: MockupInput, width: number, height: number) {
  if (!input.showFooter || !input.footer.trim()) return;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.max(12, width * 0.011)}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
  ctx.fillStyle = colorWithAlpha(input.foregroundColor, 0.72);
  ctx.fillText(input.footer.trim(), width / 2, height - input.padding * 0.48);
}

function drawSafeArea(ctx: CanvasRenderingContext2D, input: MockupInput, width: number, height: number) {
  if (!input.showSafeArea) return;
  const marginX = width * 0.08;
  const marginY = height * 0.08;
  ctx.save();
  ctx.setLineDash([16, 12]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = colorWithAlpha(input.accentColor, 0.68);
  roundedRect(ctx, marginX, marginY, width - marginX * 2, height - marginY * 2, 24);
  ctx.stroke();
  ctx.restore();
}

export async function renderMockupPng(input: MockupInput, width = input.canvasWidth, height = input.canvasHeight): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");

  const screenshot = input.screenshotDataUrl ? await loadImageFromDataUrl(input.screenshotDataUrl) : undefined;
  const backgroundImage = input.backgroundImageDataUrl ? await loadImageFromDataUrl(input.backgroundImageDataUrl) : undefined;

  drawBackground(ctx, input, width, height, backgroundImage);
  drawTextLayer(ctx, input, width, height);

  const frame = calculateFrame(input, width, height);
  const angle = (input.rotate * Math.PI) / 180;
  ctx.save();
  ctx.translate(frame.x + frame.width / 2, frame.y + frame.height / 2);
  ctx.rotate(angle);
  ctx.translate(-(frame.x + frame.width / 2), -(frame.y + frame.height / 2));

  setShadow(ctx, input.shadow, width);
  const radius = getFrameRadius(input.device, input.frameRadius);
  const frameColor = input.device === "card" ? "rgba(255,255,255,0.95)" : "#0b1220";
  ctx.fillStyle = frameColor;
  roundedRect(ctx, frame.x, frame.y, frame.width, frame.height, radius);
  ctx.fill();
  clearShadow(ctx);

  drawDeviceChrome(ctx, input, frame);
  const screen = getScreenRect(input, frame);
  ctx.save();
  roundedRect(ctx, screen.x, screen.y, screen.width, screen.height, screen.radius);
  ctx.clip();
  if (screenshot) {
    drawCoverImage(ctx, screenshot, screen.x, screen.y, screen.width, screen.height, input.fitMode, "#f8fafc");
  } else {
    const placeholderGradient = ctx.createLinearGradient(screen.x, screen.y, screen.x + screen.width, screen.y + screen.height);
    placeholderGradient.addColorStop(0, "#e2e8f0");
    placeholderGradient.addColorStop(1, "#94a3b8");
    ctx.fillStyle = placeholderGradient;
    ctx.fillRect(screen.x, screen.y, screen.width, screen.height);
    ctx.fillStyle = "rgba(15,23,42,0.62)";
    ctx.font = `800 ${Math.max(18, screen.width * 0.045)}px Inter, ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Upload screenshot", screen.x + screen.width / 2, screen.y + screen.height / 2);
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = Math.max(1, width * 0.0012);
  roundedRect(ctx, frame.x + 1, frame.y + 1, frame.width - 2, frame.height - 2, radius);
  ctx.stroke();

  if (input.showReflection) {
    const reflection = ctx.createLinearGradient(frame.x, frame.y, frame.x + frame.width, frame.y + frame.height);
    reflection.addColorStop(0, "rgba(255,255,255,0.16)");
    reflection.addColorStop(0.32, "rgba(255,255,255,0)");
    reflection.addColorStop(1, "rgba(255,255,255,0.06)");
    ctx.fillStyle = reflection;
    roundedRect(ctx, frame.x, frame.y, frame.width, frame.height, radius);
    ctx.fill();
  }
  ctx.restore();

  drawFooter(ctx, input, width, height);
  drawSafeArea(ctx, input, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not export mockup image."));
    }, "image/png");
  });
}

export async function renderMockupDataUrl(input: MockupInput, width = input.canvasWidth, height = input.canvasHeight): Promise<string> {
  const blob = await renderMockupPng(input, width, height);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read generated image."));
    reader.readAsDataURL(blob);
  });
}
