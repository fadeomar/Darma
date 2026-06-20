export type ImageOutputFormat = "image/png" | "image/jpeg" | "image/webp";
export type ImageExportFormat = ImageOutputFormat | "original";
export type ImageFitMode = "contain" | "cover" | "stretch";

export type ConvertedImage = {
  id?: string;
  name: string;
  size: number;
  width: number;
  height: number;
  url: string;
  blob: Blob;
  mimeType: ImageOutputFormat;
};

export type ImageWorkbenchPreset = {
  id: string;
  title: string;
  description: string;
  width?: number;
  height?: number;
  scalePercent?: number;
  fitMode?: ImageFitMode;
  format?: ImageExportFormat;
  quality?: number;
};
