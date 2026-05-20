export type ImageOutputFormat = "image/png" | "image/jpeg" | "image/webp";

export type ConvertedImage = {
  name: string;
  size: number;
  width: number;
  height: number;
  url: string;
  blob: Blob;
  mimeType: ImageOutputFormat;
};
