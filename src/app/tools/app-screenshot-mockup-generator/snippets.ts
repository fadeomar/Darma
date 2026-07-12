import type { GeneratedMockupAsset, MockupInput } from "./types";

export function createHtmlFigureSnippet(input: MockupInput, asset?: GeneratedMockupAsset) {
  const src = asset?.filename ?? `${input.filePrefix || "app-mockup"}-hero-wide.png`;
  const alt = input.title.trim() || "Application screenshot mockup";
  return `<figure class="product-mockup">
  <img src="/images/${src}" alt="${escapeHtml(alt)}" width="${asset?.width ?? input.canvasWidth}" height="${asset?.height ?? input.canvasHeight}" loading="lazy" />
  <figcaption>${escapeHtml(input.subtitle || "Product screenshot")}</figcaption>
</figure>`;
}

export function createNextImageSnippet(input: MockupInput, asset?: GeneratedMockupAsset) {
  const src = asset?.filename ?? `${input.filePrefix || "app-mockup"}-hero-wide.png`;
  const alt = input.title.trim() || "Application screenshot mockup";
  return `import Image from "next/image";

export function ProductMockup() {
  return (
    <figure className="overflow-hidden rounded-3xl shadow-2xl">
      <Image
        src="/images/${src}"
        alt="${escapeAttribute(alt)}"
        width={${asset?.width ?? input.canvasWidth}}
        height={${asset?.height ?? input.canvasHeight}}
        priority
      />
    </figure>
  );
}`;
}

export function createResponsivePictureSnippet(input: MockupInput, assets: GeneratedMockupAsset[]) {
  const alt = input.title.trim() || "Application screenshot mockup";
  const fallback = assets[0] ?? { filename: `${input.filePrefix || "app-mockup"}-hero-wide.png`, width: input.canvasWidth, height: input.canvasHeight };
  const sorted = assets.length ? [...assets].sort((a, b) => b.width - a.width) : [];
  const sourceLines = sorted.slice(0, 4).map((asset) => `  <source media="(min-width: ${Math.max(420, Math.round(asset.width * 0.45))}px)" srcset="/images/${asset.filename}" width="${asset.width}" height="${asset.height}" />`).join("\n");
  return `<picture class="product-mockup-picture">
${sourceLines || `  <source srcset="/images/${fallback.filename}" />`}
  <img
    src="/images/${fallback.filename}"
    alt="${escapeHtml(alt)}"
    width="${fallback.width}"
    height="${fallback.height}"
    loading="lazy"
    decoding="async"
  />
</picture>`;
}

export function createCssSnippet() {
  return `.product-mockup,
.product-mockup-picture {
  display: block;
  margin: 0;
  overflow: hidden;
  border-radius: var(--mockup-radius, 28px);
  box-shadow: var(--mockup-shadow, 0 30px 80px rgba(15, 23, 42, 0.25));
}

.product-mockup img,
.product-mockup-picture img {
  display: block;
  width: 100%;
  height: auto;
}`;
}

export function createCssVariablesSnippet(input: MockupInput) {
  const background = input.backgroundMode === "solid" ? input.backgroundColor : input.backgroundMode === "gradient" || input.backgroundMode === "mesh" ? `linear-gradient(${input.gradientAngle}deg, ${input.gradientFrom}, ${input.gradientTo})` : "transparent";
  return `:root {
  --mockup-radius: ${input.frameRadius}px;
  --mockup-padding: ${input.padding}px;
  --mockup-foreground: ${input.foregroundColor};
  --mockup-muted: ${input.mutedColor};
  --mockup-accent: ${input.accentColor};
  --mockup-background: ${background};
  --mockup-canvas-width: ${input.canvasWidth}px;
  --mockup-canvas-height: ${input.canvasHeight}px;
}`;
}

export function createDesignTokenSnippet(input: MockupInput, assets: GeneratedMockupAsset[]) {
  return JSON.stringify({
    name: input.filePrefix || "app-mockup",
    title: input.title,
    device: {
      frame: input.device,
      orientation: input.orientation,
      chrome: input.showDeviceChrome,
      fit: input.fitMode,
      alignment: input.alignment,
      radius: input.frameRadius,
      scale: `${input.deviceScale}%`,
      rotation: `${input.rotate}deg`,
    },
    canvas: {
      width: input.canvasWidth,
      height: input.canvasHeight,
      padding: input.padding,
    },
    background: {
      mode: input.backgroundMode,
      color: input.backgroundColor,
      gradient: {
        from: input.gradientFrom,
        to: input.gradientTo,
        angle: `${input.gradientAngle}deg`,
      },
    },
    colors: {
      foreground: input.foregroundColor,
      muted: input.mutedColor,
      accent: input.accentColor,
    },
    exports: assets.map((asset) => ({
      filename: asset.filename,
      width: asset.width,
      height: asset.height,
      type: asset.mimeType,
      bytes: asset.blob.size,
    })),
  }, null, 2);
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function escapeAttribute(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}
