export type FaviconSourceMode = "image" | "svg" | "text" | "emoji";

export type IconShape = "square" | "rounded" | "circle" | "squircle";

export type CropMode = "contain" | "cover";

export type ExportPackId = "modern" | "nextjs" | "pwa" | "legacy" | "complete";

export type ManifestDisplayMode = "browser" | "minimal-ui" | "standalone" | "fullscreen";

export type ManifestOrientation = "any" | "natural" | "portrait" | "landscape";

export type IconPurpose = "any" | "maskable" | "monochrome";

export type SourceImageMeta = {
  width: number;
  height: number;
  type: string;
  name?: string;
};

export type FaviconInput = {
  sourceMode: FaviconSourceMode;
  imageDataUrl: string;
  imageMeta: SourceImageMeta | null;
  svgText: string;
  text: string;
  emoji: string;
  backgroundColor: string;
  foregroundColor: string;
  transparentBackground: boolean;
  padding: number;
  scale: number;
  borderRadius: number;
  shape: IconShape;
  cropMode: CropMode;
  fontFamily: string;
  fontWeight: number;
  pathPrefix: string;
  siteName: string;
  shortName: string;
  themeColor: string;
  manifestBackgroundColor: string;
  display: ManifestDisplayMode;
  orientation: ManifestOrientation;
  exportPack: ExportPackId;
  includeMaskable: boolean;
  includeMonochrome: boolean;
};

export type GeneratedAssetKind = "image" | "manifest" | "snippet" | "readme" | "config";

export type GeneratedAsset = {
  filename: string;
  mimeType: string;
  blob: Blob;
  kind: GeneratedAssetKind;
  size?: number;
  width?: number;
  height?: number;
  previewUrl?: string;
  text?: string;
};

export type FaviconWarningLevel = "info" | "warning" | "error" | "success";

export type FaviconWarning = {
  id: string;
  level: FaviconWarningLevel;
  title: string;
  message: string;
};

export type ReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  points: number;
  maxPoints: number;
  detail: string;
};

export type FileValidationIssue = {
  id: string;
  level: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
};

export type ParsedManifestIcon = {
  src: string;
  sizes?: string;
  type?: string;
  purpose?: string;
};

export type ParsedManifest = {
  name?: string;
  short_name?: string;
  icons?: ParsedManifestIcon[];
  theme_color?: string;
  background_color?: string;
  display?: string;
  orientation?: string;
};
