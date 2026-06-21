export type OgTemplateId =
  | "minimal-saas"
  | "developer-tool"
  | "blog-article"
  | "product-launch"
  | "terminal"
  | "documentation"
  | "portfolio"
  | "announcement";

export type OgBackgroundMode = "solid" | "gradient" | "image" | "pattern";
export type OgTextAlign = "left" | "center" | "right";
export type OgLogoPosition = "none" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type OgExportPackId = "basic" | "nextjs" | "social" | "article" | "complete";

export type OgImageInput = {
  templateId: OgTemplateId;
  title: string;
  subtitle: string;
  badge: string;
  domain: string;
  author: string;
  callToAction: string;
  backgroundMode: OgBackgroundMode;
  backgroundColor: string;
  foregroundColor: string;
  mutedColor: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  patternIntensity: number;
  imageOverlay: number;
  backgroundImageDataUrl: string;
  logoDataUrl: string;
  logoPosition: OgLogoPosition;
  textAlign: OgTextAlign;
  titleSize: number;
  subtitleSize: number;
  badgeSize: number;
  frameRadius: number;
  safeArea: boolean;
  siteUrl: string;
  altText: string;
  twitterCard: "summary_large_image" | "summary";
  exportPack: OgExportPackId;
};

export type OgGeneratedAsset = {
  filename: string;
  mimeType: string;
  blob: Blob;
  kind: "image" | "snippet" | "readme" | "html" | "json";
  size: number;
  width?: number;
  height?: number;
  text?: string;
  previewUrl?: string;
};

export type OgWarning = {
  id: string;
  level: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
};

export type OgReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  points: number;
  maxPoints: number;
  detail: string;
};

export type OgExportSize = {
  filename: string;
  width: number;
  height: number;
  label: string;
};

export type OgQuickPreset = {
  id: string;
  title: string;
  description: string;
  patch: Partial<OgImageInput>;
};
