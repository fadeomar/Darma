export type ImageOutputFormat = "image/png" | "image/jpeg" | "image/webp";

export type ConvertedImage = {
  name: string;
  url: string;
  format: ImageOutputFormat;
  size: number;
};
