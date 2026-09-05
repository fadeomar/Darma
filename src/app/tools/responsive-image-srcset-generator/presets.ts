import { createDefaultResponsiveImageState, createImageCandidate, createPictureSource, createSizesRule, generateCandidatesFromPattern } from "./responsiveImage";
import type { ResponsiveImageState } from "./types";

export type ResponsiveImagePreset = {
  id: string;
  name: string;
  description: string;
  state: ResponsiveImageState;
};

type PresetPatch = Omit<Partial<ResponsiveImageState>, "attributes" | "exportOptions"> & {
  attributes?: Partial<ResponsiveImageState["attributes"]>;
  exportOptions?: Partial<ResponsiveImageState["exportOptions"]>;
};

function withBase(patch: PresetPatch): ResponsiveImageState {
  const base = createDefaultResponsiveImageState();
  return { ...base, ...patch, attributes: { ...base.attributes, ...(patch.attributes ?? {}) }, exportOptions: { ...base.exportOptions, ...(patch.exportOptions ?? {}) } };
}

export const RESPONSIVE_IMAGE_PRESETS: ResponsiveImagePreset[] = [
  {
    id: "card-grid",
    name: "Card grid image",
    description: "Responsive card image for 1, 2, and 3-column layouts.",
    state: createDefaultResponsiveImageState(),
  },
  {
    id: "hero",
    name: "Hero image",
    description: "Large above-the-fold image with wide candidates.",
    state: withBase({
      presetId: "hero",
      urlPattern: "/images/hero-{width}.jpg",
      fallbackSrc: "/images/hero-1600.jpg",
      candidates: generateCandidatesFromPattern("/images/hero-{width}.jpg", [640, 960, 1280, 1600, 1920, 2560], "jpg"),
      sizes: [createSizesRule({ mediaCondition: "(max-width: 768px)", slotSize: "100vw" })],
      defaultSlotSize: "100vw",
      previewViewportWidth: 1280,
      previewDpr: 1.5,
      attributes: { src: "/images/hero-1600.jpg", alt: "Large hero image", width: 1920, height: 1080, loading: "eager", fetchPriority: "high", className: "hero-image" },
    }),
  },
  {
    id: "blog",
    name: "Blog article image",
    description: "Article image with readable content width.",
    state: withBase({
      presetId: "blog",
      urlPattern: "/images/article-{width}.jpg",
      fallbackSrc: "/images/article-960.jpg",
      candidates: generateCandidatesFromPattern("/images/article-{width}.jpg", [480, 768, 960, 1280, 1536], "jpg"),
      sizes: [createSizesRule({ mediaCondition: "(max-width: 760px)", slotSize: "100vw" })],
      defaultSlotSize: "760px",
      previewViewportWidth: 1100,
      attributes: { src: "/images/article-960.jpg", alt: "Blog article cover image", width: 1536, height: 864, className: "article-image" },
    }),
  },
  {
    id: "product",
    name: "Product image",
    description: "Product image with AVIF and WebP picture fallback.",
    state: withBase({
      mode: "picture",
      presetId: "product",
      urlPattern: "/images/product-{width}.jpg",
      fallbackSrc: "/images/product-800.jpg",
      candidates: generateCandidatesFromPattern("/images/product-{width}.jpg", [400, 800, 1200], "jpg"),
      sizes: [createSizesRule({ mediaCondition: "(max-width: 768px)", slotSize: "90vw" })],
      defaultSlotSize: "420px",
      pictureSources: [
        createPictureSource({ type: "image/avif", urlPattern: "/images/product-{width}.avif", candidates: generateCandidatesFromPattern("/images/product-{width}.avif", [400, 800, 1200], "avif") }),
        createPictureSource({ type: "image/webp", urlPattern: "/images/product-{width}.webp", candidates: generateCandidatesFromPattern("/images/product-{width}.webp", [400, 800, 1200], "webp") }),
      ],
      attributes: { src: "/images/product-800.jpg", alt: "Product photo", width: 1200, height: 1200, className: "product-image" },
    }),
  },
  {
    id: "avatar",
    name: "Avatar image",
    description: "Small fixed-size image with compact candidates.",
    state: withBase({
      presetId: "avatar",
      urlPattern: "/images/avatar-{width}.jpg",
      fallbackSrc: "/images/avatar-160.jpg",
      candidates: generateCandidatesFromPattern("/images/avatar-{width}.jpg", [80, 160, 320], "jpg"),
      sizes: [],
      defaultSlotSize: "80px",
      previewViewportWidth: 640,
      attributes: { src: "/images/avatar-160.jpg", alt: "Profile avatar", width: 320, height: 320, className: "avatar-image" },
    }),
  },
  {
    id: "art-directed",
    name: "Art-directed picture",
    description: "Use different crops for mobile and desktop.",
    state: withBase({
      mode: "picture",
      presetId: "art-directed",
      urlPattern: "/images/story-desktop-{width}.jpg",
      fallbackSrc: "/images/story-desktop-1200.jpg",
      candidates: generateCandidatesFromPattern("/images/story-desktop-{width}.jpg", [800, 1200, 1600], "jpg"),
      sizes: [createSizesRule({ mediaCondition: "(max-width: 680px)", slotSize: "100vw" })],
      defaultSlotSize: "70vw",
      pictureSources: [
        createPictureSource({ type: "image/webp", media: "(max-width: 680px)", urlPattern: "/images/story-mobile-{width}.webp", candidates: generateCandidatesFromPattern("/images/story-mobile-{width}.webp", [360, 720, 960], "webp") }),
        createPictureSource({ type: "image/webp", media: "(min-width: 681px)", urlPattern: "/images/story-desktop-{width}.webp", candidates: generateCandidatesFromPattern("/images/story-desktop-{width}.webp", [800, 1200, 1600], "webp") }),
      ],
      attributes: { src: "/images/story-desktop-1200.jpg", alt: "Editorial story image", width: 1600, height: 900, className: "story-image" },
    }),
  },
  {
    id: "next-fill",
    name: "Next.js fill image",
    description: "Responsive Next.js Image using sizes for a fill-style layout.",
    state: withBase({
      mode: "next-image",
      presetId: "next-fill",
      urlPattern: "/images/gallery-{width}.jpg",
      fallbackSrc: "/images/gallery-1200.jpg",
      candidates: generateCandidatesFromPattern("/images/gallery-{width}.jpg", [640, 960, 1280, 1600], "jpg"),
      sizes: [createSizesRule({ mediaCondition: "(max-width: 768px)", slotSize: "100vw" }), createSizesRule({ mediaCondition: "(max-width: 1200px)", slotSize: "50vw" })],
      defaultSlotSize: "33vw",
      attributes: { src: "/images/gallery.jpg", alt: "Gallery image", width: 1600, height: 1067, className: "h-auto w-full rounded-2xl object-cover" },
      exportOptions: { componentName: "ResponsiveGalleryImage" },
    }),
  },
  {
    id: "ecommerce-grid",
    name: "E-commerce grid",
    description: "Product thumbnails for dense two-to-four-column catalog layouts.",
    state: withBase({ presetId: "ecommerce-grid", urlPattern: "/images/catalog-{width}.jpg", fallbackSrc: "/images/catalog-640.jpg", candidates: generateCandidatesFromPattern("/images/catalog-{width}.jpg", [320, 480, 640, 800, 960], "jpg"), sizes: [createSizesRule({ mediaCondition: "(max-width: 640px)", slotSize: "50vw" }), createSizesRule({ mediaCondition: "(max-width: 1024px)", slotSize: "33vw" })], defaultSlotSize: "25vw", previewViewportWidth: 1200, attributes: { src: "/images/catalog-640.jpg", alt: "Product catalog image", width: 960, height: 1200, loading: "lazy", className: "catalog-image" } }),
  },
  {
    id: "featured-product",
    name: "Featured product",
    description: "Large product detail image with modern-format fallbacks and high-DPR coverage.",
    state: withBase({ mode: "picture", presetId: "featured-product", urlPattern: "/images/product-detail-{width}.jpg", fallbackSrc: "/images/product-detail-1200.jpg", candidates: generateCandidatesFromPattern("/images/product-detail-{width}.jpg", [640, 960, 1200, 1600, 2000], "jpg"), defaultSlotSize: "50vw", pictureSources: [createPictureSource({ type: "image/avif", urlPattern: "/images/product-detail-{width}.avif", candidates: generateCandidatesFromPattern("/images/product-detail-{width}.avif", [640, 960, 1200, 1600, 2000], "avif") }), createPictureSource({ type: "image/webp", urlPattern: "/images/product-detail-{width}.webp", candidates: generateCandidatesFromPattern("/images/product-detail-{width}.webp", [640, 960, 1200, 1600, 2000], "webp") })], attributes: { src: "/images/product-detail-1200.jpg", alt: "Featured product photo", width: 2000, height: 2000, className: "product-detail-image" } }),
  },
  {
    id: "news-card",
    name: "News card",
    description: "Editorial thumbnail that shifts between stacked mobile and horizontal desktop cards.",
    state: withBase({ presetId: "news-card", urlPattern: "/images/news-{width}.jpg", fallbackSrc: "/images/news-768.jpg", candidates: generateCandidatesFromPattern("/images/news-{width}.jpg", [360, 540, 768, 1024, 1280], "jpg"), sizes: [createSizesRule({ mediaCondition: "(max-width: 640px)", slotSize: "100vw" })], defaultSlotSize: "40vw", attributes: { src: "/images/news-768.jpg", alt: "News story image", width: 1280, height: 720, loading: "lazy", className: "news-card-image" } }),
  },
  {
    id: "testimonial-avatar",
    name: "Testimonial avatar",
    description: "Small circular portrait with sensible 1x, 2x, and 3x candidates.",
    state: withBase({ presetId: "testimonial-avatar", urlPattern: "/images/customer-{width}.jpg", fallbackSrc: "/images/customer-144.jpg", candidates: generateCandidatesFromPattern("/images/customer-{width}.jpg", [72, 144, 216], "jpg"), sizes: [], defaultSlotSize: "72px", previewViewportWidth: 640, attributes: { src: "/images/customer-144.jpg", alt: "Customer portrait", width: 216, height: 216, loading: "lazy", className: "testimonial-avatar" } }),
  },
  {
    id: "full-bleed-banner",
    name: "Full-bleed banner",
    description: "Wide campaign or landing banner spanning the full viewport.",
    state: withBase({ presetId: "full-bleed-banner", urlPattern: "/images/banner-{width}.jpg", fallbackSrc: "/images/banner-1600.jpg", candidates: generateCandidatesFromPattern("/images/banner-{width}.jpg", [768, 1024, 1440, 1600, 1920, 2560], "jpg"), defaultSlotSize: "100vw", previewViewportWidth: 1440, previewDpr: 2, attributes: { src: "/images/banner-1600.jpg", alt: "Campaign banner", width: 2560, height: 1000, loading: "eager", fetchPriority: "high", className: "full-bleed-banner" } }),
  },
  {
    id: "gallery-masonry",
    name: "Masonry gallery",
    description: "Variable-width gallery image for portfolio and editorial masonry layouts.",
    state: withBase({ presetId: "gallery-masonry", urlPattern: "/images/gallery-item-{width}.jpg", fallbackSrc: "/images/gallery-item-960.jpg", candidates: generateCandidatesFromPattern("/images/gallery-item-{width}.jpg", [360, 540, 720, 960, 1280, 1600], "jpg"), sizes: [createSizesRule({ mediaCondition: "(max-width: 640px)", slotSize: "100vw" }), createSizesRule({ mediaCondition: "(max-width: 1100px)", slotSize: "50vw" })], defaultSlotSize: "33vw", attributes: { src: "/images/gallery-item-960.jpg", alt: "Portfolio gallery image", width: 1600, height: 1200, loading: "lazy", className: "gallery-item" } }),
  },
  {
    id: "logo-strip",
    name: "Logo strip",
    description: "Small brand marks that stay sharp without downloading oversized assets.",
    state: withBase({ presetId: "logo-strip", urlPattern: "/images/logo-{width}.png", fallbackSrc: "/images/logo-240.png", candidates: generateCandidatesFromPattern("/images/logo-{width}.png", [120, 180, 240, 360, 480], "png"), sizes: [], defaultSlotSize: "120px", previewViewportWidth: 900, attributes: { src: "/images/logo-240.png", alt: "Partner logo", width: 480, height: 240, loading: "lazy", className: "partner-logo" } }),
  },
  {
    id: "documentation-shot",
    name: "Documentation screenshot",
    description: "UI screenshot sized for docs content columns and retina displays.",
    state: withBase({ presetId: "documentation-shot", urlPattern: "/images/docs-{width}.png", fallbackSrc: "/images/docs-1200.png", candidates: generateCandidatesFromPattern("/images/docs-{width}.png", [640, 960, 1200, 1600, 2000], "png"), sizes: [createSizesRule({ mediaCondition: "(max-width: 760px)", slotSize: "100vw" })], defaultSlotSize: "760px", attributes: { src: "/images/docs-1200.png", alt: "Product interface screenshot", width: 2000, height: 1250, loading: "lazy", className: "docs-screenshot" } }),
  },
  {
    id: "mobile-art-direction",
    name: "Mobile-first art direction",
    description: "Portrait crop on phones and landscape crop on larger screens.",
    state: withBase({ mode: "picture", presetId: "mobile-art-direction", urlPattern: "/images/campaign-wide-{width}.jpg", fallbackSrc: "/images/campaign-wide-1200.jpg", candidates: generateCandidatesFromPattern("/images/campaign-wide-{width}.jpg", [800, 1200, 1600], "jpg"), defaultSlotSize: "100vw", pictureSources: [createPictureSource({ type: "image/webp", media: "(max-width: 680px)", urlPattern: "/images/campaign-portrait-{width}.webp", candidates: generateCandidatesFromPattern("/images/campaign-portrait-{width}.webp", [360, 540, 720, 960], "webp") }), createPictureSource({ type: "image/webp", media: "(min-width: 681px)", urlPattern: "/images/campaign-wide-{width}.webp", candidates: generateCandidatesFromPattern("/images/campaign-wide-{width}.webp", [800, 1200, 1600], "webp") })], attributes: { src: "/images/campaign-wide-1200.jpg", alt: "Responsive campaign artwork", width: 1600, height: 900, className: "campaign-art" } }),
  },
  {
    id: "next-card-grid",
    name: "Next.js card grid",
    description: "Next Image starter with sizes tuned for responsive card columns.",
    state: withBase({ mode: "next-image", presetId: "next-card-grid", urlPattern: "/images/card-{width}.jpg", fallbackSrc: "/images/card-960.jpg", candidates: generateCandidatesFromPattern("/images/card-{width}.jpg", [480, 768, 960, 1280, 1600], "jpg"), sizes: [createSizesRule({ mediaCondition: "(max-width: 640px)", slotSize: "100vw" }), createSizesRule({ mediaCondition: "(max-width: 1024px)", slotSize: "50vw" })], defaultSlotSize: "33vw", attributes: { src: "/images/card.jpg", alt: "Card image", width: 1600, height: 1000, loading: "lazy", className: "h-auto w-full rounded-xl object-cover" }, exportOptions: { componentName: "ResponsiveCardImage" } }),
  },
];
