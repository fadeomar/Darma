export type ResponsiveImageMode = "img" | "picture" | "next-image";
export type ImageFormat = "jpg" | "jpeg" | "png" | "webp" | "avif" | "custom";

export type ImageCandidate = {
  id: string;
  url: string;
  width: number;
  format: ImageFormat;
};

export type SizesRule = {
  id: string;
  mediaCondition: string;
  slotSize: string;
};

export type PictureSource = {
  id: string;
  type: "image/avif" | "image/webp" | "image/jpeg" | "image/png" | "custom";
  media: string;
  urlPattern: string;
  candidates: ImageCandidate[];
  sizes: SizesRule[];
};

export type ResponsiveImageAttributes = {
  src: string;
  alt: string;
  width: number;
  height: number;
  loading: "lazy" | "eager";
  decoding: "async" | "auto" | "sync";
  fetchPriority: "auto" | "high" | "low";
  objectFit: "cover" | "contain" | "fill" | "none" | "scale-down";
  className: string;
};

export type ResponsiveImageExportOptions = {
  includeComments: boolean;
  includeCssHelper: boolean;
  quoteStyle: "double" | "single";
  componentName: string;
};

export type ResponsiveImageState = {
  mode: ResponsiveImageMode;
  presetId: string;
  urlPattern: string;
  fallbackSrc: string;
  candidates: ImageCandidate[];
  sizes: SizesRule[];
  defaultSlotSize: string;
  pictureSources: PictureSource[];
  attributes: ResponsiveImageAttributes;
  previewViewportWidth: number;
  previewDpr: 1 | 1.5 | 2 | 3;
  showSlotRuler: boolean;
  showCandidateAnalyzer: boolean;
  exportOptions: ResponsiveImageExportOptions;
};

export type ResponsiveImageValidationMessage = {
  type: "info" | "warning" | "error";
  message: string;
  field?: string;
};
