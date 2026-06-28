export type OutputFormat = "original" | "image/jpeg" | "image/png" | "image/webp";
export type OutputMimeType = "image/jpeg" | "image/png" | "image/webp";
export type CompressionPreset = "best" | "balanced" | "small" | "tiny";

export type ImageInputState = {
  file: File;
  objectUrl: string;
  name: string;
  size: number;
  width: number;
  height: number;
  type: string;
};

export type ImageOutputState = {
  blob: Blob;
  objectUrl: string;
  size: number;
  width: number;
  height: number;
  type: OutputMimeType;
  savedPercent: number;
};

export type BatchImageStatus = "ready" | "processing" | "done" | "failed";

export type BatchImageItem = {
  id: string;
  file: File;
  objectUrl: string;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  status: BatchImageStatus;
  error?: string;
  output?: ImageOutputState;
};

export type BatchSummary = {
  totalCount: number;
  successCount: number;
  failedCount: number;
  totalOriginalSize: number;
  totalOutputSize: number;
  totalSavedBytes: number;
  averageSavedPercent: number;
};
