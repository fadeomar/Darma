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
];
