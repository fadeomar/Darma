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

export function createCssSnippet() {
  return `.product-mockup {
  margin: 0;
  overflow: hidden;
  border-radius: 28px;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.25);
}

.product-mockup img {
  display: block;
  width: 100%;
  height: auto;
}`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function escapeAttribute(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}
